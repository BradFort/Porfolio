<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Fabrique pour générer des salons (channels) pour les tests et la base de données.
 */

namespace Database\Factories;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Channel>
 */
class ChannelFactory extends Factory
{
    protected $model = Channel::class;

    /**
     * Définir l'état par défaut du modèle.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->words(2, true),
            'type' => $this->faker->randomElement([Channel::TYPE_PUBLIC, Channel::TYPE_PRIVATE]),
            'description' => $this->faker->sentence(),
            'created_by' => User::factory(),
        ];
    }

    /**
     * Channel public
     */
    public function public(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => Channel::TYPE_PUBLIC,
        ]);
    }

    /**
     * Channel privé
     */
    public function private(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => Channel::TYPE_PRIVATE,
        ]);
    }

    /**
     * Channel avec un créateur spécifique
     */
    public function createdBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'created_by' => $user->id,
        ]);
    }

    /**
     * Channel avec des utilisateurs spécifiques
     */
    public function withMembers(array $users): static
    {
        return $this->afterCreating(function (Channel $channel) use ($users) {
            foreach ($users as $user) {
                if (!$channel->isMember($user)) {
                    $channel->addMember($user);
                }
            }
        });
    }

    /**
     * Channel avec des utilisateurs existants aléatoires
     */
    public function withRandomExistingMembers(int $count = 3): static
    {
        return $this->afterCreating(function (Channel $channel) use ($count) {
            $existingUsers = User::inRandomOrder()->limit($count)->get();
            foreach ($existingUsers as $user) {
                if (!$channel->isMember($user)) {
                    $channel->addMember($user);
                }
            }
        });
    }

    /**
     * Channel système
     */
    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'created_by' => User::where('email', 'system@chatapp.local')->first()?->id
                ?? User::factory()->create(['email' => 'system@chatapp.local', 'role' => User::ROLE_ADMIN])->id,
        ]);
    }
}
