import ChatService from '../../../../main/services/ChatService.js'
import { t } from '../../lang/LanguageManager.js'

/**
 * Modal pour créer un nouveau DM avec un utilisateur
 */
class NewDMModal {
  constructor() {
    this.chatService = new ChatService()
    this.modal = null
    this.users = []
  }

  /**
   * Créer et afficher le modal
   */
  async show() {
    await this.loadUsers()
    this.createModal()
    document.body.appendChild(this.modal)

    setTimeout(() => {
      this.modal.querySelector('.new-dm-modal')?.focus()
    }, 100)
  }

  /**
   * Charger la liste des utilisateurs (excluant l'utilisateur actuel)
   */
  async loadUsers() {
    try {
      const response = await this.chatService.getAvailableUsersForDM()

      if (response.success && response.data?.data && Array.isArray(response.data.data)) {
        this.users = response.data.data
        console.log(`Utilisateurs disponibles pour DM: ${this.users.length}`)
      } else if (response.success && Array.isArray(response.data)) {
        // Fallback if data is directly in response.data
        this.users = response.data
        console.log(`Utilisateurs disponibles pour DM: ${this.users.length}`)
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
    modalContent.className = 'new-dm-modal invitation-modal'
    modalContent.tabIndex = -1

    // Header
    const header = document.createElement('div')
    header.className = 'modal-header'

    const title = document.createElement('h2')
    title.textContent = t('dm.newDM.title')
    header.appendChild(title)

    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-close'
    closeBtn.setAttribute('aria-label', t('common.close'))
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
      emptyState.textContent = t('dm.newDM.empty')
      body.appendChild(emptyState)
    } else {
      const form = document.createElement('div')
      form.className = 'new-dm-form'

      // User select
      const formGroup = document.createElement('div')
      formGroup.className = 'form-group'

      const label = document.createElement('label')
      label.htmlFor = 'user-select-dm'
      label.textContent = t('dm.newDM.selectLabel')
      formGroup.appendChild(label)

      const select = document.createElement('select')
      select.id = 'user-select-dm'
      select.className = 'user-select'

      const defaultOption = document.createElement('option')
      defaultOption.value = ''
      defaultOption.textContent = t('dm.newDM.choosePlaceholder')
      select.appendChild(defaultOption)

      this.users.forEach((user) => {
        const option = document.createElement('option')
        option.value = user.id
        option.textContent = `${user.name} (${user.email})`
        select.appendChild(option)
      })

      formGroup.appendChild(select)
      form.appendChild(formGroup)

      // Actions
      const formActions = document.createElement('div')
      formActions.className = 'form-actions'

      const cancelBtn = document.createElement('button')
      cancelBtn.className = 'btn-cancel'
      cancelBtn.textContent = t('dm.newDM.cancel')
      cancelBtn.addEventListener('click', () => this.close())
      formActions.appendChild(cancelBtn)

      const createBtn = document.createElement('button')
      createBtn.className = 'btn-send-invite'
      createBtn.textContent = t('dm.newDM.create')
      createBtn.addEventListener('click', () => this.handleCreateDM())
      formActions.appendChild(createBtn)

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
   * Gérer la création du DM
   */
  async handleCreateDM() {
    const userSelect = this.modal.querySelector('#user-select-dm')
    const createBtn = this.modal.querySelector('.btn-send-invite')

    const userId = userSelect?.value

    if (!userId) {
      alert(t('dm.newDM.validateSelectUser'))
      return
    }

    // Désactiver le bouton pendant la création
    if (createBtn) {
      createBtn.disabled = true
      createBtn.textContent = t('dm.newDM.creating')
    }

    try {
      const response = await this.chatService.createDM({ user_id: parseInt(userId) })

      if (response.success) {
        // Notification de succès
        if (window.notificationManager) {
          window.notificationManager.show(
            'success',
            response.data.message || t('dm.newDM.createdSuccess'),
            3000
          )
        }

        if (window.chatInstance) {
          await window.chatInstance.init()
        }

        this.close()
      } else {
        alert(response.data?.message || t('dm.newDM.createError'))

        // Réactiver le bouton
        if (createBtn) {
          createBtn.disabled = false
          createBtn.textContent = t('dm.newDM.create')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création du DM:', error)
      alert(t('dm.newDM.errorGeneric'))

      // Réactiver le bouton
      if (createBtn) {
        createBtn.disabled = false
        createBtn.textContent = t('dm.newDM.create')
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
}

export default NewDMModal
