/**
 * @fileoverview Écran de gestion des notifications utilisateur (préférences, types, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Switch } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import * as notificationService from '../../services/notificationService';
import i18n from "../../constants/language/js/i18n";
import { createStyles } from './NotificationsSettingsScreen.styles';

export default function NotificationSettingsScreen() {
    const { t } = useTranslation();
    const { theme, isDarkMode } = useTheme();
    const { user, refreshNotificationPreferences } = useAuth();

    const [notificationTypes, setNotificationTypes] = useState([]);
    const [userDisabledTypes, setUserDisabledTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadNotificationPreferences();
    }, [user.id]);

    /**
     * Charge les préférences de notification de l'utilisateur.
     * Récupère les types de notification disponibles et les préférences de l'utilisateur depuis l'API.
     * Met à jour les états locaux en conséquence.
     */
    const loadNotificationPreferences = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const typesResult = await apiService.getNotificationTypes();
            const userPrefsResult = await apiService.getUserNotificationTypes(user.id);

            if (typesResult.success && Array.isArray(typesResult.data?.data)) {
                setNotificationTypes(typesResult.data.data);
            }
            let disabledIds = [];
            if (userPrefsResult.success && Array.isArray(userPrefsResult.data?.data)) {
                disabledIds = userPrefsResult.data.data.map(obj => obj.id);
                setUserDisabledTypes(disabledIds);
            }
        } catch (error) {
            console.error('Error loading notification preferences:', error);
            notificationService.error(t('loadPreferencesError'));
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Gère le changement d'état d'une notification (activation/désactivation).
     * Met à jour les préférences de notification de l'utilisateur via l'API et met à jour l'état local.
     *
     * @param {number} typeId - L'ID du type de notification à activer/désactiver.
     * @param {boolean} currentlyDisabled - Indique si la notification est actuellement désactivée.
     */
    const handleToggleNotification = async (typeId, currentlyDisabled) => {
        setIsSaving(true);
        try {
            const result = await apiService.toggleUserNotification(typeId);

            if (result.success) {
                setUserDisabledTypes(prev => {
                    if (currentlyDisabled) {
                        return prev.filter(id => id !== typeId);
                    } else {
                        return [...prev, typeId];
                    }
                });

                await refreshNotificationPreferences();

                notificationService.success(
                    currentlyDisabled
                        ? t('notificationEnabled')
                        : t('notificationDisabled')
                );
            } else {
                notificationService.error(t('updatePreferencesError'));
            }
        } catch (error) {
            console.error('Error toggling notification:', error);
            notificationService.error(t('updatePreferencesError'));
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Confirme les préférences de notification actuelles de l'utilisateur.
     * Envoie les préférences mises à jour à l'API et recharge les préférences de notification.
     */
    const handleConfirm = async () => {
        setIsSaving(true);
        try {
            const result = await apiService.toggleUserNotification(user.id, userDisabledTypes);
            if (result.success) {
                await loadNotificationPreferences();
                await refreshNotificationPreferences();
                notificationService.success(t('preferencesSaved'));
                router.replace('/');
            } else {
                notificationService.error(t('updatePreferencesError'));
            }
        } catch (error) {
            console.error('Error confirming notification preferences:', error);
            notificationService.error(t('updatePreferencesError'));
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Récupère l'étiquette de notification appropriée en fonction de la langue actuelle.
     *
     * @param {Object} notifType - L'objet type de notification contenant les étiquettes en différentes langues.
     * @returns {string} - L'étiquette de notification dans la langue actuelle.
     */
    const getNotificationLabel = (notifType) => {
        if (i18n.language === 'fr') return notifType.type_fr;
        return notifType.type_en;
    };

    /**
     * Récupère la description de notification appropriée en fonction du type de notification.
     *
     * @param {string} type - Le type de notification pour lequel récupérer la description.
     * @returns {string} - La description de notification correspondante.
     */
    const getNotificationDescription = (type) => {
        const descriptions = {
            'all': t('allNotificationsDesc'),
            'dm': t('directMessagesDesc'),
            'mention': t('mentionsDesc'),
            'channel': t('channelMessagesDesc'),
        };
        return descriptions[type] || '';
    };

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.xpGray }}>
            <View style={styles.container}>
                <StatusBar
                    barStyle={isDarkMode ? "light-content" : "dark-content"}
                    backgroundColor={theme.xpBlue}
                />

                {/* Title Bar */}
                <View style={styles.titleBar}>
                    <TouchableOpacity onPress={() => router.replace('/(main)')} style={[styles.backButton, { justifyContent: 'center', alignItems: 'center', height: 40 }]} hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}>
                        <View style={[styles.backButtonBox, { justifyContent: 'center', alignItems: 'center', height: 40 }]}>
                            <Text style={[styles.backButtonText, { fontSize: 32, marginTop: -8, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }]}>←</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.windowIcon} />
                    <Text style={styles.titleBarText}>{t('notificationSettings')}</Text>
                </View>

                {/* Content */}
                <ScrollView style={styles.content}>
                    <View style={styles.settingsContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={styles.title}>{t('notificationPreferences')}</Text>
                            <TouchableOpacity
                                onPress={handleConfirm}
                                style={[styles.confirmButtonBox, isSaving && { opacity: 0.5 }]}
                                disabled={isSaving}
                            >
                                <Text style={styles.confirmButtonTextBox}>{t('confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.subtitle}>{t('notificationPreferencesDesc')}</Text>

                        {isLoading ? (
                            <ActivityIndicator
                                size="large"
                                color={theme.xpBlue}
                                style={styles.loader}
                            />
                        ) : (
                            <View style={styles.notificationsList}>
                                {notificationTypes.map((notifType) => {
                                    const isDisabled = userDisabledTypes.includes(notifType.id);
                                    const isEnabled = !isDisabled;

                                    return (
                                        <View key={notifType.id} style={styles.notificationItem}>
                                            <View style={styles.notificationInfo}>
                                                <View style={styles.notificationHeader}>
                                                    <View style={[
                                                        styles.notificationIcon,
                                                        { backgroundColor: isEnabled ? theme.xpGreen : theme.xpTextLight, alignSelf: 'center', marginRight: 8 }
                                                    ]} />
                                                    <View style={styles.notificationTextContainer}>
                                                        <Text style={styles.notificationLabel}>
                                                            {getNotificationLabel(notifType)}
                                                        </Text>
                                                        <Text style={styles.notificationDescription}>
                                                            {notifType.id === 1 ? t('allNotificationsDesc') : getNotificationDescription(notifType.type)}
                                                        </Text>
                                                    </View>
                                                </View>

                                            </View>
                                            <Switch
                                                value={isEnabled}
                                                onValueChange={() => handleToggleNotification(notifType.id, isDisabled)}
                                                disabled={isSaving}
                                                trackColor={{
                                                    false: theme.xpTextLight,
                                                    true: theme.xpGreen
                                                }}
                                                thumbColor={isEnabled ? theme.xpGreenLight : theme.xpGray}
                                            />
                                        </View>
                                    );
                                })}

                                {notificationTypes.length === 0 && (
                                    <Text style={styles.emptyText}>{t('noNotificationTypes')}</Text>
                                )}
                            </View>
                        )}

                        <View style={styles.infoBox}>
                            <Text style={styles.infoIcon}>ℹ️</Text>
                            <Text style={styles.infoText}>{t('notificationSettingsInfo')}</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Status Bar */}
                <View style={styles.statusBar}>
                    <View style={styles.statusSection}>
                        <Text style={styles.statusText}>
                            {t('user')}: {user?.name || t('unknown')}
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}