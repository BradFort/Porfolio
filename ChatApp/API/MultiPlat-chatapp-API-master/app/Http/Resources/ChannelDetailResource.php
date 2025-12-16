<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Ressource pour les détails d'un salon (channel).
 */

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChannelDetailResource extends JsonResource
{
    /**
     * Transforme en array pour les détails complets d'un channel.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'description' => $this->description,
            'member_count' => $this->member_count,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->whenLoaded('creator', function () {
                return [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                ];
            }),
            'is_member' => $this->when(
                isset($this->is_member),
                $this->is_member ?? false
            ),
            'members' => UserResource::collection($this->whenLoaded('members')),
            'e2ee_enabled' => $this->e2ee_enabled ?? false,
            'e2ee_enabled_by' => $this->e2ee_enabled_by,
            'e2ee_enabled_by_name' => $this->whenLoaded('e2eeEnabledBy', function () {
                return $this->e2eeEnabledBy->name ?? null;
            }),
        ];
    }
}
