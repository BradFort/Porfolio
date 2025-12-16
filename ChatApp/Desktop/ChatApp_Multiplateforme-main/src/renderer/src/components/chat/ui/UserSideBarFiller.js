// Remplit la barre latérale de droite avec la liste des utilisateurs du salon courant
import API from '../../../../../main/api.js'
import { t } from '../../../lang/LanguageManager.js'

const api = new API()

// Variable globale pour accéder au ChatService (websocket, users en ligne, etc.)
let chatServiceInstance = null

// Séquence de rendu pour éviter d'afficher des données obsolètes (race conditions)
let _renderSeq = 0

// Permet d'injecter l'instance de ChatService depuis l'extérieur
export function setChatServiceInstance(instance) {
  chatServiceInstance = instance
}

// Remplit la sidebar des utilisateurs pour un channel donné (ou écran spécial si aucun)
export default async function UserSideBarFiller(channelId) {
  const seq = ++_renderSeq
  const isStale = () => {
    try {
      if (typeof window !== 'undefined' && window.__currentChannelId != null) {
        return String(window.__currentChannelId) !== String(channelId) || seq !== _renderSeq
      }
    } catch {
      /* empty */
    }
    // Fallback: comparer seulement la séquence de rendu
    return seq !== _renderSeq
  }

  const usersSection = document.querySelector('.users-section')
  const usersListContainer = usersSection?.querySelector('.users-list')
  if (usersListContainer) {
    usersListContainer.style.overflowY = 'auto'
    usersListContainer.style.maxHeight = 'calc(100vh - 200px)'
  }
  const headerLabel = usersSection?.querySelector('.section-header span[data-i18n]')
  const headerCount = usersSection?.querySelector('#online-users-count')
  if (!usersListContainer || !headerLabel) return

  // Met à jour le titre de la section et éventuellement le compteur
  const setHeader = (labelKey, count = null) => {
    if (isStale()) return
    try {
      headerLabel.setAttribute('data-i18n', labelKey)
      headerLabel.textContent = t(labelKey)
      if (headerCount) {
        headerCount.textContent = count != null ? String(count) : ''
      }
    } catch (err) {
      headerLabel.textContent = t(labelKey)
      if (headerCount) headerCount.textContent = count != null ? String(count) : ''
      console.debug('[UserSideBarFiller] setHeader fallback due to error:', err)
    }
  }

  let userList = []
  let isUserMember = false

  // Aucun channel sélectionné : afficher un message invitant à en choisir un
  if (!channelId) {
    setHeader('sidebar.onlineUsers', 0)
    usersListContainer.innerHTML = ''
    const message = document.createElement('div')
    message.className = 'not-member-message'
    message.style.cssText =
      'padding: 20px; text-align: center; color: var(--xp-text-light); font-size: 11px; line-height: 1.4;'
    message.textContent = t('sidebar.selectChannel')
    if (!isStale()) usersListContainer.appendChild(message)

    // Hook global pour rafraîchir la sidebar lors d'un changement de langue
    try {
      if (!isStale()) {
        window.__refreshUserSidebar = () => UserSideBarFiller(channelId)
      }
    } catch (err) {
      console.debug('[UserSideBarFiller] cannot expose __refreshUserSidebar:', err)
    }
    return
  }

  // Vérifie si l'utilisateur courant est membre du channel
  isUserMember = await api.isMemberOfChannel(channelId)
  if (isStale()) return

  if (!isUserMember) {
    // L'utilisateur n'est pas membre : afficher un message d'information
    setHeader('sidebar.membersOfChannel', null)
    usersListContainer.innerHTML = ''
    const message = document.createElement('div')
    message.className = 'not-member-message'
    message.style.cssText =
      'padding: 20px; text-align: center; color: var(--xp-text-light); font-size: 11px; line-height: 1.4;'
    message.textContent = t('sidebar.mustBeMember')
    if (!isStale()) usersListContainer.appendChild(message)

    try {
      if (!isStale()) {
        window.__refreshUserSidebar = () => UserSideBarFiller(channelId)
      }
    } catch (err) {
      console.debug('[UserSideBarFiller] cannot expose __refreshUserSidebar (locked):', err)
    }
    return
  }

  // Charger tous les membres du channel depuis la BD
  const resp = await api.request(`/channel/${channelId}/user`, { method: 'GET' })
  if (isStale()) return
  if (resp.success && Array.isArray(resp.data.data)) {
    userList = resp.data.data
  }

  // Récupérer les users en ligne pour ce channel depuis le ChatService (via WebSocket)
  let onlineUserIds = new Set()
  if (chatServiceInstance && chatServiceInstance.isWebSocketEnabled()) {
    const allOnlineUsers = chatServiceInstance.getChannelOnlineUsers(channelId)
    // Créer un Set des userId qui sont en ligne
    onlineUserIds = new Set(allOnlineUsers.map((u) => u.userId))
  }

  const admins = []
  const online = []
  const offline = []

  // Classement des utilisateurs en trois catégories : admins, en ligne, hors ligne
  for (const user of userList) {
    const isOnline = onlineUserIds.has(user.id)

    if (user.isAdmin || user.role === 'admin') {
      admins.push({ ...user, isOnline })
    } else if (isOnline) {
      online.push(user)
    } else {
      offline.push(user)
    }
  }

  if (isStale()) return

  // Nettoie la liste avant de la reconstruire
  usersListContainer.innerHTML = ''

  // Catégorie Admins
  if (admins.length > 0) {
    usersListContainer.appendChild(
      createUserCategory(t('sidebar.categories.admins'), admins, 'admin')
    )
  }

  // Catégorie En ligne
  if (online.length > 0) {
    usersListContainer.appendChild(
      createUserCategory(t('sidebar.categories.online'), online, 'online')
    )
  }

  // Catégorie Hors ligne
  if (offline.length > 0) {
    usersListContainer.appendChild(
      createUserCategory(t('sidebar.categories.offline'), offline, 'offline')
    )
  }

  // Met à jour le header avec le nombre d'utilisateurs en ligne
  setHeader('sidebar.onlineUsers', online.length)

  // Hook global pour pouvoir re-rendre en cas de changement de langue
  try {
    if (!isStale()) {
      window.__refreshUserSidebar = () => UserSideBarFiller(channelId)
    }
  } catch (err) {
    console.debug('[UserSideBarFiller] cannot expose __refreshUserSidebar (final):', err)
  }
}

// Construit un bloc DOM pour une catégorie d'utilisateurs (titre + liste de users)
function createUserCategory(title, users, statusClass) {
  const category = document.createElement('div')
  category.className = 'user-category'

  const categoryTitle = document.createElement('div')
  categoryTitle.className = 'category-title'
  categoryTitle.textContent = `${title} — ${users.length}`
  category.appendChild(categoryTitle)

  users.forEach((user) => {
    const userItem = document.createElement('div')
    userItem.className = 'user-item'
    if (statusClass === 'offline') {
      userItem.classList.add('offline')
    }

    // Point de statut (vert/rouge/gris) selon la catégorie
    const statusDot = document.createElement('div')
    // Pour les admins, montrer leur statut réel (online/offline)
    if (statusClass === 'admin') {
      statusDot.className = user.isOnline ? 'user-status-dot online' : 'user-status-dot offline'
    } else {
      statusDot.className = `user-status-dot ${statusClass}`
    }
    userItem.appendChild(statusDot)

    // Avatar miniature de l'utilisateur (avec style spécial admin le cas échéant)
    const avatar = document.createElement('div')
    avatar.className = 'user-avatar-small'
    if (statusClass === 'admin') {
      avatar.classList.add('admin')
    }
    userItem.appendChild(avatar)

    // Nom de l'utilisateur
    const userName = document.createElement('span')
    userName.className = 'user-name'
    userName.textContent = user.name
    userItem.appendChild(userName)

    category.appendChild(userItem)
  })

  return category
}
