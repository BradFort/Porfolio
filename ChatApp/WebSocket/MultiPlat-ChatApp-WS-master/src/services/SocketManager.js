/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const { Sentry } = require('../utils/sentry');
const AuthHandler = require('../handlers/AuthHandler');
const logger = require('../utils/logger');

class SocketManager {
    /**
     * Initialise le gestionnaire de sockets avec l'instance io.
     * @param {object} io - Instance Socket.IO
     */
    constructor(io) {
        this.io = io;
        this.connectedUsers = new Map();
        this.userChannels = new Map();
        this.authHandler = new AuthHandler();
        this.init();
    }

    /**
     * Initialise les événements de connexion Socket.IO.
     */
    init() {
        this.io.on('connection', (socket) => {
            const ip = socket.handshake?.address || socket.request?.connection?.remoteAddress || 'unknown';
            const timestamp = new Date().toISOString();
            logger.info(`Nouvelle connexion client: socketId=${socket.id}, ip=${ip}, time=${timestamp}`);

            Sentry.addBreadcrumb({
                category: 'socket_io',
                message: 'New Socket.IO connection',
                level: 'info',
                data: { socketId: socket.id, ip }
            });

            this.setupSocketEvents(socket);
        });
    }

    /**
     * Configure les événements pour un socket donné.
     * @param {object} socket - Instance du socket
     */
    setupSocketEvents(socket) {
        socket.on('authenticate', async (data) => {
            try {
                logger.info(`Tentative d'authentification: ${data.username} (${data.userId})`);
                const isValid = await this.authHandler.validateToken(data.token);
                if (isValid && data.userId && data.username) {
                    socket.userId = data.userId;
                    socket.username = data.username;
                    socket.authenticated = true;
                    this.connectedUsers.set(data.userId.toString(), {
                        socketId: socket.id,
                        username: data.username,
                        connectedAt: new Date(),
                        socket: socket
                    });

                    Sentry.setUser({
                        id: data.userId,
                        username: data.username
                    });

                    await this.joinUserChannels(socket, data.userId);
                    socket.emit('authenticated', {
                        success: true,
                        userId: data.userId,
                        username: data.username
                    });
                    logger.info(`Utilisateur authentifié: ${data.username} (${data.userId})`);
                } else {
                    socket.emit('authentication_error', { message: 'Token invalide ou données manquantes' });
                    logger.warn(`Authentification échouée: ${socket.id}`);

                    Sentry.captureMessage('Socket.IO authentication failed', {
                        level: 'warning',
                        tags: {
                            component: 'socket_manager',
                            action: 'authenticate',
                            platform: 'backend'
                        }
                    });
                }
            } catch (error) {
                logger.error('Erreur authentification:', error);

                Sentry.captureException(error, {
                    tags: {
                        component: 'socket_manager',
                        action: 'authenticate',
                        platform: 'backend'
                    },
                    level: 'error'
                });

                socket.emit('authentication_error', { message: 'Erreur serveur' });
            }
        });

        socket.on('disconnect', async (reason) => {
            if (socket.authenticated) {
                try {
                    this.connectedUsers.delete(socket.userId.toString());
                    this.userChannels.delete(socket.userId.toString());
                    logger.info(`Déconnexion: ${socket.username} (${reason})`);

                    Sentry.addBreadcrumb({
                        category: 'socket_io',
                        message: 'User disconnected',
                        level: 'info',
                        data: {
                            userId: socket.userId,
                            username: socket.username,
                            reason
                        }
                    });
                } catch (error) {
                    logger.error('Erreur déconnexion:', error);

                    Sentry.captureException(error, {
                        tags: {
                            component: 'socket_manager',
                            action: 'disconnect',
                            platform: 'backend'
                        },
                        level: 'error'
                    });
                }
            } else {
                logger.info(`Déconnexion socket non authentifié: ${socket.id} (${reason})`);
            }
        });

        socket.on('error', (error) => {
            logger.error(`Erreur socket ${socket.id}:`, error);

            Sentry.captureException(error, {
                tags: {
                    component: 'socket_manager',
                    action: 'socket_error',
                    platform: 'backend'
                },
                extra: {
                    socketId: socket.id,
                    userId: socket.userId
                },
                level: 'error'
            });
        });
    }

    /**
     * Fait rejoindre à l'utilisateur ses channels par défaut.
     * @param {object} socket - Instance du socket
     * @param {string|number} userId - ID de l'utilisateur
     */
    async joinUserChannels(socket, userId) {
        try {
            socket.join('channel:general');

            if (!this.userChannels.has(userId.toString())) {
                this.userChannels.set(userId.toString(), ['general']);
            }

            logger.info(`${socket.username} rejoint automatiquement ses channels`);
        } catch (error) {
            logger.error('Erreur join user channels:', error);

            Sentry.captureException(error, {
                tags: {
                    component: 'socket_manager',
                    action: 'join_channels',
                    platform: 'backend'
                },
                extra: {
                    userId,
                    username: socket.username
                },
                level: 'error'
            });
        }
    }

    /**
     * Retourne le nombre de connexions actives.
     * @returns {number}
     */
    getConnectionCount() {
        return this.connectedUsers.size;
    }

    /**
     * Retourne la liste des utilisateurs connectés.
     * @returns {Array}
     */
    getConnectedUsers() {
        return Array.from(this.connectedUsers.entries()).map(([userId, data]) => ({
            userId,
            username: data.username,
            connectedAt: data.connectedAt,
            socketId: data.socketId
        }));
    }

    /**
     * Vérifie si un utilisateur est connecté.
     * @param {string|number} userId - ID de l'utilisateur
     * @returns {boolean}
     */
    isUserConnected(userId) {
        return this.connectedUsers.has(userId.toString());
    }

    /**
     * Diffuse un événement à tous les utilisateurs d'un channel.
     * @param {string|number} channelId - ID du channel
     * @param {string} event - Nom de l'événement
     * @param {object} data - Données à envoyer
     */
    broadcastToChannel(channelId, event, data) {
        this.io.to(`channel:${channelId}`).emit(event, data);
        logger.info(`Diffusion vers channel:${channelId} - ${event}`);
    }

    /**
     * Envoie un événement à un utilisateur spécifique.
     * @param {string|number} userId - ID de l'utilisateur
     * @param {string} event - Nom de l'événement
     * @param {object} data - Données à envoyer
     * @returns {boolean}
     */
    sendToUser(userId, event, data) {
        const user = this.connectedUsers.get(userId.toString());
        if (user) {
            this.io.to(user.socketId).emit(event, data);
            logger.info(`Envoi vers utilisateur ${userId} - ${event}`);
            return true;
        }
        logger.warn(`Utilisateur ${userId} non connecté`);
        return false;
    }

    /**
     * Retourne les statistiques du gestionnaire de sockets.
     * @returns {object}
     */
    getStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            totalChannels: this.userChannels.size,
        };
    }

    /**
     * Arrête proprement le gestionnaire de sockets.
     */
    async shutdown() {
        logger.info('Arrêt du gestionnaire de sockets...');

        Sentry.addBreadcrumb({
            category: 'socket_io',
            message: 'Socket manager shutting down',
            level: 'info'
        });

        this.io.emit('server_shutdown', {
            message: 'Serveur en cours d\'arrêt',
            timestamp: new Date().toISOString()
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        this.io.close();

        this.connectedUsers.clear();
        this.userChannels.clear();

        logger.info('Gestionnaire de sockets arrêté');
    }
}

module.exports = SocketManager;