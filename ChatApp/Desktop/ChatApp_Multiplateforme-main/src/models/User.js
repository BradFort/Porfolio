// Modèle représentant un utilisateur de l'application (utilisé côté client pour le chat)
export default class User {
  /**
   * Crée une nouvelle instance d'utilisateur
   * @param {number|string} id - Identifiant unique de l'utilisateur
   * @param {string} name - Pseudonyme / nom affiché de l'utilisateur
   * @param {('online'|'offline'|'away'|string)} [status='offline'] - Statut de présence
   * @param {boolean} [typing=false] - Indique si l'utilisateur est en train d'écrire
   * @param {('user'|'admin'|string)} [role='user'] - Rôle de l'utilisateur
   */
  constructor(id, name, status = 'offline', typing = false, role = 'user') {
    this.id = id
    this.name = name
    this.status = status
    this.typing = typing
    this.role = role
  }

  /**
   * Retourne le pseudonyme de l'utilisateur
   * @returns {string}
   */
  getPseudo() {
    return this.name
  }

  /**
   * Retourne le statut courant de l'utilisateur
   * @returns {string}
   */
  getStatus() {
    return this.status
  }

  /**
   * Met à jour le statut de l'utilisateur
   * @param {string} status - Nouveau statut (ex: 'online', 'offline')
   */
  setStatus(status) {
    this.status = status
  }

  /**
   * Indique si l'utilisateur est en train de taper un message
   * @param {boolean} isTyping - true si l'utilisateur tape, sinon false
   */
  setTyping(isTyping) {
    this.typing = isTyping
  }
}
