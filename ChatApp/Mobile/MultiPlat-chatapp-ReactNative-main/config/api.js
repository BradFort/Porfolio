/**
 * @fileoverview Configuration des URLs API et WebSocket
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

/**
 * Configuration de l'API et du WebSocket
 * @constant {Object} CONFIG
 * @property {string} API_BASE_URL - URL de base de l'API REST
 * @property {string} WS_URL - URL du serveur WebSocket
 * @property {number} WS_RECONNECT_ATTEMPTS - Nombre maximum de tentatives de reconnexion WebSocket
 * @property {number} WS_RECONNECT_DELAY - Délai entre les tentatives de reconnexion en millisecondes
 */
const CONFIG = {
    // Pour émulateur Android
    // API_BASE_URL: 'http://192.168.20.50/api',
    // WS_URL: 'ws://192.168.2.238:8080/ws',

    // Pour développement web/iOS Simulator
    // API_BASE_URL: 'http://localhost/chatappAPI',
    // WS_URL: 'ws://localhost/ws',

    // Pour appareil physique (remplace par ton IP)
    API_BASE_URL: 'https://www.chatapp-xp.fun/chatappAPI',  // Via Nginx
    WS_URL: 'https://www.chatapp-xp.fun/ws',                   // Via Nginx

    WS_RECONNECT_ATTEMPTS: 5,
    WS_RECONNECT_DELAY: 2000,
};

export default CONFIG;