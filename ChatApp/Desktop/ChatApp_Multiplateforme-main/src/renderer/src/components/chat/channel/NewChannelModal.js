// Modal de création de salon intégrée dans la fenêtre principale du chat
import { t } from '../../../lang/LanguageManager.js'
import API from '../../../../../main/api.js'

class NewChannelModal {
  constructor(chat = null) {
    // API utilisée pour communiquer avec le backend
    this.api = new API()
    // Élément DOM du modal courant
    this.modal = null
    // Référence optionnelle vers l'instance de Chat pour rafraîchir la liste des salons
    this.chat = chat
  }

  // Affiche le modal à l'écran
  show() {
    this.injectStyles()
    this.createModal()
    document.body.appendChild(this.modal)
    // Donne le focus au contenu principal une fois le modal inséré
    setTimeout(() => {
      this.modal.querySelector('.main-container')?.focus()
    }, 100)
  }

  // S'assure que les CSS nécessaires au modal sont chargées
  injectStyles() {
    // Feuilles de style partagées pour les modals / création de salon
    const cssFiles = ['assets/css/main.css', 'assets/css/create-channel.css']
    cssFiles.forEach((href) => {
      if (!document.querySelector(`link[href='${href}']`)) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = href
        document.head.appendChild(link)
      }
    })
  }

  // Construit tout le DOM du modal (overlay + contenu + formulaire)
  createModal() {
    // Overlay global semi-transparent
    this.modal = document.createElement('div')
    this.modal.className = 'invitation-modal-overlay new-channel-modal-overlay'

    // Conteneur principal du contenu du modal
    const modalContent = document.createElement('div')
    modalContent.className = 'invitation-modal new-channel-modal'
    modalContent.tabIndex = -1
    // Dimensions et styles de base (on complète le CSS)
    modalContent.style.width = '420px'
    modalContent.style.height = '480px'
    modalContent.style.maxWidth = '90vw'
    modalContent.style.maxHeight = '90vh'
    modalContent.style.margin = '40px auto'
    modalContent.style.boxShadow = '0 2px 24px rgba(0,0,0,0.18)'
    modalContent.style.background = 'var(--xp-gray-light)'
    modalContent.style.position = 'relative'
    modalContent.style.right = '0'
    modalContent.style.overflow = 'auto'

    // --- En-tête du modal (barre bleue) ---
    const modalHeader = document.createElement('div')
    modalHeader.className = 'modal-header'

    // Titre
    const heading = document.createElement('h2')
    heading.textContent = t('pages.createChannel.heading')
    heading.className = '' // on laisse le style par défaut du h2 via CSS
    modalHeader.appendChild(heading)

    // Bouton de fermeture (X) dans le header
    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-close'
    closeBtn.setAttribute('aria-label', t('common.close'))
    closeBtn.innerHTML = '&times;'
    closeBtn.addEventListener('click', () => this.close())
    modalHeader.appendChild(closeBtn)
    modalContent.appendChild(modalHeader)

    // --- Corps du modal ---
    const modalBody = document.createElement('div')
    modalBody.className = 'modal-body'
    modalBody.style.height = 'calc(100% - 56px)'
    modalBody.style.display = 'flex'
    modalBody.style.flexDirection = 'column'
    modalBody.style.justifyContent = 'stretch'
    modalBody.style.alignItems = 'stretch'
    modalBody.style.overflow = 'auto'

    // Conteneur principal interne
    const mainContainer = document.createElement('div')
    mainContainer.className = 'new-channel-modal-main-container'
    mainContainer.style.flex = '1 1 auto'
    mainContainer.style.display = 'flex'
    mainContainer.style.flexDirection = 'column'
    mainContainer.style.justifyContent = 'stretch'
    mainContainer.style.alignItems = 'stretch'
    mainContainer.style.height = '100%'
    mainContainer.style.width = '100%'

    // Conteneur du formulaire
    const container = document.createElement('div')
    container.className = 'new-channel-modal-container'
    container.style.flex = '1 1 auto'
    container.style.display = 'flex'
    container.style.flexDirection = 'column'
    container.style.justifyContent = 'stretch'
    container.style.alignItems = 'stretch'
    container.style.height = '100%'
    container.style.width = '100%'
    container.style.position = 'relative'
    container.style.maxWidth = '100%'
    container.style.minWidth = '0'

    // Section qui contient le formulaire
    const section = document.createElement('div')
    section.className = 'new-channel-modal-section'
    section.style.flex = '1 1 auto'
    section.style.display = 'flex'
    section.style.flexDirection = 'column'
    section.style.justifyContent = 'stretch'
    section.style.alignItems = 'stretch'
    section.style.height = '100%'
    section.style.width = '100%'
    section.style.minWidth = '0'

    // --- Formulaire de création de salon ---
    const form = document.createElement('form')
    form.id = 'create-channel-form'
    form.className = 'new-channel-modal-form new-dm-form'
    form.noValidate = true
    form.style.flex = '1 1 auto'
    form.style.display = 'flex'
    form.style.flexDirection = 'column'
    form.style.justifyContent = 'space-between'
    form.style.height = '100%'
    form.style.width = '100%'
    form.style.gap = '15px'
    form.style.minWidth = '0'

    // Champ : nom du salon
    const nameDiv = document.createElement('div')
    nameDiv.className = 'new-channel-modal-name-div'
    const nameLabel = document.createElement('label')
    nameLabel.htmlFor = 'channel-name'
    nameLabel.className = 'new-channel-modal-label'
    nameLabel.textContent = t('pages.createChannel.nameLabel')
    nameDiv.appendChild(nameLabel)
    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.id = 'channel-name'
    nameInput.name = 'channelName'
    nameInput.className = 'new-channel-modal-input'
    nameInput.placeholder = t('pages.createChannel.namePlaceholder')
    nameInput.style.width = '100%'
    nameInput.style.boxSizing = 'border-box'
    nameDiv.appendChild(nameInput)
    form.appendChild(nameDiv)

    // Champ : description du salon
    const descDiv = document.createElement('div')
    descDiv.className = 'new-channel-modal-desc-div'
    const descLabel = document.createElement('label')
    descLabel.htmlFor = 'channel-description'
    descLabel.className = 'new-channel-modal-label'
    descLabel.textContent = t('pages.createChannel.descLabel')
    descDiv.appendChild(descLabel)
    const descInput = document.createElement('textarea')
    descInput.id = 'channel-description'
    descInput.name = 'channelDescription'
    descInput.className = 'new-channel-modal-textarea'
    descInput.rows = 3
    descInput.placeholder = t('pages.createChannel.descPlaceholder')
    descInput.style.width = '100%'
    descInput.style.boxSizing = 'border-box'
    descDiv.appendChild(descInput)
    form.appendChild(descDiv)

    // Bloc : choix du type de salon (public / privé)
    const typeDiv = document.createElement('div')
    typeDiv.className = 'new-channel-modal-type-div'
    const typeLabel = document.createElement('label')
    typeLabel.className = 'new-channel-modal-label'
    typeLabel.textContent = t('pages.createChannel.typeLabel')
    typeDiv.appendChild(typeLabel)

    // Conteneur des radios
    const radioBox = document.createElement('div')
    radioBox.className = 'new-channel-modal-radio-container'
    radioBox.style.background = 'var(--xp-gray-dark)'
    radioBox.style.border = '2px inset var(--xp-gray-light)'
    radioBox.style.padding = '12px'
    radioBox.style.width = '100%'
    radioBox.style.boxSizing = 'border-box'
    radioBox.style.marginTop = '8px'
    radioBox.style.display = 'flex'
    radioBox.style.flexDirection = 'column'
    radioBox.style.gap = '10px'

    // Option : salon public
    const publicOption = document.createElement('div')
    publicOption.className = 'new-channel-modal-radio-option'
    publicOption.style.display = 'flex'
    publicOption.style.alignItems = 'center'
    const publicRadio = document.createElement('input')
    publicRadio.type = 'radio'
    publicRadio.id = 'public'
    publicRadio.name = 'channelType'
    publicRadio.value = 'public'
    publicRadio.checked = true
    publicOption.appendChild(publicRadio)
    const publicLabel = document.createElement('label')
    publicLabel.htmlFor = 'public'
    publicLabel.className = 'new-channel-modal-radio-option-label'
    publicLabel.innerHTML = `<strong>${t('pages.createChannel.type.public')}</strong> — <span>${t('pages.createChannel.publicDesc')}</span>`
    publicLabel.style.marginLeft = '8px'
    publicOption.appendChild(publicLabel)
    radioBox.appendChild(publicOption)

    // Option : salon privé
    const privateOption = document.createElement('div')
    privateOption.className = 'new-channel-modal-radio-option'
    privateOption.style.display = 'flex'
    privateOption.style.alignItems = 'center'
    const privateRadio = document.createElement('input')
    privateRadio.type = 'radio'
    privateRadio.id = 'private'
    privateRadio.name = 'channelType'
    privateRadio.value = 'private'
    privateOption.appendChild(privateRadio)
    const privateLabel = document.createElement('label')
    privateLabel.htmlFor = 'private'
    privateLabel.className = 'new-channel-modal-radio-option-label'
    privateLabel.innerHTML = `<strong>${t('pages.createChannel.type.private')}</strong> — <span>${t('pages.createChannel.privateDesc')}</span>`
    privateLabel.style.marginLeft = '8px'
    privateOption.appendChild(privateLabel)
    radioBox.appendChild(privateOption)

    typeDiv.appendChild(radioBox)
    form.appendChild(typeDiv)

    // --- Boutons du formulaire ---
    const btnDiv = document.createElement('div')
    btnDiv.className = 'form-actions'

    // Bouton Annuler (ferme le modal)
    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.id = 'cancel-btn'
    cancelBtn.className = 'btn-cancel'
    cancelBtn.textContent = t('pages.createChannel.cancel')
    cancelBtn.setAttribute('tabindex', '0')
    cancelBtn.setAttribute('aria-label', t('pages.createChannel.cancel'))
    cancelBtn.addEventListener('click', () => this.close())
    btnDiv.appendChild(cancelBtn)

    // Bouton Créer (soumission du formulaire)
    const createBtn = document.createElement('button')
    createBtn.type = 'submit'
    createBtn.id = 'create-btn'
    createBtn.className = 'btn-send-invite'
    createBtn.textContent = t('pages.createChannel.create')
    btnDiv.appendChild(createBtn)
    form.appendChild(btnDiv)

    section.appendChild(form)
    container.appendChild(section)
    mainContainer.appendChild(container)
    modalBody.appendChild(mainContainer)
    modalContent.appendChild(modalBody)
    this.modal.appendChild(modalContent)
    // --- FIN : construction du contenu du modal ---

    // Clic sur l'overlay (en dehors du contenu) = fermeture du modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close()
    })

    // Logique de soumission du formulaire (validation + appel API)
    form.addEventListener('submit', async (e) => {
      e.preventDefault()

      const formData = new FormData(form)
      const channelName = formData.get('channelName')?.trim()
      const channelDescription = formData.get('channelDescription')?.trim()
      const channelType = formData.get('channelType')

      // --- VALIDATIONS côté client ---
      if (!channelName) {
        window.notificationManager.error(t('pages.createChannel.errors.nameRequired'))
        return
      }
      if (channelName.length < 3) {
        window.notificationManager.error(t('pages.createChannel.errors.nameTooShort'))
        return
      }
      if (channelName.length > 50) {
        window.notificationManager.error(t('pages.createChannel.errors.nameTooLong'))
        return
      }
      if (channelDescription && channelDescription.length > 255) {
        window.notificationManager.error(t('pages.createChannel.errors.descTooLong'))
        return
      }

      // Payload envoyé à l'API
      const channelData = {
        name: channelName,
        description: channelDescription || '',
        type: channelType
      }

      const result = await this.api.createChannel(channelData)
      if (result.success) {
        // Notifier l'utilisateur du succès
        window.notificationManager.success(t('pages.createChannel.success'))

        try {
          // Récupérer l'objet salon retourné par l'API dans les différents formats possibles
          const created = result.data?.data || result.channel || result.data || null

          if (this.chat) {
            // Si l'API renvoie bien le salon créé, on l'insère / remplace en local
            if (created && created.id) {
              if (!Array.isArray(this.chat.channels)) this.chat.channels = []
              const ix = this.chat.channels.findIndex((c) => String(c.id) === String(created.id))
              if (ix === -1) this.chat.channels.push(created)
              else this.chat.channels[ix] = created

              if (typeof this.chat.refreshChannelListUi === 'function') {
                this.chat.refreshChannelListUi()
              } else if (typeof this.chat.init === 'function') {
                this.chat.init()
              }
            } else {
              // Sinon, on retélécharge la liste complète des salons depuis l'API
              try {
                let resp
                if (this.chat.api && typeof this.chat.api.getChannels === 'function') {
                  resp = await this.chat.api.getChannels()
                } else {
                  resp = await this.api.getChannels()
                }

                this.chat.channels = Array.isArray(resp?.data?.data?.data)
                  ? resp.data.data.data
                  : []
                if (typeof this.chat.refreshChannelListUi === 'function') {
                  this.chat.refreshChannelListUi()
                } else if (typeof this.chat.init === 'function') {
                  this.chat.init()
                }
              } catch (err) {
                console.warn('NewChannelModal: failed to refresh channels after create', err)
                // Fallback : réinitialiser le chat au complet
                try {
                  if (typeof this.chat.init === 'function') this.chat.init()
                } catch (initErr) {
                  console.warn('NewChannelModal: fallback init also failed', initErr)
                }
              }
            }
          }
        } catch (err) {
          console.warn('NewChannelModal: local chat update failed', err)
        }

        // Fermeture du modal après succès
        this.close()
      } else {
        // Erreur renvoyée par l'API (message direct ou message générique)
        const errorMessage = result.data?.message || t('pages.createChannel.errors.creationFailed')
        window.notificationManager.error(errorMessage)
      }
    })
  }

  // Ferme le modal et nettoie la référence DOM
  close() {
    if (this.modal) {
      this.modal.remove()
      this.modal = null
    }
  }
}

export default NewChannelModal
