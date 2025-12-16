// api.js - Classe API pour la gestion des appels à l'API REST du chat
// Ce fichier centralise toutes les méthodes d'accès aux endpoints du backend
// et gère l'authentification, la gestion des erreurs, la journalisation Sentry, etc.

import { MESSAGE_MAX_LENGTH } from '../renderer/src/constants.js'

// Initialisation de Sentry pour la gestion des erreurs et logs
let Sentry = null
if (typeof window !== 'undefined' && window.Sentry) {
  Sentry = window.Sentry
}

const TOKEN_KEY = 'auth_token' // Clé de stockage du token dans localStorage

// Encodage du token en base64 pour le stockage local
function encodeToken(token) {
  const utf8Bytes = new TextEncoder().encode(token)
  let binary = ''
  utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

// Décodage du token depuis le stockage local
function decodeToken(encoded) {
  try {
    const binary = atob(encoded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder().decode(bytes)
  } catch (error) {
    if (Sentry) {
      Sentry.captureException(error, {
        tags: {
          component: 'api',
          action: 'decode_token',
          platform: 'desktop'
        },
        level: 'warning'
      })
    }
    return null
  }
}

/**
 * Classe principale pour l'accès à l'API du backend.
 * Toutes les méthodes sont asynchrones et retournent des Promises.
 */
class API {
  /**
   * Vérifie si l'utilisateur courant est membre d'un channel (via /my-channels)
   * @param {string|number} channelId - ID du channel à vérifier
   * @returns {Promise<boolean>} - true si membre, false sinon
   */
  async isMemberOfChannel(channelId) {
    const resp = await this.getMyChannels()
    if (!resp.success || !Array.isArray(resp.data.data)) return false
    return resp.data.data.some((ch) => String(ch.id) === String(channelId))
  }

  /**
   * Constructeur : initialise l'URL de base et le token d'authentification
   */
  constructor() {
    this.baseUrl = this.getApiUrl()
    this.token = this.getStoredToken()

    if (Sentry) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: 'API client initialized',
        level: 'info',
        data: {
          baseUrl: this.baseUrl,
          hasToken: !!this.token
        }
      })
    }
  }

  /**
   * Retourne l'URL de base de l'API
   * @returns {string}
   */
  getApiUrl() {
    return 'https://www.chatapp-xp.fun/chatappAPI'
  }

  /**
   * Récupère le token stocké localement
   * @returns {string|null}
   */
  getStoredToken() {
    if (typeof localStorage !== 'undefined') {
      const encoded = localStorage.getItem(TOKEN_KEY)
      if (encoded) return decodeToken(encoded)
    }
    return null
  }

  /**
   * Sauvegarde le token dans localStorage
   * @param {string} token
   */
  saveToken(token) {
    this.token = token
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, encodeToken(token))
    }

    if (Sentry) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: 'Token saved',
        level: 'info'
      })
    }
  }

  /**
   * Supprime le token du stockage local
   */
  removeToken() {
    this.token = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
    }

    if (Sentry) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: 'Token removed',
        level: 'info'
      })
    }
  }

  /**
   * Effectue une requête HTTP vers l'API
   * @param {string} endpoint - Chemin de l'endpoint (ex: /login)
   * @param {Object} options - Options fetch (method, headers, body, ...)
   * @returns {Promise<Object>} - {success, status, data}
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const method = options.method || 'GET'

    // Préparation de la configuration de la requête
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    }

    if (Sentry) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: `API ${method} ${endpoint}`,
        level: 'info',
        data: {
          method: method,
          endpoint: endpoint,
          hasAuth: !!this.token
        }
      })
    }

    try {
      const response = await fetch(url, config)

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        if (Sentry) {
          Sentry.captureException(parseError, {
            tags: {
              component: 'api',
              action: 'parse_response',
              platform: 'desktop'
            },
            extra: {
              endpoint: endpoint,
              method: method,
              status: response.status,
              statusText: response.statusText
            },
            level: 'warning'
          })
        }

        data = { message: 'Erreur de parsing de la réponse' }
      }

      // Gestion des erreurs HTTP
      if (!response.ok) {
        const errorLevel = response.status >= 500 ? 'error' : 'warning'

        if (Sentry) {
          // Ne pas capturer 429 comme erreur (géré différemment)
          if (response.status !== 429) {
            Sentry.captureMessage(`API Error ${response.status}: ${method} ${endpoint}`, {
              level: errorLevel,
              tags: {
                component: 'api',
                action: 'http_error',
                platform: 'desktop',
                http_status: response.status.toString()
              },
              extra: {
                endpoint: endpoint,
                method: method,
                status: response.status,
                statusText: response.statusText,
                response_data: data,
                hasAuth: !!this.token
              }
            })
          }
        }
      }

      // Gestion centralisée des erreurs 429 (rate limit)
      if (response.status === 429) {
        const message =
          (data && (data.message || data.error)) ||
          'Trop de requêtes. Réessayez dans quelques instants.'

        if (Sentry) {
          Sentry.captureMessage('Rate limit exceeded', {
            level: 'warning',
            tags: {
              component: 'api',
              action: 'rate_limit',
              platform: 'desktop'
            },
            extra: {
              endpoint: endpoint,
              method: method,
              message: message
            }
          })
        }

        // Afficher une notification d'erreur si disponible
        try {
          if (typeof window !== 'undefined') {
            if (
              window.notificationManager &&
              typeof window.notificationManager.error === 'function'
            ) {
              window.notificationManager.error(message, 5000)
            } else if (
              window.notificationAPI &&
              typeof window.notificationAPI.showNotification === 'function'
            ) {
              window.notificationAPI.showNotification('error', message, 5000)
            } else if (
              window.electronAPI &&
              typeof window.electronAPI.showSystemNotification === 'function'
            ) {
              window.electronAPI.showSystemNotification('Erreur', message, 'error')
            }
          }
        } catch (e) {
          console.warn('[API] Notification 429 non affichée:', e)
        }
      }

      // Gestion des erreurs 401 (non autorisé)
      if (response.status === 401) {
        if (Sentry) {
          Sentry.captureMessage('Unauthorized API request', {
            level: 'warning',
            tags: {
              component: 'api',
              action: 'unauthorized',
              platform: 'desktop'
            },
            extra: {
              endpoint: endpoint,
              method: method,
              hasToken: !!this.token
            }
          })
        }
      }

      // Retourne le résultat de la requête
      return {
        success: response.ok,
        status: response.status,
        data: data
      }
    } catch (error) {
      console.error('[API] Fetch error:', error, 'URL:', url, 'Config:', config)

      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'fetch_error',
            platform: 'desktop'
          },
          extra: {
            endpoint: endpoint,
            method: method,
            url: url,
            hasAuth: !!this.token,
            error_message: error.message
          },
          level: 'error'
        })
      }

      return {
        success: false,
        status: 0,
        data: { message: error.message }
      }
    }
  }

  // ----- AUTH METHODS -----
  /**
   * Enregistre un nouvel utilisateur
   * @param userData - {username, email, password}
   * @returns {Promise<Object>} - Résultat de la requête de registration
   */
  async register(userData) {
    try {
      const result = await this.request('/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      if (result.success && result.data.data && result.data.data.token) {
        this.saveToken(result.data.data.token)

        if (Sentry) {
          Sentry.addBreadcrumb({
            category: 'auth',
            message: 'User registered successfully',
            level: 'info',
            data: {
              username: userData.username
            }
          })
        }
      } else {
        if (Sentry && !result.success) {
          Sentry.captureMessage('Registration failed', {
            level: 'warning',
            tags: {
              component: 'api',
              action: 'register',
              platform: 'desktop'
            },
            extra: {
              username: userData.username,
              status: result.status,
              error: result.data?.message
            }
          })
        }
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'register_error',
            platform: 'desktop'
          },
          extra: {
            username: userData.username
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Connecte un utilisateur avec ses identifiants
   * @param credentials - {username, password}
   * @returns {Promise<Object>} - Résultat de la requête de login
   */
  async login(credentials) {
    try {
      const result = await this.request('/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      })

      if (result.success && result.data.data && result.data.data.token) {
        this.saveToken(result.data.data.token)

        if (Sentry) {
          Sentry.addBreadcrumb({
            category: 'auth',
            message: 'User logged in successfully',
            level: 'info',
            data: {
              username: credentials.username
            }
          })

          if (result.data.data.user) {
            Sentry.setUser({
              id: result.data.data.user.id,
              username: result.data.data.user.name || credentials.username,
              email: result.data.data.user.email
            })
          }
        }
      } else {
        if (Sentry && !result.success) {
          Sentry.captureMessage('Login failed', {
            level: 'warning',
            tags: {
              component: 'api',
              action: 'login',
              platform: 'desktop'
            },
            extra: {
              username: credentials.username,
              status: result.status,
              error: result.data?.message
            }
          })
        }
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'login_error',
            platform: 'desktop'
          },
          extra: {
            username: credentials.username
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Déconnecte l'utilisateur courant
   * @returns {Promise<Object>} - Résultat de la requête de logout
   */
  async logout() {
    try {
      const result = await this.request('/logout', {
        method: 'POST'
      })

      this.removeToken()

      if (Sentry) {
        Sentry.addBreadcrumb({
          category: 'auth',
          message: 'User logged out',
          level: 'info'
        })

        Sentry.setUser(null)
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'logout_error',
            platform: 'desktop'
          },
          level: 'warning'
        })
      }

      // Déconnecter quand même localement
      this.removeToken()
      throw error
    }
  }

  /**
   * Récupère les informations de l'utilisateur courant
   * @returns {Promise<Object>} - Données de l'utilisateur
   */
  async me() {
    return this.request('/me')
  }

  // ----- CHANNELS METHODS -----
  /**
   * Récupère les channels dont l'utilisateur est membre
   * @returns {Promise<Object>} - Liste des channels
   */
  async getChannels() {
    return this.request('/channel')
  }

  /**
   * Récupère les channels dont l'utilisateur est membre
   * @returns {Promise<Object>} - Liste des channels
   */
  async getPublicChannels() {
    return this.request('/channel/public')
  }

  /**
   * Récupère les channels dont l'utilisateur est membre
   * @param channelData - {name, description, is_private}
   * @returns {Promise<Object>} - Résultat de la création du channel
   */
  async createChannel(channelData) {
    try {
      const result = await this.request('/channel', {
        method: 'POST',
        body: JSON.stringify(channelData)
      })

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'channel',
          message: 'Channel created',
          level: 'info',
          data: {
            channel_name: channelData.name,
            is_private: channelData.is_private
          }
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'create_channel',
            platform: 'desktop'
          },
          extra: {
            channel_name: channelData.name
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Récupère les informations d'un channel par son ID
   * @param channelId - ID du channel
   * @returns {Promise<Object>} - Données du channel
   */
  async getChannel(channelId) {
    return this.request(`/channel/${channelId}`)
  }

  /**
   * Met à jour les informations d'un channel
   * @param channelId - ID du channel
   * @param channelData - Données à mettre à jour
   * @returns {Promise<Object>} - Résultat de la mise à jour
   */
  async updateChannel(channelId, channelData) {
    return this.request(`/channel/${channelId}`, {
      method: 'PUT',
      body: JSON.stringify(channelData)
    })
  }

  /**
   * Supprime un channel par son ID
   * @param channelId - ID du channel
   * @returns {Promise<Object>} - Résultat de la suppression
   */
  async deleteChannel(channelId) {
    try {
      const result = await this.request(`/channel/${channelId}`, {
        method: 'DELETE'
      })

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'channel',
          message: 'Channel deleted',
          level: 'info',
          data: {
            channel_id: channelId
          }
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'delete_channel',
            platform: 'desktop'
          },
          extra: {
            channel_id: channelId
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Permet à un utilisateur de rejoindre un channel
   * @param channelId
   * @param userId
   * @returns {Promise<Object>} - Résultat de la requête
   */
  async joinChannel(channelId, userId) {
    try {
      const result = await this.request(`/channel/${channelId}/join`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      })

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'channel',
          message: 'Joined channel',
          level: 'info',
          data: {
            channel_id: channelId,
            user_id: userId
          }
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'join_channel',
            platform: 'desktop'
          },
          extra: {
            channel_id: channelId,
            user_id: userId
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Permet à un utilisateur de quitter un channel
   * @param channelId
   * @param userId
   * @returns {Promise<Object>} - Résultat de la requête
   */
  async leaveChannel(channelId, userId) {
    return this.request(`/channel/${channelId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
  }

  // ----- INVITATION METHODS -----
  /**
   * Récupère les invitations reçues par l'utilisateur courant
   * @returns {Promise<Object>} Résultat de l'appel à /invitations
   */
  async getMyInvitations() {
    return this.request('/invitations')
  }

  /**
   * Récupère le nombre d'invitations en attente pour l'utilisateur courant
   * @returns {Promise<Object>} Résultat de l'appel à /invitations/count
   */
  async getInvitationsCount() {
    return this.request('/invitations/count')
  }

  /**
   * Récupère une invitation spécifique
   * @param {string|number} invitationId ID de l'invitation
   * @returns {Promise<Object>} Détails de l'invitation
   */
  async getInvitation(invitationId) {
    return this.request(`/invitations/${invitationId}`)
  }

  /**
   * Accepte une invitation
   * @param {string|number} invitationId ID de l'invitation
   * @returns {Promise<Object>} Résultat de l'acceptation
   */
  async acceptInvitation(invitationId) {
    return this.request(`/invitations/${invitationId}/accept`, {
      method: 'POST'
    })
  }

  /**
   * Refuse une invitation
   * @param {string|number} invitationId ID de l'invitation
   * @returns {Promise<Object>} Résultat du refus
   */
  async rejectInvitation(invitationId) {
    return this.request(`/invitations/${invitationId}/reject`, {
      method: 'POST'
    })
  }

  /**
   * Invite un utilisateur dans un channel donné
   * @param {string|number} channelId ID du channel
   * @param {string|number} userId ID de l'utilisateur invité
   * @param {string|null} message Message optionnel joint à l'invitation
   * @returns {Promise<Object>} Résultat de la création de l'invitation
   */
  async inviteUserToChannel(channelId, userId, message = null) {
    return this.request(`/channel/${channelId}/invite`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        message: message
      })
    })
  }

  // ----- ENCRYPTED MESSAGES METHODS -----

  /**
   * Récupérer les messages chiffrés d'un channel
   * GET /encrypted-messages/channel/{channelId}
   * @param {string|number} channelId - ID du channel
   * @param {Object} options - Options de pagination (limit, before_id)
   * @returns {Promise<any>}
   */
  async getEncryptedMessages(channelId, options = {}) {
    const params = new URLSearchParams()

    if (options.limit) {
      params.append('limit', options.limit)
    }

    if (options.before_id) {
      params.append('before_id', options.before_id)
    }

    const queryString = params.toString()
    const endpoint = `/encrypted-messages/channel/${channelId}${queryString ? '?' + queryString : ''}`

    return this.request(endpoint)
  }

  /**
   * Envoyer un message chiffré
   * POST /encrypted-messages
   * @param {Object} encryptedMessageData - {channel_id, encrypted_content, iv, auth_tag}
   * @returns {Promise<any>}
   */
  async sendEncryptedMessage(encryptedMessageData) {
    return this.request('/encrypted-messages', {
      method: 'POST',
      body: JSON.stringify(encryptedMessageData)
    })
  }

  // ----- MESSAGES METHODS -----
  /**
   * Récupère les messages d'un channel
   * @param {string|number} channelId ID du channel
   * @returns {Promise<Object>} Liste des messages
   */
  async getMessages(channelId) {
    return this.request(`/channel/${channelId}/message`)
  }

  /**
   * Envoie un message texte dans un channel
   * Valide la longueur maximale du contenu avant l'envoi.
   * @param {string|number} channelId ID du channel
   * @param {{content?: string, [key: string]: any}} messageData Données du message
   * @returns {Promise<Object>} Résultat de l'envoi
   */
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
      const result = await this.request(`/channel/${channelId}/message`, {
        method: 'POST',
        body: JSON.stringify(messageData)
      })

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'message',
          message: 'Message sent',
          level: 'info',
          data: {
            channel_id: channelId,
            content_length: messageData.content?.length
          }
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'send_message',
            platform: 'desktop'
          },
          extra: {
            channel_id: channelId,
            content_length: messageData.content?.length
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Envoyer un message vocal
   * POST /channel/:channelId/message (avec FormData)
   * @param {string|number} channelId - ID du channel
   * @param {Blob} audioBlob - Fichier audio
   * @param {number} duration - Durée en secondes
   * @param {string} mimeType - Type MIME du fichier audio
   * @returns {Promise<any>}
   */
  async sendVoiceMessage(channelId, audioBlob, duration, mimeType = 'audio/webm') {
    const url = `${this.baseUrl}/channel/${channelId}/message`

    // Créer FormData
    const formData = new FormData()
    formData.append('type', 'voice')
    formData.append('duration', duration.toString())

    // Déterminer l'extension du fichier basée sur le MIME type
    let extension = 'webm'
    if (mimeType.includes('ogg')) extension = 'ogg'
    else if (mimeType.includes('mp3')) extension = 'mp3'
    else if (mimeType.includes('m4a')) extension = 'm4a'
    else if (mimeType.includes('wav')) extension = 'wav'

    // Ajouter le fichier audio
    formData.append('voice_message', audioBlob, `voice-${Date.now()}.${extension}`)

    // Log pour debug
    console.log('[API] Sending voice message:', {
      channelId,
      duration,
      mimeType,
      blobSize: audioBlob.size,
      extension
    })

    if (Sentry) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: `Sending voice message to channel ${channelId}`,
        level: 'info',
        data: {
          method: 'POST',
          endpoint: `/channel/${channelId}/message`,
          duration,
          mimeType,
          size: audioBlob.size
        }
      })
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` })
          // Ne pas définir Content-Type, le navigateur le fera automatiquement avec boundary
        },
        body: formData
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        if (Sentry) {
          Sentry.captureException(parseError, {
            tags: {
              component: 'api',
              action: 'parse_voice_response',
              platform: 'desktop'
            },
            extra: {
              status: response.status,
              statusText: response.statusText
            },
            level: 'error'
          })
        }
        return {
          success: false,
          status: response.status,
          data: null
        }
      }

      const result = {
        success: response.ok,
        status: response.status,
        data: data
      }

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'message',
          message: 'Voice message sent',
          level: 'info',
          data: {
            channel_id: channelId,
            duration,
            size: audioBlob.size
          }
        })
      } else if (!result.success) {
        // Log l'erreur pour debug
        console.error('[API] Voice message error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'send_voice_message',
            platform: 'desktop'
          },
          extra: {
            channel_id: channelId,
            duration,
            size: audioBlob.size
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Envoyer un fichier en pièce jointe
   * POST /channel/:channelId/message (avec FormData)
   * @param {string|number} channelId - ID du channel
   * @param {File} file - Fichier à envoyer
   * @returns {Promise<any>}
   */
  async sendFileAttachment(channelId, file) {
    const url = `${this.baseUrl}/channel/${channelId}/message`

    const formData = new FormData()
    formData.append('type', 'attachment')
    formData.append('attachment', file, file.name)

    if (Sentry) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: `Sending file attachment to channel ${channelId}`,
        level: 'info',
        data: {
          method: 'POST',
          endpoint: `/channel/${channelId}/message`,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      })
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` })
          // Ne pas définir Content-Type, le navigateur le fera automatiquement
        },
        body: formData
      })

      const data = await response.json().catch(() => null)

      return {
        success: response.ok,
        status: response.status,
        data
      }
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: { component: 'api', action: 'send_file_attachment', platform: 'desktop' },
          extra: { channel_id: channelId, fileName: file.name, size: file.size },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Récupère un message spécifique dans un channel
   * @param {string|number} channelId ID du channel
   * @param {string|number} messageId ID du message
   * @returns {Promise<Object>} Détails du message
   */
  async getMessage(channelId, messageId) {
    return this.request(`/channel/${channelId}/message/${messageId}`)
  }

  /**
   * Supprime un message par son ID global
   * @param {string|number} messageId ID du message
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteMessage(messageId) {
    return this.request(`/message/${messageId}`, {
      method: 'DELETE'
    })
  }

  // ----- DM METHODS -----
  /**
   * Récupère la liste des conversations privées (DM) de l'utilisateur
   * @returns {Promise<Object>} Liste des DMs
   */
  async getDMs() {
    return this.request('/dm')
  }

  /**
   * Crée une nouvelle conversation privée (DM)
   * @param {Object} dmData Données du DM (ex: { user_id })
   * @returns {Promise<Object>} Résultat de la création
   */
  async createDM(dmData) {
    try {
      const result = await this.request('/dm', {
        method: 'POST',
        body: JSON.stringify(dmData)
      })

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'dm',
          message: 'DM created',
          level: 'info'
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'create_dm',
            platform: 'desktop'
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Récupère une conversation privée par son ID
   * @param {string|number} dmId ID du DM
   * @returns {Promise<Object>} Détails du DM
   */
  async getDM(dmId) {
    return this.request(`/dm/${dmId}`)
  }

  /**
   * Récupère les messages d'un DM
   * @param {string|number} dmId ID du DM
   * @returns {Promise<Object>} Liste des messages
   */
  async getDMMessages(dmId) {
    return this.request(`/dm/${dmId}/message`)
  }

  /**
   * Envoie un message dans un DM (avec validation de longueur)
   * @param {string|number} dmId ID du DM
   * @param {{content?: string, [key: string]: any}} messageData Données du message
   * @returns {Promise<Object>} Résultat de l'envoi
   */
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
    try {
      const result = await this.request(`/dm/${dmId}/message`, {
        method: 'POST',
        body: JSON.stringify(messageData)
      })

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'dm',
          message: 'DM message sent',
          level: 'info',
          data: {
            dm_id: dmId,
            content_length: messageData.content?.length
          }
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'send_dm_message',
            platform: 'desktop'
          },
          extra: {
            dm_id: dmId,
            content_length: messageData.content?.length
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  // ----- USER METHODS -----
  /**
   * Récupère les informations d'un utilisateur
   * @param {string|number} userId ID de l'utilisateur
   * @returns {Promise<Object>} Données de l'utilisateur
   */
  async getUser(userId) {
    return this.request(`/user/${userId}`)
  }

  /**
   * Met à jour les informations d'un utilisateur
   * @param {string|number} userId ID de l'utilisateur
   * @param {Object} userData Données à mettre à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateUser(userId, userData) {
    return this.request(`/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
  }

  /**
   * Récupère les channels auxquels l'utilisateur courant participe
   * @returns {Promise<Object>} Liste des channels
   */
  async getMyChannels() {
    return this.request('/my-channels')
  }

  /**
   * Récupère tous les utilisateurs
   * @returns {Promise<Object>} Liste des utilisateurs
   */
  async getAllUsers() {
    return this.request('/user')
  }

  /**
   * Récupère les utilisateurs pouvant être invités dans un channel
   * @param {string|number} channelId ID du channel
   * @returns {Promise<Object>} Liste des utilisateurs disponibles
   */
  async getAvailableUsersForInvite(channelId) {
    return this.request(`/users/available-for-invite/${channelId}`)
  }

  /**
   * Récupère les utilisateurs disponibles pour créer un DM
   * @returns {Promise<Object>} Liste des utilisateurs disponibles
   */
  async getAvailableUsersForDM() {
    return this.request('/users/available-for-dm')
  }

  // ===== NOTIFICATION / LANGUAGE HELPERS =====
  /**
   * Active/désactive des types de notifications pour un utilisateur
   * @param {string|number} userId ID de l'utilisateur
   * @param {number[]} [notificationTypeIds] IDs des types de notification à activer
   * @returns {Promise<Object>} Résultat de la modification
   */
  async toggleUserNotification(userId, notificationTypeIds = []) {
    const body = {
      notificationTypeIds: Array.isArray(notificationTypeIds) ? notificationTypeIds : []
    }
    return this.request(`/user/${userId}/notifs/toggle`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  /**
   * Récupère les types de notifications actifs pour un utilisateur
   * @param {string|number} userId ID de l'utilisateur
   * @returns {Promise<Object>} Types de notifications
   */
  async getUserNotificationTypes(userId) {
    return this.request(`/user/${userId}/notifs`)
  }

  /**
   * Met à jour la langue préférée d'un utilisateur
   * @param {string|number} userId ID de l'utilisateur
   * @param {string} lang Code de langue (ex: 'fr', 'en')
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateUserLang(userId, lang) {
    return this.request(`/user/${userId}/lang/${lang}`, { method: 'PUT' })
  }

  /**
   * Récupère la liste des types de notifications disponibles
   * @returns {Promise<Object>} Types de notifications disponibles
   */
  async getNotificationTypes() {
    return this.request('/notification-types')
  }

  /**
   * Supprime un utilisateur
   * @param {string|number} userId ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteUser(userId) {
    return this.request(`/user/${userId}`, {
      method: 'DELETE'
    })
  }

  // ===== MFA METHODS =====
  /**
   * Active ou désactive la double authentification (MFA) pour l'utilisateur courant
   * @param {boolean} mfaEnabled true pour activer, false pour désactiver
   * @param {string|null} [password] Mot de passe éventuellement requis par le backend
   * @returns {Promise<Object>} Résultat de la modification
   */
  async toggleMFA(mfaEnabled, password = null) {
    const body = {
      mfa_enabled: mfaEnabled
    }
    if (password) {
      body.password = password
    }
    return this.request('/mfa/toggle', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  /**
   * Vérifie un code MFA envoyé à l'utilisateur
   * @param {string} email Email de l'utilisateur
   * @param {string} code Code MFA saisi
   * @param {string} tempToken Token temporaire reçu lors du login
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async verifyMFA(email, code, tempToken) {
    return this.request('/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
        temp_token: tempToken
      })
    })
  }

  /**
   * Redemande l'envoi d'un code MFA
   * @param {string} email Email de l'utilisateur
   * @param {string} tempToken Token temporaire reçu lors du login
   * @returns {Promise<Object>} Résultat de la requête de renvoi
   */
  async resendMFA(email, tempToken) {
    return this.request('/mfa/resend', {
      method: 'POST',
      body: JSON.stringify({
        email,
        temp_token: tempToken
      })
    })
  }

  // ----- TICKET METHODS -----
  /**
   * Récupérer tous les tickets
   * @returns {Promise<any>}
   */
  async getTickets() {
    return this.request('/tickets')
  }

  /**
   * Créer un nouveau ticket
   * @param {Object} ticketData - Données du ticket
   * @returns {Promise<any>}
   */
  async createTicket(ticketData) {
    try {
      const result = await this.request('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData)
      })

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'ticket',
          message: 'Ticket created',
          level: 'info',
          data: {
            ticket_subject: ticketData.subject
          }
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'create_ticket',
            platform: 'desktop'
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Récupérer un ticket spécifique
   * @param {string|number} ticketId - ID du ticket
   * @returns {Promise<any>}
   */
  async getTicket(ticketId) {
    return this.request(`/tickets/${ticketId}`)
  }

  /**
   * Mettre à jour un ticket
   * @param {string|number} ticketId - ID du ticket
   * @param {Object} ticketData - Données à mettre à jour
   * @returns {Promise<any>}
   */
  async updateTicket(ticketId, ticketData) {
    return this.request(`/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(ticketData)
    })
  }

  /**
   * Supprimer un ticket
   * @param {string|number} ticketId - ID du ticket
   * @returns {Promise<any>}
   */
  async deleteTicket(ticketId) {
    try {
      const result = await this.request(`/tickets/${ticketId}`, {
        method: 'DELETE'
      })

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'ticket',
          message: 'Ticket deleted',
          level: 'info',
          data: {
            ticket_id: ticketId
          }
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'delete_ticket',
            platform: 'desktop'
          },
          extra: {
            ticket_id: ticketId
          },
          level: 'error'
        })
      }
      throw error
    }
  }

  /**
   * Assigner un ticket à un admin
   * @param {string|number} ticketId - ID du ticket
   * @param {Object} assignData - Données d'assignation (ex: {admin_id: 123})
   * @returns {Promise<any>}
   */
  async assignTicket(ticketId, assignData) {
    return this.request(`/tickets/${ticketId}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignData)
    })
  }

  /**
   * Mettre à jour le statut d'un ticket
   * @param {string|number} ticketId - ID du ticket
   * @param {Object} statusData - Données du statut (ex: {status: 'open'})
   * @returns {Promise<any>}
   */
  async updateTicketStatus(ticketId, statusData) {
    return this.request(`/tickets/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    })
  }

  /**
   * Mettre à jour la priorité d'un ticket
   * @param {string|number} ticketId - ID du ticket
   * @param {Object} priorityData - Données de priorité (ex: {priority: 'high'})
   * @returns {Promise<any>}
   */
  async updateTicketPriority(ticketId, priorityData) {
    return this.request(`/tickets/${ticketId}/priority`, {
      method: 'PUT',
      body: JSON.stringify(priorityData)
    })
  }

  /**
   * Récupérer les commentaires d'un ticket
   * @param {string|number} ticketId - ID du ticket
   * @returns {Promise<any>}
   */
  async getTicketComments(ticketId) {
    return this.request(`/tickets/${ticketId}/comments`)
  }

  /**
   * Ajouter un commentaire à un ticket
   * @param {string|number} ticketId - ID du ticket
   * @param {Object} commentData - Données du commentaire
   * @returns {Promise<any>}
   */
  async addTicketComment(ticketId, commentData) {
    try {
      const result = await this.request(`/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify(commentData)
      })

      if (result.success && Sentry) {
        Sentry.addBreadcrumb({
          category: 'ticket',
          message: 'Ticket comment added',
          level: 'info',
          data: {
            ticket_id: ticketId
          }
        })
      }

      return result
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            action: 'add_ticket_comment',
            platform: 'desktop'
          },
          extra: {
            ticket_id: ticketId
          },
          level: 'error'
        })
      }
      throw error
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = API
} else {
  window.ChatAPI = API
}

export default API
