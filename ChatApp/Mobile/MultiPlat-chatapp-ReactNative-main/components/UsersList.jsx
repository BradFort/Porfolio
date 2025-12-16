/**
 * @fileoverview Composant liste d'utilisateurs (affichage, sélection, etc.).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useChannels } from '../contexts/ChannelsContext';
import { useOnlineUsers } from '../contexts/OnlineUsersContext';
import { useTranslation } from 'react-i18next';
import { UserContextMenu } from './UserContextMenu';

/**
 * Composant UsersList
 * Affiche une liste d'utilisateurs avec gestion de la sélection et des actions contextuelles.
 * @component
 * @param {Object} props
 * @param {Array} props.users - Liste des utilisateurs à afficher
 * @param {Function} [props.onUserPress] - Callback lors d'un clic sur un utilisateur
 * @param {Function} [props.onUserLongPress] - Callback lors d'un appui long sur un utilisateur
 * @param {Object} [props.theme] - Thème de l'application
 * @returns {JSX.Element}
 */

export const UsersListSidebar = ({ channel, theme, styles }) => {
    const { user } = useAuth();
    const { isUserOnline } = useOnlineUsers();
    const { createDM } = useChannels();
    const { t } = useTranslation();

    const [expanded, setExpanded] = useState(true);
    const [contextMenu, setContextMenu] = useState(null);
    const [longPressTimer, setLongPressTimer] = useState(null);

    if (!channel) return null;

    const members = channel.members || [];
    const onlineMembers = members.filter(member => isUserOnline(member.id));
    const offlineMembers = members.filter(member => !isUserOnline(member.id));

    /**
     * Démarre le gestionnaire d'appui long pour un membre donné.
     * @param {Object} member - Le membre pour lequel démarrer l'appui long
     * @param {Object} event - L'événement de l'appui long
     */
    const handleLongPressStart = (member, event) => {
        if (member.id === user?.id) return;

        const timer = setTimeout(() => {
            const { pageX, pageY } = event.nativeEvent;
            setContextMenu({
                user: member,
                position: { x: pageX, y: pageY },
            });
        }, 500);

        setLongPressTimer(timer);
    };

    /**
     * Termine le gestionnaire d'appui long.
     */
    const handleLongPressEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    /**
     * Ferme le menu contextuel.
     */
    const handleCloseContextMenu = () => setContextMenu(null);

    /**
     * Crée un DM (message direct) avec un utilisateur sélectionné.
     * @param {Object} selectedUser - L'utilisateur avec lequel créer un DM
     */
    const handleCreateDM = async (selectedUser) => {
        try {
            const result = await createDM(selectedUser.id);
            if (!result.success) {
                alert(result.error || t('errorCreatingDM') || 'Erreur lors de la création du DM');
            }
        } catch (error) {
            console.error('Error creating DM:', error);
            alert(t('errorCreatingDM') || 'Erreur lors de la création du DM');
        }
    };

    /**
     * Rendu d'un élément utilisateur.
     * @param {Object} member - Le membre à rendre
     * @param {boolean} isOnline - Indique si le membre est en ligne
     * @returns {JSX.Element}
     */
    const renderUserItem = (member, isOnline) => {
        const isCurrentUser = member.id === user?.id;

        return (
            <TouchableOpacity
                key={member.id}
                style={styles.userItem}
                onPressIn={(e) => handleLongPressStart(member, e)}
                onPressOut={handleLongPressEnd}
                activeOpacity={isCurrentUser ? 1 : 0.7}
                disabled={isCurrentUser}
            >
                <View style={[
                    styles.userStatusDot,
                    { backgroundColor: isOnline ? theme.xpGreen : theme.xpTextLight }
                ]} />
                <Text style={[
                    styles.userName,
                    !isOnline && styles.userNameOffline
                ]}>
                    {member.name}{isCurrentUser ? ` (${t('you')})` : ''}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setExpanded(!expanded)}
            >
                <View style={[styles.sectionIcon, { backgroundColor: theme.xpOrange }]} />
                <Text style={styles.sectionHeaderText}>
                    {t('users')} ({members.length})
                </Text>
                <Text style={styles.expandButton}>{expanded ? '▼' : '►'}</Text>
            </TouchableOpacity>

            {expanded && (
                <ScrollView style={styles.channelsList}>
                    {onlineMembers.length > 0 && (
                        <View style={styles.userListSection}>
                            <Text style={styles.userSectionTitle}>
                                {t('online', { count: onlineMembers.length })}
                            </Text>
                            {onlineMembers.map((member) => renderUserItem(member, true))}
                        </View>
                    )}

                    {offlineMembers.length > 0 && (
                        <View style={styles.userListSection}>
                            <Text style={styles.userSectionTitle}>
                                {t('offline', { count: offlineMembers.length })}
                            </Text>
                            {offlineMembers.map((member) => renderUserItem(member, false))}
                        </View>
                    )}

                    {members.length === 0 && (
                        <Text style={styles.emptyText}>{t('noMembers')}</Text>
                    )}

                    <View style={{ padding: 8 }}>
                        <Text style={{
                            fontSize: 9,
                            color: theme.xpTextLight,
                            textAlign: 'center',
                            fontStyle: 'italic'
                        }}>
                            💡 {t('longPressHint') || 'Appui long pour DM'}
                        </Text>
                    </View>
                </ScrollView>
            )}

            {/* Menu contextuel */}
            {contextMenu && (
                <UserContextMenu
                    user={contextMenu.user}
                    position={contextMenu.position}
                    onCreateDM={handleCreateDM}
                    onClose={handleCloseContextMenu}
                    theme={theme}
                />
            )}
        </>
    );
};