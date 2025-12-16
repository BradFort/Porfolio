/**
 * @fileoverview Définitions des thèmes clair et sombre de l'application
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

/**
 * Thème clair de l'application (style Windows XP)
 * @constant {Object} lightTheme
 */
export const lightTheme = {
    xpBlue: '#0054E3',
    xpBlueLight: '#4A90E2',
    xpBlueDark: '#003D99',
    xpBlueBright: '#003D99',
    xpGray: '#ECE9D8',
    xpGrayLight: '#F5F5F5',
    xpGrayDark: '#D4D0C8',
    xpBorder: '#808080',
    xpGreen: '#00AA00',
    xpOrange: '#FF8C00',
    xpRed: '#FF4444',
    xpYellow: '#FFD700',
    xpPurple: '#9B59B6',
    xpText: '#000000',
    xpTextLight: '#666666',
    xpTextWhite: '#FFFFFF',
    xpWindow: '#FFFFFF',
    xpBorderLight: '#FFFFFF',
    xpBorderDark: '#808080',
};

/**
 * Thème sombre de l'application
 * @constant {Object} darkTheme
 */
export const darkTheme = {
    xpBlue: '#1E3A8A',
    xpBlueLight: '#3B82F6',
    xpBlueDark: '#1E40AF',
    xpBlueBright: '#60A5FA',
    xpGray: '#1F2937',
    xpGrayLight: '#111827',
    xpGrayDark: '#374151',
    xpBorder: '#4B5563',
    xpGreen: '#10B981',
    xpOrange: '#F59E0B',
    xpRed: '#EF4444',
    xpYellow: '#FBBF24',
    xpPurple: '#A855F7',
    xpText: '#F9FAFB',
    xpTextLight: '#9CA3AF',
    xpTextWhite: '#FFFFFF',
    xpWindow: '#374151',
    xpBorderLight: '#6B7280',
    xpBorderDark: '#1F2937',
};

/**
 * Collection des thèmes disponibles
 * @constant {Object} themes
 * @property {Object} light - Thème clair
 * @property {Object} dark - Thème sombre
 */
export const themes = {
    light: lightTheme,
    dark: darkTheme,
};