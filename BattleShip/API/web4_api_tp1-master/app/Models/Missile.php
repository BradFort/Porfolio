<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $coordonnee coordonnee du missile
 * @property int $partie_id id de la partie
 * @property string $resultat resultat du missile
 */
class Missile extends Model
{
    protected $fillable = ['coordonnee', 'partie_id', 'resultat'];
    public function parti() : BelongsTo
    {
        return $this->belongsTo(Partie::class);
    }
}
