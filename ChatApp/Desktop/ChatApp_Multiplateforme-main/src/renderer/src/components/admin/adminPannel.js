// Gestion du panneau d'administration (bouton + fenêtres modales)
import API from '../../../../main/api.js'
const api = new API()
import { getCurrentUser } from '../auth/auth.js'
import { t } from '../../lang/LanguageManager.js'

// Quand le DOM principal du renderer est prêt
document.addEventListener('DOMContentLoaded', async () => {
  // On récupère l'utilisateur courant pour vérifier s'il est admin
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return // si pas admin, on ne montre rien

  // Panneau (barre) où sera ajouté le bouton d'admin
  const panel = document.querySelector('.user-status-panel')
  if (!panel) return

  // Création du bouton "Admin"
  const adminBtn = document.createElement('button')
  adminBtn.textContent = t('admin.ui.adminButton') // texte du bouton (traduction)
  adminBtn.className = 'toolbar-button admin-btn'
  // Style rapide en inline pour s'intégrer à la toolbar
  adminBtn.style.marginLeft = 'auto'
  adminBtn.style.background = 'var(--xp-blue)'
  adminBtn.style.color = 'white'
  adminBtn.style.fontWeight = 'bold'
  adminBtn.style.height = '28px'
  adminBtn.style.fontSize = '11px'
  adminBtn.style.border = '1px solid var(--xp-blue-dark)'
  adminBtn.style.borderRadius = '4px'
  adminBtn.style.cursor = 'pointer'

  // Référence vers la fenêtre d'administration (popup)
  let adminPanelWindow = null

  // Au clic sur le bouton Admin
  adminBtn.onclick = () => {
    // Si la fenêtre existe déjà et n'est pas fermée, on la remet au premier plan
    if (adminPanelWindow && !adminPanelWindow.closed) {
      adminPanelWindow.focus()
      return
    }

    // Sinon on ouvre la page adminPanel.html dans une nouvelle fenêtre
    adminPanelWindow = window.open(
      './src/pages/adminPanel.html',
      'adminPanel',
      'width=600,height=600'
    )

    if (adminPanelWindow) {
      adminPanelWindow.focus()
    }

    // Quand le contenu de la fenêtre admin est chargé
    adminPanelWindow.addEventListener('load', () => {
      const usersBtn = adminPanelWindow.document.querySelector('.users-button')
      if (usersBtn) {
        usersBtn.onclick = async () => {
          let modal = adminPanelWindow.document.getElementById('admin-user-modal')
          if (modal) modal.remove()
          modal = adminPanelWindow.document.createElement('div')
          modal.id = 'admin-user-modal'

          const content = adminPanelWindow.document.createElement('div')
          content.id = 'admin-user-content'

          const closeBtn = adminPanelWindow.document.createElement('button')
          closeBtn.textContent = t('common.close')
          closeBtn.className = 'toolbar-button'
          closeBtn.style.float = 'right'
          closeBtn.onclick = () => modal.remove()
          content.appendChild(closeBtn)

          const title = adminPanelWindow.document.createElement('h2')
          title.textContent = t('admin.ui.usersTitle')
          title.style.textAlign = 'center'
          title.style.marginBottom = '20px'
          content.appendChild(title)

          const listDiv = adminPanelWindow.document.createElement('div')
          listDiv.style.display = 'flex'
          listDiv.style.flexDirection = 'column'
          listDiv.style.gap = '8px'
          listDiv.style.maxHeight = '350px'
          listDiv.style.overflowY = 'auto'

          listDiv.textContent = t('common.loading')
          content.appendChild(listDiv)
          modal.appendChild(content)
          adminPanelWindow.document.body.appendChild(modal)

          let result, users
          try {
            result = await api.getAllUsers()
            users = Array.isArray(result.data)
              ? result.data
              : result.data && Array.isArray(result.data.data)
                ? result.data.data
                : []
          } catch {
            users = []
          }
          listDiv.innerHTML = ''
          if (!result?.success) {
            const errDiv = adminPanelWindow.document.createElement('div')
            errDiv.textContent = t('admin.ui.usersLoadError') || 'Failed to load users.'
            errDiv.style.color = 'red'
            errDiv.style.textAlign = 'center'
            listDiv.appendChild(errDiv)
            return
          }
          if (!users.length) {
            const emptyDiv = adminPanelWindow.document.createElement('div')
            emptyDiv.textContent = t('admin.ui.noUsers') || 'No users found.'
            emptyDiv.style.textAlign = 'center'
            listDiv.appendChild(emptyDiv)
            return
          }

          users.forEach((user) => {
            const div = adminPanelWindow.document.createElement('div')
            div.className = 'admin-user-item'
            div.style.display = 'flex'
            div.style.flexDirection = 'column'
            div.style.justifyContent = 'center'
            div.style.alignItems = 'flex-start'
            div.style.padding = '8px 0'
            div.style.borderBottom = '1px solid #e0e0e0'

            const name = adminPanelWindow.document.createElement('span')
            name.textContent = user.name
            name.className = 'admin-channel-title'
            div.appendChild(name)

            const email = adminPanelWindow.document.createElement('small')
            email.textContent = user.email
            email.className = 'admin-channel-desc'
            div.appendChild(email)

            const delBtn = adminPanelWindow.document.createElement('button')
            delBtn.textContent = t('common.delete')
            delBtn.className = 'toolbar-button btn-error'
            delBtn.style.marginTop = '8px'
            delBtn.onclick = async () => {
              if (adminPanelWindow.confirm(t('admin.ui.confirmDeleteUser', { name: user.name }))) {
                delBtn.disabled = true
                delBtn.textContent = t('common.loading')
                const delResult = await api.deleteUser(user.id)
                if (!delResult.success) {
                  delBtn.textContent = t('common.delete')
                  delBtn.disabled = false
                } else {
                  div.remove()
                }
              }
            }
            div.appendChild(delBtn)
            listDiv.appendChild(div)
          })
        }
      }

      // Gestion salons
      const salonsBtn = adminPanelWindow.document.querySelector('.channels-button')
      if (salonsBtn) {
        salonsBtn.onclick = async () => {
          let modal = adminPanelWindow.document.getElementById('admin-channel-modal')
          if (modal) modal.remove()
          modal = adminPanelWindow.document.createElement('div')
          modal.id = 'admin-channel-modal'

          const content = adminPanelWindow.document.createElement('div')
          content.id = 'admin-channel-content'

          const closeBtn = adminPanelWindow.document.createElement('button')
          closeBtn.textContent = t('common.close')
          closeBtn.className = 'toolbar-button'
          closeBtn.style.float = 'right'
          closeBtn.onclick = () => modal.remove()
          content.appendChild(closeBtn)

          const title = adminPanelWindow.document.createElement('h2')
          title.textContent = t('admin.ui.channelsTitle')
          title.style.textAlign = 'center'
          title.style.marginBottom = '20px'
          content.appendChild(title)

          const listDiv = adminPanelWindow.document.createElement('div')
          listDiv.style.display = 'flex'
          listDiv.style.flexDirection = 'column'
          listDiv.style.gap = '8px'
          listDiv.style.maxHeight = '350px'
          listDiv.style.overflowY = 'auto'

          const result = await api.getChannels()
          const channels = result.data?.data?.data || []
          channels.forEach((channel) => {
            const div = adminPanelWindow.document.createElement('div')
            div.className = 'admin-channel-item'
            div.style.display = 'flex'
            div.style.justifyContent = 'space-between'
            div.style.alignItems = 'center'
            div.style.padding = '8px 0'
            div.style.borderBottom = '1px solid #e0e0e0'

            const name = adminPanelWindow.document.createElement('div')
            name.style.display = 'flex'
            name.style.flexDirection = 'column'
            name.style.gap = '4px'
            name.style.alignItems = 'center'

            const title = adminPanelWindow.document.createElement('strong')
            title.textContent = channel.name || channel.description || 'Untitled'
            title.className = 'admin-channel-title'
            title.style.fontWeight = 'bold'
            title.style.textAlign = 'center'
            title.style.color = 'var(--xp-text)'

            const desc = adminPanelWindow.document.createElement('small')
            desc.textContent = channel.description || ''
            desc.className = 'admin-channel-desc'
            desc.style.fontSize = '12px'
            desc.style.textAlign = 'center'

            name.appendChild(title)
            if (channel.description) name.appendChild(desc)

            const delBtn = adminPanelWindow.document.createElement('button')
            delBtn.textContent = t('common.delete')
            delBtn.className = 'toolbar-button btn-error'
            delBtn.style.marginLeft = '16px'
            delBtn.onclick = async () => {
              if (
                adminPanelWindow.confirm(
                  t('admin.ui.confirmDeleteChannel', { name: channel.name || channel.description })
                )
              ) {
                await api.deleteChannel(channel.id)
                if (adminPanelWindow.opener) {
                  adminPanelWindow.opener.postMessage({ type: 'refresh-channels-list' }, '*')
                }
                modal.remove()
              }
            }
            div.appendChild(name)
            div.appendChild(delBtn)
            listDiv.appendChild(div)
          })
          content.appendChild(listDiv)
          modal.appendChild(content)
          adminPanelWindow.document.body.appendChild(modal)
        }
      }
      // Gestion messages
      const messagesBtn = adminPanelWindow.document.querySelector('.messages-button')
      if (messagesBtn) {
        messagesBtn.onclick = async () => {
          let modal = adminPanelWindow.document.getElementById('admin-message-modal')
          if (modal) modal.remove()
          modal = adminPanelWindow.document.createElement('div')
          modal.id = 'admin-message-modal'
          modal.style.position = 'fixed'
          modal.style.top = '0'
          modal.style.left = '0'
          modal.style.width = '100vw'
          modal.style.height = '100vh'
          modal.style.background = 'rgba(0,0,0,0.25)'
          modal.style.display = 'flex'
          modal.style.alignItems = 'center'
          modal.style.justifyContent = 'center'
          modal.style.zIndex = '9999'

          const content = adminPanelWindow.document.createElement('div')
          content.id = 'admin-message-content'

          const closeBtn = adminPanelWindow.document.createElement('button')
          closeBtn.textContent = t('common.close')
          closeBtn.className = 'toolbar-button'
          closeBtn.style.float = 'right'
          closeBtn.onclick = () => modal.remove()
          content.appendChild(closeBtn)

          const title = adminPanelWindow.document.createElement('h2')
          title.textContent = t('admin.ui.messagesTitle')
          title.style.textAlign = 'center'
          title.style.marginBottom = '20px'
          content.appendChild(title)

          const filterDiv = adminPanelWindow.document.createElement('div')
          filterDiv.style.display = 'flex'
          filterDiv.style.gap = '12px'
          filterDiv.style.marginBottom = '16px'

          const allBtn = adminPanelWindow.document.createElement('button')
          allBtn.textContent = t('admin.ui.filterAll')
          allBtn.className = 'toolbar-button'
          const channelBtn = adminPanelWindow.document.createElement('button')
          channelBtn.textContent = t('admin.ui.filterChannels')
          channelBtn.className = 'toolbar-button'
          const dmBtn = adminPanelWindow.document.createElement('button')
          dmBtn.textContent = t('admin.ui.filterDMs')
          dmBtn.className = 'toolbar-button'

          filterDiv.appendChild(allBtn)
          filterDiv.appendChild(channelBtn)
          filterDiv.appendChild(dmBtn)
          content.appendChild(filterDiv)

          const listDiv = adminPanelWindow.document.createElement('div')
          listDiv.style.display = 'flex'
          listDiv.style.flexDirection = 'column'
          listDiv.style.gap = '8px'
          listDiv.style.maxHeight = '350px'
          listDiv.style.overflowY = 'auto'
          content.appendChild(listDiv)

          async function loadMessages(filter) {
            listDiv.innerHTML = ''
            let messages

            const channelsResult = await api.getChannels()
            const channels = channelsResult.data?.data?.data || []
            const channelMap = {}
            channels.forEach((channel) => {
              channelMap[channel.id] = channel.name || channel.description || 'Untitled'
            })

            if (filter === 'dms') {
              const dmChannels = channels.filter((c) => c.type === 'dm')
              let allMessages = []
              for (const channel of dmChannels) {
                const result = await api.getMessages(channel.id)
                const msgs = result.data?.data || []
                allMessages = allMessages.concat(msgs)
              }
              messages = allMessages
            } else if (filter === 'channels') {
              const normalChannels = channels.filter(
                (c) => c.type === 'public' || c.type === 'private'
              )
              let allMessages = []
              for (const channel of normalChannels) {
                const result = await api.getMessages(channel.id)
                const msgs = result.data?.data || []
                allMessages = allMessages.concat(msgs)
              }
              messages = allMessages
            } else {
              let allMessages = []
              for (const channel of channels) {
                const result = await api.getMessages(channel.id)
                const msgs = result.data?.data || []
                allMessages = allMessages.concat(msgs)
              }
              messages = allMessages
            }

            messages.forEach((msg) => {
              const div = adminPanelWindow.document.createElement('div')
              div.className = 'admin-message-item'
              div.style.display = 'flex'
              div.style.flexDirection = 'column'
              div.style.alignItems = 'flex-start'
              div.style.justifyContent = 'center'
              div.style.padding = '8px 0'
              div.style.borderBottom = '1px solid #e0e0e0'

              const topRow = adminPanelWindow.document.createElement('div')
              topRow.style.display = 'flex'
              topRow.style.width = '100%'
              topRow.style.justifyContent = 'space-between'
              topRow.style.alignItems = 'center'

              const senderSpan = adminPanelWindow.document.createElement('span')
              senderSpan.textContent =
                msg.user && msg.user.name
                  ? msg.user.name
                  : msg.senderName
                    ? msg.senderName
                    : msg.sender && msg.sender.name
                      ? msg.sender.name
                      : t('admin.ui.unknownSender') || 'Unknown sender'
              senderSpan.className = 'admin-channel-title'
              topRow.appendChild(senderSpan)

              const channelName =
                channelMap[msg.channel_id] || t('admin.ui.unknownChannel') || 'Unknown channel'
              const channelSpan = adminPanelWindow.document.createElement('span')
              channelSpan.textContent = channelName
              channelSpan.className = 'admin-channel-title'
              channelSpan.style.textAlign = 'right'
              channelSpan.style.paddingRight = '16px'
              topRow.appendChild(channelSpan)

              div.appendChild(topRow)

              const contentSpan = adminPanelWindow.document.createElement('small')
              contentSpan.textContent = msg.content
              contentSpan.className = 'admin-channel-desc'
              div.appendChild(contentSpan)

              const timeSpan = adminPanelWindow.document.createElement('small')
              const date = new Date(msg.created_at)
              const dateStr = date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
              })
              const timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
              timeSpan.textContent = `${dateStr} ${timeStr}`
              timeSpan.className = 'admin-message-time'
              timeSpan.style.color = '#aaa'
              timeSpan.style.marginLeft = '8px'
              div.appendChild(timeSpan)

              const delBtn = adminPanelWindow.document.createElement('button')
              delBtn.textContent = t('common.delete')
              delBtn.className = 'toolbar-button btn-error'
              delBtn.style.marginTop = '8px'
              delBtn.onclick = async () => {
                if (adminPanelWindow.confirm(t('admin.ui.confirmDeleteMessage'))) {
                  await api.deleteMessage(msg.id)
                  await loadMessages(filter)
                }
              }
              div.appendChild(delBtn)
              listDiv.appendChild(div)
            })
          }

          allBtn.onclick = () => loadMessages('all')
          channelBtn.onclick = () => loadMessages('channels')
          dmBtn.onclick = () => loadMessages('dms')

          loadMessages('all')

          modal.appendChild(content)
          adminPanelWindow.document.body.appendChild(modal)
        }
      }
    })
  }
  // On affiche le panel (au cas où il serait caché) et on y ajoute le bouton Admin
  panel.style.display = 'flex'
  panel.appendChild(adminBtn)
})
