<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Requête de validation pour la modification d'un salon.
 */

namespace App\Http\Requests;

use App\Models\Channel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChannelRequest extends FormRequest
{
    /**
     * Determiner si l'utilisateur est autorisé à faire cette requête.
     */
    public function authorize(): bool
    {
        $channel = $this->route('channel');
        $user = auth()->user();

        // L'utilisateur doit être le créateur du channel ou admin
        return $user && ($channel->created_by === $user->id || $user->isAdmin());
    }

    /**
     * Règles de validation pour la mise à jour d'un channel
     */
    public function rules(): array
    {
        $channelId = $this->route('channel')->id;

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'min:3',
                'max:255',
                'unique:channels,name,' . $channelId,
                'regex:/^[a-zA-Z0-9\s\-_]+$/'
            ],
            'type' => [
                'sometimes',
                'required',
                Rule::in([Channel::TYPE_PUBLIC, Channel::TYPE_PRIVATE])
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:500'
            ]
        ];
    }

    /**
     * Messages d'erreur personnalisés
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du salon est requis.',
            'name.min' => 'Le nom du salon doit contenir au moins 3 caractères.',
            'name.max' => 'Le nom du salon ne peut pas dépasser 255 caractères.',
            'name.unique' => 'Un salon avec ce nom existe déjà.',
            'name.regex' => 'Le nom du salon ne peut contenir que des lettres, chiffres, espaces, tirets et underscores.',
            'type.required' => 'Le type de salon est requis.',
            'type.in' => 'Le type de salon doit être "public" ou "private".',
            'description.max' => 'La description ne peut pas dépasser 500 caractères.',
        ];
    }
}
