/**
 * @fileoverview Hook personnalisé pour gérer l'état de connexion WebSocket
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { useState, useEffect } from 'react';
import chatService from '../services/chatService';

/**
 * Hook personnalisé pour surveiller l'état de connexion WebSocket
 * S'abonne aux événements de connexion/déconnexion du chatService
 * Met à jour automatiquement l'état lors des changements
 * @returns {Object} Objet contenant l'état de connexion WebSocket
 * @returns {boolean} isConnected - Indique si le WebSocket est connecté
 * @returns {Object} status - Objet de statut détaillé du WebSocket
 * @returns {boolean} isActive - Indique si le WebSocket est actif
 */
export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        // Listener connexion
        const handleConnected = () => {
            setIsConnected(true);
        };

        const handleDisconnected = () => {
            setIsConnected(false);
        };

        chatService.on('websocket_connected', handleConnected);
        chatService.on('websocket_disconnected', handleDisconnected);

        // Initial status
        setIsConnected(chatService.isWebSocketActive());
        setStatus(chatService.getWebSocketStatus());

        return () => {
            chatService.off('websocket_connected', handleConnected);
            chatService.off('websocket_disconnected', handleDisconnected);
        };
    }, []);

    return {
        isConnected,
        status,
        isActive: chatService.isWebSocketActive(),
    };
};