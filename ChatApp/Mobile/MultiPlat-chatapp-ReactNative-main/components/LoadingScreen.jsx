/**
 * @fileoverview Composant d'écran de chargement global (affichage d'un indicateur de chargement).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../constants/language/js/i18n';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Composant LoadingScreen
 * Affiche un écran de chargement avec un indicateur d'activité et un message optionnel.
 * @component
 * @param {Object} props
 * @param {string} [props.message] - Message à afficher sous l'indicateur
 * @param {Object} [props.theme] - Thème de l'application
 * @returns {JSX.Element}
 */
export const LoadingScreen = () => {
    const {t} = useTranslation();
    const { theme } = useTheme();

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: theme.xpGray}}>
            <View style={[styles.container, { backgroundColor: theme.xpGray }]}>
                <View style={[styles.titleBar, { backgroundColor: theme.xpBlue }]}>
                    <View style={[styles.windowIcon, { backgroundColor: theme.xpBlueLight }]}/>
                    <Text style={[styles.titleBarText, { color: theme.xpText }]}>
                        {t('chatTitle')} - {t('loading')}
                    </Text>
                </View>

                <View style={styles.content}>
                    <ActivityIndicator size="large" color={theme.xpBlue}/>
                    <Text style={[styles.loadingText, { color: theme.xpText }]}>
                        {t('checkingAuth')}
                    </Text>
                </View>

                <View style={[styles.statusBar, { 
                    backgroundColor: theme.xpGray,
                    borderTopColor: theme.xpBorder 
                }]}>
                    <View style={styles.statusSection}>
                        <View style={[styles.statusDot, {backgroundColor: theme.xpOrange}]}/>
                        <Text style={[styles.statusText, { color: theme.xpText }]}>
                            {t('initializing')}
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    titleBar: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    windowIcon: {
        width: 16,
        height: 16,
        borderRadius: 2,
        marginRight: 4,
    },
    titleBarText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statusBar: {
        borderTopWidth: 1,
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    statusSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
    },
});