/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const WebSocket = require('ws');
const { Sentry } = require('../utils/sentry');
const logger = require('../utils/logger');

/**
 * Diffuse à tous les clients qu'un utilisateur s'est connecté.
 * @param {object} server - Instance du serveur WebSocket
 * @param {number} userId - ID de l'utilisateur connecté
 * @param {string} username - Nom d'utilisateur connecté
 */
function broadcastUserConnected(server, userId, username) {
    if (!server.wss) return;

    try {
        let sentCount = 0;

        logger.info(`[Presence] Broadcasting user_connected - userId: ${userId}, username: ${username}`);

        server.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN &&
                client.authenticated &&
                client.userId !== userId) {

                try {
                    client.send(JSON.stringify({
                        type: 'user_connected',
                        userId: userId,
                        username: username,
                        timestamp: new Date().toISOString()
                    }));
                    sentCount++;
                } catch (error) {
                    logger.error('[Presence] Error sending user_connected:', error);
                }
            }
        });

        logger.info(`[Presence] user_connected broadcasted to ${sentCount} client(s)`);

        Sentry.addBreadcrumb({
            category: 'presence',
            message: 'User connected broadcasted',
            level: 'info',
            data: {
                userId,
                username,
                recipientCount: sentCount
            }
        });
    } catch (error) {
        logger.error('[Presence] Error in broadcastUserConnected:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'presence_handler',
                action: 'broadcast_connected',
                platform: 'backend'
            },
            extra: {
                userId,
                username
            },
            level: 'error'
        });
    }
}

/**
 * Diffuse à tous les clients qu'un utilisateur s'est déconnecté.
 * @param {object} server - Instance du serveur WebSocket
 * @param {number} userId - ID de l'utilisateur déconnecté
 * @param {string} username - Nom d'utilisateur déconnecté
 */
function broadcastUserDisconnected(server, userId, username) {
    if (!server.wss) return;

    try {
        let sentCount = 0;

        logger.info(`[Presence] Broadcasting user_disconnected - userId: ${userId}, username: ${username}`);

        server.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.authenticated) {
                try {
                    client.send(JSON.stringify({
                        type: 'user_disconnected',
                        userId: userId,
                        username: username,
                        timestamp: new Date().toISOString()
                    }));
                    sentCount++;
                } catch (error) {
                    logger.error('[Presence] Error sending user_disconnected:', error);
                }
            }
        });

        logger.info(`[Presence] user_disconnected broadcasted to ${sentCount} client(s)`);

        Sentry.addBreadcrumb({
            category: 'presence',
            message: 'User disconnected broadcasted',
            level: 'info',
            data: {
                userId,
                username,
                recipientCount: sentCount
            }
        });
    } catch (error) {
        logger.error('[Presence] Error in broadcastUserDisconnected:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'presence_handler',
                action: 'broadcast_disconnected',
                platform: 'backend'
            },
            extra: {
                userId,
                username
            },
            level: 'error'
        });
    }
}

/**
 * Récupère la liste des utilisateurs en ligne dans un channel spécifique.
 * @param {object} server - Instance du serveur WebSocket
 * @param {number} channelId - ID du channel
 * @returns {Array} - Liste des utilisateurs en ligne [{userId, username}]
 */
function getOnlineUsersForChannel(server, channelId) {
    if (!server.wss) return [];

    try {
        const onlineUsers = new Map();

        server.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN &&
                client.authenticated &&
                client.subscribedChannelId === String(channelId)) {

                onlineUsers.set(client.userId, client.username);
            }
        });

        return Array.from(onlineUsers.entries()).map(([userId, username]) => ({
            userId,
            username
        }));
    } catch (error) {
        logger.error('[Presence] Error in getOnlineUsersForChannel:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'presence_handler',
                action: 'get_online_users',
                platform: 'backend'
            },
            extra: {
                channelId
            },
            level: 'error'
        });

        return [];
    }
}

/**
 * Récupère la liste de tous les utilisateurs en ligne.
 * @param {object} server - Instance du serveur WebSocket
 * @returns {Array} - Liste de tous les utilisateurs en ligne [{userId, username}]
 */
function getAllOnlineUsers(server) {
    if (!server.wss) return [];

    try {
        const onlineUsers = new Map();

        server.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.authenticated) {
                onlineUsers.set(client.userId, client.username);
            }
        });

        return Array.from(onlineUsers.entries()).map(([userId, username]) => ({
            userId,
            username
        }));
    } catch (error) {
        logger.error('[Presence] Error in getAllOnlineUsers:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'presence_handler',
                action: 'get_all_online_users',
                platform: 'backend'
            },
            level: 'error'
        });

        return [];
    }
}

/**
 * Envoie la liste des utilisateurs en ligne d'un channel à un client spécifique.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} ws - Connexion WebSocket du client
 * @param {number} channelId - ID du channel
 */
function sendChannelOnlineUsers(server, ws, channelId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    try {
        const onlineUsers = getOnlineUsersForChannel(server, channelId);

        ws.send(JSON.stringify({
            type: 'channel_online_users',
            channelId: channelId,
            users: onlineUsers,
            timestamp: new Date().toISOString()
        }));

        logger.info(`[Presence] Sent ${onlineUsers.length} online users for channel ${channelId} to userId: ${ws.userId}`);
    } catch (error) {
        logger.error('[Presence] Error sending channel online users:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'presence_handler',
                action: 'send_channel_users',
                platform: 'backend'
            },
            extra: {
                channelId,
                userId: ws.userId
            },
            level: 'error'
        });
    }
}

/**
 * Diffuse la mise à jour de la présence des utilisateurs à tous les clients abonnés au channel.
 * @param {object} server - Instance du serveur WebSocket
 * @param {number} channelId - ID du channel
 */
function broadcastChannelPresenceUpdate(server, channelId) {
    if (!server.wss) return;

    try {
        const onlineUsers = getOnlineUsersForChannel(server, channelId);
        let sentCount = 0;

        logger.info(`[Presence] Broadcasting presence update for channel ${channelId} - ${onlineUsers.length} users online`);

        server.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN &&
                client.authenticated &&
                client.subscribedChannelId === String(channelId)) {

                try {
                    client.send(JSON.stringify({
                        type: 'channel_online_users',
                        channelId: channelId,
                        users: onlineUsers,
                        timestamp: new Date().toISOString()
                    }));
                    sentCount++;
                } catch (error) {
                    logger.error('[Presence] Error broadcasting presence update:', error);
                }
            }
        });

        logger.info(`[Presence] Presence update broadcasted to ${sentCount} client(s) in channel ${channelId}`);

        Sentry.addBreadcrumb({
            category: 'presence',
            message: 'Channel presence update broadcasted',
            level: 'info',
            data: {
                channelId,
                onlineCount: onlineUsers.length,
                recipientCount: sentCount
            }
        });
    } catch (error) {
        logger.error('[Presence] Error in broadcastChannelPresenceUpdate:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'presence_handler',
                action: 'broadcast_presence_update',
                platform: 'backend'
            },
            extra: {
                channelId
            },
            level: 'error'
        });
    }
}

module.exports = {
    broadcastUserConnected,
    broadcastUserDisconnected,
    getOnlineUsersForChannel,
    getAllOnlineUsers,
    sendChannelOnlineUsers,
    broadcastChannelPresenceUpdate
};