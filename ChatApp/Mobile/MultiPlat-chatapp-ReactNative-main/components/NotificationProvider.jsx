/**
 * @fileoverview Composant provider pour la gestion des notifications globales (toast, alertes, etc.).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as notificationService from '../services/notificationService';
/**
 * Composant NotificationProvider
 * Fournit un contexte pour afficher des notifications globales dans l'application.
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Les enfants du provider
 * @returns {JSX.Element}
 */
const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const { theme } = useTheme();

    const { notificationPreferences } = useAuth();

    const notifierRef = useRef({
        show: (type, message, duration = 3000) => {
            addNotification(type, message, duration);
        },
        success: (message, duration = 3000) => {
            addNotification('success', message, duration);
        },
        error: (message, duration = 4000) => {
            addNotification('error', message, duration);
        },
        warning: (message, duration = 3500) => {
            addNotification('warning', message, duration);
        },
        info: (message, duration = 3000) => {
            addNotification('info', message, duration);
        },
        remove: (id) => {
            removeNotification(id);
        },
        removeAll: () => {
            setNotifications([]);
        },
    });

    useEffect(() => {
        notificationService.registerNotifier(notifierRef.current);
    }, []);

    useEffect(() => {
        if (notificationPreferences && notificationPreferences.loaded) {
            notificationService.registerUserPreferences(notificationPreferences);
        }
    }, [notificationPreferences]);

    /**
     * Ajoute une notification à l'état.
     * @param {('success'|'error'|'warning'|'info')} type - Le type de notification
     * @param {string|Object} message - Le message de la notification
     * @param {number} duration - La durée d'affichage de la notification en millisecondes
     */
    const addNotification = (type, message, duration) => {
        const id = Date.now() + Math.random();

        let displayMessage = message;
        if (typeof message === 'object' && message.text) {
            displayMessage = message.text;
        }

        const newNotification = {
            id,
            type,
            message: displayMessage,
            opacity: new Animated.Value(0),
        };

        setNotifications((prev) => [...prev, newNotification]);

        Animated.timing(newNotification.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    };

    /**
     * Supprime une notification de l'état.
     * @param {number} id - L'identifiant de la notification à supprimer
     */
    const removeNotification = (id) => {
        setNotifications((prev) => {
            const notification = prev.find((n) => n.id === id);
            if (notification) {
                Animated.timing(notification.opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setNotifications((current) => current.filter((n) => n.id !== id));
                });
            }
            return prev;
        });
    };

    /**
     * Renvoie le style d'une notification en fonction de son type.
     * @param {('success'|'error'|'warning'|'info')} type - Le type de notification
     * @returns {Object} Le style de la notification
     */
    const getNotificationStyle = (type) => {
        const baseStyle = {
            ...styles.notification,
            backgroundColor: theme?.xpGrayLight || '#ECE9D8',
            borderColor: theme?.xpGrayDark || '#ACA899',
        };

        switch (type) {
            case 'success':
                return { ...baseStyle, borderLeftColor: theme?.xpGreen || '#4CAF50', borderLeftWidth: 4 };
            case 'error':
                return { ...baseStyle, borderLeftColor: theme?.xpRed || '#F44336', borderLeftWidth: 4 };
            case 'warning':
                return { ...baseStyle, borderLeftColor: theme?.xpOrange || '#FF9800', borderLeftWidth: 4 };
            case 'info':
            default:
                return { ...baseStyle, borderLeftColor: theme?.xpBlue || '#0054E3', borderLeftWidth: 4 };
        }
    };

    /**
     * Renvoie l'icône d'une notification en fonction de son type.
     * @param {('success'|'error'|'warning'|'info')} type - Le type de notification
     * @returns {string} L'icône de la notification
     */
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✗';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    return (
        <>
            {children}
            <View style={styles.container} pointerEvents="box-none">
                {notifications.map((notification) => (
                    <Animated.View
                        key={notification.id}
                        style={[
                            getNotificationStyle(notification.type),
                            {
                                opacity: notification.opacity,
                                transform: [
                                    {
                                        translateY: notification.opacity.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-20, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.iconContainer}>
                            <Text style={[styles.icon, { color: theme?.xpText || '#000000' }]}>
                                {getNotificationIcon(notification.type)}
                            </Text>
                        </View>
                        <Text style={[styles.message, { color: theme?.xpText || '#000000' }]} numberOfLines={3}>
                            {notification.message}
                        </Text>
                        <TouchableOpacity
                            onPress={() => removeNotification(notification.id)}
                            style={styles.closeButton}
                        >
                            <Text style={[styles.closeButtonText, { color: theme?.xpText || '#000000' }]}>✕</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        </>
    );
};

/**
 * Styles du composant NotificationProvider
 * @type {Object}
 */
const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 50 : 80,
        right: 20,
        zIndex: 9999,
        maxWidth: 350,
    },
    notification: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 10,
        borderRadius: 4,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 2,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 250,
    },
    iconContainer: {
        marginRight: 10,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    message: {
        flex: 1,
        fontSize: 12,
        lineHeight: 16,
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default NotificationProvider;