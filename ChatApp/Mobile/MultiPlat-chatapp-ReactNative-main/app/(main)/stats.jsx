/**
 * @fileoverview Écran de statistiques utilisateur et application (messages, canaux, activité, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import apiService from '../../services/apiService';
import authService from '../../services/authService';

/**
 * StatsScreen - Écran affichant les statistiques de l'utilisateur concernant son activité sur l'application.
 *
 * @component
 * @returns {JSX.Element} Le rendu du composant StatsScreen.
 */
export default function StatsScreen() {

    const { t } = useTranslation();
    const router = useRouter();
    const { theme } = useTheme();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    /**
     * Récupère les statistiques de l'utilisateur courant via les services API et d'authentification.
     *
     * @async
     * @function loadStats
     * @returns {Promise<void>}
     */
    async function loadStats() {
        try {
            const user = await authService.getCurrentUser();
            const response = await apiService.request(`/user/${user.user.id}/stats`);

            if (response.success) {
                setStats(response.data.stats);
            } else {
                setStats(null);
            }
        } catch {
            setStats(null);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !stats) {
        return (
            <View style={[styles.loader, { backgroundColor: theme.xpGrayLight }]}>
                <ActivityIndicator size="large" color={theme.xpBlueLight} />
                <Text style={[styles.loaderText, { color: theme.xpTextLight }]}>
                    {t("stats.loading")}
                </Text>
            </View>
        );
    }

    const max = Math.max(...Object.values(stats.activity_by_day));

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.xpGrayLight }]}>

            {/* Bouton retour */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={[styles.backText, { color: theme.xpBlueLight }]}>
                    {t("back")}
                </Text>
            </TouchableOpacity>

            {/* Section 1 */}
            <View style={[styles.card, { backgroundColor: theme.xpGray }]}>
                <Text style={[styles.title, { color: theme.xpText }]}>{t("stats.totalMessages")}</Text>
                <Text style={[styles.value, { color: theme.xpBlueLight }]}>{stats.total_messages}</Text>
            </View>

            {/* Section 2 */}
            <View style={[styles.card, { backgroundColor: theme.xpGray }]}>
                <Text style={[styles.title, { color: theme.xpText }]}>{t("stats.totalChannels")}</Text>
                <Text style={[styles.value, { color: theme.xpBlueLight }]}>{stats.total_channels}</Text>
            </View>

            {/* Top channels */}
            <View style={[styles.card, { backgroundColor: theme.xpGray }]}>
                <Text style={[styles.title, { color: theme.xpText }]}>{t("stats.topChannels")}</Text>

                {stats.top_channels?.length > 0 ? (
                    stats.top_channels.map((ch, index) => (
                        <Text key={index} style={[styles.listItem, { color: theme.xpTextLight }]}>
                            {ch.name} : {ch.total} messages
                        </Text>
                    ))
                ) : (
                    <Text style={[styles.listItem, { color: theme.xpTextLight }]}>
                        {t("stats.noData")}
                    </Text>
                )}
            </View>

            {/* Activité par jour */}
            <View style={[styles.card, { backgroundColor: theme.xpGray }]}>
                <Text style={[styles.title, { color: theme.xpText }]}>{t("stats.activityByDay")}</Text>

                {Object.keys(stats.activity_by_day).length > 0 ? (
                    Object.entries(stats.activity_by_day).map(([day, value]) => {
                        const widthPercent = (value / max) * 100;

                        return (
                            <View key={day} style={{ marginBottom: 6 }}>
                                <Text style={[styles.listItem, { color: theme.xpTextLight }]}>
                                    {t(`days.${day}`)} : {value} messages
                                </Text>

                                <View style={[styles.barBackground, { backgroundColor: theme.xpGrayDark }]}>
                                    <View style={[
                                        styles.barFill,
                                        { width: `${widthPercent}%`, backgroundColor: theme.xpBlueLight }
                                    ]} />
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Text style={[styles.listItem, { color: theme.xpTextLight }]}>
                        {t("stats.noActivity")}
                    </Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingTop: 80,
    },
    backButton: {
        marginBottom: 15
    },
    backText: {
        fontSize: 16,
        fontWeight: '600'
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loaderText: {
        marginTop: 12
    },
    card: {
        padding: 20,
        borderRadius: 10,
        marginBottom: 15
    },
    title: {
        fontSize: 18,
        marginBottom: 10
    },
    value: {
        fontSize: 28,
        fontWeight: '700'
    },
    listItem: {
        fontSize: 16,
        marginBottom: 4
    },
    barBackground: {
        height: 8,
        borderRadius: 5
    },
    barFill: {
        height: 8,
        borderRadius: 5
    }
});
