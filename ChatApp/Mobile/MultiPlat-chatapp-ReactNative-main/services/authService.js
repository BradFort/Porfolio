/**
 * @fileoverview Service d'authentification (login, logout, gestion du token, MFA, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import CONFIG from '../config/api';

const API_BASE_URL = CONFIG.API_BASE_URL;
const REQUEST_TIMEOUT = 10000;

class AuthService {
    /**
     * Récupère les en-têtes d'authentification, y compris le token JWT, pour les requêtes API.
     * @returns {Object} Les en-têtes d'authentification.
     */
    async getAuthHeaders() {
        const token = await AsyncStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    /**
     * Inscrit un nouvel utilisateur et stocke le token JWT et les données utilisateur.
     * @param {Object} userData - Les données de l'utilisateur à enregistrer.
     * @returns {Promise<Object>} Le résultat de l'opération d'inscription.
     */
    async register(userData) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(userData),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const responseText = await response.text();
            const cleanedText = responseText.charCodeAt(0) === 65279 ? responseText.slice(1) : responseText;

            let data;
            try {
                data = JSON.parse(cleanedText);
            } catch (_jsonError) {
                return { success: false, error: 'Réponse du serveur invalide' };
            }

            if (response.ok && data?.data) {
                const { token, user } = data.data;

                if (token && user) {
                    await AsyncStorage.setItem('token', token);
                    await AsyncStorage.setItem('user', JSON.stringify(user));

                    Sentry.addBreadcrumb({
                        category: 'auth',
                        message: 'User registered',
                        level: 'info',
                        data: { username: user.name }
                    });

                    return { success: true, data: data.data };
                } else {
                    return { success: false, error: 'Réponse du serveur invalide' };
                }
            } else {
                Sentry.captureMessage('Registration failed', {
                    level: 'warning',
                    tags: { component: 'auth', action: 'register', platform: 'mobile' },
                    extra: { username: userData.name, error: data?.message }
                });

                return { success: false, error: data?.message || 'Erreur lors de l\'inscription', data: data };
            }
        } catch (error) {
            clearTimeout(timeoutId);

            Sentry.captureException(error, {
                tags: { component: 'auth', action: 'register_error', platform: 'mobile' },
                extra: { username: userData.name },
                level: 'error'
            });

            if (error.name === 'AbortError') {
                return { success: false, error: 'Serveur non accessible. Vérifiez que votre API est démarrée.' };
            } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
                return { success: false, error: 'API incorrecte. Vérifiez l\'URL de votre serveur.' };
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return { success: false, error: 'Impossible de joindre le serveur. Vérifiez votre connexion.' };
            }

            return { success: false, error: 'Erreur de connexion au serveur' };
        }
    }

    /**
     * Authentifie un utilisateur avec son email et son mot de passe, et gère le MFA si nécessaire.
     * @param {string} email - L'email de l'utilisateur.
     * @param {string} password - Le mot de passe de l'utilisateur.
     * @returns {Promise<Object>} Le résultat de l'opération de connexion.
     */
    async login(email, password) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email, password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const responseText = await response.text();
            const cleanedText = responseText.charCodeAt(0) === 65279 ? responseText.slice(1) : responseText;

            let data;
            try {
                data = JSON.parse(cleanedText);
            } catch (_jsonError) {
                return { success: false, error: 'Réponse du serveur invalide' };
            }

            if (response.ok) {
                if (data.data?.mfa_required) {
                    return {
                        success: true,
                        data: {
                            mfa_required: true,
                            temp_token: data.data.temp_token,
                            email: data.data.email
                        }
                    };
                }

                await AsyncStorage.setItem('token', data.data.token);
                await AsyncStorage.setItem('user', JSON.stringify(data.data.user));

                Sentry.addBreadcrumb({
                    category: 'auth',
                    message: 'User logged in',
                    level: 'info',
                    data: { username: data.data.user.name }
                });

                return { success: true, data: data.data };
            } else {
                return { success: false, status: response.status, error: data.message || 'Email ou mot de passe incorrect' };
            }
        } catch (error) {
            clearTimeout(timeoutId);

            Sentry.captureException(error, {
                tags: { component: 'auth', action: 'login_error', platform: 'mobile' },
                extra: { email },
                level: 'error'
            });

            if (error.name === 'AbortError') {
                return { success: false, error: 'Serveur non accessible. Vérifiez que votre API est démarrée.' };
            } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
                return { success: false, error: 'API incorrecte. Vérifiez l\'URL de votre serveur.' };
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return { success: false, error: 'Impossible de joindre le serveur. Vérifiez votre connexion.' };
            }

            return { success: false, error: 'Erreur de connexion au serveur' };
        }
    }

    /**
     * Déconnecte l'utilisateur en supprimant le token JWT et les données utilisateur.
     * @returns {Promise<Object>} Le résultat de l'opération de déconnexion.
     */
    async logout() {
        try {
            const headers = await this.getAuthHeaders();

            await fetch(`${API_BASE_URL}/logout`, { method: 'POST', headers });

            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');

            Sentry.addBreadcrumb({
                category: 'auth',
                message: 'User logged out',
                level: 'info'
            });

            return { success: true };
        } catch (error) {
            Sentry.captureException(error, {
                tags: { component: 'auth', action: 'logout_error', platform: 'mobile' },
                level: 'warning'
            });

            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            return { success: true };
        }
    }

    /**
     * Récupère les données de l'utilisateur actuellement connecté.
     * @returns {Promise<Object>} Les données de l'utilisateur ou une erreur.
     */
    async getCurrentUser() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const headers = await this.getAuthHeaders();

            const response = await fetch(`${API_BASE_URL}/me`, { method: 'GET', headers, signal: controller.signal });
            clearTimeout(timeoutId);

            const responseText = await response.text();

            const cleanedText = responseText.charCodeAt(0) === 65279 ? responseText.slice(1) : responseText;

            let data;
            try {
                data = JSON.parse(cleanedText);
            } catch (_jsonError) {
                return { success: false, error: 'Réponse du serveur invalide' };
            }

            if (response.ok) {
                if (data.message && data.message.toLowerCase().includes('unauthenticated')) {
                    return { success: false, status: 401, error: 'Unauthenticated' };
                }

                const userData = data.user || data.data;
                if (userData) {
                    await AsyncStorage.setItem('user', JSON.stringify(userData));
                    return { success: true, user: userData };
                } else {
                    return { success: false, error: 'Données utilisateur manquantes' };
                }
            } else {
                return { success: false, status: response.status, error: data.message };
            }

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                return { success: false, error: 'Timeout serveur', timeout: true };
            }

            Sentry.captureException(error, {
                tags: { component: 'auth', action: 'get_current_user_error', platform: 'mobile' },
                level: 'warning'
            });

            return { success: false, error: 'Erreur de connexion au serveur' };
        }
    }

    /**
     * Vérifie si l'utilisateur est authentifié en vérifiant la présence d'un token JWT valide.
     * @returns {Promise<boolean>} True si l'utilisateur est authentifié, sinon false.
     */
    async isAuthenticated() {
        try {
            const token = await AsyncStorage.getItem('token');
            return !!token;
        } catch {
            return false;
        }
    }

    /**
     * Récupère le token JWT stocké.
     * @returns {Promise<string|null>} Le token JWT si disponible, sinon null.
     */
    async getToken() {
        try {
            return await AsyncStorage.getItem('token');
        } catch {
            return null;
        }
    }

    /**
     * Récupère les données utilisateur stockées.
     * @returns {Promise<Object|null>} Les données utilisateur si disponibles, sinon null.
     */
    async getStoredUser() {
        try {
            const userString = await AsyncStorage.getItem('user');
            return userString ? JSON.parse(userString) : null;
        } catch {
            return null;
        }
    }

    /**
     * Stocke le token JWT et les données utilisateur.
     * @param {string} token - Le token JWT à stocker.
     * @param {Object} user - Les données utilisateur à stocker.
     * @returns {Promise<Object>} Le résultat de l'opération de stockage.
     */
    async storeAuthData(token, user) {
        try {
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            return { success: true };
        } catch (error) {
            Sentry.captureException(error, {
                tags: { component: 'auth', action: 'store_auth_data_error', platform: 'mobile' },
                level: 'error'
            });
            return { success: false, error: 'Erreur lors du stockage des données' };
        }
    }
}

export default new AuthService();