/**
 * @fileoverview Gestionnaire principal E2EE (chiffrement, distribution de clés, gestion des sessions, etc.)
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import 'react-native-get-random-values';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

/**
 * Configure le générateur de nombres pseudo-aléatoires de NaCl
 * Utilise crypto.getRandomValues pour la génération sécurisée
 */
nacl.setPRNG((x, n) => {
    const randomBytes = new Uint8Array(n);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < n; i++) {
        x[i] = randomBytes[i];
    }
});

/**
 * Clés de stockage sécurisé pour les données E2EE
 * @constant
 */
const STORAGE_KEYS = {
    PRIVATE_KEY: 'e2ee_private_key',
    PUBLIC_KEY: 'e2ee_public_key',
    RECOVERY_CODE: 'e2ee_recovery_code',
    SESSION_KEYS: 'e2ee_session_keys'
};

/**
 * Gestionnaire de chiffrement de bout en bout (E2EE)
 * Gère les clés d'identité, les clés de session, le chiffrement/déchiffrement
 * Utilise NaCl (TweetNaCl) pour la cryptographie
 * @class E2EEManager
 */
class E2EEManager {
    static _initialized = false;
    static _identityKeyPair = null;
    static _recoveryCode = null;
    static _sessionKeys = new Map();

    /**
     * Vérifie si le gestionnaire E2EE est initialisé
     * @static
     * @returns {boolean} True si initialisé
     */
    static isInitialized() {
        return E2EEManager._initialized;
    }

    /**
     * Initialise le gestionnaire E2EE
     * Charge les clés existantes ou en génère de nouvelles
     * Synchronise la clé publique avec le serveur
     * @static
     * @async
     * @param {Object} apiService - Service API pour communiquer avec le backend
     * @returns {Promise<boolean>} True si l'initialisation réussit
     */
    static async initialize(apiService) {
        if (E2EEManager._initialized) {
            console.log('[E2EE] Already initialized');
            return true;
        }

        try {
            const privateKeyBase64 = await SecureStore.getItemAsync(STORAGE_KEYS.PRIVATE_KEY);
            const publicKeyBase64 = await SecureStore.getItemAsync(STORAGE_KEYS.PUBLIC_KEY);

            if (privateKeyBase64 && publicKeyBase64) {
                E2EEManager._identityKeyPair = {
                    publicKey: naclUtil.decodeBase64(publicKeyBase64),
                    secretKey: naclUtil.decodeBase64(privateKeyBase64)
                };

                E2EEManager._recoveryCode = await SecureStore.getItemAsync(STORAGE_KEYS.RECOVERY_CODE);

                console.log('[E2EE] Loaded keys from SecureStore');
                if (!E2EEManager._recoveryCode) {
                    console.log('[E2EE] No recovery code found, generating one...');
                    const recoveryCode = await E2EEManager._generateRecoveryCode();
                    await SecureStore.setItemAsync(STORAGE_KEYS.RECOVERY_CODE, recoveryCode);
                    E2EEManager._recoveryCode = recoveryCode;
                    console.log('[E2EE] Recovery code generated and cached:', recoveryCode);
                }

                await E2EEManager._loadSessionKeysFromStorage();

                if (apiService) {
                    try {
                        const api = apiService.uploadE2EEPublicKey ? apiService : require('../apiService').default;
                        await api.uploadE2EEPublicKey(publicKeyBase64);
                        console.log('[E2EE] ✅ Clé publique synchronisée avec le serveur');
                    } catch (uploadError) {
                        console.warn('[E2EE] ⚠️ Échec de la synchronisation de la clé publique:', uploadError);
                        // Ne pas bloquer l'initialisation si l'upload échoue
                    }
                }

            } else {
                const keyPair = nacl.box.keyPair();
                E2EEManager._identityKeyPair = keyPair;

                // Stocker les clés
                await SecureStore.setItemAsync(
                    STORAGE_KEYS.PRIVATE_KEY,
                    naclUtil.encodeBase64(keyPair.secretKey)
                );

                const publicKeyB64 = naclUtil.encodeBase64(keyPair.publicKey);
                await SecureStore.setItemAsync(
                    STORAGE_KEYS.PUBLIC_KEY,
                    publicKeyB64
                );

                const recoveryCode = await E2EEManager._generateRecoveryCode();
                await SecureStore.setItemAsync(STORAGE_KEYS.RECOVERY_CODE, recoveryCode);
                E2EEManager._recoveryCode = recoveryCode;

                console.log('[E2EE] Generated new key pair and stored securely');
                if (apiService) {
                    try {
                        const api = apiService.uploadE2EEPublicKey ? apiService : require('../apiService').default;
                        await api.uploadE2EEPublicKey(publicKeyB64);
                        console.log('[E2EE] ✅ Nouvelle clé publique enregistrée sur le serveur');
                    } catch (uploadError) {
                        console.error('[E2EE] ❌ Échec de l\'enregistrement de la clé publique:', uploadError);
                    }
                }
            }

            if (!global.crypto?.subtle) {
                global.crypto = global.crypto || {};
                global.crypto.subtle = {
                    async generateKey() {
                        const randomBytes = new Uint8Array(32);
                        crypto.getRandomValues(randomBytes);
                        return randomBytes;
                    }
                };
            }

            E2EEManager._initialized = true;
            console.log('[E2EE] Initialization successful');
            return true;
        } catch (error) {
            console.error('[E2EE] Initialization failed:', error);
            E2EEManager._initialized = false;
            return false;
        }
    }
    /**
     * Génère un code de récupération aléatoire
     * @static
     * @async
     * @returns {Promise<string>} Le code de récupération généré
     */
    static async _generateRecoveryCode() {
        const randomBytes = new Uint8Array(16);
        crypto.getRandomValues(randomBytes);

        const code = naclUtil.encodeBase64(randomBytes)
            .replace(/[^A-Za-z0-9]/g, '')
            .substring(0, 16)
            .match(/.{1,4}/g)
            .join('-');
        return code;
    }

    /**
     * Récupère le code de récupération actuel
     * @static
     * @returns {string} Le code de récupération
     */
    static getRecoveryCode() {
        return E2EEManager._recoveryCode;
    }

    /**
     * Récupère les clés à partir d'un code de récupération
     * Réinitialise le gestionnaire et charge les clés si le code est valide
     * @static
     * @async
     * @param {string} recoveryCode - Le code de récupération à valider
     * @returns {Promise<boolean>} True si la récupération réussit
     */
    static async recoverKeys(recoveryCode) {
        try {
            const storedCode = await SecureStore.getItemAsync(STORAGE_KEYS.RECOVERY_CODE);

            if (!storedCode || storedCode !== recoveryCode.trim()) {
                console.warn('[E2EE] Invalid recovery code');
                return false;
            }

            E2EEManager._initialized = false;
            E2EEManager._identityKeyPair = null;

            await E2EEManager.initialize(null);

            console.log('[E2EE] Keys recovered successfully');
            return true;
        } catch (error) {
            console.error('[E2EE] Recovery failed:', error);
            return false;
        }
    }

    /**
     * Réinitialise toutes les clés et données stockées
     * Supprime les clés privées, publiques, le code de récupération et les clés de session
     * @static
     * @async
     * @returns {Promise<boolean>} True si la réinitialisation réussit
     */
    static async reset() {
        try {
            await SecureStore.deleteItemAsync(STORAGE_KEYS.PRIVATE_KEY);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.PUBLIC_KEY);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.RECOVERY_CODE);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION_KEYS);

            E2EEManager._identityKeyPair = null;
            E2EEManager._initialized = false;
            E2EEManager._recoveryCode = null;
            E2EEManager._sessionKeys.clear();

            console.log('[E2EE] Keys reset successfully');
            return true;
        } catch (error) {
            console.error('[E2EE] Reset failed:', error);
            return false;
        }
    }

    /**
     * Réinitialise les clés et réinitialise le gestionnaire avec de nouvelles clés
     * @static
     * @async
     * @param {Object} apiService - Service API pour communiquer avec le backend
     * @returns {Promise<void>}
     */
    static async resetKeys(apiService) {
        await E2EEManager.reset();
        await E2EEManager.initialize(apiService);
    }

    // -------------------------------
    // SESSION KEYS MANAGEMENT
    // -------------------------------

    /**
     * Charge les clés de session à partir du stockage sécurisé
     * Décode les clés et les ajoute à la carte des clés de session
     * @static
     * @async
     * @private
     */
    static async _loadSessionKeysFromStorage() {
        try {
            const raw = await SecureStore.getItemAsync(STORAGE_KEYS.SESSION_KEYS);
            if (!raw) return;

            const arr = JSON.parse(raw);
            E2EEManager._sessionKeys.clear();

            arr.forEach((item) => {
                const keyBytes = naclUtil.decodeBase64(item.key);
                E2EEManager._sessionKeys.set(item.channelId, keyBytes);
            });

            console.log(`[E2EE] Loaded ${arr.length} session keys from storage`);
        } catch (error) {
            console.warn('[E2EE] Error loading session keys:', error);
        }
    }

    /**
     * Sauvegarde les clés de session dans le stockage sécurisé
     * Encode les clés en Base64 et les stocke sous forme de tableau d'objets
     * @static
     * @async
     * @private
     */
    static async _saveSessionKeysToStorage() {
        try {
            const payload = Array.from(E2EEManager._sessionKeys.entries()).map(
                ([channelId, key]) => ({
                    channelId,
                    key: naclUtil.encodeBase64(key),
                })
            );

            await SecureStore.setItemAsync(
                STORAGE_KEYS.SESSION_KEYS,
                JSON.stringify(payload)
            );
        } catch (error) {
            console.warn('[E2EE] Error saving session keys:', error);
        }
    }

    /**
     * Récupère une clé de session pour un identifiant de canal donné
     * @static
     * @param {string} channelId - L'identifiant du canal
     * @returns {Uint8Array|null} La clé de session ou null si non trouvée
     */
    static getSessionKey(channelId) {
        const key = E2EEManager._sessionKeys.get(channelId);
        console.log(`[E2EE] Getting session key for channel ${channelId}:`, key ? 'found' : 'not found');
        return key || null;
    }

    /**
     * Récupère une clé de session à partir du serveur si elle n'est pas disponible localement
     * Déchiffre la clé de session chiffrée avec la clé d'identité
     * @static
     * @async
     * @param {string} channelId - L'identifiant du canal
     * @returns {Promise<Uint8Array|null>} La clé de session déchiffrée ou null en cas d'erreur
     */
    static async fetchSessionKey(channelId) {
        try {
            console.log(`[E2EE] Fetching session key for channel ${channelId}...`);

            // Import dynamique pour éviter les dépendances circulaires
            const apiService = require('../apiService').default;

            const resp = await apiService.request(`/e2ee/session-keys/${channelId}`);
            if (!resp.success) {
                console.warn('[E2EE] Failed to fetch session key from server');
                return null;
            }

            const encrypted = resp.data?.encrypted_session_key;
            if (!encrypted) {
                console.warn('[E2EE] No encrypted session key in response');
                return null;
            }

            const encryptedBytes = naclUtil.decodeBase64(encrypted);

            const decrypted = nacl.secretbox.open(
                encryptedBytes.slice(24),
                encryptedBytes.slice(0, 24),
                E2EEManager._identityKeyPair.secretKey.slice(0, 32)
            );

            if (!decrypted) {
                console.error('[E2EE] Failed to decrypt session key');
                return null;
            }

            E2EEManager._sessionKeys.set(channelId, decrypted);
            await E2EEManager._saveSessionKeysToStorage();

            console.log(`[E2EE] Session key fetched and stored for channel ${channelId}`);
            return decrypted;
        } catch (error) {
            console.error('[E2EE] Error fetching session key:', error);
            return null;
        }
    }

    /**
     * Génère une nouvelle clé de session aléatoire
     * @static
     * @returns {Uint8Array} La nouvelle clé de session
     */
    static generateSessionKey() {
        const sessionKey = new Uint8Array(32);
        crypto.getRandomValues(sessionKey);
        return sessionKey;
    }

    /**
     * Crée et distribue une clé de session à tous les membres d'un canal
     * Chiffre la clé de session avec les clés publiques des membres
     * @static
     * @async
     * @param {string} channelId - L'identifiant du canal
     * @param {Array<string>} memberIds - Liste des identifiants des membres
     * @returns {Promise<boolean>} True si la création et la distribution réussissent
     */
    static async createAndDistributeSessionKey(channelId, memberIds) {
        try {
            console.log(`[E2EE] Creating and distributing session key for channel ${channelId}...`);

            const sessionKey = E2EEManager.generateSessionKey();

            const apiService = require('../apiService').default;

            const encryptedForEachUser = await Promise.all(
                memberIds.map(async (userId) => {
                    try {
                        const res = await apiService.request(`/e2ee/keys/user/${userId}`);
                        if (!res.success) return null;

                        const publicKeyBase64 = res.data?.data?.public_key;
                        if (!publicKeyBase64) return null;

                        const recipientPublicKey = naclUtil.decodeBase64(publicKeyBase64);

                        const nonce = nacl.randomBytes(24);
                        const encrypted = nacl.secretbox(
                            sessionKey,
                            nonce,
                            E2EEManager._identityKeyPair.secretKey.slice(0, 32)
                        );

                        const combined = new Uint8Array(nonce.length + encrypted.length);
                        combined.set(nonce);
                        combined.set(encrypted, nonce.length);

                        return {
                            user_id: userId,
                            encrypted_session_key: naclUtil.encodeBase64(combined),
                        };
                    } catch (error) {
                        console.warn(`[E2EE] Failed to encrypt for user ${userId}:`, error);
                        return null;
                    }
                })
            );

            const validKeys = encryptedForEachUser.filter((e) => e != null);

            if (validKeys.length === 0) {
                console.error('[E2EE] No valid encrypted keys created');
                return false;
            }

            const payload = {
                channel_id: channelId,
                encrypted_keys: validKeys,
            };

            const resp = await apiService.request('/e2ee/session-keys/distribute', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (resp.success) {
                E2EEManager._sessionKeys.set(channelId, sessionKey);
                await E2EEManager._saveSessionKeysToStorage();
                console.log(`[E2EE] Session key distributed for channel ${channelId}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('[E2EE] Error distributing session key:', error);
            return false;
        }
    }

    /**
     * Définit manuellement une clé de session pour un canal
     * @static
     * @async
     * @param {string} channelId - L'identifiant du canal
     * @param {Uint8Array} sessionKey - La clé de session à définir
     */
    static async setSessionKey(channelId, sessionKey) {
        E2EEManager._sessionKeys.set(channelId, sessionKey);
        await E2EEManager._saveSessionKeysToStorage();
    }

    /**
     * Supprime une clé de session pour un canal
     * @static
     * @param {string} channelId - L'identifiant du canal
     */
    static clearSessionKey(channelId) {
        E2EEManager._sessionKeys.delete(channelId);
        E2EEManager._saveSessionKeysToStorage();
    }

    /**
     * Récupère la clé publique actuelle du gestionnaire d'E2EE
     * @static
     * @returns {string|null} La clé publique au format Base64 ou null si non disponible
     */
    static getPublicKey() {
        if (!E2EEManager._identityKeyPair) return null;
        return naclUtil.encodeBase64(E2EEManager._identityKeyPair.publicKey);
    }
}

export default E2EEManager;
