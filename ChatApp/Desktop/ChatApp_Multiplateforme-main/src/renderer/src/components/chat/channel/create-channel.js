// Gestion de la création d'un nouveau salon (fenêtre create-channel)
import { t } from '../../../lang/LanguageManager.js'

// Affichage centralisé des notifications (erreurs, succès, infos)
function notify(type, message, duration = 3000) {
  // Priorité : NotificationManager du renderer principal (toasts personnalisés)
  if (typeof window !== 'undefined' && window.notificationManager) {
    if (type === 'error' && typeof window.notificationManager.error === 'function') {
      window.notificationManager.error(message)
      return
    }
    if (typeof window.notificationManager.show === 'function') {
      window.notificationManager.show(type, message, duration)
      return
    }
  }

  // Fallback : API de notification native exposée par Electron (préload)
  if (
    typeof window !== 'undefined' &&
    window.notificationAPI &&
    typeof window.notificationAPI.showNotification === 'function'
  ) {
    window.notificationAPI.showNotification(type, message, duration)
    return
  }

  // Dernier recours : alert() pour les erreurs, log pour le reste
  if (type === 'error') alert(message)
  else console.log(type, message)
}

// Détermine dynamiquement quelle fonction utiliser pour créer un salon
// en fonction de ce qui est disponible dans la fenêtre (chatService, api, etc.)
function getCreateChannelFunction() {
  // Cas 1 : service de chat côté main exposé sur window.chatService
  if (
    typeof window !== 'undefined' &&
    window.chatService &&
    typeof window.chatService.createChannel === 'function'
  ) {
    return async (data) => window.chatService.createChannel(data)
  }

  // Cas 2 : API générique exposée via window.api.channels.create
  if (typeof window !== 'undefined' && window.api?.channels?.create) {
    return async (data) => window.api.channels.create(data)
  }

  // Fallback : fonction qui échoue toujours avec un message traduit
  return async () => ({ success: false, error: t('pages.createChannel.errors.creationFailed') })
}

// Fonction de création de canal qui sera utilisée par la suite
const createChannelFn = getCreateChannelFunction()

// Récupération du formulaire de création de salon
const form = document.getElementById('create-channel-form')
if (form) {
  // Gestion de la soumission du formulaire
  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const channelName = formData.get('channelName')?.trim()
    const channelDescription = formData.get('channelDescription')?.trim()
    const channelType = formData.get('channelType')

    // --- VALIDATIONS ---
    if (!channelName) {
      notify('error', { key: 'pages.createChannel.errors.nameRequired' })
      return
    }

    if (channelName.length < 3) {
      notify('error', { key: 'pages.createChannel.errors.nameTooShort' })
      return
    }

    if (channelName.length > 50) {
      notify('error', { key: 'pages.createChannel.errors.nameTooLong' })
      return
    }

    if (channelDescription && channelDescription.length > 255) {
      notify('error', { key: 'pages.createChannel.errors.descTooLong' })
      return
    }

    // Données envoyées à l'API
    const channelData = {
      name: channelName,
      description: channelDescription || '',
      type: channelType
    }

    try {
      // Appel de la fonction de création (chatService, api, ...)
      const result = await createChannelFn(channelData)

      if (result && result.success) {
        // Notification de succès
        notify('success', { key: 'pages.createChannel.success' })

        // Tentative de mise à jour optimiste de l'instance de chat locale
        try {
          // On essaie d'utiliser le salon retourné par l'API si possible
          const newChannel = result.data?.data || result.channel || result.data || null

          if (newChannel && typeof window !== 'undefined' && window.chatInstance) {
            try {
              // S'assurer que la liste des salons existe
              if (!Array.isArray(window.chatInstance.channels)) {
                window.chatInstance.channels = []
              }

              // Vérifier si le salon existe déjà et le remplacer, sinon l'ajouter
              const existsIndex = window.chatInstance.channels.findIndex(
                (c) => String(c.id) === String(newChannel.id)
              )
              if (existsIndex === -1) {
                window.chatInstance.channels.push(newChannel)
              } else {
                window.chatInstance.channels[existsIndex] = newChannel
              }

              // Rafraîchir l'UI des salons (méthode dédiée si dispo, sinon init globale)
              if (typeof window.chatInstance.refreshChannelListUi === 'function') {
                window.chatInstance.refreshChannelListUi()
              } else if (typeof window.chatInstance.init === 'function') {
                window.chatInstance.init()
              }
            } catch (err) {
              console.warn('create-channel: could not update chatInstance channels list', err)
            }

            // Informer le main process / autres fenêtres du nouveau salon (IPC)
            try {
              if (
                typeof window !== 'undefined' &&
                window.electronAPI &&
                typeof window.electronAPI.sendNewChannel === 'function'
              ) {
                window.electronAPI.sendNewChannel(newChannel)
              }
            } catch (e) {
              console.warn('create-channel: failed to broadcast new channel', e)
            }
          } else {
            // Plan B : recharger entièrement la liste des salons depuis l'API
            try {
              let channels = null

              // 1) Via chatInstance.api.getChannels si disponible
              if (typeof window !== 'undefined' && window.chatInstance?.api?.getChannels) {
                const resp = await window.chatInstance.api.getChannels()
                channels = Array.isArray(resp.data?.data?.data) ? resp.data.data.data : null
              }

              // 2) Sinon via chatService.getChannels
              if (!channels && typeof window !== 'undefined' && window.chatService?.getChannels) {
                const resp = await window.chatService.getChannels()
                channels = Array.isArray(resp.data?.data?.data) ? resp.data.data.data : null
              }

              // Si on a réussi à récupérer une liste de salons, on la place sur chatInstance
              if (
                channels &&
                Array.isArray(channels) &&
                typeof window !== 'undefined' &&
                window.chatInstance
              ) {
                window.chatInstance.channels = channels
                if (typeof window.chatInstance.refreshChannelListUi === 'function') {
                  window.chatInstance.refreshChannelListUi()
                } else if (typeof window.chatInstance.init === 'function') {
                  window.chatInstance.init()
                }
              } else {
                // Dernier recours : réinitialiser complètement l'instance de chat
                if (
                  typeof window !== 'undefined' &&
                  window.chatInstance &&
                  typeof window.chatInstance.init === 'function'
                ) {
                  window.chatInstance.init()
                }
              }
            } catch (e) {
              console.warn('create-channel: unable to refresh channel list after create', e)
            }
          }
        } catch (e) {
          console.warn('create-channel: local refresh failed', e)
        }

        // Fermer la fenêtre de création après un petit délai pour laisser voir la notif
        setTimeout(() => {
          if (typeof window !== 'undefined' && typeof window.close === 'function') window.close()
        }, 1500)
      } else {
        const errorMessage = result?.data?.message ||
          result?.error || { key: 'pages.createChannel.errors.creationFailed' }
        notify('error', errorMessage)
      }
    } catch (err) {
      console.error('create-channel submit error', err)
      notify('error', { key: 'pages.createChannel.errors.creationFailed' })
    }
  })
}

// Bouton d'annulation : ferme simplement la fenêtre
const cancelBtn = document.getElementById('cancel-btn')
if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    if (typeof window !== 'undefined' && typeof window.close === 'function') window.close()
  })
}
