/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const { Sentry } = require('../utils/sentry');
const logger = require('../utils/logger');
const {
    broadcastUserConnected,
    sendChannelOnlineUsers,
    broadcastChannelPresenceUpdate,
    getAllOnlineUsers
} = require('./PresenceHandler');

/**
 * Gère l'authentification d'un utilisateur et l'initialise avec ses channels DM.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} ws - Connexion WebSocket du client
 * @param {object} data - Données d'authentification (userId, username, dmChannelIds)
 */
function handleAuthentication(server, ws, data) {
    try {
        ws.userId = data.userId;
        ws.username = data.username;
        ws.authenticated = true;

        Sentry.setUser({
            id: data.userId,
            username: data.username
        });

        if (data.dmChannelIds && Array.isArray(data.dmChannelIds)) {
            ws.notificationChannels.clear();
            data.dmChannelIds.forEach(channelId => {
                ws.notificationChannels.add(channelId.toString());
            });
            server.userNotifications.set(ws.userId, new Set(data.dmChannelIds.map(id => id.toString())));
            logger.info(`[WS] Auto-abonnement aux notifications DM pour channels: [${data.dmChannelIds.join(', ')}]`);
        }

        ws.send(JSON.stringify({
            type: 'authenticated',
            success: true,
            userId: data.userId,
            username: data.username,
            dmChannelIds: data.dmChannelIds || []
        }));

        logger.info(`[WS] Client authentifié: ${data.username || 'unknown'} (userId: ${data.userId}) avec ${data.dmChannelIds?.length || 0} DM channels`);

        Sentry.addBreadcrumb({
            category: 'auth',
            message: 'User authenticated',
            level: 'info',
            data: {
                userId: data.userId,
                username: data.username,
                dmChannelCount: data.dmChannelIds?.length || 0
            }
        });

        const onlineUsers = getAllOnlineUsers(server);
        ws.send(JSON.stringify({
            type: 'initial_online_users',
            users: onlineUsers,
            timestamp: new Date().toISOString()
        }));
        logger.info(`[WS] Sent initial online users list: ${onlineUsers.length} users`);

        broadcastUserConnected(server, data.userId, data.username);
    } catch (error) {
        logger.error('[WS] Error in handleAuthentication:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'message_handler',
                action: 'authenticate',
                platform: 'backend'
            },
            extra: {
                userId: data?.userId,
                username: data?.username
            },
            level: 'error'
        });
    }
}

/**
 * Gère l'abonnement d'un utilisateur à un channel spécifique pour recevoir les messages.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} ws - Connexion WebSocket du client
 * @param {object} data - Données d'abonnement (channelId)
 */
function handleSubscribe(server, ws, data) {
    try {
        const channelId = data.channelId?.toString();

        if (!channelId) {
            logger.warn('[WS] Subscribe sans channelId');
            return;
        }

        if (ws.subscribedChannelId) {
            logger.info(`[WS] Désabonnement automatique du channelId: ${ws.subscribedChannelId}`);
            broadcastChannelPresenceUpdate(server, ws.subscribedChannelId);
        }

        ws.subscribedChannelId = channelId;
        server.userChannels.set(ws.userId, channelId);

        ws.send(JSON.stringify({
            type: 'subscribed',
            channelId: channelId,
            success: true
        }));

        logger.info(`[WS] Client (userId: ${ws.userId}) souscrit au channelId: ${channelId}`);

        Sentry.addBreadcrumb({
            category: 'channel',
            message: 'User subscribed to channel',
            level: 'info',
            data: {
                userId: ws.userId,
                channelId: channelId
            }
        });

        sendChannelOnlineUsers(server, ws, channelId);
        broadcastChannelPresenceUpdate(server, channelId);
    } catch (error) {
        logger.error('[WS] Error in handleSubscribe:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'message_handler',
                action: 'subscribe',
                platform: 'backend'
            },
            extra: {
                userId: ws.userId,
                channelId: data?.channelId
            },
            level: 'error'
        });
    }
}

/**
 * Gère le désabonnement d'un utilisateur d'un channel.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} ws - Connexion WebSocket du client
 */
function handleUnsubscribe(server, ws) {
    try {
        const oldChannelId = ws.subscribedChannelId;
        ws.subscribedChannelId = null;

        if (ws.userId) {
            server.userChannels.delete(ws.userId);
        }

        ws.send(JSON.stringify({
            type: 'unsubscribed',
            channelId: oldChannelId,
            success: true
        }));

        logger.info(`[WS] Client (userId: ${ws.userId}) désouscrit du channelId: ${oldChannelId}`);

        Sentry.addBreadcrumb({
            category: 'channel',
            message: 'User unsubscribed from channel',
            level: 'info',
            data: {
                userId: ws.userId,
                channelId: oldChannelId
            }
        });

        if (oldChannelId) {
            broadcastChannelPresenceUpdate(server, oldChannelId);
        }
    } catch (error) {
        logger.error('[WS] Error in handleUnsubscribe:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'message_handler',
                action: 'unsubscribe',
                platform: 'backend'
            },
            extra: {
                userId: ws.userId
            },
            level: 'error'
        });
    }
}

/**
 * Gère l'abonnement d'un utilisateur aux notifications pour plusieurs channels (DM).
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} ws - Connexion WebSocket du client
 * @param {object} data - Données d'abonnement (channelIds: Array)
 */
function handleSubscribeNotifications(server, ws, data) {
    try {
        const channelIds = data.channelIds;

        if (!Array.isArray(channelIds)) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'channelIds doit être un array'
            }));
            return;
        }

        ws.notificationChannels.clear();

        channelIds.forEach(channelId => {
            ws.notificationChannels.add(channelId.toString());
        });

        server.userNotifications.set(ws.userId, new Set(channelIds.map(id => id.toString())));

        ws.send(JSON.stringify({
            type: 'notifications_subscribed',
            channelIds: channelIds,
            success: true
        }));
        logger.info(`[WS] Client (userId: ${ws.userId}) souscrit aux notifications pour channels: [${channelIds.join(', ')}]`);

        Sentry.addBreadcrumb({
            category: 'notifications',
            message: 'User subscribed to notifications',
            level: 'info',
            data: {
                userId: ws.userId,
                channelCount: channelIds.length
            }
        });
    } catch (error) {
        logger.error('[WS] Error in handleSubscribeNotifications:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'message_handler',
                action: 'subscribe_notifications',
                platform: 'backend'
            },
            extra: {
                userId: ws.userId,
                channelIds: data?.channelIds
            },
            level: 'error'
        });
    }
}

/**
 * Gère le désabonnement d'un utilisateur de toutes les notifications.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} ws - Connexion WebSocket du client
 */
function handleUnsubscribeNotifications(server, ws) {
    try {
        ws.notificationChannels.clear();
        server.userNotifications.delete(ws.userId);

        ws.send(JSON.stringify({
            type: 'notifications_unsubscribed',
            success: true
        }));
        logger.info(`[WS] Client (userId: ${ws.userId}) désouscrit de toutes les notifications`);

        Sentry.addBreadcrumb({
            category: 'notifications',
            message: 'User unsubscribed from all notifications',
            level: 'info',
            data: {
                userId: ws.userId
            }
        });
    } catch (error) {
        logger.error('[WS] Error in handleUnsubscribeNotifications:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'message_handler',
                action: 'unsubscribe_notifications',
                platform: 'backend'
            },
            extra: {
                userId: ws.userId
            },
            level: 'error'
        });
    }
}

/**
 * Gère l'événement indiquant qu'un utilisateur commence à taper un message dans un channel.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} ws - Connexion WebSocket du client
 * @param {object} data - Données de l'événement (channelId)
 */
function handleTypingStart(server, ws, data) {
    try {
        const { channelId } = data;

        if (!channelId || !ws.userId || !ws.username) {
            logger.warn('[WS] Typing start sans channelId, userId ou username');
            return;
        }

        logger.info(`[WS] ${ws.username} (userId: ${ws.userId}) started typing in channel ${channelId}`);

        const channelIdStr = channelId.toString();
        let broadcastCount = 0;

        server.wss.clients.forEach(client => {
            if (client !== ws &&
                client.readyState === 1 &&
                client.authenticated &&
                client.subscribedChannelId === channelIdStr) {

                try {
                    client.send(JSON.stringify({
                        type: 'user_typing_start',
                        channelId: channelIdStr,
                        userId: ws.userId,
                        username: ws.username,
                        timestamp: new Date().toISOString()
                    }));
                    broadcastCount++;
                } catch (error) {
                    logger.error('[WS] Error sending typing start:', error);
                }
            }
        });

        logger.info(`[WS] Typing start broadcasted to ${broadcastCount} client(s) in channel ${channelId}`);
    } catch (error) {
        logger.error('[WS] Error in handleTypingStart:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'message_handler',
                action: 'typing_start',
                platform: 'backend'
            },
            extra: {
                userId: ws.userId,
                channelId: data?.channelId
            },
            level: 'warning'
        });
    }
}

/**
 * Gère l'événement indiquant qu'un utilisateur arrête de taper un message dans un channel.
 * @param {object} server - Instance du serveur WebSocket
 * @param {object} ws - Connexion WebSocket du client
 * @param {object} data - Données de l'événement (channelId)
 */
function handleTypingStop(server, ws, data) {
    try {
        const { channelId } = data;

        if (!channelId || !ws.userId || !ws.username) {
            logger.warn('[WS] Typing stop sans channelId, userId ou username');
            return;
        }

        logger.info(`[WS] ${ws.username} (userId: ${ws.userId}) stopped typing in channel ${channelId}`);

        const channelIdStr = channelId.toString();
        let broadcastCount = 0;

        server.wss.clients.forEach(client => {
            if (client !== ws &&
                client.readyState === 1 &&
                client.authenticated &&
                client.subscribedChannelId === channelIdStr) {

                try {
                    client.send(JSON.stringify({
                        type: 'user_typing_stop',
                        channelId: channelIdStr,
                        userId: ws.userId,
                        username: ws.username,
                        timestamp: new Date().toISOString()
                    }));
                    broadcastCount++;
                } catch (error) {
                    logger.error('[WS] Error sending typing stop:', error);
                }
            }
        });

        logger.info(`[WS] Typing stop broadcasted to ${broadcastCount} client(s) in channel ${channelId}`);
    } catch (error) {
        logger.error('[WS] Error in handleTypingStop:', error);

        Sentry.captureException(error, {
            tags: {
                component: 'message_handler',
                action: 'typing_stop',
                platform: 'backend'
            },
            extra: {
                userId: ws.userId,
                channelId: data?.channelId
            },
            level: 'warning'
        });
    }
}

module.exports = {
    handleAuthentication,
    handleSubscribe,
    handleUnsubscribe,
    handleSubscribeNotifications,
    handleUnsubscribeNotifications,
    handleTypingStart,
    handleTypingStop
};