import messageReceiver from './MessageReceiver.js'

// Représente un salon de discussion (channel) classique
class Channel extends messageReceiver {
  /**
   * Crée un nouveau channel
   * @param {number|string} id - Identifiant du channel
   * @param {string} name - Nom du channel
   * @param {('public'|'private'|string)} [type='public'] - Type de channel
   * @param {string} [description=''] - Description du channel
   * @param {import('./User.js').default[]} [userList=[]] - Liste des utilisateurs membres
   * @param {import('./Message.js').default[]} [messagesList=[]] - Liste des messages initiaux
   * @param {Date} [createdAt=new Date()] - Date de création
   */
  constructor(
    id,
    name,
    type = 'public',
    description = '',
    userList = [],
    messagesList = [],
    createdAt = new Date()
  ) {
    super(messagesList, userList)
    this.id = id
    this.name = name
    this.type = type
    this.description = description
    this.createdAt = createdAt
  }

  /**
   * Retourne la date de création formatée AAAA-MM-JJ
   * @returns {string}
   */
  getCreatedTime() {
    const year = String(this.createdAt.getFullYear())
    const month = String(this.createdAt.getMonth() + 1).padStart(2, '0')
    const day = String(this.createdAt.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

export default Channel
