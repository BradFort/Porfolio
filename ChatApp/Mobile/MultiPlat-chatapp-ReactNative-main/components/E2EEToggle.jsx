/**
 * @fileoverview Composant de bascule E2EE (chiffrement de bout en bout) pour les salons ou DMs.
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import E2EEDMService from '../services/crypto/E2EEDMService';
import apiService from '../services/apiService';
import chatService from '../services/chatService';

/**
 * Composant E2EEToggle
 * Permet d'activer ou désactiver le chiffrement de bout en bout pour un salon ou DM.
 * @component
 * @param {Object} props
 * @param {boolean} props.enabled - État actuel du chiffrement
 * @param {function} props.onToggle - Callback lors du changement d'état
 * @param {boolean} [props.loading] - Indique si une opération est en cours
 * @returns {JSX.Element}
 */

/**
 * Composant Toggle E2EE pour les DM
 * Affiche un switch pour activer/désactiver le chiffrement de bout en bout
 * Seul l'utilisateur qui active peut désactiver
 */
export default function E2EEToggle({ dmId, currentUserId, theme }) {
    const { t } = useTranslation();
    const [e2eeEnabled, setE2eeEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [enabledBy, setEnabledBy] = useState(null);
    const [enabledByName, setEnabledByName] = useState(null);

    useEffect(() => {
        initializeE2EE();
        setupWebSocketListeners();

        return () => {
            chatService.off('e2ee_status_changed', handleE2EEStatusChanged);
            chatService.off('dm_e2ee_enabled', handleE2EEEnabled);
            chatService.off('dm_e2ee_disabled', handleE2EEDisabled);
        };
    }, [dmId]);

    // Recharger l'état E2EE quand le composant devient visible ou que l'utilisateur change
    useEffect(() => {
        if (currentUserId && dmId) {
            // Recharger l'état depuis le serveur
            reloadE2EEState();
        }
    }, [currentUserId, dmId]);

    /**
     * Recharge l'état E2EE depuis le serveur et met à jour l'état local
     */
    const reloadE2EEState = async () => {
        try {
            const result = await loadE2EEStateFromChannel(dmId);

            if (result) {
                setE2eeEnabled(result.enabled);
                setEnabledBy(result.enabledBy);

                // Synchroniser avec le service local
                await E2EEDMService.syncE2EEState(
                    dmId,
                    result.enabled,
                    result.enabledBy,
                    Date.now()
                );

                // Charger le nom de l'utilisateur si nécessaire
                if (result.enabled && result.enabledBy && result.enabledBy !== currentUserId) {
                    const name = await getChannelMemberName(dmId, result.enabledBy);
                    setEnabledByName(name);
                } else {
                    setEnabledByName(null);
                }
            }
        } catch (error) {
            console.error('[E2EE-Toggle] Erreur lors du rechargement:', error);
        }
    };

    /**
     * Initialise l'état E2EE en chargeant les paramètres depuis le serveur
     */
    const initializeE2EE = async () => {
        try {
            await E2EEDMService.initialize();

            // Charger l'état depuis le serveur (comme dans la version desktop)
            const result = await loadE2EEStateFromChannel(dmId);

            if (result) {
                setE2eeEnabled(result.enabled);
                setEnabledBy(result.enabledBy);

                // Synchroniser avec le service local
                await E2EEDMService.syncE2EEState(
                    dmId,
                    result.enabled,
                    result.enabledBy,
                    Date.now()
                );

                // Charger le nom de l'utilisateur si nécessaire
                if (result.enabled && result.enabledBy && result.enabledBy !== currentUserId) {
                    const name = await getChannelMemberName(dmId, result.enabledBy);
                    setEnabledByName(name);
                }
            }
        } catch (error) {
            console.error('[E2EE-Toggle] Initialization error:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Charge l'état E2EE depuis le channel (comme dans la version desktop)
     */
    const loadE2EEStateFromChannel = async (channelId) => {
        try {
            const channelResponse = await apiService.getChannel(channelId);
            if (!channelResponse.success) {
                if (channelResponse.status === 403) {
                    console.log('[E2EE] Accès refusé au DM:', channelId);
                    return null;
                }

                console.error('[E2EE] ❌ Impossible de récupérer le DM:', channelResponse);
                return { enabled: false, enabledBy: null };
            }

            if (!channelResponse.data?.data) {
                console.error('[E2EE] ❌ Données DM manquantes:', channelResponse);
                return { enabled: false, enabledBy: null };
            }

            const channel = channelResponse.data.data;

            const enabled = Boolean(
                channel.e2ee_enabled === true ||
                channel.e2ee_enabled === 1 ||
                channel.e2ee_enabled === '1'
            );
            const enabledBy = enabled && channel.e2ee_enabled_by
                ? Number(channel.e2ee_enabled_by)
                : null;

            console.log('[E2EE] ✅ État E2EE calculé:', { enabled, enabledBy });
            return { enabled, enabledBy };
        } catch (error) {
            console.error('[E2EE] ❌ Erreur lors du chargement:', error);
            return { enabled: false, enabledBy: null };
        }
    };

    /**
     * Récupère le nom d'un membre du DM
     */
    const getChannelMemberName = async (channelId, userId) => {
        try {
            const membersResponse = await apiService.getChannelMembers(channelId);

            if (membersResponse.success && membersResponse.data) {
                const members = membersResponse.data.data || membersResponse.data;
                const member = members.find((m) => {
                    const memberId = m.user_id || (m.user && m.user.id) || m.id;
                    return memberId === userId;
                });

                if (member) {
                    return member.user_name || (member.user && member.user.name) || member.name || null;
                }
            }

            return null;
        } catch (error) {
            console.error('[E2EE] Erreur lors de la récupération du nom du membre:', error);
            return null;
        }
    };

    /**
     * Configure les écouteurs WebSocket pour les événements liés à E2EE
     */
    const setupWebSocketListeners = () => {
        chatService.on('e2ee_status_changed', handleE2EEStatusChanged);

        // Listeners spécifiques aux DM
        chatService.on('dm_e2ee_enabled', handleE2EEEnabled);
        chatService.on('dm_e2ee_disabled', handleE2EEDisabled);
    };

    /**
     * Gère le changement d'état E2EE suite à un événement WebSocket
     */
    const handleE2EEStatusChanged = async (data) => {
        if (data.channelId === dmId || data.dmId === dmId) {
            await refreshToggleState(data.channelId || data.dmId, data.enabled, data.enabledBy);
        }
    };

    /**
     * Gère l'activation de l'E2EE suite à un événement WebSocket
     */
    const handleE2EEEnabled = async (data) => {
        if (data.dmId === dmId) {
            await refreshToggleState(data.dmId, true, data.enabledBy);
        }
    };

    /**
     * Gère la désactivation de l'E2EE suite à un événement WebSocket
     */
    const handleE2EEDisabled = async (data) => {
        if (data.dmId === dmId) {
            await refreshToggleState(data.dmId, false, null);
        }
    };

    /**
     * Rafraîchit l'état du toggle suite à un événement WebSocket
     */
    const refreshToggleState = async (channelId, enabled, enabledBy) => {
        console.log('[E2EE] Rafraîchissement de l\'état:', { channelId, enabled, enabledBy });

        setE2eeEnabled(enabled);
        setEnabledBy(enabledBy);

        // Synchroniser avec le service local
        await E2EEDMService.syncE2EEState(
            channelId,
            enabled,
            enabledBy,
            Date.now()
        );

        if (enabled && enabledBy && enabledBy !== currentUserId) {
            const name = await getChannelMemberName(channelId, enabledBy);
            setEnabledByName(name);
        } else {
            setEnabledByName(null);
        }
    };

    /**
     * Gère le changement d'état du toggle (activation/désactivation de l'E2EE)
     */
    const handleToggle = async () => {
        if (toggling) return;

        const canToggle = E2EEDMService.canToggleE2EE(dmId, currentUserId);

        if (e2eeEnabled && !canToggle.canDisable) {
            const displayName = enabledByName || `l'utilisateur #${enabledBy}`;
            Alert.alert(
                t('e2eeCannotDisable') || 'Impossible de désactiver',
                `⚠️ Le chiffrement a été activé par ${displayName}. Seul cet utilisateur peut le désactiver.`
            );
            return;
        }

        setToggling(true);

        try {
            if (e2eeEnabled) {
                const result = await apiService.disableE2EEForDM(dmId, currentUserId);

                if (result.success) {
                    const disableResult = await E2EEDMService.disableE2EE(dmId, currentUserId);
                    if (disableResult.success) {
                        setE2eeEnabled(false);
                        setEnabledBy(null);
                        setEnabledByName(null);
                        Alert.alert(
                            t('e2eeDisabled') || 'E2EE désactivé',
                            '⚠️ E2EE désactivé pour les nouveaux messages'
                        );
                    }
                } else {
                    Alert.alert(
                        t('error') || 'Erreur',
                        result.data?.message || result.data?.error || t('e2eeDisableError') || 'Erreur lors de la désactivation de l\'E2EE'
                    );
                }
            } else {
                // Activer E2EE
                console.log('[E2EE-Toggle] Tentative d\'activation E2EE pour DM:', dmId);
                const result = await apiService.enableE2EEForDM(dmId, currentUserId);

                console.log('[E2EE-Toggle] Résultat de l\'API enableE2EEForDM:', result);

                if (result.success) {
                    const enableSuccess = await E2EEDMService.enableE2EE(dmId, currentUserId);
                    console.log('[E2EE-Toggle] Résultat du service local:', enableSuccess);

                    if (enableSuccess) {
                        setE2eeEnabled(true);
                        setEnabledBy(currentUserId);
                        setEnabledByName(null);
                        Alert.alert(
                            t('e2eeEnabled') || 'E2EE activé',
                            '✅ Chiffrement E2EE activé ! Seul vous pouvez le désactiver.'
                        );
                    }
                } else {
                    console.error('[E2EE-Toggle] Erreur API:', result);
                    Alert.alert(
                        t('error') || 'Erreur',
                        result.data?.message || result.data?.error || result.error || t('e2eeEnableError') || "Erreur lors de l'activation de l'E2EE"
                    );
                }
            }
        } catch (error) {
            console.error('[E2EE-Toggle] Toggle error:', error);
            Alert.alert(
                t('error') || 'Erreur',
                t('e2eeToggleError') || 'Une erreur est survenue'
            );
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.xpGray }]}>
                <ActivityIndicator size="small" color={theme.xpBlue} />
            </View>
        );
    }

    const isOwner = enabledBy === currentUserId;
    const canDisable = e2eeEnabled && isOwner;
    const isLockedByOther = e2eeEnabled && !isOwner;

    return (
        <View style={[styles.container, { backgroundColor: theme.xpGray }]}>
            <TouchableOpacity
                style={[
                    styles.toggle,
                    {
                        backgroundColor: e2eeEnabled ? theme.xpGreen : theme.xpRed,
                        opacity: isLockedByOther ? 0.6 : 1
                    }
                ]}
                onPress={handleToggle}
                disabled={toggling || isLockedByOther}
                activeOpacity={0.7}
            >
                {toggling ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Text style={styles.icon}>
                            {e2eeEnabled ? '🔒' : '🔓'}
                        </Text>
                        <Text style={styles.label}>E2EE</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Affichage de l'info selon l'état */}
            {isLockedByOther && (
                <Text style={[styles.hint, { color: theme.xpOrange }]}>
                    🔒 {enabledByName ? `Par ${enabledByName}` : t('e2eeLockedByOther')}
                </Text>
            )}
            {e2eeEnabled && isOwner && (
                <Text style={[styles.hint, { color: theme.xpGreen }]}>
                    ✓ Par vous
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#000',
        borderRightWidth: 2,
        gap: 8
    },
    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#000',
        borderBottomWidth: 2,
        borderRightWidth: 2,
        gap: 6
    },
    icon: {
        fontSize: 14
    },
    label: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    hint: {
        fontSize: 10,
        fontStyle: 'italic',
        fontWeight: '600'
    }
});