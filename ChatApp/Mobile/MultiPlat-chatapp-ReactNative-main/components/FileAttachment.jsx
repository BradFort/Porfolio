/**
 * @fileoverview Composant de sélection et d'envoi de fichiers joints dans une conversation.
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, StyleSheet, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import XPErrorModal from './XPErrorModal';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Composant FileAttachment
 * Permet à l'utilisateur de sélectionner et d'envoyer un fichier joint.
 * @component
 * @param {Object} props
 * @param {boolean} props.visible - Affiche ou masque le composant
 * @param {function} props.onClose - Callback lors de la fermeture
 * @param {function} props.onSend - Callback lors de l'envoi du fichier
 * @param {Object} props.theme - Thème de l'application
 * @returns {JSX.Element}
 */
const FileAttachment = ({ visible, onClose, onSend, theme }) => {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUri, setPreviewUri] = useState(null);
    const [sending, setSending] = useState(false);
    const [errorModal, setErrorModal] = useState({ visible: false, message: '' });

    /**
     * Affiche un message d'erreur dans la modal XPErrorModal.
     * @param {string} message - Le message d'erreur à afficher
     */
    const showError = (message) => {
        setErrorModal({ visible: true, message });
    };

    /**
     * Gère la sélection d'une image via l'appareil photo.
     * Demande l'autorisation d'accéder à l'appareil photo, puis ouvre l'appareil photo pour prendre une photo.
     * La photo est ensuite prévisualisée et peut être envoyée.
     */
    const handleCameraPick = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showError(t('cameraPermissionRequired'));
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];

                if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
                    showError(t('fileTooLarge', { max: MAX_FILE_SIZE / 1024 / 1024 }));
                    return;
                }

                const file = {
                    uri: asset.uri,
                    name: asset.fileName || `photo_${Date.now()}.jpg`,
                    type: asset.mimeType || 'image/jpeg',
                    size: asset.fileSize,
                };

                setSelectedFile(file);
                setPreviewUri(asset.uri);
            }
        } catch {
            showError(t('cameraError'));
        }
    };

    /**
     * Gère la sélection d'une image depuis la galerie.
     * Ouvre la galerie d'images pour sélectionner une image.
     * L'image est ensuite prévisualisée et peut être envoyée.
     */
    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];

                if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
                    showError(t('fileTooLarge', { max: MAX_FILE_SIZE / 1024 / 1024 }));
                    return;
                }

                const file = {
                    uri: asset.uri,
                    name: asset.fileName || `image_${Date.now()}.jpg`,
                    type: asset.mimeType || 'image/jpeg',
                    size: asset.fileSize,
                };

                setSelectedFile(file);
                setPreviewUri(asset.uri);
            }
        } catch {
            showError(t('galleryError'));
        }
    };

    /**
     * Gère la sélection d'un document.
     * Ouvre le sélecteur de documents pour choisir un fichier.
     * Le fichier est ensuite prévisualisé (si c'est une image) et peut être envoyé.
     */
    const handleDocumentPick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDir: true,
            });

            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];

                if (asset.size && asset.size > MAX_FILE_SIZE) {
                    showError(t('fileTooLarge', { max: MAX_FILE_SIZE / 1024 / 1024 }));
                    return;
                }

                const file = {
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/octet-stream',
                    mimeType: asset.mimeType,
                    size: asset.size,
                };

                setSelectedFile(file);

                if (asset.mimeType?.startsWith('image/')) {
                    setPreviewUri(asset.uri);
                } else {
                    setPreviewUri(null);
                }
            }
        } catch {
            showError(t('documentError'));
        }
    };

    /**
     * Gère l'envoi du fichier sélectionné.
     * Appelle la fonction onSend fournie en prop avec le fichier sélectionné.
     * Gère également l'état d'envoi (loading) et les erreurs potentielles.
     */
    const handleSend = async () => {
        if (!selectedFile || sending) return;

        setSending(true);
        try {
            await onSend(selectedFile);
            handleClose();
        } catch {
            showError(t('fileSendError'));
        } finally {
            setSending(false);
        }
    };

    /**
     * Ferme le composant FileAttachment.
     * Réinitialise les états locaux liés au fichier sélectionné et à l'envoi.
     */
    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUri(null);
        setSending(false);
        onClose();
    };

    /**
     * Formate la taille d'un fichier en une chaîne lisible (Ko, Mo, etc.).
     * @param {number} bytes - La taille du fichier en octets
     * @returns {string} La taille formatée
     */
    const formatFileSize = (bytes) => {
        if (!bytes) return t('unknownSize');
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const styles = createStyles(theme);

    return (
        <>
            <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
                <View style={styles.overlay}>
                    <View style={styles.window}>
                        {/* Title Bar */}
                        <View style={styles.titleBar}>
                            <Text style={styles.titleText}>📎 {t('fileAttachment')}</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            {!selectedFile ? (
                                <View style={styles.pickerButtons}>
                                    <TouchableOpacity style={styles.pickerButton} onPress={handleCameraPick}>
                                        <Text style={styles.pickerIcon}>📷</Text>
                                        <Text style={styles.pickerText}>{t('camera')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.pickerButton} onPress={handleImagePick}>
                                        <Text style={styles.pickerIcon}>🖼️</Text>
                                        <Text style={styles.pickerText}>{t('gallery')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.pickerButton} onPress={handleDocumentPick}>
                                        <Text style={styles.pickerIcon}>📄</Text>
                                        <Text style={styles.pickerText}>{t('document')}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.preview}>
                                    {previewUri ? (
                                        <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
                                    ) : (
                                        <View style={styles.fileIcon}>
                                            <Text style={styles.fileIconText}>📄</Text>
                                        </View>
                                    )}
                                    <Text style={styles.fileName} numberOfLines={2}>{selectedFile.name}</Text>
                                    <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.actionButton} onPress={handleClose}>
                                    <Text style={styles.actionButtonText}>{t('cancel')}</Text>
                                </TouchableOpacity>

                                {selectedFile && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.sendButton, sending && styles.sendButtonDisabled]}
                                        onPress={handleSend}
                                        disabled={sending}
                                    >
                                        {sending ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.sendButtonText}>{t('send')}</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* XP Error Modal */}
            <XPErrorModal
                visible={errorModal.visible}
                title={t('fileError')}
                message={errorModal.message}
                onClose={() => setErrorModal({ visible: false, message: '' })}
                theme={theme}
            />
        </>
    );
};

const createStyles = (theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    window: {
        width: 320,
        backgroundColor: theme.xpGray,
        borderWidth: 2,
        borderTopColor: '#fff',
        borderLeftColor: '#fff',
        borderRightColor: '#404040',
        borderBottomColor: '#404040',
    },
    titleBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 4,
        backgroundColor: theme.xpBlue,
    },
    titleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 20,
        height: 20,
        backgroundColor: theme.xpRed || '#C83232',
        borderWidth: 1,
        borderTopColor: '#fff',
        borderLeftColor: '#fff',
        borderRightColor: '#404040',
        borderBottomColor: '#404040',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    pickerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    pickerButton: {
        width: 85,
        height: 70,
        backgroundColor: theme.xpGrayLight,
        borderWidth: 1,
        borderColor: theme.xpBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    pickerText: {
        fontSize: 10,
        color: theme.xpText,
    },
    preview: {
        alignItems: 'center',
        marginBottom: 16,
    },
    previewImage: {
        width: 150,
        height: 150,
        backgroundColor: theme.xpGrayLight,
        marginBottom: 8,
    },
    fileIcon: {
        width: 80,
        height: 80,
        backgroundColor: theme.xpGrayLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    fileIconText: {
        fontSize: 40,
    },
    fileName: {
        fontSize: 11,
        color: theme.xpText,
        textAlign: 'center',
        marginBottom: 4,
    },
    fileSize: {
        fontSize: 10,
        color: theme.xpTextMuted || '#666',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionButton: {
        paddingVertical: 4,
        paddingHorizontal: 16,
        backgroundColor: theme.xpGray,
        borderWidth: 2,
        borderTopColor: '#fff',
        borderLeftColor: '#fff',
        borderRightColor: '#404040',
        borderBottomColor: '#404040',
    },
    actionButtonText: {
        fontSize: 11,
        color: theme.xpText,
    },
    sendButton: {
        backgroundColor: theme.xpBlue,
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: {
        fontSize: 11,
        color: '#fff',
    },
});

export default FileAttachment;