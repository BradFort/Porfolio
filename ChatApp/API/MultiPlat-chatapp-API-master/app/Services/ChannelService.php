<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Service pour la gestion des channels (salons de discussion).
 * Permet de lister, créer, modifier, supprimer et gérer les membres des channels.
 */

namespace App\Services;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * Class ChannelService
 * Service pour la gestion des salons de discussion.
 */
class ChannelService
{
    /**
     * Lister tous les channels avec les informations de membre pour un utilisateur.
     * @param User|null $user Utilisateur pour vérifier l'appartenance
     * @return Collection Liste des channels
     */
    public function getAllChannels(?User $user = null): Collection
    {
        return Channel::with(['creator', 'members'])
            ->get()
            ->map(function ($channel) use ($user) {
                $channel->is_member = $user ? $channel->isMember($user) : false;
                return $channel;
            });
    }

    /**
     * Lister seulement les channels publics.
     * @return Collection Liste des channels publics
     */
    public function getPublicChannels(): Collection
    {
        return Channel::public()
            ->with(['creator'])
            ->get();
    }

    /**
     * Créer un nouveau channel.
     * @param array $data Données du channel
     * @param User $user Utilisateur créateur
     * @return Channel Channel créé
     */
    public function createChannel(array $data, User $user): Channel
    {
        $channel = Channel::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'description' => $data['description'] ?? '',
            'created_by' => $user->id
        ]);

        // Ajouter automatiquement le créateur au channel
        $channel->addMember($user);
        $channel->load(['creator', 'members']);

        return $channel;
    }

    /**
     * Mettre à jour un channel.
     * @param Channel $channel Channel à mettre à jour
     * @param array $data Données à mettre à jour
     * @return Channel Channel mis à jour
     */
    public function updateChannel(Channel $channel, array $data): Channel
    {
        $channel->update($data);
        $channel->load(['creator', 'members']);

        return $channel;
    }

    /**
     * Supprimer un channel.
     * @param Channel $channel Channel à supprimer
     * @return bool Vrai si supprimé, faux sinon
     */
    public function deleteChannel(Channel $channel): bool
    {
        return $channel->delete();
    }

    /**
     * Faire rejoindre un utilisateur à un channel.
     * @param Channel $channel Channel à rejoindre
     * @param User $user Utilisateur à ajouter
     * @return array Résultat de l'opération
     */
    public function joinChannel(Channel $channel, User $user): array
    {
        // Vérifier si le channel est privé
        if ($channel->type === Channel::TYPE_PRIVATE && !$user->isAdmin()) {
            return [
                'success' => false,
                'message' => 'Impossible de rejoindre un salon privé sans invitation'
            ];
        }

        // Tenter d'ajouter l'utilisateur
        if (!$channel->addMember($user)) {
            return [
                'success' => false,
                'message' => 'Vous êtes déjà membre de ce salon'
            ];
        }

        return [
            'success' => true,
            'message' => "Vous avez rejoint le salon \"{$channel->name}\""
        ];
    }

    /**
     * Faire quitter un utilisateur d'un channel.
     * @param Channel $channel Channel à quitter
     * @param User $user Utilisateur à retirer
     * @return array Résultat de l'opération
     */
    public function leaveChannel(Channel $channel, User $user): array
    {
        // Tenter de retirer l'utilisateur
        if (!$channel->removeMember($user)) {
            return [
                'success' => false,
                'message' => 'Vous n\'êtes pas membre de ce salon'
            ];
        }

        return [
            'success' => true,
            'message' => "Vous avez quitté le salon \"{$channel->name}\""
        ];
    }

    /**
     * Obtenir les channels d'un utilisateur.
     * @param User $user Utilisateur concerné
     * @return Collection Liste des channels
     */
    public function getUserChannels(User $user): Collection
    {
        return $user->channels()
            ->with(['creator'])
            ->get();
    }


    /**
     * Inviter un utilisateur à un channel privé (crée une invitation).
     * @deprecated Utiliser InvitationService::createInvitation() à la place
     * @param Channel $channel Channel concerné
     * @param User $inviter Utilisateur qui invite
     * @param User $invitedUser Utilisateur invité
     * @return array Résultat de l'opération
     */
    public function inviteUserToChannel(Channel $channel, User $inviter, User $invitedUser): array
    {
        return app(\App\Services\InvitationService::class)->createInvitation(
            $channel,
            $inviter,
            $invitedUser
        );
    }

    /**
     * Vérifier si un utilisateur peut modifier un channel.
     * @param Channel $channel Channel concerné
     * @param User $user Utilisateur concerné
     * @return bool Vrai si autorisé, faux sinon
     */
    public function canUserEditChannel(Channel $channel, User $user): bool
    {
        return $channel->created_by === $user->id || $user->isAdmin();
    }

    /**
     * Obtenir un channel avec toutes ses relations.
     * @param Channel $channel Channel concerné
     * @param User|null $user Utilisateur pour vérifier l'appartenance
     * @return Channel Channel enrichi
     */
    public function getChannelWithDetails(Channel $channel, ?User $user = null): Channel
    {
        $channel->load(['creator', 'members']);
        $channel->is_member = $user ? $channel->isMember($user) : false;

        return $channel;
    }
}
