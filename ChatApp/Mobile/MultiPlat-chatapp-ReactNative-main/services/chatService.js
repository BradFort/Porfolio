/**
 * @fileoverview Service de gestion de la logique de chat (messages, canaux, DMs, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import * as Sentry from '@sentry/react-native';
import websocketService from './websocketService';
import authService from './authService';
import i18n from "../constants/language/js/i18n";
import * as notificationService from './notificationService';

/**
 * Service principal de gestion du chat
 * Orchestre la connexion WebSocket, les événements et les notifications
 * Gère la reconnexion automatique en cas de déconnexion
 * @class ChatService
 */
class ChatService {
    /**
     * Initialise le service de chat
     * Configure les gestionnaires d'événements WebSocket
     * @constructor
     */
    constructor() {
        this.websocketService = websocketService;
        this.isWebSocketConnected = false;
        this.eventHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 2000;
        this.isReconnecting = false;
        this.setupWebSocketEvents();
    }

    /**
     * Configure les gestionnaires d'événements WebSocket
     * Écoute tous les événements du serveur et émet les événements locaux
     * Gère les notifications pour invitations, nouveaux messages, etc.
     * @returns {void}
     */
    setupWebSocketEvents() {
        websocketService.on('new_message', (data) => {
            this.emit('new_message', data);
        });

        websocketService.on('message_notification', (data) => {
            this.emit('message_notification', data);
        });

        websocketService.on('userlist_update', (data) => {
            this.emit('userlist_update', data);
        });

        websocketService.on('new_invitation', (data) => {
            try {
                const from = data.inviterName || data.username || data.from || (data.user && (data.user.username || data.user.name)) || '';
                const channel = data.channelName || data.channel || data.channelId || '';
                const text = i18n.t('invitationNew', { from, channel });
                notificationService.info(text, 3000, 'channel');
            } catch (_e) {}
            this.emit('new_invitation', data);
        });

        websocketService.on('invitation_accepted', (data) => {
            try {
                const user = data.username || (data.user && (data.user.username || data.user.name)) || '';
                const channel = data.channelName || data.channel || data.channelId || '';
                const text = i18n.t('invitationAccepted', { user, channel });
                notificationService.success(text, 3000, 'channel');
            } catch (_e) {}
            this.emit('invitation_accepted', data);
        });

        websocketService.on('invitation_rejected', (data) => {
            try {
                const user = data.username || (data.user && (data.user.username || data.user.name)) || '';
                const channel = data.channelName || data.channel || data.channelId || '';
                const text = i18n.t('invitationRejected', { user, channel });
                notificationService.warning(text, 3000, 'channel');
            } catch (_e) {}
            this.emit('invitation_rejected', data);
        });

        websocketService.on('user_typing_start', (data) => {
            this.emit('user_typing_start', data);
        });

        websocketService.on('user_typing_stop', (data) => {
            this.emit('user_typing_stop', data);
        });

        websocketService.on('dm_created', (data) => {
            try {
                const other = data.username || (data.other && (data.other.username || data.other.name)) || '';
                const text = other ? i18n.t('newDirectMessageFrom', { user: other }) : i18n.t('newDirectMessage');
                notificationService.dmNotification(text);
            } catch (_e) {}
            this.emit('dm_created', data);
        });

        const genericJoinLeave = [
            'user_joined', 'user_left',
            'joined_channel', 'left_channel',
            'user_join', 'user_leave',
            'status_changed', 'presence_update'
        ];

        genericJoinLeave.forEach((evt) => {
            websocketService.on(evt, (data) => {
                this.emit(evt, data);
            });
        });

        websocketService.on('user_connected', (data) => {
            this.emit('user_connected', data);
        });

        websocketService.on('user_disconnected', (data) => {
            this.emit('user_disconnected', data);
        });

        websocketService.on('channel_online_users', (data) => {
            this.emit('channel_online_users', data);
        });

        websocketService.on('initial_online_users', (data) => {
            this.emit('initial_online_users', data);
        });

        websocketService.on('dm_e2ee_enabled', (data) => {
            this.emit('dm_e2ee_enabled', data);
        });

        websocketService.on('dm_e2ee_disabled', (data) => {
            this.emit('dm_e2ee_disabled', data);
        });

        websocketService.on('disconnected', () => {
            this.isWebSocketConnected = false;
            this.emit('websocket_disconnected');
        });

        websocketService.on('authenticated', () => {
            this.isWebSocketConnected = true;
            this.reconnectAttempts = 0;
            this.isReconnecting = false;
            this.emit('websocket_connected');
        });

        websocketService.on('reconnect_failed', () => {
            this.emit('websocket_failed');
        });

        websocketService.on('request_reconnect', async () => {
            const token = await authService.getToken();
            const user = await authService.getStoredUser();
            if (token && user) {
                await this.connectWebSocket(token, user);
            }
        });
    }

    /**
     * Connecte le WebSocket pour l'utilisateur
     * Gère les tentatives de reconnexion en cas d'échec
     * @async
     * @param {string} token - Token d'authentification JWT
     * @param {Object} user - Données de l'utilisateur
     * @param {number|null} [channelId=null] - ID du canal à rejoindre (optionnel)
     * @param {Array} [dmChannelIds=[]] - IDs des canaux DM à rejoindre
     * @param {boolean} [silentFail=false] - Si true, ne pas afficher d'erreur en cas d'échec
     * @returns {Promise<boolean>} True si la connexion réussit
     */
    async connectWebSocket(token, user, channelId = null, dmChannelIds = [], silentFail = false) {
        if (!user || !token) {
            return false;
        }

        if (this.isReconnecting) {
            return false;
        }

        try {
            this.isReconnecting = true;

            await websocketService.connect(
                token,
                user.id,
                user.name,
                channelId,
                dmChannelIds
            );

            this.isWebSocketConnected = true;
            this.reconnectAttempts = 0;
            this.isReconnecting = false;
            return true;

        } catch (error) {
            this.isWebSocketConnected = false;
            this.isReconnecting = false;

            Sentry.captureException(error, {
                tags: { component: 'chat', action: 'connect_websocket', platform: 'mobile' },
                extra: { user_id: user.id, silentFail },
                level: 'error'
            });

            if (silentFail) {
                return false;
            }

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = this.reconnectDelay * this.reconnectAttempts;

                setTimeout(() => {
                    this.connectWebSocket(token, user, channelId, dmChannelIds, true);
                }, delay);

                return false;
            } else {
                this.reconnectAttempts = 0;
                return false;
            }
        }
    }

    /**
     * Déconnecte le WebSocket
     * Réinitialise les tentatives de reconnexion
     * @returns {void}
     */
    disconnectWebSocket() {
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        websocketService.disconnect();
        this.isWebSocketConnected = false;
    }

    /**
     * Force la reconnexion du WebSocket
     * Réinitialise les tentatives et reconnecte avec le token stocké
     * @async
     * @returns {Promise<boolean>} True si la reconnexion réussit
     */
    async forceReconnect() {
        const token = await authService.getToken();
        const user = await authService.getStoredUser();

        if (token && user) {
            this.reconnectAttempts = 0;
            this.isReconnecting = false;
            return await this.connectWebSocket(token, user);
        }

        return false;
    }

    /**
     * Déconnecte le WebSocket (alias de disconnectWebSocket)
     * @returns {void}
     */
    disconnect() {
        this.disconnectWebSocket();
    }

    /**
     * Enregistre un gestionnaire d'événement
     * @param {string} event - Nom de l'événement
     * @param {Function} handler - Fonction à appeler lors de l'événement
     * @returns {void}
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Retire un gestionnaire d'événement
     * @param {string} event - Nom de l'événement
     * @param {Function} handler - Fonction à retirer
     * @returns {void}
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
     * Émet un événement vers tous les gestionnaires enregistrés
     * @param {string} event - Nom de l'événement
     * @param {any} data - Données à envoyer avec l'événement
     * @returns {void}
     */
    emit(event, data) {
        if (!this.eventHandlers.has(event)) return;
        this.eventHandlers.get(event).forEach((handler) => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Event handler error (${event}):`, error);
            }
        });
    }

    /**
     * Vérifie si le WebSocket est actif
     * @returns {boolean} True si le WebSocket est connecté
     */
    isWebSocketActive() {
        return this.isWebSocketConnected;
    }

    /**
     * Retourne le statut du WebSocket
     * @returns {string|undefined} Statut du WebSocket
     */
    getWebSocketStatus() {
        return websocketService.getStatus();
    }
}

export default new ChatService();