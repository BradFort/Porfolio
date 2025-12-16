// Gestion principale du module de chat (salons, DMs, messages, WebSocket, E2EE)
import { afficherChannels, updateChannelItemUI } from './ui/ChannelChatBarFiller.js'
import { afficherDMChannels } from './ui/DmChatBarFiller.js'
import MessageUiFiller, { showDefaultWelcomePage } from './ui/MessageUiFiller.js'
import UserSideBarFiller, { setChatServiceInstance } from './ui/UserSideBarFiller.js'
import SetupCreateChannelButton from './channel/SetupChannelButtonManager.js'
import ChatService from '../../../../main/services/ChatService.js'
import { onNewMessage } from './websocketEvents/onNewMessage.js'
import { onRadisMessageNotif } from './websocketEvents/onRadisMessageNotif.js'
import { onRequestDmChannelIds } from './websocketEvents/onRequestDmChannelIds.js'
import { onRedisUserlistUpdate } from './websocketEvents/onRedisUserlistUpdate.js'
import { onNewInvitation } from './websocketEvents/onNewInvitation.js'
import { onInvitationAccepted } from './websocketEvents/onInvitationAccepted.js'
import { onInvitationRejected } from './websocketEvents/onInvitationRejected.js'
import { onUserTyping } from './websocketEvents/onUserTyping.js'
import { onDMCreated } from './websocketEvents/onDMCreated.js'
import { onE2EEStatusChanged } from './websocketEvents/onE2EEStatusChanged.js'
import { t } from '../../lang/LanguageManager.js'
import setupPendingMessageNotifier from './offline/pendingMessageNotifier.js'
import notifyQueuedMessage from './offline/queuedMessageNotifier.js'
import { MESSAGE_MAX_LENGTH } from '../../constants.js'
import E2EEManager from '../crypto/E2EEManager.js'
import E2EEMessageService from '../crypto/E2EEMessageService.js'

// Instance globale du service de chat (API + WebSocket)
const api = new ChatService()
// Exposé sur window pour d'autres modules (VoiceRecorder, FileAttachment, etc.)
window.chatService = api

class Chat {
  // user = utilisateur courant (doit contenir au moins id et name)
  constructor(user) {
    // Utilisateur actuellement connecté
    this.currentUser = user
    // ID du salon actuellement sélectionné
    this.currentChannelId = null

    // Passe le ChatService à la sidebar utilisateur (pour WebSocket / présence)
    setChatServiceInstance(api)

    // Tableau des messages affichés dans le salon courant
    this.messages = []

    // Configure le bouton "Nouveau salon" dans l'UI
    SetupCreateChannelButton(this)

    // Affiche la page d'accueil par défaut (aucun salon sélectionné)
    showDefaultWelcomePage()

    // Initialise les données (channels, DM, WebSocket, listes UI)
    this.init()

    // Enregistre tous les listeners WebSocket nécessaires
    onNewMessage(this, api)
    onRadisMessageNotif(this, api)
    onRequestDmChannelIds(this, api)
    onRedisUserlistUpdate(this, api)
    onNewInvitation(this, api)
    onInvitationAccepted(this, api)
    onInvitationRejected(this, api)
    onUserTyping(this, api)
    onDMCreated(this, api)
    onE2EEStatusChanged(this, api)

    // Notifications et rafraîchissement quand des messages "en attente" sont finalement envoyés
    setupPendingMessageNotifier(this, api)

    // Mise à jour de la présence (liste de droite) quand des events arrivent
    this.setupPresenceListeners()

    // Compteur interne pour éviter les race conditions dans selectChannel
    this._selectSeq = 0
  }

  // Abonne l'UI aux événements de présence (connecté/déconnecté/maj en ligne par salon)
  setupPresenceListeners() {
    api.on('presence_updated', () => {
      if (this.currentChannelId) {
        UserSideBarFiller(this.currentChannelId)
      }
    })

    api.on('user_connected', () => {
      if (this.currentChannelId) {
        UserSideBarFiller(this.currentChannelId)
      }
    })

    api.on('user_disconnected', () => {
      if (this.currentChannelId) {
        UserSideBarFiller(this.currentChannelId)
      }
    })

    api.on('channel_online_users', (data) => {
      // Ne rafraîchir que si l'événement concerne le salon courant
      if (data.channelId.toString() === this.currentChannelId?.toString()) {
        UserSideBarFiller(this.currentChannelId)
      }
    })
  }

  // Rafraîchit les messages pour un salon donné en utilisant fetchAllMessages (normal + E2EE)
  async refreshMessagesForChannel(channelId) {
    // Utiliser fetchAllMessages pour récupérer tous les messages (normaux et chiffrés)
    const newMessages = await this.fetchAllMessages(channelId)
    if (String(this.currentChannelId) === String(channelId)) {
      this.messages = newMessages
      this.updateMessagesUi()
    }
  }

  // Reconstruit la zone de messages pour le salon courant
  updateMessagesUi() {
    MessageUiFiller({
      channel: this.selectedChannel,
      messages: this.messages,
      user: this.currentUser,
      locked: false,
      onSendMessage: this.handleSendMessage.bind(this)
    })
  }

  // Met à jour visuellement un item de salon (badge membre, bouton join/leave)
  updateChannelUi(channelId, confirmed) {
    updateChannelItemUI(channelId, confirmed, this.joinLeaveCallback)
  }

  // Rafraîchit uniquement la sidebar utilisateur (liste des membres du salon)
  updateUserSidebar(channelId) {
    UserSideBarFiller(channelId)
  }

  // Reconstruit toute la liste des salons dans la sidebar de gauche
  refreshChannelListUi() {
    const channelsListDiv = document.getElementById('channels-list')
    if (channelsListDiv) {
      channelsListDiv.innerHTML = ''
      // afficherChannels construit un conteneur DOM avec tous les salons
      afficherChannels(this.currentUser, this.joinLeaveCallback, (ch) =>
        this.selectChannel(ch)
      ).then((container) => {
        channelsListDiv.appendChild(container)
        this.setupChannelClickHandlers(container)
      })
    }
  }

  // Ajoute les handlers de clic sur les items de salon/DM dans un conteneur donné
  setupChannelClickHandlers(container) {
    const channelItems = container.querySelectorAll('.channel-item')
    channelItems.forEach((item) => {
      item.addEventListener('click', () => {
        const channelData = item.dataset.channelData
        if (channelData) {
          const channel = JSON.parse(channelData)
          this.selectChannel(channel)
        }
      })
    })
  }

  // Gestion centrale de l'envoi d'un message texte (normal ou chiffré E2EE)
  async handleSendMessage(chan, user, content) {
    // Vérifier si E2EE est activé pour ce channel
    const isE2EEEnabled = window.e2eeToggle && window.e2eeToggle.isChannelEncrypted()

    let resp

    if (isE2EEEnabled && E2EEManager.isInitialized()) {
      // Envoyer un message chiffré
      try {
        resp = await E2EEManager.sendEncryptedMessage(chan.id, content)
        if (!resp) {
          new Error("Échec de l'envoi du message chiffré")
        }
      } catch (error) {
        console.error("[E2EE] Erreur d'envoi de message chiffré:", error)
        if (typeof window !== 'undefined' && window.notificationManager) {
          window.notificationManager.error(
            t('chat.notifications.e2eeSendFailed') || "Erreur d'envoi du message chiffré",
            4000
          )
        }
        return
      }
    } else {
      // Envoyer un message normal via l'API REST
      resp = await api.sendMessage(chan.id, { content })
    }
    // Validation côté interface - vérifier la longueur AVANT l'envoi
    if (content.length > MESSAGE_MAX_LENGTH) {
      if (typeof window !== 'undefined' && window.notificationManager) {
        window.notificationManager.error(
          t('chat.notifications.messageTooLong', { max: MESSAGE_MAX_LENGTH }),
          4000
        )
      }
      return
    }

    // Gestion des erreurs de validation HTTP 422
    if (resp && resp.status === 422) {
      if (typeof window !== 'undefined' && window.notificationManager) {
        const msg =
          t('chat.notifications.sendFailed') +
          ': ' +
          (resp.data?.message || t('common.genericError'))
        window.notificationManager.error(msg, 4000)
      }
      return
    }

    // Succès : on recharge tous les messages du salon (normal + E2EE)
    if (resp && resp.success) {
      const newMessages = await this.fetchAllMessages(chan.id)
      this.messages = newMessages
      // Gestion de la pagination côté front (channelPages/messagesPerPage sont globaux)
      if (typeof window.channelPages !== 'object' || !window.channelPages) {
        window.channelPages = {}
      }
      let messagesPerPage = 12
      if (typeof window.messagesPerPage === 'number') {
        messagesPerPage = window.messagesPerPage
      }
      window.channelPages[chan.id] = Math.ceil(newMessages.length / messagesPerPage)
      MessageUiFiller({
        channel: this.selectedChannel,
        messages: this.messages,
        user: this.currentUser,
        locked: false,
        onSendMessage: this.handleSendMessage.bind(this)
      })
    } else if (resp && resp.queued) {
      // Cas où le message est mis en file d'attente (offline, etc.)
      notifyQueuedMessage(chan, content)
    } else {
      // Autres erreurs (429, message trop long côté backend, erreur générique...)
      if (resp?.status === 429) {
        // ignore (anti-spam)
      } else if (resp?.data?.error === 'MESSAGE_TOO_LONG') {
        if (typeof window !== 'undefined' && window.notificationManager) {
          window.notificationManager.error(
            resp.data.message ||
              t('chat.notifications.messageTooLong', { max: MESSAGE_MAX_LENGTH }),
            4000
          )
        }
      } else {
        if (typeof window !== 'undefined' && window.notificationManager) {
          window.notificationManager.error(t('chat.notifications.sendFailed'), 4000)
        }
      }
    }

    // Remet le focus dans l'input après l'envoi / l'erreur
    const messageInput = document.querySelector('.message-input')
    if (messageInput) messageInput.focus()
  }

  // Initialisation générale du chat :
  // - récupère tous les salons
  // - connecte le WebSocket
  // - remplit les sidebars (salons + DMs)
  async init() {
    const channelsResp = await api.getChannels()
    this.channels = Array.isArray(channelsResp.data?.data?.data) ? channelsResp.data.data.data : []

    // DMs dont l'utilisateur fait partie
    const dmChannels = this.channels.filter(
      (channel) =>
        channel.type === 'dm' &&
        Array.isArray(channel.members) &&
        channel.members.some((m) => m.id === this.currentUser.id)
    )
    const dmChannelIds = dmChannels.map((c) => c.id)
    const token = api.api.token

    // Connexion au WebSocketListener avec les IDs de DMs pour recevoir les notifs
    if (this.currentUser && token) {
      api.currentUser = this.currentUser
      const defaultChannelId = this.channels.length > 0 ? this.channels[0].id : null
      await api.connectWebSocketListener(token, defaultChannelId, dmChannelIds)
    }

    // Affiche le nom d'utilisateur dans l'entête
    const usernameElement = document.getElementById('username')
    if (usernameElement) {
      usernameElement.textContent = this.currentUser.name
    }

    // Callback central utilisée par la sidebar pour gérer rejoindre/quitter un salon
    this.joinLeaveCallback = async (channel, isUserMember, actionType) => {
      let channelName = channel.name
      let notifMsg = ''
      if (actionType === 'toggle-membership') {
        let newIsMember = isUserMember
        // Perform join/leave
        if (isUserMember) {
          try {
            await api.leaveChannel(channel.id, this.currentUser.id)
            newIsMember = false
          } catch (e) {
            console.error('Erreur API leaveChannel:', e)
          }
        } else {
          try {
            await api.joinChannel(channel.id, this.currentUser.id)
            newIsMember = true
          } catch (e) {
            console.error('Erreur API joinChannel:', e)
          }
        }
        // Fetch latest channel info for notification
        let freshChannelName = channelName
        try {
          const channelsResp = await api.getChannels()
          const freshChannels = Array.isArray(channelsResp.data?.data?.data)
            ? channelsResp.data.data.data
            : []
          const freshChannel = freshChannels.find((c) => c.id === channel.id)
          if (freshChannel && freshChannel.name) {
            freshChannelName = freshChannel.name
          }
        } catch {
          // fallback to previous name
        }
        notifMsg = newIsMember
          ? t('notifications.channelJoin', { name: freshChannelName })
          : t('notifications.channelLeave', { name: freshChannelName })
        if (typeof window !== 'undefined' && window.notificationManager) {
          window.notificationManager.show(newIsMember ? 'success' : 'info', notifMsg, 3000)
        }
        updateChannelItemUI(channel.id, newIsMember, this.joinLeaveCallback)

        // Si on est sur ce salon, on met à jour la sélection/affichage après le join/leave
        if (this.currentChannelId === channel.id) {
          setTimeout(async () => {
            const confirmed = await api.isMemberOfChannel(channel.id)
            updateChannelItemUI(channel.id, confirmed, this.joinLeaveCallback)
            const channelsResp = await api.getChannels()
            const freshChannels = Array.isArray(channelsResp.data?.data?.data)
              ? channelsResp.data.data.data
              : []
            const freshChannel = freshChannels.find((c) => c.id === channel.id)

            if (freshChannel) {
              await this.selectChannel(freshChannel)
            } else {
              await this.selectChannel(channel)
            }
          }, 500)
        } else {
          setTimeout(async () => {
            const confirmed = await api.isMemberOfChannel(channel.id)
            updateChannelItemUI(channel.id, confirmed, this.joinLeaveCallback)
          }, 500)
        }
      }
    }

    // Construction de la liste des salons dans la sidebar
    const channelListContainer = await afficherChannels(
      this.currentUser,
      this.joinLeaveCallback,
      (channel) => this.selectChannel(channel)
    )

    const channelsListDiv = document.getElementById('channels-list')
    if (channelsListDiv) {
      channelsListDiv.innerHTML = ''
      channelsListDiv.appendChild(channelListContainer)
      this.setupChannelClickHandlers(channelListContainer)
    }

    // Construction de la liste des DMs dans la sidebar
    const dmListDiv = document.getElementById('dm-list')
    if (dmListDiv) {
      dmListDiv.innerHTML = ''
      const result = await api.getChannels()
      const channels = result.data?.data?.data || []
      channels.filter((channel) => channel.type === 'dm')
      const dmListContainer = await afficherDMChannels(
        this.currentUser,
        async (channel, isUserMember, actionType) => {
          if (actionType === 'toggle-membership') {
            if (isUserMember) {
              try {
                await api.leaveChannel(channel.id, this.currentUser.id)
              } catch (e) {
                console.error('Erreur API leaveChannel:', e)
              }
            } else {
              try {
                await api.joinChannel(channel.id, this.currentUser.id)
              } catch (e) {
                console.error('Erreur API joinChannel:', e)
              }
            }
            await this.init()
          }
        }
      )
      dmListDiv.appendChild(dmListContainer)
      this.setupChannelClickHandlers(dmListContainer)
    }
  }

  // Sélection d'un salon : met à jour l'état interne + l'UI + les abonnements WebSocket
  async selectChannel(channel) {
    // Incrémente la séquence pour détecter les sélections dépassées (race conditions)
    const seq = ++this._selectSeq

    this.selectedChannel = channel
    this.currentChannelId = channel.id

    try {
      // Exposé sur window pour d'autres modules (UserSideBarFiller, etc.)
      window.__currentChannelId = this.currentChannelId
    } catch {
      /* empty */
    }
    this.messages = []

    // Met à jour la classe "active" dans la liste de salons
    const allChannelItems = document.querySelectorAll('.channel-item')
    allChannelItems.forEach((item) => item.classList.remove('active'))

    const activeItem = document.querySelector(`.channel-item[data-channel-id='${channel.id}']`)
    if (activeItem) {
      activeItem.classList.add('active')
    }

    // Gestion de l'abonnement WebSocket pour recevoir les messages du bon salon
    if (this.lastSubscribedChannelId && this.lastSubscribedChannelId !== channel.id) {
      api.websocketListener.unsubscribeFromChannel(this.lastSubscribedChannelId)
    }
    api.websocketListener.subscribeToChannel(channel.id)
    this.lastSubscribedChannelId = channel.id

    let isUserMember = false
    try {
      isUserMember = await api.isMemberOfChannel(channel.id)
    } catch (e) {
      console.error('Erreur lors de la vérification du statut membre:', e)
    }

    // Si entre temps un autre salon a été sélectionné, on abandonne
    if (seq !== this._selectSeq || String(this.currentChannelId) !== String(channel.id)) {
      return
    }

    let messages = []
    if (isUserMember) {
      // Utiliser fetchAllMessages pour récupérer tous les messages (normaux et chiffrés)
      messages = await this.fetchAllMessages(channel.id)
      this.messages = messages
    }

    // Double vérification contre les race conditions
    if (seq !== this._selectSeq || String(this.currentChannelId) !== String(channel.id)) {
      return
    }

    // Met à jour l'UI de la zone de messages (ou écran "non membre")
    MessageUiFiller({
      channel,
      messages: this.messages,
      user: this.currentUser,
      locked: !isUserMember,
      onSendMessage: this.handleSendMessage.bind(this)
    })

    const messageInput = document.querySelector('.message-input')
    if (messageInput) messageInput.focus()

    // Si la sélection est toujours valide, on rafraîchit aussi la sidebar utilisateur
    if (seq === this._selectSeq && String(this.currentChannelId) === String(channel.id)) {
      UserSideBarFiller(channel.id)
    }
  }

  // Récupère tous les messages d'un salon (normaux + chiffrés E2EE) et les trie par date
  async fetchAllMessages(channelId) {
    try {
      // Récupérer les messages normaux et les infos du channel en parallèle
      const [normalResp, , membersResp] = await Promise.all([
        api.getMessages(channelId).catch(() => ({ data: { data: [] } })),
        api.api.getChannel(channelId).catch(() => ({ success: false, data: null })),
        api.api.request(`/channel/${channelId}/user`).catch(() => ({ success: false, data: null }))
      ])

      let normalMessages = Array.isArray(normalResp.data?.data) ? normalResp.data.data : []
      let encryptedMessages = []

      // Si le manager E2EE est initialisé, on tente aussi de récupérer les messages chiffrés
      if (E2EEManager.isInitialized()) {
        try {
          const encryptedResp = await api.getEncryptedMessages(channelId)
          encryptedMessages = Array.isArray(encryptedResp.data?.data?.messages)
            ? encryptedResp.data.data.messages
            : []
        } catch {
          encryptedMessages = []
        }
      }

      // Map des membres pour retrouver des noms d'auteurs lisibles
      const membersMap = new Map()
      if (membersResp.success && membersResp.data) {
        const members = membersResp.data.data || membersResp.data
        members.forEach((member) => {
          const memberId = member.user_id || (member.user && member.user.id) || member.id
          const memberName = member.user_name || (member.user && member.user.name) || member.name
          if (memberId && memberName) {
            membersMap.set(memberId, memberName)
          }
        })
      }

      // Post-traitement des messages chiffrés (déchiffrement + reconstruction auteur)
      if (encryptedMessages.length > 0) {
        let sessionKey = E2EEManager.getSessionKey(channelId)

        if (!sessionKey) {
          try {
            sessionKey = await E2EEManager.fetchSessionKey(api, channelId)
          } catch {
            // ignore
          }
        }

        if (sessionKey) {
          encryptedMessages = await Promise.all(
            encryptedMessages.map(async (msg) => {
              try {
                let authorName = 'Utilisateur'
                let userId = msg.sender_id || msg.user_id || (msg.user ? msg.user.id : null)

                if (msg.user && msg.user.name) {
                  authorName = msg.user.name
                } else if (msg.sender && msg.sender.name) {
                  authorName = msg.sender.name
                } else if (userId && membersMap.has(userId)) {
                  authorName = membersMap.get(userId)
                }

                if (msg.encrypted_content && msg.iv && msg.auth_tag) {
                  const decrypted = await E2EEMessageService.decryptMessage(
                    {
                      encryptedContent: msg.encrypted_content,
                      iv: msg.iv,
                      authTag: msg.auth_tag
                    },
                    sessionKey
                  )
                  return {
                    ...msg,
                    content: decrypted || '🔒 [Message chiffré]',
                    author: authorName,
                    user: msg.user || { id: userId, name: authorName },
                    isEncrypted: true,
                    isDecrypted: !!decrypted
                  }
                }
                return {
                  ...msg,
                  content: '🔒 [Message chiffré]',
                  author: authorName,
                  user: msg.user || { id: userId, name: authorName },
                  isEncrypted: true,
                  isDecrypted: false
                }
              } catch (error) {
                console.error(`[E2EE] Erreur de déchiffrement du message ${msg.id}:`, error)
                return {
                  ...msg,
                  content: '🔒 [Message chiffré]',
                  author: 'Utilisateur',
                  isEncrypted: true,
                  isDecrypted: false
                }
              }
            })
          )
        } else {
          // Pas de sessionKey disponible : on affiche des placeholders chiffrés
          encryptedMessages = encryptedMessages.map((msg) => {
            const userId = msg.sender_id || msg.user_id || (msg.user ? msg.user.id : null)
            const authorName =
              userId && membersMap.has(userId) ? membersMap.get(userId) : 'Utilisateur'
            return {
              ...msg,
              content: '🔒 [Message chiffré]',
              author: authorName,
              user: msg.user || { id: userId, name: authorName },
              isEncrypted: true,
              isDecrypted: false
            }
          })
        }
      }

      // Fusion des messages normaux et chiffrés puis tri par date croissante
      const allMessages = [...normalMessages, ...encryptedMessages]
      allMessages.sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateA - dateB
      })

      return allMessages
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error)
      return []
    }
  }

  // Nettoyage complet de l'instance de chat (WebSocket + listeners + UI)
  destroy() {
    try {
      if (api && api.websocketListener) {
        try {
          api.websocketListener.disconnect()
        } catch (e) {
          console.warn('[Chat.destroy] websocketListener.disconnect error:', e)
        }
      }

      if (api && typeof api.removeAllListeners === 'function') {
        try {
          api.removeAllListeners()
        } catch (e) {
          console.warn('[Chat.destroy] removeAllListeners error:', e)
        }
      }

      this.messages = []
      this.currentChannelId = null
      this.selectedChannel = null

      this.joinLeaveCallback = null

      const channelsListDiv = document.getElementById('channels-list')
      if (channelsListDiv) channelsListDiv.innerHTML = ''

      const dmListDiv = document.getElementById('dm-list')
      if (dmListDiv) dmListDiv.innerHTML = ''

      const usersDiv = document.querySelector('#channel-users')
      if (usersDiv) usersDiv.innerHTML = ''

      console.log('%cChat instance destroyed cleanly', 'color: green')
    } catch (err) {
      console.warn('[Chat.destroy] Unexpected error:', err)
    }
  }
}

export default Chat
