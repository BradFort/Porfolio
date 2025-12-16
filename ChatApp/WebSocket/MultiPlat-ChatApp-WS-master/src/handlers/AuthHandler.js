/**
 * Auteurs : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 */

const axios = require('axios');
const { Sentry } = require('../utils/sentry');
const logger = require('../utils/logger');

class AuthHandler {
    /**
     * Initialise le gestionnaire d'authentification avec l'URL de l'API Laravel et le timeout.
     */
    constructor() {
        this.laravelApiUrl = process.env.LARAVEL_API_URL || 'http://localhost:8080/chatappAPI';
        this.apiTimeout = process.env.LARAVEL_API_TIMEOUT || 5000;
    }

    /**
     * Valide un token JWT auprès de l'API Laravel.
     * @param {string} token - Le token JWT à valider
     * @returns {Promise<{valid: boolean, user?: object}>}
     */
    async validateToken(token) {
        try {
            if (!this.laravelApiUrl) {
                logger.warn('Pas d\'URL Laravel configurée - validation token désactivée');
                return true;
            }

            logger.info('Validation token avec Laravel API...');

            Sentry.addBreadcrumb({
                category: 'auth',
                message: 'Validating token with Laravel API',
                level: 'info'
            });

            const response = await axios.get(`${this.laravelApiUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: this.apiTimeout
            });

            if (response.status === 200 && response.data.success) {
                logger.info('Token valide confirmé par Laravel');

                Sentry.addBreadcrumb({
                    category: 'auth',
                    message: 'Token validated successfully',
                    level: 'info'
                });

                return {
                    valid: true,
                    user: response.data.data
                };
            } else {
                logger.warn('Token invalide selon Laravel');

                Sentry.captureMessage('Invalid token from Laravel', {
                    level: 'warning',
                    tags: {
                        component: 'auth_handler',
                        action: 'validate_token',
                        platform: 'backend'
                    }
                });

                return { valid: false };
            }

        } catch (error) {
            if (error.response) {
                logger.warn(`Laravel rejette le token: ${error.response.status}`);

                Sentry.captureMessage('Laravel rejected token', {
                    level: 'warning',
                    tags: {
                        component: 'auth_handler',
                        action: 'validate_token',
                        platform: 'backend'
                    },
                    extra: {
                        status: error.response.status
                    }
                });

                return { valid: false };
            } else if (error.code === 'ECONNREFUSED') {
                logger.error('Laravel API inaccessible - acceptation du token par défaut');

                Sentry.captureException(error, {
                    tags: {
                        component: 'auth_handler',
                        action: 'validate_token_connection',
                        platform: 'backend'
                    },
                    level: 'warning'
                });

                return { valid: true };
            } else {
                logger.error('Erreur validation token:', error.message);

                Sentry.captureException(error, {
                    tags: {
                        component: 'auth_handler',
                        action: 'validate_token_error',
                        platform: 'backend'
                    },
                    level: 'error'
                });

                return { valid: false };
            }
        }
    }

    /**
     * Récupère les informations de l'utilisateur à partir de son token.
     * @param {string} token - Le token JWT de l'utilisateur
     * @returns {Promise<{success: boolean, user?: object}>}
     */
    async getUserInfo(token) {
        try {
            const response = await axios.get(`${this.laravelApiUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                timeout: this.apiTimeout
            });

            if (response.status === 200 && response.data.success) {
                Sentry.addBreadcrumb({
                    category: 'auth',
                    message: 'User info retrieved',
                    level: 'info'
                });

                return {
                    success: true,
                    user: response.data.data
                };
            } else {
                return { success: false };
            }

        } catch (error) {
            logger.error('Erreur récupération user info:', error.message);

            Sentry.captureException(error, {
                tags: {
                    component: 'auth_handler',
                    action: 'get_user_info',
                    platform: 'backend'
                },
                level: 'error'
            });

            return { success: false };
        }
    }

    /**
     * Récupère tous les channels accessibles par l'utilisateur.
     * @param {string} token - Le token JWT de l'utilisateur
     * @returns {Promise<{success: boolean, channels: Array}>}
     */
    async getUserChannels(token) {
        try {
            const response = await axios.get(`${this.laravelApiUrl}/my-channels`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                timeout: this.apiTimeout
            });

            if (response.status === 200 && response.data.success) {
                return {
                    success: true,
                    channels: response.data.data
                };
            } else {
                return { success: false, channels: [] };
            }

        } catch (error) {
            logger.error('Erreur récupération channels utilisateur:', error.message);

            Sentry.captureException(error, {
                tags: {
                    component: 'auth_handler',
                    action: 'get_user_channels',
                    platform: 'backend'
                },
                level: 'error'
            });

            return { success: false, channels: [] };
        }
    }

    /**
     * Vérifie si un utilisateur peut accéder à un channel spécifique.
     * @param {string} token - Le token JWT de l'utilisateur
     * @param {number} userId - L'ID de l'utilisateur
     * @param {number} channelId - L'ID du channel
     * @returns {Promise<{canAccess: boolean, channel?: object}>}
     */
    async canAccessChannel(token, userId, channelId) {
        try {
            const response = await axios.get(`${this.laravelApiUrl}/channel/${channelId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                timeout: this.apiTimeout
            });

            if (response.status === 200 && response.data.success) {
                const channel = response.data.data;
                return {
                    canAccess: true,
                    channel: channel
                };
            } else {
                return { canAccess: false };
            }

        } catch (error) {
            if (error.response && error.response.status === 403) {
                logger.warn(`Utilisateur ${userId} n'a pas accès au channel ${channelId}`);

                Sentry.captureMessage('User denied access to channel', {
                    level: 'info',
                    tags: {
                        component: 'auth_handler',
                        action: 'access_denied',
                        platform: 'backend'
                    },
                    extra: {
                        userId,
                        channelId
                    }
                });

                return { canAccess: false };
            } else {
                logger.error('Erreur vérification accès channel:', error.message);

                Sentry.captureException(error, {
                    tags: {
                        component: 'auth_handler',
                        action: 'can_access_channel',
                        platform: 'backend'
                    },
                    extra: {
                        userId,
                        channelId
                    },
                    level: 'error'
                });

                return { canAccess: false };
            }
        }
    }

    /**
     * Authentifie un utilisateur avec son token, userId et username.
     * @param {object} data - { token: string, userId: number, username: string }
     * @returns {Promise<{success: boolean, user?: object, message: string}>}
     */
    async authenticate(data) {
        try {
            const { token, userId, username } = data;

            if (!token || !userId || !username) {
                return {
                    success: false,
                    message: 'Token, userId et username requis'
                };
            }

            const validation = await this.validateToken(token);

            if (!validation.valid) {
                return {
                    success: false,
                    message: 'Token invalide'
                };
            }

            let userInfo = { id: userId, username: username };
            if (validation.user) {
                userInfo = validation.user;
            }

            Sentry.setUser({
                id: userInfo.id,
                username: userInfo.username
            });

            return {
                success: true,
                user: userInfo,
                message: 'Authentification réussie'
            };

        } catch (error) {
            logger.error('Erreur authentification:', error);

            Sentry.captureException(error, {
                tags: {
                    component: 'auth_handler',
                    action: 'authenticate',
                    platform: 'backend'
                },
                level: 'error'
            });

            return {
                success: false,
                message: 'Erreur serveur lors de l\'authentification'
            };
        }
    }

    /**
     * Vérifie l'état de santé de l'API Laravel.
     * @returns {Promise<boolean>} - true si l'API est accessible, false sinon
     */
    async checkLaravelHealth() {
        try {
            const response = await axios.get(`${this.laravelApiUrl}/health`, {
                timeout: 3000
            });

            return response.status === 200;
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    component: 'auth_handler',
                    action: 'health_check',
                    platform: 'backend'
                },
                level: 'warning'
            });

            return false;
        }
    }

    /**
     * Retourne les statistiques du gestionnaire d'authentification.
     * @returns {object} - { laravelApiUrl: string, apiTimeout: number, healthCheck: Promise<boolean> }
     */
    getStats() {
        return {
            laravelApiUrl: this.laravelApiUrl,
            apiTimeout: this.apiTimeout,
            healthCheck: this.checkLaravelHealth()
        };
    }
}

module.exports = AuthHandler;