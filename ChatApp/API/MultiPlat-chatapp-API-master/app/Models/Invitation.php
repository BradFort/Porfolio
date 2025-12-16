<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les invitations à rejoindre un channel.
 * Permet de gérer l'envoi, l'acceptation, le refus et l'expiration des invitations.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * Class Invitation
 * Modèle représentant une invitation à rejoindre un channel.
 *
 * @property int $id Identifiant de l'invitation
 * @property int $channel_id Identifiant du channel
 * @property int $inviter_id Identifiant de l'inviteur
 * @property int $invited_user_id Identifiant de l'utilisateur invité
 * @property string $status Statut de l'invitation
 * @property string $message Message d'invitation
 * @property \Carbon\Carbon $expires_at Date d'expiration
 */
class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'channel_id',
        'inviter_id',
        'invited_user_id',
        'status',
        'message',
        'expires_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Statuts d'invitation
     * @var string
     */
    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_REJECTED = 'rejected';
    const STATUS_EXPIRED = 'expired';

    /**
     * Durée d'expiration par défaut (en heures).
     * @var int
     */
    const EXPIRATION_HOURS = 24;

    /**
     * Boot du modèle : définit la date d'expiration automatiquement.
     * @return void
     */
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($invitation) {
            if (!$invitation->expires_at) {
                $invitation->expires_at = Carbon::now()->addHours(self::EXPIRATION_HOURS);
            }
        });
    }

    /**
     * Relation avec le channel.
     * @return BelongsTo
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Relation avec l'inviteur.
     * @return BelongsTo
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    /**
     * Relation avec l'utilisateur invité.
     * @return BelongsTo
     */
    public function invitedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_user_id');
    }

    /**
     * Scope pour récupérer les invitations en attente.
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', Carbon::now());
            });
    }

    /**
     * Scope pour récupérer les invitations d'un utilisateur donné.
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param User $user Utilisateur concerné
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where('invited_user_id', $user->id);
    }

    /**
     * Scope pour récupérer les invitations expirées.
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeExpired($query)
    {
        return $query->where('status', self::STATUS_PENDING)
            ->where('expires_at', '<=', Carbon::now());
    }

    /**
     * Vérifie si l'invitation est expirée.
     * @return bool Vrai si expirée, faux sinon
     */
    public function isExpired(): bool
    {
        return $this->status === self::STATUS_PENDING
            && $this->expires_at
            && $this->expires_at->isPast();
    }

    /**
     * Vérifie si l'invitation est en attente.
     * @return bool Vrai si en attente, faux sinon
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING && !$this->isExpired();
    }

    /**
     * Accepte l'invitation et ajoute l'utilisateur au channel.
     * @return bool Vrai si accepté, faux sinon
     */
    public function accept(): bool
    {
        if (!$this->isPending()) {
            return false;
        }
        $this->status = self::STATUS_ACCEPTED;
        $this->save();
        $this->channel->addMember($this->invitedUser);
        return true;
    }

    /**
     * Refuse l'invitation.
     * @return bool Vrai si refusé, faux sinon
     */
    public function reject(): bool
    {
        if (!$this->isPending()) {
            return false;
        }
        $this->status = self::STATUS_REJECTED;
        $this->save();
        return true;
    }

    /**
     * Marque l'invitation comme expirée.
     * @return bool Vrai si expirée, faux sinon
     */
    public function markAsExpired(): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }
        $this->status = self::STATUS_EXPIRED;
        $this->save();
        return true;
    }

    /**
     * Récupère les invitations en attente pour un utilisateur donné.
     * @param User $user Utilisateur concerné
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getPendingForUser(User $user)
    {
        return self::pending()
            ->forUser($user)
            ->with(['channel', 'inviter'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
