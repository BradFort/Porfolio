/**
 * Modal de paramètres E2EE - Version simplifiée
 * Interface utilisateur pour gérer le chiffrement et le code de récupération
 */

import E2EEManager from '../crypto/E2EEManager.js'

class E2EESettingsModal {
  constructor() {
    this.modal = null
    this.api = null
    this.isOpen = false
  }

  initialize(api) {
    this.api = api
    this.createModal()
    this.attachEventListeners()
  }

  createModal() {
    const modalHTML = `
      <div class="e2ee-modal" id="e2eeModal">
        <div class="e2ee-modal-content">
          <div class="e2ee-modal-header">
            <h2 class="e2ee-modal-title">
              <span class="e2ee-lock-icon">🔒</span>
              Chiffrement de bout en bout (E2EE)
            </h2>
            <button class="e2ee-modal-close" id="closeE2eeModal">&times;</button>
          </div>

          <!-- Statut E2EE -->
          <div class="e2ee-section">
            <div class="e2ee-section-title">Statut</div>
            <div class="e2ee-status">
              <div class="e2ee-status-indicator" id="e2eeStatusIndicator"></div>
              <span class="e2ee-status-text" id="e2eeStatusText">Chargement...</span>
            </div>
            <div class="e2ee-info-box">
              <p>Le chiffrement de bout en bout protège vos messages. Seuls vous et les destinataires pouvez les lire.</p>
            </div>
          </div>

          <!-- Code de récupération -->
          <div class="e2ee-section">
            <div class="e2ee-section-title">Code de récupération</div>
            <div class="e2ee-info-box warning">
              <p><strong>⚠️ Important :</strong> Ce code vous permet de récupérer vos clés sur un nouvel appareil. Ne le partagez jamais !</p>
            </div>
            <div class="e2ee-recovery-display" id="recoveryCodeDisplay">
              <code id="recoveryCodeText">••••••••-••••••••-••••••••</code>
            </div>
            <div style="display: flex; gap: 12px; margin-top: 12px;">
              <button class="e2ee-button secondary" id="showRecoveryCodeBtn">
                Afficher le code
              </button>
              <button class="e2ee-button secondary" id="copyRecoveryCodeBtn" disabled>
                Copier
              </button>
            </div>
          </div>

          <!-- Récupération sur nouvel appareil -->
          <div class="e2ee-section">
            <div class="e2ee-section-title">Récupérer sur nouvel appareil</div>
            <p style="color: #b9bbbe; margin-bottom: 12px;">
              Si vous utilisez un nouvel appareil, entrez votre code de récupération :
            </p>
            <input
              type="text"
              id="recoveryCodeInput"
              class="e2ee-input"
              placeholder="alpha-bravo-charlie-delta-echo-foxtrot-golf-hotel"
            />
            <button class="e2ee-button primary" id="recoverKeysBtn" style="margin-top: 12px;">
              🔓 Récupérer mes clés
            </button>
          </div>

          <!-- Actions -->
          <div class="e2ee-section">
            <div class="e2ee-section-title">Actions</div>
            <button class="e2ee-button danger" id="resetE2eeBtn">
              Réinitialiser E2EE
            </button>
            <p style="color: #f04747; font-size: 12px; margin-top: 8px;">
              Attention : Cette action supprimera toutes vos clés. Vous perdrez l'accès à vos messages chiffrés.
            </p>
          </div>
        </div>
      </div>
    `

    const container = document.createElement('div')
    container.innerHTML = modalHTML
    document.body.appendChild(container.firstElementChild)

    this.modal = document.getElementById('e2eeModal')
  }

  attachEventListeners() {
    // Fermer la modal
    document.getElementById('closeE2eeModal').addEventListener('click', () => {
      this.close()
    })

    // Clic en dehors de la modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close()
      }
    })

    // Afficher le code de récupération
    document.getElementById('showRecoveryCodeBtn').addEventListener('click', () => {
      this.showRecoveryCode()
    })

    // Copier le code de récupération
    document.getElementById('copyRecoveryCodeBtn').addEventListener('click', () => {
      this.copyRecoveryCode()
    })

    // Récupérer les clés
    document.getElementById('recoverKeysBtn').addEventListener('click', () => {
      this.recoverKeys()
    })

    // Réinitialiser E2EE
    document.getElementById('resetE2eeBtn').addEventListener('click', () => {
      this.resetE2EE()
    })
  }

  async open() {
    if (!this.modal) {
      console.error('[E2EESettings] Modal non initialisée')
      return
    }

    this.isOpen = true
    this.modal.style.display = 'flex'
    await this.updateStatus()
  }

  close() {
    if (this.modal) {
      this.isOpen = false
      this.modal.style.display = 'none'
      // Masquer le code de récupération
      const codeText = document.getElementById('recoveryCodeText')
      const copyBtn = document.getElementById('copyRecoveryCodeBtn')
      if (codeText) {
        codeText.textContent = '••••••••-••••••••-••••••••'
        copyBtn.disabled = true
      }
    }
  }

  async updateStatus() {
    const statusIndicator = document.getElementById('e2eeStatusIndicator')
    const statusText = document.getElementById('e2eeStatusText')

    if (E2EEManager.isInitialized()) {
      statusIndicator.className = 'e2ee-status-indicator active'
      statusText.textContent = 'E2EE activé et fonctionnel'
      statusText.style.color = '#43b581'
    } else {
      statusIndicator.className = 'e2ee-status-indicator inactive'
      statusText.textContent = 'E2EE non initialisé'
      statusText.style.color = '#f04747'
    }
  }

  showRecoveryCode() {
    const code = E2EEManager.getRecoveryCode()
    if (!code) {
      alert('Aucun code de récupération disponible')
      return
    }

    const confirmed = confirm(
      '⚠️ Attention !\n\n' +
        'Vous allez afficher votre code de récupération.\n' +
        'Assurez-vous que personne ne regarde votre écran.\n\n' +
        'Voulez-vous continuer ?'
    )

    if (confirmed) {
      const codeText = document.getElementById('recoveryCodeText')
      const copyBtn = document.getElementById('copyRecoveryCodeBtn')

      codeText.textContent = code
      copyBtn.disabled = false

      // Masquer automatiquement après 30 secondes
      setTimeout(() => {
        if (this.isOpen) {
          codeText.textContent = '••••••••-••••••••-••••••••'
          copyBtn.disabled = true
        }
      }, 30000)
    }
  }

  copyRecoveryCode() {
    const codeText = document.getElementById('recoveryCodeText')
    const code = codeText.textContent

    if (code.includes('•')) {
      alert("Veuillez d'abord afficher le code")
      return
    }

    navigator.clipboard
      .writeText(code)
      .then(() => {
        const btn = document.getElementById('copyRecoveryCodeBtn')
        const originalText = btn.textContent
        btn.textContent = '✓ Copié !'
        setTimeout(() => {
          btn.textContent = originalText
        }, 2000)
      })
      .catch((err) => {
        console.error('Erreur de copie:', err)
        alert('Erreur lors de la copie')
      })
  }

  async recoverKeys() {
    const input = document.getElementById('recoveryCodeInput')
    const code = input.value.trim()

    if (!code) {
      alert('Veuillez entrer un code de récupération')
      return
    }

    const confirmed = confirm(
      'Récupérer vos clés avec ce code ?\n\n' +
        'Cela remplacera vos clés actuelles si elles existent.'
    )

    if (!confirmed) return

    const btn = document.getElementById('recoverKeysBtn')
    btn.disabled = true
    btn.textContent = '⏳ Récupération en cours...'

    try {
      const success = await E2EEManager.recoverKeys(code)

      if (success) {
        alert('✅ Clés récupérées avec succès !')
        input.value = ''
        await this.updateStatus()
      } else {
        alert('❌ Échec de la récupération. Vérifiez votre code.')
      }
    } catch (error) {
      console.error('Erreur de récupération:', error)
      alert('❌ Erreur lors de la récupération')
    } finally {
      btn.disabled = false
      btn.textContent = '🔓 Récupérer mes clés'
    }
  }

  async resetE2EE() {
    const confirmed = confirm(
      'ATTENTION - ACTION IRRÉVERSIBLE\n\n' +
        'Vous allez supprimer toutes vos clés E2EE.\n' +
        "Vous perdrez l'accès à tous vos messages chiffrés.\n\n" +
        'Êtes-vous ABSOLUMENT sûr ?'
    )

    if (!confirmed) return

    try {
      await E2EEManager.reset()
    } catch (error) {
      console.error('Erreur de réinitialisation:', error)
      alert('❌ Erreur lors de la réinitialisation')
    }
  }
}

export default new E2EESettingsModal()
