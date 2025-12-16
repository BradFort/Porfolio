// Script de la page de détail d'un ticket
// - Récupère un ticket via IPC/API
// - Affiche les infos (badges, méta, commentaires)
// - Permet d'ajouter des commentaires
// - Affiche des contrôles d'admin (assignation, statut, priorité, suppression)
import themeManager from './ticketDetailTheme.js'
import { t } from '../../src/lang/LanguageManager.js'

class TicketDetailPage {
  constructor() {
    // Identifiant du ticket courant (provenant de l'URL ou d'IPC)
    this.ticketId = null
    // Données complètes du ticket chargé depuis l'API
    this.ticket = null
    // Flag indiquant si l'utilisateur connecté est admin
    this.isAdmin = false
    // Indique si les contrôles admin ont été initialisés
    this.adminControlsInitialized = false
    // Gestionnaire de thème et de traductions pour cette page
    this.themeManager = themeManager
    // Démarre l'initialisation asynchrone
    this.init()
  }

  // Initialisation générale de la page
  // - Sync du token entre renderer et main
  // - Wiring des boutons de la titlebar
  // - Récupération de l'ID du ticket (IPC ou querystring)
  // - Vérification du rôle admin
  async init() {
    await this.syncAuthToken()

    const minimizeBtn = document.querySelector('.titlebar-button.minimize')
    const maximizeBtn = document.querySelector('.titlebar-button.maximize')
    const closeBtn = document.querySelector('.titlebar-button.close')

    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => {
        window.electronAPI.send('window:minimize')
      })
    }

    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', () => {
        window.electronAPI.send('window:maximize')
      })
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.electronAPI.send('window:close')
      })
    }

    if (window.electronAPI && window.electronAPI.on) {
      window.electronAPI.on('ticket:load', (ticketId) => {
        this.ticketId = ticketId
        this.loadTicket()
      })
    } else {
      console.error('electronAPI.on is not available!')
    }

    const backBtn = document.getElementById('back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.electronAPI.send('window:close')
      })
    }

    const sendBtn = document.getElementById('send-comment-btn')
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.addComment()
      })
    }

    const urlParams = new URLSearchParams(window.location.search)
    const urlTicketId = urlParams.get('id')
    if (urlTicketId) {
      this.ticketId = urlTicketId
      this.loadTicket()
    }

    this.checkAdminRole()
  }

  // Synchronise le token d'auth (stocké en localStorage) avec le process main
  // afin que les appels IPC -> API soient authentifiés
  async syncAuthToken() {
    try {
      const encodedToken = localStorage.getItem('auth_token')
      if (encodedToken) {
        const binary = atob(encodedToken)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        const token = new TextDecoder().decode(bytes)
        if (window.electronAPI && window.electronAPI.setToken) {
          await window.electronAPI.setToken(token)
        }
      } else {
        console.warn('[TicketDetail] No auth token found in localStorage')
      }
    } catch (error) {
      console.error('[TicketDetail] Error syncing auth token:', error)
    }
  }

  // Vérifie depuis le main si l'utilisateur courant a le rôle admin
  async checkAdminRole() {
    if (!window.electronAPI || !window.electronAPI.getCurrentUser) {
      console.error('getCurrentUser API not available')
      return
    }

    try {
      const user = await window.electronAPI.getCurrentUser()
      this.isAdmin = user?.role === 'admin'
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  // Charge les données d'un ticket via window.api.getTicket puis met à jour l'UI
  async loadTicket() {
    if (!this.ticketId) {
      alert(t('ticket.detail.noId'))
      return
    }

    try {
      if (!window.api || !window.api.getTicket) {
        console.error('window.api.getTicket is not available!')
        alert('API non disponible')
        return
      }

      const result = await window.api.getTicket(this.ticketId)

      if (!result || !result.success) {
        console.error('Error loading ticket:', result)
        alert(t('ticket.errors.loadError') + ': ' + (result?.error || 'Erreur inconnue'))
        return
      }

      this.ticket = result.data?.data || result.data

      if (!this.ticket) {
        console.error('No ticket data in response')
        alert('Aucune donnée de ticket reçue')
        return
      }

      if (this.ticket.assigned_to && !this.ticket.assignedUser) {
        await this.loadAssignedUserName()
      }

      this.renderTicket()
    } catch (error) {
      console.error('Error loading ticket:', error)
      alert(t('ticket.errors.loadError') + ': ' + error.message)
    }
  }

  // Charge le nom de l'utilisateur assigné en récupérant tous les utilisateurs
  async loadAssignedUserName() {
    try {
      const usersResult = await window.api.getAllUsers()
      if (usersResult && usersResult.success) {
        const users = usersResult.data?.data || usersResult.data || []
        const assignedUser = users.find(user => user.id == this.ticket.assigned_to)
        if (assignedUser) {
          this.ticket.assignedUser = assignedUser
        }
      }
    } catch (error) {
      console.error('Error loading assigned user name:', error)
    }
  }

  // Met à jour l'ensemble des blocs d'affichage du ticket
  renderTicket() {
    const titleEl = document.getElementById('ticket-title')
    if (titleEl) {
      titleEl.textContent = `Ticket #${this.ticket.id} - ${this.ticket.title}`
    }
    const windowTitle = document.querySelector('.window-title')
    if (windowTitle) {
      windowTitle.textContent = `Ticket #${this.ticket.id}`
    }
    this.renderBadges()
    const descEl = document.getElementById('ticket-description')
    if (descEl) {
      descEl.textContent = this.ticket.description || t('ticket.detail.noDescription')
    }
    this.renderMeta()
    this.renderComments()
    this.renderAdminControls()
    this.updateCommentFormState()
  }

  // Affiche les badges de statut et de priorité du ticket
  renderBadges() {
    const badgesEl = document.getElementById('ticket-badges')
    if (!badgesEl) return

    badgesEl.innerHTML = `
      <span class="badge badge-status-${this.ticket.status || 'open'}">
        ${t('ticket.detail.status.label')}: ${t(`ticket.detail.status.${this.ticket.status || 'open'}`)}
      </span>
      <span class="badge badge-priority-${this.ticket.priority || 'medium'}">
        ${t('ticket.detail.priority.label')}: ${t(`ticket.detail.priority.${this.ticket.priority || 'medium'}`)}
      </span>
    `
  }

  // Affiche les informations "meta" (créateur, date, assignation)
  renderMeta() {
    const metaEl = document.getElementById('ticket-meta')
    if (!metaEl) return

    try {
      const createdDate = new Date(this.ticket.created_at)

      let assignedTo = t('ticket.detail.system')
      if (this.ticket.assignedUser) {
        assignedTo = this.ticket.assignedUser.name
      } else if (this.ticket.assigned_to) {
        assignedTo = 'None'
      }

      metaEl.innerHTML = `
        <div style="margin-bottom: 8px;">
          ${t('ticket.detail.createdBy')}: <strong>${this.ticket.user?.name || t('ticket.detail.unknown')}</strong>
          ${t('ticket.detail.on')} ${createdDate.toLocaleDateString(this.themeManager.currentLang === 'fr' ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })} ${t('ticket.detail.at')} ${createdDate.toLocaleTimeString(this.themeManager.currentLang === 'fr' ? 'fr-FR' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div>
          ${t('ticket.detail.assignedTo')}: <strong style="color: #0066cc;">${assignedTo}</strong>
        </div>
      `
    } catch (error) {
      console.error('Error rendering meta:', error)
      metaEl.innerHTML = 'Informations non disponibles'
    }
  }

  // Affiche la liste des commentaires du ticket
  renderComments() {
    const commentsListEl = document.getElementById('comments-list')
    if (!commentsListEl) return

    if (!this.ticket.comments || this.ticket.comments.length === 0) {
      commentsListEl.innerHTML = `
        <div class="comments-empty">
          ${t('ticket.detail.noComments')}
        </div>
      `
      return
    }

    try {
      commentsListEl.innerHTML = this.ticket.comments
        .map((comment) => this.createCommentHTML(comment))
        .join('')
    } catch (error) {
      console.error('Error rendering comments:', error)
      commentsListEl.innerHTML = `
        <div class="comments-empty">
          ${t('ticket.detail.commentError')}
        </div>
      `
    }
  }

  // Construit le HTML pour un commentaire donné
  createCommentHTML(comment) {
    try {
      const commentDate = new Date(comment.created_at)
      let commentText = comment.content
      if (typeof commentText === 'string' && commentText.startsWith('{')) {
        try {
          const parsed = JSON.parse(commentText)
          commentText = parsed.content || commentText
        } catch (e) {
          console.warn('Failed to parse comment JSON:', e)
        }
      }

      return `
        <div class="comment">
          <div class="comment-header">
            <span class="comment-author">${comment.user?.name || t('ticket.detail.unknown')}</span>
            <span class="comment-date">
              ${commentDate.toLocaleDateString(this.themeManager.currentLang === 'fr' ? 'fr-FR' : 'en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })} ${t('ticket.detail.at')} ${commentDate.toLocaleTimeString(this.themeManager.currentLang === 'fr' ? 'fr-FR' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <p class="comment-content">${this.escapeHtml(commentText)}</p>
        </div>
      `
    } catch (error) {
      console.error('Error creating comment HTML:', error)
      return '<div class="comment">Erreur lors de l\'affichage du commentaire</div>'
    }
  }

  // Échappe le HTML pour éviter les injections XSS dans les commentaires
  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Active/désactive le formulaire de commentaire selon le statut du ticket
  updateCommentFormState() {
    const input = document.getElementById('comment-input')
    const btn = document.getElementById('send-comment-btn')
    const addCommentSection = document.querySelector('.add-comment-section')

    if (!input || !btn || !addCommentSection) return

    const isClosed = this.ticket.status === 'closed'

    if (isClosed) {
      input.disabled = true
      input.placeholder = t('ticket.detail.ticketClosed')
      btn.disabled = true
      addCommentSection.style.opacity = '0.6'
      addCommentSection.style.pointerEvents = 'none'
    } else {
      input.disabled = false
      input.placeholder = t('ticket.detail.addComment')
      btn.disabled = false
      addCommentSection.style.opacity = '1'
      addCommentSection.style.pointerEvents = 'auto'
    }
  }

  // Ajoute un commentaire via l'API, puis recharge le ticket
  async addComment() {

    const input = document.getElementById('comment-input')
    const btn = document.getElementById('send-comment-btn')

    if (!input || !btn) {
      console.error('Input or button not found')
      return
    }

    const content = input.value.trim()
    if (!content) {
      alert(t('ticket.detail.commentEmpty'))
      return
    }

    btn.disabled = true
    btn.textContent = t('ticket.detail.sending')

    try {

      if (!window.api || !window.api.addTicketComment) {
        console.error('window.api.addTicketComment is not available!')
        alert('API non disponible')
        btn.disabled = false
        btn.textContent = t('ticket.detail.send')
        return
      }

      const result = await window.api.addTicketComment(this.ticketId, content)

      if (result && result.success) {
        input.value = ''
        await this.loadTicket()
        if (window.notificationAPI) {
          window.notificationAPI.showNotification('success', t('ticket.detail.commentAdded'))
        } else {
          alert(t('ticket.detail.commentAdded'))
        }
      } else {
        alert(t('ticket.detail.commentError') + ': ' + (result?.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert(t('ticket.detail.commentError') + ': ' + error.message)
    } finally {
      btn.disabled = false
      btn.textContent = t('ticket.detail.send')
    }
  }

  // Prépare les contrôles d'admin (assigner, changer statut/priorité, supprimer)
  renderAdminControls() {
    const adminControlsEl = document.getElementById('admin-controls')
    if (!adminControlsEl) return

    if (!this.isAdmin) {
      adminControlsEl.style.display = 'none'
      return
    }

    adminControlsEl.style.display = 'block'

    const assignBtn = document.getElementById('assign-ticket-btn')
    const statusBtn = document.getElementById('status-ticket-btn')
    const priorityBtn = document.getElementById('priority-ticket-btn')
    const deleteBtn = document.getElementById('delete-ticket-btn')

    if (deleteBtn) {
      const canDelete = this.ticket.status === 'closed' || this.ticket.status === 'resolved'
      deleteBtn.disabled = !canDelete
      deleteBtn.style.opacity = canDelete ? '1' : '0.5'
      deleteBtn.style.cursor = canDelete ? 'pointer' : 'not-allowed'
      deleteBtn.title = canDelete ? t('ticket.detail.admin.delete') : t('ticket.detail.admin.deleteTooltip')
    }

    if (this.adminControlsInitialized) {
      return
    }

    this.adminControlsInitialized = true

    if (assignBtn) {
      assignBtn.addEventListener('click', () => {
        this.assignTicket()
      })
    }

    if (statusBtn) {
      statusBtn.addEventListener('click', () => {
        this.changeStatus()
      })
    }

    if (priorityBtn) {
      priorityBtn.addEventListener('click', () => {
        this.changePriority()
      })
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.deleteTicket()
      })
    }
  }

  showAdminModal({ title, label, placeholder, options, onSubmit }) {
    const container = document.getElementById('admin-modal-container')
    if (!container) return
    container.innerHTML = ''

    const overlay = document.createElement('div')
    overlay.style.position = 'fixed'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100vw'
    overlay.style.height = '100vh'
    overlay.style.background = 'rgba(0,0,0,0.3)'
    overlay.style.zIndex = '9999'
    overlay.style.display = 'flex'
    overlay.style.alignItems = 'center'
    overlay.style.justifyContent = 'center'

    const modal = document.createElement('div')
    modal.style.background = '#fff'
    modal.style.padding = '24px 32px'
    modal.style.borderRadius = '8px'
    modal.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)'
    modal.style.minWidth = '320px'
    modal.style.maxWidth = '90vw'
    modal.style.display = 'flex'
    modal.style.flexDirection = 'column'
    modal.style.gap = '16px'

    const titleEl = document.createElement('h3')
    titleEl.textContent = title
    modal.appendChild(titleEl)

    const labelEl = document.createElement('label')
    labelEl.textContent = label
    modal.appendChild(labelEl)

    let inputEl
    if (options && Array.isArray(options)) {
      inputEl = document.createElement('select')
      options.forEach(opt => {
        const optionEl = document.createElement('option')
        optionEl.value = opt.value
        optionEl.textContent = opt.label
        inputEl.appendChild(optionEl)
      })
    } else {
      inputEl = document.createElement('input')
      inputEl.type = 'text'
      inputEl.placeholder = placeholder || ''
    }
    modal.appendChild(inputEl)

    const btnRow = document.createElement('div')
    btnRow.style.display = 'flex'
    btnRow.style.gap = '12px'
    btnRow.style.justifyContent = 'flex-end'

    const submitBtn = document.createElement('button')
    submitBtn.textContent = 'Valider'
    submitBtn.className = 'btn-admin'
    submitBtn.onclick = () => {
      onSubmit(inputEl.value)
      container.innerHTML = ''
    }
    btnRow.appendChild(submitBtn)

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'Annuler'
    cancelBtn.className = 'btn-admin'
    cancelBtn.onclick = () => {
      container.innerHTML = ''
    }
    btnRow.appendChild(cancelBtn)

    modal.appendChild(btnRow)
    overlay.appendChild(modal)
    container.appendChild(overlay)
  }

  async assignTicket() {
    try {
      const usersResult = await window.api.getAllUsers()

      if (!usersResult || !usersResult.success) {
        alert('Erreur lors de la récupération des utilisateurs: ' + (usersResult?.error || 'Erreur inconnue'))
        return
      }

      const users = usersResult.data?.data || usersResult.data || []

      const admins = users.filter(user => user.role === 'admin')

      if (admins.length === 0) {
        alert('Aucun administrateur disponible pour l\'assignation')
        return
      }

      const adminOptions = admins.map(admin => ({
        value: admin.id,
        label: `${admin.name} (ID: ${admin.id})`
      }))

      this.showAdminModal({
        title: 'Assigner à un admin',
        label: 'Sélectionnez un administrateur',
        options: adminOptions,
        onSubmit: async (userId) => {
          if (!userId) {
            alert('Veuillez sélectionner un administrateur')
            return
          }
          try {
            const result = await window.api.assignTicket(this.ticketId, { assigned_to: userId })
            if (result && result.success) {
              if (window.notificationAPI) {
                window.notificationAPI.showNotification('success', 'Ticket assigné avec succès')
              } else {
                alert('Ticket assigné avec succès')
              }
              this.loadTicket()
            } else {
              const errorMessage = result?.data?.message || result?.data?.error || result?.error || 'Erreur inconnue'
              alert('Erreur lors de l\'assignation du ticket: ' + errorMessage)
            }
          } catch (error) {
            console.error('Error assigning ticket:', error)
            alert('Erreur lors de l\'assignation du ticket: ' + error.message)
          }
        }
      })
    } catch (error) {
      console.error('Error fetching users for assignment:', error)
      alert('Erreur lors de la récupération des administrateurs: ' + error.message)
    }
  }

  async changeStatus() {
    const statusOptions = [
      { value: 'open', label: 'Ouvert' },
      { value: 'in_progress', label: 'En cours' },
      { value: 'closed', label: 'Fermé' },
      { value: 'resolved', label: 'Résolu' }
    ]
    this.showAdminModal({
      title: 'Modifier le statut',
      label: 'Nouveau statut',
      options: statusOptions,
      onSubmit: async (newStatus) => {
        if (!newStatus) return
        try {
          const result = await window.api.updateTicketStatus(this.ticketId, { status: newStatus })
          if (result && result.success) {
            this.loadTicket()
          } else {
            alert('Erreur lors de la mise à jour du statut du ticket: ' + (result?.error || 'Erreur inconnue'))
          }
        } catch (error) {
          console.error('Error changing ticket status:', error)
          alert('Erreur lors de la mise à jour du statut du ticket: ' + error.message)
        }
      }
    })
  }

  async changePriority() {
    const priorityOptions = [
      { value: 'low', label: 'Basse' },
      { value: 'medium', label: 'Moyenne' },
      { value: 'high', label: 'Haute' }
    ]
    this.showAdminModal({
      title: 'Modifier la priorité',
      label: 'Nouvelle priorité',
      options: priorityOptions,
      onSubmit: async (newPriority) => {
        if (!newPriority) return
        try {
          const result = await window.api.updateTicketPriority(this.ticketId, { priority: newPriority })
          if (result && result.success) {
            this.loadTicket()
          } else {
            alert('Erreur lors de la mise à jour de la priorité du ticket: ' + (result?.error || 'Erreur inconnue'))
          }
        } catch (error) {
          console.error('Error changing ticket priority:', error)
          alert('Erreur lors de la mise à jour de la priorité du ticket: ' + error.message)
        }
      }
    })
  }

  async deleteTicket() {
    if (this.ticket.status !== 'closed' && this.ticket.status !== 'resolved') {
      alert('Le ticket doit être fermé ou résolu avant d\'être supprimé')
      return
    }

    try {
      if (!window.api || !window.api.deleteTicket) {
        console.error('window.api.deleteTicket is not available!')
        alert('API de suppression non disponible')
        return
      }

      const result = await window.api.deleteTicket(this.ticketId)

      if (result && result.success) {
        if (window.notificationAPI) {
          window.notificationAPI.showNotification('success', 'Ticket supprimé avec succès')
        }
        setTimeout(() => {
          window.electronAPI.send('window:close')
        }, 500)
      } else {
        const errorMessage = result?.data?.message || result?.data?.error || result?.error || 'Erreur inconnue'
        console.error('Delete failed:', result)
        alert('Erreur lors de la suppression du ticket: ' + errorMessage)
      }
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Erreur lors de la suppression du ticket: ' + error.message)
    }
  }
}

// Instanciation unique de la page au chargement du script
new TicketDetailPage()
