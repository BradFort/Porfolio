<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les codes MFA (authentification à deux facteurs).
 * Permet de gérer la génération, la validation et l'expiration des codes MFA pour chaque utilisateur.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class MFACode
 * Modèle représentant un code MFA pour l'authentification à deux facteurs.
 *
 * @property int $id Identifiant du code MFA
 * @property int $user_id Identifiant de l'utilisateur
 * @property string $code Code MFA
 * @property \Carbon\Carbon $expires_at Date d'expiration
 * @property bool $used Indique si le code a été utilisé
 * @property string|null $ip_address Adresse IP liée à la demande
 */
class MFACode extends Model
{
    use HasFactory;

    protected $table = 'mfa_codes';

    protected $fillable = [
        'user_id',
        'code',
        'expires_at',
        'used',
        'ip_address',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used' => 'boolean',
    ];

    /**
     * Relation avec l'utilisateur lié au code MFA.
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Vérifie si le code MFA est valide (non utilisé et non expiré).
     * @return bool Vrai si valide, faux sinon
     */
    public function isValid(): bool
    {
        return !$this->used && $this->expires_at->isFuture();
    }

    /**
     * Marque le code MFA comme utilisé.
     * @return void
     */
    public function markAsUsed(): void
    {
        $this->update(['used' => true]);
    }

    /**
     * Scope pour récupérer les codes MFA valides.
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeValid($query)
    {
        return $query->where('used', false)
            ->where('expires_at', '>', now());
    }
}
