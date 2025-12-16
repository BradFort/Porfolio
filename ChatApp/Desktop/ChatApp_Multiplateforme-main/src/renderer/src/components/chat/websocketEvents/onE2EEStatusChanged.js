/**
 * Listener WebSocket pour les changements d'état E2EE
 * Gère la synchronisation en temps réel quand un utilisateur active/désactive E2EE
 */
export function onE2EEStatusChanged(chat, api) {
  api.websocketListener.on('e2ee_status_changed', async (data) => {
    console.log('[E2EE] 📡 Événement WebSocket e2ee_status_changed reçu:', data)

    if (window.e2eeToggle && String(data.channelId) === String(chat.currentChannelId)) {
      await window.e2eeToggle.refreshToggleState(data.channelId, data.enabled, data.enabledBy)
    }
  })
}
