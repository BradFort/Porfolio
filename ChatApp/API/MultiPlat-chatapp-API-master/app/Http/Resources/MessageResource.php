<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Ressource pour un message d'un salon.
 */

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MessageResource extends JsonResource
{
    /**
     * Transforme en array pour un message
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type ?? 'text',
            'content' => $this->content,
            'file_url' => $this->getFileUrl(),
            'duration' => $this->duration,
            'file_name' => $this->file_name,
            'file_size' => $this->file_size,
            'mime_type' => $this->mime_type,
            'created_at' => $this->created_at,
            'formatted_time' => $this->created_at->format('H:i'),
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'channel_id' => $this->channel_id,
        ];
    }

    /**
     * Générer l'URL du fichier selon le disque utilisé
     */
    private function getFileUrl(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        // Si on utilise Spaces, générer l'URL via le CDN
        if (config('filesystems.default') === 'spaces') {
            return Storage::disk('spaces')->url($this->file_path);
        }

        // Sinon, utiliser l'URL locale
        return asset('storage/' . $this->file_path);
    }
}
