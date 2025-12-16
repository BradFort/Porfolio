import { t } from '../../../lang/LanguageManager.js'

/**
 * Listener WebSocket déclenché lorsqu'une nouvelle invitation à rejoindre un salon est reçue.
 * Affiche une notification dans le client, une notification système et met à jour le badge d'invitations.
 * @param {import('../Chat.js').default} chat - Instance principale du chat (UI + état courant)
 * @param {import('../../../../main/services/ChatService.js').default} api - Service API / WebSocket
 */
export function onNewInvitation(chat, api) {
  api.websocketListener.on('new_invitation', async (data) => {
    const inviterName = data.inviter?.name || "Quelqu'un"
    const channelName = data.channel?.name || 'un salon'
    if (window.notificationManager) {
      window.notificationManager.info(
        t('notifications.newInvitation', { inviter: inviterName, channel: channelName }),
        5000
      )
    }

    if (window.electronAPI && window.electronAPI.showSystemNotification) {
      const message =
        data.message ||
        t('notifications.newInvitation', { inviter: inviterName, channel: channelName })
      window.electronAPI.showSystemNotification(
        t('notifications.newInvitation', { inviter: inviterName, channel: channelName }),
        message
      )
    }

    if (typeof window.updateInvitationBadge === 'function') {
      await window.updateInvitationBadge()
    }
  })
}
