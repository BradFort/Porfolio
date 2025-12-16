<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour le type de notification.
 * Permet de gérer les différents types de notifications dans l'application.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class NotificationType
 * Modèle représentant un type de notification.
 *
 * @property int $id Identifiant du type de notification
 * @property string $type Nom du type de notification
 */
class NotificationType extends Model
{
    use HasFactory;

    /**
     * Nom de la table associée au modèle (non standard).
     * @var string
     */
    protected $table = 'notificationType';

    /**
     * Les attributs pouvant être assignés en masse.
     * @var array
     */
    protected $fillable = [
        'type',
    ];
}
