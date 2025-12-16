/**
 * @fileoverview Écran d'inscription permettant de créer un nouveau compte utilisateur
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, KeyboardAvoidingView, Platform, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { XPButton } from '../../components/XPButton';
import { XPInput } from '../../components/XPInput';
import '../../constants/language/js/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFadeAnimation } from '../../hooks/useFadeAnimation';
import { styles } from './RegisterScreen.styles';

/**
 * Écran d'inscription de l'application
 * Permet de créer un nouveau compte avec validation des champs
 * Valide les exigences de mot de passe (longueur, complexité, etc.)
 * @returns {JSX.Element} Écran d'inscription avec formulaire
 */
export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const {fadeAnim, fadeIn} = useFadeAnimation(0);
    const {register} = useAuth();
    const {t} = useTranslation();
    const { theme  } = useTheme();

    useEffect(() => {
        fadeIn();
    }, [fadeIn]);

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            Alert.alert(t('errorTitle'), t('fillAllFields'));
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(t('errorTitle'), t('passwordsDontMatch'));
            return;
        }

        if (password.length < 6) {
            Alert.alert(t('errorTitle'), t('passwordMinLength', { min: 6 }));
            return;
        }
        if (password.length < 8) {
            Alert.alert(t('errorTitle'), t('passwordMinLength', { min: 8 }));
            return;
        }
        if (!/[a-zA-Z]/.test(password)) {
            Alert.alert(t('errorTitle'), t('passwordMustContainLetters'));
            return;
        }
        if (!(/[a-z]/.test(password) && /[A-Z]/.test(password))) {
            Alert.alert(t('errorTitle'), t('passwordMustContainMixedCase'));
            return;
        }
        if (!/\d/.test(password)) {
            Alert.alert(t('errorTitle'), t('passwordMustContainNumbers'));
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\\/]/.test(password)) {
            Alert.alert(t('errorTitle'), t('passwordMustContainSymbols'));
            return;
        }

        if (name.length > 25) {
            Alert.alert(t('errorTitle'), t('usernameMaxLength', { max: 25 }));
            return;
        }

        setIsLoading(true);

        try {
            const result = await register({
                name: name.trim(),
                email: email.trim(),
                password,
                password_confirmation: confirmPassword
            });

            if (result.success) {
                Alert.alert(t('notifTitleSuccess'), t('registerSuccess'), [
                    {text: t('ok'), onPress: () => router.replace('/(main)')}
                ]);
            } else if (result.errors) {
                if (result.errors.password?.includes('validation.password.uncompromised')) {
                    Alert.alert(t('errorTitle'), t('passwordCompromised'));
                } else {
                    const errorMsg = Object.values(result.errors).flat()[0] || t('registerError');
                    Alert.alert(t('errorTitle'), errorMsg);
                }
            } else {
                Alert.alert(t('errorTitle'), result.error || t('registerError'));
            }
        } catch  {} finally {
            setIsLoading(false);
        }
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

                    <View style={[styles.titleBar, { backgroundColor: theme.xpBlue }]}>
                        <View style={[styles.windowIcon, { backgroundColor: theme.xpBlueLight }]}/>
                        <Text style={[styles.titleBarText, { color: '#fff' }]}>{t('registerTitle')}</Text>
                    </View>

                    <View style={[styles.content, { backgroundColor: theme.xpGray }]}>
                        <View style={[styles.formContainer, { backgroundColor: theme.xpGrayLight }]}>
                            <Text style={[styles.formTitle, { color: theme.xpText }]}>{t('register')}</Text>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.xpText }]}>{t('username')}</Text>
                                <XPInput
                                    placeholder={t('usernamePlaceholder')}
                                    value={name}
                                    onChangeText={setName}
                                    style={{ backgroundColor: theme.xpGray, color: theme.xpGrayLight }}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.xpText }]}>{t('email')}</Text>
                                <XPInput
                                    placeholder={t('emailPlaceholder')}
                                    value={email}
                                    onChangeText={setEmail}
                                    style={{ backgroundColor: theme.xpGray, color: theme.xpGrayLight }}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.xpText }]}>{t('password')}</Text>
                                <XPInput
                                    placeholder={t('passwordPlaceholder')}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    style={{ backgroundColor: theme.xpGray, color: theme.xpGrayLight }}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.label, { color: theme.xpText }]}>{t('confirmPassword')}</Text>
                                <XPInput
                                    placeholder={t('confirmPasswordPlaceholder')}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    style={{ backgroundColor: theme.xpGray, color: theme.xpGrayLight }}
                                />
                            </View>

                            <XPButton
                                title={t('register')}
                                onPress={handleRegister}
                                primary
                                style={{
                                    marginTop: 10,
                                    opacity: isLoading ? 0.7 : 1,
                                    color: theme.xpGrayLight
                                }}
                            />

                            <View style={styles.authLinkContainer}>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={[styles.link, { color: theme.xpBlue }]}>{t('alreadyAccount')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.statusBar, { backgroundColor: theme.xpGray, borderTopColor: theme.xpBorder }]}>
                        <View style={styles.statusSection}>
                            <View style={[styles.statusDot, {backgroundColor: theme.xpRed}]}/>
                            <Text style={[styles.statusText, { color: theme.xpText }]}>{t('disconnected')}</Text>
                        </View>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}