/**
 * @fileoverview Composant bouton style Windows XP (bouton principal, secondaire, etc.).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Composant XPButton
 * Affiche un bouton stylisé façon Windows XP.
 * @component
 * @param {Object} props
 * @param {string} props.title - Texte du bouton
 * @param {function} props.onPress - Callback lors du clic
 * @param {boolean} [props.disabled] - Désactive le bouton
 * @param {Object} [props.style] - Styles additionnels
 * @param {Object} [props.theme] - Thème de l'application
 * @returns {JSX.Element}
 */

/**
 * Composant de bouton avec style Windows XP
 * Supporte deux variantes: normal et primary (bleu)
 * @param {Object} props
 * @param {string} props.title - Texte du bouton
 * @param {Function} props.onPress - Fonction appelée lors du clic
 * @param {boolean} [props.primary=false] - Si true, affiche le bouton en bleu
 * @param {Object} [props.style] - Styles additionnels
 * @returns {JSX.Element} Bouton stylisé Windows XP
 */
export const XPButton = ({ title, onPress, primary = false, style }) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: theme.xpGray,
                    borderColor: theme.xpGrayDark,
                },
                primary && { backgroundColor: theme.xpBlue },
                style
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[
                styles.text,
                { color: theme.xpText },
                primary && styles.textPrimary
            ]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    text: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    textPrimary: {
        color: 'white',
    },
});