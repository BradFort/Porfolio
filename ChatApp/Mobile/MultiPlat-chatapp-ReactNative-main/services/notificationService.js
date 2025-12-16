/**
 * @fileoverview Service de gestion des notifications locales et préférences utilisateur
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

let notifier = null;
let buffer = [];

let userPreferences = {
    disabledTypes: [],
    loaded: false
};

const SUPPRESS_KEYWORDS = [
    'websocket','web socket','socket','sockets','ws','socketio','io',
    'disconnected','connected','connect','reconnect','reconnected','disconnect',
    'authenticated','authentication','reconnect_failed','websocket_connected','websocket_disconnected',

    'déconnect','déconnecté','deconnect','connecté','connecte','connexion','authent',
];

const containsSuppressedKeyword = (str) => {
    const s = String(str || '').toLowerCase();
    return SUPPRESS_KEYWORDS.some(k => s.includes(k));
};

const shouldSuppress = (fnName, messageArg) => {
    try {
        const allowLifecycle = messageArg && typeof messageArg === 'object' && messageArg.allowLifecycle === true;

        let joined;
        try {
            if (typeof messageArg === 'string') joined = messageArg;
            else if (messageArg && typeof messageArg === 'object' && typeof messageArg.text === 'string') joined = messageArg.text;
            else joined = JSON.stringify(messageArg);
        } catch (_) {
            joined = String(messageArg);
        }

        const containsSuppressed = containsSuppressedKeyword(joined);

        return containsSuppressed && !allowLifecycle;
    } catch (_) {
        return false;
    }
};

const getCurrentUserId = () => {
    try {
        if (global && global.currentUserId) return global.currentUserId;
    } catch (_) {}
    try {
        if (typeof window !== 'undefined' && window.currentUserId) return window.currentUserId;
    } catch (_) {}
    return null;
};

const isNotificationAllowed = async (userId, notificationTypeId) => {
    let disabledIds = [];
    if (userId) {
        const apiService = require('./apiService').default;

        const result = await Promise.race([
            apiService.getUserNotificationTypes(userId),
            new Promise((resolve) => setTimeout(() => resolve({ success: false, timeout: true }), 2000))
        ]);

        if (!result || !result.success) {
            return true;
        }

        if (Array.isArray(result.data?.data)) {
            disabledIds = result.data.data.map(obj => obj.id);
        }
    }

    if (disabledIds.includes(1)) {
        return false;
    }

    return !disabledIds.includes(Number(notificationTypeId));
};

/**
 * Enregistre les préférences utilisateur pour les notifications
 * @param {Object} prefs - Les préférences de l'utilisateur
 * @param {Array<number>} prefs.disabledTypes - Les types de notifications désactivés par l'utilisateur
 * @param {boolean} prefs.loaded - Indique si les préférences ont été chargées
 */
export const registerUserPreferences = (prefs) => {
    if (!prefs || typeof prefs !== 'object') {
        console.warn('[notificationService] Invalid preferences provided');
        return;
    }

    userPreferences = {
        disabledTypes: Array.isArray(prefs.disabledTypes) ? prefs.disabledTypes.map(Number) : [],
        loaded: prefs.loaded || false
    };
};

/**
 * Enregistre le notificateur pour permettre l'envoi de notifications
 * @param {Object} n - Le notificateur à enregistrer
 */
export const registerNotifier = async (n) => {
    notifier = n;
    if (buffer.length > 0) {
        const toReplay = [];
        const dropped = [];
        const userId = getCurrentUserId();
        for (const { fnName, args, stack, notificationType } of buffer) {
            try {
                let messageArg;
                if (fnName === 'show') messageArg = args[1]; else messageArg = args[0];
                if (shouldSuppress(fnName, messageArg, stack)) {
                    dropped.push({ fnName, args, stack });
                    continue;
                }
                const allowed = await isNotificationAllowed(userId, notificationType);
                if (!allowed) {
                    dropped.push({ fnName, args, stack, reason: 'user_preferences' });
                    continue;
                }
                toReplay.push({ fnName, args });
            } catch (_) {
                toReplay.push({ fnName, args });
            }
        }
        if (dropped.length > 0) {
            try { console.trace('[notificationService] trace dropped items'); } catch(_) {}
        }
        toReplay.forEach(({ fnName, args }) => {
            const fn = notifier[fnName];
            if (typeof fn === 'function') {
                try {
                    fn(...args);
                } catch (e) {
                    console.warn('[notificationService] error replaying', fnName, e);
                }
            }
        });
        buffer = [];
    }
};

const call = async (fnName, notificationType, ...args) => {
    let callStack;
    try { callStack = (new Error()).stack || ''; } catch (_) { callStack = ''; }
    let messageArg;
    if (fnName === 'show') messageArg = args[1]; else messageArg = args[0];
    if (shouldSuppress(fnName, messageArg, callStack)) {
        return null;
    }
    const userId = getCurrentUserId();
    const allowed = await isNotificationAllowed(userId, notificationType);
    if (!allowed) {
        return null;
    }
    if (!notifier) {
        buffer.push({ fnName, args, stack: callStack, notificationType });
        return null;
    }

    const fn = notifier[fnName];
    if (typeof fn === 'function') return fn(...args);
    console.warn(`[notificationService] notifier has no method ${fnName}`);
    return null;
};

/**
 * Affiche une notification de type "info"
 * @param {string} type - Le type de la notification
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage de la notification
 * @param {string|null} notificationType - Le type de notification (optionnel)
 */
export const show = async (type, message, duration, notificationType = null) => await call('show', notificationType, type, message, duration);

/**
 * Affiche une notification de type "success"
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage de la notification
 * @param {string|null} notificationType - Le type de notification (optionnel)
 */
export const success = async (message, duration, notificationType = null) => await call('success', notificationType, message, duration);

/**
 * Affiche une notification de type "error"
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage de la notification
 * @param {string|null} notificationType - Le type de notification (optionnel)
 */
export const error = async (message, duration, notificationType = null) => await call('error', notificationType, message, duration);

/**
 * Affiche une notification de type "warning"
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage de la notification
 * @param {string|null} notificationType - Le type de notification (optionnel)
 */
export const warning = async (message, duration, notificationType = null) => await call('warning', notificationType, message, duration);

/**
 * Affiche une notification de type "info"
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage de la notification
 * @param {string|null} notificationType - Le type de notification (optionnel)
 */
export const info = async (message, duration, notificationType = null) => await call('info', notificationType, message, duration);

/**
 * Supprime une notification par son identifiant
 * @param {number|string} id - L'identifiant de la notification à supprimer
 */
export const remove = (id) => call('remove', null, id);

/**
 * Supprime toutes les notifications
 */
export const removeAll = () => call('removeAll', null);

/**
 * Affiche une notification de type "dm"
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage de la notification
 */
export const dmNotification = (message, duration) => {
    return info(message, duration, 'dm');
};

/**
 * Affiche une notification de type "channel"
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage de la notification
 */
export const channelNotification = (message, duration) => {
    return info(message, duration, 'channel');
};

/**
 * Affiche une notification de type "mention"
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage de la notification
 */
export const mentionNotification = (message, duration) => {
    return warning(message, duration, 'mention');
};

/**
 * Affiche une notification de type "system"
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage de la notification
 */
export const systemNotification = (message, duration) => {
    return info(message, duration, 'system');
};

export default {
    registerNotifier,
    registerUserPreferences,
    show,
    success,
    error,
    warning,
    info,
    remove,
    removeAll,
    dmNotification,
    channelNotification,
    mentionNotification,
    systemNotification,
};