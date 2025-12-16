import { t } from '../../lang/LanguageManager.js'
import API from '../../../../main/api.js'

// Composant responsable de l'affichage du modal de création de ticket
class CreateTicket {
  constructor() {
    // Client HTTP vers l'API principale
    this.api = new API()
    // Référence vers l'élément DOM du modal (overlay)
    this.modal = null
  }

  // Affiche le modal : injections CSS, création du DOM, focus sur le champ sujet
  show() {
    this.injectStyles()
    this.createModal()
    document.body.appendChild(this.modal)
    setTimeout(() => {
      this.modal.querySelector('#ticket-subject')?.focus()
    }, 100)
  }

  // Ajoute dynamiquement les feuilles de style nécessaires si pas déjà présentes
  injectStyles() {
    const cssFiles = ['assets/css/main.css', 'assets/css/create-ticket.css']
    cssFiles.forEach((href) => {
      if (!document.querySelector(`link[href='${href}']`)) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = href
        document.head.appendChild(link)
      }
    })
  }

  // Construit tout le DOM du modal (overlay, container, formulaire...)
  createModal() {
    // Overlay du modal (fond assombri)
    this.modal = document.createElement('div')
    this.modal.className = 'invitation-modal-overlay create-ticket-modal-overlay'

    // Conteneur principal du contenu du modal
    const modalContent = document.createElement('div')
    modalContent.className = 'invitation-modal create-ticket-modal'
    modalContent.tabIndex = -1

    // === HEADER DU MODAL ===
    const modalHeader = document.createElement('div')
    modalHeader.className = 'modal-header'

    const heading = document.createElement('h2')
    heading.textContent = t('ticket.modal.title')
    modalHeader.appendChild(heading)

    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-close'
    closeBtn.setAttribute('aria-label', t('common.close'))
    closeBtn.innerHTML = '&times;'
    closeBtn.addEventListener('click', () => this.close())
    modalHeader.appendChild(closeBtn)
    modalContent.appendChild(modalHeader)

    // === CORPS DU MODAL ===
    const modalBody = document.createElement('div')
    modalBody.className = 'modal-body'

    const mainContainer = document.createElement('div')
    mainContainer.className = 'create-ticket-main-container'

    const container = document.createElement('div')
    container.className = 'create-ticket-container'

    const section = document.createElement('div')
    section.className = 'create-ticket-section'

    // === FORMULAIRE ===
    const form = document.createElement('form')
    form.id = 'create-ticket-form'
    form.className = 'create-ticket-form'
    form.noValidate = true

    // Champ Sujet
    const subjectDiv = document.createElement('div')
    subjectDiv.className = 'form-group'
    const subjectLabel = document.createElement('label')
    subjectLabel.htmlFor = 'ticket-subject'
    subjectLabel.textContent = t('ticket.modal.subjectLabel')
    subjectDiv.appendChild(subjectLabel)
    const subjectInput = document.createElement('input')
    subjectInput.type = 'text'
    subjectInput.id = 'ticket-subject'
    subjectInput.name = 'subject'
    subjectInput.className = 'form-input'
    subjectInput.placeholder = t('ticket.modal.subjectPlaceholder')
    subjectInput.maxLength = 100
    subjectDiv.appendChild(subjectInput)
    form.appendChild(subjectDiv)

    // Champ Description
    const descDiv = document.createElement('div')
    descDiv.className = 'form-group'
    const descLabel = document.createElement('label')
    descLabel.htmlFor = 'ticket-description'
    descLabel.textContent = t('ticket.modal.descriptionLabel')
    descDiv.appendChild(descLabel)
    const descInput = document.createElement('textarea')
    descInput.id = 'ticket-description'
    descInput.name = 'description'
    descInput.className = 'form-textarea'
    descInput.rows = 6
    descInput.placeholder = t('ticket.modal.descriptionPlaceholder')
    descInput.maxLength = 1000
    descDiv.appendChild(descInput)
    form.appendChild(descDiv)

    // Bloc Priorité (radio boutons)
    const priorityDiv = document.createElement('div')
    priorityDiv.className = 'form-group'
    const priorityLabel = document.createElement('label')
    priorityLabel.textContent = t('ticket.modal.priorityLabel')
    priorityDiv.appendChild(priorityLabel)

    const radioBox = document.createElement('div')
    radioBox.className = 'priority-radio-container'

    const priorities = ['low', 'medium', 'high']
    priorities.forEach((priority) => {
      const option = document.createElement('div')
      option.className = 'priority-radio-option'

      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.id = `priority-${priority}`
      radio.name = 'priority'
      radio.value = priority
      if (priority === 'medium') radio.checked = true // Par défaut: priorité moyenne
      option.appendChild(radio)

      const label = document.createElement('label')
      label.htmlFor = `priority-${priority}`
      label.className = 'priority-radio-label'
      // Libellés et descriptions de priorité traduits
      label.innerHTML = `<strong>${t(`ticket.modal.priority.${priority}`)}</strong> — <span>${t(`ticket.modal.priorityDesc.${priority}`)}</span>`
      option.appendChild(label)

      radioBox.appendChild(option)
    })

    priorityDiv.appendChild(radioBox)
    form.appendChild(priorityDiv)

    // === Boutons du formulaire ===
    const btnDiv = document.createElement('div')
    btnDiv.className = 'form-actions'

    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.className = 'btn-cancel'
    cancelBtn.textContent = t('ticket.modal.cancel')
    cancelBtn.addEventListener('click', () => this.close())
    btnDiv.appendChild(cancelBtn)

    const createBtn = document.createElement('button')
    createBtn.type = 'submit'
    createBtn.className = 'btn-send-invite'
    createBtn.textContent = t('ticket.modal.create')
    btnDiv.appendChild(createBtn)

    form.appendChild(btnDiv)

    // Assemblage de la hiérarchie DOM
    section.appendChild(form)
    container.appendChild(section)
    mainContainer.appendChild(container)
    modalBody.appendChild(mainContainer)
    modalContent.appendChild(modalBody)
    this.modal.appendChild(modalContent)

    // Fermeture en cliquant à l'extérieur du contenu du modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close()
    })

    // Soumission du formulaire (création du ticket)
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.handleSubmit(form, createBtn)
    })
  }

  // Gère la validation du formulaire et l'appel à l'API pour créer le ticket
  async handleSubmit(form, submitBtn) {
    const formData = new FormData(form)
    const subject = formData.get('subject')?.trim()
    const description = formData.get('description')?.trim()
    const priority = formData.get('priority')

    // === VALIDATION CÔTÉ CLIENT ===
    if (!subject) {
      window.notificationManager.error(t('ticket.errors.subjectRequired'))
      return
    }
    if (subject.length < 5) {
      window.notificationManager.error(t('ticket.errors.subjectTooShort'))
      return
    }
    if (subject.length > 100) {
      window.notificationManager.error(t('ticket.errors.subjectTooLong'))
      return
    }
    if (!description) {
      window.notificationManager.error(t('ticket.errors.descriptionRequired'))
      return
    }
    if (description.length < 10) {
      window.notificationManager.error(t('ticket.errors.descriptionTooShort'))
      return
    }
    if (description.length > 1000) {
      window.notificationManager.error(t('ticket.errors.descriptionTooLong'))
      return
    }

    // Désactive le bouton pendant l'envoi pour éviter les doubles clics
    const originalText = submitBtn.textContent
    submitBtn.disabled = true
    submitBtn.textContent = t('ticket.modal.creating')

    try {
      // Payload envoyé à l'API
      const ticketData = {
        title: subject,
        description: description,
        priority: priority
      }

      console.log('[CreateTicket] Sending ticket data:', ticketData)

      const result = await this.api.createTicket(ticketData)

      console.log('[CreateTicket] API Response:', result)

      if (result.success) {
        // Succès : on informe l'utilisateur et on ferme le modal
        window.notificationManager.success(t('ticket.success'))
        this.close()

        // Si le TicketManager est disponible, on rafraîchit la liste affichée ailleurs
        if (window.ticketManager && typeof window.ticketManager.refreshTickets === 'function') {
          window.ticketManager.refreshTickets()
        }
      } else {
        // Erreur renvoyée par l'API (ex: validation serveur)
        console.error('[CreateTicket] API Error:', result.data)
        const errorMsg = result.data?.message || t('ticket.errors.createError')

        if (result.data?.errors) {
          console.error('[CreateTicket] Validation errors:', result.data.errors)
          Object.keys(result.data.errors).forEach((field) => {
            console.error(`  - ${field}:`, result.data.errors[field])
          })
        }

        window.notificationManager.error(errorMsg)
      }
    } catch (error) {
      // Exception réseau/JS imprévue
      console.error('[CreateTicket] Exception:', error)
      window.notificationManager.error(t('ticket.errors.createError'))
    } finally {
      // Réactive le bouton et remet le texte d'origine
      submitBtn.disabled = false
      submitBtn.textContent = originalText
    }
  }

  // Ferme le modal et nettoie le DOM
  close() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal)
    }
    this.modal = null
  }
}

export default CreateTicket
