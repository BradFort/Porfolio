// Gestion du thème (clair/sombre) et de la langue de l'utilisateur dans le chat
import API from '../../../../../main/api.js'
import { getCurrentUser } from '../../auth/auth.js'
import { t, languageManager } from '../../../lang/LanguageManager.js'

class ThemeManager {
  constructor() {
    // Client pour appeler l'API backend
    this.api = new API()
    // Valeurs par défaut au démarrage
    this.currentTheme = 'light'
    this.currentLang = 'fr'
    // Lance l'initialisation (charge préférences user + localStorage)
    this.init()
  }

  async init() {
    // 1) Essayer de charger le thème enregistré côté backend pour l'utilisateur
    await this.loadUserTheme()

    // 2) Si aucun thème défini côté serveur, on regarde dans le localStorage
    if (!this.currentTheme) {
      const lsTheme = this.getLocalTheme()
      if (lsTheme) this.currentTheme = lsTheme
      else this.currentTheme = 'light'
    }

    // 3) Initialiser le gestionnaire de langue pour récupérer celle en cours
    await languageManager.init()
    this.currentLang = languageManager.getLang() || this.currentLang

    // 4) Surcharger avec la langue stockée pour l'utilisateur si elle existe
    await this.loadUserLang()

    // 5) Si la langue du LanguageManager est différente, on la synchronise
    if (languageManager.getLang() !== this.currentLang) {
      await languageManager.setLang(this.currentLang)
    }

    // 6) Appliquer le thème actuel sur le DOM + le sauvegarder en local
    this.applyTheme(this.currentTheme)
    this.setLocalTheme(this.currentTheme)
  }

  // Récupère le thème stocké dans le localStorage (si dispo)
  getLocalTheme() {
    try {
      const ls = typeof window !== 'undefined' ? window.localStorage : null
      return ls ? ls.getItem('theme') : null
    } catch {
      return null
    }
  }

  // Sauvegarde le thème dans le localStorage (si dispo)
  setLocalTheme(theme) {
    try {
      const ls = typeof window !== 'undefined' ? window.localStorage : null
      if (ls) ls.setItem('theme', theme)
    } catch {
      // ignore
    }
  }

  // Charge la langue préférée de l'utilisateur connecté (si disponible)
  async loadUserLang() {
    try {
      const user = await getCurrentUser()
      if (user && user.lang) {
        this.currentLang = user.lang
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la langue:', error)
    }
  }

  // Charge le thème préféré de l'utilisateur connecté (si disponible)
  async loadUserTheme() {
    try {
      const user = await getCurrentUser()
      if (user && user.theme) {
        this.currentTheme = user.theme
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error)
    }
  }

  // Applique dynamiquement les couleurs du thème en CSS (variables :root)
  applyTheme(theme) {
    const root = document.documentElement

    if (theme === 'dark') {
      // Palette sombre
      root.style.setProperty('--xp-blue', '#0054E3')
      root.style.setProperty('--xp-blue-light', '#4A90E2')
      root.style.setProperty('--xp-blue-dark', '#003D99')
      root.style.setProperty('--xp-gray', '#2D2D30')
      root.style.setProperty('--xp-gray-light', '#3E3E42')
      root.style.setProperty('--xp-gray-dark', '#252526')
      root.style.setProperty('--xp-border', '#3E3E42')
      root.style.setProperty('--xp-border-light', '#484848')
      root.style.setProperty('--xp-border-dark', '#1E1E1E')
      root.style.setProperty('--xp-green', '#00AA00')
      root.style.setProperty('--xp-orange', '#FF8C00')
      root.style.setProperty('--xp-red', '#FF4444')
      root.style.setProperty('--xp-text', '#CCCCCC')
      root.style.setProperty('--xp-text-light', '#969696')
      root.style.setProperty('--xp-selection', '#316AC5')
    } else {
      // Palette claire (look Windows XP)
      root.style.setProperty('--xp-blue', '#0054E3')
      root.style.setProperty('--xp-blue-light', '#4A90E2')
      root.style.setProperty('--xp-blue-dark', '#003D99')
      root.style.setProperty('--xp-gray', '#ECE9D8')
      root.style.setProperty('--xp-gray-light', '#F5F5F5')
      root.style.setProperty('--xp-gray-dark', '#D4D0C8')
      root.style.setProperty('--xp-border', '#808080')
      root.style.setProperty('--xp-border-light', '#FFFFFF')
      root.style.setProperty('--xp-border-dark', '#404040')
      root.style.setProperty('--xp-green', '#00AA00')
      root.style.setProperty('--xp-orange', '#FF8C00')
      root.style.setProperty('--xp-red', '#FF4444')
      root.style.setProperty('--xp-text', '#000000')
      root.style.setProperty('--xp-text-light', '#666666')
      root.style.setProperty('--xp-selection', '#316AC5')
    }

    // Met à jour l'état courant et un attribut sur le body (utile pour le CSS)
    this.currentTheme = theme
    document.body.setAttribute('data-theme', theme)
  }

  // Inverse le thème (clair <-> sombre), enregistre côté API + localStorage + met à jour l'UI
  async toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    const themeButton = document.getElementById('toggle-theme')

    try {
      if (themeButton) themeButton.disabled = true

      // Met à jour le thème côté backend / local
      const result = await this.updateUserTheme(newTheme)

      if (result.success) {
        // Applique le thème et le sauvegarde localement
        this.applyTheme(newTheme)
        this.setLocalTheme(newTheme)

        // Met à jour le texte du bouton de thème
        if (themeButton) {
          themeButton.textContent =
            newTheme === 'dark' ? t('buttons.themeLight') : t('buttons.themeDark')
        }

        // Notification de succès
        if (window.notificationManager) {
          window.notificationManager.success(
            t('notifications.themeChanged', { mode: t(`notifications.themeMode.${newTheme}`) })
          )
        }
      } else {
        // Erreur remontée par le backend
        console.error(t('notifications.themeChangeError') + ':', result.message)
        if (window.notificationManager) {
          window.notificationManager.error(t('notifications.themeChangeError'))
        }
      }
    } catch (error) {
      // Erreur réseau / inattendue
      console.error(t('notifications.themeChangeError') + ':', error)
      if (window.notificationManager) {
        window.notificationManager.error(t('notifications.themeChangeError'))
      }
    } finally {
      if (themeButton) themeButton.disabled = false
    }
  }

  // Inverse la langue (fr <-> en), met à jour l'API, LanguageManager, les boutons et notifie
  async toggleLanguage() {
    const newLang = this.currentLang === 'en' ? 'fr' : 'en'
    const langButton = document.getElementById('toggle-lang')

    try {
      if (langButton) langButton.disabled = true
      // Mettre à jour la langue côté backend / local
      const result = await this.updateUserLang(newLang)
      if (result.success) {
        this.currentLang = newLang

        // Mettre à jour le texte du bouton de langue
        if (langButton) langButton.textContent = newLang === 'fr' ? 'FR' : 'EN'

        // Appliquer la langue dans le LanguageManager
        try {
          await languageManager.setLang(newLang)
        } catch (e) {
          console.debug('[i18n] setLang on toggle failed:', e)
        }
        // Re-appliquer les traductions sur le DOM si un helper global existe
        try {
          if (window.__i18n && typeof window.__i18n.apply === 'function') {
            await window.__i18n.apply()
          }
        } catch (e) {
          console.debug('[i18n] manual apply failed:', e)
        }

        // Mettre à jour le texte du bouton de thème avec la nouvelle langue
        const themeButton = document.getElementById('toggle-theme')
        if (themeButton) {
          themeButton.textContent =
            this.currentTheme === 'dark' ? t('buttons.themeLight') : t('buttons.themeDark')
        }

        // Notification de succès
        if (window.notificationManager) {
          window.notificationManager.success(
            t('notifications.langChanged', { lang: newLang.toUpperCase() })
          )
        }
      } else {
        console.error(t('notifications.langChangeError') + ':', result.message)
        if (window.notificationManager) {
          window.notificationManager.error(t('notifications.langChangeError'))
        }
      }
    } catch (error) {
      console.error(t('notifications.langChangeError') + ':', error)
      if (window.notificationManager) {
        window.notificationManager.error(t('notifications.langChangeError'))
      }
    } finally {
      if (langButton) langButton.disabled = false
    }
  }

  // Met à jour la langue de l'utilisateur côté backend (ou local si non connecté)
  async updateUserLang(lang) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        // Pas d'utilisateur : on applique seulement localement
        await languageManager.setLang(lang)
        return { success: true, message: 'Lang stored locally' }
      }
      return await this.api.updateUserLang(currentUser.id, lang)
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la langue:', error)
      return { success: false, message: error.message }
    }
  }

  // Met à jour le thème de l'utilisateur côté backend (ou local si non connecté)
  async updateUserTheme(theme) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        this.setLocalTheme(theme)
        return { success: true, message: 'Theme stored locally' }
      }
      return await this.api.updateUser(currentUser.id, { theme })
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error)
      return { success: false, message: error.message }
    }
  }
}

// Instancie le ThemeManager au chargement et l'expose globalement pour pouvoir l'utiliser ailleurs
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager()
})

export default ThemeManager
