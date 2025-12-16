/**
 * @fileoverview Écran de liste des tickets (support, bug, suggestion, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XPButton } from '../../components/XPButton';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';
import { createStyles } from './TicketsScreen.styles';

export default function TicketsScreen() {
    const { t } = useTranslation();
    const { theme, isDarkMode } = useTheme();
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const styles = createStyles(theme);
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadTickets();
    }, []);

    /**
     * Charge la liste des tickets depuis l'API.
     * Affiche une alerte en cas d'erreur de chargement.
     */
    const loadTickets = async () => {
        try {
            setLoading(true);
            const response = await apiService.getTickets();
            if (response.success) {
                setTickets(response.data || []);
            } else {
                Alert.alert(t('errorTitle'), t('ticketLoadError'));
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
            Alert.alert(t('errorTitle'), t('ticketLoadError'));
        } finally {
            setLoading(false);
        }
    };

    /**
     * Gère le rafraîchissement de la liste des tickets.
     * Appelle la fonction `loadTickets` pour recharger les données.
     */
    const onRefresh = async () => {
        setRefreshing(true);
        await loadTickets();
        setRefreshing(false);
    };

    /**
     * Gère la pression sur un ticket dans la liste.
     * Navigue vers l'écran de détails du ticket.
     *
     * @param {Object} ticket - Le ticket sur lequel l'utilisateur a appuyé.
     */
    const handleTicketPress = (ticket) => {
        router.push(`/(main)/ticket-details?id=${ticket.id}`);
    };

    /**
     * Gère la suppression d'un ticket.
     * Affiche une alerte de confirmation avant de supprimer le ticket.
     * Ne permet la suppression que des tickets résolus ou fermés.
     *
     * @param {number} ticketId - L'ID du ticket à supprimer.
     * @param {string} ticketStatus - Le statut actuel du ticket.
     */
    const handleDeleteTicket = async (ticketId, ticketStatus) => {
        if (ticketStatus !== 'resolved' && ticketStatus !== 'closed') {
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
                        const response = await apiService.deleteTicket(ticketId);
                        if (response.success) {
                            Alert.alert(t('notifTitleSuccess'), t('ticketDeleted'));
                            loadTickets();
                        } else {
                            Alert.alert(t('errorTitle'), t('ticketDeleteError'));
                        }
                    }
                }
            ]
        );
    };

    /**
     * Retourne la couleur associée à un niveau de priorité.
     *
     * @param {string} priority - Le niveau de priorité du ticket.
     * @returns {string} La couleur correspondante au niveau de priorité.
     */
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'critical': return theme.xpRed;
            case 'high': return theme.xpOrange;
            case 'medium': return theme.xpYellow;
            case 'low': return theme.xpGreen;
            default: return theme.xpTextLight;
        }
    };

    /**
     * Retourne la couleur associée à un statut de ticket.
     *
     * @param {string} status - Le statut du ticket.
     * @returns {string} La couleur correspondante au statut du ticket.
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

    const myTickets = tickets.filter(t => t.user_id === user?.id);
    const displayTickets = isAdmin ? tickets : myTickets;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.xpGray }}>
            <View style={styles.container}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.xpBlue} />

                {/* Title Bar */}
                <View style={styles.titleBar}>
                    <View style={styles.windowIcon} />
                    <Text style={styles.titleBarText}>{t('tickets')}</Text>
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
                        onPress={() => router.push('/(main)/create-ticket')}
                    >
                        <View style={[styles.toolbarIcon, { backgroundColor: theme.xpGreen }]} />
                        <Text style={styles.toolbarButtonText}>{t('newTicket')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={loadTickets}
                    >
                        <View style={[styles.toolbarIcon, { backgroundColor: theme.xpOrange }]} />
                        <Text style={styles.toolbarButtonText}>{t('refresh')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Tickets List */}
                <ScrollView
                    style={styles.ticketsList}
                    contentContainerStyle={styles.ticketsListContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {loading ? (
                        <Text style={styles.loadingText}>{t('loadingTickets')}</Text>
                    ) : displayTickets.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('noTickets')}</Text>
                            <XPButton
                                title={t('createTicket')}
                                onPress={() => router.push('/(main)/create-ticket')}
                                style={{ marginTop: 20 }}
                            />
                        </View>
                    ) : (
                        displayTickets.map((ticket) => (
                            <View key={ticket.id} style={styles.ticketCard}>
                                <TouchableOpacity
                                    onPress={() => handleTicketPress(ticket)}
                                    style={styles.ticketContent}
                                >
                                    <View style={styles.ticketHeader}>
                                        <Text style={styles.ticketTitle} numberOfLines={1}>
                                            #{ticket.id} - {ticket.title}
                                        </Text>
                                        <View style={styles.ticketBadges}>
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

                                    <Text style={styles.ticketDescription} numberOfLines={2}>
                                        {ticket.description}
                                    </Text>

                                    <View style={styles.ticketFooter}>
                                        <Text style={styles.ticketMeta}>
                                            {t('ticketCreatedBy')}: {ticket.user?.name || t('unknown')}
                                        </Text>
                                        {ticket.assigned_admin && (
                                            <Text style={styles.ticketMeta}>
                                                {t('ticketAssignedTo')}: {ticket.assigned_admin.name}
                                            </Text>
                                        )}
                                        <Text style={styles.ticketDate}>
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {(isAdmin || ticket.user_id === user?.id) && (
                                    <View style={styles.ticketActions}>
                                        <XPButton
                                            title={t('viewTicket')}
                                            onPress={() => handleTicketPress(ticket)}
                                            style={{ flex: 1, marginRight: 5 }}
                                        />
                                        {isAdmin && (
                                            <XPButton
                                                title={t('delete')}
                                                onPress={() => handleDeleteTicket(ticket.id, ticket.status)}
                                                style={{ backgroundColor: theme.xpRed }}
                                            />
                                        )}
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>

                {/* Status Bar */}
                <View style={styles.statusBar}>
                    <Text style={styles.statusText}>
                        {isAdmin ? t('allTickets') : t('myTickets')}: {displayTickets.length}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
