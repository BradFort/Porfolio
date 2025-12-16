<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Service pour la gestion des messages dans les channels.
 * Permet de créer, supprimer et récupérer des messages texte, vocaux et avec pièces jointes.
 */

namespace App\Services;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Class MessageService
 * Service pour la gestion des messages dans les salons.
 */
class MessageService
{
    /**
     * Créer un nouveau message texte.
     * @param string $content Contenu du message
     * @param User $sender Utilisateur expéditeur
     * @param Channel $channel Salon concerné
     * @return array Résultat de l'opération
     */
    public function createMessage(string $content, User $sender, Channel $channel): array
    {
        if (empty(trim($content))) {
            return [
                'success' => false,
                'message' => 'Le message ne peut pas être vide'
            ];
        }

        if (!$channel->isMember($sender)) {
            return [
                'success' => false,
                'message' => 'Vous devez être membre du salon'
            ];
        }

        $message = Message::create([
            'content' => trim($content),
            'channel_id' => $channel->id,
            'user_id' => $sender->id,
        ]);

        $message->load(['user', 'channel']);

        return [
            'success' => true,
            'message' => 'Message envoyé',
            'data' => $message
        ];
    }

    /**
     * Créer un nouveau message vocal.
     * @param string $filePath Chemin du fichier vocal
     * @param int $duration Durée du message vocal
     * @param User $sender Utilisateur expéditeur
     * @param Channel $channel Salon concerné
     * @return array Résultat de l'opération
     */
    public function createVoiceMessage(string $filePath, int $duration, User $sender, Channel $channel): array
    {
        if (!$channel->isMember($sender)) {
            return [
                'success' => false,
                'message' => 'Vous devez être membre du salon'
            ];
        }

        $message = Message::create([
            'content' => '[Message vocal]',
            'channel_id' => $channel->id,
            'user_id' => $sender->id,
            'type' => 'voice',
            'file_path' => $filePath,
            'duration' => $duration,
        ]);

        $message->load(['user', 'channel']);

        return [
            'success' => true,
            'message' => 'Message vocal envoyé',
            'data' => $message
        ];
    }

    /**
     * Créer un nouveau message avec pièce jointe.
     * @param string $filePath Chemin du fichier
     * @param string $fileName Nom du fichier
     * @param int $fileSize Taille du fichier
     * @param string $mimeType Type MIME
     * @param string $content Contenu du message
     * @param User $sender Utilisateur expéditeur
     * @param Channel $channel Salon concerné
     * @return array Résultat de l'opération
     */
    public function createAttachmentMessage(
        string $filePath,
        string $fileName,
        int $fileSize,
        string $mimeType,
        string $content,
        User $sender,
        Channel $channel
    ): array {
        if (!$channel->isMember($sender)) {
            return [
                'success' => false,
                'message' => 'Vous devez être membre du salon'
            ];
        }

        $message = Message::create([
            'content' => $content,
            'channel_id' => $channel->id,
            'user_id' => $sender->id,
            'type' => 'attachment',
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
        ]);

        $message->load(['user', 'channel']);

        return [
            'success' => true,
            'message' => 'Pièce jointe envoyée',
            'data' => $message
        ];
    }

    /**
     * Récupérer les messages d'un channel.
     * @param Channel $channel Salon concerné
     * @param User $user Utilisateur demandeur
     * @param int $limit Nombre de messages à récupérer
     * @return Collection|null Liste des messages ou null si accès refusé
     */
    public function getChannelMessages(Channel $channel, User $user, int $limit = 50): ?Collection
    {
        if ($channel->type === Channel::TYPE_PRIVATE && !$channel->isMember($user) && !$user->isAdmin()) {
            return null;
        }

        return Message::forChannel($channel)
            ->with(['user'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();
    }

    /**
     * Supprimer un message (seulement l'auteur ou admin).
     * @param Message $message Message à supprimer
     * @param User $user Utilisateur demandeur
     * @return array Résultat de l'opération
     */
    public function deleteMessage(Message $message, User $user): array
    {
        if ($message->user_id !== $user->id && !$user->hasElevatedPermissions()) {
            return [
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer ce message'
            ];
        }

        // Déterminer le disque de stockage
        $storageDisk = config('filesystems.default') === 'spaces' ? 'spaces' : 'public';

        // Supprimer le fichier vocal si c'est un message vocal
        if ($message->type === 'voice' && $message->file_path) {
            Storage::disk($storageDisk)->delete($message->file_path);
        }

        // Supprimer le fichier si c'est une pièce jointe
        if ($message->type === 'attachment' && $message->file_path) {
            Storage::disk($storageDisk)->delete($message->file_path);
        }

        $message->delete();

        return [
            'success' => true,
            'message' => 'Message supprimé'
        ];
    }
}
