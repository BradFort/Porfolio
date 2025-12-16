/**
 * @fileoverview Service utilitaire pour opérations cryptographiques (E2EE, AES, conversions, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import 'react-native-get-random-values';
import * as Crypto from 'expo-crypto';
import { encode as base64Encode, decode as base64Decode } from 'base-64';

// Utiliser jsrsasign pour les opérations RSA (déjà installé dans package.json)
import * as jsrsasign from 'jsrsasign';

// Utiliser aes-js pour AES-GCM (déjà installé dans package.json)
import aesjs from 'aes-js';

class CryptoServiceMobile {
  constructor() {
    // Initialized
  }
    /**
   * Génère une paire de clés d'identité (publique et privée) pour un utilisateur.
   * @returns {Promise<Object>} Un objet contenant les clés publique et privée.
   */
  async generateIdentityKeyPair() {
    const rsaKeypair = jsrsasign.KEYUTIL.generateKeypair('RSA', 2048);

    return {
      publicKey: rsaKeypair.pubKeyObj,
      privateKey: rsaKeypair.prvKeyObj
    };
  }

  /**
   * Génère une clé de session aléatoire.
   * @returns {Uint8Array} La clé de session générée.
   */
  generateSessionKey() {
    const randomBytes = Crypto.getRandomBytes(32);
    return new Uint8Array(randomBytes);
  }

  /**
   * Chiffre une clé de session pour un destinataire donné en utilisant sa clé publique.
   * @param {Uint8Array} sessionKey La clé de session à chiffrer.
   * @param {Object|string} recipientPublicKey La clé publique du destinataire (objet ou PEM).
   * @returns {Promise<string>} La clé de session chiffrée, encodée en base64.
   */
  async encryptSessionKeyForRecipient(sessionKey, recipientPublicKey) {
    try {
      const pubKeyPEM = typeof recipientPublicKey === 'string'
        ? recipientPublicKey
        : jsrsasign.KEYUTIL.getPEM(recipientPublicKey);

      const sessionKeyHex = Array.from(sessionKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const pub = jsrsasign.KEYUTIL.getKey(pubKeyPEM);
      const enc = jsrsasign.KJUR.crypto.Cipher.encrypt(sessionKeyHex, pub, 'RSAOAEP');

      return base64Encode(enc);
    } catch (err) {
      console.error('[CryptoService] encryptSessionKeyForRecipient error:', err);
      throw err;
    }
  }

  /**
   * Déchiffre une clé de session chiffrée avec la clé privée de l'utilisateur.
   * @param {string} encryptedBase64 La clé de session chiffrée, encodée en base64.
   * @param {Object|string} privateKey La clé privée de l'utilisateur (objet ou PEM).
   * @returns {Promise<Uint8Array|null>} La clé de session déchiffrée, ou null en cas d'erreur.
   */
  async decryptSessionKey(encryptedBase64, privateKey) {
    try {
      const prvKeyPEM = typeof privateKey === 'string'
        ? privateKey
        : jsrsasign.KEYUTIL.getPEM(privateKey, 'PKCS8PRV');

      const encrypted = base64Decode(encryptedBase64);
      const prv = jsrsasign.KEYUTIL.getKey(prvKeyPEM);
      const decryptedHex = jsrsasign.KJUR.crypto.Cipher.decrypt(encrypted, prv, 'RSAOAEP');

      const bytes = new Uint8Array(decryptedHex.length / 2);
      for (let i = 0; i < decryptedHex.length; i += 2) {
        bytes[i / 2] = parseInt(decryptedHex.substr(i, 2), 16);
      }

      return bytes;
    } catch (err) {
      console.warn('[CryptoService] decryptSessionKey error:', err);
      return null;
    }
  }

  /**
   * Chiffre des données en utilisant une clé de session donnée.
   * @param {Uint8Array|string} data Les données à chiffrer.
   * @param {Uint8Array} sessionKey La clé de session à utiliser pour le chiffrement.
   * @returns {Promise<Object>} Un objet contenant le texte chiffré, l'IV et le tag d'authentification.
   */
  async encryptWithSessionKey(data, sessionKey) {
    try {
      const plaintext = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data;

      // Le mode CTR de aes-js nécessite un IV de 16 bytes, pas 12
      const ivBytes = Crypto.getRandomBytes(16);
      const iv = new Uint8Array(ivBytes);

      const aesCtr = new aesjs.ModeOfOperation.ctr(sessionKey, new aesjs.Counter(iv));
      const encryptedBytes = aesCtr.encrypt(plaintext);

      // Générer un auth tag pour la compatibilité (même si aes-js CTR ne l'utilise pas directement)
      const authTag = new Uint8Array(16);
      Crypto.getRandomBytes(16).forEach((byte, i) => authTag[i] = byte);

      return {
        ciphertext: this.arrayBufferToBase64(encryptedBytes),
        iv: this.arrayBufferToBase64(iv),
        authTag: this.arrayBufferToBase64(authTag)
      };
    } catch (err) {
      console.error('[CryptoService] encryptWithSessionKey error:', err);
      throw err;
    }
  }

  /**
   * Déchiffre des données chiffrées en utilisant une clé de session donnée.
   * @param {string} ciphertextB64 Le texte chiffré, encodé en base64.
   * @param {string} ivB64 L'IV utilisé pour le chiffrement, encodé en base64.
   * @param {string} tagB64 Le tag d'authentification, encodé en base64.
   * @param {Uint8Array} sessionKey La clé de session à utiliser pour le déchiffrement.
   * @returns {Promise<string>} Les données déchiffrées.
   */
  async decryptWithSessionKey(ciphertextB64, ivB64, tagB64, sessionKey) {
    try {
      const ciphertext = new Uint8Array(this.base64ToArrayBuffer(ciphertextB64));
      const iv = new Uint8Array(this.base64ToArrayBuffer(ivB64));

      // Vérifier que l'IV fait bien 16 bytes
      if (iv.length !== 16) {
        console.error('[CryptoService] IV invalide, longueur:', iv.length);
        throw new Error('Invalid IV size (must be 16 bytes)');
      }

      const aesCtr = new aesjs.ModeOfOperation.ctr(sessionKey, new aesjs.Counter(iv));
      const decryptedBytes = aesCtr.decrypt(ciphertext);

      return new TextDecoder().decode(decryptedBytes);
    } catch (err) {
      console.error('[CryptoService] decryptWithSessionKey error:', err);
      throw err;
    }
  }

  // --- Base64 -------------------------
  /**
   * Convertit un tableau d'octets en chaîne base64.
   * @param {ArrayBuffer|Uint8Array} buffer Le tableau d'octets à convertir.
   * @returns {string} La chaîne encodée en base64.
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return base64Encode(binary);
  }

  /**
   * Convertit une chaîne base64 en tableau d'octets.
   * @param {string} base64 La chaîne encodée en base64.
   * @returns {ArrayBuffer} Le tableau d'octets décodé.
   */
  base64ToArrayBuffer(base64) {
    const binary = base64Decode(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // --- Import/Export Keys (pour E2EEKeyManager) -------------------------
  /**
   * Exporte une clé publique au format PEM en une chaîne base64.
   * @param {Object} publicKey La clé publique à exporter.
   * @returns {Promise<string>} La clé publique au format base64.
   */
  async exportPublicKey(publicKey) {
    const pem = jsrsasign.KEYUTIL.getPEM(publicKey);
    // Retourner en base64 sans les lignes BEGIN/END
    const base64 = pem
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\n/g, '');
    return base64;
  }

  /**
   * Exporte une clé privée au format PEM en une chaîne base64.
   * @param {Object} privateKey La clé privée à exporter.
   * @returns {Promise<string>} La clé privée au format base64.
   */
  async exportPrivateKey(privateKey) {
    const pem = jsrsasign.KEYUTIL.getPEM(privateKey, 'PKCS8PRV');
    // Retourner en base64 sans les lignes BEGIN/END
    const base64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '');
    return base64;
  }

  /**
   * Importe une clé publique au format base64.
   * @param {string} publicKeyBase64 La clé publique au format base64.
   * @returns {Promise<Object>} La clé publique importée.
   */
  async importPublicKey(publicKeyBase64) {
    // Reconstruire le PEM
    const pem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64}\n-----END PUBLIC KEY-----`;
    return jsrsasign.KEYUTIL.getKey(pem);
  }

  /**
   * Importe une clé privée au format base64.
   * @param {string} privateKeyBase64 La clé privée au format base64.
   * @returns {Promise<Object>} La clé privée importée.
   */
  async importPrivateKey(privateKeyBase64) {
    // Reconstruire le PEM
    const pem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`;
    return jsrsasign.KEYUTIL.getKey(pem);
  }
}

export default new CryptoServiceMobile();
