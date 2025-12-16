/**
 * Fichier : SecureStorage.js
 * Service de stockage sécurisé pour les clés E2EE et autres données sensibles.
 * Utilise le chiffrement natif d'Electron (safeStorage) et stocke les données chiffrées sur le disque local.
 */


import { app, safeStorage } from 'electron'
import fs from 'fs'
import path from 'path'

class SecureStorage {
  constructor() {
    // Définir le dossier de stockage sécurisé dans le répertoire utilisateur de l'app
    this.storageDir = path.join(app.getPath('userData'), 'secure')
    this.ensureStorageDir()
  }

  /**
   * S'assure que le dossier de stockage existe
   * Crée le dossier si nécessaire (utilisé pour persister les clés chiffrées)
   */
  ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true })
    }
  }

  /**
   * Vérifie si le chiffrement natif est disponible sur la plateforme
   * Permet d'éviter les opérations sur des systèmes non supportés
   */
  isEncryptionAvailable() {
    return safeStorage.isEncryptionAvailable()
  }

  /**
   * Sauvegarde une valeur de manière sécurisée (chiffrée)
   * Utilise safeStorage pour chiffrer avant d'écrire sur disque
   */
  async setItem(key, value) {
    try {
      if (!this.isEncryptionAvailable()) {
        console.error('[SecureStorage] Chiffrement non disponible sur ce système')
        return false
      }

      // Chiffrer la valeur avec safeStorage
      const buffer = safeStorage.encryptString(value)

      // Sauvegarder le buffer chiffré dans un fichier
      const filePath = this.getFilePath(key)
      fs.writeFileSync(filePath, buffer)

      console.log(`[SecureStorage] Clé "${key}" sauvegardée de manière sécurisée`)
      return true
    } catch (error) {
      // Gestion des erreurs d'écriture ou de chiffrement
      console.error(`[SecureStorage] Erreur lors de la sauvegarde de "${key}":`, error)
      return false
    }
  }

  /**
   * Récupère une valeur sécurisée (déchiffrée)
   * Retourne null si la clé n'existe pas ou si le chiffrement n'est pas disponible
   */
  async getItem(key) {
    try {
      const filePath = this.getFilePath(key)

      if (!fs.existsSync(filePath)) {
        return null
      }

      if (!this.isEncryptionAvailable()) {
        console.error('[SecureStorage] Chiffrement non disponible sur ce système')
        return null
      }

      // Lire le buffer chiffré
      const buffer = fs.readFileSync(filePath)

      // Déchiffrer avec safeStorage
      return safeStorage.decryptString(buffer)
    } catch (error) {
      // Gestion des erreurs de lecture ou de déchiffrement
      console.error(`[SecureStorage] Erreur lors de la récupération de "${key}":`, error)
      return null
    }
  }

  /**
   * Supprime une valeur sécurisée
   * Supprime le fichier associé à la clé
   */
  async removeItem(key) {
    try {
      const filePath = this.getFilePath(key)

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`[SecureStorage] Clé "${key}" supprimée`)
      }

      return true
    } catch (error) {
      console.error(`[SecureStorage] Erreur lors de la suppression de "${key}":`, error)
      return false
    }
  }

  /**
   * Supprime toutes les données sécurisées
   * @returns {Promise<boolean>}
   */
  async clear() {
    try {
      const files = fs.readdirSync(this.storageDir)

      for (const file of files) {
        const filePath = path.join(this.storageDir, file)
        fs.unlinkSync(filePath)
      }

      console.log('[SecureStorage] Toutes les données sécurisées ont été supprimées')
      return true
    } catch (error) {
      console.error('[SecureStorage] Erreur lors du nettoyage:', error)
      return false
    }
  }

  /**
   * Obtient le chemin du fichier pour une clé
   * @param {string} key
   * @returns {string}
   */
  getFilePath(key) {
    const encodedKey = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_')
    return path.join(this.storageDir, `${encodedKey}.enc`)
  }

  /**
   * Vérifie si une clé existe
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async hasItem(key) {
    const filePath = this.getFilePath(key)
    return fs.existsSync(filePath)
  }
}

export default new SecureStorage()
