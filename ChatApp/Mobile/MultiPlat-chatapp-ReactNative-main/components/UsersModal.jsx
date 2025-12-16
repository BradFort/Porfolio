/**
 * @fileoverview Composant modal d'affichage et de gestion des utilisateurs (liste, actions, etc.).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
    Pressable
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useChannels } from '../contexts/ChannelsContext';
import { useOnlineUsers } from '../contexts/OnlineUsersContext';
import { useTranslation } from 'react-i18next';
import { UserContextMenu } from './UserContextMenu';

/**
 * Composant UsersModal
 * Affiche une modal listant les utilisateurs avec actions contextuelles.
 * @component
 * @param {Object} props
 * @param {boolean} props.visible - Affiche ou masque la modal
 * @param {Array} props.users - Liste des utilisateurs à afficher
 * @param {Function} props.onClose - Callback lors de la fermeture
 * @param {Function} [props.onUserPress] - Callback lors d'un clic sur un utilisateur
 * @param {Function} [props.onUserLongPress] - Callback lors d'un appui long sur un utilisateur
 * @param {Object} [props.theme] - Thème de l'application
 * @returns {JSX.Element}
 */

export const UsersModal = ({ visible, onClose, channel, theme }) => {
    const { user } = useAuth();
    const { isUserOnline } = useOnlineUsers();
    const { createDM } = useChannels();
    const { t } = useTranslation();

    const [contextMenu, setContextMenu] = useState(null);
    const [longPressTimer, setLongPressTimer] = useState(null);

    if (!channel) return null;

    const members = channel.members || [];
    const onlineMembers = members.filter(member => isUserOnline(member.id));
    const offlineMembers = members.filter(member => !isUserOnline(member.id));

    /**
     * Démarre le gestionnaire d'appui long pour un membre donné.
     * @param {Object} member - L'utilisateur membre sur lequel appuyer longuement
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
     * Crée un DM (Direct Message) avec un utilisateur sélectionné.
     * @param {Object} selectedUser - L'utilisateur avec lequel créer un DM
     */
    const handleCreateDM = async (selectedUser) => {
        try {
            const result = await createDM(selectedUser.id);
            if (!result.success) {
                alert(result.error || t('errorCreatingDM') || 'Erreur lors de la création du DM');
            }
            // Close modal after creating DM
            onClose();
        } catch (error) {
            console.error('Error creating DM:', error);
            alert(t('errorCreatingDM') || 'Erreur lors de la création du DM');
        }
    };

    /**
     * Rendu d'un élément utilisateur dans la liste.
     * @param {Object} member - L'utilisateur membre à rendre
     * @param {boolean} isOnline - Indique si l'utilisateur est en ligne
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
                    { color: theme.xpText },
                    !isOnline && { color: theme.xpTextLight }
                ]}>
                    {member.name}{isCurrentUser ? ` (${t('you')})` : ''}
                </Text>
            </TouchableOpacity>
        );
    };

    const styles = createStyles(theme);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    {/* Title Bar */}
                    <View style={styles.titleBar}>
                        <View style={styles.windowIcon} />
                        <Text style={styles.titleBarText}>
                            {channel.type === 'dm'
                                ? `@ ${channel.members?.find(m => m.id !== user?.id)?.name || t('dm')}`
                                : `# ${channel.name}`
                            } - {t('users')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollContent}
                        contentContainerStyle={styles.scrollContentContainer}
                    >
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

                        <View style={styles.hintBox}>
                            <Text style={styles.hintText}>
                                💡 {t('longPressHint') || 'Appui long pour DM'}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Status Bar */}
                    <View style={styles.statusBar}>
                        <Text style={styles.statusText}>
                            {t('totalMembers', { count: members.length })}
                        </Text>
                    </View>
                </Pressable>
            </Pressable>

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
        </Modal>
    );
};

const createStyles = (theme) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: theme.xpGrayLight,
        borderWidth: 2,
        borderColor: theme.xpGrayDark,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
        minHeight: 300,
        flexDirection: 'column',
        ...Platform.select({
            web: {
                boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 0,
                elevation: 5,
            },
        }),
    },
    titleBar: {
        backgroundColor: theme.xpBlue,
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    windowIcon: {
        width: 16,
        height: 16,
        backgroundColor: theme.xpBlueLight,
        borderRadius: 2,
        marginRight: 4,
    },
    titleBarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        flex: 1,
    },
    closeButton: {
        width: 20,
        height: 20,
        backgroundColor: theme.xpRed,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.xpGrayDark,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: -2,
    },
    scrollContent: {
        flex: 1,
        backgroundColor: theme.xpGray,
    },
    scrollContentContainer: {
        paddingBottom: 8,
        flexGrow: 1,
    },
    userListSection: {
        marginTop: 12,
        paddingHorizontal: 8,
    },
    userSectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: theme.xpTextLight,
        textTransform: 'uppercase',
        marginBottom: 4,
        paddingLeft: 4,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        marginBottom: 2,
    },
    userStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    userName: {
        fontSize: 11,
    },
    emptyText: {
        fontSize: 11,
        color: theme.xpTextLight,
        padding: 20,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    hintBox: {
        padding: 12,
        margin: 8,
        backgroundColor: theme.xpBlueLight,
        borderWidth: 1,
        borderColor: theme.xpBorder,
    },
    hintText: {
        fontSize: 9,
        color: theme.xpText,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    statusBar: {
        backgroundColor: theme.xpGray,
        borderTopWidth: 1,
        borderTopColor: theme.xpBorder,
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    statusText: {
        fontSize: 11,
        color: theme.xpText,
    },
});
