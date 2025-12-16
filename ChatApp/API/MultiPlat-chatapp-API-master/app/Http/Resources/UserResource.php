<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Ressource pour un utilisateur.
 */

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transforme en array pour un utilisateur
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $canSeePrivate = $request->user() && ($request->user()->id === $this->id || $request->user()->isAdmin());

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->when($canSeePrivate, $this->email),
            'role' => $this->when($canSeePrivate, $this->role),
            'status' => $this->when($canSeePrivate, $this->status),
            'theme' => $this->when($canSeePrivate, $this->theme),
            'lang' => $this->when($canSeePrivate, $this->lang),
            'mfa_enabled' => $this->when($canSeePrivate, $this->mfa_enabled),
            'disabled_notifs' => $this->when(
                $canSeePrivate,
                $this->whenLoaded('disabledNotificationTypes',
                    fn() => $this->disabledNotificationTypes->pluck('id')->values(), collect())
            ),
            'joined_at' => $this->when(
                isset($this->pivot) && isset($this->pivot->joined_at),
                optional($this->pivot)->joined_at
            ),
        ];
    }
}
