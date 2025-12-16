/**
 * @fileoverview Écran de détails d'un ticket (affichage, gestion, réponses, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XPButton } from '../../components/XPButton';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';
import { createStyles } from './TicketDetailsScreen.styles';
import { useActionSheet } from '@expo/react-native-action-sheet';

export default function TicketDetailsScreen() {
    const { t } = useTranslation();
    const { theme, isDarkMode } = useTheme();
    const { user } = useAuth();
    const { id } = useLocalSearchParams();
    const { showActionSheetWithOptions } = useActionSheet();
    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [adminUsers, setAdminUsers] = useState([]);

    const styles = createStyles(theme);
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (id) {
            loadTicketData();
            if (user?.role === 'admin') {
                loadAdminUsers();
            }
        }
    }, [id]);

    /**
     * Charge les utilisateurs administrateurs.
     * Si la réponse de l'API n'est pas réussie, elle tente de récupérer tous les utilisateurs
     * et de filtrer ceux ayant le rôle d'administrateur.
     */
    const loadAdminUsers = async () => {
        try {
            const response = await apiService.getAdminUsers();

            if (response.success) {
                const users = response.data?.data || response.data || [];
                setAdminUsers(users);
            } else {
                console.error('Error loading admin users - Response not successful:', response);
                const allUsersResponse = await apiService.getAllUsers();

                if (allUsersResponse.success) {
                    const allUsers = allUsersResponse.data?.data || allUsersResponse.data || [];
                    const admins = allUsers.filter(u => u.role === 'admin');
                    setAdminUsers(admins);
                }
            }
        } catch (error) {
            console.error('Error loading admin users:', error);
            console.error('Error details:', error.message, error.stack);
        }
    };

    /**
     * Charge les données du ticket, y compris les commentaires associés.
     * En cas d'erreur, un message d'alerte est affiché et l'utilisateur est renvoyé à l'écran précédent.
     */
    const loadTicketData = async () => {
        try {
            setLoading(true);
            const [ticketResponse, commentsResponse] = await Promise.all([
                apiService.getTicket(id),
                apiService.getTicketComments(id)
            ]);

            if (ticketResponse.success) {
                setTicket(ticketResponse.data);
            } else {
                Alert.alert(t('errorTitle'), t('ticketLoadError'));
                router.back();
            }

            if (commentsResponse.success) {
                setComments(commentsResponse.data || []);
            }
        } catch (error) {
            console.error('Error loading ticket data:', error);
            Alert.alert(t('errorTitle'), t('ticketLoadError'));
        } finally {
            setLoading(false);
        }
    };

    /**
     * Rafraîchit les données du ticket en rechargeant les informations depuis l'API.
     */
    const onRefresh = async () => {
        setRefreshing(true);
        await loadTicketData();
        setRefreshing(false);
    };

    /**
     * Ajoute un commentaire au ticket actuel.
     * En cas de succès, le champ de commentaire est réinitialisé et les données du ticket sont rechargées.
     */
    const handleAddComment = async () => {
        if (!newComment.trim()) {
            return;
        }

        try {
            setSubmitting(true);
            const response = await apiService.addTicketComment(id, newComment.trim());
            if (response.success) {
                setNewComment('');
                Alert.alert(t('notifTitleSuccess'), t('commentAdded'));
                loadTicketData();
            } else {
                Alert.alert(t('errorTitle'), t('commentAddError'));
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            Alert.alert(t('errorTitle'), t('commentAddError'));
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Met à jour le statut du ticket actuel.
     * Les statuts disponibles sont : ouvert, en cours, résolu, fermé.
     */
    const handleUpdateStatus = async (newStatus) => {
        try {
            const response = await apiService.updateTicketStatus(id, newStatus);
            if (response.success) {
                Alert.alert(t('notifTitleSuccess'), t('ticketUpdated'));
                loadTicketData();
            } else {
                Alert.alert(t('errorTitle'), t('ticketStatusUpdateError'));
            }
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert(t('errorTitle'), t('ticketStatusUpdateError'));
        }
    };

    /**
     * Met à jour la priorité du ticket actuel.
     * Les priorités disponibles sont : basse, moyenne, haute.
     */
    const handleUpdatePriority = async (newPriority) => {
        try {
            const response = await apiService.updateTicketPriority(id, newPriority);
            if (response.success) {
                Alert.alert(t('notifTitleSuccess'), t('ticketUpdated'));
                loadTicketData();
            } else {
                Alert.alert(t('errorTitle'), t('ticketPriorityUpdateError'));
            }
        } catch (error) {
            console.error('Error updating priority:', error);
            Alert.alert(t('errorTitle'), t('ticketPriorityUpdateError'));
        }
    };

    /**
     * Supprime le ticket actuel.
     * Seuls les administrateurs peuvent supprimer des tickets, et seulement si le ticket est résolu ou fermé.
     */
    const handleDeleteTicket = async () => {
        if (!isAdmin) {
            Alert.alert(t('errorTitle'), t('onlyAdminCanDelete') || 'Seuls les admins peuvent supprimer des tickets.');
            return;
        }

        if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
            Alert.alert(
                t('errorTitle'),
                t('cannotDeleteTicket') || 'Vous ne pouvez supprimer que les tickets résolus ou fermés.'
            );
            return;
        }

        Alert.alert(
            t('deleteTicket'),
            t('confirmDeleteTicket'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        const response = await apiService.deleteTicket(id);
                        if (response.success) {
                            Alert.alert(t('notifTitleSuccess'), t('ticketDeleted'), [
                                { text: t('ok'), onPress: () => router.back() }
                            ]);
                        } else {
                            Alert.alert(t('errorTitle'), t('ticketDeleteError'));
                        }
                    }
                }
            ]
        );
    };

    /**
     * Affiche le menu pour mettre à jour le statut du ticket.
     * Les options disponibles dépendent des traductions fournies.
     */
    const showStatusMenu = () => {
        const options = [
            t('status.open'),
            t('status.in_progress'),
            t('status.resolved'),
            t('status.closed'),
            t('cancel')
        ];
        const cancelButtonIndex = 4;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                title: t('updateStatus'),
            },
            (selectedIndex) => {
                switch (selectedIndex) {
                    case 0:
                        handleUpdateStatus('open');
                        break;
                    case 1:
                        handleUpdateStatus('in_progress');
                        break;
                    case 2:
                        handleUpdateStatus('resolved');
                        break;
                    case 3:
                        handleUpdateStatus('closed');
                        break;
                    case cancelButtonIndex:
                        // Annulé
                        break;
                }
            }
        );
    };

    /**
     * Affiche le menu pour mettre à jour la priorité du ticket.
     * Les options disponibles dépendent des traductions fournies.
     */
    const showPriorityMenu = () => {
        const options = [
            t('priority.low'),
            t('priority.medium'),
            t('priority.high'),
            t('cancel')
        ];
        const cancelButtonIndex = 3;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                title: t('updatePriority'),
            },
            (selectedIndex) => {
                switch (selectedIndex) {
                    case 0:
                        handleUpdatePriority('low');
                        break;
                    case 1:
                        handleUpdatePriority('medium');
                        break;
                    case 2:
                        handleUpdatePriority('high');
                        break;
                    case cancelButtonIndex:
                        // Annulé
                        break;
                }
            }
        );
    };

    /**
     * Affiche le menu pour assigner le ticket à un administrateur.
     * La liste des administrateurs est chargée depuis l'API.
     */
    const showAssignMenu = () => {
        if (!isAdmin || adminUsers.length === 0) {
            Alert.alert(t('errorTitle'), t('noAdminsAvailable') || 'Aucun administrateur disponible');
            return;
        }

        const options = [
            ...adminUsers.map(admin => admin.name),
            t('cancel')
        ];
        const cancelButtonIndex = options.length - 1;

        showActionSheetWithOptions(
            {
                options,
                cancelButtonIndex,
                title: t('assignTicket'),
            },
            (selectedIndex) => {
                if (selectedIndex !== cancelButtonIndex && selectedIndex < adminUsers.length) {
                    handleAssignTicket(adminUsers[selectedIndex].id);
                }
            }
        );
    };

    /**
     * Assigne le ticket actuel à un administrateur spécifique.
     */
    const handleAssignTicket = async (adminId) => {
        try {
            const response = await apiService.assignTicket(id, adminId);
            if (response.success) {
                Alert.alert(t('notifTitleSuccess'), t('ticketAssigned'));
                loadTicketData();
            } else {
                Alert.alert(t('errorTitle'), t('ticketAssignError'));
            }
        } catch (error) {
            console.error('Error assigning ticket:', error);
            Alert.alert(t('errorTitle'), t('ticketAssignError'));
        }
    };

    /**
     * Renvoie la couleur associée à une priorité donnée.
     */
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return theme.xpOrange;
            case 'medium': return theme.xpYellow;
            case 'low': return theme.xpGreen;
            default: return theme.xpTextLight;
        }
    };

    /**
     * Renvoie la couleur associée à un statut donné.
     */
    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return theme.xpBlue;
            case 'in_progress': return theme.xpOrange;
            case 'resolved': return theme.xpGreen;
            case 'closed': return theme.xpTextLight;
            default: return theme.xpTextLight;
        }
    };

    if (loading || !ticket) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.xpGray }}>
                <View style={styles.container}>
                    <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.xpBlue} />
                    <View style={styles.titleBar}>
                        <View style={styles.windowIcon} />
                        <Text style={styles.titleBarText}>{t('ticketDetails')}</Text>
                    </View>
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>{t('loading')}</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.xpGray }}>
            <View style={styles.container}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.xpBlue} />

                {/* Title Bar */}
                <View style={styles.titleBar}>
                    <View style={styles.windowIcon} />
                    <Text style={styles.titleBarText}>
                        {t('ticketDetails')} - #{ticket.id}
                    </Text>
                </View>

                {/* Toolbar */}
                <View style={styles.toolbar}>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={() => router.back()}
                    >
                        <View style={[styles.toolbarIcon, { backgroundColor: theme.xpBlue }]} />
                        <Text style={styles.toolbarButtonText}>{t('back')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={loadTicketData}
                    >
                        <View style={[styles.toolbarIcon, { backgroundColor: theme.xpGreen }]} />
                        <Text style={styles.toolbarButtonText}>{t('refresh')}</Text>
                    </TouchableOpacity>

                    {isAdmin && (
                        <>
                            <TouchableOpacity
                                style={styles.toolbarButton}
                                onPress={showStatusMenu}
                            >
                                <View style={[styles.toolbarIcon, { backgroundColor: theme.xpOrange }]} />
                                <Text style={styles.toolbarButtonText}>{t('updateStatus')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.toolbarButton}
                                onPress={showPriorityMenu}
                            >
                                <View style={[styles.toolbarIcon, { backgroundColor: theme.xpYellow }]} />
                                <Text style={styles.toolbarButtonText}>{t('updatePriority')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.toolbarButton}
                                onPress={showAssignMenu}
                            >
                                <View style={[styles.toolbarIcon, { backgroundColor: theme.xpPurple }]} />
                                <Text style={styles.toolbarButtonText}>{t('assignTicket')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.toolbarButton}
                                onPress={handleDeleteTicket}
                            >
                                <View style={[styles.toolbarIcon, { backgroundColor: theme.xpRed }]} />
                                <Text style={styles.toolbarButtonText}>{t('delete')}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        {/* Ticket Info Card */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{ticket.title}</Text>
                                <View style={styles.badges}>
                                    <View style={[
                                        styles.badge,
                                        { backgroundColor: getPriorityColor(ticket.priority) }
                                    ]}>
                                        <Text style={styles.badgeText}>
                                            {t(`priority.${ticket.priority}`)}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.badge,
                                        { backgroundColor: getStatusColor(ticket.status) }
                                    ]}>
                                        <Text style={styles.badgeText}>
                                            {t(`status.${ticket.status}`)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.cardBody}>
                                <Text style={styles.sectionTitle}>{t('ticketDescription')}</Text>
                                <Text style={styles.description}>{ticket.description}</Text>

                                <View style={styles.metaContainer}>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>{t('ticketCreatedBy')}:</Text>
                                        <Text style={styles.metaValue}>
                                            {ticket.user?.name || t('unknown')}
                                        </Text>
                                    </View>

                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>{t('ticketAssignedTo')}:</Text>
                                        <Text style={styles.metaValue}>
                                            {ticket.assigned_admin ? ticket.assigned_admin.name : 'System'}
                                        </Text>
                                    </View>

                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>{t('ticketCreatedAt')}:</Text>
                                        <Text style={styles.metaValue}>
                                            {new Date(ticket.created_at).toLocaleString()}
                                        </Text>
                                    </View>

                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>{t('ticketUpdatedAt')}:</Text>
                                        <Text style={styles.metaValue}>
                                            {new Date(ticket.updated_at).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Comments Section */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>
                                    {t('ticketComments')} ({comments.length})
                                </Text>
                            </View>

                            <View style={styles.cardBody}>
                                {comments.length === 0 ? (
                                    <Text style={styles.noCommentsText}>{t('noComments')}</Text>
                                ) : (
                                    comments.map((comment) => (
                                        <View key={comment.id} style={styles.comment}>
                                            <View style={styles.commentHeader}>
                                                <Text style={styles.commentAuthor}>
                                                    {comment.user?.name || t('unknown')}
                                                </Text>
                                                <Text style={styles.commentDate}>
                                                    {new Date(comment.created_at).toLocaleString()}
                                                </Text>
                                            </View>
                                            <Text style={styles.commentText}>{comment.content}</Text>
                                        </View>
                                    ))
                                )}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Add Comment Section */}
                    <View style={styles.addCommentContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder={t('writeComment')}
                            placeholderTextColor={theme.xpTextLight}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                            maxLength={1000}
                        />
                        <XPButton
                            title={submitting ? t('loading') : t('addComment')}
                            onPress={handleAddComment}
                            disabled={submitting || !newComment.trim()}
                            style={{
                                marginTop: 10,
                                opacity: (submitting || !newComment.trim()) ? 0.5 : 1
                            }}
                        />
                    </View>
                </KeyboardAvoidingView>

                {/* Status Bar */}
                <View style={styles.statusBar}>
                    <Text style={styles.statusText}>
                        Ticket #{ticket.id} - {t(`status.${ticket.status}`)} - {t(`priority.${ticket.priority}`)}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
