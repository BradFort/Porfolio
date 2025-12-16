// Remplit la barre latérale des messages privés (DM) pour l'utilisateur courant
import API from '../../../../../main/api.js'
const api = new API()
import { t } from '../../../lang/LanguageManager.js'

// Construit dynamiquement la liste des channels de type "dm" et retourne un conteneur DOM
export async function afficherDMChannels(currentUser, onJoinLeave) {
  const container = document.createElement('div')
  container.className = 'dm-list'

  // Récupère uniquement les channels auxquels l'utilisateur appartient
  const result = await api.getMyChannels()
  const channels = result.data?.data || []
  const dmChannels = channels.filter((channel) => channel.type === 'dm')

  // Ajoute une classe de scroll quand il y a beaucoup de DMs
  if (dmChannels.length >= 8) {
    container.classList.add('dm-list-scrollable')
  }

  // Aucun DM trouvé : message d'information dans la barre latérale
  if (dmChannels.length === 0) {
    const noDmMsg = document.createElement('div')
    noDmMsg.classList.add('no-dm-message')
    noDmMsg.style.padding = '12px 8px'
    noDmMsg.style.textAlign = 'center'
    noDmMsg.style.color = 'var(--xp-text-light)'
    noDmMsg.style.fontSize = '11px'
    noDmMsg.style.fontStyle = 'italic'
    noDmMsg.innerText = t('dm.none')
  }

  // Création DOM pour chaque DM
  await Promise.all(
    dmChannels.map(async (channel) => {
      const div = document.createElement('div')
      div.className = 'channel-item dm-item'
      div.setAttribute('data-channel-id', channel.id)

      const isUserMember = await api.isMemberOfChannel(channel.id)

      // Avatar / icône du DM (online si membre, sinon neutre)
      const icon = document.createElement('div')
      icon.className = 'dm-avatar'
      if (isUserMember) {
        icon.classList.add('online')
      }

      // Nom du DM (généralement le nom de l'autre utilisateur)
      const nameSpan = document.createElement('span')
      nameSpan.className = 'channel-name-text'
      nameSpan.textContent = channel.name
      nameSpan.style.flex = '1'
      nameSpan.style.overflow = 'hidden'
      nameSpan.style.textOverflow = 'ellipsis'
      nameSpan.style.whiteSpace = 'nowrap'

      div.appendChild(icon)
      div.appendChild(nameSpan)

      // Bouton de join/leave pour le DM (peut être utile si logique de sortie de DM)
      const btn = document.createElement('button')
      btn.className = 'channel-quick-action'
      btn.setAttribute('data-channel-id', channel.id)
      btn.style.marginLeft = isUserMember ? '8px' : 'auto'
      btn.style.padding = '3px 8px'
      btn.style.fontSize = '10px'
      btn.style.border = '1px outset var(--xp-gray-dark)'
      btn.style.background = 'var(--xp-gray)'
      btn.style.cursor = 'pointer'
      btn.style.color = 'var(--xp-text)'

      if (isUserMember) {
        btn.textContent = t('buttons.leave')
        btn.setAttribute('data-i18n', 'buttons.leave')
      } else {
        btn.textContent = t('buttons.join')
        btn.setAttribute('data-i18n', 'buttons.join')
      }

      // Clic sur le bouton : délègue au callback externe (join/leave)
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (typeof onJoinLeave === 'function') {
          onJoinLeave(channel, isUserMember, 'toggle-membership')
        }
      })

      div.appendChild(btn)

      // Stocke le channel brut sur l'élément pour un accès rapide plus tard
      div.dataset.channelData = JSON.stringify(channel)

      container.appendChild(div)
    })
  )
  return container
}

export default afficherDMChannels
