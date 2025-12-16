<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property string $adversaire nom de l'adversaire
 * @property array $bateaux liste des bateaux
 * @property int $user_id id de l'utilisateur
 */
class Partie extends Model
{
    use HasFactory;

    protected $fillable = ['adversaire', 'bateaux', 'user_id'];

    protected $casts = [
        'bateaux' => 'array', // Assure-toi que 'bateaux' est bien un tableau
    ];

    public function missiles() : HasMany
    {
        return $this->hasMany(Missile::class);
    }

    public function user() : BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

}
