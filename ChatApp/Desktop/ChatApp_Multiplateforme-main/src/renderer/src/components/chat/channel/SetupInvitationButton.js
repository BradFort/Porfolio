/**

import { getMockChannels } from '../mockData.js'



export default function SetupInvitationButton(chatInstance) {
  const btn = document.getElementById('receive-invite')
  if (!btn || !chatInstance) return

  btn.addEventListener('click', () => {
    const allMockChannels = getMockChannels(chatInstance.currentUser)
    const notInChannels = allMockChannels.filter(
      (ch) =>
        ch.type === 'private' &&
        !(ch.userList && ch.userList.some((u) => u.id === chatInstance.currentUser.id))
    )
    if (notInChannels.length === 0) return
    const invitedChannel = notInChannels[0]
    const accept = window.confirm(
      `Voulez-vous accepter l'invitation au salon privé : "${invitedChannel.name}" ?`
    )
    if (!accept) return
    invitedChannel.userList.push(chatInstance.currentUser)
    if (!chatInstance.channels.some((c) => c.id === invitedChannel.id)) {
      chatInstance.channels.push(invitedChannel)
      chatInstance.init()
    }
  })
}
  **/
