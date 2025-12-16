/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const WebSocket = require('ws');
const { Sentry } = require('../utils/sentry');
const logger = require('../utils/logger');
const { handleUserJoin, handleUserLeave } = require('./UserListHandler');
const {
    notifyNewInvitation,
    notifyInvitationAccepted,
    notifyInvitationRejected
} = require('./InvitationHandler');
const { notifyDMCreated } = require('./DMHandler');

/**
 * Transfère les messages Redis aux clients WebSocket abonnés ou notifiés.
 * @param {object} server - Instance du serveur WebSocket
 * @param {string} channel - Nom du canal Redis
 * @param {string} message - Message reçu de Redis
 */
function forwardToClients(server, channel, message) {
    if (!server.wss) return;

    try {
        const cleanChannel = channel.replace(/^laravel-database-/, '');

        Sentry.addBreadcrumb({
            category: 'redis',
            message: `Redis message on channel: ${cleanChannel}`,
            level: 'info'
        });

        if (cleanChannel === 'chatappapi-database-channel.user.joined' ||
            cleanChannel === 'chatappapi-database-channel.user.left') {
            handleUserJoinLeaveFromRedis(server, cleanChannel, message);
            return;
        }

        if (cleanChannel === 'chatappapi-database-invitation.created') {
            handleInvitationCreated(server, message);
            return;
        }

        if (cleanChannel === 'chatappapi-database-invitation.accepted') {
            handleInvitationAccepted(server, message);
            return;
        }

        if (cleanChannel === 'chatappapi-database-invitation.rejected') {
            handleInvitationRejected(server, message);
            return;
        }

        if (cleanChannel === 'chatappapi-database-dm.created') {
            handleDMCreated(server, message);
            return;
        }

        let clientCount = 0;
        let sentCount = 0;
        let notificationsSent = 0;

        const channelMatch = cleanChannel.match(/channel\.(\d+)$/);
        const channelId = channelMatch ? channelMatch[1] : cleanChannel;

        logger.info(`[Redis] Channel analysé: ${cleanChannel} -> channelId: ${channelId}`);

        server.wss.clients.forEach(client => {
            logger.info(`[DEBUG] Client userId: ${client.userId}, subscribedChannelId: ${client.subscribedChannelId}`);
        });

        server.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                clientCount++;

                if (String(client.subscribedChannelId) === String(channelId)) {
                    sendFullMessage(client, cleanChannel, channelId, message);
                    sentCount++;
                }
                else if (client.notificationChannels && client.notificationChannels.has(String(channelId))) {
                    sendNotification(client, channelId);
                    notificationsSent++;
                }
            }
        });

        logger.info(`[Redis->WS] ChannelId: ${channelId}, Clients connectés: ${clientCount}, Messages complets envoyés: ${sentCount}, Notifications envoyées: ${notificationsSent}`);

        Sentry.addBreadcrumb({
            category: 'redis',
            message: 'Message forwarded to clients',
            level: 'info',
            data: {
                channelId,
                clientCount,
                fullMessagesSent: sentCount,
                notificationsSent: notificationsSent
            }
        });

        if (sentCount === 0 && notificationsSent === 0 && clientCount > 0) {
            logger.warn(`[Redis->WS] Aucun client abonné ou notifié pour channelId: ${channelId}`);
        }
    } catch (error) {
        logger.error('[Redis] Error in forwardToClients:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'redis_forwarder',
                action: 'forward_to_clients',
                platform: 'backend'
            },
            extra: {
                channel,
                message: message.substring(0, 500)
            },
            level: 'error'
        });
    }
}

/**
 * Gère les événements de rejoindre/quitter d'un utilisateur depuis Redis.
 * @param {object} server - Instance du serveur WebSocket
 * @param {string} channel - Nom du canal Redis
 * @param {string} message - Message reçu de Redis
 */
function handleUserJoinLeaveFromRedis(server, channel, message) {
    try {
        const data = JSON.parse(message);
        const { channel_id, user_id, action } = data;
        const channelId = channel_id?.toString();

        logger.info(`[Redis] User ${action} event - userId: ${user_id}, channelId: ${channelId}`);

        let sentCount = 0;
        server.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.subscribedChannelId === channelId) {
                client.send(JSON.stringify({
                    type: action === 'join' ? 'user_joined' : 'user_left',
                    data: data
                }));
                sentCount++;
            }
        });
        logger.info(`[Redis->WS] Event relayé: ${action} -> channelId: ${channelId}, Messages envoyés: ${sentCount}`);

        logger.info(`[Redis] Événement user ${action} - userId: ${user_id}, channelId: ${channel_id}`);

        if (action === 'join') {
            handleUserJoin(server, channelId, user_id);
        } else if (action === 'leave') {
            handleUserLeave(server, channelId, user_id);
        } else {
            logger.warn(`[Redis] Action inconnue pour événement user: ${action}`);
        }
    } catch (error) {
        logger.error('[Redis] Erreur parsing message user join/leave:', error);
        logger.warn(`[Redis] Message non parsé: ${message}`);

        Sentry.captureException(error, {
            tags: {
                component: 'redis_forwarder',
                action: 'handle_user_join_leave',
                platform: 'backend'
            },
            extra: {
                channel,
                message: message.substring(0, 500)
            },
            level: 'error'
        });
    }
}

/**
 * Gère la création d'une invitation depuis Redis.
 * @param {object} server - Instance du serveur WebSocket
 * @param {string} message - Message reçu de Redis
 */
function handleInvitationCreated(server, message) {
    try {
        const data = JSON.parse(message);
        logger.info(`[Redis] Invitation créée - recipientId: ${data.recipient_id}, channelId: ${data.channel?.id}`);

        notifyNewInvitation(server, data.recipient_id, {
            id: data.id,
            channel: data.channel,
            inviter: data.inviter,
            message: data.message,
            created_at: data.created_at
        });
    } catch (error) {
        logger.error('[Redis] Erreur parsing message invitation créée:', error);
        logger.warn(`[Redis] Message non parsé: ${message}`);

        Sentry.captureException(error, {
            tags: {
                component: 'redis_forwarder',
                action: 'handle_invitation_created',
                platform: 'backend'
            },
            extra: {
                message: message.substring(0, 500)
            },
            level: 'error'
        });
    }
}

/**
 * Gère l'acceptation d'une invitation depuis Redis.
 * @param {object} server - Instance du serveur WebSocket
 * @param {string} message - Message reçu de Redis
 */
function handleInvitationAccepted(server, message) {
    try {
        const data = JSON.parse(message);
        logger.info(`[Redis] Invitation acceptée - userId: ${data.user_id}, channelId: ${data.channel_id}, inviterId: ${data.inviter_id}`);

        notifyInvitationAccepted(server, {
            channel_id: data.channel_id,
            channel: data.channel,
            user: data.user,
            inviter_id: data.inviter_id,
            user_id: data.user_id
        });
    } catch (error) {
        logger.error('[Redis] Erreur parsing message invitation acceptée:', error);
        logger.warn(`[Redis] Message non parsé: ${message}`);

        Sentry.captureException(error, {
            tags: {
                component: 'redis_forwarder',
                action: 'handle_invitation_accepted',
                platform: 'backend'
            },
            extra: {
                message: message.substring(0, 500)
            },
            level: 'error'
        });
    }
}

/**
 * Gère le rejet d'une invitation depuis Redis.
 * @param {object} server - Instance du serveur WebSocket
 * @param {string} message - Message reçu de Redis
 */
function handleInvitationRejected(server, message) {
    try {
        const data = JSON.parse(message);
        logger.info(`[Redis] Invitation refusée - userId: ${data.user_id}, channelId: ${data.channel_id}, inviterId: ${data.inviter_id}`);

        notifyInvitationRejected(server, {
            channel_id: data.channel_id,
            channel: data.channel,
            user: data.user,
            inviter_id: data.inviter_id,
            user_id: data.user_id
        });
    } catch (error) {
        logger.error('[Redis] Erreur parsing message invitation refusée:', error);
        logger.warn(`[Redis] Message non parsé: ${message}`);

        Sentry.captureException(error, {
            tags: {
                component: 'redis_forwarder',
                action: 'handle_invitation_rejected',
                platform: 'backend'
            },
            extra: {
                message: message.substring(0, 500)
            },
            level: 'error'
        });
    }
}

/**
 * Gère la création d'un DM depuis Redis.
 * @param {object} server - Instance du serveur WebSocket
 * @param {string} message - Message reçu de Redis
 */
function handleDMCreated(server, message) {
    try {
        const data = JSON.parse(message);
        logger.info(`[Redis] DM créé - participant1: ${data.participant1_id}, participant2: ${data.participant2_id}, channelId: ${data.channel_id}`);

        notifyDMCreated(server, {
            dm_id: data.dm_id,
            channel_id: data.channel_id,
            participant1_id: data.participant1_id,
            participant2_id: data.participant2_id,
            channel: data.channel,
            created_at: data.created_at
        });
    } catch (error) {
        logger.error('[Redis] Erreur parsing message DM créé:', error);
        logger.warn(`[Redis] Message non parsé: ${message}`);

        Sentry.captureException(error, {
            tags: {
                component: 'redis_forwarder',
                action: 'handle_dm_created',
                platform: 'backend'
            },
            extra: {
                message: message.substring(0, 500)
            },
            level: 'error'
        });
    }
}

/**
 * Envoie un message complet à un client WebSocket.
 * @param {object} client - Instance du client WebSocket
 * @param {string} channel - Nom du canal Redis
 * @param {string} channelId - ID du canal
 * @param {string} message - Message à envoyer
 */
function sendFullMessage(client, channel, channelId, message) {
    try {
        client.send(JSON.stringify({
            type: 'redis_message',
            channel: channel,
            channelId: channelId,
            message: message,
            timestamp: new Date().toISOString()
        }));
        logger.info(`[WS] Message Redis COMPLET envoyé à client (userId: ${client.userId}) pour channelId: ${channelId}`);
    } catch (error) {
        logger.error(`[WS] Erreur envoi message complet à client:`, error);

        Sentry.captureException(error, {
            tags: {
                component: 'redis_forwarder',
                action: 'send_full_message',
                platform: 'backend'
            },
            extra: {
                userId: client.userId,
                channelId
            },
            level: 'error'
        });
    }
}

/**
 * Envoie une notification à un client WebSocket.
 * @param {object} client - Instance du client WebSocket
 * @param {string} channelId - ID du canal
 */
function sendNotification(client, channelId) {
    try {
        client.send(JSON.stringify({
            type: 'redis_message_notif',
            channelId: channelId,
            timestamp: new Date().toISOString()
        }));
        logger.info(`[WS] Notification redis_message_notif envoyée à client (userId: ${client.userId}) pour channelId: ${channelId}`);
    } catch (error) {
        logger.error(`[WS] Erreur envoi notification à client:`, error);

        Sentry.captureException(error, {
            tags: {
                component: 'redis_forwarder',
                action: 'send_notification',
                platform: 'backend'
            },
            extra: {
                userId: client.userId,
                channelId
            },
            level: 'error'
        });
    }
}

module.exports = {
    forwardToClients,
    sendFullMessage,
    sendNotification
};