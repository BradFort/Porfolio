/**
 * @fileoverview Hook personnalisé pour charger et gérer les messages d'un canal
 * @authors Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 * @created 2025
 */

import { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import E2EEManager from '../services/crypto/E2EEManager';
import E2EEMessageService from '../services/crypto/E2EEMessageService';

/**
 * Hook personnalisé pour gérer les messages d'un canal
 * Charge automatiquement les messages (normaux et chiffrés E2EE) au montage et lors du changement de canal
 * Déchiffre les messages E2EE si une clé de session est disponible
 * @param {number} channelId - ID du canal dont on veut charger les messages
 * @returns {Object} Objet contenant les messages et l'état de chargement
 * @returns {Array} messages - Liste des messages du canal (normaux et déchiffrés)
 * @returns {boolean} loading - Indicateur de chargement
 * @returns {Function} refresh - Fonction pour recharger les messages
 */
export default function useMessages(channelId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Charge les messages du canal (normaux et chiffrés)
   * Déchiffre les messages E2EE si une clé de session existe
   * Fusionne et trie tous les messages par date de création
   * @async
   * @returns {Promise<void>}
   */
  const fetchMessages = async () => {
    setLoading(true);

    const [normal, encrypted, members] = await Promise.all([
      apiService.getMessages(channelId),
      apiService.getEncryptedMessages(channelId),
      apiService.getChannelMembers(channelId)
    ]);

    const membersMap = new Map();
    members.data?.forEach((m) => {
      const id = m.user_id || m.user?.id || m.id;
      const name = m.user_name || m.user?.name || m.name;
      membersMap.set(id, name);
    });

    let encryptedMessages = encrypted.data?.messages || [];

    // Déchiffrer
    if (encryptedMessages.length > 0) {
      const sessionKey = await E2EEManager.fetchSessionKey(channelId);

      encryptedMessages = await Promise.all(
        encryptedMessages.map(async (msg) => {
          const userId = msg.sender_id || msg.user_id;
          const author = membersMap.get(userId) || 'User';

          let content = '[Message chiffré]';
          try {
            content = await E2EEMessageService.decryptMessage(
              {
                encryptedContent: msg.encrypted_content,
                iv: msg.iv,
                authTag: msg.auth_tag || ''
              },
              sessionKey
            );
          } catch {}

          return {
            id: msg.id,
            content,
            author,
            created_at: msg.created_at,
            isEncrypted: true
          };
        })
      );
    }

    const all = [...normal.data, ...encryptedMessages].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    setMessages(all);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [channelId]);

  return { messages, loading, refresh: fetchMessages };
}
