// Module d'authentification côté renderer
// - Wrappe les appels à l'API (register, login, logout, me)
// - Synchronise l'état avec le process main via electronAPI
// - Affiche des notifications (toasts + notifications système)
import API from '../../../../main/api.js'
const api = new API()
import { t } from '../../lang/LanguageManager.js'

// Récupère l'API Electron exposée par le preload (si disponible)
function getElectronAPI() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI
  }
  return null
}

// Affiche une notification via le NotificationManager global
function showNotification(type, message, duration = 3000) {
  if (typeof window !== 'undefined' && window.notificationManager) {
    window.notificationManager.show(type, message, duration)
  }
}

/**
 * Inscription d'un nouvel utilisateur
 * - Appelle l'API /register
 * - En cas de succès, met à jour l'utilisateur côté main et envoie le token
 * - Affiche des notifications adaptées en fonction des erreurs retournées
 */
export async function register(registerData) {
  const result = await api.register(registerData)
  console.log('Registration errors:', result)
  if (result.success && result.data.data) {
    const user = result.data.data.user || result.data.data
    const electron = getElectronAPI()
    if (electron?.authLogin) {
      await electron.authLogin(user)
    }
    if (electron?.setToken && api.token) {
      await electron.setToken(api.token)
      console.log('Token sent to main process after registration')
    }
    showNotification('success', t('auth.welcome', { name: user.name || user.email }), 4000)
    if (electron) {
      try {
        const systemResult = await electron.showSystemNotification?.(
          `${t('app.name')} - ${t('pages.register.status')}`,
          t('auth.welcome', { name: user.name || user.email }),
          'success'
        )
        if (systemResult && !systemResult.success) {
          console.warn('System notification failed:', systemResult.error)
        }
      } catch (error) {
        console.warn('System notification error:', error)
      }
    }
  } else {
    let errorMsg = result?.data?.message || t('pages.register.errors.default')
    let errorsObj = result?.data?.errors || result?.errors || {}

    if (errorsObj.password && errorsObj.password.includes('validation.password.uncompromised')) {
      errorMsg = t('pages.register.errors.passwordUncompromised')
    } else if (errorsObj.name && errorsObj.name.includes('validation.unique')) {
      errorMsg = t('pages.register.errors.uniqueName')
    } else if (errorsObj.email && errorsObj.email.includes('validation.unique')) {
      errorMsg = t('pages.register.errors.uniqueEmail')
    } else if (Object.keys(errorsObj).length > 0) {
      const firstField = Object.keys(errorsObj)[0]
      errorMsg = Array.isArray(errorsObj[firstField]) ? errorsObj[firstField][0] : errorMsg
    }

    showNotification('error', errorMsg, 4000)
  }
  return result
}

/**
 * Connexion utilisateur
 * - Appelle l'API /login
 * - Si MFA est requis, renvoie simplement le résultat (le flux MFA est géré ailleurs)
 * - Sinon, authentifie l'utilisateur dans Electron et affiche des notifications
 */
export async function login(loginData) {
  const result = await api.login(loginData)

  if (result.success && result.data.data) {
    // Check if MFA is required
    if (result.data.data.mfa_required) {
      // Don't show success notification or log in yet
      // Just return the result with MFA info
      return result
    }

    // Normal login flow (no MFA)
    const user = result.data.data.user || result.data.data
    const electron = getElectronAPI()
    if (electron?.authLogin) {
      await electron.authLogin(user)
    }
    if (electron?.setToken && api.token) {
      await electron.setToken(api.token)
      console.log('Token sent to main process after login')
    }
    showNotification('success', t('auth.loginSuccess', { name: user.name || user.email }), 3000)
    if (electron) {
      try {
        const systemResult = await electron.showSystemNotification?.(
          `${t('app.name')} - ${t('pages.login.status')}`,
          t('auth.loginSuccess', { name: user.name || user.email }),
          'info'
        )
        if (systemResult && !systemResult.success) {
          console.warn('System notification failed:', systemResult.error)
        }
      } catch (error) {
        console.warn('System notification error:', error)
      }
    }
  } else {
    showNotification('error', t('common.loginerror'), 4000)
  }
  return result
}

/**
 * Récupère l'utilisateur courant via /me
 * @returns {Promise<object|null>} l'utilisateur ou null si non connecté
 */
export async function getCurrentUser() {
  const result = await api.me()
  if (result.success && result.data.data) {
    return result.data.data
  }
  return null
}

/**
 * Déconnexion utilisateur
 * - Appelle /logout côté API
 * - Informe le process main (authLogout) si disponible
 * - Nettoie l'état client (chat, service, etc.)
 * - Affiche un message d'au revoir + notification système
 */
export async function logout() {
  const user = await getCurrentUser()
  if (!user) return

  await api.logout()

  const electron = getElectronAPI()
  if (electron?.authLogout) {
    await electron.authLogout()
  }

  // Clear client-side renderer/chat state if a global helper is available
  try {
    if (typeof window !== 'undefined' && typeof window.clearClientState === 'function') {
      window.clearClientState()
    } else {
      // best-effort fallbacks
      if (typeof window !== 'undefined') {
        if (window.chatInstance && typeof window.chatInstance.destroy === 'function') {
          window.chatInstance.destroy()
        }

        window.chatInstance = null
        window.chatService = null
      }
    }
  } catch (e) {
    console.warn('Error clearing client state on logout:', e)
  }

  showNotification('info', t('auth.logoutGoodbye', { name: user.name }), 3000)

  if (electron) {
    try {
      const systemResult = await electron.showSystemNotification?.(
        `${t('app.name')} - ${t('toolbar.disconnect')}`,
        t('auth.logoutGoodbye', { name: user.name }),
        'info'
      )
      if (systemResult && !systemResult.success) {
        console.warn('System notification failed:', systemResult.error)
      }
    } catch (error) {
      console.warn('System notification error:', error)
    }
  }
}
