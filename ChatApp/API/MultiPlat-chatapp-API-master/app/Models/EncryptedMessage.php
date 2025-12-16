<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les messages chiffrés E2EE (AES-256-GCM).
 * Permet de gérer les messages chiffrés dans un channel.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class EncryptedMessage
 * Modèle représentant un message chiffré pour le chiffrement de bout en bout (E2EE).
 *
 * @property int $id Identifiant du message
 * @property int $channel_id Identifiant du channel
 * @property int $sender_id Identifiant de l'expéditeur
 * @property string $encrypted_content Contenu chiffré
 * @property string $content_iv IV du chiffrement
 * @property string $content_auth_tag Tag d'authentification
 */
class EncryptedMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'channel_id',
        'sender_id',
        'encrypted_content',
        'content_iv',
        'content_auth_tag',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec l'expéditeur du message.
     * @return BelongsTo
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Relation avec le channel du message.
     * @return BelongsTo
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Scope pour récupérer les messages d'un channel donné.
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $channelId Identifiant du channel
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForChannel($query, $channelId)
    {
        return $query->where('channel_id', $channelId)->orderBy('created_at', 'asc');
    }
}
