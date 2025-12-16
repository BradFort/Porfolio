/**
 * @fileoverview Écran de création de ticket (support, bug, suggestion, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
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
import { createStyles } from './CreateTicketScreen.styles';

export default function CreateTicketScreen() {
    const { t } = useTranslation();
    const { theme, isDarkMode } = useTheme();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [submitting, setSubmitting] = useState(false);

    const styles = createStyles(theme);

    /**
     * Soumet le formulaire de création de ticket.
     * Valide les champs requis, envoie la requête à l'API et affiche une alerte selon le résultat.
     * @async
     * @function handleSubmit
     * @returns {Promise<void>}
     */
    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert(t('errorTitle'), t('fillAllFields'));
            return;
        }

        if (!description.trim()) {
            Alert.alert(t('errorTitle'), t('fillAllFields'));
            return;
        }

        try {
            setSubmitting(true);
            const response = await apiService.createTicket({
                title: title.trim(),
                description: description.trim(),
                priority,
                status: 'open'
            });

            if (response.success) {
                Alert.alert(t('notifTitleSuccess'), t('ticketCreated'), [
                    {
                        text: t('ok'),
                        onPress: () => router.back()
                    }
                ]);
            } else {
                Alert.alert(t('errorTitle'), t('ticketCreateError'));
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            Alert.alert(t('errorTitle'), t('ticketCreateError'));
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Annule la création du ticket et gère la navigation ou la confirmation si des champs sont remplis.
     * @function handleCancel
     */
    const handleCancel = () => {
        if (title.trim() || description.trim()) {
            Alert.alert(
                t('unsavedChanges'),
                t('confirmLeave'),
                [
                    { text: t('cancel'), style: 'cancel' },
                    {
                        text: t('leave'),
                        style: 'destructive',
                        onPress: () => router.back()
                    }
                ]
            );
        } else {
            router.back();
        }
    };



    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.xpGray }}>
            <View style={styles.container}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.xpBlue} />

                {/* Title Bar */}
                <View style={styles.titleBar}>
                    <View style={styles.windowIcon} />
                    <Text style={styles.titleBarText}>{t('createTicket')}</Text>
                </View>

                {/* Toolbar */}
                <View style={styles.toolbar}>
                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={handleCancel}
                    >
                        <View style={[styles.toolbarIcon, { backgroundColor: theme.xpRed }]} />
                        <Text style={styles.toolbarButtonText}>{t('cancel')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.toolbarButton}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        <View style={[styles.toolbarIcon, { backgroundColor: theme.xpGreen }]} />
                        <Text style={styles.toolbarButtonText}>
                            {submitting ? t('creating') : t('createTicket')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    style={styles.content}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        style={styles.formContainer}
                        contentContainerStyle={styles.formContent}
                    >
                        {/* Title Input */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('ticketTitle')} *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('ticketTitlePlaceholder')}
                                placeholderTextColor={theme.xpTextLight}
                                value={title}
                                onChangeText={setTitle}
                                maxLength={255}
                            />
                            <Text style={styles.charCount}>{title.length}/255</Text>
                        </View>

                        {/* Description Input */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('ticketDescription')} *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder={t('ticketDescriptionPlaceholder')}
                                placeholderTextColor={theme.xpTextLight}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={8}
                                textAlignVertical="top"
                                maxLength={2000}
                            />
                            <Text style={styles.charCount}>{description.length}/2000</Text>
                        </View>

                        {/* Priority Selection */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('ticketPriority')} *</Text>
                            <View style={styles.priorityContainer}>
                                {['low', 'medium', 'high'].map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.priorityButton,
                                            priority === p && styles.priorityButtonActive,
                                            priority === p && { backgroundColor: getPriorityColor(p) }
                                        ]}
                                        onPress={() => setPriority(p)}
                                    >
                                        <Text style={[
                                            styles.priorityButtonText,
                                            priority === p && styles.priorityButtonTextActive
                                        ]}>
                                            {t(`priority.${p}`)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Submit Button */}
                        <View style={styles.buttonContainer}>
                            <XPButton
                                title={submitting ? t('creating') : t('createTicket')}
                                onPress={handleSubmit}
                                primary
                                disabled={submitting || !title.trim() || !description.trim()}
                                style={{
                                    flex: 1,
                                    marginRight: 10,
                                    opacity: (submitting || !title.trim() || !description.trim()) ? 0.5 : 1
                                }}
                            />
                            <XPButton
                                title={t('cancel')}
                                onPress={handleCancel}
                                style={{ backgroundColor: theme.xpRed }}
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Status Bar */}
                <View style={styles.statusBar}>
                    <Text style={styles.statusText}>
                        {t('ticketCreatedBy')}: {user?.name || t('user')}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );

    /**
     * Retourne la couleur associée à une priorité donnée.
     * @function getPriorityColor
     * @param {string} p - La priorité (critical, high, medium, low)
     * @returns {string} La couleur associée à la priorité
     */
    function getPriorityColor(p) {
        switch (p) {
            case 'critical': return theme.xpRed;
            case 'high': return theme.xpOrange;
            case 'medium': return theme.xpYellow;
            case 'low': return theme.xpGreen;
            default: return theme.xpTextLight;
        }
    }
}
