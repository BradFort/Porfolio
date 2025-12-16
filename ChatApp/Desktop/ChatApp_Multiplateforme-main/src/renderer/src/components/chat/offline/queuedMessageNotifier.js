// Notification lorsqu'un message est mis en file d'attente (offline / en attente d'envoi)
import { t } from '../../../lang/LanguageManager.js'

export default function notifyQueuedMessage(chan, content) {
  // Sécurité : ne rien faire côté main / hors navigateur
  if (typeof window === 'undefined') return

  // On tente de déterminer un nom lisible pour le salon (name > id > toString)
  const channelName = (chan && (chan.name || chan.id)) || String(chan || '')

  // --- Notification "in-app" (toasts dans l'UI) ---
  const hasInApp = typeof window.notificationManager?.show === 'function'
  if (hasInApp) {
    try {
      // Essaye d'utiliser la clé de traduction standard
      window.notificationManager.show(
        'warning',
        t('chat.notifications.messageQueued', { channel: channelName }),
        4000
      )
    } catch {
      // Fallback : message brut en anglais si la traduction échoue
      window.notificationManager.show('warning', `Message queued for ${channelName}`, 4000)
    }
  }

  // --- Notification système (OS) via APIs exposées par Electron ---
  const title = t('chat.notifications.queuedTitle', { channel: channelName })
  const body = t('chat.notifications.messageQueuedContent', { content })

  const hasNotificationAPI = typeof window.notificationAPI?.showSystemNotification === 'function'
  const hasElectronAPI = typeof window.electronAPI?.showSystemNotification === 'function'

  if (hasNotificationAPI) {
    // API de notification personnalisée (préload)
    window.notificationAPI.showSystemNotification(title, body, 'warning')
  } else if (hasElectronAPI) {
    // Ancien pont electronAPI
    window.electronAPI.showSystemNotification(title, body, 'warning')
  }
}
