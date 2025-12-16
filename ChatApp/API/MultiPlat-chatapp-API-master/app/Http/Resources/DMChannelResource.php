<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Ressource pour un salon de message direct (DM).
 */

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DMChannelResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUser = $request->user();

        $otherParticipant = null;
        if ($this->channel && $this->channel->members) {
            $otherParticipant = $this->channel->members
                ->where('id', '!=', $currentUser->id)
                ->first();
        }

        $displayName = $otherParticipant ? $otherParticipant->name : 'Utilisateur inconnu';

        return [
            'id' => $this->id,
            'channel_id' => $this->channel_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Informations du channel associé
            'channel' => $this->whenLoaded('channel', function () use ($displayName) {
                return [
                    'id' => $this->channel->id,
                    'name' => $displayName,
                    'type' => $this->channel->type,
                    'description' => $this->channel->description,
                    'created_at' => $this->channel->created_at,
                    'updated_at' => $this->channel->updated_at,
                    'members' => $this->channel->members,
                ];
            }),

            // L'autre participant (pour l'affichage côté client)
            'other_participant' => $this->when(
                $otherParticipant,
                function () use ($otherParticipant) {
                    return [
                        'id' => $otherParticipant->id,
                        'name' => $otherParticipant->name,
                        'email' => $otherParticipant->email,
                    ];
                }
            ),

            // Tous les participants
            'participants' => $this->whenLoaded('channel', function () {
                return $this->channel->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                    ];
                });
            }),

            // Nombre de participants (devrait toujours être 2)
            'participants_count' => $this->whenLoaded('channel', function () {
                return $this->channel->members->count();
            }),

            // Nom d'affichage pour le DM (nom de l'autre participant)
            'display_name' => $displayName,
        ];
    }
}
