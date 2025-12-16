/**
 * Fichier : WebSocketListener.js
 * Service de gestion de la connexion WebSocket, des événements temps réel et de la reconnexion automatique.
 * Permet d'écouter, d'émettre et de dispatcher les événements du serveur pour le chat et la présence.
 */

// Utilisation conditionnelle de Sentry pour la gestion des erreurs et du monitoring
let Sentry = null
if (typeof window !== 'undefined' && window.Sentry) {
  Sentry = window.Sentry
}

class WebSocketListener {
  constructor() {
    // Initialisation des propriétés de connexion et de gestion d'état
    this.socket = null
    this.connected = false
    this.serverUrl = 'https://www.chatapp-xp.fun/ws'
    this.eventHandlers = new Map()
    this.userId = null
    this.username = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
  }

  /**
   * Établit la connexion WebSocket et gère l'authentification.
   * Gère aussi la reconnexion automatique en cas d'échec.
   */
  async connect(token, userId, username, channel, dmChannelIds) {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.serverUrl)

        // Événement déclenché à l'ouverture de la connexion
        this.socket.onopen = () => {
          console.log('[WebSocket] Connexion établie')
          this.connected = true
          this.reconnectAttempts = 0

          if (Sentry) {
            Sentry.addBreadcrumb({
              category: 'websocket',
              message: 'WebSocket connection established',
              level: 'info',
              data: {
                serverUrl: this.serverUrl,
                userId: userId,
                username: username
              }
            })
          }

          // Authentification après ouverture
          this.authenticate(token, userId, username, channel, dmChannelIds)
            .then(() => resolve(true))
            .catch(reject)
        }

        // Gestion de la fermeture de connexion (reconnexion si nécessaire)
        this.socket.onclose = (event) => {
          console.log('[WebSocket] Connexion fermée', event.code, event.reason)
          this.connected = false

          if (Sentry) {
            Sentry.addBreadcrumb({
              category: 'websocket',
              message: 'WebSocket connection closed',
              level: event.wasClean ? 'info' : 'warning',
              data: {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
              }
            })
          }

          this.emit('disconnected', { code: event.code, reason: event.reason })

          if (!event.wasClean) {
            this.attemptReconnect()
          }
        }

        // Gestion des erreurs de connexion
        this.socket.onerror = (error) => {
          console.error('[WebSocket] Erreur de connexion', error)

          if (Sentry) {
            Sentry.captureException(new Error('WebSocket connection error'), {
              tags: {
                component: 'websocket',
                action: 'connect',
                platform: 'desktop'
              },
              extra: {
                serverUrl: this.serverUrl,
                userId: userId,
                username: username,
                reconnectAttempts: this.reconnectAttempts
              },
              level: 'error'
            })
          }

          this.attemptReconnect()
          reject(new Error('Impossible de se connecter au serveur WebSocket'))
        }

        // Réception des messages du serveur
        this.socket.onmessage = (event) => {
          this.handleMessage(event.data)
        }
      } catch (error) {
        console.error('[WebSocket] Erreur lors de la création de la connexion', error)

        if (Sentry) {
          Sentry.captureException(error, {
            tags: {
              component: 'websocket',
              action: 'create_connection',
              platform: 'desktop'
            },
            extra: {
              serverUrl: this.serverUrl,
              userId: userId
            }
          })
        }

        reject(error)
      }
    })
  }

  /**
   * Authentifie l'utilisateur auprès du serveur WebSocket.
   * Gère le timeout et les erreurs d'authentification.
   */
  async authenticate(token, userId, username, channel, dmChannelIds) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        const error = new Error('Non connecté au serveur WebSocket')

        if (Sentry) {
          Sentry.captureException(error, {
            tags: {
              component: 'websocket',
              action: 'authenticate',
              platform: 'desktop'
            },
            level: 'warning'
          })
        }

        reject(error)
        return
      }

      // Handler temporaire pour la réponse d'authentification
      const onAuthenticated = (data) => {
        if (data.type === 'authenticated') {
          this.userId = data.userId
          this.username = data.username

          if (Sentry) {
            Sentry.addBreadcrumb({
              category: 'websocket',
              message: 'WebSocket authenticated',
              level: 'info',
              data: {
                userId: data.userId,
                username: data.username
              }
            })

            // Ajout du contexte utilisateur à Sentry
            Sentry.setUser({
              id: data.userId,
              username: data.username
            })
          }

          this.emit('authenticated', data)
          cleanup()
          resolve(data)
        } else if (data.type === 'authentication_error') {
          console.error("[WebSocket] Erreur d'authentification", data.message)

          if (Sentry) {
            Sentry.captureMessage('WebSocket authentication failed', {
              level: 'error',
              tags: {
                component: 'websocket',
                action: 'authenticate',
                platform: 'desktop'
              },
              extra: {
                error_message: data.message,
                userId: userId,
                username: username
              }
            })
          }

          cleanup()
          reject(new Error(data.message))
        }
      }

      // Nettoyage du handler temporaire
      const cleanup = () => {
        this.off('__auth_temp__', onAuthenticated)
      }

      this.on('__auth_temp__', onAuthenticated)

      const authMsg = JSON.stringify({
        type: 'authenticate',
        token,
        userId,
        username,
        channel,
        dmChannelIds
      })

      this.socket.send(authMsg)

      // Timeout d'authentification pour éviter les connexions bloquées
      setTimeout(() => {
        cleanup()
        const error = new Error("Timeout d'authentification WebSocket")

        if (Sentry) {
          Sentry.captureException(error, {
            tags: {
              component: 'websocket',
              action: 'authenticate_timeout',
              platform: 'desktop'
            },
            extra: {
              userId: userId,
              username: username,
              timeout: 10000
            },
            level: 'error'
          })
        }

        reject(error)
      }, 10000)
    })
  }

  /**
   * Traite les messages entrants du serveur WebSocket.
   * Fait le dispatch vers les bons handlers selon le type de message.
   */
  handleMessage(raw) {
    let data
    try {
      data = JSON.parse(raw)
    } catch (error) {
      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'websocket',
            action: 'parse_message',
            platform: 'desktop'
          },
          extra: {
            raw_message: raw?.substring(0, 500), // Limite la taille du log
            raw_length: raw?.length
          },
          level: 'warning'
        })
      }

      return
    }

    if (Sentry && data.type !== 'pong') {
      // Breadcrumb pour le monitoring sauf pour les pongs
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: `WebSocket message received: ${data.type}`,
        level: 'info',
        data: {
          type: data.type,
          channelId: data.channelId,
          userId: data.userId
        }
      })
    }

    // Dispatch des événements selon le type
    if (data.type === 'authenticated' || data.type === 'authentication_error') {
      this.emit('__auth_temp__', data)
      return
    }
    if (data.type === 'redis_message') {
      this.emit('new_message', data)
      return
    }
    if (data.type === 'redis_message_notif') {
      let notifData = { ...data }
      // Ajout du nom du channel si absent (utilise window.channelList)
      if (!notifData.channelName && notifData.channelId) {
        if (typeof window !== 'undefined' && window.channelList) {
          const found = window.channelList.find((c) => String(c.id) === String(notifData.channelId))
          if (found) notifData.channelName = found.name
        }
      }
      this.emit('radis_message_notif', notifData)
      return
    }
    if (data.type === 'redis_userlist_update') {
      this.emit('redis_userlist_update', data)
      return
    }
    if (data.type === 'new_invitation') {
      this.emit('new_invitation', data)
      return
    }
    if (data.type === 'invitation_accepted') {
      this.emit('invitation_accepted', data)
      return
    }
    if (data.type === 'invitation_rejected') {
      this.emit('invitation_rejected', data)
      return
    }
    if (data.type === 'user_typing_start') {
      this.emit('user_typing_start', data)
      return
    }
    if (data.type === 'user_typing_stop') {
      this.emit('user_typing_stop', data)
      return
    }
    if (data.type === 'dm_created') {
      this.emit('dm_created', data)
      return
    }

    // NOUVEAUX ÉVÉNEMENTS DE PRÉSENCE
    if (data.type === 'user_connected') {
      this.emit('user_connected', data)
      return
    }
    if (data.type === 'user_disconnected') {
      this.emit('user_disconnected', data)
      return
    }
    if (data.type === 'channel_online_users') {
      this.emit('channel_online_users', data)
      return
    }

    // Dispatch other events
    this.emit(data.type, data)
  }

  /**
   * Tentative de reconnexion automatique
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (Sentry) {
        Sentry.captureMessage('WebSocket reconnect failed after max attempts', {
          level: 'error',
          tags: {
            component: 'websocket',
            action: 'reconnect_failed',
            platform: 'desktop'
          },
          extra: {
            attempts: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts,
            serverUrl: this.serverUrl,
            userId: this.userId,
            username: this.username
          }
        })
      }

      this.emit('reconnect_failed')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * this.reconnectAttempts

    console.log(
      `[WebSocket] Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`
    )

    if (Sentry) {
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: `WebSocket reconnect attempt ${this.reconnectAttempts}`,
        level: 'info',
        data: {
          attempt: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts,
          delay: delay
        }
      })
    }

    setTimeout(() => {
      if (!this.connected) {
        this.emit('request-dmChannelIds')
      }
    }, delay)
  }

  /**
   * Système d'événements personnalisé
   */
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
        console.error("[WebSocket] Erreur dans le handler d'événement", event, error)

        if (Sentry) {
          Sentry.captureException(error, {
            tags: {
              component: 'websocket',
              action: 'event_handler',
              event_type: event,
              platform: 'desktop'
            },
            extra: {
              event: event,
              data: data
            },
            level: 'warning'
          })
        }
      }
    })
  }

  /**
   * Déconnexion manuelle
   */
  disconnect() {
    if (Sentry) {
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: 'WebSocket manual disconnect',
        level: 'info',
        data: {
          userId: this.userId,
          username: this.username
        }
      })
    }

    if (this.socket) {
      this.socket.close()
      this.socket = null
      this.connected = false
      this.userId = null
      this.username = null
      this.reconnectAttempts = 0
    }
  }

  /**
   * Forcer la reconnexion
   */
  async forceReconnect(token, userId, username) {
    if (Sentry) {
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: 'WebSocket force reconnect',
        level: 'info',
        data: {
          userId: userId,
          username: username
        }
      })
    }

    this.disconnect()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try {
      await this.connect(token, userId, username)
      return true
    } catch (error) {
      console.error('[WebSocket] Échec de la reconnexion forcée', error)

      if (Sentry) {
        Sentry.captureException(error, {
          tags: {
            component: 'websocket',
            action: 'force_reconnect_failed',
            platform: 'desktop'
          },
          extra: {
            userId: userId,
            username: username
          },
          level: 'error'
        })
      }

      return false
    }
  }

  /**
   * Vérifier l'état de connexion
   */
  isConnected() {
    return this.connected
  }

  /**
   * Obtenir le statut complet
   */
  getStatus() {
    return {
      connected: this.connected,
      userId: this.userId,
      username: this.username,
      serverUrl: this.serverUrl,
      reconnectAttempts: this.reconnectAttempts,
      socketId: null
    }
  }

  /**
   * S'abonner à un channel via WebSocket
   */
  subscribeToChannel(channelId) {
    if (this.socket && this.connected) {
      const msg = JSON.stringify({ type: 'subscribe', channelId })
      this.socket.send(msg)
      if (Sentry) {
        Sentry.addBreadcrumb({
          category: 'websocket',
          message: 'Subscribed to channel',
          level: 'info',
          data: {
            channelId: channelId
          }
        })
      }
    }
  }

  /**
   * Se désabonner d'un channel via WebSocket
   */
  unsubscribeFromChannel(channelId) {
    if (this.socket && this.connected) {
      const msg = JSON.stringify({ type: 'unsubscribe', channelId })
      this.socket.send(msg)
      if (Sentry) {
        Sentry.addBreadcrumb({
          category: 'websocket',
          message: 'Unsubscribed from channel',
          level: 'info',
          data: {
            channelId: channelId
          }
        })
      }
    }
  }

  /**
   * Subscribe to notifications for multiple channels
   */
  subscribeToNotifications(channelIds) {
    if (this.socket && this.connected) {
      const msg = JSON.stringify({
        type: 'subscribe_notifications',
        channelIds: channelIds.map((id) => String(id))
      })
      this.socket.send(msg)

      if (Sentry) {
        Sentry.addBreadcrumb({
          category: 'websocket',
          message: 'Subscribed to notifications',
          level: 'info',
          data: {
            channelCount: channelIds.length,
            channelIds: channelIds
          }
        })
      }
    }
  }

  /**
   * Send typing start event
   */
  startTyping(channelId) {
    if (this.socket && this.connected && channelId) {
      const msg = JSON.stringify({
        type: 'typing_start',
        channelId: channelId.toString()
      })
      this.socket.send(msg)
    }
  }

  /**
   * Send typing stop event
   */
  stopTyping(channelId) {
    if (this.socket && this.connected && channelId) {
      const msg = JSON.stringify({
        type: 'typing_stop',
        channelId: channelId.toString()
      })
      this.socket.send(msg)
    }
  }
}

export default WebSocketListener
