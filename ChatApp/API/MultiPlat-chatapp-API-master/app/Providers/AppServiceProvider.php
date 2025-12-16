<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Fournisseur de services principal de l'application.
 * Configure les services, rate limiters et bindings de modèles de route.
 */

namespace App\Providers;

use App\Models\Channel;
use App\Models\User;
use App\Models\DMChannel;
use App\Services\ChannelService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Enregistre les services de l'application.
     * @return void
     */
    public function register(): void
    {
        // Set le ChannelService
        $this->app->singleton(ChannelService::class, function ($app) {
            return new ChannelService();
        });
    }

    /**
     * Démarre les services de l'application.
     * @return void
     */
    public function boot(): void
    {
        URL::forceScheme('https');

        if ($appUrl = config('app.url')) {

            URL::forceRootUrl($appUrl);
        }

        // Rate Limiters personnalisés
        $this->configureRateLimiting();

        // Route model bindings
        $this->configureRouteBindings();
    }

    /**
     * Configure les rate limiters pour l'application.
     * @return void
     */
    protected function configureRateLimiting(): void
    {
        // Rate limit pour les messages (30 par minute)
        RateLimiter::for('messages', function (Request $request) {
            return Limit::perMinute(30)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = isset($headers['Retry-After']) ? (int)$headers['Retry-After'] : 60;

                    return response()->json([
                        'success' => false,
                        'message' => 'Trop de messages envoyés. Attendez 1 minute.',
                        'retry_after' => $retryAfter
                    ], 429, $headers);
                });
        });

        // Rate limit pour la création de channels (10 par heure)
        RateLimiter::for('channels', function (Request $request) {
            return Limit::perHour(10)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function (Request $request, array $headers) {
                    $retryAfter = isset($headers['Retry-After']) ? (int)$headers['Retry-After'] : 3600;

                    return response()->json([
                        'success' => false,
                        'message' => 'Trop de salons créés. Réessayez dans une heure.',
                        'retry_after' => $retryAfter
                    ], 429, $headers);
                });
        });
    }

    /**
     * Configure les bindings de modèles pour les routes.
     * @return void
     */
    protected function configureRouteBindings(): void
    {
        Route::bind('channel', function ($value) {
            $channel = Channel::find($value);

            if (!$channel) {
                if (request()->expectsJson() ||
                    request()->is('api/*') ||
                    request()->is('chatappAPI/*') ||
                    request()->wantsJson()) {

                    abort(response()->json([
                        'success' => false,
                        'message' => 'Channel non trouvé'
                    ], 404));
                }

                abort(404);
            }

            return $channel;
        });

        Route::bind('user', function ($value) {
            $user = User::find($value);

            if (!$user) {
                if (request()->expectsJson() ||
                    request()->is('api/*') ||
                    request()->is('chatappAPI/*') ||
                    request()->wantsJson()) {

                    abort(response()->json([
                        'success' => false,
                        'message' => 'Utilisateur non trouvé'
                    ], 404));
                }

                abort(404);
            }

            return $user;
        });

        Route::bind('dm', function ($value) {
            $dmChannel = DMChannel::find($value);

            if (!$dmChannel) {
                if (request()->expectsJson() ||
                    request()->is('api/*') ||
                    request()->is('chatappAPI/*') ||
                    request()->wantsJson()) {

                    abort(response()->json([
                        'success' => false,
                        'message' => 'Conversation privée non trouvée'
                    ], 404));
                }

                abort(404);
            }

            return $dmChannel;
        });
    }
}
