/**
 * @fileoverview Écran de connexion avec support MFA (authentification à deux facteurs)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { ThemeProvider } from "@react-navigation/native";
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, KeyboardAvoidingView, Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MFAVerifyModal from '../../components/MFAVerifyModal';
import { XPButton } from '../../components/XPButton';
import { XPInput } from '../../components/XPInput';
import '../../constants/language/js/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFadeAnimation } from '../../hooks/useFadeAnimation';
import apiService from "../../services/apiService";
import authService from "../../services/authService";
import chatService from "../../services/chatService";
import * as notificationService from '../../services/notificationService';
import { styles } from './LoginScreen.styles';

/**
 * Écran de connexion de l'application
 * Gère la connexion email/mot de passe avec support MFA
 * Affiche un modal de vérification MFA si nécessaire
 * @returns {JSX.Element} Écran de connexion avec formulaire et modal MFA
 */
export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [showMFAModal, setShowMFAModal] = useState(false);
    const [mfaTempToken, setMfaTempToken] = useState('');
    const [mfaEmail, setMfaEmail] = useState('');
    const [isMFAVerifying, setIsMFAVerifying] = useState(false);
    const [isMFAResending, setIsMFAResending] = useState(false);

    const {fadeAnim, fadeIn} = useFadeAnimation(0);
    const {login, checkAuthStatus} = useAuth();
    const {t} = useTranslation();
    const { theme } = useTheme();

    useEffect(() => {
        fadeIn();
    }, [fadeIn]);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(email.trim(), password);

            if (result.success) {
                if (result.mfa_required) {
                    setMfaTempToken(result.temp_token);
                    setMfaEmail(email.trim());
                    setShowMFAModal(true);
                    setIsLoading(false);
                    notificationService.info(t('mfaCodeSent'));
                    return;
                }

                // Normal login without MFA
                const testUser = await authService.getStoredUser();
                if (testUser && testUser.id) {
                    try {
                        try { await ThemeProvider.applyUserTheme(testUser.id); } catch(_) {}
                        notificationService.success({ text: t('loginSuccess'), allowLifecycle: true });
                    } catch(_e){}

                    setTimeout(async () => {
                        const testUser = await authService.getStoredUser();
                        console.log('User:', testUser?.name);

                        const wsStatus = chatService.getWebSocketStatus();
                        console.log('WS connected:', wsStatus.connected);

                        const channelsResult = await apiService.getChannels();
                        console.log('Channels loaded:', channelsResult.success);
                    }, 2000);

                    router.replace('/(main)');
                }
            }
        } catch (_error) {
            // ignore
        } finally {
            setIsLoading(false);
        }
    };

    const handleMFAVerify = async (code) => {
        setIsMFAVerifying(true);
        try {
            const result = await apiService.verifyMFACode(mfaEmail, code, mfaTempToken);

            if (result.success && result.data?.data) {
                const { token, user } = result.data.data;

                if (!token || !user) {
                    notificationService.error(t('mfaVerificationError'));
                    return;
                }

                // Store token and user data
                await authService.storeAuthData(token, user);

                setShowMFAModal(false);
                notificationService.success(t('loginSuccess'));

                // Reload auth context to initialize WebSocket, E2EE, etc.
                await checkAuthStatus();

                // Navigate after auth is reloaded
                setTimeout(() => {
                    router.replace('/(main)');
                }, 500);
            } else {
                notificationService.error(t('mfaInvalidCode'));
            }
        } catch {
            notificationService.error(t('mfaVerificationError'));
        } finally {
            setIsMFAVerifying(false);
        }
    };

    const handleMFAResend = async () => {
        setIsMFAResending(true);
        try {
            const result = await apiService.resendMFACode(mfaEmail, mfaTempToken);

            if (result.success) {
                notificationService.success(t('mfaCodeSent'));
            } else {
                notificationService.error(t('mfaVerificationError'));
            }
        } catch {
            notificationService.error(t('mfaVerificationError'));
        } finally {
            setIsMFAResending(false);
        }
    };

    const handleMFAClose = () => {
        setShowMFAModal(false);
        setMfaTempToken('');
        setMfaEmail('');
    };

return (
        <SafeAreaView style={{flex: 1, backgroundColor: theme.xpGray}}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{flex: 1}}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
                    <StatusBar barStyle="light-content" backgroundColor={theme.xpBlue}/>

                    {/* Title Bar */}
                    <View style={[styles.titleBar, { backgroundColor: theme.xpBlue }]}>
                        <View style={[styles.windowIcon, { backgroundColor: theme.xpBlueLight }]}/>
                        <Text style={[styles.titleBarText, {color: '#fff' }]}>{t('loginTitle')}</Text>
                    </View>

                    {/* Content */}
                    <View style={[styles.content, { backgroundColor: theme.xpGray }]}>
                        <View style={[styles.formContainer, { backgroundColor: theme.xpGrayLight }]}>
                            <Text style={[styles.formTitle, { color: theme.xpText }]}>{t('login')}</Text>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.xpText }]}>{t('email')}</Text>
                                <XPInput
                                    placeholder={t('emailPlaceholder')}
                                    value={email}
                                    onChangeText={setEmail}
                                    style={{ backgroundColor: theme.xpGray, color: theme.xpText,}}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.xpText }]}>{t('password')}</Text>
                                <XPInput
                                    placeholder={t('passwordPlaceholder')}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    style={{ backgroundColor: theme.xpGray, color: theme.xpText, }}
                                />
                            </View>

                            <XPButton
                                title={t('login')}
                                onPress={handleLogin}
                                primary
                                style={{
                                    marginTop: 10,
                                    opacity: isLoading ? 0.7 : 1,
                                    color: theme.xpText,
                                }}
                            />

                            <View style={styles.authLinkContainer}>
                                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                                    <Text style={[styles.link, { color: theme.xpBlue }]}>{t('noAccount')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Status Bar */}
                    <View style={[styles.statusBar, { backgroundColor: theme.xpGray, borderTopColor: theme.xpBorder }]}>
                        <View style={styles.statusSection}>
                            <View style={[styles.statusDot, {backgroundColor: theme.xpRed}]}/>
                            <Text style={[styles.statusText, { color: theme.xpText }]}>{t('disconnected')}</Text>
                        </View>
                    </View>
                </Animated.View>

                <MFAVerifyModal
                    visible={showMFAModal}
                    onClose={handleMFAClose}
                    onVerify={handleMFAVerify}
                    onResend={handleMFAResend}
                    email={mfaEmail}
                    loading={isMFAVerifying}
                    resendLoading={isMFAResending}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}