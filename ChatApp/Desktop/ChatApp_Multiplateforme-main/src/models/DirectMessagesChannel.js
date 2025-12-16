import Channel from './Channel.js'

// Représente une conversation privée (DM) entre deux utilisateurs
class DirectMessagesChannel extends Channel {
  /**
   * Crée un channel de messages directs entre deux utilisateurs
   * @param {number|string} id - Identifiant du DM
   * @param {string} name - Nom interne du DM
   * @param {import('./User.js').default} user1 - Premier participant
   * @param {import('./User.js').default} user2 - Second participant
   */
  constructor(id, name, user1, user2) {
    super(id, name, 'private', `Discussion entre ${user1} et ${user2}`, [user1, user2])
  }
}

export default DirectMessagesChannel
