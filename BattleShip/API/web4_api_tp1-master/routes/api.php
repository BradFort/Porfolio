<?php
//> $user = App\Models\User::first();
//= App\Models\User {#5966
//    id: 1,
//    name: "Mrs. Myra Denesik",
//    email: "fannie62@example.net",
//    email_verified_at: "2025-04-09 16:40:13",
//    #password: "$2y$12$GSzT9fjd/hwnDFd5GRtFeeaiOKRHMFAj9t8h12oS0uyz5lJkJUvJu",
//    #remember_token: "TzEaki8fuD",
// Token en texte :1|W5cQZkl4hGkUo1XG1VpKD5HkgnsfAlF5tQVtgkLh07cd46e8

use App\Http\Middleware\AuthenticateOnceWithBasicAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BattleshipIaController;

/**
 * API Routes
 *
 * les différentes routes de l'API
 */
Route::prefix('battleship-ia')
    ->middleware(['auth:sanctum']) // obligatoire vu le test
    ->controller(BattleshipIaController::class)
    ->group(function () {
        Route::post('/parties', 'startGame');
        Route::post('/parties/{id}/missiles', 'aiPlayMissiles');
        Route::put('/parties/{id}/missiles/{coordonnee}', 'updateMissileResult');
        Route::delete('/parties/{id}', 'deleteGame');
    });
