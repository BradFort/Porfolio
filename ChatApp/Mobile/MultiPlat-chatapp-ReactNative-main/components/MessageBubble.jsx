/**
 * @fileoverview Composant d'affichage d'une bulle de message dans une conversation (texte, pièce jointe, etc.).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Linking, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useFadeAnimation } from '../hooks/useFadeAnimation';

/**
 * Composant MessageBubble
 * Affiche une bulle de message avec texte, pièce jointe, timestamp, etc.
 * @component
 * @param {Object} props
 * @param {Object} props.message - Données du message à afficher
 * @param {Object} props.user - Utilisateur courant
 * @param {Object} props.theme - Thème de l'application
 * @param {function} [props.onLongPress] - Callback lors d'un appui long
 * @param {boolean} [props.isSelected] - Indique si la bulle est sélectionnée
 * @returns {JSX.Element}
 */

export const MessageBubble = ({ message, isCurrentUser, theme }) => {
    const { fadeAnim, fadeIn } = useFadeAnimation(0);
    const styles = createStyles(theme);

    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackPosition, setPlaybackPosition] = useState(0);
    const [playbackDuration, setPlaybackDuration] = useState(0);

    useEffect(() => {
        fadeIn();
    }, [fadeIn]);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    /**
     * Formate un timestamp en chaîne lisible.
     * @param {number} value - Le timestamp à formater
     * @returns {string} Le timestamp formaté
     */
    const formatTimestamp = (value) => {
        const d = new Date(value);
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const meridiem = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const hoursStr = String(hours).padStart(2, '0');
        return `${month}/${day}/${year} ${hoursStr}:${minutes} ${meridiem}`;
    };

    /**
     * Formate une durée en secondes en chaîne lisible (mm:ss).
     * @param {number} seconds - La durée en secondes
     * @returns {string} La durée formatée
     */
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Formate une taille de fichier en octets en chaîne lisible (Ko, Mo, Go, etc.).
     * @param {number} bytes - La taille du fichier en octets
     * @returns {string} La taille du fichier formatée
     */
    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    /**
     * Joue ou met en pause le message vocal.
     * @async
     * @function
     */
    const playVoiceMessage = async () => {
        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    // Get current status to check if playback finished
                    const status = await sound.getStatusAsync();

                    // If audio finished or position is at/near the end, reset to beginning
                    if (status.isLoaded && (status.didJustFinish || status.positionMillis >= status.durationMillis - 100)) {
                        await sound.setPositionAsync(0);
                        setPlaybackPosition(0);
                    }

                    await sound.playAsync();
                    setIsPlaying(true);
                }
            } else {
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri: message.file_url },
                    { shouldPlay: true },
                    onPlaybackStatusUpdate
                );
                setSound(newSound);
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('[MessageBubble] Error playing voice message:', error);
            console.error('[MessageBubble] Error details:', {
                message: error.message,
                stack: error.stack,
                fileUrl: message.file_url
            });
            Alert.alert('Error', 'Failed to play voice message');
        }
    };

    /**
     * Met à jour l'état de lecture en fonction du statut de lecture.
     * @function
     * @param {Object} status - Le statut de lecture actuel
     * @param {boolean} status.isLoaded - Indique si l'audio est chargé
     * @param {boolean} status.didJustFinish - Indique si la lecture est terminée
     * @param {number} status.positionMillis - La position actuelle en millisecondes
     * @param {number} status.durationMillis - La durée totale en millisecondes
     */
    const onPlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis / 1000);
            setPlaybackDuration(status.durationMillis / 1000);

            if (status.didJustFinish) {
                setIsPlaying(false);
                setPlaybackPosition(0);
            }
        }
    };

    /**
     * Télécharge le fichier attaché au message.
     * @async
     * @function
     */
    const downloadFile = async () => {
        try {
            const supported = await Linking.canOpenURL(message.file_url);
            if (supported) {
                await Linking.openURL(message.file_url);
            } else {
                Alert.alert('Error', 'Cannot open this file');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            Alert.alert('Error', 'Failed to download file');
        }
    };

    /**
     * Renvoie l'icône de fichier appropriée en fonction du type MIME.
     * @param {string} mimeType - Le type MIME du fichier
     * @returns {string} Le nom de l'icône de fichier
     */
    const getFileIcon = (mimeType) => {
        if (!mimeType) return 'document-outline';
        if (mimeType.startsWith('image/')) return 'image-outline';
        if (mimeType.startsWith('video/')) return 'videocam-outline';
        if (mimeType.startsWith('audio/')) return 'musical-notes-outline';
        if (mimeType.includes('pdf')) return 'document-text-outline';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive-outline';
        return 'document-outline';
    };

    const tsSource = message?.createdAt || message?.created_at;
    const displayTimestamp = formatTimestamp(tsSource) || (typeof message?.timestamp === 'string' ? message.timestamp : '');
    const messageType = message?.type || 'text';

    return (
        <Animated.View style={[
            styles.messageGroup,
            isCurrentUser && styles.messageGroupCurrentUser,
            { opacity: fadeAnim }
        ]}>
            <View style={styles.content}>
                <View style={[styles.header, isCurrentUser && styles.headerCurrentUser]}>
                    <Text style={styles.author}>{message.author}</Text>
                    {messageType === 'voice' && (
                        <View style={styles.voiceBadge}>
                            <Ionicons name="mic" size={10} color={theme.xpBlueBright} />
                            <Text style={styles.badgeText}>Voice</Text>
                        </View>
                    )}
                    {messageType === 'attachment' && (
                        <View style={styles.attachmentBadge}>
                            <Ionicons name="attach" size={10} color={theme.xpBlueBright} />
                            <Text style={styles.badgeText}>File</Text>
                        </View>
                    )}
                    <Text style={styles.timestamp}>{displayTimestamp}</Text>
                </View>

                {/* Voice Message */}
                {messageType === 'voice' && message.file_url && (
                    <View style={[
                        styles.bubble,
                        isCurrentUser && styles.bubbleCurrentUser,
                        message.isPending && styles.bubblePending
                    ]}>
                        <TouchableOpacity
                            style={styles.voicePlayer}
                            onPress={playVoiceMessage}
                            disabled={message.isPending}
                        >
                            <View style={styles.voiceIcon}>
                                <Ionicons
                                    name={isPlaying ? 'pause' : 'play'}
                                    size={20}
                                    color={isCurrentUser ? '#fff' : theme.xpBlue}
                                />
                            </View>
                            <View style={styles.voiceInfo}>
                                <View style={styles.waveform}>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progress,
                                                {
                                                    width: playbackDuration > 0
                                                        ? `${(playbackPosition / playbackDuration) * 100}%`
                                                        : '0%'
                                                }
                                            ]}
                                        />
                                    </View>
                                </View>
                                <Text style={[
                                    styles.voiceDuration,
                                    isCurrentUser && styles.textCurrentUser
                                ]}>
                                    {playbackDuration > 0
                                        ? formatDuration(playbackPosition)
                                        : formatDuration(message.duration || 0)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        {message.isPending && (
                            <Text style={styles.pendingIndicator}>⏳</Text>
                        )}
                    </View>
                )}

                {/* File Attachment */}
                {messageType === 'attachment' && message.file_url && (
                    <View style={[
                        styles.bubble,
                        isCurrentUser && styles.bubbleCurrentUser,
                        message.isPending && styles.bubblePending
                    ]}>
                        <View style={styles.fileAttachment}>
                            <View style={styles.fileIcon}>
                                <Ionicons
                                    name={getFileIcon(message.mime_type)}
                                    size={32}
                                    color={isCurrentUser ? '#fff' : theme.xpBlue}
                                />
                            </View>
                            <View style={styles.fileInfo}>
                                <Text
                                    style={[
                                        styles.fileName,
                                        isCurrentUser && styles.textCurrentUser
                                    ]}
                                    numberOfLines={2}
                                >
                                    {message.file_name || 'Attachment'}
                                </Text>
                                {message.file_size > 0 && (
                                    <Text style={[
                                        styles.fileSize,
                                        isCurrentUser && styles.fileSizeCurrentUser
                                    ]}>
                                        {formatFileSize(message.file_size)}
                                    </Text>
                                )}
                            </View>
                            {!message.isPending && (
                                <TouchableOpacity
                                    style={styles.downloadButton}
                                    onPress={downloadFile}
                                >
                                    <Ionicons
                                        name="download-outline"
                                        size={20}
                                        color={isCurrentUser ? '#fff' : theme.xpBlue}
                                    />
                                </TouchableOpacity>
                            )}
                            {message.isPending && (
                                <Text style={styles.pendingIndicator}>⏳</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Text Message */}
                {messageType === 'text' && (
                    <View style={[
                        styles.bubble,
                        isCurrentUser && styles.bubbleCurrentUser,
                        message.isPending && styles.bubblePending
                    ]}>
                        <Text style={[
                            styles.text,
                            isCurrentUser && styles.textCurrentUser,
                            message.isPending && styles.textPending
                        ]}>
                            {message.text || message.content}
                        </Text>
                        {message.isPending && (
                            <Text style={styles.pendingIndicator}>⏳</Text>
                        )}
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    messageGroup: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    messageGroupCurrentUser: {
        flexDirection: 'row-reverse',
    },
    content: {
        flex: 1,
        maxWidth: '100%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 4,
    },
    headerCurrentUser: {
        justifyContent: 'flex-end',
    },
    author: {
        fontWeight: 'bold',
        fontSize: 12,
        color: theme.xpBlueBright,
    },
    timestamp: {
        fontSize: 10,
        color: theme.xpTextLight,
    },
    voiceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 4,
        paddingVertical: 2,
        backgroundColor: theme.xpBlueLight,
        borderRadius: 4,
    },
    attachmentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 4,
        paddingVertical: 2,
        backgroundColor: theme.xpBlueLight,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 9,
        color: theme.xpBlueBright,
        fontWeight: '600',
    },
    bubble: {
        backgroundColor: theme.xpGrayLight,
        borderWidth: 1,
        borderColor: theme.xpBorder,
        borderRadius: 8,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bubbleCurrentUser: {
        backgroundColor: theme.xpBlueLight,
        borderColor: theme.xpBlue,
    },
    bubblePending: {
        opacity: 0.7,
        borderStyle: 'dashed',
    },
    text: {
        fontSize: 12,
        lineHeight: 18,
        color: theme.xpText,
        flex: 1,
    },
    textCurrentUser: {
        color: 'white',
    },
    textPending: {
        fontStyle: 'italic',
    },
    pendingIndicator: {
        fontSize: 12,
        opacity: 0.6,
    },
    // Voice Message Styles
    voicePlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    voiceIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceInfo: {
        flex: 1,
        gap: 4,
    },
    waveform: {
        height: 20,
        justifyContent: 'center',
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
        backgroundColor: theme.xpBlue,
        borderRadius: 2,
    },
    voiceDuration: {
        fontSize: 11,
        color: theme.xpText,
        fontWeight: '600',
    },
    // File Attachment Styles
    fileAttachment: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    fileIcon: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 8,
    },
    fileInfo: {
        flex: 1,
        gap: 2,
    },
    fileName: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.xpText,
    },
    fileSize: {
        fontSize: 10,
        color: theme.xpTextLight,
    },
    fileSizeCurrentUser: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    downloadButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});