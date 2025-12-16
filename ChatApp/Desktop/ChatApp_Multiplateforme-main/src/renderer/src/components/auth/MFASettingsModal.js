// Modal de configuration de l'authentification multi-facteurs (MFA)
// - Permet d'activer/désactiver la MFA pour l'utilisateur courant
// - Demande le mot de passe lors de la désactivation pour plus de sécurité
import { t } from '../../lang/LanguageManager.js'

class MFASettingsModal {
  constructor(chatService) {
    // Service de chat (permet d'accéder à api.toggleMFA et api.me)
    this.chatService = chatService
    // Élément racine du modal
    this.modal = null
    // État courant MFA (activé ou non)
    this.mfaEnabled = false
    // Utilisateur courant récupéré depuis l'API
    this.currentUser = null
  }

  // Affiche le modal : charge d'abord les données utilisateur puis construit le DOM
  async show() {
    await this.loadUserData()
    this.createModal()
    document.body.appendChild(this.modal)
    setTimeout(() => {
      this.modal.querySelector('.mfa-settings-modal')?.focus()
    }, 100)
  }

  // Charge les informations utilisateur (dont le flag mfa_enabled)
  async loadUserData() {
    try {
      const userResp = await this.chatService.api.me()
      if (userResp.success && userResp.data?.data) {
        this.currentUser = userResp.data.data
        this.mfaEnabled = !!this.currentUser.mfa_enabled
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  // Crée toute la structure DOM du modal (header, body, footer, toggle, etc.)
  createModal() {
    this.modal = document.createElement('div')
    this.modal.className = 'mfa-settings-modal-overlay'

    const modalContent = document.createElement('div')
    modalContent.className = 'mfa-settings-modal'
    modalContent.tabIndex = -1

    // Header
    const header = document.createElement('div')
    header.className = 'modal-header'
    const title = document.createElement('h2')
    title.textContent = '🔐 Authentification Multi-Facteurs (MFA)'
    header.appendChild(title)
    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-close'
    closeBtn.setAttribute('aria-label', t('common.close') || 'Close')
    closeBtn.textContent = '×'
    closeBtn.addEventListener('click', () => this.close())
    header.appendChild(closeBtn)
    modalContent.appendChild(header)

    // Body
    const body = document.createElement('div')
    body.className = 'modal-body'

    // Description
    const description = document.createElement('div')
    description.className = 'mfa-toggle-description'
    description.textContent =
      "L'authentification multi-facteurs ajoute une couche de sécurité supplémentaire à votre compte. Un code de vérification sera envoyé à votre email à chaque connexion."
    body.appendChild(description)

    // Toggle container
    const toggleContainer = document.createElement('div')
    toggleContainer.className = 'mfa-toggle-container'

    const toggleLabel = document.createElement('span')
    toggleLabel.className = 'mfa-toggle-label'
    toggleLabel.textContent = 'Activer MFA'

    const toggleSwitch = document.createElement('label')
    toggleSwitch.className = 'switch'

    const toggleInput = document.createElement('input')
    toggleInput.type = 'checkbox'
    toggleInput.id = 'mfa-toggle-input'
    toggleInput.checked = this.mfaEnabled

    const slider = document.createElement('span')
    slider.className = 'slider'

    toggleSwitch.appendChild(toggleInput)
    toggleSwitch.appendChild(slider)

    toggleContainer.appendChild(toggleLabel)
    toggleContainer.appendChild(toggleSwitch)
    body.appendChild(toggleContainer)

    // Password section (shown only when disabling MFA)
    const passwordSection = document.createElement('div')
    passwordSection.className = 'mfa-password-section'
    passwordSection.id = 'mfa-password-section'

    const passwordLabel = document.createElement('label')
    passwordLabel.textContent = 'Mot de passe requis pour désactiver MFA:'
    passwordLabel.setAttribute('for', 'mfa-password-input')

    const passwordInput = document.createElement('input')
    passwordInput.type = 'password'
    passwordInput.id = 'mfa-password-input'
    passwordInput.placeholder = 'Entrez votre mot de passe'

    passwordSection.appendChild(passwordLabel)
    passwordSection.appendChild(passwordInput)
    body.appendChild(passwordSection)

    // Error message
    const errorMessage = document.createElement('div')
    errorMessage.className = 'mfa-error-message'
    errorMessage.id = 'mfa-error-message'
    body.appendChild(errorMessage)

    // Success message
    const successMessage = document.createElement('div')
    successMessage.className = 'mfa-success-message'
    successMessage.id = 'mfa-success-message'
    body.appendChild(successMessage)

    modalContent.appendChild(body)

    // Footer
    const footer = document.createElement('div')
    footer.className = 'modal-footer'

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = t('common.cancel') || 'Annuler'
    cancelBtn.addEventListener('click', () => this.close())

    const confirmBtn = document.createElement('button')
    confirmBtn.className = 'modal-confirm'
    confirmBtn.textContent = t('common.confirm') || 'Confirmer'
    confirmBtn.addEventListener('click', () => this.handleConfirm())

    footer.appendChild(cancelBtn)
    footer.appendChild(confirmBtn)
    modalContent.appendChild(footer)

    this.modal.appendChild(modalContent)

    // Event listener for toggle switch
    toggleInput.addEventListener('change', (e) => {
      const isChecked = e.target.checked
      if (!isChecked && this.mfaEnabled) {
        // Trying to disable MFA - show password section
        passwordSection.classList.add('show')
      } else {
        // Enabling MFA or toggle was already off
        passwordSection.classList.remove('show')
      }
    })

    // Close modal when clicking outside
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close()
      }
    })
  }

  // Gère le clic sur "Confirmer" : appelle l'API toggleMFA et met à jour l'UI en fonction du résultat
  async handleConfirm() {
    const toggleInput = document.getElementById('mfa-toggle-input')
    const passwordInput = document.getElementById('mfa-password-input')
    const passwordSection = document.getElementById('mfa-password-section')
    const errorMessage = document.getElementById('mfa-error-message')
    const successMessage = document.getElementById('mfa-success-message')
    const confirmBtn = this.modal.querySelector('.modal-confirm')

    // Hide previous messages
    errorMessage.classList.remove('show')
    successMessage.classList.remove('show')

    const newMfaState = toggleInput.checked

    // If disabling MFA, check password
    if (!newMfaState && this.mfaEnabled) {
      const password = passwordInput.value.trim()
      if (!password) {
        errorMessage.textContent = 'Veuillez entrer votre mot de passe'
        errorMessage.classList.add('show')
        return
      }
    }

    // Disable confirm button during request
    confirmBtn.disabled = true

    try {
      const password = passwordInput.value.trim() || null
      const response = await this.chatService.api.toggleMFA(newMfaState, password)

      if (response.success) {
        this.mfaEnabled = newMfaState
        successMessage.textContent =
          response.data?.message ||
          (newMfaState ? 'MFA activé avec succès' : 'MFA désactivé avec succès')
        successMessage.classList.add('show')

        // Close modal after 2 seconds
        setTimeout(() => {
          this.close()
        }, 2000)
      } else {
        errorMessage.textContent =
          response.data?.message || 'Une erreur est survenue lors de la modification de MFA'
        errorMessage.classList.add('show')
        // Reset toggle to previous state
        toggleInput.checked = this.mfaEnabled
        passwordSection.classList.remove('show')
      }
    } catch (error) {
      console.error('Error toggling MFA:', error)
      errorMessage.textContent = 'Erreur de connexion au serveur'
      errorMessage.classList.add('show')
      // Reset toggle to previous state
      toggleInput.checked = this.mfaEnabled
      passwordSection.classList.remove('show')
    } finally {
      confirmBtn.disabled = false
    }
  }

  // Ferme et détruit le modal
  close() {
    if (this.modal && this.modal.parentNode) {
      this.modal.remove()
    }
  }
}

export default MFASettingsModal
