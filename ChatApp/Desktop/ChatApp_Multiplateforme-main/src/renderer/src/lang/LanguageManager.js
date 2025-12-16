// Gestionnaire de langues centralisé : charge les dictionnaires, mémorise la langue courante
import { fr } from './fr.js'
import { en } from './en.js'
import { getCurrentUser } from '../components/auth/auth.js'

// Dictionnaires disponibles, indexés par code de langue
const dictionaries = { fr, en }

class LanguageManager {
  constructor() {
    // Code de langue courant (par défaut : français)
    this.current = 'fr'
    // Liste de callbacks à appeler quand la langue change
    this.listeners = []
    // Flag pour s'assurer que l'init ne s'exécute qu'une seule fois
    this.initialized = false
  }

  // Initialise la langue au démarrage de l'application
  // 1) essaie de lire la langue depuis le localStorage
  // 2) sinon, tente d'utiliser la langue de l'utilisateur connecté
  async init() {
    if (this.initialized) return // évite de tout refaire si déjà initialisé

    const ls = typeof window !== 'undefined' ? window.localStorage : null
    const stored = ls ? ls.getItem('lang') : null
    if (stored && dictionaries[stored]) {
      // Si une langue valide est stockée, on l'utilise
      this.current = stored
    } else {
      // Sinon, on essaie de récupérer la langue préférée de l'utilisateur
      const user = await getCurrentUser()
      if (user?.lang && dictionaries[user.lang]) {
        this.current = user.lang
        if (ls) ls.setItem('lang', this.current) // on la persiste pour les prochaines fois
      }
    }

    this.initialized = true
  }

  // Retourne la langue actuellement utilisée
  getLang() {
    return this.current
  }

  // Change la langue active et notifie tous les écouteurs inscrits
  async setLang(lang) {
    if (!dictionaries[lang]) return // ignore si la langue n'est pas supportée
    this.current = lang
    const ls = typeof window !== 'undefined' ? window.localStorage : null

    // Sauvegarde de la langue choisie dans le navigateur
    if (ls) ls.setItem('lang', this.current)

    // Notifie tous les callbacks enregistrés (i18n DOM, composants, etc.)
    this.listeners.forEach((cb) => {
      cb(lang)
    })
  }

  // Permet à un composant de s'abonner aux changements de langue
  // Renvoie une fonction de désabonnement
  onChange(cb) {
    if (typeof cb === 'function') this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((c) => c !== cb)
    }
  }

  // Fonction de traduction principale
  // - key : chemin de la traduction (ex: 'menuTop.file')
  // - params : valeurs à injecter dans les placeholders {name}
  t(key, params = {}) {
    // Sélectionne le dictionnaire de la langue courante, ou fr par défaut
    const dict = dictionaries[this.current] || fr

    // Parcourt l'objet via les segments séparés par des points
    const raw = key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), dict)

    // Si la clé n'existe pas ou ne renvoie pas une string, on renvoie la clé brute
    if (typeof raw !== 'string') return key

    // Remplace les placeholders {param} par les valeurs fournies dans params
    return raw.replace(/\{(\w+)}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`))
  }
}

// Instance unique du gestionnaire de langue utilisée partout dans l'app
export const languageManager = new LanguageManager()
// Helper pratique pour traduire directement sans importer languageManager partout
export const t = (key, params) => languageManager.t(key, params)
