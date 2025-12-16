import { t } from '../../lang/LanguageManager.js'

// Composant modal qui affiche la liste des tickets sous forme de cartes cliquables
class TicketListModal {
  constructor(ticketManager) {
    // Référence vers le TicketManager pour pouvoir ouvrir le détail d'un ticket
    this.ticketManager = ticketManager
    // Référence vers l'élément DOM du modal
    this.modal = null
  }

  // Affiche le modal avec la liste de tickets fournie
  show(tickets = []) {
    this.createModal(tickets)
    document.body.appendChild(this.modal)
  }

  // Construit tout le DOM du modal de liste
  createModal(tickets) {
    // Overlay du modal (fond assombri)
    this.modal = document.createElement('div')
    this.modal.className = 'invitation-modal-overlay ticket-list-modal-overlay'
    this.modal.style.cssText = 'z-index: 9998;'

    // Conteneur principal du contenu du modal
    const modalContent = document.createElement('div')
    modalContent.className = 'invitation-modal ticket-list-modal'
    modalContent.style.cssText = 'width: 900px; max-width: 95vw; max-height: 90vh;'
    modalContent.tabIndex = -1

    // === HEADER DU MODAL ===
    const modalHeader = document.createElement('div')
    modalHeader.className = 'modal-header'
    modalHeader.style.cssText = 'padding: 20px 25px;'

    const heading = document.createElement('h2')
    heading.textContent = t('ticket.list.title') || 'Mes Tickets'
    heading.style.cssText = 'font-size: 18px; margin: 0;'
    modalHeader.appendChild(heading)

    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-close'
    closeBtn.setAttribute('aria-label', t('common.close'))
    closeBtn.innerHTML = '&times;'
    // Empêche la propagation pour ne pas déclencher le clic sur l'overlay
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.close()
    })
    modalHeader.appendChild(closeBtn)
    modalContent.appendChild(modalHeader)

    // === CORPS DU MODAL ===
    const modalBody = document.createElement('div')
    modalBody.className = 'modal-body'
    modalBody.style.cssText = 'max-height: 70vh; overflow-y: auto; padding: 25px;'

    // Si aucun ticket, affiche un message vide
    if (tickets.length === 0) {
      const emptyMsg = document.createElement('div')
      emptyMsg.className = 'ticket-list-empty'
      emptyMsg.textContent = t('ticket.list.empty') || 'Aucun ticket pour le moment'
      emptyMsg.style.cssText = `
        text-align: center;
        padding: 60px 20px;
        color: var(--xp-text-light);
        font-size: 16px;
      `
      modalBody.appendChild(emptyMsg)
    } else {
      // Pour chaque ticket, on crée une "carte" visuelle
      tickets.forEach((ticket) => {
        const ticketCard = this.createTicketCard(ticket)
        modalBody.appendChild(ticketCard)
      })
    }

    modalContent.appendChild(modalBody)
    this.modal.appendChild(modalContent)

    // Fermeture en cliquant sur l'overlay (en dehors du contenu)
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close()
    })

    // Fermeture avec la touche Échap
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.close()
        document.removeEventListener('keydown', escapeHandler)
      }
    }
    document.addEventListener('keydown', escapeHandler)
  }

  // Crée la carte d'un ticket (titre, badges, description, date...)
  createTicketCard(ticket) {
    const card = document.createElement('div')
    card.className = 'ticket-card'
    card.style.cssText = `
      background: var(--xp-gray-light);
      border: 2px solid var(--xp-border);
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 20px;
      cursor: pointer;
      transition: all 0.2s;
    `

    // Couleurs associées à chaque statut
    const statusColors = {
      open: '#4CAF50',
      in_progress: '#FF9800',
      closed: '#9E9E9E',
      resolved: '#2196F3'
    }

    // Couleurs associées à chaque priorité
    const priorityColors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336'
    }

    // === HEADER DE LA CARTE ===
    const cardHeader = document.createElement('div')
    cardHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      gap: 15px;
    `

    const ticketTitle = document.createElement('h3')
    ticketTitle.textContent = ticket.title
    ticketTitle.style.cssText = `
      color: var(--xp-text);
      margin: 0;
      font-size: 16px;
      font-weight: bold;
      flex: 1;
      line-height: 1.4;
    `
    cardHeader.appendChild(ticketTitle)

    const badges = document.createElement('div')
    badges.style.cssText = 'display: flex; gap: 10px; flex-shrink: 0;'

    // Badge de statut (couleur en fonction du statut)
    const statusBadge = document.createElement('span')
    statusBadge.textContent = this.translateStatus(ticket.status)
    statusBadge.style.cssText = `
      background: ${statusColors[ticket.status] || '#9E9E9E'};
      color: white;
      padding: 5px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
    `
    badges.appendChild(statusBadge)

    // Badge de priorité (couleur en fonction de la priorité)
    const priorityBadge = document.createElement('span')
    priorityBadge.textContent = this.translatePriority(ticket.priority)
    priorityBadge.style.cssText = `
      background: ${priorityColors[ticket.priority] || '#9E9E9E'};
      color: white;
      padding: 5px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
    `
    badges.appendChild(priorityBadge)

    cardHeader.appendChild(badges)
    card.appendChild(cardHeader)

    // === DESCRIPTION (tronquée à 150 caractères) ===
    const description = document.createElement('p')
    description.textContent =
      ticket.description.substring(0, 150) + (ticket.description.length > 150 ? '...' : '')
    description.style.cssText = `
      color: var(--xp-text-light);
      margin: 0 0 15px 0;
      font-size: 13px;
      line-height: 1.6;
    `
    card.appendChild(description)

    // === FOOTER AVEC DATE ET ID DU TICKET ===
    const footer = document.createElement('div')
    footer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--xp-text-light);
      padding-top: 15px;
      border-top: 1px solid var(--xp-border);
    `

    const date = document.createElement('span')
    // Formatage de la date en français
    date.textContent = `Cree le ${new Date(ticket.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`
    footer.appendChild(date)

    const ticketId = document.createElement('span')
    ticketId.textContent = `Ticket #${ticket.id}`
    ticketId.style.cssText = 'font-weight: bold; color: var(--xp-blue);'
    footer.appendChild(ticketId)

    card.appendChild(footer)

    // Effets visuels au survol
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = 'var(--xp-blue)'
      card.style.transform = 'translateY(-2px)'
      card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
    })

    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'var(--xp-border)'
      card.style.transform = 'translateY(0)'
      card.style.boxShadow = 'none'
    })

    // Clic sur la carte : ferme la liste et ouvre le détail du ticket
    card.addEventListener('click', async () => {
      this.close()
      await this.ticketManager.viewTicket(ticket.id)
    })

    return card
  }

  // Traduction "rapide" des statuts côté client (sans passer par i18n)
  translateStatus(status) {
    const translations = {
      open: 'Ouvert',
      in_progress: 'En cours',
      closed: 'Ferme',
      resolved: 'Resolu'
    }
    return translations[status] || status
  }

  // Traduction "rapide" des priorités côté client (sans passer par i18n)
  translatePriority(priority) {
    const translations = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute'
    }
    return translations[priority] || priority
  }

  // Ferme le modal et nettoie le DOM
  close() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal)
    }
    this.modal = null
  }
}

export default TicketListModal
