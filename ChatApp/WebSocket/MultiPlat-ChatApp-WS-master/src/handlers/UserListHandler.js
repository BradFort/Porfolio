/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const WebSocket = require('ws');
const { Sentry } = require('../utils/sentry');
const logger = require('../utils/logger');

/**
 * Diffuse une mise à jour de la liste des utilisateurs d'un channel à tous les clients abonnés.
 * @param {object} server - Instance du serveur WebSocket
 * @param {string|number} channelId - ID du channel
 * @param {string} modificationType - Type de modification ('join' ou 'leave')
 * @param {string|number} userId - ID de l'utilisateur concerné
 */
function broadcastUserListUpdate(server, channelId, modificationType, userId) {
    if (!server.wss) return;

    try {
        let sentCount = 0;

        logger.info(`[UserList] Broadcasting ${modificationType} for userId: ${userId} in channelId: ${channelId} to clients abonnés`);

        server.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.subscribedChannelId?.toString() === channelId.toString()) {
                try {
                    client.send(JSON.stringify({
                        type: 'redis_userlist_update',
                        modification_type: modificationType,
                        userId: userId,
                        channelId: channelId,
                        timestamp: new Date().toISOString()
                    }));
                    sentCount++;
                    logger.info(`[UserList] Update envoyé à client (userId: ${client.userId}) pour channelId: ${channelId}`);
                } catch (error) {
                    logger.error(`[UserList] Erreur envoi update à client:`, error);
                }
            }
        });

        logger.info(`[UserList] Update ${modificationType} diffusé à ${sentCount} clients abonnés pour channelId: ${channelId}`);

        Sentry.addBreadcrumb({
            category: 'userlist',
            message: `User list ${modificationType}`,
            level: 'info',
            data: {
                channelId,
                userId,
                modificationType,
                recipientCount: sentCount
            }
        });
    } catch (error) {
        logger.error('[UserList] Error in broadcastUserListUpdate:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'userlist_handler',
                action: 'broadcast_update',
                platform: 'backend'
            },
            extra: {
                channelId,
                userId,
                modificationType
            },
            level: 'error'
        });
    }
}

/**
 * Gère l'événement d'un utilisateur qui rejoint un channel.
 * @param {object} server - Instance du serveur WebSocket
 * @param {string|number} channelId - ID du channel
 * @param {string|number} userId - ID de l'utilisateur
 */
function handleUserJoin(server, channelId, userId) {
    broadcastUserListUpdate(server, channelId, 'join', userId);
}

/**
 * Gère l'événement d'un utilisateur qui quitte un channel.
 * @param {object} server - Instance du serveur WebSocket
 * @param {string|number} channelId - ID du channel
 * @param {string|number} userId - ID de l'utilisateur
 */
function handleUserLeave(server, channelId, userId) {
    broadcastUserListUpdate(server, channelId, 'leave', userId);
}

module.exports = {
    broadcastUserListUpdate,
    handleUserJoin,
    handleUserLeave
};