/**
 * @fileoverview Composant modal de vérification du code MFA (authentification à deux facteurs).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Composant MFAVerifyModal
 * Affiche une modal pour saisir et vérifier le code MFA reçu par email.
 * @component
 * @param {Object} props
 * @param {boolean} props.visible - Affiche ou masque la modal
 * @param {function} props.onVerify - Callback lors de la vérification du code
 * @param {function} props.onResend - Callback pour renvoyer le code
 * @param {function} props.onCancel - Callback lors de l'annulation
 * @param {boolean} [props.loading] - Indique si une opération est en cours
 * @param {Object} props.theme - Thème de l'application
 * @returns {JSX.Element}
 */

const MFAVerifyModal = ({ visible, onClose, onVerify, onResend, email, loading, resendLoading }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [code, setCode] = useState('');
    const [canResend, setCanResend] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);

    useEffect(() => {
        if (visible) {
            setCode('');
            setCanResend(false);
            setResendTimer(60);
        }
    }, [visible]);

    useEffect(() => {
        if (!visible || canResend) return;

        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [visible, canResend]);

    const handleVerify = () => {
        if (code.trim().length === 6) {
            onVerify(code.trim());
        }
    };

    const handleResend = () => {
        setCanResend(false);
        setResendTimer(60);
        onResend();
    };

    const handleCodeChange = (text) => {
        const filtered = text.replace(/[^0-9]/g, '').slice(0, 6);
        setCode(filtered);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: theme.xpGrayLight, borderColor: theme.xpBorder }]}>
                    <Text style={[styles.title, { color: theme.xpText }]}>
                        {t('mfaVerifyTitle')}
                    </Text>

                    <Text style={[styles.description, { color: theme.xpTextLight }]}>
                        {t('mfaVerifyDescription', { email })}
                    </Text>

                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.xpGray,
                            color: theme.xpText,
                            borderColor: theme.xpBorder
                        }]}
                        placeholder="000000"
                        placeholderTextColor={theme.xpTextLight}
                        value={code}
                        onChangeText={handleCodeChange}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                        editable={!loading}
                    />

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.xpTextLight }]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={[styles.buttonText, { color: theme.xpText }]}>
                                {t('cancel')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: theme.xpBlue },
                                (code.length !== 6 || loading) && styles.buttonDisabled
                            ]}
                            onPress={handleVerify}
                            disabled={code.length !== 6 || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={[styles.buttonText, { color: '#fff' }]}>
                                    {t('mfaVerifyButton')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.resendContainer}>
                        {canResend ? (
                            <TouchableOpacity
                                onPress={handleResend}
                                disabled={resendLoading}
                            >
                                <Text style={[styles.resendText, { color: theme.xpBlue }]}>
                                    {resendLoading ? t('mfaSending') : t('mfaResendCode')}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={[styles.timerText, { color: theme.xpTextLight }]}>
                                {t('mfaResendIn', { seconds: resendTimer })}
                            </Text>
                        )}
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
        borderRadius: 8,
        padding: 20,
        borderWidth: 2
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center'
    },
    description: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20
    },
    input: {
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: 'bold',
        marginBottom: 20
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 15
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 4,
        alignItems: 'center',
        minHeight: 44
    },
    buttonDisabled: {
        opacity: 0.5
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 14
    },
    resendContainer: {
        alignItems: 'center',
        paddingTop: 10
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline'
    },
    timerText: {
        fontSize: 12
    }
});

export default MFAVerifyModal;
