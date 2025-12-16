/**
 * @fileoverview Service de gestion de la connexion WebSocket et des événements temps réel
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import * as Sentry from '@sentry/react-native';
import CONFIG from '../config/api';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.serverUrl = CONFIG.WS_URL;
        this.eventHandlers = new Map();
        this.userId = null;
        this.username = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = CONFIG.WS_RECONNECT_ATTEMPTS;
        this.reconnectDelay = CONFIG.WS_RECONNECT_DELAY;
        this.isIntentionalDisconnect = false;
    }

    /**
     * Établit une connexion WebSocket au serveur.
     * @param {string} token - Le token d'authentification de l'utilisateur.
     * @param {string} userId - L'ID de l'utilisateur.
     * @param {string} username - Le nom d'utilisateur.
     * @param {string} channel - Le canal à rejoindre.
     * @param {Array<string>} dmChannelIds - Les IDs des canaux de messages directs.
     * @returns {Promise<boolean>} - Une promesse qui se résout en vrai si la connexion est établie avec succès.
     */
    async connect(token, userId, username, channel, dmChannelIds) {
        return new Promise((resolve, reject) => {
            try {
                this.isIntentionalDisconnect = false;
                this.socket = new WebSocket(this.serverUrl);

                this.socket.onopen = () => {
                    this.connected = true;
                    this.reconnectAttempts = 0;

                    Sentry.addBreadcrumb({
                        category: 'websocket',
                        message: 'WebSocket connection established',
                        level: 'info',
                        data: { serverUrl: this.serverUrl, userId, username }
                    });

                    this.authenticate(token, userId, username, channel, dmChannelIds)
                        .then(() => resolve(true))
                        .catch(reject);
                };

                this.socket.onclose = (event) => {
                    this.connected = false;

                    const normalCloseCodes = [
                        1000, // Normal closure
                        1001, // Going away
                        1005, // No status received
                        1006  // Abnormal closure (perte de connexion)
                    ];

                    const isNormalClose = normalCloseCodes.includes(event.code) ||
                        this.isIntentionalDisconnect;

                    Sentry.addBreadcrumb({
                        category: 'websocket',
                        message: 'WebSocket connection closed',
                        level: isNormalClose ? 'info' : 'warning',
                        data: {
                            code: event.code,
                            reason: event.reason,
                            wasClean: event.wasClean,
                            intentional: this.isIntentionalDisconnect
                        }
                    });

                    if (this.userId) {
                        this.emit('disconnected', { code: event.code, reason: event.reason });
                    }

                    this.userId = null;
                    this.username = null;

                    if (!event.wasClean && !this.isIntentionalDisconnect) {
                        this.attemptReconnect();
                    }
                };

                this.socket.onerror = () => {
                    console.log('[WebSocket] Connection error (normal during network issues)');

                    Sentry.addBreadcrumb({
                        category: 'websocket',
                        message: 'WebSocket connection error',
                        level: 'info',
                        data: {
                            serverUrl: this.serverUrl,
                            userId,
                            username,
                            reconnectAttempts: this.reconnectAttempts,
                            error_type: 'network'
                        }
                    });

                    this.attemptReconnect();

                    reject(new Error('WebSocket connection failed'));
                };

                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

            } catch (error) {
                if (!error.message?.includes('WebSocket') &&
                    !error.message?.includes('Network')) {
                    Sentry.captureException(error, {
                        tags: {
                            component: 'websocket',
                            action: 'setup_error',
                            platform: 'mobile'
                        },
                        extra: { serverUrl: this.serverUrl, userId },
                        level: 'error'
                    });
                }
                reject(error);
            }
        });
    }

    /**
     * Authentifie l'utilisateur auprès du serveur WebSocket.
     * @param {string} token - Le token d'authentification de l'utilisateur.
     * @param {string} userId - L'ID de l'utilisateur.
     * @param {string} username - Le nom d'utilisateur.
     * @param {string} channel - Le canal à rejoindre.
     * @param {Array<string>} dmChannelIds - Les IDs des canaux de messages directs.
     * @returns {Promise<Object>} - Une promesse qui se résout avec les données de l'utilisateur si l'authentification réussit.
     */
    async authenticate(token, userId, username, channel, dmChannelIds) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                console.log('[WebSocket] Cannot authenticate - not connected');

                Sentry.addBreadcrumb({
                    category: 'websocket',
                    message: 'Authentication skipped - not connected',
                    level: 'info'
                });

                reject(new Error('Not connected to WebSocket'));
                return;
            }

            const onAuthenticated = (data) => {
                if (data.type === 'authenticated') {
                    this.userId = data.userId;
                    this.username = data.username;

                    Sentry.addBreadcrumb({
                        category: 'websocket',
                        message: 'WebSocket authenticated',
                        level: 'info',
                        data: { userId: data.userId, username: data.username }
                    });

                    this.emit('authenticated', data);
                    cleanup();
                    resolve(data);

                } else if (data.type === 'authentication_error') {
                    if (!data.message?.includes('Unauthorized') &&
                        !data.message?.includes('Invalid token')) {
                        Sentry.captureMessage('WebSocket authentication failed', {
                            level: 'warning',
                            tags: {
                                component: 'websocket',
                                action: 'authenticate_failed',
                                platform: 'mobile'
                            },
                            extra: { error_message: data.message, userId, username }
                        });
                    }

                    cleanup();
                    reject(new Error(data.message));
                }
            };

            const cleanup = () => {
                this.off('__auth_temp__', onAuthenticated);
            };

            this.on('__auth_temp__', onAuthenticated);

            const authMsg = JSON.stringify({
                type: 'authenticate',
                token,
                userId,
                username,
                channel,
                dmChannelIds
            });

            this.socket.send(authMsg);

            setTimeout(() => {
                cleanup();

                Sentry.addBreadcrumb({
                    category: 'websocket',
                    message: 'Authentication timeout',
                    level: 'warning',
                    data: { userId, username, timeout: 10000 }
                });

                reject(new Error('Authentication timeout'));
            }, 10000);
        });
    }

    /**
     * Gère les messages entrants du serveur WebSocket.
     * @param {string} raw - Le message brut reçu du serveur.
     */
    handleMessage(raw) {
        let data;
        try {
            data = JSON.parse(raw);
        } catch (error) {
            if (raw && raw.length > 0) {
                Sentry.captureException(error, {
                    tags: {
                        component: 'websocket',
                        action: 'parse_message',
                        platform: 'mobile'
                    },
                    extra: {
                        raw_message: raw?.substring(0, 200),
                        raw_length: raw?.length
                    },
                    level: 'warning'
                });
            }
            return;
        }

        if (data.type !== 'pong' && data.type !== 'ping') {
            Sentry.addBreadcrumb({
                category: 'websocket',
                message: `WebSocket message received: ${data.type}`,
                level: 'info',
                data: { type: data.type, channelId: data.channelId, userId: data.userId }
            });
        }

        if (data.type === 'authenticated' || data.type === 'authentication_error') {
            this.emit('__auth_temp__', data);
            return;
        }

        if (data.type === 'redis_message') {
            this.emit('new_message', data);
            return;
        }
        if (data.type === 'redis_message_notif') {
            this.emit('message_notification', data);
            return;
        }
        if (data.type === 'redis_userlist_update') {
            this.emit('userlist_update', data);
            return;
        }
        if (data.type === 'new_invitation') {
            this.emit('new_invitation', data);
            return;
        }
        if (data.type === 'invitation_accepted') {
            this.emit('invitation_accepted', data);
            return;
        }
        if (data.type === 'invitation_rejected') {
            this.emit('invitation_rejected', data);
            return;
        }
        if (data.type === 'user_typing_start') {
            this.emit('user_typing_start', data);
            return;
        }
        if (data.type === 'user_typing_stop') {
            this.emit('user_typing_stop', data);
            return;
        }
        if (data.type === 'dm_created') {
            this.emit('dm_created', data);
            return;
        }
        if (data.type === 'user_connected') {
            this.emit('user_connected', data);
            return;
        }
        if (data.type === 'user_disconnected') {
            this.emit('user_disconnected', data);
            return;
        }
        if (data.type === 'channel_online_users') {
            this.emit('channel_online_users', data);
            return;
        }
        if (data.type === 'initial_online_users') {
            this.emit('initial_online_users', data);
            return;
        }

        this.emit(data.type, data);
    }

    /**
     * Tente de se reconnecter au serveur WebSocket en cas de déconnexion.
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            Sentry.addBreadcrumb({
                category: 'websocket',
                message: 'WebSocket reconnect stopped - max attempts reached',
                level: 'warning',
                data: {
                    attempts: this.reconnectAttempts,
                    maxAttempts: this.maxReconnectAttempts
                }
            });

            this.emit('reconnect_failed');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        Sentry.addBreadcrumb({
            category: 'websocket',
            message: `WebSocket reconnect attempt ${this.reconnectAttempts}`,
            level: 'info',
            data: {
                attempt: this.reconnectAttempts,
                maxAttempts: this.maxReconnectAttempts,
                delay
            }
        });

        setTimeout(() => {
            if (!this.connected) {
                this.emit('request_reconnect');
            }
        }, delay);
    }

    /**
     * Souscrit à un canal spécifique pour recevoir des mises à jour.
     * @param {string} channelId - L'ID du canal à souscrire.
     */
    subscribeToChannel(channelId) {
        if (this.socket && this.connected) {
            this.socket.send(JSON.stringify({
                type: 'subscribe',
                channelId: String(channelId)
            }));

            Sentry.addBreadcrumb({
                category: 'websocket',
                message: 'Subscribed to channel',
                level: 'info',
                data: { channelId }
            });
        }
    }

    /**
     * Se désabonne d'un canal spécifique.
     * @param {string} channelId - L'ID du canal à désabonner.
     */
    unsubscribeFromChannel(channelId) {
        if (this.socket && this.connected) {
            this.socket.send(JSON.stringify({
                type: 'unsubscribe',
                channelId: String(channelId)
            }));
        }
    }

    /**
     * Souscrit aux notifications pour une liste de canaux.
     * @param {Array<string>} channelIds - Les IDs des canaux à souscrire pour les notifications.
     */
    subscribeToNotifications(channelIds) {
        if (this.socket && this.connected) {
            this.socket.send(JSON.stringify({
                type: 'subscribe_notifications',
                channelIds: channelIds.map(id => String(id))
            }));
        }
    }

    /**
     * Indique le début de la saisie de l'utilisateur dans un canal.
     * @param {string} channelId - L'ID du canal où l'utilisateur tape.
     */
    startTyping(channelId) {
        if (this.socket && this.connected && channelId) {
            this.socket.send(JSON.stringify({
                type: 'typing_start',
                channelId: String(channelId)
            }));
        }
    }

    /**
     * Indique la fin de la saisie de l'utilisateur dans un canal.
     * @param {string} channelId - L'ID du canal où l'utilisateur a fini de taper.
     */
    stopTyping(channelId) {
        if (this.socket && this.connected && channelId) {
            this.socket.send(JSON.stringify({
                type: 'typing_stop',
                channelId: String(channelId)
            }));
        }
    }

    /**
     * Ajoute un gestionnaire d'événement pour un événement spécifique.
     * @param {string} event - Le nom de l'événement.
     * @param {Function} handler - La fonction à appeler lorsque l'événement se produit.
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Supprime un gestionnaire d'événement pour un événement spécifique.
     * @param {string} event - Le nom de l'événement.
     * @param {Function} handler - La fonction à supprimer.
     */
    off(event, handler) {
        if (!this.eventHandlers.has(event)) return;
        const handlers = this.eventHandlers.get(event);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * Émet un événement avec des données vers tous les gestionnaires d'événements abonnés.
     * @param {string} event - Le nom de l'événement à émettre.
     * @param {Object} data - Les données à envoyer avec l'événement.
     */
    emit(event, data) {
        if (!this.eventHandlers.has(event)) return;
        this.eventHandlers.get(event).forEach((handler) => {
            try {
                handler(data);
            } catch (error) {
                // Capturer seulement les vraies erreurs de handler
                if (!error.message?.includes('Network') &&
                    !error.message?.includes('undefined')) {
                    console.error(`Event handler error (${event}):`, error);

                    Sentry.captureException(error, {
                        tags: {
                            component: 'websocket',
                            action: 'event_handler',
                            event_type: event,
                            platform: 'mobile'
                        },
                        extra: { event, data },
                        level: 'warning'
                    });
                }
            }
        });
    }

    /**
     * Se déconnecte manuellement du serveur WebSocket.
     */
    disconnect() {
        this.isIntentionalDisconnect = true;

        Sentry.addBreadcrumb({
            category: 'websocket',
            message: 'WebSocket manual disconnect',
            level: 'info',
            data: { userId: this.userId, username: this.username }
        });

        if (this.socket) {
            this.socket.close(1000, 'User disconnect');
            this.socket = null;
            this.connected = false;
            this.userId = null;
            this.username = null;
            this.reconnectAttempts = 0;
        }
    }

    /**
     * Vérifie si la connexion WebSocket est actuellement établie.
     * @returns {boolean} - Vrai si connecté, faux sinon.
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Renvoie l'état actuel de la connexion WebSocket.
     * @returns {Object} - Un objet contenant l'état de la connexion.
     */
    getStatus() {
        return {
            connected: this.connected,
            userId: this.userId,
            username: this.username,
            serverUrl: this.serverUrl,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

export default new WebSocketService();