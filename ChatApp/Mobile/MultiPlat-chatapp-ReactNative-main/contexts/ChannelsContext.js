/**
 * @fileoverview Contexte de gestion des canaux et messages directs (DMs)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import apiService from '../services/apiService';
import chatService from '../services/chatService';
import * as notificationService from '../services/notificationService';
import i18n from '../constants/language/js/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Contexte de gestion des canaux
 */
const ChannelsContext = createContext({});

/**
 * Gestionnaire externe pour réinitialiser les canaux
 * Permet la réinitialisation depuis d'autres contextes
 */
export let _externalResetChannels = null;
export const registerChannelsResetHandler = (fn) => { _externalResetChannels = fn; };
export const unregisterChannelsResetHandler = () => { _externalResetChannels = null; };
export const triggerExternalResetChannels = async () => { try { if (_externalResetChannels) await _externalResetChannels(); } catch (_) {} };

/**
 * Provider du contexte des canaux
 * Gère le chargement, la création, la sélection des canaux et DMs
 * Écoute les événements WebSocket pour les nouveaux canaux et invitations
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composants enfants
 * @returns {JSX.Element} Provider avec le contexte des canaux
 */
export const ChannelsProvider = ({ children }) => {
    const [channels, setChannels] = useState([]);
    const [dms, setDms] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadChannels = useCallback(async () => {
        setLoading(true);
        try {
            // Charger channels publics/privés
            const channelsResult = await apiService.getChannels();
            if (channelsResult.success && channelsResult.data?.data?.data) {
                const allChannels = channelsResult.data.data.data;

                const filtered = allChannels.filter(ch => ch.type !== 'dm');

                setChannels(filtered);
            } else {
                setChannels([]);
            }

            // Protection complète contre undefined
            const dmsResult = await apiService.getDMs();
            if (dmsResult.success && dmsResult.data) {
                const dmsData = Array.isArray(dmsResult.data.data)
                    ? dmsResult.data.data
                    : Array.isArray(dmsResult.data)
                        ? dmsResult.data
                        : [];


                setDms(dmsData);
            } else {
                setDms([]);
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            setChannels([]); // En cas d'erreur
            setDms([]); // En cas d'erreur
        } finally {
            setLoading(false);
        }
    }, []);

    // Créer un channel
    const createChannel = useCallback(async (channelData) => {
        try {
            const result = await apiService.createChannel(channelData);
            if (result.success) {
                await loadChannels();
                notificationService.success(
                    i18n.t('pages.createChannel.success') || 'Salon créé avec succès'
                );
                return { success: true, data: result.data };
            }
            return { success: false, error: result.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [loadChannels]);

    // Rejoindre un channel
    const joinChannel = useCallback(async (channelId, userId) => {
        try {
            const result = await apiService.joinChannel(channelId, userId);
            if (result.success) {
                const ch = channels.find(c => c.id === channelId);
                const channelName = ch?.name; // Ajout de ?. pour sécurité

                if (channelName) {
                    notificationService.success(i18n.t('joinedChannel', { channel: channelName }));
                }
                await loadChannels();
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [channels, loadChannels]);

    // Quitter un channel
    const leaveChannel = useCallback(async (channelId) => {
        try {
            const ch = channels.find(c => c.id === channelId);
            const channelName = ch?.name || String(channelId);

            const result = await apiService.leaveChannel(channelId);
            if (result.success) {
                await loadChannels();
                if (selectedChannel?.id === channelId) {
                    setSelectedChannel(null);
                }
                notificationService.info(i18n.t('leftChannel', { channel: channelName }));
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [channels, loadChannels, selectedChannel?.id]);

    // Créer un DM
    const createDM = useCallback(async (userId) => {
        try {
            const result = await apiService.createDM({ user_id: userId });
            if (result.success) {
                await loadChannels();
                notificationService.success(i18n.t('directMessageCreated'));
                return { success: true, data: result.data };
            }
            return { success: false, error: result.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [loadChannels]);

    // Sélectionner un channel
    const selectChannel = useCallback((channel) => {
        setSelectedChannel(channel);
        if (channel) {
            chatService.websocketService?.subscribeToChannel(channel.id);
        }
    }, []);

    // register external reset handler so AuthContext can call it
    useEffect(() => {
        const resetChannels = async () => {
            try {
                if (selectedChannel && selectedChannel.id) {
                    try { chatService.websocketService?.unsubscribeFromChannel(selectedChannel.id); } catch (_) {}
                }
                // remove persisted selection keys (best-effort)
                try {
                    await Promise.all([
                        AsyncStorage.removeItem('selectedChannel'),
                        AsyncStorage.removeItem('@selectedChannel'),
                        AsyncStorage.removeItem('selectedDm'),
                        AsyncStorage.removeItem('@selectedDm')
                    ]);
                } catch (_) {}
            } catch (_) {}
            setSelectedChannel(null);
        };
        registerChannelsResetHandler(resetChannels);
        return () => { unregisterChannelsResetHandler(); };
    }, [selectedChannel]);

    // Listener WebSocket - DM créé
    useEffect(() => {
        const handleDMCreated = (_data) => {
            console.log('DM created:', _data);
            loadChannels();
        };

        chatService.on('dm_created', handleDMCreated);

        return () => {
            chatService.off('dm_created', handleDMCreated);
        };
    }, [loadChannels]);

    // Listener WebSocket - Invitation acceptée (nouveau membre)
    useEffect(() => {
        const handleInvitationAccepted = (data) => {
            console.log('Invitation accepted:', data);
            loadChannels();
        };

        chatService.on('invitation_accepted', handleInvitationAccepted);

        return () => {
            chatService.off('invitation_accepted', handleInvitationAccepted);
        };
    }, [loadChannels]);

    useEffect(() => {
        const handleUserlistUpdate = (data) => {
            console.log('Userlist update:', data);
            // Refresh channel si c'est le channel actif
            const selId = selectedChannel?.id;
            if (selId && data.channelId === String(selId)) {
                loadChannels();
            }
        };

        chatService.on('userlist_update', handleUserlistUpdate);

        return () => {
            chatService.off('userlist_update', handleUserlistUpdate);
        };
    }, [selectedChannel?.id, loadChannels]);

    const value = useMemo(() => ({
        channels,
        dms,
        selectedChannel,
        loading,
        loadChannels,
        createChannel,
        joinChannel,
        leaveChannel,
        createDM,
        selectChannel,
    }), [channels, dms, selectedChannel, loading, loadChannels, createChannel, joinChannel, leaveChannel, createDM, selectChannel]);

    return (
        <ChannelsContext.Provider value={value}>
            {children}
        </ChannelsContext.Provider>
    );
};

export const useChannels = () => {
    const context = useContext(ChannelsContext);
    if (!context) {
        throw new Error('useChannels must be used within ChannelsProvider');
    }
    return context;
};

export default ChannelsContext;
