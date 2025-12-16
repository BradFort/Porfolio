/**
 * @fileoverview Hook combiné pour accéder à tout le contexte du chat
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { useAuth } from '../contexts/AuthContext';
import { useChannels } from '../contexts/ChannelsContext';
import { useMessages } from '../contexts/MessagesContext';
import { useWebSocket } from './useWebSocket';
import { useOnlineUsers } from '../contexts/OnlineUsersContext';

/**
 * Hook combiné qui agrège tous les contextes liés au chat
 * Fournit un accès unifié à l'authentification, les canaux, les messages, le WebSocket et les utilisateurs en ligne
 * @returns {Object} Objet contenant toutes les fonctionnalités du chat
 * @returns {Object} user - Utilisateur connecté
 * @returns {boolean} isAuthenticated - État d'authentification
 * @returns {Function} logout - Fonction de déconnexion
 * @returns {Array} channels - Liste des canaux
 * @returns {Array} dms - Liste des messages directs
 * @returns {Object} selectedChannel - Canal actuellement sélectionné
 * @returns {Function} loadChannels - Charge la liste des canaux
 * @returns {Function} createChannel - Crée un nouveau canal
 * @returns {Function} joinChannel - Rejoint un canal
 * @returns {Function} leaveChannel - Quitte un canal
 * @returns {Function} createDM - Crée un message direct
 * @returns {Function} selectChannel - Sélectionne un canal
 * @returns {Array} messages - Liste des messages du canal sélectionné
 * @returns {Function} loadMessages - Charge les messages d'un canal
 * @returns {Function} sendMessage - Envoie un message texte
 * @returns {Function} sendVoiceMessage - Envoie un message vocal
 * @returns {Function} sendFileAttachment - Envoie un fichier joint
 * @returns {Function} deleteMessage - Supprime un message
 * @returns {Function} startTyping - Indique que l'utilisateur tape
 * @returns {Function} stopTyping - Indique que l'utilisateur a arrêté de taper
 * @returns {Array} typingUsers - Utilisateurs en train de taper
 * @returns {Function} clearMessages - Efface les messages
 * @returns {Function} getMessageMaxLength - Obtient la longueur maximale d'un message
 * @returns {boolean} isWebSocketConnected - État de connexion WebSocket
 * @returns {Object} websocketStatus - Statut détaillé du WebSocket
 * @returns {Array} onlineUsers - Utilisateurs en ligne globalement
 * @returns {Array} channelOnlineUsers - Utilisateurs en ligne dans le canal actuel
 * @returns {Function} isUserOnline - Vérifie si un utilisateur est en ligne
 * @returns {Function} getChannelOnlineUsers - Obtient les utilisateurs en ligne d'un canal
 * @returns {Function} getAllOnlineUsers - Obtient tous les utilisateurs en ligne
 * @returns {boolean} channelsLoading - Indicateur de chargement des canaux
 * @returns {boolean} messagesLoading - Indicateur de chargement des messages
 */
export const useChat = () => {
    const auth = useAuth();
    const channels = useChannels();
    const messages = useMessages();
    const websocket = useWebSocket();
    const onlineUsers = useOnlineUsers();

    return {
        // Auth
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        logout: auth.logout,

        // Channels
        channels: channels.channels,
        dms: channels.dms,
        selectedChannel: channels.selectedChannel,
        loadChannels: channels.loadChannels,
        createChannel: channels.createChannel,
        joinChannel: channels.joinChannel,
        leaveChannel: channels.leaveChannel,
        createDM: channels.createDM,
        selectChannel: channels.selectChannel,

        // Messages
        messages: messages.messages,
        loadMessages: messages.loadMessages,
        sendMessage: messages.sendMessage,
        sendVoiceMessage: messages.sendVoiceMessage,
        sendFileAttachment: messages.sendFileAttachment,
        deleteMessage: messages.deleteMessage,
        startTyping: messages.startTyping,
        stopTyping: messages.stopTyping,
        typingUsers: messages.typingUsers,
        clearMessages: messages.clearMessages,
        getMessageMaxLength: messages.getMessageMaxLength,

        // WebSocket
        isWebSocketConnected: websocket.isConnected,
        websocketStatus: websocket.status,

        // Online Users
        onlineUsers: onlineUsers.onlineUsers,
        channelOnlineUsers: onlineUsers.channelOnlineUsers,
        isUserOnline: onlineUsers.isUserOnline,
        getChannelOnlineUsers: onlineUsers.getChannelOnlineUsers,
        getAllOnlineUsers: onlineUsers.getAllOnlineUsers,

        // Loading states
        channelsLoading: channels.loading,
        messagesLoading: messages.loading,
    };
};