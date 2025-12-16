<?php

namespace App\Policies;

use App\Models\Partie;
use App\Models\User;

class PartiePolicy
{
    /**
     * Vérifie si l'utilisateur est propriétaire de la partie.
     */
    public function owns(User $user, Partie $partie): bool
    {
        return $user->id === $partie->user_id;
    }
}
