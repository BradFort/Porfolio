/**
 * @fileoverview Configuration de l'internationalisation (i18n) de l'application
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../en.json';
import fr from '../fr.json';

/**
 * Initialise i18next pour la gestion des traductions
 * Configure les langues disponibles (anglais et français)
 * Définit l'anglais comme langue par défaut de secours
 */
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;