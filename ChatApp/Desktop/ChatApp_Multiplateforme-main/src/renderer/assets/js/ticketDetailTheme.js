// Gestionnaire de thème et de traductions pour la page de détail de ticket
// - Charge le thème (clair/sombre) depuis localStorage ou depuis l'utilisateur
// - Applique les variables CSS et attributs de thème
// - Applique les traductions statiques de la page
import { languageManager, t } from '../../src/lang/LanguageManager.js'

class TicketDetailThemeManager {
  constructor() {
    // Thème courant ("light" ou "dark")
    this.currentTheme = 'light'
    // Langue courante ("fr" ou "en")
    this.currentLang = 'fr'
    this.init()
  }

  // Initialisation : charge le thème, initialise le languageManager
  // puis abonne un listener pour mettre à jour les textes lors des changements de langue
  async init() {
    await this.loadTheme()
    await languageManager.init()
    this.currentLang = languageManager.getLang() || 'fr'
    this.applyTheme(this.currentTheme)
    this.applyTranslations()
    languageManager.onChange(() => {
      this.currentLang = languageManager.getLang()
      this.applyTranslations()
    })
  }

  // Charge le thème depuis localStorage ou depuis le user courant via Electron
  async loadTheme() {
    try {
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme) {
        this.currentTheme = storedTheme
      }
      if (window.electronAPI && window.electronAPI.getCurrentUser) {
        try {
          const user = await window.electronAPI.getCurrentUser()
          if (user && user.theme) {
            this.currentTheme = user.theme
            localStorage.setItem('theme', user.theme)
          }
        } catch (error) {
          console.warn('[TicketDetailTheme] Could not fetch user theme:', error)
        }
      }
    } catch (error) {
      console.error('[TicketDetailTheme] Error loading theme:', error)
    }
  }

  // Applique le thème en modifiant les variables CSS globales
  applyTheme(theme) {
    const root = document.documentElement

    if (theme === 'dark') {
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

    this.currentTheme = theme
    document.body.setAttribute('data-theme', theme)
    console.log('[TicketDetailTheme] Theme applied:', theme)
  }

  // Applique les traductions pour les textes statiques de la page
  applyTranslations() {
    const windowTitle = document.querySelector('.window-title')
    if (windowTitle && !windowTitle.textContent.includes('#')) {
      windowTitle.textContent = t('ticket.detail.title')
    }

    const backBtn = document.getElementById('back-btn')
    if (backBtn) {
      backBtn.innerHTML = `← ${t('ticket.detail.backButton')}`
    }

    const descTitle = document.querySelector('.ticket-description-container h2')
    if (descTitle) {
      descTitle.textContent = t('ticket.detail.description')
    }

    const commentsTitle = document.querySelector('.comments-section h2')
    if (commentsTitle) {
      commentsTitle.textContent = t('ticket.detail.comments')
    }

    const commentInput = document.getElementById('comment-input')
    if (commentInput && !commentInput.disabled) {
      commentInput.placeholder = t('ticket.detail.addComment')
    }

    const sendBtn = document.getElementById('send-comment-btn')
    if (sendBtn && sendBtn.textContent !== t('ticket.detail.sending')) {
      sendBtn.textContent = t('ticket.detail.send')
    }

    const assignBtn = document.getElementById('assign-ticket-btn')
    if (assignBtn) {
      assignBtn.textContent = t('ticket.detail.admin.assign')
    }

    const statusBtn = document.getElementById('status-ticket-btn')
    if (statusBtn) {
      statusBtn.textContent = t('ticket.detail.admin.changeStatus')
    }

    const priorityBtn = document.getElementById('priority-ticket-btn')
    if (priorityBtn) {
      priorityBtn.textContent = t('ticket.detail.admin.changePriority')
    }

    const deleteBtn = document.getElementById('delete-ticket-btn')
    if (deleteBtn) {
      deleteBtn.textContent = t('ticket.detail.admin.delete')
    }
  }

  // Helper pour récupérer une chaîne traduite
  getTranslation(key) {
    return t(key)
  }
}

const themeManager = new TicketDetailThemeManager()

export default themeManager
