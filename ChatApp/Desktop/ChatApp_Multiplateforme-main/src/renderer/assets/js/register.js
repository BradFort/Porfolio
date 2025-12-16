// Script de gestion de la page d'inscription
// - Validation côté client des champs (nom, email, mot de passe...)
// - Appel à la logique d'inscription métier
// - Affichage de notifications de succès/erreur
import { register } from '../../src/components/auth/auth.js'
import { t } from '../../src/lang/LanguageManager.js'

const form = document.getElementById('registerForm')

// Écoute de la soumission du formulaire d'inscription
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const name = document.getElementById('register-name').value.trim()
  const email = document.getElementById('register-email').value.trim()
  const password = document.getElementById('register-password').value
  const password_confirmation = document.getElementById('register-password-confirmation').value

  // Validation
  if (!name) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.enterName'))
    return
  }

  if (!email) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.enterEmail'))
    return
  }

  if (!isValidEmail(email)) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.enterValidEmail'))
    return
  }

  if (!password) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.enterPassword'))
    return
  }

  if (password.length < 8) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.passwordMin', { min: 8 }))
    return
  }

  if (password.length > 25) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.passwordMax', { max: 25 }))
    return
  }

  if (!password_confirmation) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.enterPasswordConfirmation'))
    return
  }

  if (password !== password_confirmation) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.passwordMismatch'))
    return
  }

  if (name.length > 25) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.nameMax', { max: 25 }))
    return
  }

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)

  if (!hasLetter) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.passwordLetter'))
    return
  }
  if (!hasUpper || !hasLower) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.passwordMixedCase'))
    return
  }
  if (!hasNumber) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.passwordNumber'))
    return
  }
  if (!hasSymbol) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.error(t('pages.register.errors.passwordSymbol'))
    return
  }

  const result = await register({ name, email, password, password_confirmation })

  if (result && result.success) {
    if (typeof window !== 'undefined' && window.notificationManager)
      window.notificationManager.success(t('pages.register.success'))
    setTimeout(() => {
      window.location.href = '../../index.html'
    }, 1500)
  }
})

// Fonction de validation d'email
// Utilise une regex simple pour vérifier la structure de l'email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
