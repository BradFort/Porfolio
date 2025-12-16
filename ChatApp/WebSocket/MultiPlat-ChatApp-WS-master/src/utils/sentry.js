/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const Sentry = require('@sentry/node');

/**
 * Initialise Sentry avec la configuration du projet et le filtrage des erreurs réseau courantes.
 */
const initSentry = () => {
    Sentry.init({
        dsn: process.env.SENTRY_DSN || 'https://3b235366f8b799f4332e7a696cc982ba@o4510364795469824.ingest.us.sentry.io/4510364826206208',
        environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
        release: process.env.SENTRY_RELEASE || 'chatapp-websocket@1.0.0',

        tags: {
            platform: 'backend',
            app: 'websocket',
            framework: 'nodejs'
        },

        beforeSend(event, hint) {
            const error = hint.originalException;

            const ignoredErrors = [
                'ECONNRESET',
                'ETIMEDOUT',
                'EHOSTUNREACH',
                'ENETUNREACH',
                'ECONNREFUSED',
                'EPIPE',
                'ENOTFOUND',
                'Connection lost',
                'WebSocket is closed',
                'ws error',
                'read ECONNRESET',
                'write ECONNRESET',
                'socket hang up'
            ];

            if (error && error.code) {
                if (ignoredErrors.includes(error.code)) {
                    console.log(`[Sentry] Filtered network error code: ${error.code}`);
                    return null;
                }
            }

            if (error && error.message) {
                for (const ignored of ignoredErrors) {
                    if (error.message.includes(ignored)) {
                        console.log(`[Sentry] Filtered network error message: ${error.message}`);
                        return null;
                    }
                }
            }

            const redisConnectionErrors = [
                'Redis connection',
                'Connection closed',
                'Connection lost',
                'Connection timeout'
            ];

            if (error && error.message) {
                for (const redisError of redisConnectionErrors) {
                    if (error.message.includes(redisError)) {
                        console.log(`[Sentry] Filtered Redis connection error: ${error.message}`);
                        return null;
                    }
                }
            }

            if (event.message && event.message.includes('WebSocket connection closed')) {
                console.log('[Sentry] Filtered normal WebSocket closure');
                return null;
            }

            return event;
        },

        tracesSampler(samplingContext) {
            const { transactionContext } = samplingContext || {};

            if (!transactionContext || !transactionContext.name) {
                return parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0;
            }

            if (
                transactionContext.name === 'websocket.ping' ||
                transactionContext.name === 'health.check' ||
                transactionContext.name === 'GET /health'
            ) {
                return 0;
            }

            return parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0;
        },

        profilesSampleRate: 1.0,

        sendDefaultPii: true,
    });

    console.log('Sentry initialized with error filtering');
};

module.exports = { Sentry, initSentry };