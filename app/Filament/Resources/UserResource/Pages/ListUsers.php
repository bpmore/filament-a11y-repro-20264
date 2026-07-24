<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use Filament\Actions;
use Filament\Resources\Components\Tab;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Database\Eloquent\Builder;

class ListUsers extends ListRecords
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }

    // Two tabs render the Filament Tabs UI, which produces the
    // aria-valid-attr-value violation (invalid ARIA attribute value on
    // the active tab, e.g. .fi-tabs-item-active).
    public function getTabs(): array
    {
        return [
            'all' => Tab::make('All'),
            'verified' => Tab::make('Verified')
                ->modifyQueryUsing(fn (Builder $query) => $query->whereNotNull('email_verified_at')),
        ];
    }
}
