/**
 * @fileoverview Contexte d'authentification global de l'application
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import i18n from '../constants/language/js/i18n';
import apiService from '../services/apiService';
import authService from '../services/authService';
import chatService from '../services/chatService';
import * as notificationService from '../services/notificationService';
import E2EEManager from '../services/crypto/E2EEManager';
import { useTheme } from './ThemeContext';

/**
 * Clés de stockage local pour les préférences utilisateur
 * @constant
 */
const STORAGE_KEYS = {
    THEME: 'lastTheme',
    LANG: 'lastLanguage'
};

/**
 * Contexte d'authentification
 * Fournit l'état et les fonctions d'authentification à toute l'application
 */
const AuthContext = createContext({});

/**
 * Provider du contexte d'authentification
 * Gère l'état de connexion, les préférences utilisateur, E2EE et les notifications
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composants enfants
 * @returns {JSX.Element} Provider avec le contexte d'authentification
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [notificationPreferences, setNotificationPreferences] = useState({ disabledTypes: [], loaded: false });
    const isLoggingOutRef = useRef(false);
    const { applyUserTheme } = useTheme();

    /**
     * Applique les préférences linguistiques de l'utilisateur
     * Charge la langue depuis l'utilisateur ou le stockage local
     * @async
     * @param {Object} u - Objet utilisateur contenant les préférences
     * @returns {Promise<void>}
     */
    const applyUserPreferences = async (u) => {
        try {
            let finalLang;
            if (u) {
                const rawLang = u?.lang || u?.language || u?.locale;
                if (rawLang && typeof rawLang === 'string') finalLang = rawLang.toLowerCase().startsWith('fr') ? 'fr' : 'en';
            }
            if (!finalLang) {
                const lastLang = await AsyncStorage.getItem(STORAGE_KEYS.LANG);
                if (lastLang) finalLang = lastLang;
            }
            if (finalLang) {
                i18n.changeLanguage(finalLang);
                await AsyncStorage.setItem(STORAGE_KEYS.LANG, finalLang);
            }
        } catch (_) { }
    };

    /**
     * Charge les préférences de notifications de l'utilisateur
     * Met à jour l'état local et le service de notifications
     * @async
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<void>}
     */
    const loadNotificationPreferences = async (userId) => {
        try {
            const result = await apiService.getUserNotificationTypes(userId);
            if (result.success && result.data?.data) {
                const disabledTypes = result.data.data.filter(pref => pref.disabled).map(pref => pref.type);
                setNotificationPreferences({ disabledTypes, loaded: true });
                await AsyncStorage.setItem('notificationPreferences', JSON.stringify(disabledTypes));
            }
        } catch {
            try {
                const cached = await AsyncStorage.getItem('notificationPreferences');
                if (cached) setNotificationPreferences({ disabledTypes: JSON.parse(cached), loaded: true });
            } catch (_) { }
        }
    };

    /**
     * Vérifie si un type de notification est activé
     * @param {number} typeId - ID du type de notification
     * @returns {boolean} True si le type est activé
     */
    const isNotificationTypeEnabled = (typeId) => !notificationPreferences.loaded || !notificationPreferences.disabledTypes.includes(typeId);

    /**
     * Connecte le WebSocket pour l'utilisateur
     * @async
     * @param {string} token - Token d'authentification
     * @param {Object} currentUser - Données de l'utilisateur
     * @returns {Promise<void>}
     */
    const connectWebSocket = async (token, currentUser) => {
        try {
            await chatService.connectWebSocket(token, currentUser);
        } catch (error) {
            Sentry.captureException(error, { tags: { component: 'auth', action: 'connect_websocket' }, level: 'warning' });
        }
    };

    /**
     * Vérifie le statut d'authentification au démarrage
     * Charge l'utilisateur, applique les préférences, connecte le WebSocket et initialise E2EE
     * @async
     * @returns {Promise<void>}
     */
    const checkAuthStatus = async () => {
        try {
            const token = await authService.getToken();
            if (!token) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            const result = await authService.getCurrentUser();
            if (!result.success || !result.user) {
                await logout();
                return;
            }

            const currentUser = result.user;
            setUser(currentUser);
            global.currentUserId = currentUser.id;
            setIsAuthenticated(true);

            Sentry.setUser({ id: currentUser.id, username: currentUser.name, email: currentUser.email });
            await applyUserTheme(currentUser.id);
            await applyUserPreferences(currentUser);
            await loadNotificationPreferences(currentUser.id);

            const freshToken = await authService.getToken();
            if (freshToken) await connectWebSocket(freshToken, currentUser);

            // Initialiser E2EE
            if (!E2EEManager.isInitialized()) {
                await E2EEManager.initialize(apiService);
            }
        } catch (error) {
            Sentry.captureException(error, { tags: { component: 'auth', action: 'check_auth_status' }, level: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Connecte un utilisateur avec email et mot de passe
     * Gère le MFA si nécessaire, applique les préférences, connecte le WebSocket et initialise E2EE
     * @async
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe de l'utilisateur
     * @returns {Promise<Object>} Résultat avec {success: boolean, mfa_required?: boolean, temp_token?: string, email?: string}
     */
    const login = async (email, password) => {
        try {
            const currentLang = i18n.language;
            await AsyncStorage.setItem(STORAGE_KEYS.LANG, currentLang);
            chatService.disconnectWebSocket();

            const result = await authService.login(email, password);

            if (!result.success) {
                if (result.data?.mfa_required) {
                    return {
                        success: true,
                        mfa_required: true,
                        temp_token: result.data.temp_token,
                        email: result.data.email
                    };
                }

                const status = result?.status;
                let key = 'loginFailed';
                if ([401, 403].includes(status)) key = 'invalidCredentials';
                else if (status === 429) key = 'tooManyRequests';
                else if (status === 0) key = 'serverConnectionError';
                else if (status >= 500) key = 'loginError';
                try { notificationService.error({ text: i18n.t(key), allowLifecycle: true }); } catch (_) { }
                return { success: false, error: result.error, status };
            }

            if (result.data?.mfa_required) {
                return {
                    success: true,
                    mfa_required: true,
                    temp_token: result.data.temp_token,
                    email: result.data.email
                };
            }

            const loggedUser = result.data.user;
            setUser(loggedUser);
            global.currentUserId = loggedUser.id;
            setIsAuthenticated(true);

            Sentry.setUser({ id: loggedUser.id, username: loggedUser.name, email: loggedUser.email });
            Sentry.setTag('user_id', loggedUser.id);

            await applyUserTheme(loggedUser.id);
            await applyUserPreferences(loggedUser);
            await AsyncStorage.setItem('user', JSON.stringify(loggedUser));
            await loadNotificationPreferences(loggedUser.id);

            const token = await authService.getToken();
            await connectWebSocket(token, loggedUser);

            try { notificationService.success({ text: i18n.t('loginSuccess'), allowLifecycle: true }); } catch (_) { }

            if (!E2EEManager.isInitialized()) {
                await E2EEManager.initialize(apiService);
            }

            return { success: true };
        } catch (_error) {
            Sentry.captureException(_error, { tags: { component: 'auth', action: 'login_error' }, extra: { email }, level: 'error' });
            try { notificationService.error({ text: i18n.t('loginError'), allowLifecycle: true }); } catch (_) { }
            return { success: false, error: 'Erreur de connexion' };
        }
    };

    /**
     * Déconnecte l'utilisateur
     * Ferme le WebSocket, nettoie les données locales, réinitialise les contextes
     * @async
     * @returns {Promise<Object>} Résultat avec {success: boolean}
     */
    const logout = async () => {
        // ...existing code...
    };

    /**
     * Met à jour les informations de l'utilisateur
     * Applique les nouvelles préférences (langue, thème, MFA, etc.)
     * @async
     * @param {Object} updatedFields - Champs à mettre à jour
     * @returns {Promise<void>}
     */
    const updateUser = async (updatedFields) => {
        if (!user) return;
        try {
            const updatedUser = { ...user, ...updatedFields };
            setUser(updatedUser);
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            Sentry.setUser({ id: updatedUser.id, username: updatedUser.name, email: updatedUser.email });
        } catch (error) {
            Sentry.captureException(error, { tags: { component: 'auth', action: 'update_user' }, level: 'error' });
        }
    };

    const refreshNotificationPreferences = async () => {
        if (!user) return;
        try {
            await loadNotificationPreferences(user.id);
        } catch (error) {
            Sentry.captureException(error, { tags: { component: 'auth', action: 'refresh_notification_preferences' }, level: 'error' });
        }
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuthStatus,
        updateUser,
        refreshNotificationPreferences,
        notificationPreferences,
        isNotificationTypeEnabled
    };

    useEffect(() => {
        apiService.setUnauthorizedHandler(logout);
        checkAuthStatus();
        return () => apiService.setUnauthorizedHandler(null);
    }, []);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
    return context;
};

export default AuthContext;
