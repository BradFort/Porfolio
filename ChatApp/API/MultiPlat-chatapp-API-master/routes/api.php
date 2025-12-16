<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChannelController;
use App\Http\Controllers\DMChannelController;
use App\Http\Controllers\E2EEController;
use App\Http\Controllers\EncryptedMessageController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MFAController;
use App\Http\Controllers\NotificationTypeController;
use App\Http\Controllers\TicketCommentController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\UserChannelController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'ChatApp API',
        'timestamp' => now()->toIso8601String()
    ]);
});

// Routes d'authentification (SANS middleware - accessibles publiquement)
Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:3,1');

Route::post('/login', [AuthController::class, 'login']);

// Routes MFA publiques (pour la vérification après login)
Route::post('/mfa/verify', [MFAController::class, 'verify']);
Route::post('/mfa/resend', [MFAController::class, 'resend']);

// Routes protégées par l'authentification
Route::middleware('auth:api')->group(function () {

    // Routes d'authentification pour utilisateur connecté
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);

    // Routes MFA pour utilisateurs connectés /
    Route::prefix('mfa')->controller(MFAController::class)->group(function () {
        Route::post('/toggle', 'toggle');
    });

    // Routes utilisateurs
    Route::prefix("user")
        ->controller(UserController::class)
        ->group(function () {
            Route::post("/{user}/notifs/toggle", "toggleNotification");
            Route::get('/{user}/notifs', 'listNotificationTypes');
            Route::put('/{user}/lang/{lang}', 'updateLang');
            Route::post("/", "store");
            Route::get("/{user}", "show");
            Route::put("/{user}", "update");

            // Obtenir les channels d'un utilisateur spécifique
            Route::get("/{user}/channels", [ChannelController::class, 'getUserChannels']);
            Route::get("/{user}/stats", [UserController::class, 'stats']);
        });

    // Routes channels
    Route::prefix("channel")
        ->controller(ChannelController::class)
        ->group(function () {
            // Routes principales CRUD
            Route::get("/", "index");                    // Lister tous les channels
            Route::post("/", "store")
                ->middleware('throttle:channels');       // Créer un channel
            Route::get("/public", "getPublicChannels");  // Lister seulement les channels publics

            Route::prefix("{channel}")
                ->group(function () {
                    Route::get("/", "show");             // Afficher un channel
                    Route::put("/", "update");           // Modifier un channel
                    Route::delete("/", "destroy");       // Supprimer un channel

                    // Actions sur le channel
                    Route::post("/join", "joinChannel");     // Rejoindre un channel
                    Route::post("/leave", "leaveChannel");   // Quitter un channel
                    Route::post("/invite", "inviteUser");    // Inviter un utilisateur

                    // E2EE - Activer/désactiver le chiffrement de bout en bout
                    Route::put("/e2ee", "toggleE2EE");      // Activer/désactiver E2EE

                    // Messages du channel
                    Route::prefix("message")
                        ->controller(MessageController::class)
                        ->group(function () {
                            Route::get("/", "index");           // Lister les messages
                            Route::post("/", "store")
                                ->middleware('throttle:messages'); // Créer un message
                            Route::get("/{message}", "show");   // Afficher un message
                        });

                    // Gestion des membres du channel
                    Route::prefix("user")
                        ->controller(UserChannelController::class)
                        ->group(function () {
                            Route::get("/", "index");               // Lister les membres
                            Route::put("/{userChannel}", "update"); // Modifier le rôle d'un membre
                        });
                });
        });

    // Routes pour obtenir les channels de l'utilisateur connecté
    Route::get("/my-channels", [UserChannelController::class, 'myChannels']);

    // Routes d'invitations
    Route::prefix('invitations')->controller(InvitationController::class)->group(function () {
        Route::get('/', 'index');                      // Lister mes invitations
        Route::get('/count', 'count');                 // Nombre d'invitations en attente
        Route::get('/{invitation}', 'show');           // Voir une invitation
        Route::post('/{invitation}/accept', 'accept'); // Accepter une invitation
        Route::post('/{invitation}/reject', 'reject'); // Refuser une invitation
    });

    // Route pour inviter un utilisateur à un channel
    Route::post('/channel/{channel}/invite', [InvitationController::class, 'store']);

    // Routes DM
    Route::prefix("dm")
        ->controller(DMChannelController::class)
        ->group(function () {
            Route::get("/", "index");
            Route::post("/", "store")
                ->middleware('throttle:messages');
            Route::get("/{dm}", "show");
            Route::put("/{dm}", "update");
            //Route::delete("/{channel}", "destroy");

            Route::prefix("{dm}/message")
                ->controller(MessageController::class)
                ->group(function () {
                    Route::get("/", "index");
                    Route::post("/", "store");
                    Route::get("/{message}", "show");
                });

            Route::prefix("{dm}/user")
                ->controller(UserChannelController::class)
                ->group(function () {
                    Route::get("/", "index");
                    Route::put("/{userChannel}", "update");
                });
        });

    // Routes User (admin)
    Route::prefix("user")->controller(UserController::class)
        ->group(function () {
            Route::get("/", "index");
            Route::delete("/{user}", "destroy");
        });

    // Route pour supprimer un message avec son id (admin)
    Route::prefix("/message")->controller(MessageController::class)->group(function () {
        Route::delete("/{message}", "destroy");
    });

    // Route pour avoir accès aux users pour en inviter un à un channel (faut etre membre du channel)
    Route::get('/users/available-for-invite/{channel}', [UserController::class, 'getAvailableForInvite']);

    // Route pour avoir accès aux users pour en inviter un DM
    Route::get('/users/available-for-dm', [UserController::class, 'getAvailableForDM']);

    // Types de notification (liste)
    Route::get('/notification-types', [NotificationTypeController::class, 'index']);
});

// Routes E2EE (End-to-End Encryption) - Version simplifiée RSA-4096 + AES-256
Route::prefix('e2ee')->middleware('auth:api')->group(function () {

    // Gestion des clés publiques RSA
    Route::post('/keys/register', [E2EEController::class, 'registerKeys']);
    Route::get('/keys/user/{userId}', [E2EEController::class, 'getUserKeys']);
    Route::get('/keys/channel/{channelId}', [E2EEController::class, 'getChannelMembersKeys']);

    // Gestion des clés de session AES chiffrées
    Route::post('/session-keys/distribute', [E2EEController::class, 'distributeSessionKey']);
    Route::get('/session-keys/{channelId}', [E2EEController::class, 'getSessionKey']);

    // Statut E2EE d'un channel
    Route::get('/channel/{channelId}/status', [E2EEController::class, 'checkChannelE2EEStatus']);
});

// Routes pour les messages chiffrés E2EE
Route::prefix('encrypted-messages')->middleware('auth:api')->group(function () {
    Route::post('/', [EncryptedMessageController::class, 'store'])
        ->middleware('throttle:messages');
    Route::get('/channel/{channelId}', [EncryptedMessageController::class, 'index']);
    Route::get('/{messageId}', [EncryptedMessageController::class, 'show']);
});


// Routes pour les tickets
Route::prefix('tickets')->middleware('auth:api')->group(function () {
    Route::get('/', [TicketController::class, 'index']); // Lister tous les tickets
    Route::post('/', [TicketController::class, 'store']); // Créer un nouveau ticket
    Route::get('/{ticket}', [TicketController::class, 'show']); // Afficher un ticket spécifique
    Route::put('/{ticket}', [TicketController::class, 'update']); // Mettre à jour un ticket
    Route::delete('/{ticket}', [TicketController::class, 'destroy']); // Supprimer un ticket

    // Actions spécifiques aux tickets
    Route::post('/{ticket}/assign', [TicketController::class, 'assign']); // Assigner un ticket à un admin
    Route::put('/{ticket}/status', [TicketController::class, 'updateStatus']); // Mettre à jour le statut du ticket
    Route::put('/{ticket}/priority', [TicketController::class, 'updatePriority']); // Mettre à jour la priorité du ticket

    // Commentaires/messages du ticket
    Route::prefix('{ticket}/comments')->group(function () {
        Route::get('/', [TicketCommentController::class, 'index']); // Lister les commentaires d'un ticket
        Route::post('/', [TicketCommentController::class, 'store']); // Ajouter un commentaire à un ticket
    });
});

Route::any('{any}', function () {
    return response()->json([
        'error' => 'Route non trouvée',
        'code' => 'NOT_FOUND'
    ], 404);
})->where('any', '.*');
