# Filament v3 accessibility reproduction — filamentphp/filament#20264

Minimal Laravel + Filament **v3.3.54** app (built from Filament's official
[issue-reproduction-template](https://github.com/filamentphp/issue-reproduction-template)
`3.x` branch) that renders markup axe-core flags with WCAG 2.2 AA violations, on
Filament's own components. No custom Blade — every violation comes straight from
stock Filament output.

## The bug — 5 axe rule ids, each from a stock Filament component

| axe rule id | WCAG | Filament component that emits it |
|---|---|---|
| `definition-list` | 1.3.1 A | Infolist `Section` renders `<dl>` whose direct children are grid `<div>`s, not `<dt>`/`<dd>` |
| `dlitem` | 1.3.1 A | Same infolist — `<dt>`/`<dd>` are wrapped in grid `<div>`s, so they are not direct children of the `<dl>` |
| `aria-allowed-attr` | 4.1.2 A | Collapsible infolist `Section` puts `aria-expanded` on the content container (a non-interactive element that doesn't allow it) |
| `button-name` | 4.1.2 A | The collapse chevron is an icon-only `<button>` with no accessible name |
| `aria-valid-attr-value` | 4.1.2 A | Filament **Tabs** UI (`ListRecords::getTabs()`) emits an invalid ARIA attribute value on the active tab (`.fi-tabs-item-active`) |

All five are confirmed by `@axe-core/playwright` — see verification below.

## Where the repro code lives

- `app/Filament/Resources/UserResource.php` — `infolist()` adds a
  `Section::make('Details')->collapsible()` with two `TextEntry`s
  (→ `definition-list`, `dlitem`, `aria-allowed-attr`, `button-name`).
- `app/Filament/Resources/UserResource/Pages/ListUsers.php` — `getTabs()`
  returns two tabs (→ `aria-valid-attr-value`).

Everything else is the untouched template.

## Setup

```bash
composer setup      # install, .env, key, migrate --seed, npm build
php artisan serve
```

> Note: the template's `app/Filament/Pages/Auth/Login.php` shipped with a v4
> namespace (`Filament\Auth\Pages\Login`); it was corrected to the v3
> `Filament\Pages\Auth\Login` so the v3 app boots.

## Audit these pages

Panel path: **`/admin`** — log in with **`test@example.com`** / **`password`**.

- List / Tabs violation: <http://127.0.0.1:8000/admin/users>
- Infolist violations: <http://127.0.0.1:8000/admin/users/1>

## Reproduce the axe results

```bash
npm install
npx playwright install chromium
php artisan serve --port=8123 &
node axe-check.mjs
```

Observed output (serving on port 8123):

```
=== ListUsers (/admin/users) ===
Violations: aria-valid-attr-value, color-contrast

=== ViewUser (/admin/users/1) ===
Violations: aria-allowed-attr, button-name, color-contrast, definition-list, dlitem

=== SUMMARY ===
CONFIRMED  definition-list
CONFIRMED  dlitem
CONFIRMED  aria-allowed-attr
CONFIRMED  button-name
CONFIRMED  aria-valid-attr-value
```

(`color-contrast` also appears but is incidental to the default theme and not
part of this report.)
