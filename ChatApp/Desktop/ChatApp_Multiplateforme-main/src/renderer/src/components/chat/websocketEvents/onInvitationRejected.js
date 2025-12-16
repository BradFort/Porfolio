import { t } from '../../../lang/LanguageManager.js'

/**
 * Listener WebSocket déclenché lorsqu'une invitation est refusée.
 * Notifie uniquement l'utilisateur qui avait envoyé l'invitation.
 * @param {import('../Chat.js').default} chat - Instance principale du chat
 * @param {import('../../../../main/services/ChatService.js').default} api - Service API / WebSocket
 */
export function onInvitationRejected(chat, api) {
  api.websocketListener.on('invitation_rejected', async (data) => {
    const userName = data.user?.name || 'Un utilisateur'
    const channelName = data.channel?.name || 'le salon'

    // Only notify the inviter
    if (chat.currentUser.id === data.inviter_id) {
      if (window.notificationManager) {
        window.notificationManager.show(
          'info',
          t('notifications.invitationRejected', { user: userName, channel: channelName }),
          3000
        )
      }
    }
  })
}
