/**
 * @fileoverview Composant modal de saisie du mot de passe pour la désactivation du MFA (authentification à deux facteurs).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const MFAPasswordModal = ({ visible, onClose, onConfirm, loading }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [password, setPassword] = useState('');

    /**
     * Gère la confirmation de la saisie du mot de passe.
     * Appelle la fonction onConfirm fournie en prop si le mot de passe n'est pas vide.
     */
    const handleConfirm = () => {
        if (password.trim()) {
            onConfirm(password);
        }
    };

    /**
     * Gère la fermeture de la modal.
     * Réinitialise le mot de passe et appelle la fonction onClose fournie en prop.
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
                        {t('mfaDisableTitle')}
                    </Text>

                    <Text style={[styles.description, { color: theme.xpTextLight }]}>
                        {t('mfaDisableDescription')}
                    </Text>

                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.xpGray,
                            color: theme.xpText,
                            borderColor: theme.xpBorder
                        }]}
                        placeholder={t('password')}
                        placeholderTextColor={theme.xpTextLight}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoFocus
                        editable={!loading}
                    />

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.xpTextLight }]}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Text style={[styles.buttonText, { color: theme.xpText }]}>
                                {t('cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: theme.xpRed },
                                (!password.trim() || loading) && styles.buttonDisabled
                            ]}
                            onPress={handleConfirm}
                            disabled={!password.trim() || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={[styles.buttonText, { color: '#fff' }]}>
                                    {t('mfaDisableButton')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

/**
 * Composant MFAPasswordModal
 * Affiche une modal pour saisir le mot de passe lors de la désactivation du MFA.
 * @component
 * @param {Object} props
 * @param {boolean} props.visible - Affiche ou masque la modal
 * @param {function} props.onConfirm - Callback lors de la confirmation
 * @param {function} props.onCancel - Callback lors de l'annulation
 * @param {Object} props.theme - Thème de l'application
 * @returns {JSX.Element}
 */

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
        borderRadius: 8,
        padding: 20,
        borderWidth: 2
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    description: {
        fontSize: 14,
        marginBottom: 15
    },
    input: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        fontSize: 16,
        marginBottom: 20
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 4,
        minWidth: 100,
        alignItems: 'center'
    },
    buttonDisabled: {
        opacity: 0.5
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 14
    }
});

export default MFAPasswordModal;
