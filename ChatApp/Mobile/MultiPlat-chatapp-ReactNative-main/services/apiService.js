/**
 * @fileoverview Service principal d'accès à l'API REST (requêtes, endpoints, helpers, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { MESSAGE_MAX_LENGTH } from '../app/constants';
import CONFIG from '../config/api';
import * as notificationService from './notificationService';

/**
 * Service de communication avec l'API REST
 * Gère toutes les requêtes HTTP vers le backend
 * Inclut la gestion des erreurs, de l'authentification et du suivi Sentry
 * @class APIService
 */
class APIService {
    /**
     * Initialise le service API avec l'URL de base et les paramètres par défaut
     * @constructor
     */
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.onUnauthorized = null;
        this.isOffline = false;
    }

    /**
     * Définit le callback à appeler lors d'une erreur 401 (non autorisé)
     * @param {Function} callback - Fonction à appeler en cas d'erreur d'authentification
     * @returns {void}
     */
    setUnauthorizedHandler(callback) {
        this.onUnauthorized = callback;
    }

    /**
     * Définit l'état hors ligne de l'application
     * @param {boolean} isOffline - True si l'application est hors ligne
     * @returns {void}
     */
    setOfflineStatus(isOffline) {
        this.isOffline = isOffline;
    }

    /**
     * Génère les headers HTTP pour les requêtes API
     * Inclut le token d'authentification s'il existe
     * @async
     * @param {boolean} isFormData - True si la requête contient du FormData (défaut: false)
     * @returns {Promise<Object>} Headers HTTP avec token d'authentification
     */
    async getHeaders(isFormData = false) {
        const token = await AsyncStorage.getItem('token');
        const headers = {
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        // Don't set Content-Type for FormData - let the browser set it with boundary
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }

    /**
     * Vérifie si une erreur est une erreur réseau
     * @param {Error} error - L'erreur à vérifier
     * @returns {boolean} True si c'est une erreur réseau
     */
    isNetworkError(error) {
        const networkErrors = [
            'Network request failed',
            'Failed to fetch',
            'NetworkError',
            'TypeError: Network',
            'timeout',
            'AbortError'
        ];

        return networkErrors.some(msg =>
            error?.message?.includes(msg)
        );
    }

    /**
     * Effectue une requête HTTP vers l'API
     * Gère automatiquement les headers, l'authentification, les erreurs et le logging Sentry
     * @async
     * @param {string} endpoint - Endpoint de l'API (ex: '/channels', '/messages/1')
     * @param {Object} options - Options de la requête fetch (method, body, headers, etc.)
     * @returns {Promise<Object>} Objet de réponse avec {success: boolean, data: any, status: number}
     */
    async request(endpoint, options = {}) {
        const method = options.method || 'GET';

        Sentry.addBreadcrumb({
            category: 'api',
            message: `API ${method} ${endpoint}`,
            level: 'info',
            data: { method, endpoint }
        });

        try {
            const headers = await this.getHeaders();
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: { ...headers, ...options.headers }
            });

            if (response.status === 401) {
                const hasToken = await AsyncStorage.getItem('token');

                if (this.isOffline || !hasToken) {
                    Sentry.addBreadcrumb({
                        category: 'api',
                        message: 'Expected 401 - No token or offline',
                        level: 'info',
                        data: { endpoint, isOffline: this.isOffline, hasToken: !!hasToken }
                    });
                } else {
                    Sentry.captureMessage('Unexpected 401 with valid token', {
                        level: 'warning',
                        tags: {
                            component: 'api',
                            action: 'unexpected_unauthorized',
                            platform: 'mobile'
                        },
                        extra: { endpoint, method }
                    });
                }

                if (typeof this.onUnauthorized === 'function') {
                    try { this.onUnauthorized(); } catch (_e) { }
                }

                return {
                    success: false,
                    data: { message: 'Unauthorized' },
                    status: 401,
                    unauthorized: true
                };
            }

            const text = await response.text();
            const cleanText = text.charCodeAt(0) === 65279 ? text.slice(1) : text;
            const data = cleanText ? JSON.parse(cleanText) : {};

            if (response.status === 429) {
                try {
                    const message = data && (data.message || data.error);
                    notificationService.error(message, 5000);
                } catch (e) {
                    console.warn('[API] 429 notification not shown:', e);
                }
            }

            if (response.status >= 500) {
                Sentry.captureMessage(`Server Error ${response.status}: ${method} ${endpoint}`, {
                    level: 'error',
                    tags: {
                        component: 'api',
                        action: 'server_error',
                        platform: 'mobile',
                        http_status: response.status.toString()
                    },
                    extra: {
                        endpoint,
                        method,
                        status: response.status,
                        response_data: data
                    }
                });
            }

            return {
                success: response.ok,
                data,
                status: response.status
            };

        } catch (error) {
            // Ne capturer que les vraies erreurs, pas les erreurs réseau
            if (!this.isNetworkError(error)) {
                Sentry.captureException(error, {
                    tags: {
                        component: 'api',
                        action: 'unexpected_error',
                        platform: 'mobile'
                    },
                    extra: { endpoint, method },
                    level: 'error'
                });
            } else {
                Sentry.addBreadcrumb({
                    category: 'api',
                    message: 'Network error (expected)',
                    level: 'info',
                    data: {
                        endpoint,
                        method,
                        error: error.message,
                        isOffline: this.isOffline
                    }
                });
            }

            return {
                success: false,
                error: error.message,
                isNetworkError: this.isNetworkError(error)
            };
        }
    }

    // ===== CHANNELS =====

    /**
     * Récupère tous les canaux (publics, privés et DMs) de l'utilisateur
     * @async
     * @returns {Promise<Object>} Réponse avec la liste des canaux
     */
    async getChannels() {
        return this.request('/channel');
    }

    /**
     * Récupère uniquement les canaux publics
     * @async
     * @returns {Promise<Object>} Réponse avec la liste des canaux publics
     */
    async getPublicChannels() {
        return this.request('/channel/public');
    }

    /**
     * Récupère les canaux dont l'utilisateur est membre
     * @async
     * @returns {Promise<Object>} Réponse avec la liste des canaux de l'utilisateur
     */
    async getMyChannels() {
        return this.request('/my-channels');
    }

    /**
     * Récupère un canal spécifique par son ID
     * @async
     * @param {number} channelId - ID du canal à récupérer
     * @returns {Promise<Object>} Réponse avec les détails du canal
     */
    async getChannel(channelId) {
        return this.request(`/channel/${channelId}`);
    }

    /**
     * Crée un nouveau canal (public ou privé)
     * @async
     * @param {Object} channelData - Données du canal (name, description, type, etc.)
     * @returns {Promise<Object>} Réponse avec le canal créé
     */
    async createChannel(channelData) {
        return this.request('/channel', {
            method: 'POST',
            body: JSON.stringify(channelData)
        });
    }

    /**
     * Met à jour un canal existant
     * @async
     * @param {number} channelId - ID du canal à mettre à jour
     * @param {Object} channelData - Nouvelles données du canal
     * @returns {Promise<Object>} Réponse avec le canal mis à jour
     */
    async updateChannel(channelId, channelData) {
        return this.request(`/channel/${channelId}`, {
            method: 'PUT',
            body: JSON.stringify(channelData)
        });
    }

    /**
     * Supprime un canal
     * @async
     * @param {number} channelId - ID du canal à supprimer
     * @returns {Promise<Object>} Réponse de confirmation
     */
    async deleteChannel(channelId) {
        return this.request(`/channel/${channelId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Rejoint un canal
     * @async
     * @param {number} channelId - ID du canal à rejoindre
     * @param {number} userId - ID de l'utilisateur qui rejoint
     * @returns {Promise<Object>} Réponse de confirmation
     */
    async joinChannel(channelId, userId) {
        return this.request(`/channel/${channelId}/join`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId })
        });
    }

    /**
     * Quitte un canal
     * @async
     * @param {number} channelId - ID du canal à quitter
     * @returns {Promise<Object>} Réponse de confirmation
     */
    async leaveChannel(channelId) {
        return this.request(`/channel/${channelId}/leave`, {
            method: 'POST'
        });
    }

    /**
     * Récupère la liste des membres d'un canal
     * @async
     * @param {number} channelId - ID du canal
     * @returns {Promise<Object>} Réponse avec la liste des membres
     */
    async getChannelMembers(channelId) {
        return this.request(`/channel/${channelId}/user`);
    }

    // ===== MESSAGES =====

    /**
     * Récupère les messages d'un canal
     * @async
     * @param {number} channelId - ID du canal
     * @param {number} limit - Nombre maximum de messages à récupérer (défaut: 50)
     * @returns {Promise<Object>} Réponse avec la liste des messages
     */
    async getMessages(channelId, limit = 50) {
        return this.request(`/channel/${channelId}/message?limit=${limit}`);
    }

    /**
     * Envoie un message dans un canal
     * Valide la longueur du message avant l'envoi
     * @async
     * @param {number} channelId - ID du canal
     * @param {Object} messageData - Données du message (content, etc.)
     * @returns {Promise<Object>} Réponse avec le message créé
     */
    async sendMessage(channelId, messageData) {
        // Validation côté client avant l'envoi
        if (messageData.content && messageData.content.length > MESSAGE_MAX_LENGTH) {
            return {
                success: false,
                status: 400,
                data: {
                    message: `Le message ne peut pas dépasser ${MESSAGE_MAX_LENGTH} caractères.`,
                    error: 'MESSAGE_TOO_LONG'
                }
            };
        }

        return this.request(`/channel/${channelId}/message`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    async getMessage(channelId, messageId) {
        return this.request(`/channel/${channelId}/message/${messageId}`);
    }

    async deleteMessage(messageId) {
        return this.request(`/message/${messageId}`, {
            method: 'DELETE'
        });
    }

    // ===== DMs =====
    async getDMs() {
        return this.request('/dm');
    }

    async createDM(dmData) {
        return this.request('/dm', {
            method: 'POST',
            body: JSON.stringify(dmData)
        });
    }

    async getDM(dmId) {
        return this.request(`/dm/${dmId}`);
    }

    async getDMMessages(dmId, limit = 50) {
        return this.request(`/dm/${dmId}/message?limit=${limit}`);
    }

    async sendDMMessage(dmId, messageData) {
        // Validation côté client avant l'envoi
        if (messageData.content && messageData.content.length > MESSAGE_MAX_LENGTH) {
            return {
                success: false,
                status: 400,
                data: {
                    message: `Le message ne peut pas dépasser ${MESSAGE_MAX_LENGTH} caractères.`,
                    error: 'MESSAGE_TOO_LONG'
                }
            };
        }

        return this.request(`/dm/${dmId}/message`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    // ===== VOICE MESSAGES & FILE ATTACHMENTS =====

    /**
     * Send a voice message to a channel
     * @param {number} channelId - Channel ID
     * @param {object} audioFile - Audio file object with uri, name, type
     * @param {number} duration - Duration in seconds
     * @returns {Promise<object>} API response
     */
    async sendVoiceMessage(channelId, audioFile, duration) {
        const formData = new FormData();
        formData.append('type', 'voice');
        formData.append('duration', duration.toString());
        formData.append('voice_message', {
            uri: audioFile.uri,
            type: 'audio/mp4',
            name: audioFile.name || `voice_${Date.now()}.m4a`
        });

        const token = await AsyncStorage.getItem('token');
        const url = `${this.baseURL}/channel/${channelId}/message`;

        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();

            xhr.onload = () => {
                try {
                    const cleanText = xhr.responseText.charCodeAt(0) === 65279
                        ? xhr.responseText.slice(1)
                        : xhr.responseText;
                    const data = cleanText ? JSON.parse(cleanText) : {};

                    resolve({
                        success: xhr.status >= 200 && xhr.status < 300,
                        data,
                        status: xhr.status
                    });
                } catch (error) {
                    resolve({ success: false, error: error.message, status: xhr.status });
                }
            };

            xhr.onerror = () => resolve({ success: false, error: 'Network error', isNetworkError: true });
            xhr.ontimeout = () => resolve({ success: false, error: 'Request timeout', isNetworkError: true });

            xhr.open('POST', url);
            xhr.timeout = 60000;
            xhr.setRequestHeader('Accept', 'application/json');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    }

    /**
     * Send a voice message to a DM
     * @param {number} dmId - DM ID
     * @param {object} audioFile - Audio file object with uri, name, type
     * @param {number} duration - Duration in seconds
     * @returns {Promise<object>} API response
     */
    async sendDMVoiceMessage(dmId, audioFile, duration) {
        const formData = new FormData();
        formData.append('type', 'voice');
        formData.append('duration', duration.toString());
        formData.append('voice_message', {
            uri: audioFile.uri,
            type: 'audio/mp4',
            name: audioFile.name || `voice_${Date.now()}.m4a`
        });

        const token = await AsyncStorage.getItem('token');
        const url = `${this.baseURL}/dm/${dmId}/message`;

        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();

            xhr.onload = () => {
                try {
                    const cleanText = xhr.responseText.charCodeAt(0) === 65279
                        ? xhr.responseText.slice(1)
                        : xhr.responseText;
                    const data = cleanText ? JSON.parse(cleanText) : {};

                    resolve({
                        success: xhr.status >= 200 && xhr.status < 300,
                        data,
                        status: xhr.status
                    });
                } catch (error) {
                    resolve({ success: false, error: error.message, status: xhr.status });
                }
            };

            xhr.onerror = () => resolve({ success: false, error: 'Network error', isNetworkError: true });
            xhr.ontimeout = () => resolve({ success: false, error: 'Request timeout', isNetworkError: true });

            xhr.open('POST', url);
            xhr.timeout = 60000;
            xhr.setRequestHeader('Accept', 'application/json');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    }

    /**
     * Send a file attachment to a channel
     * @param {number} channelId
     * @param {object} file - { uri, name, type, size }
     */
    async sendFileAttachment(channelId, file) {
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size && file.size > MAX_FILE_SIZE) {
            return {
                success: false,
                status: 413,
                data: { message: `Le fichier ne peut pas dépasser ${MAX_FILE_SIZE / 1024 / 1024}MB.`, error: 'FILE_TOO_LARGE' }
            };
        }

        const fileName = file.name || `file_${Date.now()}`;
        const ext = fileName.split('.').pop()?.toLowerCase();

        const mimeMap = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
            mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
            pdf: 'application/pdf', doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            txt: 'text/plain', zip: 'application/zip', rar: 'application/vnd.rar'
        };

        const mimeType = mimeMap[ext] || file.type || file.mimeType || 'application/octet-stream';
        const token = await AsyncStorage.getItem('token');
        const url = `${this.baseURL}/channel/${channelId}/message`;

        const formData = new FormData();
        formData.append('type', 'attachment');
        formData.append('content', '[Pièce jointe]');
        formData.append('attachment', { uri: file.uri, type: mimeType, name: fileName });

        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();

            xhr.onload = () => {
                try {
                    const cleanText = xhr.responseText.charCodeAt(0) === 65279
                        ? xhr.responseText.slice(1)
                        : xhr.responseText;
                    const data = cleanText ? JSON.parse(cleanText) : {};

                    resolve({
                        success: xhr.status >= 200 && xhr.status < 300,
                        data,
                        status: xhr.status
                    });
                } catch (error) {
                    resolve({ success: false, error: error.message, status: xhr.status });
                }
            };

            xhr.onerror = () => resolve({ success: false, error: 'Network error', isNetworkError: true });
            xhr.ontimeout = () => resolve({ success: false, error: 'Request timeout', isNetworkError: true });

            xhr.open('POST', url);
            xhr.timeout = 60000;
            xhr.setRequestHeader('Accept', 'application/json');
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    }

    // ===== E2EE (End-to-End Encryption) =====

    // Enregistrer la clé publique de l'utilisateur
    async uploadE2EEPublicKey(publicKeyBase64) {
        return this.request('/e2ee/keys/register', {
            method: 'POST',
            body: JSON.stringify({
                public_key: publicKeyBase64
            })
        });
    }

    // Récupérer la clé publique d'un utilisateur
    async getUserE2EEPublicKey(userId) {
        return this.request(`/e2ee/keys/user/${userId}`);
    }

    // Récupérer les clés publiques de tous les membres d'un canal
    async getChannelMembersE2EEKeys(channelId) {
        return this.request(`/e2ee/keys/channel/${channelId}`);
    }

    // Distribuer une clé de session chiffrée à tous les membres
    async distributeSessionKey(channelId, encryptedKeys) {
        return this.request('/e2ee/session-keys/distribute', {
            method: 'POST',
            body: JSON.stringify({
                channel_id: channelId,
                encrypted_keys: encryptedKeys
            })
        });
    }

    // Récupérer la clé de session chiffrée pour un canal
    async getSessionKey(channelId) {
        return this.request(`/e2ee/session-keys/${channelId}`);
    }

    // Vérifier le statut E2EE d'un canal
    async getChannelE2EEStatus(channelId) {
        return this.request(`/e2ee/channel/${channelId}/status`);
    }

    // Envoyer un message chiffré
    async sendEncryptedMessage(channelId, encryptedData) {
        return this.request('/encrypted-messages', {
            method: 'POST',
            body: JSON.stringify({
                channel_id: channelId,
                encrypted_content: encryptedData.encrypted_content,
                iv: encryptedData.iv,
                auth_tag: encryptedData.auth_tag
            })
        });
    }

    // Récupérer les messages chiffrés d'un canal
    async getEncryptedMessages(channelId, limit = 50) {
        return this.request(`/encrypted-messages/channel/${channelId}?limit=${limit}`);
    }

    // Récupérer un message chiffré spécifique
    async getEncryptedMessage(messageId) {
        return this.request(`/encrypted-messages/${messageId}`);
    }

    // ===== E2EE pour les DM =====

    // Activer/Désactiver E2EE pour un DM (toggle)
    async toggleE2EEForDM(dmId, enabled, userId) {
        return this.request(`/channel/${dmId}/e2ee`, {
            method: 'PUT',
            body: JSON.stringify({
                e2ee_enabled: enabled,
                user_id: userId
            })
        });
    }

    // Activer E2EE pour un DM
    async enableE2EEForDM(dmId, userId) {
        return this.toggleE2EEForDM(dmId, true, userId);
    }

    // Désactiver E2EE pour un DM
    async disableE2EEForDM(dmId, userId) {
        return this.toggleE2EEForDM(dmId, false, userId);
    }

    // Obtenir le statut E2EE d'un DM
    async getDME2EEStatus(dmId) {
        return this.request(`/e2ee/channel/${dmId}/status`);
    }

    // ===== NOTIFICATION PREFERENCES =====

    // Récupérer tous les types de notifications disponibles
    async getNotificationTypes() {
        return this.request('/notification-types');
    }

    // Récupérer les préférences de notification d'un utilisateur
    async getUserNotificationTypes(userId) {
        return this.request(`/users/${userId}/notification-types`);
    }

    // Mettre à jour les préférences de notification d'un utilisateur
    async updateUserNotificationTypes(userId, disabledTypeIds) {
        return this.request(`/users/${userId}/notification-types`, {
            method: 'PUT',
            body: JSON.stringify({ disabled_types: disabledTypeIds })
        });
    }

    // ===== TOGGLE USER NOTIFICATION =====
    async toggleUserNotification(typeId) {
        return this.request(`/users/notifications/toggle/${typeId}`, {
            method: 'POST'
        });
    }

    // ===== MFA (Multi-Factor Authentication) =====

    /**
     * Toggle MFA on/off
     * @param {boolean} mfaEnabled - true to enable, false to disable
     * @param {string|null} password - Required when disabling MFA
     */
    async toggleMFA(mfaEnabled, password = null) {
        const body = { mfa_enabled: mfaEnabled };

        if (!mfaEnabled && password) {
            body.password = password;
        }

        return this.request('/mfa/toggle', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Verify MFA code
     * @param {string} email
     * @param {string} code - 6 digit code
     * @param {string} tempToken - Temporary JWT token
     */
    async verifyMFACode(email, code, tempToken) {
        return this.request('/mfa/verify', {
            method: 'POST',
            body: JSON.stringify({
                email,
                code,
                temp_token: tempToken
            })
        });
    }

    /**
     * Resend MFA code
     * @param {string} email
     * @param {string} tempToken - Temporary JWT token
     */
    async resendMFACode(email, tempToken) {
        return this.request('/mfa/resend', {
            method: 'POST',
            body: JSON.stringify({
                email,
                temp_token: tempToken
            })
        });
    }

    /**
     * Get user info including MFA status
     * @param {number} userId
     */
    async getUserInfo(userId) {
        return this.request(`/user/${userId}`);
    }

    // ===== TICKETS =====

    async getTickets() {
        return this.request('/tickets');
    }

    async createTicket(ticketData) {
        return this.request('/tickets', {
            method: 'POST',
            body: JSON.stringify(ticketData)
        });
    }

    async getTicket(ticketId) {
        return this.request(`/tickets/${ticketId}`);
    }

    async updateTicket(ticketId, ticketData) {
        return this.request(`/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify(ticketData)
        });
    }

    async deleteTicket(ticketId) {
        return this.request(`/tickets/${ticketId}`, {
            method: 'DELETE'
        });
    }

    async assignTicket(ticketId, adminId) {
        return this.request(`/tickets/${ticketId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ admin_id: adminId })
        });
    }

    async updateTicketStatus(ticketId, status) {
        return this.request(`/tickets/${ticketId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    async updateTicketPriority(ticketId, priority) {
        return this.request(`/tickets/${ticketId}/priority`, {
            method: 'PUT',
            body: JSON.stringify({ priority })
        });
    }

    async getTicketComments(ticketId) {
        return this.request(`/tickets/${ticketId}/comments`);
    }

    async addTicketComment(ticketId, content) {
        return this.request(`/tickets/${ticketId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    // ===== USERS =====
    async getAllUsers() {
        return this.request('/user');
    }

    async getAdminUsers() {
        const result = await this.request('/user');

        if (result.success) {
            const users = result.data?.data || result.data || [];
            if (Array.isArray(users)) {
                const admins = users.filter(u => u.role === 'admin');
                return {
                    success: true,
                    data: admins,
                    status: result.status
                };
            }

            return result;
        }

        return result;
    }

    async deleteUser(userId) {
        return this.request(`/user/${userId}`, {
            method: 'DELETE'
        });
    }
}

export default new APIService();
