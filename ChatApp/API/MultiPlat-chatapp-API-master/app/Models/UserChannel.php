<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour la table pivot user_channels.
 * Permet de gérer l'association entre utilisateurs et channels, ainsi que le rôle et la date d'entrée.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class UserChannel
 * Modèle représentant l'association entre un utilisateur et un channel.
 *
 * @property int $id Identifiant de la relation
 * @property int $user_id Identifiant de l'utilisateur
 * @property int $channel_id Identifiant du channel
 * @property string $role Rôle de l'utilisateur dans le channel
 * @property \Carbon\Carbon $joined_at Date d'entrée dans le channel
 */
class UserChannel extends Model
{
    protected $fillable = [
        'user_id', 'channel_id', 'role', 'joined_at'
    ];

    /**
     * Relation avec l'utilisateur associé à la relation.
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
