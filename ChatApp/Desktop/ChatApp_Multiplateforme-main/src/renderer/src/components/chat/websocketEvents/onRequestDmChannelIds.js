/**
 * Listener WebSocket déclenché lorsque le serveur demande la liste des IDs de channels DM de l'utilisateur.
 * Récupère les channels DM depuis l'API et reconnecte le WebSocket avec ces IDs.
 * @param {import('../Chat.js').default} chat - Instance principale du chat (UI + état courant)
 * @param {import('../../../../main/services/ChatService.js').default} api - Service API / WebSocket
 */
export function onRequestDmChannelIds(chat, api) {
  api.websocketListener.on('request-dmChannelIds', async () => {
    const result = await api.getChannels()
    const channels = result.data?.data?.data || []
    const dmChannels = channels.filter(
      (channel) =>
        channel.type === 'dm' &&
        Array.isArray(channel.members) &&
        channel.members.some((m) => m.id === chat.currentUser.id)
    )
    const dmChannelIds = dmChannels.map((c) => c.id)
    const token = api.api.token
    const defaultChannelId = channels.length > 0 ? channels[0].id : null
    await api.connectWebSocketListener(token, defaultChannelId, dmChannelIds)
  })
}
