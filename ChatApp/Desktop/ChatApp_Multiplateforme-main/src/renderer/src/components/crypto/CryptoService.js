/**
 * Service cryptographique de base utilisant Web Crypto API native
 * Implémente RSA-OAEP et AES-256-GCM
 * Pas de dépendances externes requises
 */

class CryptoService {
  constructor() {
    // Vérifier la disponibilité de Web Crypto API
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API non disponible')
    }
  }

  /**
   * Génère une paire de clés RSA (4096 bits)
   * Équivalent Python : rsa.generate_private_key(public_exponent=65537, key_size=4096)
   * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
   */
  async generateIdentityKeyPair() {
    return await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Génère une clé de session symétrique aléatoire (32 bytes pour AES-256)
   * @returns {Uint8Array}
   */
  generateSessionKey() {
    return window.crypto.getRandomValues(new Uint8Array(32))
  }

  /**
   * Chiffre une clé de session avec la clé publique RSA du destinataire
   * Équivalent Python : alice_pub_key.encrypt(plaintext.encode(), padding.OAEP(...))
   * @param {Uint8Array} sessionKey - Clé de session à chiffrer
   * @param {CryptoKey} recipientPublicKey - Clé publique RSA du destinataire
   * @returns {Promise<string>} - Clé chiffrée en base64
   */
  async encryptSessionKeyForRecipient(sessionKey, recipientPublicKey) {
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      recipientPublicKey,
      sessionKey
    )

    return this.arrayBufferToBase64(encrypted)
  }

  /**
   * Déchiffre une clé de session avec sa clé privée RSA
   * Équivalent Python : alice_private_key.decrypt(message["body"], padding.OAEP(...))
   * @param {string} encryptedSessionKey - Clé chiffrée (base64)
   * @param {CryptoKey} recipientPrivateKey - Clé privée RSA du destinataire
   * @returns {Promise<Uint8Array|null>} - Clé de session déchiffrée
   */
  async decryptSessionKey(encryptedSessionKey, recipientPrivateKey) {
    try {
      const encryptedData = this.base64ToArrayBuffer(encryptedSessionKey)

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP'
        },
        recipientPrivateKey,
        encryptedData
      )

      return new Uint8Array(decrypted)
    } catch (error) {
      console.error('[Crypto] Erreur de déchiffrement de clé de session:', error)
      return null
    }
  }

  /**
   * Chiffre des données avec une clé de session (AES-256-GCM)
   * @param {string|Uint8Array} data - Données à chiffrer
   * @param {Uint8Array} sessionKey - Clé de session (32 bytes)
   * @returns {Promise<{ciphertext: string, iv: string, authTag: string}>}
   */
  async encryptWithSessionKey(data, sessionKey) {
    // Convertir les données en Uint8Array si nécessaire
    const encoder = new TextEncoder()
    const plaintext = typeof data === 'string' ? encoder.encode(data) : data

    // Générer un IV aléatoire (12 bytes pour GCM)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    // Importer la clé de session pour Web Crypto API
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      sessionKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    // Chiffrer avec AES-GCM
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv, tagLength: 128 },
      cryptoKey,
      plaintext
    )

    // Séparer le ciphertext et l'auth tag
    const encryptedArray = new Uint8Array(encrypted)
    const ciphertext = encryptedArray.slice(0, encryptedArray.length - 16)
    const authTag = encryptedArray.slice(encryptedArray.length - 16)

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
      authTag: this.arrayBufferToBase64(authTag)
    }
  }

  /**
   * Déchiffre des données avec une clé de session (AES-256-GCM)
   * @param {string} ciphertext - Données chiffrées (base64)
   * @param {string} iv - Vecteur d'initialisation (base64)
   * @param {string} authTag - Tag d'authentification (base64)
   * @param {Uint8Array} sessionKey - Clé de session (32 bytes)
   * @returns {Promise<string>}
   */
  async decryptWithSessionKey(ciphertext, iv, authTag, sessionKey) {
    try {
      const ciphertextBytes = new Uint8Array(this.base64ToArrayBuffer(ciphertext))
      const ivBytes = new Uint8Array(this.base64ToArrayBuffer(iv))
      const authTagBytes = new Uint8Array(this.base64ToArrayBuffer(authTag))
      const combined = new Uint8Array(ciphertextBytes.length + authTagBytes.length)
      combined.set(ciphertextBytes)
      combined.set(authTagBytes, ciphertextBytes.length)

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        sessionKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      )

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes, tagLength: 128 },
        cryptoKey,
        combined
      )

      const decoder = new TextDecoder()

      return decoder.decode(decrypted)
    } catch (error) {
      throw error
    }
  }

  /**
   * Génère un UUID v4
   * @returns {string}
   */
  generateUUID() {
    return window.crypto.randomUUID()
  }

  /**
   * Exporte une clé publique RSA en format PEM (comme Python)
   * Équivalent Python : public_key.public_bytes(encoding=Encoding.PEM, format=PublicFormat.SubjectPublicKeyInfo)
   * @param {CryptoKey} key
   * @returns {Promise<string>}
   */
  async exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey('spki', key)
    const base64 = this.arrayBufferToBase64(exported)

    // Formater en PEM

    return `-----BEGIN PUBLIC KEY-----\n${this.formatBase64(base64)}\n-----END PUBLIC KEY-----`
  }

  /**
   * Formate une chaîne base64 en lignes de 64 caractères (format PEM)
   * @param {string} base64
   * @returns {string}
   */
  formatBase64(base64) {
    const lines = []
    for (let i = 0; i < base64.length; i += 64) {
      lines.push(base64.substring(i, i + 64))
    }
    return lines.join('\n')
  }

  /**
   * Importe une clé publique RSA depuis format PEM
   * Équivalent Python : serialization.load_pem_public_key(server_store["alice"].encode())
   * @param {string} pemKey - Clé PEM
   * @returns {Promise<CryptoKey>}
   */
  async importPublicKey(pemKey) {
    // Retirer les headers PEM et les retours à la ligne
    const base64 = pemKey
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s/g, '')

    const keyData = this.base64ToArrayBuffer(base64)

    return await window.crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    )
  }

  /**
   * Exporte une clé privée RSA en format base64
   * @param {CryptoKey} key
   * @returns {Promise<string>}
   */
  async exportPrivateKey(key) {
    const exported = await window.crypto.subtle.exportKey('pkcs8', key)
    const base64 = this.arrayBufferToBase64(exported)

    // Formater en PEM

    return `-----BEGIN PRIVATE KEY-----\n${this.formatBase64(base64)}\n-----END PRIVATE KEY-----`
  }

  /**
   * Importe une clé privée RSA depuis format PEM
   * @param {string} pemKey - Clé PEM
   * @returns {Promise<CryptoKey>}
   */
  async importPrivateKey(pemKey) {
    // Retirer les headers PEM et les retours à la ligne
    const base64 = pemKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '')

    const keyData = this.base64ToArrayBuffer(base64)

    return await window.crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['decrypt']
    )
  }

  /**
   * Encode en base64
   * @param {ArrayBuffer|Uint8Array} buffer
   * @returns {string}
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Décode depuis base64
   * @param {string} base64
   * @returns {ArrayBuffer}
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Encode en base64 (alias pour compatibilité)
   * @param {Uint8Array} data
   * @returns {string}
   */
  encodeBase64(data) {
    return this.arrayBufferToBase64(data)
  }

  /**
   * Décode depuis base64 (alias pour compatibilité)
   * @param {string} data
   * @returns {Uint8Array}
   */
  decodeBase64(data) {
    return new Uint8Array(this.base64ToArrayBuffer(data))
  }
}

export default new CryptoService()
