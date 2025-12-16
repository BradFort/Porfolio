/**
 * @fileoverview Hook personnalisé pour la gestion des fonctionnalités administrateur
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { useState } from 'react';
import apiService from '../services/apiService';

/**
 * Hook personnalisé pour la gestion administrative de l'application
 * Fournit des fonctions pour charger et gérer les utilisateurs, canaux, DMs et messages
 * @returns {Object} Objet contenant les états et fonctions d'administration
 * @returns {Array} users - Liste des utilisateurs
 * @returns {Array} channels - Liste des canaux
 * @returns {Array} dms - Liste des messages directs
 * @returns {Array} messages - Liste des messages
 * @returns {boolean} isLoading - Indicateur de chargement
 * @returns {string|null} error - Message d'erreur s'il y en a une
 * @returns {Function} loadUsers - Charge tous les utilisateurs
 * @returns {Function} loadChannels - Charge tous les canaux
 * @returns {Function} loadDMs - Charge tous les DMs
 * @returns {Function} loadMessages - Charge tous les messages selon un filtre
 * @returns {Function} deleteUser - Supprime un utilisateur
 * @returns {Function} deleteChannel - Supprime un canal
 * @returns {Function} deleteMessage - Supprime un message
 * @returns {Function} clearError - Réinitialise l'erreur
 */
export const useAdmin = () => {
    const [users, setUsers] = useState([]);
    const [channels, setChannels] = useState([]);
    const [dms, setDms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Charge tous les utilisateurs depuis l'API
     * Met à jour l'état 'users' avec la liste récupérée
     * Gère les états de chargement et d'erreur
     * @async
     * @returns {Promise<void>}
     */
    const loadUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiService.getAllUsers();
            if (result.success) {
                const data = result.data;
                let usersArray = [];
                usersArray = data?.data
                setUsers(usersArray);
            } else {
                setError('Erreur lors du chargement des utilisateurs');
            }
        } catch (_err) {
            setError('Erreur lors du chargement des utilisateurs');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Charge tous les canaux (publics et privés) depuis l'API
     * Filtre les doublons par ID de canal
     * Met à jour l'état 'channels' avec la liste unique récupérée
     * @async
     * @returns {Promise<void>}
     */
    const loadChannels = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiService.getChannels();

            if (result.success) {
                const allChannels = result.data?.data?.data || result.data || [];

                const uniqueChannels = allChannels.filter((channel, index, self) => {
                    return self.findIndex(c => c.id === channel.id) === index;
                });

                setChannels(uniqueChannels);
            } else {
                console.error('❌ Erreur API getChannels:', result.error);
                setError('Erreur lors du chargement des salons');
            }
        } catch (_err) {
            console.error('💥 Exception dans loadChannels:', _err);
            setError('Erreur lors du chargement des salons');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Charge tous les messages directs (DMs) depuis l'API
     * Filtre les canaux de type 'dm' et élimine les doublons
     * Met à jour l'état 'dms' avec la liste unique récupérée
     * @async
     * @returns {Promise<void>}
     */
    const loadDMs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await apiService.getChannels();
            if (result.success) {
                const allChannels = result.data?.data?.data || result.data || [];

                const uniqueDMs = allChannels
                    .filter((channel, index, self) => {
                        return self.findIndex(c => c.id === channel.id) === index;
                    })
                    .filter(channel => {
                        return channel.type === 'dm';
                    });

                setDms(uniqueDMs);
            } else {
                setError('Erreur lors du chargement des DMs');
            }
        } catch (_err) {
            setError('Erreur lors du chargement des DMs');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Charge tous les messages selon un filtre spécifié
     * @async
     * @param {string} filter - Type de messages à charger ('all', 'dms', 'channels')
     * @returns {Promise<void>}
     */
    const loadMessages = async (filter = 'all') => {
        setIsLoading(true);
        setError(null);
        try {
            let allMessages = [];

            const channelsResult = await apiService.getChannels();
            const channels = channelsResult.data?.data?.data || channelsResult.data || [];

            if (filter === 'dms') {
                const dmChannels = channels.filter(c => c.type === 'dm');
                for (const channel of dmChannels) {
                    const result = await apiService.getMessages(channel.id);
                    const msgs = result.data?.data || result.data || [];
                    allMessages = allMessages.concat(msgs.map(msg => ({
                        ...msg,
                        channelName: channel.name,
                        channelType: 'dm'
                    })));
                }
            } else if (filter === 'channels') {
                const normalChannels = channels.filter(
                    c => c.type === 'public' || c.type === 'private'
                );
                for (const channel of normalChannels) {
                    const result = await apiService.getMessages(channel.id);
                    const msgs = result.data?.data || result.data || [];
                    allMessages = allMessages.concat(msgs.map(msg => ({
                        ...msg,
                        channelName: channel.name,
                        channelType: channel.type
                    })));
                }
            } else {
                for (const channel of channels) {
                    const result = await apiService.getMessages(channel.id);
                    const msgs = result.data?.data || result.data || [];
                    allMessages = allMessages.concat(msgs.map(msg => ({
                        ...msg,
                        channelName: channel.name,
                        channelType: channel.type
                    })));
                }
            }

            setMessages(allMessages);
        } catch (_err) {
            setError('Erreur lors du chargement des messages');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Supprime un utilisateur par son ID
     * Met à jour l'état local en retirant l'utilisateur de la liste
     * @async
     * @param {number} userId - ID de l'utilisateur à supprimer
     * @returns {Promise<Object>} Objet avec {success: boolean, error?: string}
     */
    const deleteUser = async (userId) => {
        try {
            const result = await apiService.deleteUser(userId);
            if (result.success) {
                setUsers(prev => prev.filter(user => user.id !== userId));
                return { success: true };
            } else {
                return { success: false, error: 'Erreur lors de la suppression' };
            }
        } catch (_err) {
            return { success: false, error: 'Erreur lors de la suppression' };
        }
    };

    /**
     * Supprime un canal par son ID
     * Met à jour l'état local en retirant le canal de la liste
     * @async
     * @param {number} channelId - ID du canal à supprimer
     * @returns {Promise<Object>} Objet avec {success: boolean, error?: string}
     */
    const deleteChannel = async (channelId) => {
        try {
            const result = await apiService.deleteChannel(channelId);
            if (result.success) {
                setChannels(prev => prev.filter(channel => channel.id !== channelId));
                return { success: true };
            } else {
                return { success: false, error: 'Erreur lors de la suppression' };
            }
        } catch (_err) {
            return { success: false, error: 'Erreur lors de la suppression' };
        }
    };

    /**
     * Supprime un message par son ID
     * Met à jour l'état local en retirant le message de la liste
     * @async
     * @param {number} messageId - ID du message à supprimer
     * @returns {Promise<Object>} Objet avec {success: boolean, error?: string}
     */
    const deleteMessage = async (messageId) => {
        try {
            const result = await apiService.deleteMessage(messageId);
            if (result.success) {
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
                return { success: true };
            } else {
                return { success: false, error: 'Erreur lors de la suppression' };
            }
        } catch (_err) {
            return { success: false, error: 'Erreur lors de la suppression' };
        }
    };

    return {
        users,
        channels,
        dms,
        messages,
        isLoading,
        error,
        loadUsers,
        loadChannels,
        loadDMs,
        loadMessages,
        deleteUser,
        deleteChannel,
        deleteMessage,
        clearError: () => setError(null)
    };
};