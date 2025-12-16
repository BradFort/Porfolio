import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import VoiceRecorder from './VoiceRecorder';
import FileAttachment from './FileAttachment';

const AttachmentMenu = ({ onVoiceSend, onFileSend, theme, disabled = false }) => {
    const { t } = useTranslation();
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showFileAttachment, setShowFileAttachment] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const handleVoicePress = () => {
        setMenuOpen(false);
        setShowVoiceRecorder(true);
    };

    const handleFilePress = () => {
        setMenuOpen(false);
        setShowFileAttachment(true);
    };

    const handleVoiceSend = async (audioFile, duration) => {
        if (onVoiceSend) {
            await onVoiceSend(audioFile, duration);
        }
        setShowVoiceRecorder(false);
    };

    const handleFileSend = async (file) => {
        if (onFileSend) {
            await onFileSend(file);
        }
        setShowFileAttachment(false);
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.attachButton, disabled && styles.attachButtonDisabled]}
                onPress={() => setMenuOpen(!menuOpen)}
                disabled={disabled}
            >
                <Text style={styles.attachButtonText}>📎</Text>
            </TouchableOpacity>

            <Modal
                visible={menuOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuOpen(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setMenuOpen(false)}
                >
                    <View style={styles.menu}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleVoicePress}
                        >
                            <Text style={styles.menuIcon}>🎤</Text>
                            <Text style={styles.menuText}>{t('voiceMessage')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleFilePress}
                        >
                            <Text style={styles.menuIcon}>📄</Text>
                            <Text style={styles.menuText}>{t('fileAttachment')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <VoiceRecorder
                visible={showVoiceRecorder}
                onClose={() => setShowVoiceRecorder(false)}
                onSend={handleVoiceSend}
                theme={theme}
            />

            <FileAttachment
                visible={showFileAttachment}
                onClose={() => setShowFileAttachment(false)}
                onSend={handleFileSend}
                theme={theme}
            />
        </View>
    );
};

const createStyles = (theme) => {
    const isDark = theme.isDark || false;

    return StyleSheet.create({
        container: {
            marginRight: 4,
        },
        attachButton: {
            width: 32,
            height: 32,
            backgroundColor: theme.xpGray,
            borderWidth: 1,
            borderColor: theme.xpGrayDark,
            justifyContent: 'center',
            alignItems: 'center',
        },
        attachButtonDisabled: {
            opacity: 0.5,
        },
        attachButtonText: {
            fontSize: 16,
        },
        overlay: {
            flex: 1,
            backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.35)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        menu: {
            backgroundColor: isDark ? theme.xpGrayDark : theme.xpGrayLight,
            borderWidth: 2,
            borderColor: theme.xpBorder,
            borderRadius: 6,
            paddingVertical: 8,
            paddingHorizontal: 12,
            minWidth: 220,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
            elevation: 5, // for Android shadow
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 3,
            backgroundColor: isDark ? theme.xpGray : theme.xpGrayLight,
            borderWidth: 1,
            borderColor: theme.xpBorder,
            marginBottom: 6,
        },
        menuIcon: {
            fontSize: 18,
            marginRight: 8,
        },
        menuText: {
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? theme.xpTextWhite : theme.xpText,
        },
    });
};

export default AttachmentMenu;