/**
 * @fileoverview Layout principal de l'application avec configuration Sentry et gestion de l'authentification
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import 'react-native-get-random-values';

import { Stack, router } from "expo-router";
import { useEffect } from "react";
import * as Sentry from '@sentry/react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import NotificationProvider from "../components/NotificationProvider";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ChannelsProvider } from "../contexts/ChannelsContext";
import { MessagesProvider } from "../contexts/MessagesContext";
import { OnlineUsersProvider } from "../contexts/OnlineUsersContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { LoadingScreen } from "../components/LoadingScreen";

/**
 * Initialise Sentry pour le monitoring et le tracking des erreurs.
 * Filtre les erreurs réseau et les erreurs non pertinentes pour éviter le bruit dans Sentry.
 * @function
 */

Sentry.init({
    dsn: 'https://3b235366f8b799f4332e7a696cc982ba@o4510364795469824.ingest.us.sentry.io/4510364826206208',
    environment: __DEV__ ? 'development' : 'production',
    release: 'chatapp-mobile@0.3.0',

    tags: {
        platform: 'mobile',
        app: 'react-native'
    },

    tracesSampleRate: 1.0,

    integrations: [
        Sentry.mobileReplayIntegration(),
        Sentry.feedbackIntegration()
    ],

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: __DEV__,
    sendDefaultPii: true,

    beforeSend(event, hint) {
        /**
         * Filtre les erreurs réseau et 401 pour ne pas polluer Sentry.
         * @param {import('@sentry/types').Event} event - L'événement Sentry à traiter
         * @param {Object} hint - Informations supplémentaires sur l'erreur
         * @returns {import('@sentry/types').Event|null} L'événement à envoyer ou null pour ignorer
         */

        const error = hint.originalException;

        const ignoredErrors = [
            'Network request failed',
            'WebSocket connection error',
            'Failed to fetch',
            'NetworkError',
            'TypeError: Network',
            'AbortError',
            'TimeoutError',
            'Unauthorized API request',
            'ECONNRESET',
            'ETIMEDOUT',
            'socket hang up',
            'WebSocket is closed'
        ];

        if (error?.message) {
            for (const ignored of ignoredErrors) {
                if (error.message.includes(ignored)) {
                    if (__DEV__) {
                        console.log(`[Sentry] Filtered network error: ${error.message}`);
                    }
                    return null;
                }
            }
        }

        if (event.message) {
            for (const ignored of ignoredErrors) {
                if (event.message.includes(ignored)) {
                    if (__DEV__) {
                        console.log(`[Sentry] Filtered event: ${event.message}`);
                    }
                    return null;
                }
            }
        }

        if (event.tags?.http_status === '401' ||
            (error?.status === 401 && error?.unauthorized)) {
            if (__DEV__) {
                console.log('[Sentry] Filtered 401 unauthorized');
            }
            return null;
        }

        if (__DEV__ && event.exception) {
            console.log('Sentry Event (dev):', event);
        }

        return event;
    },

    ignoreErrors: [
        'Network request failed',
        'WebSocket connection error',
        'Unauthorized API request',
        /TypeError.*Network/,
        /Failed to fetch/,
        'setDarkMode is not a function'
    ],
});

/**
 * Layout principal de l'application.
 * Gère la redirection automatique selon l'état d'authentification et applique le thème utilisateur.
 * @component
 * @returns {JSX.Element} Le layout de navigation principal (Stack)
 */

function AppLayout() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { setDarkMode } = useTheme();

    /**
     * Redirige l'utilisateur vers la page principale ou de login selon l'état d'authentification.
     * @effect
     */

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.replace('/(main)');
            } else {
                router.replace('/(auth)/login');
            }
        }
    }, [isAuthenticated, isLoading]);

    /**
     * Applique le thème utilisateur (dark/light) si défini dans le profil.
     * Capture les erreurs de thème dans Sentry si besoin.
     * @effect
     */

    useEffect(() => {
        try {
            if (user && user.theme && typeof setDarkMode === 'function') {
                const wantedDark = user.theme.toLowerCase() === 'dark';
                setDarkMode(wantedDark);
            }
        } catch (e) {
            if (!e.message?.includes('setDarkMode')) {
                console.warn('Theme setting error:', e);
                Sentry.captureException(e, {
                    tags: {
                        component: 'app_layout',
                        action: 'set_theme',
                        platform: 'mobile'
                    },
                    extra: {
                        user_id: user?.id,
                        theme: user?.theme,
                        has_setDarkMode: typeof setDarkMode === 'function'
                    },
                    level: 'warning'
                });
            }
        }
    }, [user, setDarkMode]);

    // Affiche l'écran de chargement tant que l'état d'authentification n'est pas déterminé
    if (isLoading) {
        return <LoadingScreen />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

/**
 * Composant racine de l'application.
 * Empile tous les contextes nécessaires dans l'ordre optimal pour garantir le bon fonctionnement global.
 * @component
 * @returns {JSX.Element} L'application complète avec tous les contextes et providers.
 */

function RootLayout() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ChannelsProvider>
                    <MessagesProvider>
                        <OnlineUsersProvider>
                            <NotificationProvider>
                                <ActionSheetProvider>
                                    <AppLayout />
                                </ActionSheetProvider>
                            </NotificationProvider>
                        </OnlineUsersProvider>
                    </MessagesProvider>
                </ChannelsProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default Sentry.wrap(RootLayout);