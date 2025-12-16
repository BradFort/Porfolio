import Chat from '../src/components/chat/Chat.js' // Composant principal de chat
import { getCurrentUser } from './components/auth/auth.js' // Utilitaire pour récupérer l'utilisateur courant
import TimeManager from './components/TimeManager.js' // Gestion de l'affichage de l'heure en temps réel
import WebSocketListener from '../../main/services/WebSocketListener.js' // Wrapper WebSocket côté renderer
import SetupInvitationButton from './components/invitations/SetupInvitationButton.js' // Initialisation du bouton d'invitation
import './components/menu/MenuManager.js' // Initialisation des menus (side effects)
import SetupNewDMButton from './components/dm/SetupNewDMButton.js' // Initialisation du bouton de nouveau DM
import { t, languageManager } from './lang/LanguageManager.js' // i18n : traduction + gestionnaire de langue
import './components/notifs/NotificationManager.js' // Gestionnaire global de notifications (side effects)
import E2EEManager from './components/crypto/E2EEManager.js' // Gestion du chiffrement de bout en bout
import E2EESettingsModal from './components/crypto/E2EESettingsModal.js' // Modal de configuration E2EE
import TicketManager from './components/ticket/ticketManager.js' // Gestionnaire de tickets (UI + API)

// Instance globale du chat pour la session
let chatInstance = null
// Indique si certains listeners globaux ont déjà été initialisés
let initialized = false
// Référence vers le listener WebSocket custom
let wsListener = null
// Fonction de désinscription de l'écouteur de changement de langue
let unsubscribeLang = null
// Gestionnaire de tickets (instancié une seule fois)
let ticketManager = null

// Nettoie l'état client (chat, websockets, notifications, listeners, etc.)
function clearClientState() {
  try {
    // Détruit proprement l'instance locale de chat si elle existe
    if (chatInstance && typeof chatInstance.destroy === 'function') {
      try {
        chatInstance.destroy()
      } catch (e) {
        console.warn('Error while destroying chatInstance:', e)
      }
    }
    chatInstance = null
    if (typeof window !== 'undefined') {
      try {
        // Détruit aussi l'instance attachée à window si présente
        if (window.chatInstance && typeof window.chatInstance.destroy === 'function') {
          window.chatInstance.destroy()
        }
      } catch (e) {
        console.warn('Error destroying window.chatInstance:', e)
      }
      window.chatInstance = null

      // Ferme le listener WebSocket du service de chat si présent
      if (window.chatService) {
        try {
          if (
            window.chatService.websocketListener &&
            typeof window.chatService.websocketListener.disconnect === 'function'
          ) {
            window.chatService.websocketListener.disconnect()
          }
        } catch (e) {
          console.warn('Error disconnecting window.chatService websocketListener:', e)
        }
        window.chatService = null
      }

      // Ferme aussi le listener WebSocketRenderer local s'il existe
      if (wsListener && typeof wsListener.disconnect === 'function') {
        try {
          wsListener.disconnect()
        } catch (e) {
          console.warn('Error disconnecting wsListener:', e)
        }
      }
      wsListener = null

      // Réinitialise quelques variables globales liées aux canaux
      if (typeof window !== 'undefined') {
        window.channelPages = null
        window.__currentChannelId = null
        window.messagesPerPage = null
      }

      // Nettoie toutes les notifications visibles
      try {
        if (
          window.notificationManager &&
          typeof window.notificationManager.removeAll === 'function'
        ) {
          window.notificationManager.removeAll()
        }
      } catch (e) {
        console.warn('Error clearing notifications:', e)
      }

      // Se désabonne du changement de langue
      if (unsubscribeLang) {
        unsubscribeLang()
        unsubscribeLang = null
      }
    }
  } catch (err) {
    console.warn('clearClientState error:', err)
  }
}

// Expose la fonction de reset globalement (utile lors du logout / reload forcé)
window.clearClientState = clearClientState

// Bouton d'accès aux statistiques utilisateur : redirige vers la page stats
document.getElementById('user-stats-btn').addEventListener('click', () => {
  window.location.href = 'src/pages/stats.html'
})

// Applique les traductions spécifiques au renderer (header, statut, réseau)
function applyRendererTranslations(user) {
  const welcome = document.getElementById('welcome')
  if (welcome && user?.name) {
    // Message de bienvenue personnalisé
    welcome.innerText = t('auth.welcome', { name: user.name })
  }

  const userStatus = document.getElementById('user-status')
  if (userStatus) userStatus.textContent = t('status.online')

  const networkText = document.getElementById('network-text')
  const networkStatusEl = document.getElementById('network-status')
  if (networkText && networkStatusEl) {
    let key = 'status.connected'
    if (networkStatusEl.classList.contains('reconnecting')) key = 'status.reconnecting'
    else if (networkStatusEl.classList.contains('disconnected')) key = 'status.disconnected'
    networkText.textContent = t(key)
  }
}

// Point d'entrée d'initialisation côté renderer
function init() {
  document.addEventListener('DOMContentLoaded', () => {
    // Initialise la page d'accueil (auth, état, websocket, E2EE, tickets...)
    initHome().catch(console.error)
    // Initialise l'UI du chat si la liste de canaux est présente
    initializeChats()
    // Met en place les contrôles de fenêtre (min/max/fermer/déconnexion)
    setupWindowControls()
    // Écoute les notifications venant du main ou de l'app
    setupNotificationListeners()
  })
}

// Met à jour la liste de présence en temps réel via des événements Electron
function setupPresenceListeners() {
  window.electronAPI.onOnlineUsers((users) => {
    const presenceList = document.getElementById('presenceList')
    if (!presenceList) return

    presenceList.innerHTML = ''
    users.forEach((u) => {
      const li = document.createElement('li')
      li.innerText = u
      presenceList.appendChild(li)
    })
  })
}

// Initialise la "home" : vérifie l'auth, synchronise le token, configure E2EE, tickets, typing, etc.
async function initHome() {
  await waitForEtatManager()

  // Met l'état initial en "reconnexion" pendant l'initialisation
  if (window.etatManager) {
    await window.etatManager.setEtat(t('status.reconnecting'))
  }

  // Récupère l'utilisateur courant
  const user = await getCurrentUser()
  if (!user || !user.id) {
    // Pas d'utilisateur : on met l'état en déconnecté et on renvoie vers le login
    if (window.etatManager) {
      await window.etatManager.setEtat(t('status.disconnected'))
    }
    window.location.href = './src/pages/login.html'
    return
  }

  // Synchronisation du token (décodage depuis le localStorage et envoi au main via electronAPI)
  try {
    const TOKEN_KEY = 'auth_token'
    const encodedToken = localStorage.getItem(TOKEN_KEY)
    if (encodedToken && window.electronAPI?.setToken) {
      const binary = atob(encodedToken)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const token = new TextDecoder().decode(bytes)

      await window.electronAPI.setToken(token)
    }
  } catch (error) {
    console.error('Error synchronizing token on startup:', error)
  }

  // Enregistre l'utilisateur dans Sentry pour le suivi d'erreurs
  Sentry.setUser({
    id: user.id,
    username: user.name,
    email: user.email || undefined
  })
  Sentry.setTag('user_id', user.id)

  // Informe le main process qu'un utilisateur est authentifié
  if (window.electronAPI && window.electronAPI.authLogin) {
    await window.electronAPI.authLogin(user)
  }

  // Initialisation du gestionnaire de tickets (boutons, modals, appels API)
  if (!ticketManager) {
    ticketManager = new TicketManager()
    ticketManager.init()
  }

  // Initialiser E2EE après l'authentification (nécessite une API de chat active)
  if (window.chatService && window.chatService.api) {
    try {
      await E2EEManager.initialize(window.chatService.api)
      E2EESettingsModal.initialize(window.chatService.api)
    } catch (error) {
      console.error("[E2EE] Erreur d'initialisation E2EE:", error)
    }
  }

  // Affiche le nom d'utilisateur dans le header
  const username = document.getElementById('username')
  if (username) {
    username.innerText = user.name
  }

  // Applique les textes traduits spécifiques à cette page
  applyRendererTranslations(user)
  // Abonnement au changement de langue pour re-appliquer les traductions dynamiquement
  if (!unsubscribeLang) {
    unsubscribeLang = languageManager.onChange(() => applyRendererTranslations(user))
  }

  // Listeners de présence temps réel (connectés, etc.), initialisés une fois
  if (!initialized) {
    setupPresenceListeners()
    initialized = true
  }

  // Gestion de l'indicateur "en train d'écrire" pour le chat
  const messageInput = document.querySelector('.message-input')
  let typingTimeout = null

  let isTyping = false

  messageInput?.addEventListener('input', () => {
    if (messageInput.value.length > 0) {
      if (!isTyping) {
        isTyping = true

        // Signale au main process qu'on commence à taper
        if (window.electronAPI) {
          window.electronAPI.startTyping()
        }

        // Signale au backend temps réel via WebSocketListener
        if (window.chatInstance && window.chatInstance.currentChannelId && wsListener) {
          wsListener.startTyping(window.chatInstance.currentChannelId)
        }
      }

      clearTimeout(typingTimeout)

      // Si aucune frappe pendant 1s, on arrête de signaler "typing"
      typingTimeout = setTimeout(() => {
        isTyping = false

        if (window.electronAPI) {
          window.electronAPI.stopTyping()
        }
        if (window.chatInstance && window.chatInstance.currentChannelId && wsListener) {
          wsListener.stopTyping(window.chatInstance.currentChannelId)
        }
      }, 1000)
    } else {
      // Champ vidé : on arrête immédiatement
      isTyping = false

      if (window.electronAPI) {
        window.electronAPI.stopTyping()
      }
      if (window.chatInstance && window.chatInstance.currentChannelId && wsListener) {
        wsListener.stopTyping(window.chatInstance.currentChannelId)
      }
      clearTimeout(typingTimeout)
    }
  })

  // Quand un message est effectivement envoyé, on stoppe l'état "typing"
  window.addEventListener('messageSent', () => {
    isTyping = false
    clearTimeout(typingTimeout)

    if (window.electronAPI) {
      window.electronAPI.stopTyping()
    }
    if (window.chatInstance && window.chatInstance.currentChannelId && wsListener) {
      wsListener.stopTyping(window.chatInstance.currentChannelId)
    }
  })

  // Bouton de logout (menu latéral / header)
  const logoutBtn = document.getElementById('logout')
  logoutBtn?.addEventListener('click', async () => {
    try {
      await window.electronAPI.logout()
    } catch (e) {
      console.warn('Electron logout error:', e)
    }

    clearClientState()
    window.location.href = './src/pages/login.html'
  })

  // Initialisation du listener WebSocket custom s'il n'existe pas encore
  if (!wsListener) {
    wsListener = new WebSocketListener()
    wsListener.on('pong', () => {}) // placeholder pour garder la connexion vivante
    wsListener.connect(user.token, user.id, user.name)
  }

  // Petit hack de démarrage typing pour synchroniser certains états côté main
  setTimeout(() => {
    window.electronAPI.startTyping()
    setTimeout(() => {
      window.electronAPI.stopTyping()
    }, 50)
  }, 200)

  // Après un court délai, on passe l'état global en "connecté"
  setTimeout(async () => {
    if (window.etatManager) {
      await window.etatManager.setEtat(t('status.connected'))
    }
  }, 500)
}

// Attend que window.etatManager soit disponible (avec timeout pour ne pas bloquer)
function waitForEtatManager(timeout = 5000) {
  return new Promise((resolve) => {
    if (window.etatManager) {
      resolve()
      return
    }

    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (window.etatManager) {
        clearInterval(checkInterval)
        resolve()
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval)
        console.warn('EtatManager non disponible après timeout')
        resolve() // Continuer quand même
      }
    }, 50)
  })
}

// Initialise l'interface de chat (liste des canaux, boutons d'invitation, DM...)
async function initializeChats() {
  if (document.getElementById('channels-list')) {
    try {
      let user = await getCurrentUser()
      if (!user) {
        // Pas d'user -> retour au login
        window.location.href = './src/pages/login.html'
      } else {
        if (chatInstance) {
          // Réutilise l'instance existante si l'utilisateur est le même, sinon met à jour
          if (chatInstance.currentUser.id !== user.id) {
            chatInstance.currentUser = user
          }
          chatInstance.init()
        } else {
          // Crée une nouvelle instance de Chat et l'expose globalement
          chatInstance = new Chat(user)
          window.chatInstance = chatInstance
        }

        // Initialise les boutons liés aux invitations et aux DM
        await SetupInvitationButton(chatInstance)
        SetupNewDMButton()
      }
    } catch (e) {
      console.error('[Renderer] Failed to initialize Channel UI', e)
    }
  }
}


// Met en place les listeners pour afficher les notifications (depuis Electron ou des events custom)
function setupNotificationListeners() {
  // Écouter les notifications du processus principal Electron
  if (window.electronAPI && window.electronAPI.onNotification) {
    window.electronAPI.onNotification((data) => {
      if (window.notificationManager) {
        window.notificationManager.show(data.type || 'info', data.message, data.duration || 3000)
      }
    })
  }

  // Écouter les événements personnalisés pour les notifications
  document.addEventListener('app:notification', (event) => {
    const data = event.detail
    if (window.notificationManager) {
      window.notificationManager.show(data.type || 'info', data.message, data.duration || 3000)
    }
  })
}

// Avant de fermer la fenêtre, on nettoie le chat et les listeners côté main
window.addEventListener('beforeunload', () => {
  if (chatInstance) {
    chatInstance.destroy()
  }
  if (window.electronAPI && window.electronAPI.removeWindowListeners) {
    window.electronAPI.removeWindowListeners()
  }
})

// Configure les boutons de la barre de titre (déconnexion, min/max, fermeture)
function setupWindowControls() {
  const disconnectBtn = document.querySelector('#disconnect')
  const minimizeBtn = document.querySelector('.titlebar-button.minimize')
  const maximizeBtn = document.querySelector('.titlebar-button.maximize')
  const closeBtn = document.querySelector('.titlebar-button.close')

  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async (event) => {
      event.preventDefault()
      try {
        const result = await window.electronAPI.logout()
        if (result && result.success) {
          clearClientState()
          localStorage.removeItem('auth_token')
          window.location.href = './src/pages/login.html'
        } else {
          console.error('Logout failed:', result?.error)
        }
      } catch (error) {
        console.error('Logout error:', error)
      }
    })
  }

  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', (event) => {
      event.preventDefault()
      window.electronAPI.minimizeWindow()
    })
  }

  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', (event) => {
      event.preventDefault()
      window.electronAPI.maximizeWindow()
    })
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (event) => {
      event.preventDefault()
      window.electronAPI.closeWindow()
    })
  }

  if (window.electronAPI) {
    // Mise à jour de l'icône/tooltip du bouton max en fonction de l'état de la fenêtre
    window.electronAPI.onWindowMaximized(() => {
      if (maximizeBtn) {
        maximizeBtn.innerText = '❐'
        maximizeBtn.title = 'Restore'
      }
    })

    window.electronAPI.onWindowUnmaximized(() => {
      if (maximizeBtn) {
        maximizeBtn.innerText = '□'
        maximizeBtn.title = 'Maximize'
      }
    })
  }
}

// Réception d'un message depuis d'autres fenêtres / iframes pour rafraîchir la liste des canaux
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'refresh-channels-list') {
    if (chatInstance && typeof chatInstance.refreshChannels === 'function') {
      chatInstance.refreshChannels()
    } else if (window.chatInstance && typeof window.chatInstance.refreshChannels === 'function') {
      window.chatInstance.refreshChannels()
    } else {
      window.location.reload()
    }
  }
})

// Démarre la mise à jour de l'heure en continu dans l'élément #current-time
new TimeManager('current-time')

// Lance l'initialisation globale du renderer
init()
