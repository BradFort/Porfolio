// Gestion des notifications quand un message en attente (offline) est finalement envoyé
import { t } from '../../../lang/LanguageManager.js'

export default function setupPendingMessageNotifier(chatInstance, api) {
  // Sécurité : besoin de l'instance de chat et de l'API pour fonctionner
  if (!chatInstance || !api) return

  // Map interne pour stocker les timers de rafraîchissement par canal
  chatInstance._pendingRefreshTimers = chatInstance._pendingRefreshTimers || new Map()

  // Écoute de l'événement émis par l'API quand un message en attente est envoyé côté serveur
  api.on('pending_message_sent', (data) => {
    if (!data || !data.channelId) return
    const chanIdStr = String(data.channelId)

    // IIFE async pour pouvoir utiliser await à l'intérieur sans bloquer l'écouteur
    ;(async () => {
      // Résolution du nom de canal pour une notification plus lisible
      let channelName = String(data.channelId)

      // 1) On tente d'abord de le trouver dans la liste locale des channels
      const local = Array.isArray(chatInstance.channels)
        ? chatInstance.channels.find((c) => String(c.id) === chanIdStr)
        : null
      if (local && local.name) channelName = local.name
      else {
        // 2) Sinon, on recharge la liste des channels depuis l'API pour trouver le bon
        const chResp = await api.getChannels()
        const chs = Array.isArray(chResp.data?.data?.data) ? chResp.data.data.data : []
        const found = chs.find((c) => String(c.id) === chanIdStr)
        if (found && found.name) channelName = found.name
      }

      const content = data.messageData?.content || ''

      // Notifications côté renderer (toasts + notification système) si on est dans le contexte window
      if (typeof window !== 'undefined') {
        const hasInApp = typeof window.notificationManager?.show === 'function'
        const hasNotificationAPI =
          typeof window.notificationAPI?.showSystemNotification === 'function'
        const hasElectronAPI = typeof window.electronAPI?.showSystemNotification === 'function'

        // Toast in-app (traduction gérée côté NotificationManager)
        if (hasInApp) {
          window.notificationManager.show(
            'success',
            { key: 'chat.notifications.queuedSent', params: { channel: channelName } },
            3500
          )
        }

        // Notification système OS via les APIs exposées par le preload
        if (hasNotificationAPI) {
          window.notificationAPI.showSystemNotification(
            { key: 'chat.notifications.queuedSentTitle', params: { channel: channelName } },
            t('chat.notifications.queuedSentContent', {
              content
            }),
            'success'
          )
        } else if (hasElectronAPI) {
          // Fallback : on résout les chaînes en texte brut avant d'appeler electronAPI
          const resolvedTitle = t('chat.notifications.queuedSentTitle', {
            channel: channelName
          })
          const resolvedBody = t('chat.notifications.queuedSentContent', {
            content
          })
          window.electronAPI.showSystemNotification(resolvedTitle, resolvedBody, 'success')
        }
      }
    })()

    // Si l'utilisateur est actuellement sur ce même salon, on rafraîchit ses messages
    if (String(chatInstance.currentChannelId) === chanIdStr) {
      // Annule un éventuel timer existant pour éviter les rafraîchissements multiples
      if (chatInstance._pendingRefreshTimers.has(chanIdStr)) {
        clearTimeout(chatInstance._pendingRefreshTimers.get(chanIdStr))
      }

      // Programme un rafraîchissement léger après un petit délai (800ms)
      const timer = setTimeout(() => {
        try {
          chatInstance.refreshMessagesForChannel(data.channelId)
        } catch {
          // Erreur de rafraîchissement ignorée volontairement
        } finally {
          chatInstance._pendingRefreshTimers.delete(chanIdStr)
        }
      }, 800)

      chatInstance._pendingRefreshTimers.set(chanIdStr, timer)
    }
  })
}
