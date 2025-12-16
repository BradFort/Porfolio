import ChatService from '../../../../main/services/ChatService.js'
import { t } from '../../lang/LanguageManager.js'

/**
 * Modal pour inviter un utilisateur à un channel
 */
class InviteUserModal {
  constructor(channel) {
    this.channel = channel
    this.chatService = new ChatService()
    this.modal = null
    this.users = []
    this.currentUserId = null
  }

  /**
   * Créer et afficher le modal
   */
  async show() {
    await this.loadUsers()
    this.createModal()
    document.body.appendChild(this.modal)

    setTimeout(() => {
      this.modal.querySelector('.invite-user-modal')?.focus()
    }, 100)
  }

  /**
   * Charger la liste des utilisateurs
   */
  async loadUsers() {
    try {
      const response = await this.chatService.getAvailableUsersForInvite(this.channel.id)

      if (response.success && response.data?.data && Array.isArray(response.data.data)) {
        this.users = response.data.data
        console.log(`Utilisateurs disponibles pour invitation: ${this.users.length}`)
      } else {
        console.error('Impossible de charger les utilisateurs:', response.data?.message)
        this.users = []
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      this.users = []
    }
  }

  /**
   * Créer le HTML du modal
   */
  createModal() {
    this.modal = document.createElement('div')
    this.modal.className = 'invitation-modal-overlay'

    const modalContent = document.createElement('div')
    modalContent.className = 'invite-user-modal invitation-modal'
    modalContent.tabIndex = -1

    // Header
    const header = document.createElement('div')
    header.className = 'modal-header'

    const title = document.createElement('h2')
    title.textContent = t('invitations.inviteUser.title', { channel: `#${this.channel.name}` })
    header.appendChild(title)

    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-close'
    closeBtn.setAttribute('aria-label', t('invitations.inviteUser.close'))
    closeBtn.textContent = '×'
    closeBtn.addEventListener('click', () => this.close())
    header.appendChild(closeBtn)

    modalContent.appendChild(header)

    // Body
    const body = document.createElement('div')
    body.className = 'modal-body'

    if (this.users.length === 0) {
      const emptyState = document.createElement('div')
      emptyState.className = 'empty-state'
      emptyState.textContent = t('invitations.inviteUser.noneAvailable')
      body.appendChild(emptyState)
    } else {
      const form = document.createElement('div')
      form.className = 'invite-form'

      // User select
      const formGroup1 = document.createElement('div')
      formGroup1.className = 'form-group'

      const label1 = document.createElement('label')
      label1.htmlFor = 'user-select'
      label1.textContent = t('invitations.inviteUser.selectUserLabel')
      formGroup1.appendChild(label1)

      const select = document.createElement('select')
      select.id = 'user-select'
      select.className = 'user-select'

      const defaultOption = document.createElement('option')
      defaultOption.value = ''
      defaultOption.textContent = t('invitations.inviteUser.choosePlaceholder')
      select.appendChild(defaultOption)

      this.users.forEach((user) => {
        const option = document.createElement('option')
        option.value = user.id
        option.textContent = `${user.name} (${user.email})`
        select.appendChild(option)
      })

      formGroup1.appendChild(select)
      form.appendChild(formGroup1)

      // Message textarea
      const formGroup2 = document.createElement('div')
      formGroup2.className = 'form-group'

      const label2 = document.createElement('label')
      label2.htmlFor = 'invite-message'
      label2.textContent = t('invitations.inviteUser.messageLabel')
      formGroup2.appendChild(label2)

      const textarea = document.createElement('textarea')
      textarea.id = 'invite-message'
      textarea.className = 'invite-message-input'
      textarea.placeholder = t('invitations.inviteUser.messagePlaceholder')
      textarea.maxLength = 500
      textarea.rows = 3
      formGroup2.appendChild(textarea)

      const charCount = document.createElement('small')
      charCount.className = 'char-count'
      charCount.textContent = t('invitations.inviteUser.charsCount', { count: 0 })
      formGroup2.appendChild(charCount)

      textarea.addEventListener('input', () => {
        charCount.textContent = t('invitations.inviteUser.charsCount', {
          count: textarea.value.length
        })
      })

      form.appendChild(formGroup2)

      // Actions
      const formActions = document.createElement('div')
      formActions.className = 'form-actions'

      const cancelBtn = document.createElement('button')
      cancelBtn.className = 'btn-cancel'
      cancelBtn.textContent = t('invitations.inviteUser.cancel')
      cancelBtn.addEventListener('click', () => this.close())
      formActions.appendChild(cancelBtn)

      const sendBtn = document.createElement('button')
      sendBtn.className = 'btn-send-invite'
      sendBtn.textContent = t('invitations.inviteUser.send')
      sendBtn.addEventListener('click', () => this.handleSendInvite())
      formActions.appendChild(sendBtn)

      form.appendChild(formActions)
      body.appendChild(form)
    }

    modalContent.appendChild(body)
    this.modal.appendChild(modalContent)

    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close()
      }
    })

    // Close on Escape
    const escapeHandler = (e) => {
      if (e.key === 'Escape' && this.modal.parentElement) {
        this.close()
        document.removeEventListener('keydown', escapeHandler)
      }
    }
    document.addEventListener('keydown', escapeHandler)
  }

  /**
   * Gérer l'envoi de l'invitation
   */
  async handleSendInvite() {
    const userSelect = this.modal.querySelector('#user-select')
    const messageInput = this.modal.querySelector('#invite-message')
    const sendBtn = this.modal.querySelector('.btn-send-invite')

    const userId = userSelect?.value
    const message = messageInput?.value?.trim()

    if (!userId) {
      alert(t('invitations.inviteUser.validateSelectUser'))
      return
    }

    // Désactiver le bouton pendant l'envoi
    if (sendBtn) {
      sendBtn.disabled = true
      sendBtn.textContent = t('invitations.inviteUser.sending')
    }

    try {
      const response = await this.chatService.inviteUserToChannel(
        this.channel.id,
        userId,
        message || null
      )

      if (response.success) {
        // Notification de succès
        if (window.notificationManager) {
          window.notificationManager.show(
            'success',
            response.data.message || t('invitations.inviteUser.sentSuccess'),
            3000
          )
        }

        // Fermer le modal
        this.close()
      } else {
        alert(response.data?.message || t('invitations.inviteUser.sendError'))

        // Réactiver le bouton
        if (sendBtn) {
          sendBtn.disabled = false
          sendBtn.textContent = t('invitations.inviteUser.send')
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'invitation:", error)
      alert(t('invitations.inviteUser.errorGeneric'))

      // Réactiver le bouton
      if (sendBtn) {
        sendBtn.disabled = false
        sendBtn.textContent = t('invitations.inviteUser.send')
      }
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
}

export default InviteUserModal
