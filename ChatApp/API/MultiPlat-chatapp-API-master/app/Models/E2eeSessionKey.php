<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les clés de session AES-256 chiffrées.
 * Permet de gérer les clés de session chiffrées pour chaque utilisateur dans un channel.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class E2eeSessionKey
 * Modèle représentant une clé de session chiffrée pour le chiffrement de bout en bout (E2EE).
 *
 * @property int $id Identifiant de la clé
 * @property int $channel_id Identifiant du channel
 * @property int $user_id Identifiant de l'utilisateur
 * @property string $encrypted_session_key Clé de session chiffrée
 */
class E2eeSessionKey extends Model
{
    use HasFactory;

    protected $table = 'e2ee_session_keys';

    protected $fillable = [
        'channel_id',
        'user_id',
        'encrypted_session_key',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec le channel.
     * @return BelongsTo
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Relation avec l'utilisateur.
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
