// Script de gestion de la page de connexion
// - Validation du formulaire (email/mot de passe)
// - Appel à la logique d'authentification métier
// - Gestion du flux MFA (ou redirection directe)
import { login } from '../../src/components/auth/auth.js'
import { t } from '../../src/lang/LanguageManager.js'
import MFAVerificationModal from '../../src/components/auth/MFAVerificationModal.js'
import API from '../../../main/api.js'

// Référence au formulaire de login
const form = document.getElementById('loginForm')

// Récupère l'API Electron exposée par le preload (si disponible)
function getElectronAPI() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI
  }
  return null
}

// Gestion de la soumission du formulaire de connexion
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value

  if (!email) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.login.errors.enterEmail'))
    return
  }

  if (!isValidEmail(email)) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.login.errors.enterValidEmail'))
    return
  }

  if (!password) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.login.errors.enterPassword'))
    return
  }

  if (password.length < 8) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.login.errors.passwordMin', { min: 8 }))
    return
  }

  const result = await login({ email, password })

  if (result.success) {
    // Check if MFA is required
    if (result.data?.data?.mfa_required) {
      // Show MFA verification modal
      const tempToken = result.data.data.temp_token
      const userEmail = result.data.data.email

      try {
        const mfaModal = new MFAVerificationModal(userEmail, tempToken)
        const mfaResult = await mfaModal.show()

        // Log full MFA verification response for debugging
        console.log('[login] MFA verification response:', mfaResult)

        // Only proceed if MFA returned a full authenticated user/token
        if (mfaResult && mfaResult.success && mfaResult.data && mfaResult.data.user) {
          // Save token if provided by MFA verify
          const token = mfaResult.data.token || null
          if (token) {
            try {
              const api = new API()
              api.saveToken(token)
            } catch (err) {
              console.warn('Failed to save token after MFA verification', err)
            }
          } else {
            console.warn('MFA verification succeeded but no token was returned')
          }

          // MFA verification successful, handle electron auth
          const user = mfaResult.data.user
          const electron = getElectronAPI()

          if (electron?.authLogin && user) {
            await electron.authLogin(user)
          }

          if (typeof window !== 'undefined' && window.notificationManager) {
            window.notificationManager.success(
              t('auth.loginSuccess', { name: user?.name || userEmail }),
              3000
            )
          }

          // System notification
          if (electron) {
            try {
              const systemResult = await electron.showSystemNotification?.(
                `${t('app.name')} - ${t('pages.login.status')}`,
                t('auth.loginSuccess', { name: user?.name || userEmail }),
                'info'
              )
              if (systemResult && !systemResult.success) {
                console.warn('System notification failed:', systemResult.error)
              }
            } catch (error) {
              console.warn('System notification error:', error)
            }
          }

          setTimeout(() => {
            window.location.href = '../../index.html'
          }, 1500)
        } else {
          // MFA flow didn't return a valid authenticated user; show error and stay on login
          console.warn('MFA modal closed without full authentication:', mfaResult)
          if (typeof window !== 'undefined' && window.notificationManager) {
            window.notificationManager.error('Échec de la vérification MFA. Veuillez réessayer.')
          }
        }
      } catch (error) {
        console.error('MFA verification error:', error)
        if (typeof window !== 'undefined' && window.notificationManager) {
          window.notificationManager.error('Vérification MFA annulée')
        }
      }
    } else {
      // No MFA required, redirect directly
      setTimeout(() => {
        window.location.href = '../../index.html'
      }, 1500)
    }
  }
})

// Fonction de validation d'email
// Vérifie le format de base sous forme "quelquechose@domaine.tld"
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
