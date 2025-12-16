<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Gestionnaire d'exceptions personnalisé pour l'API ChatAppXP.
 * Permet de personnaliser les réponses d'erreur pour les requêtes API.
 */

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Détermine si la requête est une requête API
     */
    private function isApiRequest($request): bool
    {
        return $request->expectsJson() ||
               $request->is('api/*') ||
               $request->is('chatappAPI/*') ||
               $request->wantsJson();
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $exception
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws \Throwable
     */
    public function render($request, Throwable $exception)
    {
        $isApiRequest = $this->isApiRequest($request);

        // Gestion des erreurs ModelNotFoundException
        if ($exception instanceof ModelNotFoundException && $isApiRequest) {
            $modelName = class_basename($exception->getModel());

            $customMessages = [
                'Channel' => 'Channel non trouvé',
                'User' => 'Utilisateur non trouvé',
                'Message' => 'Message non trouvé',
                'DMChannel' => 'Conversation privée non trouvée',
            ];

            $message = $customMessages[$modelName] ?? 'Ressource non trouvée';

            return response()->json([
                'success' => false,
                'message' => $message
            ], 404)
            ->header('Content-Type', 'application/json');
        }

        // Gestion des erreurs de validation
        if ($exception instanceof ValidationException && $isApiRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Données de validation invalides',
                'errors' => $exception->errors()
            ], 422);
        }

        // Gestion des erreurs d'authentification
        if ($exception instanceof AuthenticationException && $isApiRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non authentifié'
            ], 401);
        }

        // Gestion des erreurs JWT
        if ($exception instanceof TokenInvalidException && $isApiRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalide'
            ], 401);
        }

        if ($exception instanceof TokenExpiredException && $isApiRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Token expiré'
            ], 401);
        }

        if ($exception instanceof JWTException && $isApiRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur d\'authentification JWT'
            ], 401);
        }

        // Gestion des erreurs d'autorisation
        if ($exception instanceof AuthorizationException && $isApiRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé'
            ], 403);
        }

        // Gestion des erreurs de méthode HTTP non supportée
        if ($exception instanceof MethodNotAllowedHttpException && $isApiRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Méthode HTTP non autorisée'
            ], 405);
        }

        // Gestion des erreurs de route non trouvée
        if ($exception instanceof NotFoundHttpException && $isApiRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Route non trouvée'
            ], 404);
        }

        // Gestion des erreurs générales en prod
        if ($isApiRequest && !config('app.debug')) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur interne du serveur'
            ], 500);
        }

        return parent::render($request, $exception);
    }
}
