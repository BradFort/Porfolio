import User from './User.js'

// Classe représentant un message envoyé par un utilisateur dans un channel/DM
class Message {
  /**
   * Crée une nouvelle instance de message
   * @param {User} sender - Utilisateur qui envoie le message
   * @param {string} content - Contenu texte du message
   * @param {number|Date} [timestamp=Date.now()] - Date/heure d'envoi (ms ou objet Date)
   * @throws {Error} Si les paramètres sont invalides
   */
  constructor(sender, content, timestamp = Date.now()) {
    if (
      sender instanceof User &&
      typeof content === 'string' &&
      content.trim() !== '' &&
      (timestamp instanceof Date || typeof timestamp === 'number')
    ) {
      this.sender = sender
      this.content = content
      this.timestamp = timestamp instanceof Date ? timestamp.getTime() : timestamp
    } else {
      throw new Error('Message invalide')
    }
  }

  /**
   * Retourne une représentation du message sous forme de tableau
   * [pseudonyme, date (Date), contenu]
   * @returns {[string, Date, string]}
   */
  show() {
    const username = this.sender.getPseudo()
    const date = new Date(this.timestamp)
    return [username, date, this.content]
  }
}

export default Message
