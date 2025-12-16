// Gestion de la barre de menus principale (Fichier, Paramètres, Affichage, Outils, Autres)
import { t } from '../../lang/LanguageManager.js'
import NotificationSettingsModal from '../notifs/NotificationSettingsModal.js'
import E2EESettingsModal from '../crypto/E2EESettingsModal.js'
import MFASettingsModal from '../auth/MFASettingsModal.js'

class MenuManager {
  constructor() {
    // Initialisation immédiate de la barre de menus
    this.init()
  }

  init() {
    this.setupMenuBar()
  }

  // Configure chaque entrée de la barre de menus
  setupMenuBar() {
    // Menu "Fichier"
    this.setupFichierMenu()

    // Menu "Paramètres" (remplace l'ancien menu Édition)
    this.setupSettingsMenu()

    // Menu "Affichage"
    this.setupAffichageMenu()

    // Menu "Outils"
    this.setupOutilsMenu()

    // Menu "Autres"
    this.setupOtherMenu()
  }

  // Menu Fichier : Déconnexion, Quitter
  setupFichierMenu() {
    const fichierMenu = document.querySelector('.menu-item:nth-child(1)')
    if (!fichierMenu) return

    fichierMenu.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleSubmenu(fichierMenu, [
        { label: t('menu.file.disconnect'), action: () => this.disconnect() },
        { type: 'separator' },
        { label: t('menu.file.quit'), action: () => this.quit() }
      ])
    })
  }

  // Menu Paramètres : thème, langue, statut, notifications, E2EE, MFA
  setupSettingsMenu() {
    const settingsMenu = document.querySelector('.menu-item:nth-child(2)')
    if (!settingsMenu) return

    settingsMenu.addEventListener('click', (e) => {
      e.stopPropagation()

      // Sous-menu de sélection du thème (clair/sombre)
      const currentTheme = window.themeManager?.currentTheme || 'light'
      const themeSubmenu = [
        {
          label: `${currentTheme === 'dark' ? '☑' : '☐'} ${t('menu.view.darkMode')}`,
          action: () => {
            if (window.themeManager && window.themeManager.currentTheme !== 'dark') {
              window.themeManager.toggleTheme()
            }
          }
        },
        {
          label: `${currentTheme === 'light' ? '☑' : '☐'} ${t('menu.view.lightMode')}`,
          action: () => {
            if (window.themeManager && window.themeManager.currentTheme !== 'light') {
              window.themeManager.toggleTheme()
            }
          }
        }
      ]

      // Sous-menu langue (FR/EN)
      const currentLang = window.themeManager?.currentLang || 'fr'
      const languageSubmenu = [
        {
          label: `${currentLang === 'en' ? '●' : '○'} ${t('menu.settings.languageEn') || 'English'}`,
          action: () => this.setLanguage('en')
        },
        {
          label: `${currentLang === 'fr' ? '●' : '○'} ${t('menu.settings.languageFr') || 'Français'}`,
          action: () => this.setLanguage('fr')
        }
      ]

      // Sous-menu statut (connecté / reconnexion / déconnecté)
      const statusText = document.getElementById('network-text')?.innerText || t('status.connected')
      const changeStatusSubmenu = [
        {
          label:
            statusText === t('status.connected')
              ? `● ${t('status.connected')}`
              : `○ ${t('status.connected')}`,
          action: () => this.setStatus(t('status.connected'))
        },
        {
          label:
            statusText === t('status.reconnecting')
              ? `● ${t('status.reconnecting')}`
              : `○ ${t('status.reconnecting')}`,
          action: () => this.setStatus(t('status.reconnecting'))
        },
        {
          label:
            statusText === t('status.disconnected')
              ? `● ${t('status.disconnected')}`
              : `○ ${t('status.disconnected')}`,
          action: () => this.setStatus(t('status.disconnected'))
        }
      ]

      this.toggleSubmenu(settingsMenu, [
        { label: t('menu.settings.theme'), submenu: themeSubmenu },
        { label: t('menu.settings.language'), submenu: languageSubmenu },
        { type: 'separator' },
        { label: t('menu.tools.changeStatus'), submenu: changeStatusSubmenu },
        { type: 'separator' },
        { label: t('menu.settings.notifications'), action: () => this.openNotifications() },
        { label: '🔒 Chiffrement E2EE', action: () => this.openE2EESettings() },
        { label: '🔐 Authentification MFA', action: () => this.openMFASettings() }
      ])
    })
  }

  // Menu Affichage : zoom +/- / reset
  setupAffichageMenu() {
    const affichageMenu = document.querySelector('.menu-item:nth-child(3)')
    if (!affichageMenu) return

    affichageMenu.addEventListener('click', (e) => {
      e.stopPropagation()

      this.toggleSubmenu(affichageMenu, [
        { label: t('menu.view.zoomIn'), action: () => this.zoomIn() },
        { label: t('menu.view.zoomOut'), action: () => this.zoomOut() },
        { label: t('menu.view.resetZoom'), action: () => this.resetZoom() }
      ])
    })
  }

  // Menu Outils : DevTools, Refresh
  setupOutilsMenu() {
    const outilsMenu = document.querySelector('.menu-item:nth-child(4)')
    if (!outilsMenu) return

    outilsMenu.addEventListener('click', (e) => {
      e.stopPropagation()

      this.toggleSubmenu(outilsMenu, [
        { label: t('menu.tools.devTools'), action: () => this.toggleDevTools() },
        { type: 'separator' },
        { label: t('menu.tools.refresh'), action: () => window.location.reload() }
      ])
    })
  }

  // Menu Autres : création de salon, invitations, nouveau DM
  setupOtherMenu() {
    const otherMenu = document.querySelector('.menu-item:nth-child(5)')
    if (!otherMenu) return

    otherMenu.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleSubmenu(otherMenu, [
        { label: t('menu.others.newChannel'), action: () => this.createNewChannel() },
        { label: t('menu.others.viewInvitations'), action: () => this.showInvitations() },
        { label: t('menu.others.newDm'), action: () => this.createNewDM() }
      ])
    })
  }

  // Affiche un sous-menu (liste d'items) sous un élément de menu principal
  toggleSubmenu(menuItem, items) {
    this.closeAllSubmenus()

    const submenu = document.createElement('div')
    submenu.className = 'menu-submenu'

    items.forEach((item) => {
      if (item.type === 'separator') {
        const separator = document.createElement('div')
        separator.className = 'menu-separator'
        submenu.appendChild(separator)
      } else if (item.submenu) {
        const submenuItem = this.createSubmenuItem(item.label, item.submenu)
        submenu.appendChild(submenuItem)
      } else {
        const menuOption = document.createElement('div')
        menuOption.className = 'menu-option'
        if (item.disabled) {
          menuOption.classList.add('disabled')
        }
        menuOption.textContent = item.label

        if (!item.disabled && item.action) {
          menuOption.addEventListener('click', (e) => {
            e.stopPropagation()
            item.action()
            this.closeAllSubmenus()
          })
        }

        submenu.appendChild(menuOption)
      }
    })

    const rect = menuItem.getBoundingClientRect()
    submenu.style.position = 'absolute'
    submenu.style.left = `${rect.left}px`
    submenu.style.top = `${rect.bottom}px`

    document.body.appendChild(submenu)

    // Fermer le sous-menu au prochain clic global
    setTimeout(() => {
      document.addEventListener('click', () => this.closeAllSubmenus(), { once: true })
    }, 0)
  }

  // Crée un item qui possède lui-même un sous-menu (sous-sous-menu)
  createSubmenuItem(label, subitems) {
    const container = document.createElement('div')
    container.className = 'menu-option has-submenu'
    container.textContent = label + ' ▶'

    let submenu = null

    container.addEventListener('mouseenter', () => {
      // Supprime les autres sous-menus imbriqués avant d'en ajouter un nouveau
      document.querySelectorAll('.menu-submenu-nested').forEach((s) => s.remove())

      submenu = document.createElement('div')
      submenu.className = 'menu-submenu-nested'

      subitems.forEach((item) => {
        const option = document.createElement('div')
        option.className = 'menu-option'
        option.textContent = item.label

        option.addEventListener('click', (e) => {
          e.stopPropagation()
          item.action()
          this.closeAllSubmenus()
        })

        submenu.appendChild(option)
      })

      const rect = container.getBoundingClientRect()
      submenu.style.position = 'absolute'
      submenu.style.left = `${rect.right}px`
      submenu.style.top = `${rect.top}px`

      document.body.appendChild(submenu)
    })

    container.addEventListener('mouseleave', (e) => {
      // Check si la souris va vers le sous-menu ou ailleurs
      const toElement = e.relatedTarget
      if (!toElement || !toElement.closest('.menu-submenu-nested')) {
        setTimeout(() => {
          if (submenu && !submenu.matches(':hover')) {
            submenu.remove()
          }
        }, 100)
      }
    })

    return container
  }

  // Ferme tous les sous-menus ouverts
  closeAllSubmenus() {
    document.querySelectorAll('.menu-submenu, .menu-submenu-nested').forEach((submenu) => {
      submenu.remove()
    })
  }

  // Clique programmatique sur le bouton Nouveau salon
  createNewChannel() {
    const newChannelBtn = document.getElementById('new-channel')
    if (newChannelBtn) {
      newChannelBtn.click()
    }
  }

  // Clique programmatique sur le bouton Voir les invitations
  showInvitations() {
    const inviteBtn = document.getElementById('receive-invite')
    if (inviteBtn) {
      inviteBtn.click()
    }
  }

  // Clique programmatique sur le bouton Déconnexion
  async disconnect() {
    const disconnectBtn = document.querySelector('#disconnect')
    if (disconnectBtn) {
      disconnectBtn.click()
    }
  }

  // Quitte l'application (via Electron)
  quit() {
    if (window.electronAPI) {
      window.electronAPI.closeWindow()
    }
  }

  // Change la langue (persistance via ThemeManager + i18n DOM)
  async setLanguage(lang) {
    if (window.themeManager && typeof window.themeManager.updateUserLang === 'function') {
      const result = await window.themeManager.updateUserLang(lang)
      if (!result || result.success) {
        if (window.__i18n && typeof window.__i18n.set === 'function') {
          await window.__i18n.set(lang)
        }
        if (window.__i18n && typeof window.__i18n.apply === 'function') {
          await window.__i18n.apply()
        }
        window.themeManager.currentLang = lang
        const langButton = document.getElementById('toggle-lang')
        if (langButton) langButton.textContent = lang === 'fr' ? 'FR' : 'EN'
      }
    }
  }

  // Ouvre le modal des paramètres de notifications
  openNotifications() {
    const modal = new NotificationSettingsModal(window.chatService)
    modal.show()
  }

  // Zoom avant
  zoomIn() {
    const currentZoom = parseFloat(document.body.style.zoom || '1')
    document.body.style.zoom = Math.min(currentZoom + 0.1, 2).toString()
  }

  // Zoom arrière
  zoomOut() {
    const currentZoom = parseFloat(document.body.style.zoom || '1')
    document.body.style.zoom = Math.max(currentZoom - 0.1, 0.5).toString()
  }

  // Rétablit le zoom à 100 %
  resetZoom() {
    document.body.style.zoom = '1'
  }

  // Change le statut réseau / présence via EtatManager
  setStatus(status) {
    if (window.etatManager) {
      window.etatManager.setEtat(status)
    }
  }

  // (Dés)active les DevTools via Electron, ou affiche un message si indisponible
  toggleDevTools() {
    if (window.electronAPI && window.electronAPI.toggleDevTools) {
      window.electronAPI.toggleDevTools()
    } else {
      console.log(t('menu.tools.devToolsNotAvailable'))
    }
  }

  // Clique programmatique sur le bouton Nouveau DM
  createNewDM() {
    const newDmBtn = document.getElementById('new-dm')
    if (newDmBtn) {
      newDmBtn.click()
    }
  }

  // Ouvre le modal de configuration E2EE
  openE2EESettings() {
    E2EESettingsModal.open()
  }

  // Ouvre le modal de configuration MFA (authentification multi-facteurs)
  openMFASettings() {
    console.log('openMFASettings called')
    console.log('window.chatService:', window.chatService)
    if (!window.chatService) {
      console.error('ChatService not available')
      return
    }
    try {
      const modal = new MFASettingsModal(window.chatService)
      console.log('MFASettingsModal created:', modal)
      modal.show()
    } catch (error) {
      console.error('Error creating MFASettingsModal:', error)
    }
  }
}

// Instancie et expose le gestionnaire de menu une fois le DOM chargé
document.addEventListener('DOMContentLoaded', () => {
  window.menuManager = new MenuManager()
})

export default MenuManager
