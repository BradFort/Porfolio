<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Requête de validation pour l'envoi d'une invitation à un salon.
 */

namespace App\Http\Requests;

use App\Models\Channel;
use App\Models\Invitation;
use Illuminate\Foundation\Http\FormRequest;

class SendInvitationRequest extends FormRequest
{
    /**
     * Déterminer si l'utilisateur est autorisé à faire cette requête
     */
    public function authorize(): bool
    {
        $channel = $this->route('channel');
        $user = auth()->user();

        // L'utilisateur doit être membre du channel pour inviter
        return $user && $channel->isMember($user);
    }

    /**
     * Règles de validation
     */
    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    // Vérifier que l'inviteur n'est pas le même que l'invité
                    if ($value == auth()->id()) {
                        $fail('Vous ne pouvez pas vous inviter vous-même.');
                    }

                    $channel = $this->route('channel');
                    $userToInvite = \App\Models\User::find($value);

                    // Vérifier que l'utilisateur n'est pas déjà membre
                    if ($userToInvite && $channel->isMember($userToInvite)) {
                        $fail('Cet utilisateur est déjà membre du salon.');
                    }

                    // Vérifier qu'il n'y a pas déjà une invitation en attente
                    $existingInvitation = Invitation::where('channel_id', $channel->id)
                        ->where('invited_user_id', $value)
                        ->where('status', Invitation::STATUS_PENDING)
                        ->where(function ($query) {
                            $query->whereNull('expires_at')
                                ->orWhere('expires_at', '>', now());
                        })
                        ->exists();

                    if ($existingInvitation) {
                        $fail('Une invitation est déjà en attente pour cet utilisateur.');
                    }
                }
            ],
            'message' => 'nullable|string|max:500'
        ];
    }

    /**
     * Messages d'erreur personnalisés
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'L\'ID de l\'utilisateur à inviter est requis.',
            'user_id.exists' => 'L\'utilisateur spécifié n\'existe pas.',
            'message.max' => 'Le message ne peut pas dépasser 500 caractères.'
        ];
    }
}
