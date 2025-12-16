/**
 * @fileoverview Composant champ de saisie style Windows XP (input texte, mot de passe, etc.).
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Composant XPInput
 * Affiche un champ de saisie stylisé façon Windows XP.
 * @component
 * @param {Object} props
 * @param {string} [props.value] - Valeur du champ
 * @param {function} [props.onChangeText] - Callback lors de la modification
 * @param {string} [props.placeholder] - Placeholder du champ
 * @param {boolean} [props.secureTextEntry] - Champ sécurisé (mot de passe)
 * @param {Object} [props.style] - Styles additionnels
 * @param {Object} [props.theme] - Thème de l'application
 * @returns {JSX.Element}
 */
export const XPInput = ({
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    style
}) => {
    const { theme } = useTheme(); // 🔥 on récupère le thème actuel (dark/light)

    return (
        <View
            style={[
                styles.wrapper,
                {
                    borderColor: theme.xpBorder,
                    backgroundColor: theme.xpGrayLight,
                },
                style,
            ]}
        >
            <TextInput
                style={[
                    styles.input,
                    {
                        color: theme.xpText, // 🔥 texte devient blanc en mode dark
                    },
                ]}
                placeholder={placeholder}
                placeholderTextColor={theme.xpTextLight} // 🔥 aussi dynamique
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderWidth: 1,
        borderRadius: 5,
    },
    input: {
        padding: 8,
        fontSize: 14,
    },
});
