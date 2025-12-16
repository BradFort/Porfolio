import Message from './Message.js'
import User from './User.js'

// Classe abstraite représentant un récepteur de messages (channel, DM, etc.)
export class MessageReceiver {
  /**
   * @param {Message[]} [messageList=[]] - Liste initiale des messages
   * @param {User[]} [userList=[]] - Liste initiale des utilisateurs
   * @throws {TypeError|Error} Si les listes contiennent des valeurs invalides ou dupliquées
   */
  constructor(messageList = [], userList = []) {
    if (new.target === MessageReceiver) {
      throw new TypeError("Impossible d'instancier une classe abstraite.")
    }
    for (let i = 0; i < messageList.length; i++) {
      if (!(messageList[i] instanceof Message)) {
        throw new TypeError(`Message non reconnu dans la liste : ${messageList[i]}`)
      }
      if (messageList.filter((m) => m === messageList[i]).length !== 1) {
        throw new Error(`Message dupliqué dans la liste : ${messageList[i].show()}`)
      }
    }
    for (let j = 0; j < messageList.length; j++) {
      if (!(userList[j] instanceof User)) {
        throw new TypeError(`Utilisateur non reconnu dans la liste : ${userList[j]}`)
      }
      if (userList.filter((u) => u === userList[j]).length !== 1) {
        throw new Error(`Utilisateur dupliqué dans la liste : ${userList[j].getPseudo()}`)
      }
    }

    this.messageList = messageList
    this.userList = userList
  }

  /**
   * Ajoute un message à la conversation
   * @param {Message} message - Message à ajouter
   */
  addMessage(message) {
    if (!(message instanceof Message)) {
      throw new TypeError(`Récepteur de message non reconnu : ${message}`)
    }
    if (this.messageList.includes(message)) {
      throw new Error('Message déjà présent dans la liste')
    }

    this.messageList.push(message)
  }

  /**
   * Retourne la liste des messages
   * @returns {any[]} - Représentations de messages (dépend de messageCreator)
   */
  getMessages() {
    const messageElements = []
    this.messageList.forEach((message) => {
      let messageElement = this.messageCreator(message)
      messageElements.push(messageElement)
    })

    return messageElements
  }

  /**
   * Ajoute un utilisateur au récepteur de messages
   * @param {User} user - Utilisateur à ajouter
   */
  addUser(user) {
    if (!(user instanceof User)) {
      throw new TypeError(`Utilisateur non reconnu : ${user}`)
    }
    if (this.userList.includes(user)) {
      throw new Error(`Utilisateur déjà présent dans la liste : ${user.getPseudo()}`)
    }
    this.userList.push(user)
  }

  /**
   * Supprime un utilisateur du récepteur de messages
   * @param {User} user - Utilisateur à supprimer
   */
  removeUser(user) {
    if (!(user instanceof User)) {
      throw new TypeError(`Utilisateur non reconnu : ${user}`)
    }
    this.userList = this.userList.filter((u) => u !== user)
  }

  /**
   * Retourne la liste des utilisateurs associés
   * @returns {User[]}
   */
  getUsers() {
    return this.userList
  }

  /**
   * Retourne le nombre d'utilisateurs associés
   * @returns {number}
   */
  getUsersCount() {
    return this.userList.length
  }
}

export default MessageReceiver
