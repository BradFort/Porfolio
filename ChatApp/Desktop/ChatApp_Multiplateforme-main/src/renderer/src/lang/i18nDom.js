// Gestion de l'application des traductions i18n directement sur le DOM
import { t, languageManager } from './LanguageManager.js'

// Indique si l'initialisation globale a déjà été faite
let initialized = false
// Évite de lancer plusieurs fois applyTranslations en parallèle
let isApplying = false
// Timer utilisé pour "throttler" les appels à applyTranslations
let applyTimer = null
// MutationObserver pour surveiller les changements du DOM
let observer = null
// Mémorise la dernière langue appliquée (utile pour éviter des refresh inutiles)
let lastAppliedLang = null

// Applique les traductions sur certains éléments statiques connus
function applyKnownStatics() {
  const menuBar = document.querySelector('.menu-bar')
  if (menuBar) {
    const items = menuBar.querySelectorAll('.menu-item')
    if (items[0]) items[0].textContent = t('menuTop.file')
    if (items[1]) items[1].textContent = t('menuTop.settings')
    if (items[2]) items[2].textContent = t('menuTop.view')
    if (items[3]) items[3].textContent = t('menuTop.tools')
    if (items[4]) items[4].textContent = t('menuTop.other')
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

  const toggleStatus = document.getElementById('toggle-status')
  if (toggleStatus) toggleStatus.textContent = t('menu.tools.changeStatus')

  const langBtn = document.getElementById('toggle-language')
  if (langBtn) {
    const span = langBtn.querySelector('span')
    if (span) span.textContent = t('buttons.switchLanguage')
  }
}

// Balaye le DOM pour appliquer les traductions sur tous les éléments marqués data-i18n
async function applyTranslations() {
  if (isApplying) return
  isApplying = true
  try {
    // S'assure que la langue est initialisée avant de traduire
    await languageManager.init()

    // Titre de la fenêtre : si aucun <title data-i18n>, on utilise app.name en fallback
    const titleEl = document.querySelector('title[data-i18n]')
    if (!titleEl) {
      document.title = t('app.name') || document.title
    }

    // Met à jour l'attribut lang sur <html>
    let currentLang = languageManager.getLang() || 'fr'
    document.documentElement?.setAttribute('lang', currentLang)

    // Tous les éléments à traduire
    const targets = document.querySelectorAll('[data-i18n]')

    targets.forEach((el) => {
      const key = el.getAttribute('data-i18n')
      const attr = el.getAttribute('data-i18n-attr')
      const value = t(key)

      // Si data-i18n-attr est présent, on applique sur un attribut (ex: placeholder)
      if (attr) {
        el.setAttribute(attr, value)
      } else {
        // Sinon, on change simplement le texte
        el.textContent = value
      }

      // Traduction d'autres attributs via data-i18n-xxx
      Array.from(el.attributes)
        .filter(
          (a) =>
            a.name.startsWith('data-i18n-') && a.name !== 'data-i18n' && a.name !== 'data-i18n-attr'
        )
        .forEach((a) => {
          const targetAttr = a.name.replace('data-i18n-', '')
          const v = t(a.value)
          if (v && v !== a.value) {
            el.setAttribute(targetAttr, v)
          }
        })
    })

    // Applique quelques traductions "spéciales" en plus du data-i18n générique
    applyKnownStatics()

    // Hooks facultatifs exposés globalement pour que d'autres parties de l'app
    // puissent réagir au changement de langue
    if (
      window.__updateChatInputPlaceholder &&
      typeof window.__updateChatInputPlaceholder === 'function'
    ) {
      window.__updateChatInputPlaceholder()
    }

    if (window.__updateNotMemberMessage && typeof window.__updateNotMemberMessage === 'function') {
      window.__updateNotMemberMessage()
    }

    if (
      (lastAppliedLang == null || lastAppliedLang !== currentLang) &&
      typeof window.__refreshUserSidebar === 'function'
    ) {
      window.__refreshUserSidebar()
    }

    if (window.__updateTypingIndicator && typeof window.__updateTypingIndicator === 'function') {
      window.__updateTypingIndicator()
    }

    // Mémorise la dernière langue qui a été appliquée au DOM
    lastAppliedLang = currentLang
  } finally {
    isApplying = false
  }
}

// Programme un applyTranslations avec un léger délai (évite les appels trop fréquents)
function scheduleApply() {
  if (isApplying) return
  if (applyTimer) clearTimeout(applyTimer)
  applyTimer = setTimeout(() => {
    applyTranslations()
  }, 50)
}

// Configure le bouton qui permet de changer de langue dans l'UI
function setupLanguageToggle() {
  const btn = document.getElementById('toggle-language')
  if (!btn) return

  const label = btn.querySelector('[data-i18n]')
  // Si aucun label géré par data-i18n et que le texte est vide, on met un label par défaut
  if (!label && btn.textContent.trim() === '') {
    btn.textContent = t('buttons.switchLanguage')
  }

  btn.addEventListener('click', async (e) => {
    e.preventDefault()

    // Possibilité de déléguer la logique de changement de langue à themeManager
    if (window.themeManager && typeof window.themeManager.toggleLanguage === 'function') {
      await window.themeManager.toggleLanguage()
      return
    }

    // Sinon, on bascule simplement fr <-> en via LanguageManager
    await languageManager.init()
    const current = languageManager.getLang() || 'fr'
    const next = current === 'fr' ? 'en' : 'fr'
    await languageManager.setLang(next)
    await applyTranslations()
  })
}

// Surveille le DOM pour réappliquer les traductions quand du contenu est inséré/modifié
function setupDomObserver() {
  if (observer) observer.disconnect()
  observer = new MutationObserver(() => scheduleApply())
  observer.observe(document.documentElement || document.body, {
    childList: true,
    characterData: true,
    subtree: true
  })
}

// Point d'entrée : initialise le système i18n pour le DOM
export async function initI18nDom() {
  if (initialized) return
  initialized = true
  if (document.readyState === 'loading') {
    // Si le DOM n'est pas encore prêt, on attend DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      applyTranslations()
      setupLanguageToggle()
      setupDomObserver()
    })
  } else {
    // Sinon, on applique immédiatement
    await applyTranslations()
    setupLanguageToggle()
    setupDomObserver()
  }

  // À chaque changement de langue notifié par LanguageManager, on réapplique les traductions
  languageManager.onChange(() => applyTranslations())

  // Expose une petite API globale pour forcer une réapplication depuis ailleurs si besoin
  window.__i18n = {
    apply: applyTranslations,
    get lang() {
      return languageManager.getLang()
    },
    set(lang) {
      return languageManager.setLang(lang)
    }
  }
}

// Initialise automatiquement l'i18n DOM au chargement du module
initI18nDom()
