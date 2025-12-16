import { t, languageManager } from '../../lang/LanguageManager.js'
import API from '../../../../main/api.js'
import CreateTicket from './CreateTicket.js'
import TicketListModal from './TicketListModal.js'

// Classe responsable de la gestion des tickets côté interface (création, liste, actions admin)
class TicketManager {
  constructor() {
    // Client HTTP vers l'API principale
    this.api = new API()
    // Cache local des tickets chargés
    this.tickets = []
    // Ticket actuellement sélectionné (si besoin d'affichage de détails dans le futur)
    this.currentTicket = null
    // Modal réutilisable d'affichage de la liste des tickets
    this.listModal = new TicketListModal(this)
    // Références vers les boutons de la toolbar
    this.ticketButton = null
    this.viewTicketsButton = null
  }

  /**
   * Initialise le gestionnaire de tickets
   * - ajoute les boutons dans le menu et la toolbar
   * - branche l'écouteur de changement de langue
   */
  init() {
    // Ajoute les boutons "Créer un ticket" et "Mes tickets"
    this.addTicketButton()

    // Quand la langue change, on met à jour les libellés des boutons
    languageManager.onChange(() => {
      this.updateButtonLabels()
    })

    // Expose le manager globalement pour être accessible ailleurs (ex: CreateTicket)
    window.ticketManager = this
  }

  /**
   * Ajoute un bouton pour créer un ticket dans le menu d'aide
   * et deux boutons dans la toolbar (Créer / Mes tickets)
   */
  addTicketButton() {
    // --- Bouton dans le menu Aide ---
    const helpMenu = document.querySelector('[data-menu="help"]')
    if (helpMenu) {
      const ticketMenuItem = document.createElement('div')
      ticketMenuItem.className = 'menu-item'
      ticketMenuItem.textContent = t('ticket.createButton')
      ticketMenuItem.addEventListener('click', () => this.openCreateTicketModal())
      helpMenu.appendChild(ticketMenuItem)
    }

    // --- Boutons dans la toolbar ---
    const toolbar = document.querySelector('.toolbar')
    if (toolbar) {
      // Bouton "Créer Ticket"
      this.ticketButton = document.createElement('button')
      this.ticketButton.className = 'toolbar-button ticket-button'
      this.ticketButton.title = t('ticket.createButton')
      this.ticketButton.setAttribute('data-ticket-btn', 'create')

      const icon = document.createElement('div')
      icon.className = 'toolbar-icon create-ticket'
      this.ticketButton.appendChild(icon)

      const text = document.createElement('span')
      text.textContent = t('ticket.createButton')
      text.setAttribute('data-ticket-text', 'create')
      this.ticketButton.appendChild(text)

      // Ouverture du modal de création au clic
      this.ticketButton.addEventListener('click', () => this.openCreateTicketModal())
      toolbar.appendChild(this.ticketButton)

      // Bouton "Mes Tickets" pour ouvrir la liste
      this.viewTicketsButton = document.createElement('button')
      this.viewTicketsButton.className = 'toolbar-button view-tickets-button'
      this.viewTicketsButton.title = t('ticket.viewTickets')
      this.viewTicketsButton.setAttribute('data-ticket-btn', 'view')

      const viewIcon = document.createElement('div')
      viewIcon.className = 'toolbar-icon view-tickets'
      this.viewTicketsButton.appendChild(viewIcon)

      const viewText = document.createElement('span')
      viewText.textContent = t('ticket.viewTickets')
      viewText.setAttribute('data-ticket-text', 'view')
      this.viewTicketsButton.appendChild(viewText)

      // Affiche le modal de liste des tickets
      this.viewTicketsButton.addEventListener('click', () => this.showTicketList())
      toolbar.appendChild(this.viewTicketsButton)
    }
  }

  /**
   * Met à jour les labels et tooltips des boutons selon la langue
   */
  updateButtonLabels() {
    if (this.ticketButton) {
      const text = this.ticketButton.querySelector('[data-ticket-text="create"]')
      if (text) {
        text.textContent = t('ticket.createButton')
      }
      this.ticketButton.title = t('ticket.createButton')
    }

    if (this.viewTicketsButton) {
      const text = this.viewTicketsButton.querySelector('[data-ticket-text="view"]')
      if (text) {
        text.textContent = t('ticket.viewTickets')
      }
      this.viewTicketsButton.title = t('ticket.viewTickets')
    }
  }

  /**
   * Ouvre le modal de création de ticket
   * (le composant CreateTicket gère son propre DOM)
   */
  openCreateTicketModal() {
    const createTicket = new CreateTicket()
    createTicket.show()
  }

  /**
   * Affiche la liste des tickets dans un modal
   */
  async showTicketList() {
    // On recharge les tickets avant d'afficher la liste pour avoir les données à jour
    await this.refreshTickets()
    this.listModal.show(this.tickets)
  }

  /**
   * Rafraîchit la liste des tickets depuis l'API
   * et stocke le résultat dans this.tickets
   */
  async refreshTickets() {
    try {
      const result = await this.api.getTickets()
      if (result.success) {
        // L'API peut renvoyer le tableau dans data.data ou directement data,
        // d'où le chaînage avec fallback
        this.tickets = result.data?.data || result.data || []
        console.log('Tickets loaded:', this.tickets)
      } else {
        console.error('Error fetching tickets:', result.data?.message)
        window.notificationManager?.error(
          t('ticket.errors.loadError') || 'Erreur lors du chargement des tickets'
        )
      }
    } catch (error) {
      console.error('Error refreshing tickets:', error)
      window.notificationManager?.error(
        t('ticket.errors.loadError') || 'Erreur lors du chargement des tickets'
      )
    }
  }

  /**
   * Ouvre le détail d'un ticket dans une nouvelle fenêtre Electron
   * (appel au main process via electronAPI)
   */
  async viewTicket(ticketId) {
    // Ouvrir une nouvelle fenêtre Electron pour le ticket
    const result = await window.electronAPI.invoke('ticket:openDetail', ticketId)
    if (!result.success) {
      window.notificationManager?.error('Erreur lors de l\'ouverture du ticket')
    }
  }

  /**
   * Affiche les détails d'un ticket
   * (actuellement juste un log, mais pourrait être étendu)
   */
  renderTicketDetails() {
    if (!this.currentTicket) return
    console.log('Ticket details:', this.currentTicket)
  }

  /**
   * Ajoute un commentaire à un ticket donné
   */
  async addComment(ticketId, commentText) {
    try {
      const result = await this.api.addTicketComment(ticketId, {
        content: commentText
      })

      if (result.success) {
        window.notificationManager?.success(t('ticket.success'))
        // Après ajout du commentaire, on rouvre/rafraîchit la fenêtre de détail
        await this.viewTicket(ticketId)
      } else {
        window.notificationManager?.error(t('ticket.errors.createError'))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      window.notificationManager?.error(t('ticket.errors.createError'))
    }
  }

  /**
   * Met à jour le statut d'un ticket (action d'admin)
   */
  async updateTicketStatus(ticketId, status) {
    try {
      const result = await this.api.updateTicketStatus(ticketId, { status })

      if (result.success) {
        window.notificationManager?.success(t('ticket.success'))
        // On recharge la liste pour refléter le nouveau statut
        await this.refreshTickets()
      } else {
        window.notificationManager?.error(t('ticket.errors.createError'))
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      window.notificationManager?.error(t('ticket.errors.createError'))
    }
  }

  /**
   * Met à jour la priorité d'un ticket (action d'admin)
   */
  async updateTicketPriority(ticketId, priority) {
    try {
      const result = await this.api.updateTicketPriority(ticketId, { priority })

      if (result.success) {
        window.notificationManager?.success(t('ticket.success'))
        // On recharge la liste pour refléter la nouvelle priorité
        await this.refreshTickets()
      } else {
        window.notificationManager?.error(t('ticket.errors.createError'))
      }
    } catch (error) {
      console.error('Error updating ticket priority:', error)
      window.notificationManager?.error(t('ticket.errors.createError'))
    }
  }

  /**
   * Assigne un ticket à un admin (action d'admin)
   */
  async assignTicket(ticketId, adminId) {
    try {
      const result = await this.api.assignTicket(ticketId, { admin_id: adminId })

      if (result.success) {
        window.notificationManager?.success(t('ticket.success'))
        // On recharge la liste pour refléter l'assignation
        await this.refreshTickets()
      } else {
        window.notificationManager?.error(t('ticket.errors.createError'))
      }
    } catch (error) {
      console.error('Error assigning ticket:', error)
      window.notificationManager?.error(t('ticket.errors.createError'))
    }
  }
}

export default TicketManager
