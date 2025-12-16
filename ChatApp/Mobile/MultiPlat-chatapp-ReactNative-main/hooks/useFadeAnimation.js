/**
 * @fileoverview Hook personnalisé pour gérer les animations de fondu (fade in/out)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Hook personnalisé pour créer des animations de fondu
 * Fournit des fonctions pour animer l'opacité d'un composant
 * @param {number} initialValue - Valeur initiale de l'opacité (0 à 1, défaut: 0)
 * @returns {Object} Objet contenant la valeur animée et les fonctions d'animation
 * @returns {Animated.Value} fadeAnim - Valeur animée pour l'opacité
 * @returns {Function} fadeIn - Fonction pour faire apparaître progressivement
 * @returns {Function} fadeOut - Fonction pour faire disparaître progressivement
 */
export const useFadeAnimation = (initialValue = 0) => {
    const fadeAnim = useRef(new Animated.Value(initialValue)).current;

    /**
     * Anime l'opacité de 0 à 1 (apparition progressive)
     * @param {number} duration - Durée de l'animation en millisecondes (défaut: 300)
     * @returns {void}
     */
    const fadeIn = (duration = 300) => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
        }).start();
    };

    /**
     * Anime l'opacité de 1 à 0 (disparition progressive)
     * @param {number} duration - Durée de l'animation en millisecondes (défaut: 300)
     * @returns {void}
     */
    const fadeOut = (duration = 300) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
        }).start();
    };

    return { fadeAnim, fadeIn, fadeOut };
};