/**
 * @fileoverview Écran de création de salon (canal public, privé ou DM)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useChannels } from '../../contexts/ChannelsContext';
import { useTranslation } from 'react-i18next';
import { createStyles } from './new-channel.styles';

/**
 * Composant principal pour la création d'un nouveau salon.
 *
 * @returns {JSX.Element} Le composant NewChannel.
 */
export default function NewChannel() {
    const router = useRouter();
    const { t } = useTranslation();
    const { createChannel } = useChannels();

    const [channelName, setChannelName] = useState('');
    const [channelDescription, setChannelDescription] = useState('');
    const [channelType, setChannelType] = useState('public');
    const [creating, setCreating] = useState(false);
    const [errors, setErrors] = useState({});

    const styles = createStyles(colors);

    /**
     * Valide le formulaire de création de salon.
     *
     * @returns {boolean} True si le formulaire est valide, sinon false.
     */
    const validateForm = () => {
        const newErrors = {};

        if (!channelName.trim()) {
            newErrors.name = t('pages.createChannel.errors.nameRequired') || 'Le nom est requis';
        } else if (channelName.trim().length < 3) {
            newErrors.name = t('pages.createChannel.errors.nameTooShort') || 'Le nom doit contenir au moins 3 caractères';
        } else if (channelName.trim().length > 50) {
            newErrors.name = t('pages.createChannel.errors.nameTooLong') || 'Le nom ne peut pas dépasser 50 caractères';
        }

        if (channelDescription.trim().length > 255) {
            newErrors.description = t('pages.createChannel.errors.descTooLong') || 'La description ne peut pas dépasser 255 caractères';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Gère la création d'un nouveau salon.
     *
     * @returns {Promise<void>}
     */
    const handleCreateChannel = async () => {
        if (creating) return;

        if (!validateForm()) {
            return;
        }

        setCreating(true);

        try {
            const channelData = {
                name: channelName.trim(),
                description: channelDescription.trim() || '',
                type: channelType
            };

            const result = await createChannel(channelData);

            if (result.success) {
                router.back();
            } else {
                setErrors({
                    submit: result.error || t('pages.createChannel.errors.creationFailed') || 'Erreur lors de la création'
                });
            }
        } catch (err) {
            console.error('Error creating channel:', err);
            setErrors({
                submit: t('pages.createChannel.errors.creationFailed') || 'Erreur lors de la création'
            });
        } finally {
            setCreating(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Barre de titre Windows XP */}
            <View style={styles.titleBar}>
                <View style={styles.windowIcon} />
                <Text style={styles.titleBarText}>
                    {t('pages.createChannel.heading') || 'Nouveau Salon'}
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
            </View>

            {/* Contenu principal */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* Nom du channel */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        {t('pages.createChannel.nameLabel') || 'Nom du salon'} *
                    </Text>
                    <View style={[
                        styles.inputWrapper,
                        errors.name && styles.inputWrapperError
                    ]}>
                        <TextInput
                            style={styles.input}
                            placeholder={t('pages.createChannel.namePlaceholder') || 'ex: général, annonces...'}
                            placeholderTextColor={colors.xpTextLight}
                            value={channelName}
                            onChangeText={(text) => {
                                setChannelName(text);
                                if (errors.name) {
                                    setErrors({ ...errors, name: null });
                                }
                            }}
                            maxLength={50}
                            editable={!creating}
                            autoCapitalize="none"
                        />
                    </View>
                    {errors.name && (
                        <Text style={styles.errorText}>{errors.name}</Text>
                    )}
                    <Text style={styles.helperText}>
                        {channelName.length}/50 {t('characters') || 'caractères'}
                    </Text>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        {t('pages.createChannel.descLabel') || 'Description'} ({t('optional') || 'optionnel'})
                    </Text>
                    <View style={[
                        styles.inputWrapper,
                        errors.description && styles.inputWrapperError
                    ]}>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder={t('pages.createChannel.descPlaceholder') || 'Décrivez le sujet du salon...'}
                            placeholderTextColor={colors.xpTextLight}
                            value={channelDescription}
                            onChangeText={(text) => {
                                setChannelDescription(text);
                                if (errors.description) {
                                    setErrors({ ...errors, description: null });
                                }
                            }}
                            maxLength={255}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            editable={!creating}
                        />
                    </View>
                    {errors.description && (
                        <Text style={styles.errorText}>{errors.description}</Text>
                    )}
                    <Text style={styles.helperText}>
                        {channelDescription.length}/255 {t('characters') || 'caractères'}
                    </Text>
                </View>

                {/* Type de channel */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>
                        {t('pages.createChannel.typeLabel') || 'Type de salon'}
                    </Text>

                    <View style={styles.radioContainer}>
                        {/* Public */}
                        <TouchableOpacity
                            style={styles.radioOption}
                            onPress={() => !creating && setChannelType('public')}
                            disabled={creating}
                        >
                            <View style={styles.radioButton}>
                                {channelType === 'public' && (
                                    <View style={styles.radioButtonInner} />
                                )}
                            </View>
                            <View style={styles.radioContent}>
                                <Text style={styles.radioTitle}>
                                    {t('pages.createChannel.type.public') || 'Public'}
                                </Text>
                                <Text style={styles.radioDescription}>
                                    {t('pages.createChannel.publicDesc') || 'Tout le monde peut voir et rejoindre ce salon'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Private */}
                        <TouchableOpacity
                            style={styles.radioOption}
                            onPress={() => !creating && setChannelType('private')}
                            disabled={creating}
                        >
                            <View style={styles.radioButton}>
                                {channelType === 'private' && (
                                    <View style={styles.radioButtonInner} />
                                )}
                            </View>
                            <View style={styles.radioContent}>
                                <Text style={styles.radioTitle}>
                                    {t('pages.createChannel.type.private') || 'Privé'}
                                </Text>
                                <Text style={styles.radioDescription}>
                                    {t('pages.createChannel.privateDesc') || 'Seuls les membres invités peuvent rejoindre'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Erreur globale */}
                {errors.submit && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTextLarge}>❌ {errors.submit}</Text>
                    </View>
                )}

                {/* Loading indicator */}
                {creating && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.xpBlue} />
                        <Text style={styles.loadingText}>
                            {t('creatingChannel') || 'Création du salon...'}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Boutons d'action en bas */}
            <View style={styles.bottomActions}>
                <TouchableOpacity
                    style={[styles.actionButton]}
                    onPress={() => router.back()}
                    disabled={creating}
                >
                    <Text style={styles.actionButtonText}>
                        {t('cancel') || 'Annuler'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        styles.actionButtonPrimary,
                        creating && styles.actionButtonDisabled
                    ]}
                    onPress={handleCreateChannel}
                    disabled={creating}
                >
                    <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                        {creating
                            ? (t('creating') || 'Création...')
                            : (t('pages.createChannel.create') || 'Créer')
                        }
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Barre de statut */}
            <View style={styles.statusBar}>
                <Text style={styles.statusText}>
                    {creating
                        ? (t('creatingChannel') || 'Création en cours...')
                        : (t('fillForm') || 'Remplissez le formulaire ci-dessus')
                    }
                </Text>
            </View>
        </View>
    );
}