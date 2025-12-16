import API from '../api.js'
import WebSocketListener from './WebSocketListener.js'
import { MESSAGE_MAX_LENGTH } from './../../renderer/src/constants.js'

class ChatService {
  constructor() {
    this.api = new API()
    this.websocketListener = new WebSocketListener()
    this.currentUser = null
    this.isWebSocketConnected = false
    this.eventHandlers = new Map()

    // État pour les utilisateurs en ligne (global WebSocket)
    this.onlineUsers = new Map() // userId -> {userId, username, timestamp}

    this._pendingStorageKey = 'chat_pending_messages'
    this.pendingMessages = []
    this._pendingFlushIntervalMs = 5000
    this._pendingFlushTimer = null

    this._loadPendingMessagesFromStorage()
    if (this.pendingMessages.length > 0) {
      this._startPendingFlush()
    }

    this.setupWebSocketEvents()
  }

  /**
   * Configuration des événements WebSocket
   */
  setupWebSocketEvents() {
    // Relayer tous les événements WebSocket vers les composants
    this.websocketListener.on('new_channel_message', (data) => {
      this.emit('new_channel_message', data)
    })

    this.websocketListener.on('new_dm_message', (data) => {
      this.emit('new_dm_message', data)
    })

    this.websocketListener.on('user_typing', (data) => {
      this.emit('user_typing', data)
    })

    this.websocketListener.on('system_notification', (data) => {
      this.emit('system_notification', data)
    })

    this.websocketListener.on('joined_channel', (data) => {
      this.emit('joined_channel', data)
    })

    this.websocketListener.on('left_channel', (data) => {
      this.emit('left_channel', data)
    })

    this.websocketListener.on('user_connected', (data) => {
      this.onlineUsers.set(data.userId, {
        userId: data.userId,
        username: data.username,
        timestamp: data.timestamp
      })
      this.emit('user_connected', data)
      this.emit('presence_updated') // Événement générique pour rafraîchir l'UI
    })

    this.websocketListener.on('user_disconnected', (data) => {
      this.onlineUsers.delete(data.userId)
      this.emit('user_disconnected', data)
      this.emit('presence_updated')
    })

    this.websocketListener.on('channel_online_users', (data) => {
      // Mettre à jour onlineUsers avec les infos complètes
      data.users.forEach((user) => {
        this.onlineUsers.set(user.userId, {
          userId: user.userId,
          username: user.username,
          timestamp: data.timestamp
        })
      })

      this.emit('channel_online_users', data)
      this.emit('presence_updated')
    })

    // Gestion des connexions/déconnexions WebSocket
    this.websocketListener.on('disconnected', () => {
      this.isWebSocketConnected = false
      this.onlineUsers.clear()
      this.emit('websocket_disconnected')
    })

    this.websocketListener.on('authenticated', () => {
      this.isWebSocketConnected = true
      this.emit('websocket_connected')
      this._startPendingFlush()
    })

    // Charger la liste initiale des utilisateurs en ligne après authentification
    this.websocketListener.on('initial_online_users', (data) => {
      // Remplir onlineUsers avec tous les users déjà connectés
      data.users.forEach((user) => {
        this.onlineUsers.set(user.userId, {
          userId: user.userId,
          username: user.username,
          timestamp: data.timestamp
        })
      })

      this.emit('initial_online_users', data)
      this.emit('presence_updated')
    })

    this.websocketListener.on('reconnect_failed', () => {
      console.warn('Impossible de reconnecter WebSocket - mode API REST uniquement')
      this.emit('websocket_failed')
    })
  }

  /**
   * Vérifier si un utilisateur est en ligne (connecté au WebSocket)
   */
  isUserOnline(userId) {
    return this.onlineUsers.has(userId)
  }

  /**
   * Obtenir tous les utilisateurs en ligne (connectés au WebSocket)
   * Note: Le paramètre channelId est gardé pour compatibilité mais n'est pas utilisé
   * UserSideBarFiller filtrera pour ne garder que les membres du channel
   */
  getChannelOnlineUsers() {
    // Retourner tous les utilisateurs connectés au WebSocket
    return Array.from(this.onlineUsers.values())
  }

  /**
   * Obtenir tous les utilisateurs en ligne
   */
  getAllOnlineUsers() {
    return Array.from(this.onlineUsers.values())
  }

  // ===== MÉTHODES D'AUTHENTIFICATION =====

  /**
   * Connexion utilisateur
   */
  async login(credentials) {
    try {
      const result = await this.api.login(credentials)

      if (result.success && result.data.data) {
        this.currentUser = result.data.data.user

        // Tenter de se connecter au WebSocket pour écouter
        await this.connectWebSocketListener(result.data.data.token)
      }

      return result
    } catch (error) {
      console.error('Erreur login:', error)
      throw error
    }
  }

  /**
   * Inscription utilisateur
   */
  async register(userData) {
    try {
      const result = await this.api.register(userData)

      if (result.success && result.data.data) {
        this.currentUser = result.data.data.user
        await this.connectWebSocketListener(result.data.data.token)
      }

      return result
    } catch (error) {
      console.error('Erreur register:', error)
      throw error
    }
  }

  /**
   * Déconnexion
   */
  async logout() {
    try {
      // Déconnecter WebSocket d'abord
      this.websocketListener.disconnect()
      this.isWebSocketConnected = false
      this.onlineUsers.clear()

      // Puis déconnecter l'API
      const result = await this.api.logout()
      this.currentUser = null

      return result
    } catch (error) {
      console.error('Erreur logout:', error)
      throw error
    }
  }

  /**
   * Vérifier utilisateur actuel
   */
  async me() {
    try {
      const result = await this.api.me()

      if (result.success && result.data.data) {
        this.currentUser = result.data.data

        // Se connecter au WebSocket si pas encore fait
        if (!this.isWebSocketConnected && this.api.token) {
          await this.connectWebSocketListener(this.api.token)
        }
      }

      return result
    } catch (error) {
      console.error('Erreur me:', error)
      throw error
    }
  }

  // ===== MÉTHODES CHANNELS (délégation pure à votre API) =====

  async getChannels() {
    return this.api.getChannels()
  }

  async getPublicChannels() {
    return this.api.getPublicChannels()
  }

  async createChannel(channelData) {
    return this.api.createChannel(channelData)
  }

  async getChannel(channelId) {
    return this.api.getChannel(channelId)
  }

  async updateChannel(channelId, channelData) {
    return this.api.updateChannel(channelId, channelData)
  }

  async deleteChannel(channelId) {
    return this.api.deleteChannel(channelId)
  }

  async joinChannel(channelId, userId) {
    return this.api.joinChannel(channelId, userId)
  }

  async leaveChannel(channelId, userId) {
    return this.api.leaveChannel(channelId, userId)
  }

  async isMemberOfChannel(channelId) {
    return this.api.isMemberOfChannel(channelId)
  }

  // ===== MÉTHODES MESSAGES (tout via API Laravel) =====

  async getMessages(channelId) {
    return this.api.getMessages(channelId)
  }

  async getEncryptedMessages(channelId, options = {}) {
    return this.api.getEncryptedMessages(channelId, options)
  }

  async sendEncryptedMessage(encryptedMessageData) {
    return this.api.sendEncryptedMessage(encryptedMessageData)
  }

  /**
   * Envoyer un message vocal
   * @param {string|number} channelId - ID du channel
   * @param {Blob} audioBlob - Fichier audio
   * @param {number} duration - Durée en secondes
   * @param {string} mimeType - Type MIME du fichier audio
   * @returns {Promise<any>}
   */
  async sendVoiceMessage(channelId, audioBlob, duration, mimeType = 'audio/webm') {
    try {
      const resp = await this.api.sendVoiceMessage(channelId, audioBlob, duration, mimeType)
      if (resp && resp.success) {
        this.emit('message_sent', {
          channelId,
          messageData: { type: 'voice', duration },
          serverResponse: resp
        })
        return resp
      }

      return resp
    } catch (error) {
      console.error('[ChatService] Erreur lors de l\'envoi du message vocal:', error)
      return {
        success: false,
        status: 500,
        data: {
          message: 'Erreur lors de l\'envoi du message vocal',
          error: 'VOICE_MESSAGE_SEND_FAILED'
        }
      }
    }
  }

  /**
   * Envoyer un fichier en pièce jointe
   * @param {string|number} channelId - ID du channel
   * @param {File} file - Fichier à envoyer
   * @returns {Promise<any>}
   */
  async sendFileAttachment(channelId, file) {
    try {
      const resp = await this.api.sendFileAttachment(channelId, file)
      if (resp && resp.success) {
        this.emit('message_sent', {
          channelId,
          messageData: { type: 'file', fileName: file.name },
          serverResponse: resp
        })
        return resp
      }

      return resp
    } catch (error) {
      console.error("[ChatService] Erreur lors de l'envoi du fichier:", error)
      return {
        success: false,
        status: 500,
        data: {
          message: "Erreur lors de l'envoi du fichier",
          error: "FILE_ATTACHMENT_SEND_FAILED"
        }
      }
    }
  }

  /**
   * Envoyer un message vocal
   * @param {string|number} channelId - ID du channel
   * @param {Blob} audioBlob - Fichier audio
   * @param {number} duration - Durée en secondes
   * @param {string} mimeType - Type MIME du fichier audio
   * @returns {Promise<any>}
   */
  async sendVoiceMessage(channelId, audioBlob, duration, mimeType = 'audio/webm') {
    try {
      const resp = await this.api.sendVoiceMessage(channelId, audioBlob, duration, mimeType)
      if (resp && resp.success) {
        this.emit('message_sent', {
          channelId,
          messageData: { type: 'voice', duration },
          serverResponse: resp
        })
        return resp
      }

      return resp
    } catch (error) {
      console.error("[ChatService] Erreur lors de l'envoi du message vocal:", error)
      return {
        success: false,
        status: 500,
        data: {
          message: "Erreur lors de l'envoi du message vocal",
          error: "VOICE_MESSAGE_SEND_FAILED"
        }
      }
    }
  }

  async sendMessage(channelId, messageData) {
    if (messageData.content && messageData.content.length > MESSAGE_MAX_LENGTH) {
      return {
        success: false,
        status: 400,
        data: {
          message: `Le message ne peut pas dépasser ${MESSAGE_MAX_LENGTH} caractères.`,
          error: 'MESSAGE_TOO_LONG'
        }
      }
    }

    try {
      const resp = await this.api.sendMessage(channelId, messageData)
      if (resp && resp.success) {
        this.emit('message_sent', { channelId, messageData, serverResponse: resp })
        return resp
      }

      if (resp && resp.status === 429) {
        return {
          success: false,
          queued: false,
          status: resp.status,
          data: resp.data || { message: 'Rate limited' }
        }
      }

      // Prevent enqueue for 422 errors (unprocessable content)
      if (resp && resp.status === 422) {
        return {
          success: false,
          queued: false,
          status: 422,
          data: resp.data || { message: 'Message invalide' }
        }
      }

      const queued = this.enqueuePendingMessage(channelId, messageData)
      return {
        success: false,
        queued: true,
        status: resp?.status || 0,
        data: resp?.data || { message: 'Message queued for retry' },
        pendingId: queued.id
      }
    } catch (error) {
      // If the caught error explicitly indicates rate limiting, do not enqueue
      const status = error?.status || error?.response?.status
      if (status === 429) {
        return {
          success: false,
          queued: false,
          status: 429,
          data: { message: 'Rate limited' }
        }
      }
      if (status === 422) {
        return {
          success: false,
          queued: false,
          status: 422,
          data: error?.response?.data || { message: 'Message invalide' }
        }
      }
      const queued = this.enqueuePendingMessage(channelId, messageData)
      return {
        success: false,
        queued: true,
        status: 0,
        data: { message: error.message },
        pendingId: queued.id
      }
    }
  }

  getMessageMaxLength() {
    return MESSAGE_MAX_LENGTH
  }

  async getMessage(channelId, messageId) {
    return this.api.getMessage(channelId, messageId)
  }

  async deleteMessage(messageId) {
    return this.api.deleteMessage(messageId)
  }

  // ===== MÉTHODES DM (tout via API Laravel) =====

  async getDMs() {
    return this.api.getDMs()
  }

  async createDM(dmData) {
    return this.api.createDM(dmData)
  }

  async getDM(dmId) {
    return this.api.getDM(dmId)
  }

  async getDMMessages(dmId) {
    return this.api.getDMMessages(dmId)
  }

  async getAvailableUsersForDM() {
    return this.api.getAvailableUsersForDM()
  }

  async sendDMMessage(dmId, messageData) {
    // Validation côté client avant l'envoi
    if (messageData.content && messageData.content.length > MESSAGE_MAX_LENGTH) {
      return {
        success: false,
        status: 400,
        data: {
          message: `Le message ne peut pas dépasser ${MESSAGE_MAX_LENGTH} caractères.`,
          error: 'MESSAGE_TOO_LONG'
        }
      }
    }

    return this.api.sendDMMessage(dmId, messageData)
  }

  // ===== MÉTHODES USER (tout via API Laravel) =====

  async getUser(userId) {
    return this.api.getUser(userId)
  }

  async updateUser(userId, userData) {
    return this.api.updateUser(userId, userData)
  }

  async getMyChannels() {
    return this.api.getMyChannels()
  }

  async getAllUsers() {
    return this.api.getAllUsers()
  }

  async getAvailableUsersForInvite(channelId) {
    return this.api.getAvailableUsersForInvite(channelId)
  }

  async deleteUser(userId) {
    return this.api.deleteUser(userId)
  }

  // ===== GESTION WEBSOCKET =====

  async connectWebSocketListener(token, channel, dmChannelIds) {
    if (!this.currentUser || !token) {
      console.warn("Pas d'utilisateur ou token pour WebSocket")
      return false
    }

    try {
      await this.websocketListener.connect(
        token,
        this.currentUser.id,
        this.currentUser.username || this.currentUser.name,
        channel,
        dmChannelIds
      )

      this.isWebSocketConnected = true
      return true
    } catch {
      this.isWebSocketConnected = false
      return false
    }
  }

  async reconnectWebSocket() {
    if (!this.api.token || !this.currentUser) {
      console.warn('Pas de token/utilisateur pour reconnexion WebSocket')
      return false
    }

    try {
      await this.websocketListener.forceReconnect(
        this.api.token,
        this.currentUser.id,
        this.currentUser.username || this.currentUser.name
      )
      return true
    } catch (error) {
      console.error('Erreur reconnexion WebSocket:', error)
      return false
    }
  }

  getConnectionStatus() {
    return {
      api: {
        connected: !!this.api.token,
        baseUrl: this.api.baseUrl,
        token: !!this.api.token
      },
      websocket: {
        enabled: this.isWebSocketConnected,
        ...this.websocketListener.getStatus()
      },
      user: this.currentUser
        ? {
            id: this.currentUser.id,
            name: this.currentUser.name,
            username: this.currentUser.username
          }
        : null,
      presence: {
        totalOnline: this.onlineUsers.size
      }
    }
  }

  // ===== MÉTHODES INVITATIONS =====

  async getMyInvitations() {
    return this.api.getMyInvitations()
  }

  async getInvitationsCount() {
    return this.api.getInvitationsCount()
  }

  async getInvitation(invitationId) {
    return this.api.getInvitation(invitationId)
  }

  async acceptInvitation(invitationId) {
    return this.api.acceptInvitation(invitationId)
  }

  async rejectInvitation(invitationId) {
    return this.api.rejectInvitation(invitationId)
  }

  async inviteUserToChannel(channelId, userId, message = null) {
    return this.api.inviteUserToChannel(channelId, userId, message)
  }

  _savePendingMessagesToStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this._pendingStorageKey, JSON.stringify(this.pendingMessages))
    }
  }

  _loadPendingMessagesFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        // First try new key
        let raw = localStorage.getItem(this._pendingStorageKey)
        // If nothing found, try migrating old key
        if (!raw) {
          const oldKey = 'chat_pending_messages_v1'
          const oldRaw = localStorage.getItem(oldKey)
          if (oldRaw) {
            // migrate to new key
            localStorage.setItem(this._pendingStorageKey, oldRaw)
            localStorage.removeItem(oldKey)
            raw = oldRaw
          }
        }

        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            this.pendingMessages = parsed.map((p) => ({
              id: p.id,
              channelId: p.channelId,
              messageData: p.messageData,
              createdAt: p.createdAt || Date.now(),
              attempts: p.attempts || 0,
              nextAttempt: p.nextAttempt || 0
            }))
          }
        }
      }
    } catch {
      this.pendingMessages = []
    }
  }

  _startPendingFlush() {
    if (this._pendingFlushTimer) return
    this._pendingFlushTimer = setInterval(
      () => this._flushPendingMessages(),
      this._pendingFlushIntervalMs
    )

    setTimeout(() => this._flushPendingMessages(), 0)
  }

  _stopPendingFlush() {
    if (this._pendingFlushTimer) {
      clearInterval(this._pendingFlushTimer)
      this._pendingFlushTimer = null
    }
  }

  async _flushPendingMessages() {
    if (!this.pendingMessages || this.pendingMessages.length === 0) {
      this._stopPendingFlush()
      return
    }

    const pendingCopy = [...this.pendingMessages]
    for (const pending of pendingCopy) {
      if (pending.nextAttempt && Date.now() < pending.nextAttempt) {
        continue
      }

      const resp = await this.api.sendMessage(pending.channelId, pending.messageData)
      if (resp && resp.success) {
        this.pendingMessages = this.pendingMessages.filter((p) => p.id !== pending.id)
        this._savePendingMessagesToStorage()

        this.emit('pending_message_sent', {
          id: pending.id,
          channelId: pending.channelId,
          messageData: pending.messageData,
          serverResponse: resp
        })
      } else {
        if (resp && resp.status === 429) {
          pending.nextAttempt = Date.now() + 60 * 1000
        } else {
          pending.attempts = (pending.attempts || 0) + 1
        }
      }
    }
    this._savePendingMessagesToStorage()
  }

  enqueuePendingMessage(channelId, messageData) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const pending = {
      id,
      channelId,
      messageData,
      createdAt: Date.now(),
      attempts: 0,
      nextAttempt: 0
    }
    this.pendingMessages.push(pending)
    this._savePendingMessagesToStorage()
    this._startPendingFlush()
    this.emit('message_queued', pending)
    return pending
  }

  // ===== SYSTÈME D'ÉVÉNEMENTS =====

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event).push(handler)
  }

  off(event, handler) {
    if (!this.eventHandlers.has(event)) return

    const handlers = this.eventHandlers.get(event)
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }

  emit(event, data) {
    if (!this.eventHandlers.has(event)) return

    this.eventHandlers.get(event).forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Erreur gestionnaire événement ${event}:`, error)
      }
    })
  }

  // ===== MÉTHODES UTILITAIRES =====

  getCurrentUser() {
    return this.currentUser
  }

  isAuthenticated() {
    return !!this.currentUser && !!this.api.token
  }

  isWebSocketEnabled() {
    return this.isWebSocketConnected
  }

  isInFallbackMode() {
    return this.isAuthenticated() && !this.isWebSocketConnected
  }

  async refreshData() {
    if (this.isAuthenticated()) {
      try {
        await this.me()
        return true
      } catch (error) {
        console.error('Erreur refresh données:', error)
        return false
      }
    }
    return false
  }

  destroy() {
    this.websocketListener.disconnect()
    this.eventHandlers.clear()
    this.currentUser = null
    this.isWebSocketConnected = false
    this.onlineUsers.clear()
  }
}

// Export pour utilisation dans Electron
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatService
} else {
  window.ChatService = ChatService
}

export default ChatService
