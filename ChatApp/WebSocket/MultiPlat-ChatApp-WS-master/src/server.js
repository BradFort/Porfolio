require('dotenv').config();
const { Sentry, initSentry } = require('./utils/sentry');
initSentry();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const Redis = require('ioredis');

const logger = require('./utils/logger');
const { forwardToClients } = require('./handlers/RedisForwarder');
const {
    handleAuthentication,
    handleSubscribe,
    handleUnsubscribe,
    handleSubscribeNotifications,
    handleUnsubscribeNotifications,
    handleTypingStart,
    handleTypingStop
} = require('./handlers/MessageHandlers');
const { broadcastUserDisconnected, broadcastChannelPresenceUpdate } = require('./handlers/PresenceHandler');

/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

class WebSocketServer {
    /**
     * Initialise le serveur WebSocket, Express, Redis et les structures de données.
     */
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = process.env.PORT || 3001;
        this.host = process.env.HOST || '0.0.0.0';
        this.wss = null;
        this.redisSubscriber = null;
        this.heartbeatInterval = null;

        this.userChannels = new Map();
        this.userNotifications = new Map();
    }

    /**
     * Initialise le serveur (middleware, routes, Redis, etc.).
     */
    async init() {
        try {
            logger.info('Initialisation du serveur WebSocket...');

            Sentry.addBreadcrumb({
                category: 'server',
                message: 'Initializing WebSocket server',
                level: 'info'
            });

            this.setupMiddleware();
            this.setupRoutes();
            await this.setupRedis();
            logger.info('Serveur WebSocket initialisé');

            Sentry.addBreadcrumb({
                category: 'server',
                message: 'WebSocket server initialized',
                level: 'info'
            });
        } catch (error) {
            logger.error('Erreur initialisation:', error);

            Sentry.captureException(error, {
                tags: {
                    component: 'server',
                    action: 'init',
                    platform: 'backend'
                },
                level: 'fatal'
            });

            process.exit(1);
        }
    }

    /**
     * Configure et connecte le client Redis, gère les abonnements et la réception des messages.
     */
    async setupRedis() {
        try {
            this.redisSubscriber = new Redis({
                host: process.env.REDIS_HOST || '127.0.0.1',
                port: process.env.REDIS_PORT || 6379,
                retryStrategy: (times) => {
                    // Retry avec backoff exponentiel
                    const delay = Math.min(times * 50, 2000);
                    logger.info(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
                    return delay;
                }
            });

            this.redisSubscriber.on('connect', () => {
                logger.info('[Redis] Connecté');

                Sentry.addBreadcrumb({
                    category: 'redis',
                    message: 'Redis connected',
                    level: 'info'
                });
            });

            this.redisSubscriber.on('error', (err) => {
                const normalRedisErrors = [
                    'ECONNREFUSED',
                    'ENOTFOUND',
                    'Connection closed',
                    'Connection lost',
                    'Connection timeout'
                ];

                const isNormalError = normalRedisErrors.some(msg =>
                    (err.message && err.message.includes(msg)) || err.code === msg
                );

                if (isNormalError) {
                    logger.warn(`[Redis] Connection issue (will retry): ${err.message || err.code}`);

                    Sentry.addBreadcrumb({
                        category: 'redis',
                        message: 'Redis connection issue',
                        level: 'warning',
                        data: {
                            error: err.message || err.code
                        }
                    });
                } else {
                    // Vraie erreur Redis
                    logger.error('[Redis] Erreur:', err);

                    Sentry.captureException(err, {
                        tags: {
                            component: 'redis',
                            action: 'connection_error',
                            platform: 'backend'
                        },
                        level: 'error'
                    });
                }
            });

            await this.redisSubscriber.psubscribe('*');
            logger.info('[Redis] Abonné à tous les channels (*)');

            Sentry.addBreadcrumb({
                category: 'redis',
                message: 'Subscribed to all Redis channels',
                level: 'info'
            });

            this.redisSubscriber.on('pmessage', (pattern, channel, message) => {
                logger.info(`[Redis] Message reçu - channel: ${channel}, message: ${message}`);

                const messageId = `${channel}-${Date.now()}`;
                logger.info(`[Redis] Processing message ID: ${messageId}`);

                try {
                    forwardToClients(this, channel, message);
                } catch (error) {
                    logger.error('[Redis] Error forwarding message:', error);

                    Sentry.captureException(error, {
                        tags: {
                            component: 'redis',
                            action: 'forward_message',
                            platform: 'backend'
                        },
                        extra: {
                            channel,
                            message_id: messageId
                        },
                        level: 'error'
                    });
                }
            });
        } catch (error) {
            logger.error('[Redis] Setup error:', error);

            Sentry.captureException(error, {
                tags: {
                    component: 'redis',
                    action: 'setup',
                    platform: 'backend'
                },
                level: 'fatal'
            });

            throw error;
        }
    }

    /**
     * Initialise le serveur WebSocket, heartbeat et gestion des connexions.
     */
    setupWebSocket() {
        this.wss = new WebSocket.Server({
            server: this.server,
            clientTracking: true,
            perMessageDeflate: false
        });

        Sentry.addBreadcrumb({
            category: 'websocket',
            message: 'WebSocket server created',
            level: 'info'
        });

        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    logger.info(`[WS] Terminating dead connection for user: ${ws.username || 'unknown'}`);

                    Sentry.addBreadcrumb({
                        category: 'websocket',
                        message: 'Terminated dead connection',
                        level: 'info',
                        data: {
                            userId: ws.userId,
                            username: ws.username
                        }
                    });

                    return ws.terminate();
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);

        this.wss.on('close', () => {
            clearInterval(this.heartbeatInterval);
        });

        this.wss.on('connection', (ws, req) => {
            const clientIp = req.socket.remoteAddress;

            logger.info('[WS] Nouvelle connexion');

            Sentry.addBreadcrumb({
                category: 'websocket',
                message: 'New WebSocket connection',
                level: 'info',
                data: { ip: clientIp }
            });

            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.subscribedChannelId = null;
            ws.userId = null;
            ws.username = null;
            ws.notificationChannels = new Set();

            ws.on('message', (message) => {
                logger.info(`[WS] Message reçu: ${message}`);

                let data;
                try {
                    data = JSON.parse(message);

                    Sentry.addBreadcrumb({
                        category: 'websocket',
                        message: `Message received: ${data.type}`,
                        level: 'info',
                        data: {
                            type: data.type,
                            userId: ws.userId,
                            channelId: data.channelId
                        }
                    });
                } catch (e) {
                    logger.warn('[WS] Message JSON invalide');

                    Sentry.captureException(e, {
                        tags: {
                            component: 'websocket',
                            action: 'parse_message',
                            platform: 'backend'
                        },
                        extra: {
                            message: message.toString().substring(0, 500)
                        },
                        level: 'warning'
                    });

                    return;
                }

                try {
                    switch (data.type) {
                        case 'authenticate':
                            handleAuthentication(this, ws, data);
                            break;
                        case 'subscribe':
                            handleSubscribe(this, ws, data);
                            break;
                        case 'unsubscribe':
                            handleUnsubscribe(this, ws, data);
                            break;
                        case 'subscribe_notifications':
                            handleSubscribeNotifications(this, ws, data);
                            break;
                        case 'unsubscribe_notifications':
                            handleUnsubscribeNotifications(this, ws, data);
                            break;
                        case 'typing_start':
                            handleTypingStart(this, ws, data);
                            break;
                        case 'typing_stop':
                            handleTypingStop(this, ws, data);
                            break;
                        default:
                            logger.info(`[WS] Type de message non supporté: ${data.type}`);
                    }
                } catch (error) {
                    logger.error(`[WS] Error handling message type ${data.type}:`, error);

                    Sentry.captureException(error, {
                        tags: {
                            component: 'websocket',
                            action: 'handle_message',
                            message_type: data.type,
                            platform: 'backend'
                        },
                        extra: {
                            userId: ws.userId,
                            data: data
                        },
                        level: 'error'
                    });
                }
            });

            ws.on('close', (code, reason) => {
                if (ws.userId) {
                    const disconnectedUserId = ws.userId;
                    const disconnectedUsername = ws.username;
                    const disconnectedChannelId = ws.subscribedChannelId;

                    const normalCloseCodes = [1000, 1001, 1005];

                    if (normalCloseCodes.includes(code)) {
                        logger.info(`[WS] User disconnected normally - userId: ${disconnectedUserId}, code: ${code}`);
                    } else {
                        logger.warn(`[WS] User disconnected abnormally - userId: ${disconnectedUserId}, code: ${code}, reason: ${reason}`);
                    }

                    Sentry.addBreadcrumb({
                        category: 'websocket',
                        message: 'User disconnected',
                        level: 'info',
                        data: {
                            userId: disconnectedUserId,
                            username: disconnectedUsername,
                            code: code,
                            reason: reason ? reason.toString() : 'unknown',
                            normal: normalCloseCodes.includes(code)
                        }
                    });

                    broadcastUserDisconnected(this, disconnectedUserId, disconnectedUsername);

                    if (disconnectedChannelId) {
                        broadcastChannelPresenceUpdate(this, disconnectedChannelId);
                    }

                    this.userChannels.delete(ws.userId);
                    this.userNotifications.delete(ws.userId);
                    logger.info(`[WS] Connexion fermée - userId: ${disconnectedUserId} (${disconnectedUsername}) supprimé des maps`);
                } else {
                    logger.info(`[WS] Connexion fermée sans authentification - code: ${code}`);
                }
            });

            ws.on('error', (error) => {
                const normalNetworkErrors = [
                    'ECONNRESET',
                    'ETIMEDOUT',
                    'EHOSTUNREACH',
                    'ENETUNREACH',
                    'EPIPE',
                    'ENOTFOUND',
                    'ECONNABORTED'
                ];

                const isNormalError = error.code && normalNetworkErrors.includes(error.code);

                if (isNormalError) {
                    logger.info(`[WS] Network error (normal): ${error.code} for user: ${ws.username || 'unknown'}`);

                    Sentry.addBreadcrumb({
                        category: 'websocket',
                        message: 'Network disconnection',
                        level: 'info',
                        data: {
                            error_code: error.code,
                            userId: ws.userId,
                            username: ws.username
                        }
                    });
                } else {
                    logger.error('[WS] Erreur WebSocket:', error);

                    Sentry.captureException(error, {
                        tags: {
                            component: 'websocket',
                            action: 'socket_error',
                            platform: 'backend'
                        },
                        extra: {
                            userId: ws.userId,
                            username: ws.username,
                            ip: clientIp,
                            error_code: error.code,
                            error_message: error.message
                        },
                        level: 'error'
                    });
                }
            });
        });
    }

    /**
     * Configure les middlewares Express (CORS, JSON, etc.).
     */
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    /**
     * Configure les routes HTTP (health, info, etc.).
     */
    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                clients: this.wss ? this.wss.clients.size : 0
            });
        });

        this.app.get('/info', (req, res) => {
            res.json({
                name: 'ChatApp WebSocket Server',
                version: process.env.SENTRY_RELEASE || 'chatapp-websocket@1.0.0',
                environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
                connectedClients: this.wss ? this.wss.clients.size : 0,
                uptime: process.uptime()
            });
        });
    }

    /**
     * Démarre le serveur WebSocket et HTTP.
     */
    async start() {
        await this.init();
        this.setupWebSocket();

        this.server.listen(this.port, this.host, () => {
            logger.info(`Serveur WebSocket démarré sur ${this.host}:${this.port}`);

            Sentry.addBreadcrumb({
                category: 'server',
                message: `Server started on ${this.host}:${this.port}`,
                level: 'info'
            });
        });
    }

    /**
     * Arrête proprement le serveur (WebSocket, Redis, HTTP, heartbeat).
     */
    shutdown() {
        logger.info('[Server] Shutting down...');

        // Nettoyer le heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Fermer les connexions WebSocket
        if (this.wss) {
            this.wss.clients.forEach((ws) => {
                ws.close(1001, 'Server shutting down');
            });
            this.wss.close();
        }

        // Fermer Redis
        if (this.redisSubscriber) {
            this.redisSubscriber.disconnect();
        }

        // Fermer le serveur HTTP
        if (this.server) {
            this.server.close();
        }
    }
}

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing WebSocket server');

    Sentry.addBreadcrumb({
        category: 'server',
        message: 'Server shutting down (SIGTERM)',
        level: 'info'
    });

    if (server) {
        server.shutdown();
    }

    setTimeout(() => {
        process.exit(0);
    }, 5000);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing WebSocket server');

    Sentry.addBreadcrumb({
        category: 'server',
        message: 'Server shutting down (SIGINT)',
        level: 'info'
    });

    if (server) {
        server.shutdown();
    }

    setTimeout(() => {
        process.exit(0);
    }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);

    Sentry.captureException(reason, {
        tags: {
            component: 'server',
            action: 'unhandled_rejection',
            platform: 'backend'
        },
        level: 'fatal'
    });
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    logger.error('Uncaught Exception:', error);

    Sentry.captureException(error, {
        tags: {
            component: 'server',
            action: 'uncaught_exception',
            platform: 'backend'
        },
        level: 'fatal'
    });

    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

const server = new WebSocketServer();
server.start();

module.exports = WebSocketServer;
