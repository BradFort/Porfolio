/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const winston = require('winston');

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
};

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let logMessage = `[${timestamp}] ${level}: ${message}`;

        const metaKeys = Object.keys(meta).filter(k => k !== 'timestamp');
        if (metaKeys.length > 0) {
            const cleanMeta = {};
            metaKeys.forEach(k => cleanMeta[k] = meta[k]);
            if (Object.keys(cleanMeta).length > 0) {
                logMessage += ` ${JSON.stringify(cleanMeta)}`;
            }
        }

        return stack ? `${logMessage}\n${stack}` : logMessage;
    })
);

/**
 * Logger principal de l'application, basé sur Winston.
 * Utilisez logger.info, logger.warn, logger.error, etc. pour enregistrer des logs.
 */
const logger = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }));

    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        )
    }));
}

winston.addColors(logColors);

let Sentry = null;
const getSentry = () => {
    if (!Sentry) {
        try {
            Sentry = require('./sentry').Sentry;
        } catch (e) {
            // Sentry pas disponible
        }
    }
    return Sentry;
};

const originalError = logger.error.bind(logger);
logger.error = function(...args) {
    originalError(...args);

    const sentry = getSentry();
    if (sentry) {
        if (args[0] instanceof Error) {
            sentry.captureException(args[0]);
        } else if (typeof args[0] === 'string' && args[1] instanceof Error) {
            sentry.captureException(args[1], {
                extra: { message: args[0] }
            });
        }
    }
};

/**
 * Ajoute un log de type WebSocket.
 * @param {string} message
 */
logger.websocket = (message) => logger.info(`[WebSocket] ${message}`);

/**
 * Ajoute un log de type API.
 * @param {string} message
 */
logger.api = (message) => logger.info(`[API] ${message}`);

/**
 * Ajoute un log de type Auth.
 * @param {string} message
 */
logger.auth = (message) => logger.info(`[Auth] ${message}`);

module.exports = logger;