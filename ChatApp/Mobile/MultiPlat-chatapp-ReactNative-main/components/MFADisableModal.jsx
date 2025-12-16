/**
 * @fileoverview Composant modal de confirmation pour la désactivation du MFA (authentification à deux facteurs).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

 /**
 * Composant MFADisableModal
 * Affiche une modal de confirmation pour désactiver le MFA.
 * @component
 * @param {Object} props
 * @param {boolean} props.visible - Affiche ou masque la modal
 * @param {function} props.onConfirm - Callback lors de la confirmation
 * @param {function} props.onCancel - Callback lors de l'annulation
 * @param {Object} props.theme - Thème de l'application
 * @returns {JSX.Element}
 */

const MFADisableModal = ({ visible, onClose, onConfirm, loading }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [password, setPassword] = useState('');

    /**
     * Gère la confirmation de la désactivation du MFA.
     * Appelle la fonction onConfirm passée en prop avec le mot de passe saisi.
     */
    const handleConfirm = () => {
        if (password.trim()) {
            onConfirm(password);
            setPassword('');
        }
    };

    /**
     * Gère la fermeture de la modal.
     * Réinitialise le mot de passe et appelle la fonction onClose passée en prop.
     */
    const handleClose = () => {
        setPassword('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: theme.xpGrayLight }]}>
                    <Text style={[styles.title, { color: theme.xpText }]}>
                        {t('settings.mfa.disableTitle')}
                    </Text>

                    <Text style={[styles.description, { color: theme.xpTextLight }]}>
                        {t('settings.mfa.disableDescription')}
                    </Text>

                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.xpGray,
                                color: theme.xpText,
                                borderColor: theme.xpBorder
                            }
                        ]}
                        placeholder={t('settings.mfa.passwordPlaceholder')}
                        placeholderTextColor={theme.xpTextLight}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoFocus
                        editable={!loading}
                    />

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { backgroundColor: theme.xpTextLight }]}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={[styles.buttonText, { color: theme.xpText }]}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.confirmButton,
                                { backgroundColor: theme.xpRed },
                                (!password.trim() || loading) && styles.buttonDisabled
                            ]}
                            onPress={handleConfirm}
                            disabled={!password.trim() || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.confirmButtonText}>
                                    {t('settings.mfa.disableButton')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12
    },
    description: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20
    },
    buttons: {
        flexDirection: 'row',
        gap: 12
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44
    },
    cancelButton: {
        // Style is set dynamically
    },
    confirmButton: {
        // Style is set dynamically
    },
    buttonDisabled: {
        opacity: 0.5
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600'
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
    }
});

export default MFADisableModal;
