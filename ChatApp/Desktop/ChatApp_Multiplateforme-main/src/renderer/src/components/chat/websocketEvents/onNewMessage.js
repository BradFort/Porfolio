/**
 * Listener WebSocket pour les nouveaux messages.
 * Si le message concerne le salon courant, il est ajouté à la liste et l'UI est rafraîchie.
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
        // Ignore malformed messages
      }
    }
  })
}
