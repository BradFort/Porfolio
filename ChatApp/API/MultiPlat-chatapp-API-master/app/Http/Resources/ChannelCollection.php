<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Ressource pour la collection de salons (channels).
 */

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChannelCollection extends \Illuminate\Http\Resources\Json\ResourceCollection
{
    /**
     * Transforme en tableau la collection de channels
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total' => $this->collection->count(),
                'public_count' => $this->collection->where('type', 'public')->count(),
                'private_count' => $this->collection->where('type', 'private')->count(),
            ],
        ];
    }
}
