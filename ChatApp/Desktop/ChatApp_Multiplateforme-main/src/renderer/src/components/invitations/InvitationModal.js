import ChatService from '../../../../main/services/ChatService.js'
import { t } from '../../lang/LanguageManager.js'

/**
 * Gestionnaire du modal d'invitations
 */
class InvitationModal {
  constructor() {
    this.chatService = new ChatService()
    this.modal = null
    this.invitations = []
  }

  /**
   * Créer et afficher le modal
   */
  async show() {
    this.createModal()

    await this.loadInvitations()

    document.body.appendChild(this.modal)

    setTimeout(() => {
      this.modal.querySelector('.invitation-modal')?.focus()
    }, 100)
  }

  /**
   * Créer le HTML du modal
   */
  createModal() {
    this.modal = document.createElement('div')
    this.modal.className = 'invitation-modal-overlay'
    this.modal.innerHTML = `
      <div class="invitation-modal" tabindex="-1">
        <div class="modal-header">
          <h2>${t('invitations.modal.title')}</h2>
          <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
        </div>
        <div class="modal-body">
          <div class="invitations-list"></div>
        </div>
      </div>
    `

    // Événement pour fermer le modal
    this.modal.querySelector('.modal-close').addEventListener('click', () => this.close())

    // Fermer en cliquant sur l'overlay (en dehors du modal)
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close()
      }
    })

    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.parentElement) {
        this.close()
      }
    })
  }

  /**
   * Charger les invitations depuis l'API
   */
  async loadInvitations() {
    const container = this.modal.querySelector('.invitations-list')
    container.innerHTML = `<div class="loading">${t('invitations.modal.loading')}</div>`

    try {
      const response = await this.chatService.getMyInvitations()

      if (!response.success) {
        container.innerHTML = `<div class="error">${t('invitations.modal.loadError')}</div>`
        return
      }

      // La réponse API retourne response.data qui est déjà le tableau d'invitations
      this.invitations = Array.isArray(response.data) ? response.data : response.data.data || []

      if (this.invitations.length === 0) {
        container.innerHTML = `<div class="empty-state">${t('invitations.modal.empty')}</div>`
        return
      }

      // Afficher les invitations
      this.renderInvitations()
    } catch (error) {
      console.error('Erreur lors du chargement des invitations:', error)
      container.innerHTML = `<div class="error">${t('invitations.modal.loadError')}</div>`
    }
  }

  /**
   * Afficher les invitations
   */
  renderInvitations() {
    const container = this.modal.querySelector('.invitations-list')
    container.innerHTML = ''

    this.invitations.forEach((invitation) => {
      const invitationEl = document.createElement('div')
      invitationEl.className = 'invitation-item'

      // Content section
      const content = document.createElement('div')
      content.className = 'invitation-content'

      // Channel name
      const channelDiv = document.createElement('div')
      channelDiv.className = 'invitation-channel'
      const channelStrong = document.createElement('strong')
      channelStrong.textContent = invitation.channel.name
      channelDiv.appendChild(channelStrong)
      content.appendChild(channelDiv)

      // Details
      const details = document.createElement('div')
      details.className = 'invitation-details'

      const inviterSpan = document.createElement('span')
      inviterSpan.className = 'invitation-inviter'
      inviterSpan.textContent = t('invitations.modal.invitedBy', { name: invitation.inviter.name })
      details.appendChild(inviterSpan)

      if (invitation.message) {
        const messageDiv = document.createElement('div')
        messageDiv.className = 'invitation-message'
        messageDiv.textContent = `"${invitation.message}"`
        details.appendChild(messageDiv)
      }
      content.appendChild(details)

      // Description
      if (invitation.channel.description) {
        const descDiv = document.createElement('div')
        descDiv.className = 'invitation-description'
        descDiv.textContent = invitation.channel.description
        content.appendChild(descDiv)
      }

      // Time
      const timeDiv = document.createElement('div')
      timeDiv.className = 'invitation-time'
      timeDiv.textContent = this.formatDate(invitation.created_at)
      content.appendChild(timeDiv)

      invitationEl.appendChild(content)

      // Actions section
      const actions = document.createElement('div')
      actions.className = 'invitation-actions'

      const acceptBtn = document.createElement('button')
      acceptBtn.className = 'btn-accept'
      acceptBtn.dataset.id = invitation.id
      acceptBtn.textContent = t('invitations.modal.accept')
      acceptBtn.addEventListener('click', () => this.handleAccept(invitation.id))
      actions.appendChild(acceptBtn)

      const rejectBtn = document.createElement('button')
      rejectBtn.className = 'btn-reject'
      rejectBtn.dataset.id = invitation.id
      rejectBtn.textContent = t('invitations.modal.reject')
      rejectBtn.addEventListener('click', () => this.handleReject(invitation.id))
      actions.appendChild(rejectBtn)

      invitationEl.appendChild(actions)
      container.appendChild(invitationEl)
    })
  }

  /**
   * Gérer l'acceptation d'une invitation
   */
  async handleAccept(invitationId) {
    const invitation = this.invitations.find((inv) => inv.id === invitationId)
    if (!invitation) return

    try {
      const response = await this.chatService.acceptInvitation(invitationId)

      if (response.success) {
        // Notification de succès
        if (window.notificationManager) {
          window.notificationManager.show(
            'success',
            response.data.message ||
              t('invitations.modal.accepted', { channel: invitation.channel.name }),
            3000
          )
        }

        // Recharger les channels dans chatInstance
        if (window.chatInstance) {
          // Recharger complètement les channels depuis l'API
          try {
            const myChannelsResponse = await this.chatService.getMyChannels()

            if (myChannelsResponse.success) {
              const Channel = (await import('../../../../models/Channel.js')).default

              // Vider et recharger tous les channels
              window.chatInstance.channels = []

              for (const channelData of myChannelsResponse.data.data) {
                const newChannel = new Channel(
                  channelData.id,
                  channelData.name,
                  channelData.type,
                  channelData.description,
                  channelData.members || [],
                  [], // Messages seront chargés plus tard
                  channelData.created_at ? new Date(channelData.created_at) : new Date()
                )
                window.chatInstance.channels.push(newChannel)
              }

              // Réinitialiser l'interface
              window.chatInstance.init()
            }
          } catch (error) {
            console.error('Erreur lors du rechargement des channels:', error)
          }
        }

        // Recharger les invitations
        await this.loadInvitations()
      } else {
        alert(response.data.message || t('invitations.modal.acceptError'))
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error)
      alert(t('common.genericError'))
    }
  }

  /**
   * Gérer le refus d'une invitation
   */
  async handleReject(invitationId) {
    const invitation = this.invitations.find((inv) => inv.id === invitationId)
    if (!invitation) return

    try {
      const response = await this.chatService.rejectInvitation(invitationId)

      if (response.success) {
        // Notification
        if (window.notificationManager) {
          window.notificationManager.show('info', t('invitations.modal.rejected'), 2000)
        }

        // Recharger les invitations
        await this.loadInvitations()
      } else {
        alert(response.data.message || t('invitations.modal.rejectError'))
      }
    } catch (error) {
      console.error('Erreur lors du refus:', error)
      alert(t('common.genericError'))
    }
  }

  /**
   * Fermer le modal
   */
  close() {
    if (this.modal && this.modal.parentElement) {
      this.modal.remove()
    }
  }

  /**
   * Échapper les caractères HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Formater la date
   */
  formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      const key = days === 1 ? 'invitations.time.day' : 'invitations.time.days'
      return t(key, { count: days })
    } else if (hours > 0) {
      const key = hours === 1 ? 'invitations.time.hour' : 'invitations.time.hours'
      return t(key, { count: hours })
    } else if (minutes > 0) {
      const key = minutes === 1 ? 'invitations.time.minute' : 'invitations.time.minutes'
      return t(key, { count: minutes })
    } else {
      return t('invitations.time.now')
    }
  }
}

export default InvitationModal
