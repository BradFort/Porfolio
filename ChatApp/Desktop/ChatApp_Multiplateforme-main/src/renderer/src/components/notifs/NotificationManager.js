// NotificationManager.js - Système de notifications pop-up (toasts + intégration Electron)
import { t, languageManager } from '../../lang/LanguageManager.js'

class NotificationManager {
  constructor(chatService) {
    // Référence vers le service de chat (pour récupérer les préférences de notif utilisateur)
    this.chatService = chatService
    // Conteneur DOM racine des notifications
    this.container = null
    // Map <id, element> pour suivre les notifications actives
    this.notifications = new Map()
    // Compteur auto-incrémenté pour générer des IDs uniques
    this.notificationId = 0
    // Nombre maximum de notifs visibles en même temps
    this.maxNotifications = 5
    // Fonction de désabonnement au changement de langue (si fournie par languageManager)
    this._onLangChangeUnsub = null
    // Initialisation immédiate (DOM + listener i18n)
    this.init()
  }

  init() {
    // Crée ou récupère le conteneur `.notification-container`
    this.container = document.querySelector('.notification-container')
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.className = 'notification-container'
      document.body.appendChild(this.container)
    }

    // Initialise le gestionnaire de langue si la méthode existe
    languageManager.init?.()

    // Abonne le manager au changement de langue pour rafraîchir les titres/messages existants
    if (
      !this._onLangChangeUnsub &&
      languageManager &&
      typeof languageManager.onChange === 'function'
    ) {
      this._onLangChangeUnsub = languageManager.onChange(() => {
        this._refreshAllNotificationsForLangChange()
      })
    }
  }

  async getDisabledNotificationTypeIds() {
    // Détermine le chatService à utiliser (celui passé au ctor ou window.chatService)
    const chatService =
      this.chatService ?? (typeof window !== 'undefined' ? window.chatService : null)
    const userId = chatService?.currentUser?.id

    // Si l'API ne fournit pas les types de notification, on considère qu'aucun n'est désactivé
    if (!chatService?.api?.getUserNotificationTypes) {
      return []
    }
    try {
      const resp = await chatService.api.getUserNotificationTypes(userId)

      if (Array.isArray(resp?.data?.data)) {
        // Renvoie la liste des IDs de type désactivés pour cet utilisateur
        return resp.data.data.map((nt) => nt.id)
      }
    } catch (err) {
      console.error('NotificationManager: failed to fetch disabled notification types', err)
    }

    return []
  }

  // Méthode générique d'affichage d'une notification (type, message, durée)
  async show(type = 'info', message = '', duration = 3000) {
    // Vérifie si ce type de notification est désactivé (ex: 1 = toasts standard)
    const disabledTypeIds = await this.getDisabledNotificationTypeIds()
    if (disabledTypeIds.includes(1)) {
      return null
    }

    const id = ++this.notificationId

    // Si trop de notifications, on supprime la plus ancienne
    if (this.notifications.size >= this.maxNotifications) {
      const oldestId = Math.min(...this.notifications.keys())
      this.remove(oldestId)
    }

    // Construit le DOM de la notification
    const notification = this.createNotification(id, type, message, duration)
    this.notifications.set(id, notification)

    this.container.appendChild(notification)

    // Déclencher l'animation d'entrée (transition CSS)
    requestAnimationFrame(() => {
      notification.classList.add('show')
      notification.style.opacity = '1'
    })

    // Auto-suppression après la durée spécifiée (si duration > 0)
    if (duration > 0) {
      const progressBar = notification.querySelector('.notification-progress')
      if (progressBar) {
        // Barre de progression qui diminue pendant la durée de vie
        progressBar.style.width = '100%'
        progressBar.style.transitionDuration = `${duration}ms`
        requestAnimationFrame(() => {
          progressBar.style.width = '0%'
        })
      }

      setTimeout(() => {
        this.remove(id)
      }, duration)
    }

    return id
  }

  createNotification(id, type, message, duration) {
    const notification = document.createElement('div')
    notification.className = `notification-popup ${type}`
    notification.dataset.id = id

    // Icônes selon le type
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'i'
    }

    // Titres selon le type (i18n) - évalués lors du rendu
    const titles = {
      success: t('notifications.titles.success'),
      error: t('notifications.titles.error'),
      warning: t('notifications.titles.warning'),
      info: t('notifications.titles.info')
    }

    // Supporter message comme string ou objet i18n: { key, params }
    let renderedMessage
    if (message && typeof message === 'object' && message.key) {
      const params = message.params || {}
      renderedMessage = this.escapeHtml(t(message.key, params))
      // Stocke la clé + params pour pouvoir re-traduire si la langue change
      notification.dataset.i18nMessageKey = message.key
      try {
        notification.dataset.i18nMessageParams = JSON.stringify(params)
      } catch {
        notification.dataset.i18nMessageParams = ''
      }
    } else {
      renderedMessage = this.escapeHtml(String(message ?? ''))
    }

    // HTML de base de la notification
    notification.innerHTML = `
      <div class="notification-icon">${icons[type] || icons.info}</div>
      <div class="notification-content">
        <div class="notification-title">${titles[type] || titles.info}</div>
        <div class="notification-message">${renderedMessage}</div>
      </div>
      <button class="notification-close" type="button">×</button>
      ${duration > 0 ? '<div class="notification-progress"></div>' : ''}
    `

    // Bouton de fermeture (croix)
    const closeBtn = notification.querySelector('.notification-close')
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.remove(id)
      })
    }

    // Clic sur la carte entière = fermeture, sauf si clic direct sur la croix
    notification.addEventListener('click', (e) => {
      if (e.target !== closeBtn) {
        this.remove(id)
      }
    })

    return notification
  }

  // Parcourt toutes les notifications existantes pour re-traduire titres/messages quand la langue change
  _refreshAllNotificationsForLangChange() {
    try {
      for (const [el] of this.notifications.entries()) {
        try {
          const titleEl = el.querySelector('.notification-title')
          const typeClass = el.classList.contains('error')
            ? 'error'
            : el.classList.contains('success')
              ? 'success'
              : el.classList.contains('warning')
                ? 'warning'
                : 'info'
          if (titleEl) {
            titleEl.textContent = t(`notifications.titles.${typeClass}`)
          }

          const msgKey = el.dataset.i18nMessageKey
          if (msgKey) {
            let params = {}
            try {
              params = JSON.parse(el.dataset.i18nMessageParams || '{}')
            } catch {
              params = {}
            }
            const msgText = this.escapeHtml(t(msgKey, params))
            const msgEl = el.querySelector('.notification-message')
            if (msgEl) msgEl.innerHTML = msgText
          }
        } catch (err) {
          console.warn('NotificationManager: failed to refresh a notification', err)
        }
      }
    } catch (e) {
      console.error('NotificationManager: error during lang refresh', e)
    }
  }

  // Supprime une notification avec animation de sortie
  remove(id) {
    const notification = this.notifications.get(id)
    if (!notification) return

    // Animation de sortie
    notification.classList.remove('show')
    notification.classList.add('hide')

    // Supprimer après l'animation
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      this.notifications.delete(id)
    }, 300)
  }

  // Supprime toutes les notifications actives
  removeAll() {
    for (const id of this.notifications.keys()) {
      this.remove(id)
    }
  }

  // Méthodes raccourcies spécifiques pour chaque type
  async success(message, duration = 3000) {
    return await this.show('success', message, duration)
  }

  async error(message, duration = 4000) {
    return await this.show('error', message, duration)
  }

  async info(message, duration = 3000) {
    return await this.show('info', message, duration)
  }

  // Utilitaire pour échapper le HTML (évite l'injection lors de l'affichage de chaînes arbitraires)
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

// Instance globale du NotificationManager (utilisant window.chatService si dispo)
const notificationManager = new NotificationManager(window.chatService ?? null)

// Exposition globale pour l'utilisation dans d'autres scripts (chat, menu, etc.)
window.notificationManager = notificationManager

// Integration avec le système existant (pont de compatibilité notificationAPI)
if (typeof window !== 'undefined') {
  if (!Object.prototype.hasOwnProperty.call(window, 'notificationAPI')) {
    window.notificationAPI = {
      // Ancien point d'entrée pour afficher des toasts
      showNotification: (type, message, duration) => {
        notificationManager.show(type, message, duration)
        return { success: true }
      },

      // Proxy vers les notifications système (Electron) + toast dans l'UI
      showSystemNotification: (title, body, type) => {
        // If title is an i18n object, resolve it; otherwise use raw title
        let resolvedTitle
        if (title && typeof title === 'object' && title.key) {
          resolvedTitle = t(title.key, title.params || {})
        } else {
          resolvedTitle = String(title || '')
        }

        // Pour l'UI, on affiche un toast avec "Titre: corps"
        notificationManager.show(type || 'info', `${resolvedTitle}: ${body}`, 4000)

        // Garder l'appel à l'API système Electron si disponible
        if (window.electronAPI) {
          return window.electronAPI.showSystemNotification?.(resolvedTitle, body, type)
        }
        return { success: true }
      },

      // Écoute des notifications personnalisées déclenchées via un Event DOM
      onNotification: (callback) => {
        // Écouter les événements de notification personnalisés
        document.addEventListener('app:notification', (event) => {
          const data = event.detail
          notificationManager.show(data.type, data.message, data.duration)
          callback(data)
        })
      },

      // Nettoie toutes les notifications visibles
      removeAllListeners: () => {
        // Nettoyer les notifications affichées
        notificationManager.removeAll()
      }
    }
  }
}

// Écouter les notifications venant du processus principal Electron
if (window.electronAPI) {
  window.electronAPI.onNotification?.((data) => {
    notificationManager.show(data.type || 'info', data.message, data.duration || 3000)
  })
}

export default NotificationManager
