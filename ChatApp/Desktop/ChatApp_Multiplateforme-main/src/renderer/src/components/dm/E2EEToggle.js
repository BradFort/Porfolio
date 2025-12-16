/**
 * Toggle E2EE pour les conversations DM
 * Permet d'activer/désactiver le chiffrement de bout en bout dans une conversation
 */

import E2EEManager from '../crypto/E2EEManager.js'

class E2EEToggle {
  constructor() {
    this.toggleElement = null
    this.currentChannelId = null
    this.isEncrypted = false
    this.disabledChannels = new Set()
    this.e2eeEnabledBy = null
    this.currentUserId = null
    this.setupWebSocketListener()
  }

  /**
   * Configure le listener WebSocket pour les changements E2EE
   */
  setupWebSocketListener() {
    if (window.chatService?.websocket) {
      window.chatService.websocket.on('e2ee_status_changed', async (data) => {
        if (data.channelId === this.currentChannelId) {
          await this.refreshToggleState(data.channelId, data.enabled, data.enabledBy)
        }
      })
    }
  }

  /**
   * Rafraîchit l'état du toggle suite à un événement WebSocket
   */
  async refreshToggleState(channelId, enabled, enabledBy) {
    this.isEncrypted = enabled
    this.e2eeEnabledBy = enabledBy

    if (!this.toggleElement) return

    const checkbox = this.toggleElement.querySelector('input[type="checkbox"]')
    const lockIcon = this.toggleElement.querySelector('.e2ee-toggle-icon')
    const status = this.toggleElement.querySelector('.e2ee-status-text')
    const info = this.toggleElement.querySelector('.e2ee-toggle-info')
    const container = this.toggleElement
    const toggleWrapper = this.toggleElement.querySelector('.e2ee-toggle-switch')

    if (!checkbox || !lockIcon || !status || !info) return

    const isLockedByOther =
      this.isEncrypted && this.e2eeEnabledBy && this.e2eeEnabledBy !== this.currentUserId

    let enabledByUserName = null
    if (this.e2eeEnabledBy && this.e2eeEnabledBy !== this.currentUserId) {
      enabledByUserName = await this.getChannelMemberName(channelId, this.e2eeEnabledBy)
    }

    checkbox.checked = this.isEncrypted
    checkbox.disabled = isLockedByOther
    lockIcon.textContent = this.isEncrypted ? '🔒' : '🔓'
    status.textContent = this.isEncrypted ? 'Activé' : 'Désactivé'

    if (this.isEncrypted) {
      status.classList.add('enabled')
    } else {
      status.classList.remove('enabled')
    }

    info.classList.remove('warning')
    if (isLockedByOther) {
      info.classList.add('warning')
      const displayName = enabledByUserName || `Utilisateur #${this.e2eeEnabledBy}`
      info.textContent = `🔒 Activé par ${displayName}`
      container.classList.add('disabled')
      toggleWrapper.classList.add('disabled')
    } else if (this.isEncrypted && this.e2eeEnabledBy === this.currentUserId) {
      info.textContent = 'Activé par vous'
      container.classList.remove('disabled')
      toggleWrapper.classList.remove('disabled')
    } else {
      info.textContent = 'Protégez votre conversation'
      container.classList.remove('disabled')
      toggleWrapper.classList.remove('disabled')
    }
  }

  /**
   * Récupère le nom d'un membre du channel
   */
  async getChannelMemberName(channelId, userId) {
    try {
      const membersResponse = await window.chatService.api.request(`/channel/${channelId}/user`)

      if (membersResponse.success && membersResponse.data) {
        const members = membersResponse.data.data || membersResponse.data

        const member = members.find((m) => {
          const memberId = m.user_id || (m.user && m.user.id) || m.id
          return memberId === userId
        })

        if (member) {
          return member.user_name || (member.user && member.user.name) || member.name || null
        }
      }

      return null
    } catch (error) {
      console.error('[E2EE] Erreur lors de la récupération du nom du membre:', error)
      return null
    }
  }

  /**
   * Charge l'état E2EE depuis le channel
   */
  async loadE2EEStateFromChannel(channelId) {
    try {
      const channelResponse = await window.chatService.api.getChannel(channelId)

      if (!channelResponse.success || !channelResponse.data.data) {
        console.error('[E2EE] ❌ GET channel - Impossible de récupérer le channel:', {
          success: channelResponse.success,
          hasData: !!channelResponse.data,
          hasDataData: channelResponse.data ? !!channelResponse.data.data : false
        })
        return { enabled: false, enabledBy: null }
      }

      const channel = channelResponse.data.data
      const enabled = Boolean(
        channel.e2ee_enabled === true || channel.e2ee_enabled === 1 || channel.e2ee_enabled === '1'
      )
      const enabledBy = enabled && channel.e2ee_enabled_by ? Number(channel.e2ee_enabled_by) : null

      return { enabled, enabledBy }
    } catch (error) {
      console.error('[E2EE] ❌ GET channel - Erreur lors du chargement:', {
        error: error.message,
        stack: error.stack,
        channelId
      })
      return { enabled: false, enabledBy: null }
    }
  }

  /**
   * Charge l'ID de l'utilisateur courant
   */
  async loadCurrentUserId() {
    try {
      const currentUser = await window.chatService.api.me()
      if (!currentUser.success || !currentUser.data.data) {
        console.error("[E2EE] Impossible de récupérer l'utilisateur courant")
        return null
      }

      return currentUser.data.data.id
    } catch (error) {
      console.error("[E2EE] Erreur lors du chargement de l'utilisateur:", error)
      return null
    }
  }

  /**
   * Sauvegarde l'état du toggle E2EE dans le channel
   */
  async saveE2EEStateToChannel(channelId, enabled, userId) {
    try {
      const updateData = {
        e2ee_enabled: enabled,
        e2ee_enabled_by: enabled ? userId : null
      }

      return await window.chatService.api.request(`/channel/${channelId}/e2ee`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
    } catch (error) {
      console.error('[E2EE] ❌ PUT /channel/{id}/e2ee - Exception lors de la sauvegarde:', {
        error: error.message,
        stack: error.stack,
        channelId,
        enabled,
        userId
      })
      return { success: false, message: error.message }
    }
  }

  /**
   * Crée et affiche le toggle E2EE dans la barre de chat
   */
  async createToggle(channelId, channelName) {
    this.destroy()

    this.currentChannelId = channelId

    this.currentUserId = await this.loadCurrentUserId()
    if (!this.currentUserId) {
      console.error("[E2EE] Impossible de charger l'utilisateur courant")
      return null
    }

    const { enabled, enabledBy } = await this.loadE2EEStateFromChannel(channelId)
    this.isEncrypted = enabled
    this.e2eeEnabledBy = enabledBy

    let enabledByUserName = null
    if (this.e2eeEnabledBy && this.e2eeEnabledBy !== this.currentUserId) {
      enabledByUserName = await this.getChannelMemberName(channelId, this.e2eeEnabledBy)
    }

    const container = document.createElement('div')
    container.className = 'e2ee-toggle-container'

    const isLockedByOther = this.e2eeEnabledBy && this.e2eeEnabledBy !== this.currentUserId
    if (isLockedByOther) {
      container.classList.add('disabled')
    }

    const lockIcon = document.createElement('span')
    lockIcon.className = 'e2ee-toggle-icon'
    lockIcon.textContent = this.isEncrypted ? '🔒' : '🔓'

    const contentDiv = document.createElement('div')
    contentDiv.className = 'e2ee-toggle-content'

    const label = document.createElement('span')
    label.className = 'e2ee-toggle-label'
    label.textContent = 'Chiffrement E2EE'

    const info = document.createElement('span')
    info.className = 'e2ee-toggle-info'

    if (isLockedByOther) {
      info.classList.add('warning')
      const displayName = enabledByUserName || `Utilisateur #${this.e2eeEnabledBy}`
      info.textContent = `🔒 Activé par ${displayName}`
    } else if (this.isEncrypted && this.e2eeEnabledBy === this.currentUserId) {
      info.textContent = 'Activé par vous'
    } else {
      info.textContent = 'Protégez votre conversation'
    }

    contentDiv.appendChild(label)
    contentDiv.appendChild(info)

    const toggleWrapper = document.createElement('label')
    toggleWrapper.className = 'e2ee-toggle-switch'

    if (isLockedByOther) {
      toggleWrapper.classList.add('disabled')
    }

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = this.isEncrypted
    checkbox.disabled = isLockedByOther

    const slider = document.createElement('span')
    slider.className = 'e2ee-toggle-slider'

    toggleWrapper.appendChild(checkbox)
    toggleWrapper.appendChild(slider)

    const status = document.createElement('span')
    status.className = 'e2ee-status-text' + (this.isEncrypted ? ' enabled' : '')
    status.textContent = this.isEncrypted ? 'Activé' : 'Désactivé'

    if (!isLockedByOther) {
      checkbox.addEventListener('change', async (e) => {
        const newState = e.target.checked
        await this.handleToggleChange(newState, channelId, channelName, {
          checkbox,
          lockIcon,
          status,
          info,
          container
        })
      })
    } else {
      const displayName = enabledByUserName || `l'utilisateur #${this.e2eeEnabledBy}`
      container.addEventListener('click', (e) => {
        e.preventDefault()
        this.showNotification(
          `⚠️ Le chiffrement a été activé par ${displayName}. Seul cet utilisateur peut le désactiver.`,
          'warning'
        )
      })
    }

    container.appendChild(lockIcon)
    container.appendChild(contentDiv)
    container.appendChild(toggleWrapper)
    container.appendChild(status)

    this.toggleElement = container
    return container
  }

  /**
   * Gère le changement d'état du toggle
   */
  async handleToggleChange(enabled, channelId, channelName, elements) {
    const { checkbox, lockIcon, status, info, container } = elements

    if (enabled) {
      if (!E2EEManager.isInitialized()) {
        this.showNotification('E2EE non initialisé. Veuillez vous connecter.', 'error')
        checkbox.checked = false
        return
      }

      this.disabledChannels.delete(channelId)

      let memberIds = []
      try {
        const membersResponse = await window.chatService.api.request(`/channel/${channelId}/user`)
        if (membersResponse.success && membersResponse.data) {
          const members = membersResponse.data.data || membersResponse.data

          memberIds = members
            .map((member) => {
              if (member.user_id) return member.user_id
              if (member.user && member.user.id) return member.user.id
              if (member.id) return member.id
              return null
            })
            .filter((id) => id !== null)
        }
      } catch (error) {
        console.error('[E2EE] Erreur lors de la récupération des membres:', error)
        checkbox.checked = false
        this.showNotification('❌ Impossible de récupérer les membres du channel', 'error')
        return
      }

      if (memberIds.length === 0) {
        console.error('[E2EE] Aucun membre trouvé pour le channel')
        checkbox.checked = false
        this.showNotification('❌ Aucun membre trouvé dans ce channel', 'error')
        return
      }
      let existingKey = null
      try {
        existingKey = await E2EEManager.fetchSessionKey(window.chatService.api, channelId)
      } catch (error) {
        console.error(
          '[E2EE] Erreur lors de la récupération de la clé de session existante:',
          error
        )
      }

      if (existingKey) {
        this.isEncrypted = true
        this.e2eeEnabledBy = this.currentUserId
        lockIcon.textContent = '🔒'
        status.textContent = 'Activé'
        status.classList.add('enabled')
        info.textContent = 'Activé par vous'
        this.showNotification('✅ Chiffrement E2EE activé avec la clé existante !', 'success')
      } else {
        const success = await E2EEManager.enableForChannel(channelId, memberIds)

        if (success) {
          this.isEncrypted = true
          this.e2eeEnabledBy = this.currentUserId
          lockIcon.textContent = '🔒'
          status.textContent = 'Activé'
          status.classList.add('enabled')
          info.textContent = 'Activé par vous'
          this.showNotification('✅ Chiffrement E2EE activé avec une nouvelle clé !', 'success')
        } else {
          checkbox.checked = false
          const errorMsg = "❌ Erreur lors de l'activation E2EE"
          this.showNotification(errorMsg, 'error')
          return
        }
      }
    } else {
      this.disabledChannels.add(channelId)
      this.isEncrypted = false
      this.e2eeEnabledBy = null
      lockIcon.textContent = '🔓'
      status.textContent = 'Désactivé'
      status.classList.remove('enabled')
      info.textContent = 'Protégez vos conversations'
      info.classList.remove('warning')
      container.classList.remove('disabled')
      this.showNotification('⚠️ E2EE désactivé pour les nouveaux messages', 'warning')
    }

    await this.saveE2EEStateToChannel(channelId, enabled, this.currentUserId)
  }

  /**
   * Affiche une notification
   */
  showNotification(message, type) {
    if (window.notificationManager) {
      const notifType = type === 'warning' ? 'info' : type

      if (typeof window.notificationManager[notifType] === 'function') {
        window.notificationManager[notifType](message, 3000)
      } else {
        window.notificationManager.show(notifType, message, 3000)
      }
    } else {
      //
    }
  }

  /**
   * Vérifie si le channel actuel utilise E2EE
   */
  isChannelEncrypted() {
    return this.isEncrypted
  }

  /**
   * Détruit le toggle
   */
  destroy() {
    if (this.toggleElement) {
      if (this.toggleElement.parentNode) {
        this.toggleElement.parentNode.removeChild(this.toggleElement)
      }
      this.toggleElement.remove()
    }
    const existingToggles = document.querySelectorAll('.e2ee-toggle-container')
    existingToggles.forEach((toggle) => {
      if (toggle && toggle.parentNode) {
        toggle.parentNode.removeChild(toggle)
      }
    })

    this.toggleElement = null
    this.currentChannelId = null
    this.isEncrypted = false
  }
}

const e2eeToggle = new E2EEToggle()
window.e2eeToggle = e2eeToggle

export default e2eeToggle
