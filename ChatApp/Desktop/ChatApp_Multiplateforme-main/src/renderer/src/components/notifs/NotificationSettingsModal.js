// Modal de gestion des préférences de notifications (types activés/désactivés)
import { t } from '../../lang/LanguageManager.js'

class NotificationSettingsModal {
  constructor(chatService) {
    // Service de chat permettant d'appeler les endpoints liés aux notifications
    this.chatService = chatService
    // Élément DOM racine du modal
    this.modal = null
    // Liste de tous les types de notification disponibles
    this.types = []
    // IDs de types désactivés pour l'utilisateur courant
    this.disabledTypeIds = []
    // État local des toggles (idType -> bool enabled)
    this.toggles = {}
  }

  async show() {
    // Charge les types et l'état utilisateur, puis affiche le modal
    await this.loadNotificationTypes()
    this.createModal()
    document.body.appendChild(this.modal)
    setTimeout(() => {
      this.modal.querySelector('.notification-settings-modal')?.focus()
    }, 100)
  }

  async loadNotificationTypes() {
    // Récupère tous les types de notification définis côté backend
    const allTypesResp = await this.chatService.api.getNotificationTypes()
    this.types = Array.isArray(allTypesResp.data?.data) ? allTypesResp.data.data : []

    // Récupère la liste des types désactivés pour l'utilisateur
    const userId = this.chatService.currentUser?.id
    const disabledResp = await this.chatService.api.getUserNotificationTypes(userId)
    this.disabledTypeIds = Array.isArray(disabledResp.data?.data)
      ? disabledResp.data.data.map((nt) => nt.id)
      : []

    // Initialise l'état local des toggles à partir de disabledTypeIds
    this.toggles = {}
    for (const type of this.types) {
      this.toggles[type.id] = !this.disabledTypeIds.includes(type.id)
    }
  }

  // Construit dynamiquement tout le DOM du modal (header, liste des types, boutons)
  createModal() {
    const currentLang = (window.themeManager?.currentLang || 'fr').toLowerCase()
    this.modal = document.createElement('div')
    this.modal.className = 'invitation-modal-overlay'
    const modalContent = document.createElement('div')
    modalContent.className = 'notification-settings-modal invitation-modal'
    modalContent.tabIndex = -1

    // --- Header ---
    const header = document.createElement('div')
    header.className = 'modal-header'
    const title = document.createElement('h2')
    title.textContent = t('notifications.settingsTitle') || 'Notification Settings'
    header.appendChild(title)
    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-close'
    closeBtn.setAttribute('aria-label', t('common.close'))
    closeBtn.textContent = '×'
    closeBtn.addEventListener('click', () => this.close())
    header.appendChild(closeBtn)
    modalContent.appendChild(header)

    // --- Body ---
    const body = document.createElement('div')
    body.className = 'modal-body'
    const typesList = document.createElement('div')
    typesList.className = 'notification-types-list'

    if (this.types.length === 0) {
      // Aucun type de notification disponible côté backend
      const p = document.createElement('p')
      p.style.color = 'red'
      p.textContent = t('notifications.settingsPlaceholder') || 'No notification types available.'
      typesList.appendChild(p)
    } else {
      // Pour chaque type, créer une ligne avec libellé + switch on/off
      this.types.forEach((type) => {
        const row = document.createElement('div')
        row.className = 'notification-type-row'
        const label = document.createElement('span')
        label.className = 'notification-type-label'
        // Choisir la bonne langue pour l'intitulé du type (fr/en)
        label.textContent = currentLang === 'fr' ? type.type_fr : type.type_en
        const toggleLabel = document.createElement('label')
        toggleLabel.className = 'switch'
        const input = document.createElement('input')
        input.type = 'checkbox'
        input.setAttribute('data-type', type.id)
        if (this.toggles[type.id]) input.checked = true
        input.addEventListener('change', () => {
          // Met à jour l'état interne quand l'utilisateur coche/décoche
          this.toggles[type.id] = input.checked
        })
        const slider = document.createElement('span')
        slider.className = 'slider'
        toggleLabel.appendChild(input)
        toggleLabel.appendChild(slider)
        row.appendChild(label)
        row.appendChild(toggleLabel)
        typesList.appendChild(row)
      })
    }
    body.appendChild(typesList)

    // --- Footer (boutons) ---
    const footer = document.createElement('div')
    footer.className = 'modal-footer new-channel-modal-form-buttons'
    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = t('common.cancel')
    cancelBtn.addEventListener('click', () => this.close())
    const confirmBtn = document.createElement('button')
    confirmBtn.className = 'modal-confirm'
    confirmBtn.textContent = t('common.confirm')
    confirmBtn.addEventListener('click', () => this.confirm())
    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)
    body.appendChild(footer)

    modalContent.appendChild(body)
    this.modal.appendChild(modalContent)
    // Clique sur l'overlay = fermeture du modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close()
    })
  }

  // Applique les changements côté backend puis ferme le modal
  async confirm() {
    // Types désactivés = ceux dont le toggle est à false
    const disabledTypeIds = Object.keys(this.toggles).filter((typeId) => !this.toggles[typeId])
    const userId = this.chatService.currentUser?.id
    await this.chatService.api.toggleUserNotification(userId, disabledTypeIds)
    this.close()
  }

  // Retire le modal du DOM
  close() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal)
    }
  }
}

export default NotificationSettingsModal
