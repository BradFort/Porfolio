/**
 * @fileoverview Composant d'enregistrement vocal (démarrer, arrêter, envoyer, etc.).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';

const MAX_RECORDING_DURATION = 60000; // 60 seconds in milliseconds

/**
 * Composant VoiceRecorder
 * Permet d'enregistrer un message vocal et de l'envoyer.
 * @component
 * @param {Object} props
 * @param {boolean} props.visible - Affiche ou masque le composant
 * @param {function} props.onClose - Callback lors de la fermeture
 * @param {function} props.onSend - Callback lors de l'envoi du message vocal
 * @param {Object} props.theme - Thème de l'application
 * @returns {JSX.Element}
 */
const VoiceRecorder = ({ visible, onClose, onSend, theme }) => {
    const { t } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordedUri, setRecordedUri] = useState(null);
    const [sound, setSound] = useState(null);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    const recordingRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync().catch(() => {});
            }
            if (recordingRef.current) {
                recordingRef.current.getStatusAsync()
                    .then(status => status.isRecording ? recordingRef.current.stopAndUnloadAsync() : recordingRef.current.unloadAsync())
                    .catch(() => {});
            }
        };
    }, [sound]);

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopPulseAnimation = () => {
        pulseAnim.setValue(1);
    };

    const requestPermissions = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    t('error') || 'Error',
                    t('voicePermissionDenied') || 'Permission to access microphone is required!'
                );
                return false;
            }
            return true;
        } catch {
            Alert.alert(
                t('error') || 'Error',
                t('voicePermissionError') || 'Failed to request permissions'
            );
            return false;
        }
    };

    const startRecording = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
                (status) => {
                    if (status.durationMillis >= MAX_RECORDING_DURATION) {
                        stopRecording();
                    }
                }
            );

            recordingRef.current = recording;
            setIsRecording(true);
            startPulseAnimation();

            durationIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Failed to start recording:', error);
            Alert.alert(
                t('error') || 'Error',
                t('voiceRecordingStartError') || 'Failed to start recording. Please try again.'
            );
        }
    };

    const stopRecording = async () => {
        if (!recordingRef.current) return;

        try {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording) {
                await recordingRef.current.stopAndUnloadAsync();
            } else {
                await recordingRef.current.unloadAsync();
            }

            const uri = recordingRef.current.getURI();
            const finalDuration = Math.floor(status.durationMillis / 1000);

            stopPulseAnimation();
            setIsRecording(false);
            setRecordedUri(uri);
            setRecordingDuration(finalDuration);

            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

        } catch (error) {
            console.error('Failed to stop recording:', error);
            Alert.alert(
                t('error') || 'Error',
                t('voiceRecordingStopError') || 'Failed to stop recording. Please try again.'
            );
        }
    };

    const playPreview = async () => {
        if (!recordedUri) return;

        try {
            if (isPlayingPreview && sound) {
                await sound.stopAsync();
                await sound.unloadAsync();
                setSound(null);
                setIsPlayingPreview(false);
                return;
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: recordedUri },
                { shouldPlay: true },
                status => {
                    if (status.didJustFinish) {
                        setIsPlayingPreview(false);
                        newSound.unloadAsync();
                        setSound(null);
                    }
                }
            );

            setSound(newSound);
            setIsPlayingPreview(true);
        } catch (error) {
            console.error('Failed to play preview:', error);
            Alert.alert(
                t('error') || 'Error',
                t('voicePreviewError') || 'Failed to play preview'
            );
        }
    };

    const handleSend = async () => {
        if (!recordedUri) return;

        const audioFile = {
            uri: recordedUri,
            type: 'audio/mp4',
            name: `voice_${Date.now()}.m4a`,
        };

        if (onSend) {
            await onSend(audioFile, recordingDuration);
        }

        resetRecorder();
        onClose();
    };

    const handleRetry = () => {
        if (sound) {
            sound.unloadAsync();
            setSound(null);
        }
        setRecordedUri(null);
        setRecordingDuration(0);
        setIsPlayingPreview(false);
    };

    const cancelRecording = async () => {
        if (recordingRef.current) {
            try {
                await recordingRef.current.stopAndUnloadAsync();
            } catch (error) {
                console.error('Error canceling recording:', error);
            }
        }

        if (sound) {
            sound.unloadAsync();
        }

        stopPulseAnimation();
        resetRecorder();
        onClose();
    };

    const resetRecorder = () => {
        recordingRef.current = null;
        setIsRecording(false);
        setRecordingDuration(0);
        setRecordedUri(null);
        setIsPlayingPreview(false);

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!visible) return null;

    const styles = createStyles(theme);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={cancelRecording}
        >
            <View style={styles.overlay}>
                <View style={styles.window}>
                    {/* Title Bar */}
                    <View style={styles.titleBar}>
                        <View style={styles.titleIcon} />
                        <Text style={styles.titleText}>
                            {isRecording
                                ? (t('voiceRecording') || 'Recording Voice Message...')
                                : recordedUri
                                    ? (t('voicePreview') || 'Voice Message Preview')
                                    : (t('voiceRecorder') || 'Voice Message')
                            }
                        </Text>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Recording/Preview Area */}
                        <View style={styles.recordingArea}>
                            {isRecording && (
                                <>
                                    <Animated.View
                                        style={[
                                            styles.recordingDot,
                                            { transform: [{ scale: pulseAnim }] },
                                        ]}
                                    />
                                    <Text style={styles.duration}>
                                        {formatDuration(recordingDuration)} / 1:00
                                    </Text>
                                </>
                            )}

                            {!isRecording && !recordedUri && (
                                <View style={styles.instructionArea}>
                                    <Text style={styles.instructionText}>
                                        {t('voiceInstruction') || 'Click Record to start recording a voice message (max 60 seconds)'}
                                    </Text>
                                </View>
                            )}

                            {!isRecording && recordedUri && (
                                <>
                                    <View style={styles.previewIcon}>
                                        <Text style={styles.previewIconText}>🎤</Text>
                                    </View>
                                    <Text style={styles.duration}>
                                        {formatDuration(recordingDuration)}
                                    </Text>
                                    <Text style={styles.previewHint}>
                                        {t('voicePreviewHint') || 'Click Play to preview your recording'}
                                    </Text>
                                </>
                            )}
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            {!isRecording && !recordedUri && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.button, styles.buttonPrimary]}
                                        onPress={startRecording}
                                    >
                                        <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                                            {t('voiceStartRecording') || 'Record'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.button}
                                        onPress={onClose}
                                    >
                                        <Text style={styles.buttonText}>{t('cancel') || 'Cancel'}</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {isRecording && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.button, styles.buttonStop]}
                                        onPress={stopRecording}
                                    >
                                        <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                                            {t('voiceStopRecording') || 'Stop'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.button}
                                        onPress={cancelRecording}
                                    >
                                        <Text style={styles.buttonText}>{t('cancel') || 'Cancel'}</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {!isRecording && recordedUri && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.button, styles.buttonPlay]}
                                        onPress={playPreview}
                                    >
                                        <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                                            {isPlayingPreview ? (t('voicePause') || 'Pause') : (t('voicePlay') || 'Play')}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.button}
                                        onPress={handleRetry}
                                    >
                                        <Text style={styles.buttonText}>{t('voiceRetry') || 'Retry'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.buttonSend]}
                                        onPress={handleSend}
                                    >
                                        <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                                            {t('send') || 'Send'}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const createStyles = (theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    window: {
        width: 340,
        backgroundColor: theme.xpGray,
        borderWidth: 2,
        borderColor: theme.xpBorder,
    },
    titleBar: {
        backgroundColor: theme.xpBlue,
        height: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        gap: 4,
    },
    titleIcon: {
        width: 14,
        height: 14,
        backgroundColor: theme.xpBlueLight,
        borderRadius: 2,
    },
    titleText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 11,
    },
    content: {
        padding: 16,
        gap: 16,
    },
    recordingArea: {
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        minHeight: 120,
        justifyContent: 'center',
    },
    recordingDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.xpRed || '#ff0000',
    },
    duration: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.xpText,
    },
    instructionArea: {
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    instructionText: {
        fontSize: 11,
        color: theme.xpText,
        textAlign: 'center',
        lineHeight: 16,
    },
    previewIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.xpBlueLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewIconText: {
        fontSize: 32,
    },
    previewHint: {
        fontSize: 10,
        color: theme.xpTextLight,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    button: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: theme.xpGray,
        borderWidth: 1,
        borderColor: theme.xpGrayDark,
        minWidth: 70,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: theme.xpBlue,
    },
    buttonStop: {
        backgroundColor: theme.xpOrange,
    },
    buttonPlay: {
        backgroundColor: theme.xpBlueLight,
    },
    buttonSend: {
        backgroundColor: theme.xpGreen,
    },
    buttonText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: theme.xpText,
    },
    buttonTextPrimary: {
        color: 'white',
    },
});

export default VoiceRecorder;