// Gestion de l'état "réseau"/présence de l'utilisateur dans le chat
import { getCurrentUser } from '../../auth/auth.js'
import API from '../../../../../main/api.js'
import { t } from '../../../lang/LanguageManager.js'

class EtatManager {
  constructor() {
    // Client API pour parler au backend (mise à jour de l'utilisateur)
    this.api = new API()
    // Lance l'initialisation de l'état au chargement
    this.init()
  }

  async init() {
    // Met l'UI dans un état cohérent dès le départ
    this.initializeCurrentState()
  }

  // Initialise l'état d'affichage (texte + icône) au démarrage
  initializeCurrentState() {
    // S'assurer que l'état initial correspond à l'icône
    const networkStatus = document.getElementById('network-status')
    const statusText = document.getElementById('network-text')

    if (networkStatus && statusText) {
      // Par défaut, on considère que c'est "Connecté"
      this.updateStatusIcon(networkStatus, 'connected')
      statusText.innerText = t('status.connected')
    }
  }

  // Met à jour les classes CSS de l'icône de statut réseau
  updateStatusIcon(networkStatusElement, statusClass) {
    // Retire toutes les classes de statut réseau existantes
    networkStatusElement.classList.remove('connected', 'disconnected', 'reconnecting')
    // Ajoute la nouvelle classe de statut réseau
    networkStatusElement.classList.add(statusClass)
  }

  // Change l'état affiché (texte + icône) et le persiste côté backend pour l'utilisateur courant
  async setEtat(etat) {
    const statusText = document.getElementById('network-text')
    const networkStatus = document.getElementById('network-status')

    if (!statusText || !networkStatus) {
      console.warn('Éléments de statut non trouvés dans le DOM')
      return { success: false, message: 'Éléments DOM non trouvés' }
    }

    // Association entre texte traduit et classe CSS correspondante
    const statusClassMap = {
      [t('status.connected')]: 'connected',
      [t('status.reconnecting')]: 'reconnecting',
      [t('status.disconnected')]: 'disconnected'
    }

    // Classe utilisée pour l'icône (fallback sur "disconnected" si texte non reconnu)
    const statusClass = statusClassMap[etat] || 'disconnected'

    // Mise à jour de l'affichage immédiat côté UI
    statusText.innerText = etat
    this.updateStatusIcon(networkStatus, statusClass)

    // Persistance de l'état côté serveur pour l'utilisateur courant
    try {
      return await this.updateUserEtat(etat)
    } catch (error) {
      console.error(t('status.updateFailed') + ':', error)
      return { success: false, message: error.message }
    }
  }

  // Envoie la nouvelle valeur d'état au backend pour l'utilisateur connecté
  async updateUserEtat(etat) {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return
      }

      return await this.api.updateUser(currentUser.id, { etat })
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'état:", error)
      return { success: false, message: error.message }
    }
  }
}

// Instancie automatiquement le gestionnaire d'état au chargement du DOM
// et l'expose sur window pour permettre son utilisation ailleurs (ex: boutons UI)
document.addEventListener('DOMContentLoaded', () => {
  window.etatManager = new EtatManager()
})

export default EtatManager
