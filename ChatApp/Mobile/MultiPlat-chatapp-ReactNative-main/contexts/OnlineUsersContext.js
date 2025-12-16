/**
 * @fileoverview Contexte React pour la gestion des utilisateurs en ligne (globaux et par channel) via WebSocket.
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import chatService from '../services/chatService';
import { useAuth } from './AuthContext';

const OnlineUsersContext = createContext({});

export const OnlineUsersProvider = ({ children }) => {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState([]); // Liste globale des users connectés
    const [channelOnlineUsers, setChannelOnlineUsers] = useState({}); // Par channel: { channelId: [users] }

    /**
     * Effet pour gérer la liste initiale des utilisateurs en ligne.
     * S'abonne à l'événement 'initial_online_users' du service de chat.
     */
    useEffect(() => {
        const handleInitialOnlineUsers = (data) => {

            // Remplacer complètement la liste avec tous les users déjà connectés
            const users = data.users.map(u => ({
                userId: u.userId,
                username: u.username
            }));

            setOnlineUsers(users);
        };

        chatService.on('initial_online_users', handleInitialOnlineUsers);

        return () => {
            chatService.off('initial_online_users', handleInitialOnlineUsers);
        };
    }, []);

    /**
     * Effet pour gérer la déconnexion du WebSocket.
     * Réinitialise les utilisateurs en ligne et les utilisateurs en ligne par channel.
     */
    useEffect(() => {
        const handleWebSocketDisconnected = () => {
            setOnlineUsers([]);
            setChannelOnlineUsers({});
        };

        chatService.on('websocket_disconnected', handleWebSocketDisconnected);

        return () => {
            chatService.off('websocket_disconnected', handleWebSocketDisconnected);
        };
    }, []);

    /**
     * Effet pour gérer la connexion d'un utilisateur.
     * S'abonne à l'événement 'user_connected' du service de chat.
     */
    useEffect(() => {
        const handleUserConnected = (data) => {

            setOnlineUsers(prev => {
                // Éviter les doublons
                const exists = prev.find(u => u.userId === data.userId);
                if (exists) return prev;

                return [...prev, {
                    userId: data.userId,
                    username: data.username
                }];
            });
        };

        chatService.on('user_connected', handleUserConnected);

        return () => {
            chatService.off('user_connected', handleUserConnected);
        };
    }, []);

    /**
     * Effet pour gérer la déconnexion d'un utilisateur.
     * S'abonne à l'événement 'user_disconnected' du service de chat.
     */
    useEffect(() => {
        const handleUserDisconnected = (data) => {

            setOnlineUsers(prev =>
                prev.filter(u => u.userId !== data.userId)
            );

            // Retirer aussi de tous les channels
            setChannelOnlineUsers(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(channelId => {
                    updated[channelId] = updated[channelId].filter(u => u.userId !== data.userId);
                });
                return updated;
            });
        };

        chatService.on('user_disconnected', handleUserDisconnected);

        return () => {
            chatService.off('user_disconnected', handleUserDisconnected);
        };
    }, []);

    /**
     * Effet pour gérer les utilisateurs en ligne par channel.
     * S'abonne à l'événement 'channel_online_users' du service de chat.
     */
    useEffect(() => {
        const handleChannelOnlineUsers = (data) => {

            const channelId = String(data.channelId);
            const users = data.users || [];

            setChannelOnlineUsers(prev => {
                const existed = Object.prototype.hasOwnProperty.call(prev, channelId);

                if (!existed) {
                    return {
                        ...prev,
                        [channelId]: users
                    };
                }

                return {
                    ...prev,
                    [channelId]: users
                };
            });

            // Mettre à jour aussi la liste globale
            setOnlineUsers(prev => {
                const newUsers = [...prev];
                users.forEach(user => {
                    const exists = newUsers.find(u => u.userId === user.userId);
                    if (!exists) {
                        newUsers.push({ userId: user.userId, username: user.username });
                    }
                });
                return newUsers;
            });
        };

        chatService.on('channel_online_users', handleChannelOnlineUsers);

        return () => {
            chatService.off('channel_online_users', handleChannelOnlineUsers);
        };
    }, [user?.id]);

    /**
     * Effet pour ajouter ou retirer l'utilisateur courant à la liste des utilisateurs en ligne.
     * Se déclenche à chaque changement de l'utilisateur authentifié.
     */
    useEffect(() => {
        if (user) {
            setOnlineUsers(prev => {
                const exists = prev.find(u => u.userId === user.id);
                if (exists) return prev;

                return [...prev, {
                    userId: user.id,
                    username: user.name
                }];
            });
        } else {
            // Quand user devient null (déconnexion), nettoyer tout
            setOnlineUsers([]);
            setChannelOnlineUsers({});
        }
    }, [user]);

    /**
     * Vérifie si un utilisateur est en ligne.
     * @param {string} userId - L'ID de l'utilisateur à vérifier.
     * @returns {boolean} - True si l'utilisateur est en ligne, sinon false.
     */
    const isUserOnline = (userId) => {
        return onlineUsers.some(u => u.userId === userId);
    };

    /**
     * Obtenir les utilisateurs en ligne d'un channel spécifique.
     * @param {string} channelId - L'ID du channel.
     * @returns {Array} - Liste des utilisateurs en ligne dans le channel.
     */
    const getChannelOnlineUsers = (channelId) => {
        return channelOnlineUsers[String(channelId)] || [];
    };

    /**
     * Obtenir tous les utilisateurs en ligne globalement.
     * @returns {Array} - Liste de tous les utilisateurs en ligne.
     */
    const getAllOnlineUsers = () => {
        return onlineUsers;
    };

    /**
     * Efface la liste des utilisateurs en ligne (globale et par channel).
     */
    const clearOnlineUsers = () => {
        setOnlineUsers([]);
        setChannelOnlineUsers({});
    };

    const value = {
        onlineUsers,
        channelOnlineUsers,
        isUserOnline,
        getChannelOnlineUsers,
        getAllOnlineUsers,
        clearOnlineUsers,
    };

    return (
        <OnlineUsersContext.Provider value={value}>
            {children}
        </OnlineUsersContext.Provider>
    );
};

/**
 * Hook pour accéder au contexte des utilisateurs en ligne.
 * @returns {Object} - Les valeurs du contexte des utilisateurs en ligne.
 * @throws {Error} - Si le hook est utilisé en dehors d'un OnlineUsersProvider.
 */
export const useOnlineUsers = () => {
    const context = useContext(OnlineUsersContext);
    if (!context) {
        throw new Error('useOnlineUsers must be used within OnlineUsersProvider');
    }
    return context;
};

export default OnlineUsersContext;
