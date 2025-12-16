<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        health: '/up',
        apiPrefix: 'chatappAPI'
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Ajouter les headers de sécurité
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        $middleware->api(append: [
            \App\Http\Middleware\SentryContext::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Formatter les réponses 429 (Too Many Requests)
        $exceptions->renderable(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, $request) {
            if ($request->expectsJson() || $request->is('chatappAPI/*')) {
                $headers = $e->getHeaders();
                $retryAfter = isset($headers['Retry-After']) ? (int)$headers['Retry-After'] : 60;

                return response()->json([
                    'success' => false,
                    'message' => 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
                    'retry_after' => $retryAfter
                ], 429, $headers);
            }
        });
    })->create();
