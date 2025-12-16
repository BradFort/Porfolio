<?php

use Sentry\Breadcrumb;
use Sentry\Event;

return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),

    'environment' => env('SENTRY_ENVIRONMENT', env('APP_ENV', 'production')),

    'release' => env('SENTRY_RELEASE', 'chatapp-api@1.0.0'),

    'tags' => [
        'platform' => 'backend',
        'app' => 'api',
        'framework' => 'laravel'
    ],

    'breadcrumbs' => [
        'logs' => true,
        'cache' => true,
        'livewire' => false,
        'sql_queries' => true,
        'sql_bindings' => true,
        'queue_info' => true,
        'command_info' => true,
    ],

    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 1.0),

    'send_default_pii' => true,

    'integrations' => [
        Sentry\Laravel\Integration::class,
    ],

    'before_send' => function (Event $event): ?Event {
        if (env('APP_ENV') === 'local') {
            Log::info('Sentry Event (dev)', ['event' => $event]);
        }

        return $event;
    },

    'before_breadcrumb' => function (Breadcrumb $breadcrumb): ?Breadcrumb {
        if (env('APP_ENV') === 'local' && $breadcrumb->getCategory() === 'cache') {
            return null;
        }

        return $breadcrumb;
    },
];
