/**
 * @fileoverview Composant menu contextuel utilisateur façon Windows XP (appui long sur un utilisateur).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Modal
} from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Menu contextuel Windows XP qui apparaît lors d'un appui long sur un utilisateur
 * @component
 * @param {Object} props
 * @param {Object} props.user - L'utilisateur sélectionné
 * @param {Object} props.position - Position {x, y} absolue du doigt (ou du nom)
 * @param {Function} props.onCreateDM - Callback pour créer un DM
 * @param {Function} props.onClose - Callback pour fermer le menu
 * @param {Object} props.theme - L'objet theme pour les couleurs dynamiques
 * @returns {JSX.Element}
 */
export const UserContextMenu = ({ user, position, onCreateDM, onClose, theme }) => {
    const { t } = useTranslation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Apparition
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 7,
                tension: 80,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    /**
     * Gère la fermeture du menu contextuel en lançant une animation de disparition.
     * @function
     * @name handleClose
     */
    const handleClose = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start(() => onClose && onClose());
    };

    /**
     * Gère la création d'un nouveau message direct en appelant le callback onCreateDM
     * après la fermeture du menu contextuel.
     * @function
     * @name handleCreateDM
     */
    const handleCreateDM = () => {
        handleClose();
        setTimeout(() => {
            onCreateDM && onCreateDM(user);
        }, 150);
    };

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const menuWidth = 200;
    const menuHeight = 100;

    const menuX = (screenWidth - menuWidth) / 2;
    const menuY = (screenHeight - menuHeight) / 2;

    if (!user) return null;

    const dynamicStyles = {
        menu: {
            backgroundColor: theme.xpGrayLight,
            borderTopColor: theme.xpBorderLight,
            borderLeftColor: theme.xpBorderLight,
            borderRightColor: theme.xpBorderDark,
            borderBottomColor: theme.xpBorderDark,
        },
        menuHeader: {
            backgroundColor: theme.xpBlue,
        },
        userIcon: {
            backgroundColor: theme.xpBlueLight,
        },
        separator: {
            backgroundColor: theme.xpBorder,
        },
        menuItemText: {
            color: theme.xpText,
        },
    };

    return (
        <Modal
            visible={true}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={handleClose}
            >
                <Animated.View
                    style={[
                        styles.menu,
                        dynamicStyles.menu,
                        {
                            left: menuX,
                            top: menuY,
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={[styles.menuHeader, dynamicStyles.menuHeader]}>
                        <View style={[styles.userIcon, dynamicStyles.userIcon]}>
                            <Text style={styles.userIconText}>
                                {user.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                        <Text style={styles.menuHeaderText} numberOfLines={1}>
                            {user.name}
                        </Text>
                    </View>

                    <View style={[styles.separator, dynamicStyles.separator]} />

                    {/* Option */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={handleCreateDM}
                        activeOpacity={0.7}
                    >
                        <View style={styles.menuItemIcon}>
                            <Text style={styles.menuItemIconText}>💬</Text>
                        </View>
                        <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>
                            {t('newDirectMessage') || 'Nouveau message direct'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        elevation: 999999,
    },
    menu: {
        position: 'absolute',
        width: 200,
        height: 100,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 20,
        zIndex: 1000000,
    },
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 6,
    },
    userIcon: {
        width: 24,
        height: 24,
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userIconText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    menuHeaderText: {
        flex: 1,
        fontSize: 11,
        fontWeight: 'bold',
        color: 'white',
    },
    separator: {
        height: 1,
        marginVertical: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
    },
    menuItemIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemIconText: {
        fontSize: 16,
    },
    menuItemText: {
        fontSize: 12,
        flex: 1,
        fontWeight: '600',
    },
});