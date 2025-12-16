/**
 * @fileoverview Écran des paramètres de l'application (langue, thème, notifications, MFA, E2EE)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StatusBar, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MFAPasswordModal from '../../components/MFAPasswordModal';
import i18n from "../../constants/language/js/i18n";
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';
import E2EESettingsModal from '../../services/crypto/E2EESettingsModal';
import * as notificationService from '../../services/notificationService';
import { createStyles } from './SettingsScreen.styles';

/**
 * Écran des paramètres de l'application
 * Permet de configurer la langue, le thème, les notifications, le MFA et l'E2EE
 * @returns {JSX.Element} Interface des paramètres avec tous les contrôles
 */
export default function SettingsScreen() {
    const { t } = useTranslation();
    const { theme, isDarkMode, toggleTheme } = useTheme();
    const { user, updateUser, refreshNotificationPreferences } = useAuth();

    const [notificationTypes, setNotificationTypes] = useState([]);
    const [userDisabledTypes, setUserDisabledTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [pendingLanguage, setPendingLanguage] = useState(null);
    const [pendingTheme, setPendingTheme] = useState(null);
    const [pendingNotifications, setPendingNotifications] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [showE2EEModal, setShowE2EEModal] = useState(false);

    // MFA states
    const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled || false);
    const [showMFAPasswordModal, setShowMFAPasswordModal] = useState(false);
    const [isMFALoading, setIsMFALoading] = useState(false);

    // Sync MFA state with user
    useEffect(() => {
        if (user?.mfa_enabled !== undefined) {
            setMfaEnabled(user.mfa_enabled);
        }
    }, [user?.mfa_enabled]);


    useEffect(() => {
        loadNotificationPreferences();
    }, [user.id]);

    useEffect(() => {
        if (i18n.language) {
            setPendingLanguage(i18n.language.toLowerCase().startsWith('fr') ? 'fr' : 'en');
        }
    }, [i18n.language]);

    useEffect(() => {
        setPendingTheme(isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    useEffect(() => {
        if (userDisabledTypes.length >= 0) {
            setPendingNotifications([...userDisabledTypes]);
        }
    }, [userDisabledTypes]);

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
                setPendingNotifications(disabledIds);
            }
        } catch (error) {
            console.error('Error loading notification preferences:', error);
            notificationService.error(t('loadPreferencesError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleNotification = (typeId, currentlyDisabled) => {
        setPendingNotifications(prev => {
            if (currentlyDisabled) {
                return prev.filter(id => id !== typeId);
            } else {
                return [...prev, typeId];
            }
        });
        setHasChanges(true);
    };

    const handleToggleLanguage = () => {
        const next = pendingLanguage === 'fr' ? 'en' : 'fr';
        setPendingLanguage(next);
        setHasChanges(true);
    };

    const handleToggleTheme = () => {
        const next = pendingTheme === 'dark' ? 'light' : 'dark';
        setPendingTheme(next);
        setHasChanges(true);
    };

    const handleConfirmChanges = async () => {
        setIsSaving(true);
        try {
            let allSuccess = true;

            const currentLang = i18n.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
            if (pendingLanguage && pendingLanguage !== currentLang) {
                try {
                    await i18n.changeLanguage(pendingLanguage);
                    if (user?.id) {
                        await updateUser({ id: user.id, lang: pendingLanguage });
                    }
                } catch (error) {
                    console.error('Error changing language:', error);
                    allSuccess = false;
                }
            }

            const currentTheme = isDarkMode ? 'dark' : 'light';
            if (pendingTheme && pendingTheme !== currentTheme) {
                try {
                    toggleTheme();
                    if (user?.id) {
                        await updateUser({ id: user.id, theme: pendingTheme });
                    }
                } catch (error) {
                    console.error('Error changing theme:', error);
                    allSuccess = false;
                }
            }

            if (pendingNotifications !== null) {
                const addedDisabled = pendingNotifications.filter(id => !userDisabledTypes.includes(id));
                const removedDisabled = userDisabledTypes.filter(id => !pendingNotifications.includes(id));

                for (const typeId of [...addedDisabled, ...removedDisabled]) {
                    try {
                        const result = await apiService.toggleUserNotification(typeId);
                        if (!result.success) {
                            allSuccess = false;
                        }
                    } catch (error) {
                        console.error('Error toggling notification:', error);
                        allSuccess = false;
                    }
                }

                if (allSuccess) {
                    setUserDisabledTypes(pendingNotifications);
                    await refreshNotificationPreferences();
                }
            }

            if (allSuccess) {
                notificationService.success(t('preferencesSaved'));
                setHasChanges(false);
            } else {
                notificationService.error(t('updatePreferencesError'));
            }
        } catch (error) {
            console.error('Error confirming changes:', error);
            notificationService.error(t('updatePreferencesError'));
        } finally {
            setIsSaving(false);
        }
    };

    const getNotificationLabel = (notifType) => {
        if (pendingLanguage === 'fr' || (!pendingLanguage && i18n.language === 'fr')) {
            return notifType.type_fr;
        }
        return notifType.type_en;
    };

    const getNotificationDescription = (type) => {
        const descriptions = {
            'all': t('allNotificationsDesc'),
            'dm': t('directMessagesDesc'),
            'mention': t('mentionsDesc'),
            'channel': t('channelMessagesDesc'),
        };
        return descriptions[type] || '';
    };

    const handleToggleMFA = async (value) => {
        if (value) {
            setIsMFALoading(true);
            try {
                const result = await apiService.toggleMFA(true);

                if (result.success) {
                    setMfaEnabled(true);
                    await updateUser({ mfa_enabled: true });
                    notificationService.success(t('mfaEnabled'));
                } else {
                    const message = result.data?.message || t('mfaError');
                    if (message.includes('déjà activé') || message.includes('already enabled')) {
                        notificationService.warning(t('mfaAlreadyEnabled'));
                        setMfaEnabled(true);
                        await updateUser({ mfa_enabled: true });
                    } else {
                        notificationService.error(message);
                    }
                }
            } catch {
                notificationService.error(t('mfaError'));
            } finally {
                setIsMFALoading(false);
            }
        } else {
            setShowMFAPasswordModal(true);
        }
    };

    const handleDisableMFA = async (password) => {
        setIsMFALoading(true);
        try {
            const result = await apiService.toggleMFA(false, password);

            if (result.success) {
                setMfaEnabled(false);
                await updateUser({ mfa_enabled: false });
                setShowMFAPasswordModal(false);
                notificationService.success(t('mfaDisabled'));
            } else {
                if (result.status === 401) {
                    notificationService.error(t('mfaIncorrectPassword'));
                } else {
                    const message = result.data?.message || t('mfaError');
                    if (message.includes('pas activé') || message.includes('not enabled')) {
                        notificationService.warning(t('mfaNotEnabled'));
                        setMfaEnabled(false);
                        setShowMFAPasswordModal(false);
                    } else {
                        notificationService.error(message);
                    }
                }
            }
        } catch {
            notificationService.error(t('mfaError'));
        } finally {
            setIsMFALoading(false);
        }
    };

    const styles = createStyles(theme);
    const displayLang = pendingLanguage || (i18n.language.toLowerCase().startsWith('fr') ? 'fr' : 'en');
    const langLabel = displayLang === 'fr' ? 'Français' : 'English';
    const displayTheme = pendingTheme || (isDarkMode ? 'dark' : 'light');

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
                    <Text style={styles.titleBarText}>{t('settings')}</Text>
                </View>

                {/* Content */}
                <ScrollView style={styles.content}>
                    <View style={styles.settingsContainer}>
                        {/* E2EE Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Chiffrement E2EE</Text>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <View style={styles.settingHeader}>
                                        <View
                                            style={[
                                                styles.settingIcon,
                                                { backgroundColor: theme.xpGreen, marginRight: 8 }
                                            ]}
                                        />
                                        <View style={styles.settingTextContainer}>
                                            <Text style={styles.settingLabel}>Sécurité & Chiffrement</Text>
                                            <Text style={styles.settingDescription}>
                                                Gérer vos clés E2EE, recovery code, et chiffrement des messages.
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setShowE2EEModal(true)}
                                    style={styles.switchButton}
                                >
                                    <Text style={styles.switchButtonText}>Ouvrir</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* MFA Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('mfaTitle')}</Text>

                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <View style={styles.settingHeader}>
                                        <View
                                            style={[
                                                styles.settingIcon,
                                                { backgroundColor: mfaEnabled ? theme.xpBlue : theme.xpTextLight, marginRight: 8 }
                                            ]}
                                        />
                                        <View style={styles.settingTextContainer}>
                                            <Text style={styles.settingLabel}>{t('mfaTitle')}</Text>
                                            <Text style={styles.settingDescription}>
                                                {t('mfaDescription')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <Switch
                                    value={mfaEnabled}
                                    onValueChange={handleToggleMFA}
                                    disabled={isMFALoading || isSaving}
                                    trackColor={{
                                        false: theme.xpTextLight,
                                        true: theme.xpBlue
                                    }}
                                    thumbColor={mfaEnabled ? theme.xpGreen : theme.xpGray}
                                />
                            </View>
                        </View>

                        {/* Language Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('language')}</Text>
                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <View style={styles.settingHeader}>
                                        <View style={[
                                            styles.settingIcon,
                                            { backgroundColor: theme.xpBlue, alignSelf: 'center', marginRight: 8 }
                                        ]} />
                                        <View style={styles.settingTextContainer}>
                                            <Text style={styles.settingLabel}>{langLabel}</Text>
                                            <Text style={styles.settingDescription}>
                                                {t('languageDesc')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={handleToggleLanguage}
                                    style={[styles.switchButton, isSaving && { opacity: 0.5 }]}
                                    disabled={isSaving}
                                >
                                    <Text style={styles.switchButtonText}>
                                        {displayLang === 'fr' ? 'EN' : 'FR'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Theme Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('theme')}</Text>
                            <View style={styles.settingItem}>
                                <View style={styles.settingInfo}>
                                    <View style={styles.settingHeader}>
                                        <View style={[
                                            styles.settingIcon,
                                            { backgroundColor: displayTheme === 'dark' ? theme.xpYellow : theme.xpBlue, alignSelf: 'center', marginRight: 8 }
                                        ]} />
                                        <View style={styles.settingTextContainer}>
                                            <Text style={styles.settingLabel}>
                                                {displayTheme === 'dark' ? t('darkMode') : t('lightMode')}
                                            </Text>
                                            <Text style={styles.settingDescription}>
                                                {t('themeDesc')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <Switch
                                    value={displayTheme === 'dark'}
                                    onValueChange={handleToggleTheme}
                                    disabled={isSaving}
                                    trackColor={{
                                        false: theme.xpTextLight,
                                        true: theme.xpBlue
                                    }}
                                    thumbColor={displayTheme === 'dark' ? theme.xpYellow : theme.xpGray}
                                />
                            </View>
                        </View>

                        {/* Notifications Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('notificationPreferences')}</Text>
                            <Text style={styles.sectionSubtitle}>{t('notificationPreferencesDesc')}</Text>

                            {isLoading ? (
                                <ActivityIndicator
                                    size="large"
                                    color={theme.xpBlue}
                                    style={styles.loader}
                                />
                            ) : (
                                <View style={styles.notificationsList}>
                                    {notificationTypes.map((notifType) => {
                                        const isDisabled = pendingNotifications?.includes(notifType.id) || false;
                                        const isEnabled = !isDisabled;

                                        return (
                                            <View key={notifType.id} style={styles.settingItem}>
                                                <View style={styles.settingInfo}>
                                                    <View style={styles.settingHeader}>
                                                        <View style={[
                                                            styles.settingIcon,
                                                            { backgroundColor: isEnabled ? theme.xpGreen : theme.xpTextLight, alignSelf: 'center', marginRight: 8 }
                                                        ]} />
                                                        <View style={styles.settingTextContainer}>
                                                            <Text style={styles.settingLabel}>
                                                                {getNotificationLabel(notifType)}
                                                            </Text>
                                                            <Text style={styles.settingDescription}>
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
                                <Text style={styles.infoText}>{t('settingsPendingInfo')}</Text>
                            </View>
                        </View>

                        {/* Confirm Button at Bottom */}
                        {hasChanges && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
                                <TouchableOpacity
                                    onPress={handleConfirmChanges}
                                    style={[styles.confirmButtonBox, isSaving && { opacity: 0.5 }]}
                                    disabled={isSaving}
                                >
                                    <Text style={styles.confirmButtonTextBox}>
                                        {isSaving ? t('saving') || 'Enregistrement...' : t('confirm')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Status Bar */}
                <View style={styles.statusBar}>
                    <View style={styles.statusSection}>
                        <Text style={styles.statusText}>
                            👤 {user?.name || t('unknown')}
                            {hasChanges && ' • ⚠️ ' + (t('unsavedChanges') || 'Modifications non enregistrées')}
                        </Text>
                    </View>
                </View>
            </View>

            <E2EESettingsModal
                visible={showE2EEModal}
                onClose={() => setShowE2EEModal(false)}
            />

            <MFAPasswordModal
                visible={showMFAPasswordModal}
                onClose={() => setShowMFAPasswordModal(false)}
                onConfirm={handleDisableMFA}
                loading={isMFALoading}
            />
        </SafeAreaView>
    );
}
