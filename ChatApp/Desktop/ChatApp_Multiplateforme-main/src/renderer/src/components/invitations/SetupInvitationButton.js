import InvitationModal from './InvitationModal.js'
import ChatService from '../../../../main/services/ChatService.js'
import { t } from '../../lang/LanguageManager.js'

/**
 * Configure le bouton "Voir Invitations"
 * Affiche un modal avec toutes les invitations en attente
 */
export default async function SetupInvitationButton(chatInstance) {
  const btn = document.getElementById('receive-invite')
  if (!btn || !chatInstance) {
    console.warn('Bouton receive-invite ou chatInstance non trouvé')
    return
  }

  // Changer le texte du bouton
  const btnText = btn.querySelector('span')
  if (btnText) {
    btnText.textContent = t('buttons.invitations')
  }

  // Initialiser le service API
  const chatService = new ChatService()

  // Créer un badge pour afficher le nombre d'invitations
  const badge = document.createElement('span')
  badge.className = 'invitation-badge'
  badge.style.display = 'none'
  btn.appendChild(badge)

  /**
   * Mettre à jour le badge avec le nombre d'invitations
   */
  async function updateBadge() {
    try {
      const response = await chatService.getInvitationsCount()

      if (response.success && response.data.count > 0) {
        badge.textContent = response.data.count
        badge.style.display = 'inline-block'
      } else {
        badge.style.display = 'none'
      }
    } catch (error) {
      console.error(t('invitations.errorCount'), error)
    }
  }

  window.updateInvitationBadge = updateBadge

  // Mettre à jour le badge au chargement
  await updateBadge()

  // Événement du bouton
  btn.addEventListener('click', async () => {
    try {
      // Créer et afficher le modal
      const modal = new InvitationModal()
      await modal.show()

      // Mettre à jour le badge après fermeture du modal
      setTimeout(updateBadge, 500)
    } catch (error) {
      console.error(t('invitations.errorOpen'), error)
      alert(t('invitations.errorOpenAlert'))
    }
  })

  // Nettoyer l'interval lors de la destruction
  window.addEventListener('beforeunload', () => {
    delete window.updateInvitationBadge
  })
}
