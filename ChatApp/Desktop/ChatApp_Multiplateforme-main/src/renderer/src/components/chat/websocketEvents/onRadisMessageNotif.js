import { t } from '../../../lang/LanguageManager.js'

/**
 * Listener WebSocket déclenché lorsqu'un nouveau message arrive dans un salon autre que le salon courant.
 * Affiche une notification in-app et une notification système pour informer l'utilisateur.
 * @param {import('../Chat.js').default} chat - Instance principale du chat (UI + état courant)
 * @param {import('../../../../main/services/ChatService.js').default} api - Service API / WebSocket
 */
export function onRadisMessageNotif(chat, api) {
  api.websocketListener.on('radis_message_notif', (data) => {
    if (String(data.channelId) === String(chat.currentChannelId)) {
      return
    }

    let channelName = data.chan?.name || data.channelName
    if (!channelName && data.channelId && chat.channels) {
      const found = chat.channels.find((c) => String(c.id) === String(data.channelId))
      if (found) channelName = found.name
    }
    channelName = channelName || `Channel ${data.channelId}`

    const content = t('notifications.checkConversation')

    if (window.notificationManager) {
      window.notificationManager.info(
        t('notifications.newMessageInChannel', { channel: channelName }),
        3000
      )
    }

    if (window.electronAPI && window.electronAPI.showSystemNotification) {
      window.electronAPI.showSystemNotification(
        t('notifications.newMessageInChannel', { channel: channelName }),
        content
      )
    }
  })
}
