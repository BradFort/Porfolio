/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const WebSocket = require('ws');
const { Sentry } = require('../utils/sentry');
const logger = require('../utils/logger');

/**
 * Notifie un utilisateur qu'il a reçu une nouvelle invitation à rejoindre un channel.
 * @param {object} server - Instance du serveur WebSocket
 * @param {number} recipientUserId - ID de l'utilisateur destinataire
 * @param {object} invitationData - Données de l'invitation
 */
function notifyNewInvitation(server, recipientUserId, invitationData) {
    if (!server.wss) return;

    try {
        let sentCount = 0;
        const userIdStr = String(recipientUserId);

        logger.info(`[Invitation] Diffusion nouvelle invitation vers userId: ${userIdStr}`);
        logger.info(`[Invitation] Clients connectés: ${server.wss.clients.size}`);

        server.wss.clients.forEach(client => {
            logger.info(`[Invitation] Checking client - userId: ${client.userId}, authenticated: ${client.authenticated}, readyState: ${client.readyState}`);

            if (client.readyState === WebSocket.OPEN && client.authenticated && String(client.userId) === userIdStr) {
                try {
                    client.send(JSON.stringify({
                        type: 'new_invitation',
                        invitation_id: invitationData.id,
                        channel: invitationData.channel,
                        inviter: invitationData.inviter,
                        message: invitationData.message,
                        created_at: invitationData.created_at,
                        timestamp: new Date().toISOString()
                    }));
                    sentCount++;
                    logger.info(`[Invitation] Nouvelle invitation envoyée au client (userId: ${client.userId})`);
                } catch (error) {
                    logger.error(`[Invitation] Erreur envoi nouvelle invitation au client:`, error);
                }
            }
        });

        logger.info(`[Invitation] Nouvelle invitation diffusée à ${sentCount} client(s) pour userId: ${recipientUserId}`);

        Sentry.addBreadcrumb({
            category: 'invitation',
            message: 'New invitation sent',
            level: 'info',
            data: {
                recipientUserId,
                invitationId: invitationData.id,
                channelId: invitationData.channel?.id,
                recipientCount: sentCount
            }
        });
    } catch (error) {
        logger.error('[Invitation] Error in notifyNewInvitation:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'invitation_handler',
                action: 'notify_new',
                platform: 'backend'
            },
            extra: {
                recipientUserId,
                invitationData
            },
            level: 'error'
        });
    }
}

/**
 * Notifie l'inviteur et les membres du channel qu'une invitation a été acceptée.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} data - Données de l'invitation acceptée
 */
function notifyInvitationAccepted(server, data) {
    if (!server.wss) return;

    try {
        const { channel_id, inviter_id, user_id, channel, user } = data;
        let sentToInviter = 0;
        let sentToChannelMembers = 0;

        logger.info(`[Invitation] Diffusion invitation acceptée - userId: ${user_id}, channelId: ${channel_id}, inviterId: ${inviter_id}`);

        server.wss.clients.forEach(client => {
            if (client.readyState !== WebSocket.OPEN || !client.authenticated) return;

            try {
                if (String(client.userId) === String(inviter_id)) {
                    client.send(JSON.stringify({
                        type: 'invitation_accepted',
                        channel_id: channel_id,
                        channel: channel,
                        user: user,
                        inviter_id: inviter_id,
                        timestamp: new Date().toISOString()
                    }));
                    sentToInviter++;
                    logger.info(`[Invitation] Notification d'acceptation envoyée à l'inviteur (userId: ${client.userId})`);
                }
                else if (client.subscribedChannelId === String(channel_id) ||
                    client.notificationChannels?.has(String(channel_id))) {
                    client.send(JSON.stringify({
                        type: 'invitation_accepted',
                        channel_id: channel_id,
                        channel: channel,
                        user: user,
                        inviter_id: inviter_id,
                        timestamp: new Date().toISOString()
                    }));
                    sentToChannelMembers++;
                    logger.info(`[Invitation] Notification d'acceptation envoyée au membre du channel (userId: ${client.userId})`);
                }
            } catch (error) {
                logger.error(`[Invitation] Erreur envoi notification d'acceptation:`, error);
            }
        });

        logger.info(`[Invitation] Acceptation diffusée à ${sentToInviter} inviteur(s) et ${sentToChannelMembers} membre(s) du channel`);

        Sentry.addBreadcrumb({
            category: 'invitation',
            message: 'Invitation accepted',
            level: 'info',
            data: {
                userId: user_id,
                channelId: channel_id,
                inviterId: inviter_id,
                sentToInviter,
                sentToChannelMembers
            }
        });
    } catch (error) {
        logger.error('[Invitation] Error in notifyInvitationAccepted:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'invitation_handler',
                action: 'notify_accepted',
                platform: 'backend'
            },
            extra: {
                data
            },
            level: 'error'
        });
    }
}

/**
 * Notifie l'inviteur qu'une invitation a été rejetée.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} data - Données de l'invitation rejetée
 */
function notifyInvitationRejected(server, data) {
    if (!server.wss) return;

    try {
        const { channel_id, inviter_id, user_id, channel, user } = data;
        let sentCount = 0;

        logger.info(`[Invitation] Diffusion invitation refusée - userId: ${user_id}, channelId: ${channel_id}, inviterId: ${inviter_id}`);

        server.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.authenticated && String(client.userId) === String(inviter_id)) {
                try {
                    client.send(JSON.stringify({
                        type: 'invitation_rejected',
                        channel_id: channel_id,
                        channel: channel,
                        user: user,
                        inviter_id: inviter_id,
                        timestamp: new Date().toISOString()
                    }));
                    sentCount++;
                    logger.info(`[Invitation] Notification de refus envoyée à l'inviteur (userId: ${client.userId})`);
                } catch (error) {
                    logger.error(`[Invitation] Erreur envoi notification de refus:`, error);
                }
            }
        });

        logger.info(`[Invitation] Refus diffusé à ${sentCount} inviteur(s)`);

        Sentry.addBreadcrumb({
            category: 'invitation',
            message: 'Invitation rejected',
            level: 'info',
            data: {
                userId: user_id,
                channelId: channel_id,
                inviterId: inviter_id,
                recipientCount: sentCount
            }
        });
    } catch (error) {
        logger.error('[Invitation] Error in notifyInvitationRejected:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'invitation_handler',
                action: 'notify_rejected',
                platform: 'backend'
            },
            extra: {
                data
            },
            level: 'error'
        });
    }
}

module.exports = {
    notifyNewInvitation,
    notifyInvitationAccepted,
    notifyInvitationRejected
};