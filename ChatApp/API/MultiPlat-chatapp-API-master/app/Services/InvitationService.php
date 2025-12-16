<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Service pour la gestion des invitations aux channels privés.
 * Permet de créer, accepter, refuser, expirer et publier des événements liés aux invitations.
 */

namespace App\Services;

use App\Models\Channel;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

/**
 * Class InvitationService
 * Service pour la gestion des invitations aux salons privés.
 */
class InvitationService
{
    /**
     * Créer une nouvelle invitation.
     * @param Channel $channel Salon concerné
     * @param User $inviter Utilisateur qui invite
     * @param User $invitedUser Utilisateur invité
     * @param string|null $message Message d'invitation
     * @return array Résultat de l'opération
     */
    public function createInvitation(
        Channel $channel,
        User $inviter,
        User $invitedUser,
        ?string $message = null
    ): array {
        // Vérifications de base
        if ($channel->type !== Channel::TYPE_PRIVATE) {
            return [
                'success' => false,
                'message' => "Impossible d'inviter à un salon public"
            ];
        }

        if (!$channel->isMember($inviter)) {
            return [
                'success' => false,
                'message' => "Vous devez être membre du salon pour inviter quelqu'un"
            ];
        }

        if ($channel->isMember($invitedUser)) {
            return [
                'success' => false,
                'message' => "L'utilisateur est déjà membre de ce salon"
            ];
        }

        if ($inviter->id === $invitedUser->id) {
            return [
                'success' => false,
                'message' => "Vous ne pouvez pas vous inviter vous-même"
            ];
        }

        // Vérifier qu'il n'y a pas déjà une invitation en attente
        $existingInvitation = Invitation::where('channel_id', $channel->id)
            ->where('invited_user_id', $invitedUser->id)
            ->where('status', Invitation::STATUS_PENDING)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', Carbon::now());
            })
            ->first();

        if ($existingInvitation) {
            return [
                'success' => false,
                'message' => 'Une invitation est déjà en attente pour cet utilisateur'
            ];
        }

        // Créer l'invitation
        $invitation = Invitation::create([
            'channel_id' => $channel->id,
            'inviter_id' => $inviter->id,
            'invited_user_id' => $invitedUser->id,
            'message' => $message,
            'status' => Invitation::STATUS_PENDING
        ]);

        $invitation->load(['channel', 'inviter', 'invitedUser']);

        // Publier l'événement Redis pour WebSocket
        $this->publishInvitationCreated($invitation);

        return [
            'success' => true,
            'message' => "Invitation envoyée à {$invitedUser->name}",
            'data' => $invitation
        ];
    }

    /**
     * Obtenir toutes les invitations en attente d'un utilisateur.
     * @param User $user Utilisateur concerné
     * @return Collection Liste des invitations
     */
    public function getPendingInvitationsForUser(User $user): Collection
    {
        return Invitation::pending()
            ->forUser($user)
            ->with(['channel', 'inviter'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Obtenir une invitation spécifique.
     * @param int $invitationId Identifiant de l'invitation
     * @param User $user Utilisateur concerné
     * @return Invitation|null Invitation trouvée ou null
     */
    public function getInvitation(int $invitationId, User $user): ?Invitation
    {
        return Invitation::where('id', $invitationId)
            ->where('invited_user_id', $user->id)
            ->with(['channel', 'inviter'])
            ->first();
    }

    /**
     * Accepter une invitation.
     * @param Invitation $invitation Invitation à accepter
     * @param User $user Utilisateur concerné
     * @return array Résultat de l'opération
     */
    public function acceptInvitation(Invitation $invitation, User $user): array
    {
        // Vérifier que l'invitation appartient à l'utilisateur
        if ($invitation->invited_user_id !== $user->id) {
            return [
                'success' => false,
                'message' => 'Cette invitation ne vous appartient pas'
            ];
        }

        // Vérifier que l'invitation est en attente
        if (!$invitation->isPending()) {
            return [
                'success' => false,
                'message' => 'Cette invitation n\'est plus valide'
            ];
        }

        // Accepter l'invitation (ajoute automatiquement au channel)
        if (!$invitation->accept()) {
            return [
                'success' => false,
                'message' => 'Erreur lors de l\'acceptation de l\'invitation'
            ];
        }

        $invitation->load(['channel', 'inviter', 'invitedUser']);

        // Publier les événements Redis pour WebSocket
        $this->publishUserJoined($invitation->channel, $user);
        $this->publishInvitationAccepted($invitation);

        return [
            'success' => true,
            'message' => "Vous avez rejoint le salon \"{$invitation->channel->name}\"",
            'data' => $invitation
        ];
    }

    /**
     * Refuser une invitation.
     * @param Invitation $invitation Invitation à refuser
     * @param User $user Utilisateur concerné
     * @return array Résultat de l'opération
     */
    public function rejectInvitation(Invitation $invitation, User $user): array
    {
        // Vérifier que l'invitation appartient à l'utilisateur
        if ($invitation->invited_user_id !== $user->id) {
            return [
                'success' => false,
                'message' => 'Cette invitation ne vous appartient pas'
            ];
        }

        // Vérifier que l'invitation est en attente
        if (!$invitation->isPending()) {
            return [
                'success' => false,
                'message' => 'Cette invitation n\'est plus valide'
            ];
        }

        // Refuser l'invitation
        if (!$invitation->reject()) {
            return [
                'success' => false,
                'message' => 'Erreur lors du refus de l\'invitation'
            ];
        }

        $invitation->load(['channel', 'inviter', 'invitedUser']);

        // Publier l'événement Redis pour WebSocket
        $this->publishInvitationRejected($invitation);

        return [
            'success' => true,
            'message' => 'Invitation refusée',
            'data' => $invitation
        ];
    }

    /**
     * Expirer automatiquement les invitations.
     * @return int Nombre d'invitations expirées
     */
    public function expireOldInvitations(): int
    {
        $expiredInvitations = Invitation::expired()->get();
        $count = 0;

        foreach ($expiredInvitations as $invitation) {
            if ($invitation->markAsExpired()) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Obtenir le nombre d'invitations en attente pour un utilisateur.
     * @param User $user Utilisateur concerné
     * @return int Nombre d'invitations en attente
     */
    public function getPendingInvitationsCount(User $user): int
    {
        return Invitation::pending()
            ->forUser($user)
            ->count();
    }

    /**
     * Supprimer les invitations expirées depuis plus de X jours.
     * @param int $daysOld Nombre de jours
     * @return int Nombre d'invitations supprimées
     */
    public function cleanupExpiredInvitations(int $daysOld = 7): int
    {
        return Invitation::where('status', Invitation::STATUS_EXPIRED)
            ->where('updated_at', '<', Carbon::now()->subDays($daysOld))
            ->delete();
    }

    /**
     * Publier l'événement de création d'invitation vers Redis.
     * @param Invitation $invitation Invitation concernée
     * @return void
     */
    private function publishInvitationCreated(Invitation $invitation): void
    {
        try {
            $payload = json_encode([
                'id' => $invitation->id,
                'recipient_id' => $invitation->invited_user_id,
                'channel' => [
                    'id' => $invitation->channel->id,
                    'name' => $invitation->channel->name,
                    'description' => $invitation->channel->description,
                    'type' => $invitation->channel->type,
                ],
                'inviter' => [
                    'id' => $invitation->inviter->id,
                    'name' => $invitation->inviter->name,
                    'email' => $invitation->inviter->email,
                ],
                'message' => $invitation->message,
                'created_at' => $invitation->created_at->toISOString(),
            ]);

            Redis::publish('chatappapi-database-invitation.created', $payload);
            \Log::info('[Redis] Événement invitation.created publié', ['invitation_id' => $invitation->id]);
        } catch (\Exception $e) {
            \Log::error('[Redis] Erreur publication invitation.created', [
                'invitation_id' => $invitation->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Publier l'événement d'acceptation d'invitation vers Redis.
     * @param Invitation $invitation Invitation concernée
     * @return void
     */
    private function publishInvitationAccepted(Invitation $invitation): void
    {
        try {
            $payload = json_encode([
                'channel_id' => $invitation->channel_id,
                'user_id' => $invitation->invited_user_id,
                'inviter_id' => $invitation->inviter_id,
                'channel' => [
                    'id' => $invitation->channel->id,
                    'name' => $invitation->channel->name,
                    'description' => $invitation->channel->description,
                    'type' => $invitation->channel->type,
                ],
                'user' => [
                    'id' => $invitation->invitedUser->id,
                    'name' => $invitation->invitedUser->name,
                    'email' => $invitation->invitedUser->email,
                ],
            ]);

            Redis::publish('chatappapi-database-invitation.accepted', $payload);
            \Log::info('[Redis] Événement invitation.accepted publié', ['invitation_id' => $invitation->id]);
        } catch (\Exception $e) {
            \Log::error('[Redis] Erreur publication invitation.accepted', [
                'invitation_id' => $invitation->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Publier l'événement de refus d'invitation vers Redis.
     * @param Invitation $invitation Invitation concernée
     * @return void
     */
    private function publishInvitationRejected(Invitation $invitation): void
    {
        try {
            $payload = json_encode([
                'channel_id' => $invitation->channel_id,
                'user_id' => $invitation->invited_user_id,
                'inviter_id' => $invitation->inviter_id,
                'channel' => [
                    'id' => $invitation->channel->id,
                    'name' => $invitation->channel->name,
                    'description' => $invitation->channel->description,
                    'type' => $invitation->channel->type,
                ],
                'user' => [
                    'id' => $invitation->invitedUser->id,
                    'name' => $invitation->invitedUser->name,
                    'email' => $invitation->invitedUser->email,
                ],
            ]);

            Redis::publish('chatappapi-database-invitation.rejected', $payload);
            \Log::info('[Redis] Événement invitation.rejected publié', ['invitation_id' => $invitation->id]);
        } catch (\Exception $e) {
            \Log::error('[Redis] Erreur publication invitation.rejected', [
                'invitation_id' => $invitation->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Publier l'événement user.joined vers Redis.
     * @param Channel $channel Salon concerné
     * @param User $user Utilisateur concerné
     * @return void
     */
    private function publishUserJoined(Channel $channel, User $user): void
    {
        try {
            $payload = json_encode([
                'channel_id' => $channel->id,
                'user_id' => $user->id,
                'action' => 'join',
            ]);

            Redis::publish('chatappapi-database-channel.user.joined', $payload);
            \Log::info('[Redis] Événement user.joined publié', [
                'channel_id' => $channel->id,
                'user_id' => $user->id
            ]);
        } catch (\Exception $e) {
            \Log::error('[Redis] Erreur publication user.joined', [
                'channel_id' => $channel->id,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
