/**
 * Écoute les mises à jour de la liste des utilisateurs (Redis) pour un salon.
 * Met à jour l'UI de la liste des membres et/ou la liste des salons.
 * @param {import('../Chat.js').default} chat - Instance principale du chat (UI + état courant)
 * @param {import('../../../../main/services/ChatService.js').default} api - Service API / WebSocket
 */
export function onRedisUserlistUpdate(chat, api) {
  api.websocketListener.on('redis_userlist_update', async (data) => {
    const { channelId } = data
    const confirmed = await api.isMemberOfChannel(channelId)
    chat.updateChannelUi(channelId, confirmed)
    if (String(channelId) === String(chat.currentChannelId)) {
      chat.updateUserSidebar(channelId)
    } else {
      const channelsResp = await api.getChannels()
      chat.channels = Array.isArray(channelsResp.data?.data?.data)
        ? channelsResp.data.data.data
        : []
      chat.refreshChannelListUi()
    }
  })
}

/**
 * Écoute les nouveaux messages pour le salon courant et met à jour la liste locale.
 * @param {import('../Chat.js').default} chat - Instance principale du chat (UI + état courant)
 * @param {import('../../../../main/services/ChatService.js').default} api - Service API / WebSocket
 */
export function onNewMessage(chat, api) {
  api.websocketListener.on('new_message', (data) => {
    if (String(data.channelId) === String(chat.currentChannelId)) {
      try {
        const message = JSON.parse(data.message)
        chat.messages.push(message)
        chat.updateMessagesUi()
      } catch {
        // Ignore JSON parse errors
      }
    }
  })
}
