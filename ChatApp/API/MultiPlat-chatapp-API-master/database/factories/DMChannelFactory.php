<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Fabrique pour générer des salons de messages directs (DM) pour les tests et la base de données.
 */

namespace Database\Factories;

use App\Models\Channel;
use App\Models\DMChannel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DMChannel>
 */
class DMChannelFactory extends Factory
{
    protected $model = DMChannel::class;

    /**
     * Définir l'état par défaut du modèle.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $channel = Channel::factory()->create([
            'name' => "DM-{$user1->id}-{$user2->id}",
            'type' => Channel::TYPE_DM,
            'description' => "Message direct entre {$user1->name} et {$user2->name}",
            'created_by' => $user1->id
        ]);

        $channel->addMember($user1);
        $channel->addMember($user2);

        return [
            'channel_id' => $channel->id,
        ];
    }

    /**
     * DM entre deux utilisateurs spécifiques
     */
    public function betweenUsers(User $user1, User $user2): static
    {
        return $this->state(function (array $attributes) use ($user1, $user2) {
            $channel = Channel::factory()->create([
                'name' => "DM-{$user1->id}-{$user2->id}",
                'type' => Channel::TYPE_DM,
                'description' => "Message direct entre {$user1->name} et {$user2->name}",
                'created_by' => $user1->id
            ]);

            $channel->addMember($user1);
            $channel->addMember($user2);

            return [
                'channel_id' => $channel->id,
            ];
        });
    }

    /**
     * DM avec utilisateurs existants aléatoires
     */
    public function withRandomUsers(): static
    {
        return $this->state(function (array $attributes) {
            $users = User::inRandomOrder()->limit(2)->get();

            if ($users->count() < 2) {
                $user1 = User::factory()->create();
                $user2 = User::factory()->create();
            } else {
                $user1 = $users->first();
                $user2 = $users->last();
            }

            $channel = Channel::factory()->create([
                'name' => "DM-{$user1->id}-{$user2->id}",
                'type' => Channel::TYPE_DM,
                'description' => "Message direct entre {$user1->name} et {$user2->name}",
                'created_by' => $user1->id
            ]);

            $channel->addMember($user1);
            $channel->addMember($user2);

            return [
                'channel_id' => $channel->id,
            ];
        });
    }

    /**
     * DM récent (créé récemment)
     */
    public function recent(): static
    {
        return $this->state(fn (array $attributes) => [
            'created_at' => now()->subHours(rand(1, 24)),
            'updated_at' => now()->subMinutes(rand(1, 60)),
        ]);
    }

    /**
     * DM ancien
     */
    public function old(): static
    {
        return $this->state(fn (array $attributes) => [
            'created_at' => now()->subDays(rand(30, 365)),
            'updated_at' => now()->subDays(rand(1, 30)),
        ]);
    }
}
