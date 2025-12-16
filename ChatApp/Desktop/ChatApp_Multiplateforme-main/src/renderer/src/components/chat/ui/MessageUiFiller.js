// Gestion complète de l'UI de la zone de messages (affichage + entrée + pièces jointes)
import InviteUserModal from '../../invitations/InviteUserModal.js'
import { t } from '../../../lang/LanguageManager.js'
import e2eeToggle from '../../dm/E2EEToggle.js'
import { MESSAGE_MAX_LENGTH } from '../../../constants.js'
import VoiceRecorder from '../voice/VoiceRecorder.js'
import FileAttachment from '../attachment/FileAttachment.js'
import AttachmentMenu from '../attachment/AttachmentMenu.js'

// Mémoire du nombre de pages déjà affichées par channel (pour la pagination)
let channelPages = {}
const messagesPerPage = 12

// Instances globales des modules de saisie/attachments pour pouvoir les détruire proprement
let voiceRecorderInstance = null
let fileAttachmentInstance = null
let attachmentMenuInstance = null

// Nettoie tous les handlers et instances liés à la zone d'entrée de message
function cleanupMessageInput() {
  const messageInput = document.querySelector('.message-input')
  const sendButton = document.querySelector('.send-button')
  if (sendButton) sendButton.onclick = null
  if (messageInput) {
    messageInput.oninput = null
    messageInput.onkeypress = null
  }

  if (voiceRecorderInstance) {
    voiceRecorderInstance.destroy()
    voiceRecorderInstance = null
  }

  if (fileAttachmentInstance) {
    fileAttachmentInstance.destroy()
    fileAttachmentInstance = null
  }

  if (attachmentMenuInstance) {
    attachmentMenuInstance.destroy()
    attachmentMenuInstance = null
  }
}

// Désactive complètement la zone d'entrée (placeholder, boutons, compteur)
function disableMessageInput() {
  const messageInput = document.querySelector('.message-input')
  const sendButton = document.querySelector('.send-button')
  const attachmentButton = document.querySelector('.attachment-button')
  const charCounter = document.querySelector('.character-counter')

  if (messageInput) {
    messageInput.disabled = true
    messageInput.placeholder = t('chat.mustBeMemberToSend')
  }
  if (sendButton) sendButton.disabled = true
  if (attachmentButton) attachmentButton.disabled = true
  if (charCounter) charCounter.style.display = 'none'

  cleanupMessageInput()
}

// Réactive la zone d'entrée (sans rebrancher les handlers, fait dans displayMessagesPaginated)
function enableMessageInput() {
  const messageInput = document.querySelector('.message-input')
  const sendButton = document.querySelector('.send-button')
  const attachmentButton = document.querySelector('.attachment-button')
  const charCounter = document.querySelector('.character-counter')

  if (messageInput) messageInput.disabled = false
  if (sendButton) sendButton.disabled = false
  if (attachmentButton) attachmentButton.disabled = false
  if (charCounter) charCounter.style.display = 'block'
}

// Crée ou met à jour le compteur de caractères sous le champ de saisie
function createOrUpdateCharacterCounter(messageInput) {
  let counter = document.querySelector('.character-counter')

  if (!counter) {
    counter = document.createElement('div')
    counter.className = 'character-counter'
    counter.style.cssText = `
      font-size: 11px;
      color: #666;
      padding: 4px 8px;
      text-align: right;
      margin-top: 2px;
    `

    const inputArea = document.querySelector('.input-area')
    if (inputArea) {
      inputArea.appendChild(counter)
    } else {
      messageInput.parentElement?.appendChild(counter)
    }
  }

  const length = messageInput.value.length
  counter.textContent = `${length} / ${MESSAGE_MAX_LENGTH}`

  // Couleur selon le niveau de remplissage
  if (length > MESSAGE_MAX_LENGTH) {
    counter.style.color = '#ff0000'
    counter.style.fontWeight = 'bold'
  } else if (length > MESSAGE_MAX_LENGTH * 0.9) {
    counter.style.color = '#ff6b6b'
    counter.style.fontWeight = 'normal'
  } else if (length > MESSAGE_MAX_LENGTH * 0.75) {
    counter.style.color = '#ffa500'
    counter.style.fontWeight = 'normal'
  } else {
    counter.style.color = '#666'
    counter.style.fontWeight = 'normal'
  }

  return counter
}

// Active/désactive le bouton envoyer selon longueur et contenu du message
function updateSendButtonState(messageInput, sendButton) {
  const content = messageInput.value.trim()
  const length = messageInput.value.length

  if (sendButton) {
    sendButton.disabled = length > MESSAGE_MAX_LENGTH || content.length === 0
  }
}

// Met à jour l'entête du channel (icone, nom, description, boutons spéciaux)
function updateChannelHeader(channel, isUserMember = true) {
  const channelIcon = document.getElementById('channel-icon')
  if (channelIcon) {
    channelIcon.className = 'channel-icon'
    channelIcon.classList.remove('private', 'dm', 'public')
    if (channel.type === 'private') {
      channelIcon.classList.add('private')
    } else if (channel.type === 'dm') {
      channelIcon.classList.add('dm')
    } else {
      channelIcon.classList.add('public')
    }
  }

  const channelName = document.getElementById('channel-name')
  if (channelName) {
    channelName.textContent = channel.name || t('chat.header.untitledChannel')
  }

  const channelTopic = document.getElementById('channel-topic')
  if (channelTopic) {
    channelTopic.textContent = channel.description || t('chat.header.noDescription')
  }

  const channelHeader = document.querySelector('.channel-header')
  let actionsDiv = channelHeader.querySelector('.channel-actions')

  if (!actionsDiv) {
    actionsDiv = document.createElement('div')
    actionsDiv.className = 'channel-actions'
    channelHeader.appendChild(actionsDiv)
  }

  // Réinitialise les actions de l'entête avant de repopuler
  actionsDiv.innerHTML = ''

  // Gestion du toggle E2EE pour les DMs uniquement (et si user membre)
  if (channel.type === 'dm' && isUserMember) {
    const existingToggle = document.querySelector('.e2ee-toggle-container')

    if (!existingToggle || e2eeToggle.currentChannelId !== channel.id) {
      // Recrée le toggle si non présent ou si on change de channel
      e2eeToggle.destroy()

      e2eeToggle.createToggle(channel.id, channel.name).then((toggleElement) => {
        if (toggleElement) {
          const messagesContainer = document.getElementById('messages')
          if (messagesContainer && channelHeader.nextSibling) {
            channelHeader.parentNode.insertBefore(toggleElement, channelHeader.nextSibling)
          } else if (messagesContainer) {
            channelHeader.parentNode.insertBefore(toggleElement, messagesContainer)
          }
        }
      })
    }
  } else if (channel.type !== 'dm') {
    // Pas un DM : on détruit le toggle E2EE s'il existe
    e2eeToggle.destroy()
  }

  // Bouton d'invitation pour les salons privés où l'utilisateur est membre
  if (channel.type === 'private' && isUserMember) {
    const inviteBtn = document.createElement('button')
    inviteBtn.className = 'header-button invite-button'
    inviteBtn.innerHTML = t('chat.header.invite')
    inviteBtn.setAttribute('data-i18n', 'chat.header.invite')
    inviteBtn.setAttribute('data-i18n-title', 'chat.header.inviteTitle')
    inviteBtn.title = t('chat.header.inviteTitle')
    inviteBtn.onclick = () => {
      const modal = new InviteUserModal(channel)
      modal.show()
    }
    actionsDiv.appendChild(inviteBtn)
  }
}

// Met à jour le placeholder de la zone de saisie avec le nom du channel
function updateInputPlaceholder(channel) {
  const messageInput = document.querySelector('.message-input')
  if (messageInput) {
    messageInput.placeholder = t('chat.placeholderInChannel', { name: channel.name })
  }
}

// Construit un élément DOM pour un message (texte, vocal, pièce jointe)
function createMessageElement(msg) {
  const messageDiv = document.createElement('div')
  messageDiv.className = 'message'

  const headerDiv = document.createElement('div')
  headerDiv.className = 'message-header'

  // Résolution du nom d'auteur à partir des différents formats possibles
  let author = msg.author
  if (!author && msg.user && msg.user.name) {
    author = msg.user.name
  } else if (!author && msg.sender && typeof msg.sender.getPseudo === 'function') {
    author = msg.sender.getPseudo()
  } else if (!author && msg.sender && msg.sender.name) {
    author = msg.sender.name
  }

  // Formatage de la date/heure du message
  let time

  const date = new Date(msg.created_at)
  const dateStr = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  time = `${dateStr} ${timeStr}`

  const authorSpan = document.createElement('span')
  authorSpan.className = 'message-author'
  authorSpan.textContent = author || t('chat.unknownUser')

  const timeSpan = document.createElement('span')
  timeSpan.className = 'message-timestamp'
  timeSpan.textContent = time || ''

  headerDiv.appendChild(authorSpan)
  headerDiv.appendChild(timeSpan)

  const messageContent = document.createElement('div')
  messageContent.className = 'message-content'
  messageContent.appendChild(headerDiv)

  // Différencier affichage selon type (voice / attachment / texte)
  if (msg.type === 'voice' && msg.file_url) {
    // --- Affichage des messages vocaux ---
    const voicePlayerDiv = document.createElement('div')
    voicePlayerDiv.className = 'voice-message-player'

    const voiceIcon = document.createElement('div')
    voiceIcon.className = 'voice-message-icon'
    voiceIcon.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `

    const audioElement = document.createElement('audio')
    audioElement.controls = true
    audioElement.controlsList = 'nodownload'
    audioElement.preload = 'metadata'

    if (msg.file_url) {
      audioElement.src = msg.file_url
    } else {
      console.error('[VoiceMessage] Aucune URL fournie')
    }

    audioElement.disabled = false

    audioElement.onerror = (e) => {
      console.error('[VoiceMessage] Erreur:', {
        url: msg.file_url,
        error: e,
        networkState: audioElement.networkState,
        readyState: audioElement.readyState
      })
    }

    audioElement.onloadedmetadata = () => {
      audioElement.disabled = false
    }

    const durationSpan = document.createElement('span')
    durationSpan.className = 'voice-message-duration'
    if (msg.duration) {
      const minutes = Math.floor(msg.duration / 60)
      const seconds = msg.duration % 60
      durationSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    voicePlayerDiv.appendChild(voiceIcon)
    voicePlayerDiv.appendChild(audioElement)
    if (msg.duration) {
      voicePlayerDiv.appendChild(durationSpan)
    }

    messageContent.appendChild(voicePlayerDiv)
  } else if (msg.type === 'attachment' && msg.file_url) {
    // --- Affichage des pièces jointes ---
    const attachmentDiv = document.createElement('div')
    attachmentDiv.className = 'file-attachment-display'

    // Extraire le nom du fichier de l'URL si pas fourni
    const fileName = msg.file_name || msg.file_url.split('/').pop().split('?')[0]

    // Déterminer le type de fichier
    const fileExtension = fileName.split('.').pop().toLowerCase()

    // Fonction utilitaire pour formater la taille
    const formatFileSize = (bytes) => {
      if (!bytes) return ''
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    // Icône selon le type de fichier
    let fileIcon = ''
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
      fileIcon = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      `
    } else if (['pdf'].includes(fileExtension)) {
      fileIcon = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
        </svg>
      `
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExtension)) {
      fileIcon = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v4h5v12H6zm6-10h2v2h-2v-2zm0 3h2v2h-2v-2zm-2-1h2v2h-2v-2zm0 3h2v2h-2v-2z"/>
        </svg>
      `
    } else {
      fileIcon = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
      `
    }

    attachmentDiv.innerHTML = `
      <div class="file-attachment-icon">${fileIcon}</div>
      <div class="file-attachment-info">
        <div class="file-attachment-name" title="${fileName}">${fileName}</div>
        ${msg.file_size ? `<div class="file-attachment-size">${formatFileSize(msg.file_size)}</div>` : ''}
      </div>
      <a href="${msg.file_url}" target="_blank" download="${fileName}" class="file-attachment-download">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
      </a>
    `

    messageContent.appendChild(attachmentDiv)
  } else {
    // --- Message texte par défaut ---
    const contentDiv = document.createElement('div')
    contentDiv.className = 'message-text'
    contentDiv.textContent = msg.content || ''

    messageContent.appendChild(contentDiv)
  }

  messageDiv.appendChild(messageContent)

  return messageDiv
}

// Affiche les messages d'un channel avec pagination, gère l'entrée et les pièces jointes
function displayMessagesPaginated(channel, messages, user, onSendMessage) {
  updateChannelHeader(channel, true)

  const messagesContainer = document.getElementById('messages')
  if (!messagesContainer) return
  messagesContainer.innerHTML = ''
  if (!channelPages[channel.id]) channelPages[channel.id] = 1
  const currentPage = channelPages[channel.id]
  const maxPages = Math.ceil(messages.length / messagesPerPage)
  const startIndex = Math.max(messages.length - currentPage * messagesPerPage, 0)
  const endIndex = messages.length - (currentPage - 1) * messagesPerPage
  const paginatedMessages = messages.slice(startIndex, endIndex)
  const messagesList = document.createElement('div')
  messagesList.className = 'messages-list'
  if (paginatedMessages.length > 0) {
    paginatedMessages.forEach((msg) => {
      const messageDiv = createMessageElement(msg)
      messagesList.appendChild(messageDiv)
    })
  } else {
    const emptyDiv = document.createElement('div')
    emptyDiv.className = 'no-messages'
    emptyDiv.textContent = t('chat.noMessagesInChannel')
    messagesList.appendChild(emptyDiv)
  }
  messagesContainer.appendChild(messagesList)

  // Contrôles de pagination (plus récents / plus anciens)
  const paginationControls = document.createElement('div')
  paginationControls.className = 'pagination-controls'
  if (currentPage > 1) {
    const prevBtn = document.createElement('button')
    prevBtn.textContent = t('chat.pagination.newer')
    prevBtn.setAttribute('data-i18n', 'chat.pagination.newer')
    prevBtn.className = 'pagination-btn'
    prevBtn.onclick = () => {
      channelPages[channel.id]--
      displayMessagesPaginated(channel, messages, user, onSendMessage)
    }
    paginationControls.appendChild(prevBtn)
  }
  if (currentPage < maxPages) {
    const nextBtn = document.createElement('button')
    nextBtn.textContent = t('chat.pagination.older')
    nextBtn.setAttribute('data-i18n', 'chat.pagination.older')
    nextBtn.className = 'pagination-btn'
    nextBtn.onclick = () => {
      channelPages[channel.id]++
      displayMessagesPaginated(channel, messages, user, onSendMessage)
    }
    paginationControls.appendChild(nextBtn)
  }
  messagesContainer.appendChild(paginationControls)
  enableMessageInput()

  updateInputPlaceholder(channel)
  try {
    // Hooks globaux utilisés pour mettre à jour les textes en cas de changement de langue
    window.__updateChatInputPlaceholder = () => updateInputPlaceholder(channel)
    window.__updateNotMemberMessage = null
  } catch (e) {
    console.debug('[i18n] placeholder/not-member setter failed:', e)
  }

  const messageInput = document.querySelector('.message-input')
  if (messageInput) {
    messageInput.placeholder = t('chat.placeholderInChannel', { name: channel.name })
  }

  // Réinitialisation des anciens handlers
  cleanupMessageInput()

  const sendButton = document.querySelector('.send-button')
  if (messageInput && sendButton) {
    createOrUpdateCharacterCounter(messageInput)

    messageInput.oninput = () => {
      createOrUpdateCharacterCounter(messageInput)
      updateSendButtonState(messageInput, sendButton)
    }

    const sendMessage = () => {
      const content = messageInput.value.trim()
      const length = messageInput.value.length

      if (length > MESSAGE_MAX_LENGTH) {
        if (typeof window !== 'undefined' && window.notificationManager) {
          window.notificationManager.error(
            t('chat.notifications.messageTooLong', { max: MESSAGE_MAX_LENGTH }),
            4000
          )
        }
        return
      }

      if (content && typeof onSendMessage === 'function') {
        onSendMessage(channel, user, content)
        messageInput.value = ''
        createOrUpdateCharacterCounter(messageInput)
        updateSendButtonState(messageInput, sendButton)
        displayMessagesPaginated(channel, messages, user, onSendMessage)
      }
    }

    // Clic sur le bouton envoyer
    sendButton.onclick = sendMessage
    // Touche Enter dans le champ de texte
    messageInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        sendMessage()
      }
    }

    updateSendButtonState(messageInput, sendButton)
  }

  // Initialiser le menu de pièces jointes
  attachmentMenuInstance = new AttachmentMenu()

  // Callback quand l'utilisateur clique sur "Message vocal"
  const onVoiceMessageClick = () => {
    if (voiceRecorderInstance) {
      voiceRecorderInstance.destroy()
    }

    voiceRecorderInstance = new VoiceRecorder()

    voiceRecorderInstance.startRecording(async (audioBlob, duration, mimeType) => {
      if (typeof window !== 'undefined' && window.notificationManager) {
        window.notificationManager.show(
          'info',
          t('chat.voice.uploading') || 'Envoi du message vocal...',
          2000
        )
      }

      try {
        const api = window.chatService
        if (api && typeof api.sendVoiceMessage === 'function') {
          const resp = await api.sendVoiceMessage(channel.id, audioBlob, duration, mimeType)

          if (resp && resp.success) {
            if (typeof window !== 'undefined' && window.notificationManager) {
              window.notificationManager.show(
                'success',
                t('chat.voice.sent') || 'Message vocal envoyé !',
                2000
              )
            }

            // Rafraîchir les messages du channel après l'envoi
            setTimeout(() => {
              if (typeof window.chatInstance !== 'undefined' && window.chatInstance) {
                window.chatInstance.refreshMessagesForChannel(channel.id)
              }
            }, 500)
          } else {
            let errorMessage =
              t('chat.voice.sendFailed') || "Erreur lors de l'envoi du message vocal"

            // Affiner message d'erreur si présents
            if (resp?.status === 422 && resp?.data?.errors) {
              const errors = resp.data.errors
              const errorFields = Object.keys(errors)
              if (errorFields.length > 0) {
                const firstError = errors[errorFields[0]][0]
                errorMessage = `Validation: ${firstError}`
              }
            } else if (resp?.data?.message) {
              errorMessage = resp.data.message
            }

            if (typeof window !== 'undefined' && window.notificationManager) {
              window.notificationManager.error(errorMessage, 5000)
            }
          }
        } else {
          console.error('[VoiceRecorder] API non disponible')
          if (typeof window !== 'undefined' && window.notificationManager) {
            window.notificationManager.error(
              t('chat.voice.apiNotAvailable') || 'Service non disponible',
              4000
            )
          }
        }
      } catch (error) {
        console.error("[VoiceRecorder] Erreur lors de l'envoi:", error)
        if (typeof window !== 'undefined' && window.notificationManager) {
          window.notificationManager.error(
            t('chat.voice.sendFailed') || "Erreur lors de l'envoi du message vocal",
            4000
          )
        }
      }
    })
  }

  // Callback quand l'utilisateur clique sur "Pièce jointe"
  const onFileAttachmentClick = () => {
    if (fileAttachmentInstance) {
      fileAttachmentInstance.destroy()
    }

    fileAttachmentInstance = new FileAttachment()

    // Ouvrir le sélecteur de fichiers avec callback d'envoi
    fileAttachmentInstance.selectFile(async (file) => {
      // Indicateur de chargement
      if (typeof window !== 'undefined' && window.notificationManager) {
        window.notificationManager.show(
          'info',
          t('chat.attachment.uploading') || 'Envoi du fichier...',
          2000
        )
      }

      try {
        // Envoyer le fichier via l'API
        const api = window.chatService
        if (api && typeof api.sendFileAttachment === 'function') {
          const resp = await api.sendFileAttachment(channel.id, file)

          if (resp && resp.success) {
            // Succès - rafraîchir les messages
            if (typeof window !== 'undefined' && window.notificationManager) {
              window.notificationManager.show(
                'success',
                t('chat.attachment.sent') || 'Fichier envoyé !',
                2000
              )
            }

            // Rafraîchir la liste des messages
            setTimeout(() => {
              if (typeof window.chatInstance !== 'undefined' && window.chatInstance) {
                window.chatInstance.refreshMessagesForChannel(channel.id)
              }
            }, 500)
          } else {
            console.error('[FileAttachment] Erreur de l\'API:', resp)

            let errorMessage =
              t('chat.attachment.sendFailed') || 'Erreur lors de l\'envoi du fichier'

            if (resp && resp.data && resp.data.message) {
              errorMessage = resp.data.message
            } else if (resp && resp.status === 413) {
              errorMessage = t('chat.attachment.fileTooLarge') || 'Fichier trop volumineux'
            } else if (resp && resp.status === 403) {
              errorMessage =
                t('chat.attachment.forbidden') ||
                "Vous n'avez pas la permission d'envoyer des fichiers"
            }

            if (typeof window !== 'undefined' && window.notificationManager) {
              window.notificationManager.error(errorMessage, 4000)
            }
          }
        } else {
          console.error('[FileAttachment] API non disponible')
          if (typeof window !== 'undefined' && window.notificationManager) {
            window.notificationManager.error(
              t('chat.attachment.apiNotAvailable') || 'Service non disponible',
              3000
            )
          }
        }
      } catch (error) {
        console.error('[FileAttachment] Exception:', error)
        if (typeof window !== 'undefined' && window.notificationManager) {
          window.notificationManager.error(
            t('chat.attachment.sendFailed') || 'Erreur lors de l\'envoi du fichier',
            4000
          )
        }
      }
    })
  }

  // Initialiser le menu (associer les callbacks voix + fichier)
  attachmentMenuInstance.init(onVoiceMessageClick, onFileAttachmentClick)

  // Scroll en bas après rendu des messages
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

// Affiche un écran spécial si l'utilisateur n'est pas membre du salon
export function showNotMemberMessage(channel) {
  updateChannelHeader(channel, false)

  const messagesDiv = document.getElementById('messages')
  if (messagesDiv) {
    messagesDiv.innerHTML = `<div class="not-member-message">${t('chat.notMemberMessage', { channel: channel.name })}</div>`

    try {
      // Hooks pour mettre à jour le message et le placeholder après changement de langue
      window.__updateNotMemberMessage = () => {
        const root = document.getElementById('messages')
        if (!root) return
        const el = root.querySelector('.not-member-message')
        if (el) {
          el.innerHTML = t('chat.notMemberMessage', { channel: channel.name })
        }
      }

      window.__updateChatInputPlaceholder = () => {
        const input = document.querySelector('.message-input')
        if (input) input.placeholder = t('chat.mustBeMemberToSend')
      }
    } catch (e) {
      console.debug('[i18n] not-member dynamic setter failed:', e)
    }
  }

  const messageInput = document.querySelector('.message-input')
  if (messageInput) {
    messageInput.value = ''
    messageInput.disabled = true
    messageInput.placeholder = t('chat.mustBeMemberToSend')
  }
  const sendButton = document.querySelector('.send-button')
  if (sendButton) sendButton.disabled = true

  const attachmentButton = document.querySelector('.attachment-button')
  if (attachmentButton) attachmentButton.disabled = true

  disableMessageInput()
  cleanupMessageInput()
}

// Page d'accueil par défaut quand aucun salon n'est sélectionné
export function showDefaultWelcomePage() {
  const channelIcon = document.getElementById('channel-icon')
  if (channelIcon) {
    channelIcon.className = 'channel-icon'
  }

  const channelName = document.getElementById('channel-name')
  if (channelName) {
    channelName.textContent = t('chat.welcome.title')
  }

  const channelTopic = document.getElementById('channel-topic')
  if (channelTopic) {
    channelTopic.textContent = ''
  }

  const channelHeader = document.querySelector('.channel-header')
  const actionsDiv = channelHeader?.querySelector('.channel-actions')
  if (actionsDiv) {
    actionsDiv.innerHTML = ''
  }

  const messagesDiv = document.getElementById('messages')
  if (messagesDiv) {
    messagesDiv.innerHTML = `
      <div class="welcome-page">
        <h2 class="welcome-title">${t('chat.welcome.heading')}</h2>
        <p class="welcome-message">${t('chat.welcome.message')}</p>
        <div class="welcome-instructions">
          <p>${t('chat.welcome.instruction')}</p>
        </div>
      </div>
    `

    try {
      // Hooks pour mettre à jour dynamiquement le texte de la page d'accueil
      window.__updateWelcomePage = () => {
        const root = document.getElementById('messages')
        if (!root) return

        const title = root.querySelector('.welcome-title')
        const message = root.querySelector('.welcome-message')
        const instruction = root.querySelector('.welcome-instructions p')

        if (title) title.textContent = t('chat.welcome.heading')
        if (message) message.textContent = t('chat.welcome.message')
        if (instruction) instruction.innerHTML = `${t('chat.welcome.instruction')}`
      }

      window.__updateChatInputPlaceholder = () => {
        const input = document.querySelector('.message-input')
        if (input) input.placeholder = t('chat.welcome.inputPlaceholder')
      }

      window.__updateNotMemberMessage = null
    } catch (e) {
      console.debug('[i18n] welcome page dynamic setter failed:', e)
    }
  }

  const messageInput = document.querySelector('.message-input')
  if (messageInput) {
    messageInput.value = ''
    messageInput.disabled = true
    messageInput.placeholder = t('chat.welcome.inputPlaceholder')
  }

  const sendButton = document.querySelector('.send-button')
  if (sendButton) {
    sendButton.disabled = true
  }

  const charCounter = document.querySelector('.character-counter')
  if (charCounter) {
    charCounter.style.display = 'none'
  }

  cleanupMessageInput()
}

// Point d'entrée principal : affiche soit les messages, soit l'écran non-membre
export default function MessageUiFiller({
  channel,
  messages,
  user,
  locked = false,
  onSendMessage
}) {
  if (locked) {
    showNotMemberMessage(channel)
  } else {
    displayMessagesPaginated(channel, messages, user, onSendMessage)
  }
}
