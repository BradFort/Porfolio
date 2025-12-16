<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Fabrique pour générer des messages pour les tests et la base de données.
 */

namespace Database\Factories;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    protected $model = Message::class;

    /**
     * Définir l'état par défaut du modèle.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'content' => $this->faker->sentence(),
            'channel_id' => Channel::factory(),
            'user_id' => User::factory(),
        ];
    }

    /**
     * Message avec un utilisateur spécifique
     */
    public function fromUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }

    /**
     * Message dans un channel spécifique
     */
    public function inChannel(Channel $channel): static
    {
        return $this->state(fn (array $attributes) => [
            'channel_id' => $channel->id,
        ]);
    }
}
