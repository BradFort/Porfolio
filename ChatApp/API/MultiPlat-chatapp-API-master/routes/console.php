<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your console based routes.
| These routes are loaded by the ConsoleServiceProvider.
|
*/

// Nettoyage automatique des fichiers supprimés tous les jours à 2h du matin
Schedule::command('attachments:cleanup --days=30')
    ->daily()
    ->at('02:00')
    ->description('Nettoie les fichiers des messages supprimés il y a plus de 30 jours');
