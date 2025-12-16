<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Middleware pour la gestion du contexte Sentry dans les requêtes HTTP.
 */

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Sentry\Breadcrumb;
use Sentry\State\Scope;

use function Sentry\addBreadcrumb;
use function Sentry\configureScope;

class SentryContext
{
    public function handle(Request $request, Closure $next)
    {
        if (auth()->check()) {
            configureScope(function (Scope $scope): void {
                $user = auth()->user();
                $scope->setUser([
                    'id' => $user->id,
                    'username' => $user->name ?? $user->username ?? null,
                    'email' => $user->email ?? null,
                ]);
            });
        }

        configureScope(function (Scope $scope) use ($request): void {
            $scope->setTag('platform', 'backend');
            $scope->setTag('app', 'api');
            $scope->setTag('request_method', $request->method());
            $scope->setTag('request_path', $request->path());

            $scope->setContext('request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        addBreadcrumb(
            Breadcrumb::fromArray([
                'category' => 'request',
                'message' => $request->method() . ' ' . $request->path(),
                'level' => Breadcrumb::LEVEL_INFO,
                'data' => [
                    'method' => $request->method(),
                    'url' => $request->fullUrl(),
                    'ip' => $request->ip(),
                ],
            ])
        );

        return $next($request);
    }
}
