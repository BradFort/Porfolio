<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Service pour la gestion des messages directs (DM).
 * Permet de créer, rechercher, quitter et publier des événements liés aux DMs.
 */

namespace App\Services;

use App\Events\DMCreated;
use App\Models\Channel;
use App\Models\DMChannel;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Redis;

/**
 * Class DMChannelService
 * Service pour la gestion des conversations privées (DM).
 */
class DMChannelService
{
    /**
     * Obtenir tous les DMs d'un utilisateur.
     * @param User $user Utilisateur concerné
     * @return Collection Liste des DMs
     */
    public function getUserDMChannels(User $user): Collection
    {
        return DMChannel::withUser($user)
            ->with(['channel.members'])
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    /**
     * Créer ou obtenir un DM existant entre deux utilisateurs.
     * @param User $user1 Premier utilisateur
     * @param User $user2 Deuxième utilisateur
     * @return array ['dm' => DMChannel, 'status' => 'created'|'rejoined'|'existing']
     */
    public function createOrGetDM(User $user1, User $user2): array
    {
        if ($user1->id === $user2->id) {
            throw new \InvalidArgumentException('Impossible de créer un DM avec soi-même');
        }
        $existingDM = DMChannel::findBetweenUsers($user1, $user2);
        if ($existingDM) {
            return [
                'dm' => $existingDM->load(['channel.members']),
                'status' => 'existing',
            ];
        }
        $expectedName1 = "DM-{$user1->id}-{$user2->id}";
        $expectedName2 = "DM-{$user2->id}-{$user1->id}";
        $channel = Channel::where('type', Channel::TYPE_DM)
            ->where(function ($q) use ($expectedName1, $expectedName2) {
                $q->where('name', $expectedName1)
                  ->orWhere('name', $expectedName2);
            })
            ->first();
        if ($channel) {
            $user1WasMember = $channel->isMember($user1);
            $user2WasMember = $channel->isMember($user2);
            $channel->addMember($user1);
            $channel->addMember($user2);
            $dm = DMChannel::where('channel_id', $channel->id)->first();
            $dmCreatedFromChannel = false;
            if (!$dm) {
                $dm = DMChannel::create([
                    'channel_id' => $channel->id,
                ]);
                $dmCreatedFromChannel = true;
            }
            $status = 'existing';
            if ($dmCreatedFromChannel || !$user1WasMember || !$user2WasMember) {
                $status = 'rejoined';
            }
            return [
                'dm' => $dm->load(['channel.members']),
                'status' => $status,
            ];
        }
        $dm = DMChannel::createBetweenUsers($user1, $user2);
        $dm->load(['channel.members']);
        $this->publishDMCreated($dm, $user1, $user2);
        return [
            'dm' => $dm,
            'status' => 'created',
        ];
    }

    /**
     * Obtenir un DM avec tous ses détails.
     * @param DMChannel $dm DM concerné
     * @return DMChannel DM enrichi
     */
    public function getDMWithDetails(DMChannel $dm): DMChannel
    {
        return $dm->load(['channel.members', 'channel.creator']);
    }

    /**
     * Faire quitter un utilisateur d'un DM.
     * @param DMChannel $dm DM concerné
     * @param User $user Utilisateur à retirer
     * @return array Résultat de l'opération
     */
    public function leaveDM(DMChannel $dm, User $user): array
    {
        if (!$dm->hasParticipant($user)) {
            return [
                'success' => false,
                'message' => 'Vous ne participez pas à cette conversation'
            ];
        }
        $dm->channel->removeMember($user);
        $remainingParticipants = $dm->channel->members()->count();
        if ($remainingParticipants === 0) {
            $dm->channel->delete();
            return [
                'success' => true,
                'message' => 'Conversation supprimée définitivement'
            ];
        }
        return [
            'success' => true,
            'message' => 'Vous avez quitté la conversation'
        ];
    }

    /**
     * Rechercher des DMs par nom d'utilisateur.
     * @param User $user Utilisateur concerné
     * @param string $searchTerm Terme de recherche
     * @return Collection Liste des DMs trouvés
     */
    public function searchDMsByUser(User $user, string $searchTerm): Collection
    {
        return DMChannel::withUser($user)
            ->with(['channel.members'])
            ->whereHas('channel.members', function ($query) use ($searchTerm, $user) {
                $query
                    ->where('user_id', '!=', $user->id)
                    ->where('name', 'LIKE', "%{$searchTerm}%");
            })
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    /**
     * Publier l'événement de création de DM vers Redis.
     * @param DMChannel $dm DM concerné
     * @param User $user1 Premier participant
     * @param User $user2 Deuxième participant
     * @return void
     */
    private function publishDMCreated(DMChannel $dm, User $user1, User $user2): void
    {
        try {
            $payload = json_encode([
                'dm_id' => $dm->id,
                'channel_id' => $dm->channel_id,
                'participant1_id' => $user1->id,
                'participant2_id' => $user2->id,
                'channel' => [
                    'id' => $dm->channel->id,
                    'name' => $dm->channel->name,
                    'type' => $dm->channel->type,
                    'description' => $dm->channel->description,
                    'created_at' => $dm->channel->created_at->toISOString(),
                ],
                'participants' => [
                    [
                        'id' => $user1->id,
                        'name' => $user1->name,
                        'email' => $user1->email,
                    ],
                    [
                        'id' => $user2->id,
                        'name' => $user2->name,
                        'email' => $user2->email,
                    ]
                ],
                'created_at' => $dm->created_at->toISOString(),
            ]);

            Redis::publish('chatappapi-database-dm.created', $payload);
        } catch (\Exception $e) {
            // nothing
        }
    }
}
