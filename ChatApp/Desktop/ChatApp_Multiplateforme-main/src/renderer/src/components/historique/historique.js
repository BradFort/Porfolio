// ---------------- Gestion des statuts ----------------
// Ce module gère l'affichage de l'état réseau (connecté/déconnecté/en reconnexion)
// et synchronise cet état avec l'affichage du statut utilisateur dans l'UI.
import { t } from '../../lang/LanguageManager.js'

// Liste des états possibles, avec :
//  - text       : texte traduit à afficher
//  - class      : classe CSS appliquée à l'icône réseau
//  - userStatus : classe CSS appliquée à l'utilisateur (online/offline/reconnecting)
//  - color      : couleur indicative (utile si besoin dans le futur)
const statuses = [
  {
    text: t('status.connected'),
    class: 'connected',
    userStatus: 'online',
    color: 'green'
  },
  {
    text: t('status.disconnected'),
    class: 'disconnected',
    userStatus: 'offline',
    color: 'red'
  },
  {
    text: t('status.reconnecting'),
    class: 'reconnecting',
    userStatus: 'reconnecting',
    color: 'orange'
  }
]

// Index courant dans le tableau statuses (0 = connecté au démarrage)
let currentStatusIndex = 0

// Références vers les éléments DOM utilisés pour l'affichage du statut
const networkStatus = document.getElementById('network-status')
const networkText = document.getElementById('network-text')
const toggleStatus = document.getElementById('toggle-status')
const userStatus = document.getElementById('user-status')
const statusIndicator = document.getElementById('status-indicator')

// Applique le statut courant (statuses[currentStatusIndex]) sur l'UI
function updateStatus() {
  const status = statuses[currentStatusIndex]

  // Met à jour l'icône réseau (couleur / style)
  networkStatus.className = `network-status ${status.class}`
  // Met à jour le texte d'état réseau (connecté, déconnecté, ...)
  networkText.textContent = status.text

  // Pour l'utilisateur, on affiche "En ligne" quand l'état réseau est "connecté",
  // sinon on réutilise directement le texte de status (déconnecté, en reconnexion, ...)
  userStatus.textContent = status.text === t('status.connected') ? t('status.online') : status.text
  userStatus.className = `user-status ${status.userStatus}`
  // Petit indicateur coloré (pastille) lié au statut utilisateur
  statusIndicator.className = `status-indicator ${status.userStatus}`
}

// Au clic sur le bouton de bascule, on passe au statut suivant dans le tableau
// (cycle : connecté -> déconnecté -> en reconnexion -> connecté -> ...)
toggleStatus.addEventListener('click', () => {
  currentStatusIndex = (currentStatusIndex + 1) % statuses.length
  updateStatus()
})

// Initialisation de l'affichage au chargement du module
updateStatus()
