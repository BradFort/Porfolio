<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Ressource pour la collection de types de notifications.
 */

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class NotificationTypeCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection->map(function ($notificationType) {
                return [
                    'id' => $notificationType->id,
                    'type_fr' => $notificationType->type_fr,
                    'type_en' => $notificationType->type_en,
                ];
            }),
        ];
    }
}
