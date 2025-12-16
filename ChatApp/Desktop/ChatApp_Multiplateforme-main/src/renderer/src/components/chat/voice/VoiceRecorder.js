import { t } from '../../../lang/LanguageManager.js'

const MAX_DURATION = 60 // secondes

class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null
    this.audioChunks = []
    this.isRecording = false
    this.startTime = null
    this.durationInterval = null
    this.recordingUI = null
    this.previewUI = null
    this.audioBlob = null
    this.audioDuration = 0
    this.audioMimeType = null
    this.onSendCallback = null
  }

  /**
   * Démarre l'enregistrement audio
   * @param {Function} onSend - Callback appelé avec l'audio Blob, la durée et le mimeType quand l'utilisateur envoie
   */
  async startRecording(onSend) {
    this.onSendCallback = onSend

    try {
      // Demander la permission d'accès au micro
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      // Choix du format audio le plus compatible
      const formats = [
        'audio/ogg; codecs=opus',
        'audio/webm; codecs=opus',
        'audio/ogg',
        'audio/webm'
      ]

      let selectedMimeType = null
      for (const mimeType of formats) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }

      if (!selectedMimeType) {
        throw new Error('Aucun format audio supporté')
      }

      const options = {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 30000
      }

      this.mediaRecorder = new MediaRecorder(stream, options)
      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType })
        const duration = this.getRecordingDuration()

        stream.getTracks().forEach((track) => track.stop())

        if (duration < 1) {
          if (typeof window !== 'undefined' && window.notificationManager) {
            window.notificationManager.error(
              t('chat.voice.tooShort') || "L'enregistrement doit durer au moins 1 seconde",
              3000
            )
          }
          this.hideRecordingUI()
          return
        }

        if (audioBlob.size === 0) {
          if (typeof window !== 'undefined' && window.notificationManager) {
            window.notificationManager.error(
              t('chat.voice.emptyRecording') || "L'enregistrement est vide",
              3000
            )
          }
          this.hideRecordingUI()
          return
        }

        this.audioBlob = audioBlob
        this.audioDuration = duration
        this.audioMimeType = this.mediaRecorder.mimeType

        this.showPreview()
      }

      // Démarrer l'enregistrement (collecte de chunks toutes les 1s)
      this.mediaRecorder.start(1000)
      this.isRecording = true
      this.startTime = Date.now()

      this.showRecordingUI()
      this.startDurationCounter()

      // Arrêt automatique après 60s
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording()
        }
      }, MAX_DURATION * 1000)
    } catch (error) {
      console.error("[VoiceRecorder] Erreur lors de l'accès au microphone:", error)

      if (typeof window !== 'undefined' && window.notificationManager) {
        window.notificationManager.error(
          t('chat.voice.microphoneError') || "Impossible d'accéder au microphone",
          4000
        )
      }
    }
  }

  /**
   * Arrête l'enregistrement audio
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      this.stopDurationCounter()
    }
  }

  /**
   * Annule l'enregistrement
   */
  cancelRecording() {
    if (this.isRecording) {
      this.stopRecording()
    }

    this.hideRecordingUI()
    this.hidePreview()
    this.cleanup()
  }

  /**
   * Envoie le message vocal
   */
  sendVoiceMessage() {
    if (this.audioBlob && this.onSendCallback) {
      this.onSendCallback(this.audioBlob, this.audioDuration, this.audioMimeType)
      this.hidePreview()
      this.cleanup()
    }
  }

  /**
   * Démarre le compteur de durée
   */
  startDurationCounter() {
    this.durationInterval = setInterval(() => {
      const duration = this.getRecordingDuration()
      this.updateDurationDisplay(duration)

      if (duration >= MAX_DURATION) {
        this.stopRecording()
      }
    }, 100)
  }

  /**
   * Arrête le compteur de durée
   */
  stopDurationCounter() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval)
      this.durationInterval = null
    }
  }

  /**
   * Obtient la durée d'enregistrement en secondes
   */
  getRecordingDuration() {
    if (!this.startTime) return 0
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  /**
   * Met à jour l'affichage de la durée
   */
  updateDurationDisplay(seconds) {
    const durationEl = this.recordingUI?.querySelector('.voice-recording-duration')
    if (!durationEl) return

    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    durationEl.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Affiche l'UI d'enregistrement
   */
  showRecordingUI() {
    this.recordingUI = document.createElement('div')
    this.recordingUI.className = 'voice-recording-overlay'
    this.recordingUI.innerHTML = `
      <div class="voice-recording-content">
        <div class="voice-recording-header">
          <div class="voice-recording-icon recording-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          <span class="voice-recording-duration">0:00</span>
        </div>
        <div class="voice-recording-actions">
          <button class="voice-btn voice-btn-cancel" data-action="cancel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <span data-i18n="chat.voice.cancel">Annuler</span>
          </button>
          <button class="voice-btn voice-btn-stop" data-action="stop">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            <span data-i18n="chat.voice.stop">Arrêter</span>
          </button>
        </div>
      </div>
    `

    const messagesContainer = document.querySelector('.messages-container')
    if (messagesContainer) {
      messagesContainer.appendChild(this.recordingUI)
    }

    this.recordingUI.querySelector('[data-action="cancel"]')
      ?.addEventListener('click', () => this.cancelRecording())

    this.recordingUI.querySelector('[data-action="stop"]')
      ?.addEventListener('click', () => this.stopRecording())

    this.disableInputs(true)
  }

  /**
   * Cache l'UI d'enregistrement
   */
  hideRecordingUI() {
    if (this.recordingUI) {
      this.recordingUI.remove()
      this.recordingUI = null
    }

    this.disableInputs(false)
  }

  /**
   * Affiche la prévisualisation avec lecteur audio
   */
  showPreview() {
    this.hideRecordingUI()

    const audioURL = URL.createObjectURL(this.audioBlob)

    this.previewUI = document.createElement('div')
    this.previewUI.className = 'voice-preview-overlay'

    const minutes = Math.floor(this.audioDuration / 60)
    const seconds = this.audioDuration % 60

    this.previewUI.innerHTML = `
      <div class="voice-preview-content">
        <div class="voice-preview-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          <span data-i18n="chat.voice.preview">Prévisualisation</span>
          <span class="voice-preview-duration">${minutes}:${seconds.toString().padStart(2, '0')}</span>
        </div>
        <div class="voice-preview-player">
          <audio controls src="${audioURL}"></audio>
        </div>
        <div class="voice-preview-actions">
          <button class="voice-btn voice-btn-cancel" data-action="cancel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <span data-i18n="chat.voice.cancel">Annuler</span>
          </button>
          <button class="voice-btn voice-btn-send" data-action="send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
            <span data-i18n="chat.voice.send">Envoyer</span>
          </button>
        </div>
      </div>
    `

    const messagesContainer = document.querySelector('.messages-container')
    if (messagesContainer) {
      messagesContainer.appendChild(this.previewUI)
    }

    this.previewUI.querySelector('[data-action="cancel"]')
      ?.addEventListener('click', () => {
        URL.revokeObjectURL(audioURL)
        this.cancelRecording()
      })

    this.previewUI.querySelector('[data-action="send"]')
      ?.addEventListener('click', () => {
        URL.revokeObjectURL(audioURL)
        this.sendVoiceMessage()
      })

    this.disableInputs(true)
  }

  /**
   * Cache la prévisualisation
   */
  hidePreview() {
    if (this.previewUI) {
      this.previewUI.remove()
      this.previewUI = null
    }

    this.disableInputs(false)
  }

  /**
   * Active/désactive les inputs de message
   * @param {boolean} disabled - True pour désactiver, false pour activer
   */
  disableInputs(disabled) {
    const messageInput = document.querySelector('.message-input')
    const sendButton = document.querySelector('.send-button')
    const attachmentButton = document.querySelector('.attachment-button')

    if (messageInput) messageInput.disabled = disabled
    if (sendButton) sendButton.disabled = disabled
    if (attachmentButton) attachmentButton.disabled = disabled
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    this.audioBlob = null
    this.audioDuration = 0
    this.audioMimeType = null
    this.audioChunks = []
    this.startTime = null
    this.isRecording = false
  }

  /**
   * Nettoie toutes les ressources
   */
  destroy() {
    this.stopDurationCounter()

    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
    }

    this.hideRecordingUI()
    this.hidePreview()
    this.cleanup()
  }
}

export default VoiceRecorder