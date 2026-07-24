import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = 'http://127.0.0.1:8123';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

// Log in
await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
await page.fill('#data\\.email', 'test@example.com');
await page.fill('#data\\.password', 'password');
await Promise.all([
  page.waitForURL(`${BASE}/admin`, { timeout: 15000 }).catch(() => {}),
  page.click('button[type="submit"]'),
]);
await page.waitForLoadState('networkidle');

async function audit(label, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const ids = results.violations.map((v) => v.id).sort();
  console.log(`\n=== ${label} (${url}) ===`);
  console.log('Violations:', ids.join(', ') || '(none)');
  return ids;
}

const listIds = await audit('ListUsers', `${BASE}/admin/users`);
const viewId = (await page.goto(`${BASE}/admin/users`)) && 1;
// Find the first record's view URL
await page.goto(`${BASE}/admin/users`, { waitUntil: 'networkidle' });
const viewIds = await audit('ViewUser', `${BASE}/admin/users/1`);

const all = new Set([...listIds, ...viewIds]);
const wanted = ['definition-list', 'dlitem', 'aria-allowed-attr', 'button-name', 'aria-valid-attr-value'];
console.log('\n=== SUMMARY ===');
for (const w of wanted) {
  console.log(`${all.has(w) ? 'CONFIRMED' : 'MISSING  '}  ${w}`);
}

await browser.close();
