/**
 * @fileoverview Composant lecteur de message vocal (lecture, pause, barre de progression, etc.).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';

 /**
 * Composant VoiceMessagePlayer
 * Permet de lire un message vocal avec contrôle de lecture et affichage de la durée.
 * @component
 * @param {Object} props
 * @param {string} props.audioUrl - URL du fichier audio à lire
 * @param {number} [props.duration] - Durée du message vocal en secondes
 * @param {Object} [props.theme] - Thème de l'application
 * @returns {JSX.Element}
 */

export const VoiceMessagePlayer = ({ fileUrl, duration, theme, isCurrentUser }) => {
    const { t } = useTranslation();
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [totalDuration, setTotalDuration] = useState(duration || 0);
    const [isLoading, setIsLoading] = useState(false);
    const styles = createStyles(theme, isCurrentUser);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    /**
     * Met à jour l'état de lecture en fonction du statut de lecture actuel.
     * @param {Object} status - Le statut de lecture actuel.
     * @param {boolean} status.isLoaded - Indique si le son est chargé.
     * @param {number} status.positionMillis - La position actuelle de lecture en millisecondes.
     * @param {number} status.durationMillis - La durée totale du son en millisecondes.
     * @param {boolean} status.didJustFinish - Indique si la lecture vient de se terminer.
     */
    const onPlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setCurrentPosition(Math.floor(status.positionMillis / 1000));
            setTotalDuration(Math.floor(status.durationMillis / 1000));

            if (status.didJustFinish) {
                setIsPlaying(false);
                setCurrentPosition(0);
            }
        }
    };

    /**
     * Joue ou met en pause le son en fonction de son état actuel.
     * Charge le son si ce n'est pas déjà fait.
     * Gère les erreurs potentielles lors de la lecture.
     */
    const playPauseSound = async () => {
        try {
            if (sound) {
                const status = await sound.getStatusAsync();

                if (status.didJustFinish || status.positionMillis === status.durationMillis) {
                    await sound.setPositionAsync(0);
                    await sound.playAsync();
                    setIsPlaying(true);
                    return;
                }

                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                setIsLoading(true);
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: fileUrl },
                    { shouldPlay: true },
                    onPlaybackStatusUpdate
                );
                setSound(newSound);
                setIsPlaying(true);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error playing sound:', error);
            setIsLoading(false);
            setIsPlaying(false);
        }
    };

    /**
     * Formate le temps en secondes au format mm:ss.
     * @param {number} seconds - Le temps en secondes à formater.
     * @returns {string} Le temps formaté.
     */
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = totalDuration > 0 ? (currentPosition / totalDuration) * 100 : 0;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.playButton}
                onPress={playPauseSound}
                disabled={isLoading}
            >
                <Text style={styles.playButtonText}>
                    {isLoading ? '⏳' : isPlaying ? '⏸' : '▶'}
                </Text>
            </TouchableOpacity>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.timeText}>
                    {formatTime(currentPosition)} / {formatTime(totalDuration)}
                </Text>
            </View>

            <View style={styles.iconContainer}>
                <Text style={styles.icon}>🎤</Text>
            </View>
        </View>
    );
};

const createStyles = (theme, isCurrentUser) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        backgroundColor: isCurrentUser ? theme.xpBlueLight : theme.xpGrayLight,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isCurrentUser ? theme.xpBlue : theme.xpBorder,
        minWidth: 200,
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: isCurrentUser ? theme.xpBlue : theme.xpGray,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButtonText: {
        fontSize: 14,
        color: 'white',
    },
    progressContainer: {
        flex: 1,
        gap: 4,
    },
    progressBar: {
        height: 4,
        backgroundColor: isCurrentUser ? 'rgba(255, 255, 255, 0.3)' : theme.xpGray,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: isCurrentUser ? 'white' : theme.xpBlue,
        borderRadius: 2,
    },
    timeText: {
        fontSize: 10,
        color: isCurrentUser ? 'white' : theme.xpTextLight,
    },
    iconContainer: {
        width: 24,
        alignItems: 'center',
    },
    icon: {
        fontSize: 16,
    },
});
