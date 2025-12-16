/**
 * @fileoverview Contexte de gestion du thème (clair/sombre)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { darkTheme, lightTheme } from '../constants/themes';
import authService from '../services/authService';

/**
 * Clés de stockage pour les préférences de thème
 * @constant
 */
const STORAGE_KEYS = {
    THEME: 'lastTheme'
};

/**
 * Contexte de gestion du thème
 */
const ThemeContext = createContext({});

/**
 * Provider du contexte de thème
 * Gère le basculement entre thème clair et sombre
 * Sauvegarde les préférences par utilisateur
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composants enfants
 * @returns {JSX.Element} Provider avec le contexte de thème
 */
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(lightTheme);
    const [themeName, setThemeName] = useState('light');

    useEffect(() => {
        const loadTheme = async () => {
            try {
                // 1) Try per-user preference (if there's a stored user)
                const storedUser = await authService.getStoredUser().catch(() => null);
                if (storedUser && storedUser.id) {
                    const userKey = `theme:${storedUser.id}`;
                    const userTheme = await AsyncStorage.getItem(userKey);
                    if (userTheme) {
                        setThemeName(userTheme);
                        setTheme(userTheme === 'dark' ? darkTheme : lightTheme);
                        // Also update global lastTheme so login screen uses it
                        await AsyncStorage.setItem(STORAGE_KEYS.THEME, userTheme);
                        return;
                    }
                }

                // 2) Fallback to global lastTheme
                const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
                if (savedTheme) {
                    setThemeName(savedTheme);
                    setTheme(savedTheme === 'dark' ? darkTheme : lightTheme);
                } else {
                    setThemeName('light');
                    setTheme(lightTheme);
                }
            } catch (error) {
                console.warn('ThemeContext: loadTheme error', error);
            }
        };
        loadTheme();
    }, []);

    const persistTheme = async (name) => {
        try {
            // save global lastTheme
            await AsyncStorage.setItem(STORAGE_KEYS.THEME, name);
            // if there's a stored user, also save per-user preference
            const storedUser = await authService.getStoredUser().catch(() => null);
            if (storedUser && storedUser.id) {
                await AsyncStorage.setItem(`theme:${storedUser.id}`, name);
            }
        } catch { /* ignore */ }
    };

    const setThemeByName = async (name) => {
        setThemeName(name);
        setTheme(name === 'dark' ? darkTheme : lightTheme);
        await persistTheme(name);
    };

    const applyUserTheme = async (userId) => {
        try {
            if (!userId) return;
            const userKey = `theme:${userId}`;
            const userTheme = await AsyncStorage.getItem(userKey);
            if (userTheme) {
                setThemeName(userTheme);
                setTheme(userTheme === 'dark' ? darkTheme : lightTheme);
                await AsyncStorage.setItem(STORAGE_KEYS.THEME, userTheme);
            } else {
                // default for new user = light
                setThemeName('light');
                setTheme(lightTheme);
                await AsyncStorage.setItem(STORAGE_KEYS.THEME, 'light');
            }
        } catch { /* ignore */ }
    };

    const toggleTheme = async () => {
        const newName = themeName === 'dark' ? 'light' : 'dark';
        setThemeName(newName);
        setTheme(newName === 'dark' ? darkTheme : lightTheme);
        await persistTheme(newName);
    };

    const value = {
        theme,
        themeName,
        toggleTheme,
        setThemeByName,
        applyUserTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;