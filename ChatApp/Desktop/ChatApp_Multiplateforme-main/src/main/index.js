// Initialisation de Sentry pour le process principal d'Electron
import * as Sentry from '@sentry/electron/main'

Sentry.init({
  // DSN du projet Sentry (suivi des erreurs en production)
  dsn: 'https://3b235366f8b799f4332e7a696cc982ba@o4510364795469824.ingest.us.sentry.io/4510364826206208',
  environment: process.env.NODE_ENV || 'development',
  release: 'chatapp-desktop@0.3.0',

  // Tags pour identifier la source
  tags: {
    platform: 'desktop',
    app: 'electron',
    os: process.platform
  },

  tracesSampleRate: 1.0,

  // Attache l'utilisateur courant à chaque événement Sentry si disponible
  beforeSend(event) {
    if (global.currentUser) {
      event.user = {
        id: global.currentUser.id,
        username: global.currentUser.name
      }
    }
    return event
  }
})

import { app, BrowserWindow, ipcMain, Menu, Notification } from 'electron'
import path from 'path'
import fs from 'fs'
import secureStorage from './services/SecureStorage.js'
import API from './api.js'

// Crée un répertoire de manière sûre (utilisé pour les caches / userData)
function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (e) {
    console.error('[startup] Failed to create dir', dir, e)
  }
}

// Configuration des chemins de données et de cache de l'application
try {
  const appData = app.getPath('appData')
  const userData = path.join(appData, 'ChatApp_XP')
  app.setPath('userData', userData)

  const cacheDir = path.join(userData, 'Cache')
  const mediaCacheDir = path.join(userData, 'MediaCache')
  const gpuCacheDir = path.join(userData, 'GPUCache')
  ensureDir(cacheDir)
  ensureDir(mediaCacheDir)
  ensureDir(gpuCacheDir)

  // Redirige les caches Chromium vers nos répertoires
  app.commandLine.appendSwitch('disk-cache-dir', cacheDir)
  app.commandLine.appendSwitch('media-cache-dir', mediaCacheDir)
} catch (e) {
  console.error('[startup] Cache/userData setup failed:', e)
}

// État global maintenu dans le process principal
let currentUser = null
let typingUsers = new Set()
let windows = []
let mainWindow
let apiInstance = null
let authToken = null

// Exposé global pour Sentry (voir beforeSend)
global.currentUser = null

/**
 * Retourne le chemin de l’icône adaptée à la plateforme
 * - .ico pour Windows
 * - .icns pour macOS
 * - .png pour Linux/Autres
 */
function getIcon() {
  if (process.platform === 'win32') {
    return path.join(__dirname, '../../resources/jdVance.ico')
  } else if (process.platform === 'darwin') {
    return path.join(__dirname, '../../resources/jdVance.icns')
  } else {
    return path.join(__dirname, '../../resources/jdVance.png')
  }
}

/**
 * Ouvre la fenêtre modale de création de channel
 * @param {BrowserWindow} parentWindow - Fenêtre parente
 */
function openCreateChannelModal(parentWindow) {
  const modal = new BrowserWindow({
    parent: parentWindow,
    modal: true,
    show: false,
    width: 600,
    height: 600,
    resizable: false,
    minimizable: false,
    maximizable: false,
    icon: getIcon(),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (app.isPackaged) {
    modal
      .loadFile(
        path.join(
          process.resourcesPath,
          'app.asar.unpacked',
          'src',
          'renderer',
          'src',
          'pages',
          'create-channel.html'
        )
      )
      .catch(() => {
        modal.loadFile(
          path.join(__dirname, '..', '..', 'renderer', 'src', 'pages', 'create-channel.html')
        )
      })
  } else {
    modal.loadFile(path.join(__dirname, '../../src/renderer/src/pages/create-channel.html'))
  }

  modal.once('ready-to-show', () => modal.show())
}

/**
 * Enregistre tous les handlers IPC (pont entre renderer et main)
 * - Authentification / état utilisateur
 * - Notifications système
 * - Gestion des fenêtres
 * - Stockage sécurisé (E2EE)
 * - Accès aux tickets (API backend)
 */
function setupIPC() {
  apiInstance = new API()

  // Raccourci pour ouvrir / fermer les DevTools depuis le renderer
  ipcMain.on('window:toggle-devtools', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      } else {
        mainWindow.webContents.openDevTools()
      }
    }
  })

  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.minimize()
    }
  })

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && win !== mainWindow) {
      win.close()
    } else if (win === mainWindow) {
      app.quit()
    }
  })

  ipcMain.handle('auth:setUser', async (_event, user) => {
    currentUser = user
    global.currentUser = user
    return { success: true }
  })

  ipcMain.handle('auth:setToken', async (_event, token) => {
    authToken = token
    if (apiInstance) {
      apiInstance.token = token
    }
    return { success: true }
  })

  ipcMain.handle('auth:getToken', async () => {
    return { success: true, token: authToken }
  })

  ipcMain.handle('auth:getCurrentUser', async () => {
    return currentUser
  })

  ipcMain.handle('auth:logout', async () => {
    if (currentUser) {
      typingUsers.delete(currentUser.name)
      currentUser = null
      global.currentUser = null
    }
    return { success: true }
  })

  ipcMain.on('presence:startTyping', () => {
    if (currentUser) {
      typingUsers.add(currentUser.name)
      // Note: Le typing est maintenant géré par WebSocket côté renderer
    } else {
      console.warn('Main: currentUser est null!')
    }
  })

  ipcMain.on('presence:stopTyping', () => {
    if (currentUser) {
      typingUsers.delete(currentUser.name)
      // Note: Le typing est maintenant géré par WebSocket côté renderer
    }
  })

  ipcMain.on('system:show-notification', (_evt, { title, body }) => {
    try {
      if (!Notification.isSupported()) {
        console.log('System notifications not supported')
        return
      }

      const notification = new Notification({
        title: title || 'Notification',
        body: body || 'Nouveau message',
        icon: getIcon()
      })

      notification.show()

      notification.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore()
          }
          mainWindow.focus()
        }
      })
    } catch (error) {
      console.error('Error showing system notification:', error)
    }
  })

  ipcMain.handle('system:notification', (_evt, { title, body }) => {
    try {
      if (!Notification.isSupported()) {
        console.log('System notifications not supported')
        return { success: false, error: 'Notifications système non supportées' }
      }

      const notification = new Notification({
        title: title || 'Notification',
        body: body || 'Nouveau message',
        icon: getIcon()
      })

      notification.show()

      notification.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore()
          }
          mainWindow.focus()
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Error showing system notification:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('app:send-notification', (_evt, { type, message, duration }) => {
    if (mainWindow) {
      mainWindow.webContents.send('app:notification', {
        type: type || 'info',
        message: message || 'Notification de test',
        duration: duration || 3000
      })
      return { success: true }
    }
    console.log('Main window not available for app notification')
    return { success: false, error: 'Fenêtre principale non disponible' }
  })

  ipcMain.handle('channel:openCreateDialog', async (event) => {
    const newChannel = await openCreateChannelModal(BrowserWindow.fromWebContents(event.sender))
    if (newChannel) {
      event.sender.send('channel:created', newChannel)
    }
  })

  ipcMain.on('channel:new', (event, channel) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (win !== BrowserWindow.fromWebContents(event.sender)) {
        win.webContents.send('channel:add', channel)
      }
    })
    if (mainWindow) {
      mainWindow.webContents.send('channel:created', channel)
    }
  })

  // Gestionnaires pour le stockage sécurisé E2EE
  ipcMain.handle('secureStorage:setItem', async (_event, { key, value }) => {
    try {
      const success = await secureStorage.setItem(key, value)
      return { success }
    } catch (error) {
      console.error('[SecureStorage IPC] Erreur setItem:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('secureStorage:getItem', async (_event, key) => {
    try {
      const value = await secureStorage.getItem(key)
      return { success: true, value }
    } catch (error) {
      console.error('[SecureStorage IPC] Erreur getItem:', error)
      return { success: false, value: null, error: error.message }
    }
  })

  ipcMain.handle('secureStorage:removeItem', async (_event, key) => {
    try {
      const success = await secureStorage.removeItem(key)
      return { success }
    } catch (error) {
      console.error('[SecureStorage IPC] Erreur removeItem:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('secureStorage:clear', async () => {
    try {
      const success = await secureStorage.clear()
      return { success }
    } catch (error) {
      console.error('[SecureStorage IPC] Erreur clear:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('secureStorage:hasItem', async (_event, key) => {
    try {
      const value = await secureStorage.getItem(key)
      return { success: true, exists: value !== null && value !== undefined }
    } catch (error) {
      console.error('Error checking secure storage:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ticket:openDetail', async (_event, ticketId) => {
    try {
      const ticketWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#ece9d8',
        icon: getIcon(),
        webPreferences: {
          preload: path.join(__dirname, '../preload/index.js'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          devTools: true // Activer DevTools
        },
        frame: false,
        show: false
      })

      ticketWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' ||
            (input.control && input.shift && input.key === 'I') ||
            (input.control && input.key === 'F')) {
          ticketWindow.webContents.toggleDevTools()
          event.preventDefault()
        }
      })

      if (app.isPackaged) {
        ticketWindow
          .loadFile(
            path.join(
              process.resourcesPath,
              'app.asar.unpacked',
              'src',
              'renderer',
              'src',
              'pages',
              'ticketDetail.html'
            )
          )
          .then(() => {
            ticketWindow.webContents.send('ticket:load', ticketId)
          })
          .catch(() => {
            ticketWindow
              .loadFile(path.join(__dirname, '..', '..', 'renderer', 'src', 'pages', 'ticketDetail.html'))
              .then(() => {
                ticketWindow.webContents.send('ticket:load', ticketId)
              })
          })
      } else {
        ticketWindow
          .loadFile(path.join(__dirname, '../../src/renderer/src/pages/ticketDetail.html'))
          .then(() => {
            ticketWindow.webContents.send('ticket:load', ticketId)
          })
      }

      ticketWindow.once('ready-to-show', () => {
        ticketWindow.show()
      })

      ipcMain.on('window:minimize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) win.minimize()
      })

      ipcMain.on('window:maximize', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) {
          if (win.isMaximized()) {
            win.unmaximize()
          } else {
            win.maximize()
          }
        }
      })

      ipcMain.on('window:close', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win && win !== mainWindow) {
          win.close()
        } else if (win === mainWindow) {
          app.quit()
        }
      })

      ticketWindow.on('closed', () => {
      })

      return { success: true }
    } catch (error) {
      console.error('Error opening ticket detail window:', error)
      return { success: false, error: error.message }
    }
  })

  // Handlers API pour les tickets et les utilisateurs
  ipcMain.handle('api:getTicket', async (_event, ticketId) => {
    try {
      if (!apiInstance) {
        apiInstance = new API()
      }
      if (authToken) {
        apiInstance.token = authToken
      }
      const result = await apiInstance.getTicket(ticketId)
      return result
    } catch (error) {
      console.error('Error in api:getTicket:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('api:getTickets', async () => {
    try {
      if (!apiInstance) {
        apiInstance = new API()
      }
      if (authToken && !apiInstance.token) {
        apiInstance.token = authToken
      }
      const result = await apiInstance.getTickets()
      return result
    } catch (error) {
      console.error('Error in api:getTickets:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('api:addTicketComment', async (_event, { ticketId, content }) => {
    try {
      if (!apiInstance) {
        apiInstance = new API()
      }
      if (authToken) {
        apiInstance.token = authToken
      }
      console.log('[API] addTicketComment - Has token:', !!apiInstance.token)
      const result = await apiInstance.addTicketComment(ticketId, { content })
      return result
    } catch (error) {
      console.error('Error in api:addTicketComment:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('api:assignTicket', async (_event, { ticketId, assignData }) => {
    try {
      if (!apiInstance) {
        apiInstance = new API()
      }
      if (authToken && !apiInstance.token) {
        apiInstance.token = authToken
      }
      const result = await apiInstance.assignTicket(ticketId, assignData)
      return result
    } catch (error) {
      console.error('Error in api:assignTicket:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('api:updateTicketStatus', async (_event, { ticketId, statusData }) => {
    try {
      if (!apiInstance) {
        apiInstance = new API()
      }
      if (authToken && !apiInstance.token) {
        apiInstance.token = authToken
      }
      const result = await apiInstance.updateTicketStatus(ticketId, statusData)
      return result
    } catch (error) {
      console.error('Error in api:updateTicketStatus:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('api:updateTicketPriority', async (_event, { ticketId, priorityData }) => {
    try {
      if (!apiInstance) {
        apiInstance = new API()
      }
      if (authToken && !apiInstance.token) {
        apiInstance.token = authToken
      }
      const result = await apiInstance.updateTicketPriority(ticketId, priorityData)
      return result
    } catch (error) {
      console.error('Error in api:updateTicketPriority:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('api:deleteTicket', async (_event, ticketId) => {
    try {
      if (!apiInstance) {
        apiInstance = new API()
      }
      if (authToken) {
        apiInstance.token = authToken
      }
      const result = await apiInstance.deleteTicket(ticketId)
      return result
    } catch (error) {
      console.error('Error in api:deleteTicket:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('api:getAllUsers', async (_event) => {
    try {
      if (!apiInstance) {
        apiInstance = new API()
      }
      if (authToken) {
        apiInstance.token = authToken
      }
      const result = await apiInstance.getAllUsers()
      return result
    } catch (error) {
      console.error('Error in api:getAllUsers:', error)
      return { success: false, error: error.message }
    }
  })
}

/**
 * Crée la fenêtre principale de l’application (vue de chat + navigation)
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1400,
    show: false,
    icon: getIcon(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '../preload/index.js')
    },
    title: 'Système de Chat'
  })

  if (app.isPackaged) {
    mainWindow
      .loadFile(
        path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'renderer', 'index.html')
      )
      .catch(() => {
        mainWindow.loadFile(path.join(__dirname, '..', '..', 'renderer', 'index.html'))
      })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'))
  }

  windows.push(mainWindow)

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:unmaximized')
  })

  mainWindow.on('closed', () => {
    const index = windows.indexOf(mainWindow)
    if (index > -1) {
      windows.splice(index, 1)
    }
    mainWindow = null
  })

  mainWindow.webContents.once('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(
      'console.log("notificationAPI available:", typeof window.notificationAPI !== "undefined")'
    )
    mainWindow.webContents.executeJavaScript(
      'console.log("electronAPI available:", typeof window.electronAPI !== "undefined")'
    )
  })

  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      if (mainWindow) {
        mainWindow.webContents.send('app:notification', {
          type: 'success',
          message: 'Application de notifications chargée avec succès !'
        })
      }
    }, 1000)
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

/**
 * Crée le menu d’application (actuellement vide, mais prêt pour extensions)
 */
function createMenu() {
  const template = []

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Cycle de vie de l’application Electron
app.whenReady().then(() => {
  setupIPC()
  createMainWindow()
  createMenu()
})

// Sur Windows / Linux, quitter quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Sur macOS, recrée une fenêtre quand l’icône du dock est cliquée
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

console.log('Application Electron demarree')
