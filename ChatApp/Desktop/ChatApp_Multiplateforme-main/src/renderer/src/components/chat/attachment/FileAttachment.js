/**
 * FileAttachment - Gère la sélection et l'envoi de fichiers en pièce jointe
 * Limite : 5MB par fichier
 */
import { t } from '../../../lang/LanguageManager.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

class FileAttachment {
  constructor() {
    this.fileInput = null
    this.selectedFile = null
    this.previewUI = null
    this.onSendCallback = null
    this.previewURLs = [] // Stocker les URLs blob pour les révoquer
  }

  /**
   * Ouvre le sélecteur de fichiers
   * @param {Function} onSend - Callback appelé avec le fichier quand l'utilisateur envoie
   */
  async selectFile(onSend) {
    this.onSendCallback = onSend

    // Créer un input file caché
    if (!this.fileInput) {
      this.fileInput = document.createElement('input')
      this.fileInput.type = 'file'
      this.fileInput.accept = '*/*' // Accepter tous les types de fichiers
      this.fileInput.style.display = 'none'
      document.body.appendChild(this.fileInput)
    }

    // Gérer la sélection de fichier
    this.fileInput.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        this.handleFileSelection(file)
      }
    }

    // Déclencher le sélecteur
    this.fileInput.click()
  }

  /**
   * Gère la sélection d'un fichier
   * @param {File} file - Le fichier sélectionné
   */
  handleFileSelection(file) {
    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      console.warn('[FileAttachment] Fichier trop volumineux:', file.size, 'octets')
      if (typeof window !== 'undefined' && window.notificationManager) {
        window.notificationManager.error(
          t('chat.attachment.fileTooLarge') ||
            `Le fichier ne peut pas dépasser ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          4000
        )
      }
      return
    }

    // Sauvegarder le fichier
    this.selectedFile = file

    console.log('[FileAttachment] Fichier sélectionné:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Afficher la prévisualisation
    this.showPreview()
  }

  /**
   * Affiche la prévisualisation du fichier
   */
  showPreview() {
    if (!this.selectedFile) return

    // Créer l'UI de prévisualisation
    this.previewUI = document.createElement('div')
    this.previewUI.className = 'file-preview-overlay'

    const fileName = this.selectedFile.name
    const fileSize = this.formatFileSize(this.selectedFile.size)
    const fileType = this.selectedFile.type || 'unknown'
    const fileIcon = this.getFileIcon(this.selectedFile)

    this.previewUI.innerHTML = `
      <div class="file-preview-content">
        <div class="file-preview-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <span data-i18n="chat.attachment.preview">Aperçu du fichier</span>
        </div>
        <div class="file-preview-body">
          <div class="file-preview-details">
            <div class="file-preview-icon">${fileIcon}</div>
            <div class="file-preview-info">
              <div class="file-preview-name" title="${fileName}">${fileName}</div>
              <div class="file-preview-meta">
                <span class="file-preview-size">${fileSize}</span>
                <span class="file-preview-type">${this.getReadableFileType(fileType)}</span>
              </div>
            </div>
          </div>
          ${this.getFilePreviewElement()}
          <div class="file-preview-actions">
            <button class="file-btn file-btn-cancel" data-action="cancel">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              <span data-i18n="chat.attachment.cancel">Annuler</span>
            </button>
            <button class="file-btn file-btn-send" data-action="send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
              <span data-i18n="chat.attachment.send">Envoyer</span>
            </button>
          </div>
        </div>
      </div>
    `

    // Ajouter au DOM
    const messagesContainer = document.querySelector('.messages-container')
    if (messagesContainer) {
      messagesContainer.appendChild(this.previewUI)
    }

    // Gestionnaires de clic
    const cancelBtn = this.previewUI.querySelector('[data-action="cancel"]')
    const sendBtn = this.previewUI.querySelector('[data-action="send"]')

    cancelBtn?.addEventListener('click', () => this.cancelAttachment())
    sendBtn?.addEventListener('click', () => this.sendFileAttachment())

    // Désactiver l'input de message
    const messageInput = document.querySelector('.message-input')
    const sendButton = document.querySelector('.send-button')
    const attachmentButton = document.querySelector('.attachment-button')

    if (messageInput) messageInput.disabled = true
    if (sendButton) sendButton.disabled = true
    if (attachmentButton) attachmentButton.disabled = true
  }

  /**
   * Génère l'élément de prévisualisation selon le type de fichier
   */
  getFilePreviewElement() {
    if (!this.selectedFile) return ''

    const fileType = this.selectedFile.type

    // Prévisualisation pour les images
    if (fileType.startsWith('image/')) {
      const imageURL = URL.createObjectURL(this.selectedFile)
      this.previewURLs.push(imageURL)

      return `
        <div class="file-preview-image">
          <img src="${imageURL}" alt="Preview">
        </div>
      `
    }

    // Prévisualisation pour les vidéos
    if (fileType.startsWith('video/')) {
      const videoURL = URL.createObjectURL(this.selectedFile)
      this.previewURLs.push(videoURL)

      return `
        <div class="file-preview-video">
          <video controls src="${videoURL}"></video>
        </div>
      `
    }

    // Prévisualisation pour l'audio
    if (fileType.startsWith('audio/')) {
      const audioURL = URL.createObjectURL(this.selectedFile)
      this.previewURLs.push(audioURL)

      return `
        <div class="file-preview-audio">
          <audio controls src="${audioURL}"></audio>
        </div>
      `
    }

    // Pas de prévisualisation pour les autres types
    return ''
  }

  /**
   * Obtient l'icône correspondant au type de fichier
   */
  getFileIcon(file) {
    const type = file.type

    if (type.startsWith('image/')) {
      return `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>`
    }

    if (type.startsWith('video/')) {
      return `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
      </svg>`
    }

    if (type.startsWith('audio/')) {
      return `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v9.28c-.46-.16-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
      </svg>`
    }

    if (
      type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    ) {
      return `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
      </svg>`
    }

    if (
      type.includes('zip') ||
      type.includes('rar') ||
      type.includes('7z') ||
      type.includes('tar') ||
      type.includes('gz')
    ) {
      return `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v4h5v12H6zm6-10h2v2h-2v-2zm0 3h2v2h-2v-2zm-2-1h2v2h-2v-2zm0 3h2v2h-2v-2z"/>
      </svg>`
    }

    // Icône générique pour les autres types
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>`
  }

  /**
   * Obtient un type de fichier lisible
   */
  getReadableFileType(mimeType) {
    if (!mimeType || mimeType === 'unknown') return 'Fichier'

    const typeMap = {
      'image/': 'Image',
      'video/': 'Vidéo',
      'audio/': 'Audio',
      'application/pdf': 'PDF',
      'application/zip': 'Archive ZIP',
      'application/x-rar': 'Archive RAR',
      'application/x-7z': 'Archive 7Z',
      'text/': 'Texte',
      'application/msword': 'Document Word',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'Document Word',
      'application/vnd.ms-excel': 'Tableur Excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'Tableur Excel',
      'application/vnd.ms-powerpoint': 'Présentation PowerPoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        'Présentation PowerPoint'
    }

    for (const [key, value] of Object.entries(typeMap)) {
      if (mimeType.startsWith(key) || mimeType === key) {
        return value
      }
    }

    return 'Fichier'
  }

  /**
   * Formate la taille du fichier
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Cache la prévisualisation
   */
  hidePreview() {
    if (this.previewUI) {
      this.previewUI.remove()
      this.previewUI = null
    }

    // Réactiver l'input de message
    const messageInput = document.querySelector('.message-input')
    const sendButton = document.querySelector('.send-button')
    const attachmentButton = document.querySelector('.attachment-button')

    if (messageInput) messageInput.disabled = false
    if (sendButton) sendButton.disabled = false
    if (attachmentButton) attachmentButton.disabled = false
  }

  /**
   * Annule l'envoi du fichier
   */
  cancelAttachment() {
    this.hidePreview()
    this.cleanup()
  }

  /**
   * Envoie le fichier
   */
  sendFileAttachment() {
    if (this.selectedFile && this.onSendCallback) {
      this.onSendCallback(this.selectedFile)
      this.hidePreview()
      this.cleanup()
    }
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    this.selectedFile = null

    // Révoquer les URLs blob
    if (this.previewURLs && this.previewURLs.length > 0) {
      this.previewURLs.forEach((url) => {
        try {
          URL.revokeObjectURL(url)
        } catch (e) {
          console.warn('[FileAttachment] Failed to revoke URL:', e)
        }
      })
      this.previewURLs = []
    }

    if (this.fileInput) {
      this.fileInput.value = ''
    }
  }

  /**
   * Nettoie toutes les ressources
   */
  destroy() {
    this.hidePreview()
    this.cleanup()

    if (this.fileInput) {
      this.fileInput.remove()
      this.fileInput = null
    }

    this.onSendCallback = null
  }
}

export default FileAttachment
