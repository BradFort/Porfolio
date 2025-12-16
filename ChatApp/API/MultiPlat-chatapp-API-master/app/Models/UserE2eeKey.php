<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les clés publiques RSA des utilisateurs (E2EE).
 * Permet de gérer les clés publiques pour le chiffrement de bout en bout.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class UserE2eeKey
 * Modèle représentant la clé publique RSA d'un utilisateur pour E2EE.
 *
 * @property int $id Identifiant de la clé
 * @property int $user_id Identifiant de l'utilisateur
 * @property string $public_key Clé publique RSA
 */
class UserE2eeKey extends Model
{
    use HasFactory;

    protected $table = 'user_e2ee_keys';

    protected $fillable = [
        'user_id',
        'public_key',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur propriétaire de la clé.
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
