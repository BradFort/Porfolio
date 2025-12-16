<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les channels de messages directs (DM).
 * Permet de gérer les conversations privées entre deux utilisateurs.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * Class DMChannel
 * Modèle représentant un salon de message direct (DM).
 *
 * @property int $id Identifiant du DM
 * @property int $channel_id Identifiant du channel parent
 */
class DMChannel extends Model
{
    use HasFactory;

    protected $table = 'dm_channels';

    protected $fillable = [
        'channel_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec le channel parent.
     * @return BelongsTo
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Obtenir les participants du DM (via le channel).
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function participants()
    {
        return $this->channel->members();
    }

    /**
     * Obtenir les messages du DM (via le channel).
     * @return HasManyThrough
     */
    public function messages(): HasManyThrough
    {
        return $this->hasManyThrough(
            Message::class,
            Channel::class,
            'id', // Clé étrangère sur la table channels
            'channel_id', // Clé étrangère sur la table messages
            'channel_id', // Clé locale sur la table dm_channels
            'id', // Clé locale sur la table channels
        );
    }

    /**
     * Vérifie si un utilisateur participe à ce DM.
     * @param User $user Utilisateur à vérifier
     * @return bool Vrai si participant, faux sinon
     */
    public function hasParticipant(User $user): bool
    {
        return $this->channel->isMember($user);
    }

    /**
     * Obtenir tous les participants du DM.
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllParticipants()
    {
        return $this->participants()->get();
    }

    /**
     * Crée un DM entre deux utilisateurs.
     * @param User $user1 Premier utilisateur
     * @param User $user2 Deuxième utilisateur
     * @return self Instance du DM créé ou existant
     */
    public static function createBetweenUsers(User $user1, User $user2): self
    {
        $existingDM = self::findBetweenUsers($user1, $user2);
        if ($existingDM) {
            return $existingDM;
        }

        // Crée le channel privé
        $channel = Channel::create([
            'name' => "DM-{$user1->id}-{$user2->id}",
            'type' => Channel::TYPE_DM,
            'description' => "Message direct entre {$user1->name} et {$user2->name}",
            'created_by' => $user1->id,
        ]);

        $channel->addMember($user1);
        $channel->addMember($user2);

        $dm = self::create([
            'channel_id' => $channel->id,
        ]);

        return $dm->load('channel.members');
    }

    /**
     * Trouve un DM existant entre deux utilisateurs.
     * @param User $user1 Premier utilisateur
     * @param User $user2 Deuxième utilisateur
     * @return self|null Instance du DM ou null si non trouvé
     */
    public static function findBetweenUsers(User $user1, User $user2): ?self
    {
        return self::whereHas('channel.members', function ($query) use ($user1) {
            $query->where('user_id', $user1->id);
        })
            ->whereHas('channel.members', function ($query) use ($user2) {
                $query->where('user_id', $user2->id);
            })
            ->whereHas('channel', function ($query) {
                $query->whereRaw(
                    '
                (SELECT COUNT(*) FROM user_channels WHERE user_channels.channel_id = channels.id) = 2
            ',
                );
            })
            ->first();
    }

    /**
     * Scope pour récupérer les DMs avec un utilisateur spécifique.
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param User $user Utilisateur concerné
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithUser($query, User $user)
    {
        return $query->whereHas('channel.members', function ($subQuery) use ($user) {
            $subQuery->where('user_id', $user->id);
        });
    }
}
