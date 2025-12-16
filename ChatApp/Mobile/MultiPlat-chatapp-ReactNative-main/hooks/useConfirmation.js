/**
 * @fileoverview Hook personnalisé pour gérer les dialogues de confirmation
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import '../constants/language/js/i18n';

/**
 * Hook personnalisé pour afficher des dialogues de confirmation
 * Utilise les Alert natifs de React Native avec i18n
 * @returns {Object} Objet contenant les fonctions de confirmation
 * @returns {Function} showConfirmation - Affiche un dialogue de confirmation personnalisé
 * @returns {Function} confirmDelete - Affiche un dialogue de confirmation de suppression
 */
export const useConfirmation = () => {
    const { t } = useTranslation();

    /**
     * Affiche un dialogue de confirmation avec des boutons Annuler et Confirmer
     * @param {string} title - Titre du dialogue
     * @param {string} message - Message du dialogue
     * @param {Function} onConfirm - Callback appelé lors de la confirmation
     * @param {Function|null} onCancel - Callback appelé lors de l'annulation (optionnel)
     * @returns {void}
     */
    const showConfirmation = (title, message, onConfirm, onCancel = null) => {
        Alert.alert(
            title,
            message,
            [
                {
                    text: t('cancel'),
                    style: 'cancel',
                    onPress: onCancel
                },
                {
                    text: t('confirm'),
                    style: 'destructive',
                    onPress: onConfirm
                }
            ]
        );
    };

    /**
     * Affiche un dialogue de confirmation de suppression avec un message formaté
     * @param {string} itemName - Nom de l'élément à supprimer
     * @param {string} itemType - Type de l'élément (utilisateur, canal, message, etc.)
     * @param {Function} onConfirm - Callback appelé lors de la confirmation
     * @returns {void}
     */
    const confirmDelete = (itemName, itemType, onConfirm) => {
        showConfirmation(
            t('confirmDeleteTitle'),
            t('confirmDeleteMessage', { itemType, itemName }),
            onConfirm
        );
    };

    return {
        showConfirmation,
        confirmDelete
    };
};