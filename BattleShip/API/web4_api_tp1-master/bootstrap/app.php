<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            // Register API routes without the 'api' prefix
            Route::middleware('api')
                ->prefix('') // No prefix
                ->group(base_path('routes/api.php'));
        }
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            return response()->json([
                'message' => "La ressource n’existe pas."
            ], 404);
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            $missingField = array_key_first($e->validator->failed()); // Get the first field that failed validation

            $message = "Le champ {$missingField} est obligatoire.";

            // Check if the field is 'resultat' and the validation rule is not 'Required'
            if ($missingField === 'resultat' && !isset($e->validator->failed()['resultat']['Required'])) {
                $message = "Le champ resultat est invalide.";
            }

            return response()->json([
                'message' => $message,
                'errors' => $e->errors(),
            ], 422);
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            //Bon if à utiliser
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Cette action n’est pas autorisée.'
                ], 403);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return response()->json([
                'message' => 'Non authentifié.'
            ], 401);
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            return response()->json([
                'message' => 'Cette action n’est pas autorisée.'
            ], 403);
        });


    })->create();
