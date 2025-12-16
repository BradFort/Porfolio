/**
 * Service de gestion des messages chiffrés E2EE - Version simplifiée
 * Gère le chiffrement et déchiffrement des messages avec les clés de session
 */

import CryptoService from './CryptoService.js'

class E2EEMessageService {
  /**
   * Chiffre un message avec une clé de session
   * @param {string} content - Contenu du message
   * @param {Uint8Array} sessionKey - Clé de session AES
   * @returns {Promise<Object>} - Message chiffré {encryptedContent, iv, authTag}
   */
  async encryptMessage(content, sessionKey) {
    try {
      const result = await CryptoService.encryptWithSessionKey(content, sessionKey)
      // Renommer ciphertext en encryptedContent pour correspondre au format de l'API
      return {
        encryptedContent: result.ciphertext,
        iv: result.iv,
        authTag: result.authTag
      }
    } catch (error) {
      console.error('[E2EE] Erreur de chiffrement:', error)
      throw error
    }
  }

  /**
   * Déchiffre un message avec une clé de session
   * @param {Object} encryptedMessage - Message chiffré {encryptedContent, iv, authTag}
   * @param {Uint8Array} sessionKey - Clé de session AES
   * @returns {Promise<string|null>} - Contenu déchiffré ou null
   */
  async decryptMessage(encryptedMessage, sessionKey) {
    try {
      const ciphertext =
        encryptedMessage.encryptedContent ||
        encryptedMessage.encrypted_content ||
        encryptedMessage.ciphertext
      const iv = encryptedMessage.iv || encryptedMessage.content_iv
      const authTag =
        encryptedMessage.authTag || encryptedMessage.auth_tag || encryptedMessage.content_auth_tag
      return await CryptoService.decryptWithSessionKey(ciphertext, iv, authTag, sessionKey)
    } catch {
      return null
    }
  }
}

export default new E2EEMessageService()
