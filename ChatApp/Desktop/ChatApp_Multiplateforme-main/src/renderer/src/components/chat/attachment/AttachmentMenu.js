/**
 * AttachmentMenu - Gère le menu des pièces jointes et messages vocaux
 */

class AttachmentMenu {
  constructor() {
    this.button = null
    this.menu = null
    this.isOpen = false
    this.onVoiceMessageClick = null
    this.onFileAttachmentClick = null
  }

  /**
   * Initialise le menu
   * @param {Function} onVoiceMessageClick - Callback quand "Message vocal" est cliqué
   * @param {Function} onFileAttachmentClick - Callback quand "Pièce jointe" est cliqué
   */
  init(onVoiceMessageClick, onFileAttachmentClick) {
    this.button = document.querySelector('.attachment-button')
    this.menu = document.querySelector('.attachment-menu')

    if (!this.button || !this.menu) {
      console.warn('[AttachmentMenu] Bouton ou menu non trouvé')
      return
    }

    this.onVoiceMessageClick = onVoiceMessageClick
    this.onFileAttachmentClick = onFileAttachmentClick

    // Gestionnaire de clic sur le bouton
    this.button.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggle()
    })

    // Gestionnaires de clic sur les items du menu
    const voiceItem = this.menu.querySelector('[data-action="voice"]')
    const fileItem = this.menu.querySelector('[data-action="file"]')

    if (voiceItem) {
      voiceItem.addEventListener('click', (e) => {
        e.stopPropagation()
        this.close()
        if (this.onVoiceMessageClick) {
          this.onVoiceMessageClick()
        }
      })
    }

    if (fileItem && !fileItem.classList.contains('attachment-menu-item-disabled')) {
      fileItem.addEventListener('click', (e) => {
        e.stopPropagation()
        this.close()
        if (this.onFileAttachmentClick) {
          this.onFileAttachmentClick()
        }
      })
    }

    // Fermer le menu quand on clique ailleurs
    document.addEventListener('click', () => {
      this.close()
    })

    // Empêcher la propagation du clic sur le menu
    this.menu.addEventListener('click', (e) => {
      e.stopPropagation()
    })
  }

  /**
   * Ouvre le menu
   */
  open() {
    if (this.menu) {
      this.menu.style.display = 'block'
      this.isOpen = true
      this.button?.classList.add('active')
    }
  }

  /**
   * Ferme le menu
   */
  close() {
    if (this.menu) {
      this.menu.style.display = 'none'
      this.isOpen = false
      this.button?.classList.remove('active')
    }
  }

  /**
   * Toggle le menu
   */
  toggle() {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  /**
   * Active le bouton
   */
  enable() {
    if (this.button) {
      this.button.disabled = false
    }
  }

  /**
   * Désactive le bouton
   */
  disable() {
    if (this.button) {
      this.button.disabled = true
    }
    this.close()
  }

  /**
   * Nettoie les ressources
   */
  destroy() {
    this.close()
    this.button = null
    this.menu = null
    this.onVoiceMessageClick = null
    this.onFileAttachmentClick = null
  }
}

export default AttachmentMenu
