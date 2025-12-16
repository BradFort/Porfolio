/**
 * Gestionnaire principal E2EE - Version simplifiée
 * - 1 paire de clés par utilisateur
 * - 1 clé de session par channel
 * - Code de récupération pour multi-device
 */

import E2EEKeyManager from './E2EEKeyManager.js'
import E2EEMessageService from './E2EEMessageService.js'

class E2EEManager {
  constructor() {
    this.isReady = false
    this.api = null
  }

  /**
   * Initialise le système E2EE
   */
  async initialize(api) {
    this.api = api

    try {
      // Initialiser les clés
      const keysInitialized = await E2EEKeyManager.initialize()
      if (!keysInitialized) {
        console.error("[E2EE] Échec d'initialisation des clés")
        return false
      }

      // Enregistrer la clé publique sur le serveur seulement si on a un token
      if (api.token) {
        const registered = await E2EEKeyManager.registerKeysOnServer(api)
        if (!registered) {
          // Silencieux - pas besoin de logger, c'est déjà fait dans registerKeysOnServer
        }
      }

      this.isReady = true
      return true
    } catch (error) {
      console.error("[E2EE] Erreur d'initialisation:", error)
      return false
    }
  }

  /**
   * Active E2EE pour un channel
   */
  async enableForChannel(channelId, memberIds) {
    if (!this.isReady) {
      console.error('[E2EE] Système non initialisé')
      return false
    }

    try {
      return await E2EEKeyManager.createAndDistributeSessionKey(this.api, channelId, memberIds)
    } catch (error) {
      console.error("[E2EE] Erreur d'activation E2EE:", error)
      return false
    }
  }

  /**
   * Envoie un message chiffré
   */
  async sendEncryptedMessage(channelId, content) {
    if (!this.isReady) {
      console.error('[E2EE] Système non initialisé')
      return null
    }

    try {
      // Récupérer ou obtenir la clé de session
      let sessionKey = E2EEKeyManager.getSessionKey(channelId)
      if (!sessionKey) {
        sessionKey = await E2EEKeyManager.fetchSessionKey(this.api, channelId)
        if (!sessionKey) {
          console.error("[E2EE] Impossible d'obtenir la clé de session")
          return null
        }
      }

      // Chiffrer le message avec AES-GCM
      const { encryptedContent, iv, authTag } = await E2EEMessageService.encryptMessage(
        content,
        sessionKey
      )

      if (!encryptedContent) {
        console.error('[E2EE] Échec du chiffrement du message')
        return null
      }

      // Envoyer le message chiffré au serveur via la route /encrypted-messages
      return await this.api.sendEncryptedMessage({
        channel_id: channelId,
        encrypted_content: encryptedContent,
        iv: iv,
        auth_tag: authTag
      })
    } catch (error) {
      console.error('[E2EE] Erreur de chiffrement/envoi du message:', error)
      return null
    }
  }

  /**
   * Déchiffre un message
   */
  async decryptMessage(channelId, encryptedMessage) {
    if (!this.isReady) {
      console.error('[E2EE] Système non initialisé')
      return null
    }

    try {
      // Récupérer ou obtenir la clé de session
      let sessionKey = E2EEKeyManager.getSessionKey(channelId)
      if (!sessionKey) {
        sessionKey = await E2EEKeyManager.fetchSessionKey(this.api, channelId)
        if (!sessionKey) {
          console.error("[E2EE] Impossible d'obtenir la clé de session")
          return null
        }
      }

      // Déchiffrer le message
      return await E2EEMessageService.decryptMessage(encryptedMessage, sessionKey)
    } catch (error) {
      console.error('[E2EE] Erreur de déchiffrement du message:', error)
      return null
    }
  }

  /**
   * Vérifie si un channel utilise E2EE
   */
  async isChannelEncrypted(channelId) {
    return E2EEKeyManager.getSessionKey(channelId) !== null
  }

  /**
   * Récupère les clés avec un code de récupération
   */
  async recoverKeys(recoveryCode) {
    try {
      const success = await E2EEKeyManager.recoverWithCode(recoveryCode)
      if (success) {
        this.isReady = true
      }
      return success
    } catch (error) {
      console.error('[E2EE] Erreur de récupération:', error)
      return false
    }
  }

  /**
   * Obtient le code de récupération
   */
  getRecoveryCode() {
    return E2EEKeyManager.getRecoveryCode()
  }

  /**
   * Vérifie si E2EE est initialisé
   */
  isInitialized() {
    return this.isReady && E2EEKeyManager.isInitialized()
  }

  /**
   * Obtient la clé de session pour un channel
   */
  getSessionKey(channelId) {
    return E2EEKeyManager.getSessionKey(channelId)
  }

  /**
   * Récupère la clé de session depuis le serveur
   */
  async fetchSessionKey(api, channelId) {
    return await E2EEKeyManager.fetchSessionKey(api, channelId)
  }
  /**
   * Réinitialise E2EE
   */
  async reset() {
    await E2EEKeyManager.clearAllKeys()
    this.isReady = false
  }
}

export default new E2EEManager()
