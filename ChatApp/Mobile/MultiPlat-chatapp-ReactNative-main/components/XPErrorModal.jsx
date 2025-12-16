/**
 * @fileoverview Composant modal d'erreur style Windows XP (affichage d'un message d'erreur).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

/**
 * Composant XPErrorModal
 * Affiche une modal d'erreur avec titre, message et bouton de fermeture.
 * @component
 * @param {Object} props
 * @param {boolean} props.visible - Affiche ou masque la modal
 * @param {string} props.title - Titre de la modal
 * @param {string} props.message - Message d'erreur à afficher
 * @param {function} props.onClose - Callback lors de la fermeture
 * @param {Object} props.theme - Thème de l'application
 * @returns {JSX.Element}
 */
const XPErrorModal = ({
                          visible,
                          title = 'Error',
                          message,
                          onClose,
                          theme
                      }) => {
    const styles = createStyles(theme);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.window}>
                    {/* Title Bar */}
                    <View style={styles.titleBar}>
                        <View style={styles.titleLeft}>
                            <Text style={styles.titleIcon}>⚠️</Text>
                            <Text style={styles.titleText}>{title}</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <View style={styles.messageRow}>
                            <Text style={styles.errorIcon}>❌</Text>
                            <Text style={styles.messageText}>{message}</Text>
                        </View>

                        {/* OK Button */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.okButton} onPress={onClose}>
                                <Text style={styles.okButtonText}>OK</Text>
                            </TouchableOpacity>
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    window: {
        width: 340,
        backgroundColor: theme?.xpGray || '#ECE9D8',
        borderWidth: 2,
        borderTopColor: '#fff',
        borderLeftColor: '#fff',
        borderRightColor: '#404040',
        borderBottomColor: '#404040',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 0,
        elevation: 8,
    },
    titleBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 4,
        paddingVertical: 3,
        backgroundColor: theme?.xpBlue || '#0A246A',
        background: 'linear-gradient(180deg, #0A246A 0%, #A6CAF0 100%)',
    },
    titleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    titleIcon: {
        fontSize: 14,
    },
    titleText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Tahoma',
    },
    closeButton: {
        width: 21,
        height: 21,
        backgroundColor: theme?.xpRed || '#C83232',
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
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 20,
    },
    errorIcon: {
        fontSize: 32,
    },
    messageText: {
        flex: 1,
        fontSize: 12,
        color: theme?.xpText || '#000',
        fontFamily: 'Tahoma',
        lineHeight: 18,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    okButton: {
        minWidth: 75,
        paddingVertical: 4,
        paddingHorizontal: 16,
        backgroundColor: theme?.xpGray || '#ECE9D8',
        borderWidth: 2,
        borderTopColor: '#fff',
        borderLeftColor: '#fff',
        borderRightColor: '#404040',
        borderBottomColor: '#404040',
    },
    okButtonText: {
        fontSize: 12,
        color: theme?.xpText || '#000',
        fontFamily: 'Tahoma',
        textAlign: 'center',
    },
});

export default XPErrorModal;