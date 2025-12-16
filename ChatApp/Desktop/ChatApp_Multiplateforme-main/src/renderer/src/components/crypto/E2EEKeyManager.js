/**
 * Gestionnaire des clés E2EE - Version simplifiée
 * - 1 paire de clés RSA par utilisateur (publique/privée)
 * - 1 clé AES par channel (session)
 * - Code de récupération pour multi-device
 */

import CryptoService from './CryptoService.js'

const STORAGE_KEYS = {
  IDENTITY_PUBLIC: 'e2ee_identity_public',
  IDENTITY_PRIVATE: 'e2ee_identity_private',
  SESSION_KEYS: 'e2ee_session_keys',
  RECOVERY_CODE: 'e2ee_recovery_code'
}

class E2EEKeyManager {
  constructor() {
    this.identityKeys = null // Paire RSA de l'utilisateur
    this.sessionKeys = new Map() // channelId -> clé AES
    this.recoveryCode = null
    this.keysRegisteredOnServer = false // Flag pour éviter les enregistrements répétés
  }

  /**
   * Vérifie si le stockage sécurisé est disponible
   */
  isSecureStorageAvailable() {
    return typeof window !== 'undefined' && window.electronAPI && window.electronAPI.secureStorage
  }

  async secureSetItem(key, value) {
    if (this.isSecureStorageAvailable()) {
      const result = await window.electronAPI.secureStorage.setItem(key, value)
      return result.success
    } else {
      console.warn('[E2EE] Stockage sécurisé non disponible')
      return false
    }
  }

  async secureGetItem(key) {
    if (this.isSecureStorageAvailable()) {
      const result = await window.electronAPI.secureStorage.getItem(key)
      return result.value
    } else {
      console.warn('[E2EE] Stockage sécurisé non disponible')
      return null
    }
  }

  async secureRemoveItem(key) {
    if (this.isSecureStorageAvailable()) {
      const result = await window.electronAPI.secureStorage.removeItem(key)
      return result.success
    } else {
      return false
    }
  }

  /**
   * Initialise les clés E2EE
   */
  async initialize() {
    try {
      // Essayer de charger les clés existantes
      const loaded = await this.loadKeysFromStorage()
      if (loaded) {
        return true
      }
      await this.generateAndStoreKeys()
      return true
    } catch (error) {
      console.error("[E2EE] Erreur d'initialisation:", error)
      return false
    }
  }

  /**
   * Génère une paire de clés RSA et un code de récupération
   */
  async generateAndStoreKeys() {
    this.identityKeys = await CryptoService.generateIdentityKeyPair()
    this.recoveryCode = this.generateRecoveryCode()
    await this.saveKeysToStorage()
  }

  /**
   * Génère un code de récupération aléatoire
   */
  generateRecoveryCode() {
    const words = [
      'alpha',
      'bravo',
      'charlie',
      'delta',
      'echo',
      'foxtrot',
      'golf',
      'hotel',
      'india',
      'juliet',
      'kilo',
      'lima',
      'mike',
      'november',
      'oscar',
      'papa',
      'quebec',
      'romeo',
      'sierra',
      'tango',
      'uniform',
      'victor',
      'whiskey',
      'xray',
      'yankee',
      'zulu',
      'tiger',
      'lion',
      'eagle',
      'shark',
      'wolf',
      'bear'
    ]

    const selectedWords = []
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * words.length)
      selectedWords.push(words[randomIndex])
    }

    return selectedWords.join('-')
  }

  /**
   * Affiche le code de récupération à l'utilisateur
   */
  showRecoveryCodeModal(code) {
    const modal = document.createElement('div')
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `

    modal.innerHTML = `
      <div style="
        background: var(--background-secondary, #2f3136);
        padding: 32px;
        border-radius: 12px;
        max-width: 500px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      ">
        <h2 style="margin: 0 0 16px 0; color: var(--text-primary, #fff); display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 32px;">🔑</span>
          Code de récupération E2EE
        </h2>
        <p style="color: var(--text-secondary, #b9bbbe); margin: 0 0 16px 0; line-height: 1.5;">
          <strong style="color: #f04747;">⚠️ Important :</strong> Sauvegardez ce code en lieu sûr.
          Il vous permettra de récupérer vos clés sur un autre appareil.
        </p>
        <div style="
          background: var(--background-tertiary, #202225);
          padding: 20px;
          border-radius: 8px;
          margin: 16px 0;
          font-family: monospace;
          font-size: 16px;
          color: #43b581;
          text-align: center;
          word-break: break-all;
          border: 2px solid #43b581;
        ">${code}</div>
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button id="copyRecoveryCode" style="
            flex: 1;
            padding: 12px;
            background: #5865f2;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">📋 Copier</button>
          <button id="closeRecoveryModal" style="
            flex: 1;
            padding: 12px;
            background: #43b581;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          ">✓ J'ai sauvegardé</button>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    document.getElementById('copyRecoveryCode').addEventListener('click', () => {
      navigator.clipboard.writeText(code)
      alert('Code copié dans le presse-papier !')
    })

    document.getElementById('closeRecoveryModal').addEventListener('click', () => {
      modal.remove()
    })
  }

  /**
   * Sauvegarde les clés dans le stockage sécurisé
   */
  async saveKeysToStorage() {
    if (!this.identityKeys) {
      throw new Error('Aucune clé à sauvegarder')
    }

    const identityPublic = await CryptoService.exportPublicKey(this.identityKeys.publicKey)
    const identityPrivate = await CryptoService.exportPrivateKey(this.identityKeys.privateKey)

    const encryptedPrivateKey = await this.encryptWithRecoveryCode(
      identityPrivate,
      this.recoveryCode
    )

    await this.secureSetItem(STORAGE_KEYS.IDENTITY_PUBLIC, identityPublic)
    await this.secureSetItem(STORAGE_KEYS.IDENTITY_PRIVATE, encryptedPrivateKey)
    await this.secureSetItem(STORAGE_KEYS.RECOVERY_CODE, this.recoveryCode)
    await this.saveSessionKeysToStorage()
  }

  /**
   * Chiffre la clé privée avec le code de récupération
   */
  async encryptWithRecoveryCode(privateKey, recoveryCode) {
    const encoder = new TextEncoder()
    const data = encoder.encode(privateKey)
    const password = encoder.encode(recoveryCode)

    // Dériver une clé depuis le code de récupération
    const keyMaterial = await window.crypto.subtle.importKey('raw', password, 'PBKDF2', false, [
      'deriveBits',
      'deriveKey'
    ])

    const salt = window.crypto.getRandomValues(new Uint8Array(16))

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data)

    // Concaténer salt + iv + données chiffrées
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    result.set(salt, 0)
    result.set(iv, salt.length)
    result.set(new Uint8Array(encrypted), salt.length + iv.length)

    return CryptoService.encodeBase64(result)
  }

  /**
   * Déchiffre la clé privée avec le code de récupération
   */
  async decryptWithRecoveryCode(encryptedData, recoveryCode) {
    const data = CryptoService.decodeBase64(encryptedData)
    const encoder = new TextEncoder()
    const password = encoder.encode(recoveryCode)

    // Extraire salt, iv et données chiffrées
    const salt = data.slice(0, 16)
    const iv = data.slice(16, 28)
    const encrypted = data.slice(28)

    const keyMaterial = await window.crypto.subtle.importKey('raw', password, 'PBKDF2', false, [
      'deriveBits',
      'deriveKey'
    ])

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  /**
   * Charge les clés depuis le stockage sécurisé
   */
  async loadKeysFromStorage() {
    try {
      const identityPublic = await this.secureGetItem(STORAGE_KEYS.IDENTITY_PUBLIC)
      const encryptedPrivate = await this.secureGetItem(STORAGE_KEYS.IDENTITY_PRIVATE)
      const recoveryCode = await this.secureGetItem(STORAGE_KEYS.RECOVERY_CODE)

      if (!identityPublic || !encryptedPrivate || !recoveryCode) {
        return false
      }

      // Déchiffrer la clé privée
      const identityPrivate = await this.decryptWithRecoveryCode(encryptedPrivate, recoveryCode)

      this.identityKeys = {
        publicKey: await CryptoService.importPublicKey(identityPublic, 'ECDH'),
        privateKey: await CryptoService.importPrivateKey(identityPrivate, 'ECDH')
      }

      this.recoveryCode = recoveryCode

      this.keysRegisteredOnServer = true

      // Charger les clés de session
      await this.loadSessionKeysFromStorage()

      return true
    } catch (error) {
      console.error('[E2EE] Erreur de chargement des clés:', error)
      return false
    }
  }

  /**
   * Récupère les clés avec un code de récupération (nouveau device)
   */
  async recoverWithCode(recoveryCode) {
    try {
      // Dans un vrai système, on récupérerait la clé privée chiffrée depuis le serveur
      // Pour l'instant, on suppose qu'elle est stockée localement
      const encryptedPrivate = await this.secureGetItem(STORAGE_KEYS.IDENTITY_PRIVATE)
      const identityPublic = await this.secureGetItem(STORAGE_KEYS.IDENTITY_PUBLIC)

      if (!encryptedPrivate || !identityPublic) {
        throw new Error('Aucune clé à récupérer')
      }

      const identityPrivate = await this.decryptWithRecoveryCode(encryptedPrivate, recoveryCode)

      this.identityKeys = {
        publicKey: await CryptoService.importPublicKey(identityPublic, 'ECDH'),
        privateKey: await CryptoService.importPrivateKey(identityPrivate, 'ECDH')
      }

      this.recoveryCode = recoveryCode
      return true
    } catch (error) {
      console.error('[E2EE] Erreur de récupération:', error)
      return false
    }
  }

  /**
   * Sauvegarde les clés de session
   */
  async saveSessionKeysToStorage() {
    const sessionKeysArray = Array.from(this.sessionKeys.entries()).map(
      ([channelId, sessionKey]) => ({
        channelId,
        sessionKey: CryptoService.encodeBase64(sessionKey)
      })
    )

    await this.secureSetItem(STORAGE_KEYS.SESSION_KEYS, JSON.stringify(sessionKeysArray))
  }

  /**
   * Charge les clés de session
   */
  async loadSessionKeysFromStorage() {
    try {
      const stored = await this.secureGetItem(STORAGE_KEYS.SESSION_KEYS)
      if (!stored) return

      const sessionKeysArray = JSON.parse(stored)
      this.sessionKeys.clear()

      sessionKeysArray.forEach((item) => {
        this.sessionKeys.set(item.channelId, CryptoService.decodeBase64(item.sessionKey))
      })
    } catch (error) {
      console.error('[E2EE] Erreur de chargement des clés de session:', error)
    }
  }

  /**
   * Enregistre la clé publique sur le serveur
   */
  async registerKeysOnServer(api) {
    if (!this.identityKeys) {
      throw new Error('Clés non initialisées')
    }

    try {
      if (!api.token) {
        console.error("[E2EE] Aucun token d'authentification disponible")
        return false
      }

      // Si les clés sont déjà marquées comme enregistrées, ne pas faire de requête
      if (this.keysRegisteredOnServer) {
        return true
      }

      // Enregistrer les clés (seulement pour les nouvelles clés)
      const identityPublic = await CryptoService.exportPublicKey(this.identityKeys.publicKey)
      const response = await api.request('/e2ee/keys/register', {
        method: 'POST',
        body: JSON.stringify({
          public_key: identityPublic
        })
      })
      if (response.success) {
        this.keysRegisteredOnServer = true
        return true
      }

      // 409 Conflict = clés déjà enregistrées, c'est OK !
      if (response.status === 409) {
        this.keysRegisteredOnServer = true
        return true
      }

      // Silencieux si 401 - l'utilisateur n'est peut-être pas encore connecté
      if (response.status === 401) {
        return false
      }

      console.warn("[E2EE] Échec d'enregistrement:", response)
      return false
    } catch (error) {
      console.error("[E2EE] Erreur d'enregistrement de la clé:", error)
      return false
    }
  }

  /**
   * Crée et distribue une clé de session pour un channel
   * Comme dans l'exemple Python : Bob chiffre la clé de session avec la clé publique d'Alice
   */
  async createAndDistributeSessionKey(api, channelId, memberIds) {
    this.keysRegisteredOnServer = true
    try {
      const sessionKey = CryptoService.generateSessionKey()

      // Récupérer les clés publiques des membres depuis le serveur
      const members = await Promise.all(
        memberIds.map(async (userId) => {
          try {
            const response = await api.request(`/e2ee/keys/user/${userId}`)
            const userData = response.data?.data || response.data

            if (response.success && userData && userData.public_key) {
              return {
                userId,
                publicKey: userData.public_key
              }
            } else {
              console.warn(`[E2EE] ✗ Aucune clé publique pour user ${userId}`)
              console.warn(`[E2EE] Structure reçue:`, {
                hasData: !!response.data,
                hasNestedData: !!(response.data && response.data.data),
                keys: response.data ? Object.keys(response.data) : []
              })
              return null
            }
          } catch (error) {
            console.error(`[E2EE] Erreur récupération clés user ${userId}:`, error)
            return null
          }
        })
      )

      const validMembers = members.filter((m) => m !== null)
      if (validMembers.length === 0) {
        console.error(
          "[E2EE] Aucun membre valide trouvé - aucun utilisateur n'a de clés E2EE enregistrées"
        )
        console.error("[E2EE] Les utilisateurs doivent d'abord enregistrer leurs clés E2EE")
        return false
      }

      const encryptedKeys = await Promise.all(
        validMembers.map(async (member) => {
          try {
            // Importer la clé publique PEM du membre
            const publicKey = await CryptoService.importPublicKey(member.publicKey)

            // Chiffrer la clé de session avec RSA-OAEP
            const encrypted = await CryptoService.encryptSessionKeyForRecipient(
              sessionKey,
              publicKey
            )

            return {
              user_id: member.userId,
              encrypted_session_key: encrypted
            }
          } catch (error) {
            console.error(`[E2EE] Erreur de chiffrement pour user ${member.userId}:`, error)
            return null
          }
        })
      )

      const validEncryptedKeys = encryptedKeys.filter((k) => k !== null)

      if (validEncryptedKeys.length === 0) {
        console.error('[E2EE] Échec du chiffrement de toutes les clés')
        return false
      }

      const payload = {
        channel_id: channelId,
        encrypted_keys: validEncryptedKeys
      }

      // Envoyer au serveur (le serveur stocke juste les clés chiffrées)
      const response = await api.request('/e2ee/session-keys/distribute', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (response.success) {
        // Stocker localement la clé de session (en clair pour nous)
        this.sessionKeys.set(channelId, sessionKey)
        await this.saveSessionKeysToStorage()
        return true
      }

      // Gestion d'erreur améliorée
      if (response.status === 500 && response.data && response.data.message) {
        const errorMessage = response.data.message
        console.error('[E2EE] Erreur serveur:', errorMessage)

        // Vérifier si c'est une erreur de table manquante
        if (errorMessage.includes('channel_user') && errorMessage.includes("doesn't exist")) {
          console.error(
            '[E2EE]  Erreur de configuration serveur: La table channel_user est manquante'
          )
          console.error('[E2EE]  Note: Les DMs sont aussi des channels dans votre système')
          console.error('[E2EE]  Le serveur doit gérer les DMs correctement dans E2EEController')
        }
      }

      console.error("[E2EE] Échec de l'envoi au serveur:", response)
      return false
    } catch (error) {
      console.error('[E2EE] Erreur de création de clé de session:', error)
      return false
    }
  }

  /**
   * Récupère la clé de session d'un channel
   * Équivalent Python : alice_private_key.decrypt(message["body"], padding.OAEP(...))
   */
  async fetchSessionKey(api, channelId) {
    try {
      // Vérifier le cache local
      if (this.sessionKeys.has(channelId)) {
        return this.sessionKeys.get(channelId)
      }
      let response
      console.log(api)
      if (api.api) {
        response = await api.api.request(`/e2ee/session-keys/${channelId}`)
      } else {
        response = await api.request(`/e2ee/session-keys/${channelId}`)
      }

      console.log(response)
      if (!response.success) {
        console.error('[E2EE] Échec de récupération depuis le serveur')
        return null
      }

      const { encrypted_session_key } = response.data

      if (!encrypted_session_key) {
        console.error('[E2EE] Aucune clé chiffrée reçue')
        return null
      }

      // Déchiffrer la clé de session avec notre clé privée RSA
      const sessionKey = await CryptoService.decryptSessionKey(
        encrypted_session_key,
        this.identityKeys.privateKey
      )

      if (sessionKey) {
        this.sessionKeys.set(channelId, sessionKey)
        await this.saveSessionKeysToStorage()
        return sessionKey
      }

      console.error('[E2EE] Échec du déchiffrement de la clé de session')
      return null
    } catch (error) {
      console.error('[E2EE] Erreur de récupération de clé de session:', error)
      return null
    }
  }

  /**
   * Obtient la clé de session pour un channel
   */
  getSessionKey(channelId) {
    return this.sessionKeys.get(channelId) || null
  }

  /**
   * Supprime toutes les clés
   */
  async clearAllKeys() {
    this.identityKeys = null
    this.recoveryCode = null
    this.sessionKeys.clear()

    await this.secureRemoveItem(STORAGE_KEYS.IDENTITY_PUBLIC)
    await this.secureRemoveItem(STORAGE_KEYS.IDENTITY_PRIVATE)
    await this.secureRemoveItem(STORAGE_KEYS.SESSION_KEYS)
    await this.secureRemoveItem(STORAGE_KEYS.RECOVERY_CODE)
  }

  /**
   * Vérifie si les clés sont initialisées
   */
  isInitialized() {
    return this.identityKeys !== null
  }

  /**
   * Obtient le code de récupération
   */
  getRecoveryCode() {
    return this.recoveryCode
  }
}

export default new E2EEKeyManager()
