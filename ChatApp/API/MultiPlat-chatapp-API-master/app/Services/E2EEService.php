<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Service pour la gestion du chiffrement de bout en bout (E2EE).
 * Gère l'échange de clés RSA, la distribution des clés de session AES et le stockage sécurisé.
 */

namespace App\Services;

use App\Models\User;
use App\Models\Channel;
use App\Models\UserE2eeKey;
use App\Models\E2eeSessionKey;
use Illuminate\Support\Facades\DB;
use Exception;

/**
 * Service de gestion du chiffrement de bout en bout (E2EE) - Version simplifiée
 *
 * Architecture : RSA-4096 + AES-256
 *
 * IMPORTANT : Ce service ne peut PAS déchiffrer les messages.
 * Il gère uniquement :
 * - L'échange de clés publiques RSA
 * - Le stockage des clés de session AES chiffrées
 * - La distribution des clés aux membres d'un channel
 *
 * Le serveur agit comme un relais chiffré : il ne peut rien lire !
 */
class E2EEService
{
    /**
     * Enregistrer la clé publique RSA d'un utilisateur.
     * @param User $user Utilisateur concerné
     * @param string $publicKey Clé publique RSA-4096 au format PEM
     * @return UserE2eeKey
     * @throws Exception Si l'utilisateur a déjà une clé
     */
    public function registerUserPublicKey(User $user, string $publicKey): UserE2eeKey
    {
        $existingKey = UserE2eeKey::where('user_id', $user->id)->first();
        if ($existingKey) {
            throw new Exception('Cet utilisateur a déjà une clé publique enregistrée');
        }
        return UserE2eeKey::create([
            'user_id' => $user->id,
            'public_key' => $publicKey
        ]);
    }

    /**
     * Obtenir la clé publique RSA d'un utilisateur.
     * @param User $user Utilisateur concerné
     * @return UserE2eeKey|null
     */
    public function getUserPublicKey(User $user): ?UserE2eeKey
    {
        return UserE2eeKey::where('user_id', $user->id)->first();
    }

    /**
     * Distribuer les clés de session chiffrées pour un channel.
     * @param int $channelId ID du channel
     * @param array $encryptedKeys Tableau de ['user_id' => int, 'encrypted_session_key' => string]
     * @return int Nombre de clés distribuées
     */
    public function distributeSessionKeys(int $channelId, array $encryptedKeys): int
    {
        $insertData = [];
        foreach ($encryptedKeys as $keyData) {
            $insertData[] = [
                'channel_id' => $channelId,
                'user_id' => $keyData['user_id'],
                'encrypted_session_key' => $keyData['encrypted_session_key'],
                'created_at' => now(),
                'updated_at' => now()
            ];
        }
        DB::table('e2ee_session_keys')->upsert(
            $insertData,
            ['channel_id', 'user_id'],
            ['encrypted_session_key', 'updated_at']
        );
        return count($insertData);
    }

    /**
     * Obtenir la clé de session chiffrée pour un utilisateur dans un channel.
     * @param int $channelId ID du channel
     * @param int $userId ID de l'utilisateur
     * @return E2eeSessionKey|null
     */
    public function getSessionKey(int $channelId, int $userId): ?E2eeSessionKey
    {
        return E2eeSessionKey::where('channel_id', $channelId)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Vérifier si un utilisateur a configuré E2EE.
     * @param User $user Utilisateur concerné
     * @return bool Vrai si E2EE activé, faux sinon
     */
    public function hasE2EEEnabled(User $user): bool
    {
        return UserE2eeKey::where('user_id', $user->id)->exists();
    }

    /**
     * Obtenir les clés publiques de tous les membres d'un channel.
     * @param Channel $channel Channel concerné
     * @return array Liste des clés publiques
     */
    public function getChannelMembersPublicKeys(Channel $channel): array
    {
        $members = $channel->members()->get();
        $keys = [];
        foreach ($members as $member) {
            $userKey = $this->getUserPublicKey($member);
            if ($userKey) {
                $keys[] = [
                    'user_id' => $member->id,
                    'username' => $member->name,
                    'public_key' => $userKey->public_key
                ];
            }
        }
        return $keys;
    }

    /**
     * Nettoyer les clés de session d'un utilisateur qui quitte un channel.
     * @param int $channelId ID du channel
     * @param int $userId ID de l'utilisateur
     * @return bool Vrai si supprimé, faux sinon
     */
    public function removeUserFromChannel(int $channelId, int $userId): bool
    {
        return E2eeSessionKey::where('channel_id', $channelId)
            ->where('user_id', $userId)
            ->delete() > 0;
    }

    /**
     * Supprimer toutes les clés de session d'un channel.
     * @param int $channelId ID du channel
     * @return int Nombre de clés supprimées
     */
    public function deleteChannelSessionKeys(int $channelId): int
    {
        return E2eeSessionKey::where('channel_id', $channelId)->delete();
    }

    /**
     * Obtenir la clé de session brute (en clair) pour un channel.
     * ATTENTION : Cette méthode suppose que la clé de session AES est stockée en clair quelque part (ce qui n'est pas recommandé en prod !)
     * Ici, on suppose que la clé de session est stockée dans la table 'channels' (colonne 'session_key')
     * @param int $channelId ID du channel
     * @return string|null Clé de session brute
     */
    public function getRawSessionKey(int $channelId): ?string
    {
        $channel = Channel::find($channelId);
        if ($channel && !empty($channel->session_key)) {
            return $channel->session_key;
        }
        return null;
    }

    /**
     * Chiffrer la clé de session AES pour un utilisateur avec sa clé publique RSA.
     * @param string $sessionKey Clé de session AES
     * @param string $publicKey Clé publique RSA
     * @return string Clé chiffrée (base64)
     */
    public function encryptSessionKeyForUser(string $sessionKey, string $publicKey): string
    {
        $encrypted = null;
        openssl_public_encrypt($sessionKey, $encrypted, $publicKey, OPENSSL_PKCS1_OAEP_PADDING);
        return base64_encode($encrypted);
    }

    /**
     * Stocker la clé de session chiffrée pour un user/channel.
     * @param int $channelId ID du channel
     * @param int $userId ID de l'utilisateur
     * @param string $encryptedSessionKey Clé chiffrée
     * @return void
     */
    public function storeEncryptedSessionKey(int $channelId, int $userId, string $encryptedSessionKey): void
    {
        E2eeSessionKey::updateOrCreate(
            [
                'channel_id' => $channelId,
                'user_id' => $userId
            ],
            [
                'encrypted_session_key' => $encryptedSessionKey
            ]
        );
    }
}
