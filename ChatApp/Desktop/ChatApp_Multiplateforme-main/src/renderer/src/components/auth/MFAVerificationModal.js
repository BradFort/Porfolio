// Modal de vérification MFA affiché après un login nécessitant un code à 6 chiffres
// Gère :
//  - l’affichage du modal
//  - la saisie du code (6 inputs séparés)
//  - la vérification du code via l’API
//  - le renvoi d’un nouveau code avec compte à rebours
import { t } from '../../lang/LanguageManager.js'

class MFAVerificationModal {
  /**
   * @param {string} email     Email de l’utilisateur qui se connecte
   * @param {string} tempToken Jeton temporaire retourné par le backend après le login
   */
  constructor(email, tempToken) {
    // Données nécessaires pour l’appel API
    this.email = email
    this.tempToken = tempToken

    // Référence au DOM du modal
    this.modal = null

    // Tableau contenant les 6 inputs du code
    this.codeInputs = []

    // Identifiant du setInterval utilisé pour le compte à rebours de renvoi
    this.resendTimeout = null

    // Durée (en secondes) avant de pouvoir renvoyer un code
    this.resendCountdown = 60
  }

  /**
   * Affiche le modal et renvoie une Promise qui sera résolue ou rejetée
   * - resolve({ success, data }) si le code MFA est correct
   * - reject(error) si l’utilisateur annule ou en cas d’erreur
   */
  async show() {
    return new Promise((resolve, reject) => {
      // On garde les callbacks pour plus tard (verifyCode / close)
      this.resolve = resolve
      this.reject = reject

      // Création et insertion du DOM du modal
      this.createModal()
      document.body.appendChild(this.modal)

      // Petit délai pour être sûr que les inputs soient dans le DOM avant le focus
      setTimeout(() => {
        this.codeInputs[0]?.focus()
      }, 100)

      // Démarre le compte à rebours pour le bouton "Renvoyer le code"
      this.startResendCountdown()
    })
  }

  /**
   * Construit tout le DOM du modal (overlay, contenu, inputs, boutons, etc.)
   */
  createModal() {
    // Overlay en arrière-plan (fond semi-transparent)
    this.modal = document.createElement('div')
    this.modal.className = 'mfa-verification-modal-overlay'
    this.modal.id = 'mfa-verification-modal'

    // Conteneur principal du modal
    const modalContent = document.createElement('div')
    modalContent.className = 'mfa-verification-modal'

    // ----- HEADER -----
    const header = document.createElement('div')
    header.className = 'mfa-modal-header'

    const title = document.createElement('h2')
    // Titre fixe pour l’instant (non traduit)
    title.textContent = '🔐 Authentification Multi-Facteurs'
    header.appendChild(title)
    modalContent.appendChild(header)

    // ----- BODY -----
    const body = document.createElement('div')
    body.className = 'mfa-modal-body'

    // Description du fonctionnement
    const description = document.createElement('p')
    description.className = 'mfa-description'
    description.textContent =
      'Un code de vérification a été envoyé à votre adresse email. Veuillez entrer le code à 6 chiffres ci-dessous.'
    body.appendChild(description)

    // Affichage de l’email ciblé par le MFA
    const emailDisplay = document.createElement('p')
    emailDisplay.className = 'mfa-email-display'
    emailDisplay.textContent = `📧 ${this.email}`
    body.appendChild(emailDisplay)

    // Conteneur des 6 champs du code
    const codeContainer = document.createElement('div')
    codeContainer.className = 'mfa-code-container'
    codeContainer.id = 'mfa-code-container'

    // Création des 6 inputs (1 chiffre chacun)
    for (let i = 0; i < 6; i++) {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = 'mfa-code-input'
      input.maxLength = 1           // 1 seul caractère par input
      input.inputMode = 'numeric'   // Clavier numérique sur mobile
      input.pattern = '[0-9]'       // Seulement des chiffres
      input.id = `mfa-code-${i}`
      input.dataset.index = i       // Index stocké pour la navigation

      // Gestion de la frappe (auto focus input suivant, auto-verify, etc.)
      input.addEventListener('input', (e) => this.handleCodeInput(e, i))
      // Navigation clavier (Backspace, flèches, Enter)
      input.addEventListener('keydown', (e) => this.handleKeyDown(e, i))
      // Coller un code complet (6 chiffres) d’un coup
      input.addEventListener('paste', (e) => this.handlePaste(e))

      this.codeInputs.push(input)
      codeContainer.appendChild(input)
    }

    body.appendChild(codeContainer)

    // Zone d’affichage des messages d’erreur / succès
    const errorMessage = document.createElement('div')
    errorMessage.className = 'mfa-error-message'
    errorMessage.id = 'mfa-verify-error'
    body.appendChild(errorMessage)

    // ----- BOUTON "RENVOYER LE CODE" -----
    const resendContainer = document.createElement('div')
    resendContainer.className = 'mfa-resend-container'

    const resendBtn = document.createElement('button')
    resendBtn.className = 'mfa-resend-btn'
    resendBtn.id = 'mfa-resend-btn'
    // Désactivé au début, activé après le compte à rebours
    resendBtn.disabled = true
    resendBtn.textContent = 'Renvoyer le code (60s)'
    resendBtn.addEventListener('click', () => this.resendCode())
    resendContainer.appendChild(resendBtn)

    body.appendChild(resendContainer)

    modalContent.appendChild(body)

    // ----- FOOTER -----
    const footer = document.createElement('div')
    footer.className = 'mfa-modal-footer'

    // Bouton Annuler (ferme le modal et rejette la Promise)
    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'mfa-cancel-btn'
    cancelBtn.textContent = t('common.cancel') || 'Annuler'
    cancelBtn.addEventListener('click', () => this.close(false))

    // Bouton Vérifier (déclenche l’appel API verifyMFA)
    const verifyBtn = document.createElement('button')
    verifyBtn.className = 'mfa-verify-btn'
    verifyBtn.id = 'mfa-verify-btn'
    verifyBtn.textContent = 'Vérifier'
    verifyBtn.addEventListener('click', () => this.verifyCode())

    footer.appendChild(cancelBtn)
    footer.appendChild(verifyBtn)
    modalContent.appendChild(footer)

    // Ajout du contenu dans l’overlay
    this.modal.appendChild(modalContent)

    // Empêche la fermeture si on clique sur l’overlay (zone grise autour)
    // pour des raisons de sécurité (éviter un dismiss involontaire)
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        e.stopPropagation()
      }
    })
  }

  /**
   * Gestion de la saisie dans un input du code
   * - n’autorise que les chiffres
   * - passe au champ suivant automatiquement
   * - lance la vérification quand les 6 chiffres sont remplis
   */
  handleCodeInput(event, index) {
    const value = event.target.value

    // N’autorise que les chiffres (1 caractère)
    if (value && !/^\d$/.test(value)) {
      event.target.value = ''
      return
    }

    // Nettoie le message d’erreur dès que l’utilisateur retape quelque chose
    this.clearError()

    // Passe à l’input suivant si on vient d’entrer un chiffre
    if (value && index < 5) {
      this.codeInputs[index + 1].focus()
    }

    // Si on a déjà 6 chiffres, on déclenche automatiquement la vérification
    if (this.getCode().length === 6) {
      setTimeout(() => this.verifyCode(), 100)
    }
  }

  /**
   * Gestion des touches clavier dans les inputs
   * - Backspace : revient au champ précédent si vide
   * - Flèches gauche/droite : navigue entre les champs
   * - Entrée : lance la vérification
   */
  handleKeyDown(event, index) {
    // Retour arrière
    if (event.key === 'Backspace') {
      // Si l’input actuel est déjà vide, on efface le précédent
      if (!event.target.value && index > 0) {
        this.codeInputs[index - 1].focus()
        this.codeInputs[index - 1].value = ''
      }
    }
    // Flèche gauche : focus input précédent
    else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      this.codeInputs[index - 1].focus()
    }
    // Flèche droite : focus input suivant
    else if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault()
      this.codeInputs[index + 1].focus()
    }
    // Touche Entrée : lance la vérification
    else if (event.key === 'Enter') {
      event.preventDefault()
      this.verifyCode()
    }
  }

  /**
   * Permet de coller un code complet (6 chiffres) dans n’importe quel input
   */
  handlePaste(event) {
    event.preventDefault()
    const pasteData = event.clipboardData.getData('text').trim()

    // On accepte uniquement un code de 6 chiffres
    if (/^\d{6}$/.test(pasteData)) {
      pasteData.split('').forEach((digit, index) => {
        if (index < 6) {
          this.codeInputs[index].value = digit
        }
      })
      // Focus sur le dernier champ
      this.codeInputs[5].focus()

      // Lance la vérification un peu après pour laisser le DOM se mettre à jour
      setTimeout(() => this.verifyCode(), 100)
    }
  }

  /**
   * Concatène les 6 inputs pour obtenir le code complet
   */
  getCode() {
    return this.codeInputs.map((input) => input.value).join('')
  }

  /**
   * Réinitialise tous les inputs du code et remet le focus sur le premier
   */
  clearCode() {
    this.codeInputs.forEach((input) => {
      input.value = ''
    })
    this.codeInputs[0].focus()
  }

  /**
   * Affiche un message d’erreur dans la zone dédiée
   */
  showError(message) {
    const errorEl = document.getElementById('mfa-verify-error')
    if (errorEl) {
      errorEl.textContent = message
      errorEl.classList.add('show')
    }
  }

  /**
   * Cache le message d’erreur (et éventuel message de succès)
   */
  clearError() {
    const errorEl = document.getElementById('mfa-verify-error')
    if (errorEl) {
      errorEl.classList.remove('show')
    }
  }

  /**
   * Appelle l’API pour vérifier le code MFA saisi
   * - désactive le bouton pendant l’appel
   * - en cas de succès : resolve() la Promise de show() avec les données de login
   * - en cas d’échec : affiche un message et réactive le bouton
   */
  async verifyCode() {
    const code = this.getCode()

    // Vérifie que les 6 chiffres sont présents
    if (code.length !== 6) {
      this.showError('Veuillez entrer le code à 6 chiffres')
      return
    }

    const verifyBtn = document.getElementById('mfa-verify-btn')
    if (verifyBtn) {
      verifyBtn.disabled = true
      verifyBtn.textContent = 'Vérification...'
    }

    try {
      // Import dynamique de l’API côté main
      const API = (await import('../../../../main/api.js')).default
      const api = new API()

      // Appel au backend pour vérifier le code MFA
      const response = await api.verifyMFA(this.email, code, this.tempToken)

      if (response.success && response.data?.data) {
        // Succès : on renvoie les données de login au caller
        this.resolve({
          success: true,
          data: response.data.data
        })
        this.close(true)
      } else {
        // Code invalide ou expiré
        this.showError(response.data?.message || 'Code invalide ou expiré')
        this.clearCode()
        if (verifyBtn) {
          verifyBtn.disabled = false
          verifyBtn.textContent = 'Vérifier'
        }
      }
    } catch (error) {
      console.error('Error verifying MFA code:', error)
      this.showError('Erreur de connexion au serveur')
      if (verifyBtn) {
        verifyBtn.disabled = false
        verifyBtn.textContent = 'Vérifier'
      }
    }
  }

  /**
   * Renvoie un nouveau code MFA via l’API
   * - gère l’état du bouton et les messages d’erreur / succès
   * - relance le compte à rebours de 60s
   */
  async resendCode() {
    const resendBtn = document.getElementById('mfa-resend-btn')
    // Sécurité : si le bouton n’existe pas ou est déjà désactivé, on sort
    if (!resendBtn || resendBtn.disabled) return

    resendBtn.disabled = true
    resendBtn.textContent = 'Envoi en cours...'

    try {
      const API = (await import('../../../../main/api.js')).default
      const api = new API()

      const response = await api.resendMFA(this.email, this.tempToken)

      if (response.success) {
        // On nettoie les éventuelles erreurs précédentes et le code
        this.clearError()
        this.clearCode()

        // Affiche un message de succès temporaire dans la même zone que les erreurs
        const errorEl = document.getElementById('mfa-verify-error')
        if (errorEl) {
          errorEl.textContent = 'Code renvoyé avec succès'
          errorEl.classList.add('show', 'success')
          setTimeout(() => {
            errorEl.classList.remove('show', 'success')
          }, 3000)
        }

        // On relance le compte à rebours de 60 secondes
        this.resendCountdown = 60
        this.startResendCountdown()
      } else {
        this.showError(response.data?.message || 'Erreur lors du renvoi du code')
        resendBtn.disabled = false
        resendBtn.textContent = 'Renvoyer le code'
      }
    } catch (error) {
      console.error('Error resending MFA code:', error)
      this.showError('Erreur de connexion au serveur')
      resendBtn.disabled = false
      resendBtn.textContent = 'Renvoyer le code'
    }
  }

  /**
   * Lance et gère le compte à rebours avant de pouvoir renvoyer un code
   * - met à jour le texte du bouton chaque seconde
   * - réactive le bouton quand le timer atteint 0
   */
  startResendCountdown() {
    const resendBtn = document.getElementById('mfa-resend-btn')
    if (!resendBtn) return

    // Annule un éventuel timer précédent
    if (this.resendTimeout) {
      clearInterval(this.resendTimeout)
    }

    resendBtn.disabled = true

    const updateCountdown = () => {
      if (this.resendCountdown > 0) {
        resendBtn.textContent = `Renvoyer le code (${this.resendCountdown}s)`
        this.resendCountdown--
      } else {
        // Timer terminé : on réactive le bouton
        resendBtn.disabled = false
        resendBtn.textContent = 'Renvoyer le code'
        clearInterval(this.resendTimeout)
        this.resendTimeout = null
      }
    }

    // Mise à jour immédiate, puis toutes les secondes
    updateCountdown()
    this.resendTimeout = setInterval(updateCountdown, 1000)
  }

  /**
   * Ferme le modal et nettoie les timers
   * @param {boolean} success true si la vérification a réussi, false en cas d’annulation
   */
  close(success = false) {
    // Nettoie le compte à rebours s’il existe
    if (this.resendTimeout) {
      clearInterval(this.resendTimeout)
    }

    // Retire le modal du DOM
    if (this.modal && this.modal.parentNode) {
      this.modal.remove()
    }

    // Si on n’est pas en succès, on rejette la Promise de show()
    if (!success) {
      this.reject(new Error('MFA verification cancelled'))
    }
  }
}

export default MFAVerificationModal
