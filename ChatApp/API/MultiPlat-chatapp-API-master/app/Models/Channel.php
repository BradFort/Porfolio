<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les channels (salons de discussion).
 * Permet de gérer les salons publics, privés et DM, ainsi que leurs membres.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Class Channel
 * Modèle représentant un salon de discussion.
 *
 * @property int $id Identifiant du salon
 * @property string $name Nom du salon
 * @property string $type Type du salon (public, privé, dm)
 * @property string $description Description du salon
 * @property int $created_by Identifiant du créateur
 */
class Channel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'description',
        'created_by'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Les types de channels autorisés
     * @var string
     */
    const TYPE_PUBLIC = 'public';
    const TYPE_PRIVATE = 'private';
    const TYPE_DM = 'dm';

    /**
     * Relation avec l'utilisateur créateur du salon.
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation avec l'utilisateur qui a activé le chiffrement E2EE.
     * @return BelongsTo
     */
    public function e2eeEnabledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'e2ee_enabled_by');
    }

    /**
     * Relation many-to-many avec les membres du salon.
     * @return BelongsToMany
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_channels')
                    ->withTimestamps();
    }

    /**
     * Scope pour récupérer uniquement les salons publics.
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePublic($query)
    {
        return $query->where('type', self::TYPE_PUBLIC);
    }

    /**
     * Scope pour récupérer uniquement les salons privés.
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePrivate($query)
    {
        return $query->where('type', self::TYPE_PRIVATE, self::TYPE_DM);
    }

    /**
     * Vérifie si un utilisateur est membre du salon.
     * @param User $user Utilisateur à vérifier
     * @return bool Vrai si membre, faux sinon
     */
    public function isMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Retourne le nombre de membres du salon.
     * @return int Nombre de membres
     */
    public function getMemberCountAttribute(): int
    {
        return $this->members()->count();
    }

    /**
     * Ajoute un utilisateur au salon.
     * @param User $user Utilisateur à ajouter
     * @return bool Vrai si ajouté, faux si déjà membre
     */
    public function addMember(User $user): bool
    {
        if ($this->isMember($user)) {
            return false; // Déjà membre
        }

        $this->members()->attach($user->id);
        return true;
    }

    /**
     * Retire un utilisateur du salon.
     * @param User $user Utilisateur à retirer
     * @return bool Vrai si retiré, faux si non membre
     */
    public function removeMember(User $user): bool
    {
        if (!$this->isMember($user)) {
            return false; // Pas membre
        }

        $this->members()->detach($user->id);
        return true;
    }

    /**
     * Relation avec l'utilisateur (utilisé pour certains contextes).
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

}
