/**
 * @fileoverview Gestionnaire des clés E2EE (génération, import/export, rotation, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import * as SecureStore from "expo-secure-store";
import CryptoService from "../crypto/CryptoService";

const STORAGE_KEYS = {
  IDENTITY_PUBLIC: "e2ee_identity_public",
  IDENTITY_PRIVATE: "e2ee_identity_private",
  SESSION_KEYS: "e2ee_session_keys",
  RECOVERY_CODE: "e2ee_recovery_code",
};

class E2EEKeyManager {
  constructor() {
    this.identityKeys = null;
    this.sessionKeys = new Map();
    this.recoveryCode = null;
  }

  // -------------------------------
  // INIT
  // -------------------------------
  /**
   * Initialise le gestionnaire de clés E2EE en chargeant les clés depuis le stockage sécurisé
   * ou en générant une nouvelle paire de clés si aucune clé n'est trouvée.
   * @returns {Promise<boolean>} True si l'initialisation a réussi, sinon false.
   */
  async initialize() {
    const loaded = await this.loadKeysFromStorage();
    if (loaded) return true;

    await this.generateAndStoreKeys();
    return true;
  }

  /**
   * Vérifie si le gestionnaire de clés a été initialisé (c'est-à-dire si les clés d'identité ont été chargées).
   * @returns {boolean} True si le gestionnaire de clés est initialisé, sinon false.
   */
  isInitialized() {
    return this.identityKeys != null;
  }

  // -------------------------------
  // SECURE STORAGE WRAPPERS (Expo SecureStore)
  // -------------------------------
  /**
   * Définit un élément dans le stockage sécurisé.
   * @param {string} key La clé de l'élément à définir.
   * @param {string} value La valeur de l'élément à définir.
   */
  async secureSetItem(key, value) {
    await SecureStore.setItemAsync(key, value);
  }

  /**
   * Récupère un élément du stockage sécurisé.
   * @param {string} key La clé de l'élément à récupérer.
   * @returns {Promise<string|null>} La valeur de l'élément récupéré, ou null si l'élément n'existe pas.
   */
  async secureGetItem(key) {
    return await SecureStore.getItemAsync(key);
  }

  /**
   * Supprime un élément du stockage sécurisé.
   * @param {string} key La clé de l'élément à supprimer.
   */
  async secureRemoveItem(key) {
    await SecureStore.deleteItemAsync(key);
  }

  // -------------------------------
  // KEY GENERATION
  // -------------------------------
  /**
   * Génère une nouvelle paire de clés d'identité et un code de récupération, puis stocke
   * ces clés dans le stockage sécurisé.
   */
  async generateAndStoreKeys() {
    this.identityKeys = await CryptoService.generateIdentityKeyPair();

    this.recoveryCode = this.generateRecoveryCode();

    await this.saveKeysToStorage();
  }

  /**
   * Sauvegarde les clés d'identité et le code de récupération dans le stockage sécurisé.
   */
  async saveKeysToStorage() {
    const pub = await CryptoService.exportPublicKey(this.identityKeys.publicKey);
    const priv = await CryptoService.exportPrivateKey(this.identityKeys.privateKey);

    const encryptedPrivate = await this.encryptWithRecoveryCode(
      priv,
      this.recoveryCode
    );

    await this.secureSetItem(STORAGE_KEYS.IDENTITY_PUBLIC, pub);
    await this.secureSetItem(STORAGE_KEYS.IDENTITY_PRIVATE, encryptedPrivate);
    await this.secureSetItem(STORAGE_KEYS.RECOVERY_CODE, this.recoveryCode);

    await this.saveSessionKeysToStorage();
  }

  // -------------------------------
  // LOAD KEYS
  // -------------------------------
  /**
   * Charge les clés d'identité et le code de récupération depuis le stockage sécurisé.
   * @returns {Promise<boolean>} True si le chargement des clés a réussi, sinon false.
   */
  async loadKeysFromStorage() {
    try {
      const pub = await this.secureGetItem(STORAGE_KEYS.IDENTITY_PUBLIC);
      const encryptedPriv = await this.secureGetItem(
        STORAGE_KEYS.IDENTITY_PRIVATE
      );
      const rec = await this.secureGetItem(STORAGE_KEYS.RECOVERY_CODE);

      if (!pub || !encryptedPriv || !rec) return false;

      const decryptedPriv = await this.decryptWithRecoveryCode(
        encryptedPriv,
        rec
      );

      this.identityKeys = {
        publicKey: await CryptoService.importPublicKey(pub),
        privateKey: await CryptoService.importPrivateKey(decryptedPriv),
      };

      this.recoveryCode = rec;

      await this.loadSessionKeysFromStorage();

      return true;
    } catch (e) {
      console.warn("[E2EE] loadKeysFromStorage ERROR:", e);
      return false;
    }
  }

  // -------------------------------
  // RECOVERY CODE
  // -------------------------------
  /**
   * Génère un code de récupération aléatoire composé de 8 mots.
   * @returns {string} Le code de récupération généré.
   */
  generateRecoveryCode() {
    const words = [
      "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel",
      "india", "juliet", "kilo", "lima", "mike", "november", "oscar", "papa",
      "quebec", "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "xray",
      "yankee", "zulu", "tiger", "lion", "eagle", "shark", "wolf", "bear"
    ];

    let result = [];
    for (let i = 0; i < 8; i++) {
      result.push(words[Math.floor(Math.random() * words.length)]);
    }

    return result.join("-");
  }

  /**
   * Récupère les clés d'identité en utilisant le code de récupération fourni.
   * @param {string} code Le code de récupération à utiliser pour déchiffrer la clé privée.
   * @returns {Promise<boolean>} True si la récupération a réussi, sinon false.
   */
  async recoverWithCode(code) {
    const encryptedPriv = await this.secureGetItem(
      STORAGE_KEYS.IDENTITY_PRIVATE
    );
    const pub = await this.secureGetItem(STORAGE_KEYS.IDENTITY_PUBLIC);

    if (!encryptedPriv || !pub) return false;

    const decryptedPriv = await this.decryptWithRecoveryCode(
      encryptedPriv,
      code
    );

    this.identityKeys = {
      publicKey: await CryptoService.importPublicKey(pub),
      privateKey: await CryptoService.importPrivateKey(decryptedPriv),
    };

    this.recoveryCode = code;

    return true;
  }

  // -------------------------------
  // PRIVATE KEY ENCRYPTION WITH RECOVERY CODE
  // -------------------------------
  /**
   * Chiffre la clé privée en utilisant le code de récupération et l'algorithme AES-GCM.
   * @param {string} privateKeyPem La clé privée au format PEM à chiffrer.
   * @param {string} recCode Le code de récupération à utiliser pour le chiffrement.
   * @returns {Promise<string>} La clé privée chiffrée au format Base64.
   */
  async encryptWithRecoveryCode(privateKeyPem, recCode) {
    const encoder = new TextEncoder();

    const keyMaterial = await global.crypto.subtle.importKey(
      "raw",
      encoder.encode(recCode),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const salt = global.crypto.getRandomValues(new Uint8Array(16));
    const iv = global.crypto.getRandomValues(new Uint8Array(12));

    const aesKey = await global.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    const encrypted = await global.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encoder.encode(privateKeyPem)
    );

    const combined = new Uint8Array(
      salt.length + iv.length + encrypted.byteLength
    );
    combined.set(salt);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return CryptoService.arrayBufferToBase64(combined);
  }

  /**
   * Déchiffre la clé privée chiffrée en utilisant le code de récupération et l'algorithme AES-GCM.
   * @param {string} encoded La clé privée chiffrée au format Base64 à déchiffrer.
   * @param {string} recCode Le code de récupération à utiliser pour le déchiffrement.
   * @returns {Promise<string>} La clé privée déchiffrée au format PEM.
   */
  async decryptWithRecoveryCode(encoded, recCode) {
    const raw = CryptoService.base64ToArrayBuffer(encoded);

    const salt = raw.slice(0, 16);
    const iv = raw.slice(16, 28);
    const encrypted = raw.slice(28);

    const encoder = new TextEncoder();

    const keyMaterial = await global.crypto.subtle.importKey(
      "raw",
      encoder.encode(recCode),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const aesKey = await global.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decrypted = await global.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }

  // -------------------------------
  // SESSION KEYS
  // -------------------------------
  /**
   * Sauvegarde les clés de session dans le stockage sécurisé.
   */
  async saveSessionKeysToStorage() {
    const payload = Array.from(this.sessionKeys.entries()).map(
      ([channelId, key]) => ({
        channelId,
        key: CryptoService.arrayBufferToBase64(key),
      })
    );

    await this.secureSetItem(
      STORAGE_KEYS.SESSION_KEYS,
      JSON.stringify(payload)
    );
  }

  /**
   * Charge les clés de session depuis le stockage sécurisé.
   */
  async loadSessionKeysFromStorage() {
    const raw = await this.secureGetItem(STORAGE_KEYS.SESSION_KEYS);
    if (!raw) return;

    const arr = JSON.parse(raw);

    this.sessionKeys.clear();

    arr.forEach((item) => {
      this.sessionKeys.set(
        item.channelId,
        CryptoService.base64ToArrayBuffer(item.key)
      );
    });
  }

  /**
   * Récupère la clé de session pour un identifiant de canal donné.
   * @param {string} channelId L'identifiant du canal pour lequel récupérer la clé de session.
   * @returns {ArrayBuffer|null} La clé de session pour le canal, ou null si aucune clé n'est trouvée.
   */
  getSessionKey(channelId) {
    return this.sessionKeys.get(channelId) || null;
  }

  /**
   * Récupère et déchiffre la clé de session depuis l'API pour un canal donné.
   * @param {Object} api L'instance de l'API pour effectuer la requête.
   * @param {string} channelId L'identifiant du canal pour lequel récupérer la clé de session.
   * @returns {Promise<ArrayBuffer|null>} La clé de session déchiffrée, ou null en cas d'échec.
   */
  async fetchSessionKey(api, channelId) {
    const resp = await api.request(`/e2ee/session-keys/${channelId}`);
    if (!resp.success) return null;

    const encrypted = resp.data?.encrypted_session_key;
    if (!encrypted) return null;

    const key = await CryptoService.decryptSessionKey(
      encrypted,
      this.identityKeys.privateKey
    );

    if (!key) return null;

    this.sessionKeys.set(channelId, key);
    await this.saveSessionKeysToStorage();

    return key;
  }

  /**
   * Crée et distribue une nouvelle clé de session pour un canal donné à tous les membres spécifiés.
   * @param {Object} api L'instance de l'API pour effectuer la requête.
   * @param {string} channelId L'identifiant du canal pour lequel créer la clé de session.
   * @param {Array<string>} members La liste des identifiants des membres à qui distribuer la clé.
   * @returns {Promise<boolean>} True si la création et la distribution de la clé de session ont réussi, sinon false.
   */
  async createAndDistributeSessionKey(api, channelId, members) {
    const sessionKey = CryptoService.generateSessionKey();

    const encryptedForEachUser = await Promise.all(
      members.map(async (id) => {
        const res = await api.request(`/e2ee/keys/user/${id}`);
        if (!res.success) return null;

        const pub = res.data?.data?.public_key;
        if (!pub) return null;

        const userKey = await CryptoService.importPublicKey(pub);

        const encrypted = await CryptoService.encryptSessionKeyForRecipient(
          sessionKey,
          userKey
        );

        return {
          user_id: id,
          encrypted_session_key: encrypted,
        };
      })
    );

    const valid = encryptedForEachUser.filter((e) => e != null);

    const payload = {
      channel_id: channelId,
      encrypted_keys: valid,
    };

    const resp = await api.request(
      "/e2ee/session-keys/distribute",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

    if (resp.success) {
      this.sessionKeys.set(channelId, sessionKey);
      await this.saveSessionKeysToStorage();
      return true;
    }

    return false;
  }

  // -------------------------------
  // CLEAR
  // -------------------------------
  /**
   * Efface toutes les clés (identité et session) du gestionnaire et du stockage sécurisé.
   */
  async clearAllKeys() {
    this.identityKeys = null;
    this.sessionKeys.clear();
    this.recoveryCode = null;

    await this.secureRemoveItem(STORAGE_KEYS.IDENTITY_PUBLIC);
    await this.secureRemoveItem(STORAGE_KEYS.IDENTITY_PRIVATE);
    await this.secureRemoveItem(STORAGE_KEYS.SESSION_KEYS);
    await this.secureRemoveItem(STORAGE_KEYS.RECOVERY_CODE);
  }

  /**
   * Récupère le code de récupération actuel.
   * @returns {string|null} Le code de récupération, ou null s'il n'est pas défini.
   */
  getRecoveryCode() {
    return this.recoveryCode;
  }
}

export default new E2EEKeyManager();

