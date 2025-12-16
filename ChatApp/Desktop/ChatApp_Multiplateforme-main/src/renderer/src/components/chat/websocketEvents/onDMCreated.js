import { t } from '../../../lang/LanguageManager.js'

/**
 * Listener WebSocket pour la création d'un nouveau canal de messages privés (DM).
 * Notifie l'utilisateur concerné, met à jour les abonnements WebSocket et réinitialise le chat.
 * @param {import('../Chat.js').default} chat - Instance principale du chat
 * @param {import('../../../../main/services/ChatService.js').default} api - Service API / WebSocket
 */
export function onDMCreated(chat, api) {
  api.websocketListener.on('dm_created', async (data) => {
    const { channel_id, channel, participant1_id, participant2_id } = data
    const currentUserId = chat.currentUser?.id

    if (
      String(currentUserId) !== String(participant1_id) &&
      String(currentUserId) !== String(participant2_id)
    ) {
      return
    }

    if (api.websocketListener && api.websocketListener.isConnected()) {
      const currentDmChannelIds = chat.channels.filter((ch) => ch.type === 'dm').map((ch) => ch.id)

      if (!currentDmChannelIds.includes(Number(channel_id))) {
        currentDmChannelIds.push(Number(channel_id))
      }

      api.websocketListener.subscribeToNotifications(currentDmChannelIds)
    }

    let otherUserName = t('chat.unknownUser')

    if (channel && channel.description) {
      const match = channel.description.match(/entre (.+) et (.+)/)
      if (match) {
        const name1 = match[1]
        const name2 = match[2]
        otherUserName = name1 !== chat.currentUser.name ? name1 : name2
      }
    }

    // Notification dans le client
    if (window.notificationManager) {
      window.notificationManager.show(
        'info',
        t('notifications.dmCreated', { name: otherUserName }),
        3000
      )
    }

    // Notification système
    if (window.electronAPI && window.electronAPI.showSystemNotification) {
      const title = t('notifications.dmCreated', { name: otherUserName })
      const body = t('invitations.modal.invitedBy', { name: otherUserName })
      window.electronAPI.showSystemNotification(title, body)
    }

    if (chat.init && typeof chat.init === 'function') {
      await chat.init()
    }
  })
}
