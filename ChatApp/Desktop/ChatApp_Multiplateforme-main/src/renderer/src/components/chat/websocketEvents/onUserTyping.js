/**
 * Listener WebSocket pour l'état "en train d'écrire" des utilisateurs.
 * Met à jour la liste des utilisateurs tapant par salon et rafraîchit l'indicateur dactylographie dans l'UI.
 * @param {import('../Chat.js').default} chat - Instance principale du chat (UI + état courant)
 * @param {import('../../../../main/services/ChatService.js').default} api - Service API / WebSocket
 */
export function onUserTyping(chat, api) {
  const typingUsers = new Map() // channelId -> Set of usernames
  const typingTimeouts = new Map() // channelId-userId -> timeout

  api.websocketListener.on('user_typing_start', (data) => {
    const { channelId, userId, username } = data

    if (String(userId) === String(chat.currentUser.id)) {
      return
    }

    const channelIdStr = String(channelId)
    if (!typingUsers.has(channelIdStr)) {
      typingUsers.set(channelIdStr, new Set())
    }
    typingUsers.get(channelIdStr).add(username)

    const timeoutKey = `${channelIdStr}-${userId}`
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey))
    }

    const timeout = setTimeout(() => {
      if (typingUsers.has(channelIdStr)) {
        typingUsers.get(channelIdStr).delete(username)
        updateTypingIndicator(channelIdStr)
      }
      typingTimeouts.delete(timeoutKey)
    }, 3000)

    typingTimeouts.set(timeoutKey, timeout)

    if (String(chat.currentChannelId) === channelIdStr) {
      updateTypingIndicator(channelIdStr)
    }
  })

  api.websocketListener.on('user_typing_stop', (data) => {
    const { channelId, userId, username } = data
    const channelIdStr = String(channelId)

    if (typingUsers.has(channelIdStr)) {
      typingUsers.get(channelIdStr).delete(username)
    }

    const timeoutKey = `${channelIdStr}-${userId}`
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey))
      typingTimeouts.delete(timeoutKey)
    }

    if (String(chat.currentChannelId) === channelIdStr) {
      updateTypingIndicator(channelIdStr)
    }
  })

  // Update the typing indicator UI
  async function updateTypingIndicator(channelId) {
    const typingIndicator = document.getElementById('typing-indicator')
    if (!typingIndicator) {
      console.warn('[onUserTyping] Typing indicator element not found')
      return
    }

    const channelIdStr = String(channelId)
    const users = typingUsers.get(channelIdStr)

    if (!users || users.size === 0) {
      typingIndicator.textContent = ''
      return
    }

    const { t, languageManager } = await import('../../../lang/LanguageManager.js')
    try {
      await languageManager.init()
    } catch {
      /* empty */
    }

    const userArray = Array.from(users)
    let text

    if (userArray.length === 1) {
      text = t('chat.typing.one', { name: userArray[0] })
    } else if (userArray.length === 2) {
      text = t('chat.typing.two', { name1: userArray[0], name2: userArray[1] })
    } else {
      text = t('chat.typing.many', {
        name1: userArray[0],
        name2: userArray[1],
        others: userArray.length - 2
      })
    }

    typingIndicator.textContent = text
  }

  const originalSelectChannel = chat.selectChannel
  if (originalSelectChannel) {
    chat.selectChannel = async function (channel) {
      const typingIndicator = document.getElementById('typing-indicator')
      if (typingIndicator) {
        typingIndicator.textContent = ''
      }

      const prevChannelId = String(this.currentChannelId)
      if (typingUsers.has(prevChannelId)) {
        typingUsers.get(prevChannelId).clear()
      }

      return originalSelectChannel.call(this, channel)
    }
  }

  try {
    window.__updateTypingIndicator = () => {
      if (!chat.currentChannelId) return
      updateTypingIndicator(String(chat.currentChannelId))
    }
  } catch {
    /* empty */
  }
}
