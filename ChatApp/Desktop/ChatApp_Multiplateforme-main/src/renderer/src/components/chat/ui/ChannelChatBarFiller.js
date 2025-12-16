// Remplit la barre latérale des salons (channels) avec la liste récupérée depuis l'API
import API from '../../../../../main/api.js'
const api = new API()
import { t } from '../../../lang/LanguageManager.js'

// Construit dynamiquement la liste de salons (hors DMs) pour la sidebar
export async function afficherChannels(currentUser, onJoinLeave) {
  const container = document.createElement('div')
  container.className = 'channel-list'

  // Récupère la liste complète des channels depuis le backend
  const result = await api.getChannels()
  // Les données sont dans data.data.data (convention API actuelle)
  const channels = result.data?.data?.data || []

  // Si beaucoup de salons non-DM, on ajoute une classe pour activer un scroll dédié
  if (channels.filter((channel) => channel.type !== 'dm').length >= 9) {
    container.classList.add('channel-list-scrollable')
  }

  const isAdmin = currentUser.role === 'admin'

  // Création des éléments DOM pour chaque channel non-DM
  await Promise.all(
    channels
      .filter((channel) => channel.type !== 'dm')
      .map(async (channel) => {
        const div = document.createElement('div')
        div.className = 'channel-item'
        div.setAttribute('data-channel-id', channel.id)

        const isPrivate = channel.type === 'private'
        // Vérifie si l'utilisateur courant est membre de ce channel
        const isUserMember = await api.isMemberOfChannel(channel.id)

        // Icône du salon (public / privé)
        const icon = document.createElement('div')
        icon.className = 'channel-icon'
        if (channel.type === 'private') {
          icon.classList.add('private')
        } else {
          icon.classList.add('public')
        }

        // Nom du salon + petit badge de type (# ou 🔒)
        const nameSpan = document.createElement('span')
        nameSpan.className = 'channel-name-text'
        nameSpan.textContent = channel.name + ' '
        nameSpan.style.flex = '1'
        nameSpan.style.overflow = 'hidden'
        nameSpan.style.textOverflow = 'ellipsis'
        nameSpan.style.whiteSpace = 'nowrap'

        const typeSpan = document.createElement('span')
        typeSpan.className = `channel-type-badge ${channel.type}`
        typeSpan.textContent = channel.type === 'private' ? '🔒' : '#'
        typeSpan.style.marginLeft = '4px'
        typeSpan.style.fontSize = '10px'
        nameSpan.appendChild(typeSpan)

        // Badge visuel pour indiquer qu'un admin a accès à un salon privé
        if (isPrivate && !isUserMember && isAdmin) {
          const adminBadge = document.createElement('span')
          adminBadge.title = 'Admin access'
          adminBadge.style.fontSize = '12px'
          adminBadge.style.color = '#ffd700'
          nameSpan.appendChild(adminBadge)
        }

        div.appendChild(icon)
        div.appendChild(nameSpan)

        // Ajout d'une coche si l'utilisateur est membre du salon
        if (isUserMember) {
          const badge = document.createElement('span')
          badge.className = 'member-badge'
          badge.textContent = '✓'
          badge.style.marginLeft = 'auto'
          badge.style.fontSize = '10px'
          badge.style.fontWeight = 'bold'
          div.appendChild(badge)
        }

        // Un bouton rejoindre/quitter est affiché si :
        //  - salon public
        //  - ou privé mais user membre
        //  - ou privé mais user admin
        const canShowButton = !isPrivate || isUserMember || isAdmin

        if (canShowButton) {
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

          // Texte du bouton selon que l'utilisateur est membre ou non
          if (isUserMember) {
            btn.textContent = t('buttons.leave')
            btn.setAttribute('data-i18n', 'buttons.leave')
          } else {
            btn.textContent = t('buttons.join')
            btn.setAttribute('data-i18n', 'buttons.join')
          }

          // Clic sur le bouton : délègue la logique join/leave au callback
          btn.addEventListener('click', (e) => {
            e.stopPropagation()
            if (typeof onJoinLeave === 'function') {
              onJoinLeave(channel, isUserMember, 'toggle-membership')
            }
          })

          div.appendChild(btn)
        }

        // Sauvegarde l'objet channel brut sur l'élément pour un accès rapide
        div.dataset.channelData = JSON.stringify(channel)

        container.appendChild(div)
      })
  )
  return container
}

// Met à jour l'UI d'un item de salon (badge, bouton, dataset) après join/leave
export async function updateChannelItemUI(channelId, _isUserMember, onJoinLeave) {
  const item = document.querySelector(`.channel-item[data-channel-id='${channelId}']`)
  if (!item) return

  const btn = item.querySelector('button[data-channel-id]')
  if (!btn) return
  btn.disabled = false

  // Re-vérifie l'appartenance au salon (état serveur) pour éviter les désynchros
  const isUserMember = await api.isMemberOfChannel(channelId)

  // Recharge les channels pour récupérer les infos à jour de ce salon précis
  const result = await api.getChannels()
  const channels = result.data?.data?.data || []
  const channel = channels.find((c) => String(c.id) === String(channelId))
  const isPrivate = channel?.type === 'private'

  let isAdmin = false

  // Récupération du currentUser pour savoir si c'est un admin
  try {
    const meResult = await api.me()
    const currentUser = meResult.data?.data
    isAdmin = currentUser?.role === 'admin'
  } catch (e) {
    console.error('Erreur lors de la récupération du currentUser:', e)
  }

  // Gestion de la coche de membre (✓)
  let badge = item.querySelector('.member-badge')
  if (isUserMember) {
    // Si le user est membre et qu'il n'y a pas encore de badge, on l'ajoute
    if (!badge) {
      badge = document.createElement('span')
      badge.className = 'member-badge'
      badge.textContent = '✓'
      badge.style.marginLeft = 'auto'
      badge.style.fontSize = '10px'
      badge.style.fontWeight = 'bold'

      item.insertBefore(badge, btn)
    }
    btn.style.marginLeft = '6px'
  } else {
    // Si le user n'est plus membre, on retire le badge éventuel
    if (badge) {
      badge.remove()
    }
    btn.style.marginLeft = 'auto'
  }

  const canShowButton = !isPrivate || isUserMember || isAdmin

  if (canShowButton) {
    if (btn) {
      // On remplace le bouton par un clone pour réinitialiser les anciens handlers
      const newBtn = btn.cloneNode(true)
      if (isUserMember) {
        newBtn.textContent = t('buttons.leave')
        newBtn.setAttribute('data-i18n', 'buttons.leave')
      } else {
        newBtn.textContent = t('buttons.join')
        newBtn.setAttribute('data-i18n', 'buttons.join')
      }

      // Nouveau handler clic qui désactive le bouton et délègue à onJoinLeave
      newBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        if (typeof onJoinLeave === 'function') {
          newBtn.disabled = true
          const currentMember = await api.isMemberOfChannel(channelId)
          await onJoinLeave(channel, currentMember, 'toggle-membership')
        }
      })
      btn.replaceWith(newBtn)
    } else if (!isUserMember && !isPrivate) {
      // Cas où il n'y avait pas de bouton mais on doit maintenant en afficher un
      const newBtn = document.createElement('button')
      newBtn.className = 'channel-quick-action'
      newBtn.setAttribute('data-channel-id', channelId)
      newBtn.style.marginLeft = 'auto'
      newBtn.style.padding = '3px 8px'
      newBtn.style.fontSize = '10px'
      newBtn.style.border = '1px outset var(--xp-gray-dark)'
      newBtn.style.background = 'var(--xp-gray)'
      newBtn.style.cursor = 'pointer'
      newBtn.style.color = 'var(--xp-text)'
      newBtn.textContent = t('buttons.join')
      newBtn.setAttribute('data-i18n', 'buttons.join')

      newBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        if (typeof onJoinLeave === 'function') {
          newBtn.disabled = true
          const currentMember = await api.isMemberOfChannel(channelId)
          await onJoinLeave(channel, currentMember, 'toggle-membership')
        }
      })
      item.appendChild(newBtn)
    }
  } else if (btn) {
    // Si l'utilisateur n'a plus le droit de voir le bouton, on le supprime
    btn.remove()
  }

  // Met à jour le dataset avec la version la plus récente du channel
  if (channel) {
    item.dataset.channelData = JSON.stringify(channel)
  }
}

export default afficherChannels
