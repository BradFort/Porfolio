// Preload Electron
// Ce fichier expose des APIs sécurisées au renderer via contextBridge.
// On y définit :
// - electronAPI : contrôles de fenêtre, IPC génériques, auth, présence, stockage sécurisé
// - notificationAPI : notifications internes et système
// - api : façade haut niveau pour les tickets et channels
// - un raccourci clavier pour ouvrir les DevTools (Ctrl/Cmd + F)
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Bascule l'ouverture des DevTools de la fenêtre courante
  toggleDevTools: () => ipcRenderer.send('window:toggle-devtools'),

  // --- Contrôles de fenêtre ---
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // --- Helpers IPC génériques ---
  // Envoi simple (fire-and-forget)
  send: (channel, data) => ipcRenderer.send(channel, data),
  // Appel avec réponse (Promise)
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  // Écoute d'un channel IPC
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },

  // --- Événements de fenêtre ---
  onWindowMaximized: (callback) => ipcRenderer.on('window:maximized', callback),
  onWindowUnmaximized: (callback) => ipcRenderer.on('window:unmaximized', callback),

  // --- Authentification / état utilisateur ---
  authLogin: (user) => ipcRenderer.invoke('auth:setUser', user),
  getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
  logout: () => ipcRenderer.invoke('auth:logout'),

  setToken: (token) => ipcRenderer.invoke('auth:setToken', token),
  getToken: () => ipcRenderer.invoke('auth:getToken'),

  // --- Présence / typing (relayé au main, souvent ensuite au WebSocket) ---
  startTyping: () => ipcRenderer.send('presence:startTyping'),
  stopTyping: () => ipcRenderer.send('presence:stopTyping'),

  // Callback appelé à chaque mise à jour de présence (liste des en ligne)
  onOnlineUsers: (callback) => {
    ipcRenderer.on('presence:update', (_event, data) => callback(data.online))
  },

  // Callback appelé quand la liste des utilisateurs en train d'écrire change
  onTypingUsers: (callback) => {
    ipcRenderer.on('presence:update', (_event, data) => callback(data.typing))
  },

  // --- Channels (événements temps réel) ---
  sendNewChannel: (channel) => ipcRenderer.send('channel:new', channel),
  onNewChannel: (callback) => ipcRenderer.on('channel:add', (_event, channel) => callback(channel)),

  // Notifications système - méthode simple et directe (sans retour)
  showSystemNotification: (title, body) => {
    ipcRenderer.send('system:show-notification', { title, body })
  },

  // Récupération des types de notifications utilisateur
  getUserNotificationTypes: (userId) => ipcRenderer.invoke('user:getNotificationTypes', userId),

  // --- Stockage sécurisé pour les clés E2EE ---
  secureStorage: {
    /**
     * Stocke une valeur (déjà chiffrée côté main) dans le stockage sécurisé
     */
    setItem: (key, value) => ipcRenderer.invoke('secureStorage:setItem', { key, value }),
    /**
     * Récupère une valeur depuis le stockage sécurisé
     */
    getItem: (key) => ipcRenderer.invoke('secureStorage:getItem', key),
    /**
     * Supprime une entrée du stockage sécurisé
     */
    removeItem: (key) => ipcRenderer.invoke('secureStorage:removeItem', key),
    /**
     * Vide totalement le stockage sécurisé
     */
    clear: () => ipcRenderer.invoke('secureStorage:clear'),
    /**
     * Vérifie l'existence d'une clé dans le stockage sécurisé
     */
    hasItem: (key) => ipcRenderer.invoke('secureStorage:hasItem', key)
  }
})

// Ecoute de l'événement de création de channel depuis le main process
// Puis redispatch dans le contexte window via un CustomEvent
ipcRenderer.on('channel:created', (_event, newChannel) => {
  window.dispatchEvent(new CustomEvent('channelCreated', { detail: newChannel }))
})

// API pour les notifications
contextBridge.exposeInMainWorld('notificationAPI', {
  // Notifications internes (dans l'application, via systeme de toasts côté renderer)
  showNotification: (type, message, duration) => {
    return ipcRenderer.invoke('app:send-notification', { type, message, duration })
  },

  // Notifications système (OS) remontées depuis le main
  showSystemNotification: (title, body, type) => {
    return ipcRenderer.invoke('system:notification', { title, body, type })
  },

  // Écouter les notifications du processus principal (relayées vers l'UI)
  onNotification: (callback) => {
    ipcRenderer.on('app:notification', (_event, data) => {
      callback(data)
    })
  },

  // Nettoyer les listeners (utile lors d'un changement de page / cleanup)
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
    ipcRenderer.removeAllListeners('window:maximized')
    ipcRenderer.removeAllListeners('window:unmaximized')
  }
})

// API métier simplifiée pour le renderer (tickets, channels, etc.)
contextBridge.exposeInMainWorld('api', {
  channels: {
    // Ouvre la modale de création de channel côté main
    openCreateDialog: () => ipcRenderer.invoke('channel:openCreateDialog'),
    // Crée un channel via IPC (si utilisé)
    create: (channelData) => ipcRenderer.invoke('channel:create', channelData)
  },

  // Gestion des tickets (pages de support / admin)
  getTicket: (ticketId) => ipcRenderer.invoke('api:getTicket', ticketId),
  getTickets: () => ipcRenderer.invoke('api:getTickets'),
  addTicketComment: (ticketId, content) => ipcRenderer.invoke('api:addTicketComment', { ticketId, content }),
  assignTicket: (ticketId, assignData) => ipcRenderer.invoke('api:assignTicket', { ticketId, assignData }),
  updateTicketStatus: (ticketId, statusData) => ipcRenderer.invoke('api:updateTicketStatus', { ticketId, statusData }),
  updateTicketPriority: (ticketId, priorityData) => ipcRenderer.invoke('api:updateTicketPriority', { ticketId, priorityData }),
  deleteTicket: (ticketId) => ipcRenderer.invoke('api:deleteTicket', ticketId),
  getAllUsers: () => ipcRenderer.invoke('api:getAllUsers')
})

// Raccourci clavier global (dans la fenêtre renderer) pour ouvrir les DevTools
// Ctrl+F (Windows/Linux) ou Cmd+F (macOS) au lieu de la recherche classique
window.addEventListener(
  'keydown',
  (e) => {
    const isMac = process.platform === 'darwin'
    const modKey = isMac ? e.metaKey : e.ctrlKey

    if (modKey && e.key && e.key.toLowerCase() === 'f') {
      e.preventDefault()
      ipcRenderer.send('window:toggle-devtools')
    }
  },
  true
)
