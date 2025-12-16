/**
 * @fileoverview Écran de création de message direct (DM) entre utilisateurs
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useChannels } from '../../contexts/ChannelsContext';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { useTranslation } from 'react-i18next';

/**
 * Écran principal pour la création d'un nouveau message direct (DM).
 *
 * @component
 * @returns {JSX.Element} L'interface utilisateur pour la création d'un nouveau DM.
 */
export default function NewDMScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { createDM, dms } = useChannels();
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAvailableUsers();
    }, []);

    /**
     * Charge les utilisateurs disponibles pour l'envoi de DM.
     *
     * Cette fonction récupère la liste des utilisateurs à partir du service API
     * et met à jour l'état local avec les données récupérées.
     */
    const loadAvailableUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await apiService.getAvailableUsersForDM();

            if (result.success) {
                const usersData = result.data?.data || result.data || [];
                setUsers(Array.isArray(usersData) ? usersData : []);
            } else {
                setError(result.error || t('errorLoadingUsers') || 'Erreur de chargement');
            }
        } catch (err) {
            console.error('Error loading users:', err);
            setError(t('errorLoadingUsers') || 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Gère la création d'un nouveau DM avec un utilisateur spécifique.
     *
     * @param {string} userId - L'ID de l'utilisateur avec lequel créer le DM.
     */
    const handleCreateDM = async (userId) => {
        if (creating) return;

        setCreating(true);

        try {
            const result = await createDM(userId);

            if (result.success) {
                router.back();
            } else {
                alert(result.error || t('errorCreatingDM') || 'Erreur lors de la création');
            }
        } catch (err) {
            console.error('Error creating DM:', err);
            alert(t('errorCreatingDM') || 'Erreur lors de la création');
        } finally {
            setCreating(false);
        }
    };

    /**
     * Vérifie si un DM existe déjà avec un utilisateur spécifique.
     *
     * @param {string} userId - L'ID de l'utilisateur à vérifier.
     * @returns {boolean} - True si le DM existe, sinon false.
     */
    const checkIfDMExists = (userId) => {
        return dms.some(dm => {
            const members = dm.members || [];
            return members.some(member => member.id === userId);
        });
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            {/* Barre de titre Windows XP */}
            <View style={styles.titleBar}>
                <View style={styles.windowIcon} />
                <Text style={styles.titleBarText}>
                    {t('newDirectMessage') || 'Nouveau Message Direct'}
                </Text>
            </View>

            {/* Toolbar */}
            <View style={styles.toolbar}>
                <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={() => router.back()}
                >
                    <View style={[styles.toolbarIcon, { backgroundColor: colors.xpRed }]} />
                    <Text style={styles.toolbarButtonText}>{t('back') || 'Retour'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.toolbarButton}
                    onPress={loadAvailableUsers}
                    disabled={loading}
                >
                    <View style={[styles.toolbarIcon, { backgroundColor: colors.xpGreen }]} />
                    <Text style={styles.toolbarButtonText}>{t('refresh') || 'Actualiser'}</Text>
                </TouchableOpacity>
            </View>

            {/* Zone de recherche */}
            <View style={styles.searchContainer}>
                <Text style={styles.searchLabel}>
                    {t('searchUser') || 'Rechercher un utilisateur :'}
                </Text>
                <View style={styles.searchInputWrapper}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('searchPlaceholder') || 'Nom ou email...'}
                        placeholderTextColor={colors.xpTextLight}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                </View>
            </View>

            {/* Contenu principal */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={colors.xpBlue} />
                        <Text style={styles.loadingText}>
                            {t('loading') || 'Chargement...'}
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={loadAvailableUsers}
                        >
                            <Text style={styles.retryButtonText}>
                                {t('retry') || 'Réessayer'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : filteredUsers.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>
                            {searchQuery
                                ? t('noUsersFound') || 'Aucun utilisateur trouvé'
                                : t('noAvailableUsers') || 'Aucun utilisateur disponible'}
                        </Text>
                    </View>
                ) : (
                    <ScrollView style={styles.usersList}>
                        <View style={styles.usersListHeader}>
                            <Text style={styles.usersListHeaderText}>
                                {t('availableUsers', { count: filteredUsers.length }) ||
                                    `Utilisateurs disponibles (${filteredUsers.length})`}
                            </Text>
                        </View>

                        {filteredUsers.map((user) => {
                            const dmExists = checkIfDMExists(user.id);

                            return (
                                <View key={user.id} style={styles.userItem}>
                                    {/* Avatar */}
                                    <View style={styles.userAvatar}>
                                        <Text style={styles.avatarText}>
                                            {user.name?.charAt(0).toUpperCase() || '?'}
                                        </Text>
                                    </View>

                                    {/* Info utilisateur */}
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>{user.name}</Text>
                                        <Text style={styles.userEmail}>{user.email}</Text>
                                    </View>

                                    {/* Bouton d'action */}
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            (creating || dmExists) && styles.actionButtonDisabled,
                                        ]}
                                        onPress={() => handleCreateDM(user.id)}
                                        disabled={creating || dmExists}
                                    >
                                        <Text
                                            style={[
                                                styles.actionButtonText,
                                                (creating || dmExists) && styles.actionButtonTextDisabled,
                                            ]}
                                        >
                                            {dmExists
                                                ? t('dmExists') || 'DM existe'
                                                : creating
                                                    ? t('creating') || 'Création...'
                                                    : t('createDM') || 'Créer DM'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}
            </View>

            {/* Barre de statut */}
            <View style={styles.statusBar}>
                <Text style={styles.statusText}>
                    {filteredUsers.length} {t('usersAvailable') || 'utilisateur(s) disponible(s)'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.xpGray,
    },
    titleBar: {
        backgroundColor: colors.xpBlue,
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    windowIcon: {
        width: 16,
        height: 16,
        backgroundColor: colors.xpBlueLight,
        borderRadius: 2,
        marginRight: 4,
    },
    titleBarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    toolbar: {
        backgroundColor: colors.xpGray,
        borderBottomWidth: 1,
        borderBottomColor: colors.xpBorder,
        flexDirection: 'row',
        paddingHorizontal: 4,
        paddingVertical: 4,
        gap: 2,
    },
    toolbarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderTopColor: colors.xpBorderLight,
        borderLeftColor: colors.xpBorderLight,
        borderRightColor: colors.xpBorderDark,
        borderBottomColor: colors.xpBorderDark,
        backgroundColor: colors.xpGray,
        gap: 4,
    },
    toolbarIcon: {
        width: 16,
        height: 16,
        borderRadius: 2,
    },
    toolbarButtonText: {
        fontSize: 11,
        color: colors.xpText,
    },
    searchContainer: {
        backgroundColor: colors.xpGrayLight,
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.xpBorder,
    },
    searchLabel: {
        fontSize: 11,
        color: colors.xpText,
        marginBottom: 6,
        fontWeight: 'bold',
    },
    searchInputWrapper: {
        borderWidth: 1,
        borderTopColor: colors.xpBorderDark,
        borderLeftColor: colors.xpBorderDark,
        borderRightColor: colors.xpBorderLight,
        borderBottomColor: colors.xpBorderLight,
        backgroundColor: 'white',
    },
    searchInput: {
        padding: 8,
        fontSize: 12,
        color: colors.xpText,
    },
    content: {
        flex: 1,
        backgroundColor: colors.xpGrayLight,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 12,
        color: colors.xpText,
    },
    errorText: {
        fontSize: 12,
        color: colors.xpRed,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderTopColor: colors.xpBorderLight,
        borderLeftColor: colors.xpBorderLight,
        borderRightColor: colors.xpBorderDark,
        borderBottomColor: colors.xpBorderDark,
        backgroundColor: colors.xpGray,
    },
    retryButtonText: {
        fontSize: 11,
        color: colors.xpText,
        fontWeight: 'bold',
    },
    emptyText: {
        fontSize: 12,
        color: colors.xpTextLight,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    usersList: {
        flex: 1,
    },
    usersListHeader: {
        backgroundColor: colors.xpGrayDark,
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.xpBorder,
    },
    usersListHeaderText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: colors.xpText,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.xpBorder,
        backgroundColor: colors.xpGrayLight,
        gap: 12,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 2,
        backgroundColor: colors.xpBlue,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderTopColor: colors.xpBorderLight,
        borderLeftColor: colors.xpBorderLight,
        borderRightColor: colors.xpBorderDark,
        borderBottomColor: colors.xpBorderDark,
    },
    avatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.xpText,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 10,
        color: colors.xpTextLight,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderTopColor: colors.xpBorderLight,
        borderLeftColor: colors.xpBorderLight,
        borderRightColor: colors.xpBorderDark,
        borderBottomColor: colors.xpBorderDark,
        backgroundColor: colors.xpGray,
    },
    actionButtonDisabled: {
        backgroundColor: colors.xpGrayDark,
        opacity: 0.6,
    },
    actionButtonText: {
        fontSize: 11,
        color: colors.xpText,
        fontWeight: 'bold',
    },
    actionButtonTextDisabled: {
        color: colors.xpTextLight,
    },
    statusBar: {
        backgroundColor: colors.xpGray,
        borderTopWidth: 1,
        borderTopColor: colors.xpBorder,
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    statusText: {
        fontSize: 11,
        color: colors.xpText,
    },
});