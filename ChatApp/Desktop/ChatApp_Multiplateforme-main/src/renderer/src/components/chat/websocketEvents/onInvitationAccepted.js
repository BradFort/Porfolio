import { t } from '../../../lang/LanguageManager.js'

/**
 * Listener WebSocket déclenché lorsqu'une invitation à un salon est acceptée.
 * Notifie l'invitant, rafraîchit la sidebar utilisateurs et la liste de salons.
 * @param {import('../Chat.js').default} chat - Instance principale du chat
 * @param {import('../../../../main/services/ChatService.js').default} api - Service API / WebSocket
 */
export function onInvitationAccepted(chat, api) {
  api.websocketListener.on('invitation_accepted', async (data) => {
    const userName = data.user?.name || 'Un utilisateur'
    const channelName = data.channel?.name || 'le salon'

    if (chat.currentUser.id === data.inviter_id) {
      if (window.notificationManager) {
        window.notificationManager.show(
          'success',
          t('notifications.invitationAccepted', { user: userName, channel: channelName }),
          4000
        )
      }
    }

    if (String(data.channel_id) === String(chat.currentChannelId)) {
      chat.updateUserSidebar(data.channel_id)
    }

    // Refresh channels list to update member counts
    const channelsResp = await api.getChannels()
    chat.channels = Array.isArray(channelsResp.data?.data?.data) ? channelsResp.data.data.data : []
    chat.refreshChannelListUi()
  })
}
