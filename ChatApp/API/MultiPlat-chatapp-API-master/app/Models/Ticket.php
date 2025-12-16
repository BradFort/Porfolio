<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les tickets de support.
 * Permet de gérer les demandes d'assistance, leur statut, priorité et commentaires associés.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Ticket
 * Modèle représentant un ticket de support.
 *
 * @property int $id Identifiant du ticket
 * @property string $title Titre du ticket
 * @property string $description Description du ticket
 * @property string $status Statut du ticket
 * @property string $priority Priorité du ticket
 * @property int $user_id Identifiant de l'utilisateur créateur
 * @property int|null $assigned_to Identifiant de l'utilisateur assigné
 */
class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'user_id',
        'assigned_to',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur créateur du ticket.
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec l'utilisateur assigné au ticket.
     * @return BelongsTo
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Relation avec les commentaires du ticket.
     * @return HasMany
     */
    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }
}
