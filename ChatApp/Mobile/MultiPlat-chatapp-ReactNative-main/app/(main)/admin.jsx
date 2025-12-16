/**
 * @fileoverview Interface d'administration (gestion des utilisateurs, tickets, statistiques, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { XPButton } from '../../components/XPButton';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '../../hooks/useAdmin';
import { useConfirmation } from '../../hooks/useConfirmation';
import { useChannels } from '../../contexts/ChannelsContext';
import { useTheme } from '../../contexts/ThemeContext';
import '../../constants/language/js/i18n';
import { createStyles } from './AdminPanel.styles';

export default function AdminPanel() {
    const { t } = useTranslation();
    const { theme, isDarkMode } = useTheme(); // ← Ajout du hook useTheme
    const [activeModal, setActiveModal] = useState(null);
    const [messageFilter, setMessageFilter] = useState('all');
    const {
        users,
        channels,
        messages,
        isLoading,
        error,
        loadUsers,
        loadChannels,
        loadMessages,
        deleteUser,
        deleteChannel,
        deleteMessage
    } = useAdmin();

    const { confirmDelete } = useConfirmation();

    const usersList = Array.isArray(users) ? users : [];
    const channelsList = Array.isArray(channels) ? channels : [];
    const messagesList = Array.isArray(messages) ? messages : [];

    // Hook pour rafraîchir l'affichage principal
    const { loadChannels: refreshMainChannels } = useChannels();

    /**
     * Supprime un utilisateur après confirmation.
     * @function handleDeleteUser
     * @param {Object} user - L'utilisateur à supprimer
     */
    const handleDeleteUser = (user) => {
        confirmDelete(user.name, t('user').toLowerCase(), async () => {
            const result = await deleteUser(user.id);
            if (!result.success) {
                console.error('Erreur suppression utilisateur:', result.error);
            } else {
                loadUsers();
                refreshMainChannels();
            }
        });
    };

    /**
     * Supprime un salon après confirmation.
     * @function handleDeleteChannel
     * @param {Object} channel - Le salon à supprimer
     */
    const handleDeleteChannel = (channel) => {
        const getDisplayName = () => {
            if (channel.type === 'dm') {
                const description = channel.description || '';
                return description.replace(/^Message direct entre\s*/i, '');
            } else {
                return channel.name || channel.description;
            }
        };

        confirmDelete(getDisplayName(), t('channel').toLowerCase(), async () => {
            const result = await deleteChannel(channel.id);
            if (!result.success) {
                console.error('Erreur suppression salon:', result.error);
            } else {
                loadChannels();
                refreshMainChannels();
            }
        });
    };

    /**
     * Supprime un message après confirmation.
     * @function handleDeleteMessage
     * @param {Object} message - Le message à supprimer
     */
    const handleDeleteMessage = (message) => {
        confirmDelete(message.content, t('message').toLowerCase(), async () => {
            const result = await deleteMessage(message.id);
            if (!result.success) {
                console.error('Erreur suppression message:', result.error);
            } else {
                loadMessages(messageFilter);
            }
        });
    };

    /**
     * Ouvre le modal de gestion des utilisateurs et recharge la liste.
     * @function openUsersModal
     */
    const openUsersModal = () => {
        setActiveModal('users');
        loadUsers();
    };

    /**
     * Ouvre le modal de gestion des salons et recharge la liste.
     * @function openChannelsModal
     */
    const openChannelsModal = () => {
        setActiveModal('channels');
        loadChannels();
    };

    /**
     * Ouvre le modal de gestion des messages et recharge la liste.
     * @function openMessagesModal
     */
    const openMessagesModal = () => {
        setActiveModal('messages');
        loadMessages('all');
    };

    /**
     * Applique un filtre sur les messages affichés.
     * @function handleMessageFilter
     * @param {string} filter - Le filtre à appliquer (all, channels, dms)
     */
    const handleMessageFilter = (filter) => {
        setMessageFilter(filter);
        loadMessages(filter);
    };

    // Styles dynamiques basés sur le thème
    const styles = createStyles(theme);

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: theme.xpGray}}>
            <View style={styles.container}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.xpBlue}/>

                <View style={styles.titleBar}>
                    <TouchableOpacity onPress={() => router.replace('/(main)')} style={[styles.backButton, { justifyContent: 'center', alignItems: 'center', height: 40 }]} hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}>
                        <View style={[styles.backButtonBox, { justifyContent: 'center', alignItems: 'center', height: 40 }]}>
                            <Text style={[styles.backButtonText, { fontSize: 32, marginTop: -8, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }]}>←</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.windowIcon}/>
                    <Text style={styles.titleBarText}>{t('adminPanel')}</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.panelContainer}>
                        <Text style={styles.title}>{t('adminPanel')}</Text>

                        <View style={styles.buttonContainer}>
                            <XPButton
                                title={t('manageUsers')}
                                onPress={openUsersModal}
                                style={styles.adminButton}
                            />
                            <XPButton
                                title={t('manageChannels')}
                                onPress={openChannelsModal}
                                style={styles.adminButton}
                            />
                            <XPButton
                                title={t('manageMessages')}
                                onPress={openMessagesModal}
                                style={styles.adminButton}
                            />
                        </View>

                        {/* Modal Utilisateurs */}
                        {activeModal === 'users' && (
                            <View style={styles.modal}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{t('userManagement')}</Text>
                                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                                        <Text style={styles.closeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                {isLoading ? (
                                    <ActivityIndicator size="large" color={theme.xpBlue} style={{ padding: 20 }} />
                                ) : error ? (
                                    <Text style={styles.errorText}>{error}</Text>
                                ) : (
                                    <ScrollView style={styles.listContainer}>
                                        {usersList.map((user) => (
                                            <View key={user.id} style={styles.listItem}>
                                                <Text style={styles.itemName}>{user.name} ({user.email})</Text>
                                                <XPButton
                                                    title={t('delete')}
                                                    onPress={() => handleDeleteUser(user)}
                                                    style={styles.deleteButton}
                                                />
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        )}

                        {/* Modal Salons */}
                        {activeModal === 'channels' && (
                            <View style={styles.modal}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{t('channelManagement')}</Text>
                                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                                        <Text style={styles.closeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                {isLoading ? (
                                    <ActivityIndicator size="large" color={theme.xpBlue} style={{ padding: 20 }} />
                                ) : error ? (
                                    <Text style={styles.errorText}>{error}</Text>
                                ) : (
                                    <ScrollView style={styles.listContainer}>
                                        {(() => {
                                            return channelsList.map((channel) => {
                                                const getDisplayName = () => {
                                                    if (channel.type === 'dm') {
                                                        const description = channel.description || '';
                                                        return description.replace(/^Message direct entre\s*/i, '');
                                                    } else {
                                                        return channel.name || channel.description;
                                                    }
                                                };

                                                return (
                                                    <View key={channel.id} style={styles.listItem}>
                                                        <Text style={styles.itemName}>
                                                            {channel.type === 'dm' ? '💬 ' : '# '}{getDisplayName()}
                                                        </Text>
                                                        <XPButton
                                                            title={t('delete')}
                                                            onPress={() => handleDeleteChannel(channel)}
                                                            style={styles.deleteButton}
                                                        />
                                                    </View>
                                                );
                                            });
                                        })()}
                                    </ScrollView>
                                )}
                            </View>
                        )}

                        {/* Modal Messages */}
                        {activeModal === 'messages' && (
                            <View style={styles.modal}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{t('messageManagement')}</Text>
                                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                                        <Text style={styles.closeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Filtres pour les messages */}
                                <View style={styles.filterContainer}>
                                    <TouchableOpacity
                                        style={[styles.filterButton, messageFilter === 'all' && styles.activeFilter]}
                                        onPress={() => handleMessageFilter('all')}
                                    >
                                        <Text style={styles.filterText}>{t('filterAll')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.filterButton, messageFilter === 'channels' && styles.activeFilter]}
                                        onPress={() => handleMessageFilter('channels')}
                                    >
                                        <Text style={styles.filterText}>{t('filterChannels')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.filterButton, messageFilter === 'dms' && styles.activeFilter]}
                                        onPress={() => handleMessageFilter('dms')}
                                    >
                                        <Text style={styles.filterText}>{t('filterDMs')}</Text>
                                    </TouchableOpacity>
                                </View>

                                {isLoading ? (
                                    <ActivityIndicator size="large" color={theme.xpBlue} style={{ padding: 20 }} />
                                ) : error ? (
                                    <Text style={styles.errorText}>{error}</Text>
                                ) : (
                                    <ScrollView style={styles.listContainer}>
                                        {messagesList.map((message) => (
                                            <View key={message.id} style={styles.listItem}>
                                                <View style={styles.messageInfo}>
                                                    <Text style={styles.itemName} numberOfLines={2}>
                                                        {message.content}
                                                    </Text>
                                                    <Text style={styles.messageChannel}>
                                                        {message.channelName} ({message.channelType})
                                                    </Text>
                                                </View>
                                                <XPButton
                                                    title={t('delete')}
                                                    onPress={() => handleDeleteMessage(message)}
                                                    style={styles.deleteButton}
                                                />
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.statusBar}>
                    <View style={styles.statusSection}>
                        <Text style={styles.statusText}>{t('adminPanel')}</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}