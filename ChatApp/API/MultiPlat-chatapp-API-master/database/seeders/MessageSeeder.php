<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Seeder pour remplir la base de données avec des messages de test.
 */

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;

class MessageSeeder extends Seeder
{
    /**
     * Exécute le seeder.
     *
     * @return void
     */
    public function run(): void
    {
        $channels = Channel::with('members')->get();

        foreach ($channels as $channel) {
            $this->createMessagesForChannel($channel);
        }

        $this->command->info('Messages créés : ' . Message::count());

        // Add a message to each DM between test user and other users, sent by the other user
        $testUser = User::where('email', 'test@test.ca')->first();
        if ($testUser) {
            $dmChannels = \App\Models\DMChannel::whereHas('channel.members', function($q) use ($testUser) {
                $q->where('user_id', $testUser->id);
            })->get();
            foreach ($dmChannels as $dm) {
                // Find the other user in the DM using channel members
                $otherUser = $dm->channel->members->where('id', '!=', $testUser->id)->first();
                if ($otherUser) {
                    \App\Models\Message::factory()
                        ->fromUser($otherUser)
                        ->inChannel($dm->channel)
                        ->create([
                            'content' => "Hello from {$otherUser->name}!",
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                }
            }
        }
    }

    /**
     * Crée des messages pour un canal donné.
     *
     * @param  \App\Models\Channel  $channel
     * @return void
     */
    private function createMessagesForChannel(Channel $channel): void
    {
        $members = $channel->members;

        if ($members->isEmpty()) {
            return;
        }

        $messageCount = match ($channel->name) {
            'Général' => 20,
            'Random' => 15,
            default => 10,
        };

        for ($i = 0; $i < $messageCount; $i++) {
            $randomUser = $members->random();

            Message::factory()
                ->fromUser($randomUser)
                ->inChannel($channel)
                ->create([
                    'content' => $this->getRandomContent($channel->name),
                    'created_at' => now()->subHours(rand(1, 48)),
                ]);
        }
    }

    /**
     * Récupère un contenu de message aléatoire en fonction du nom du canal.
     *
     * @param  string  $channelName
     * @return string
     */
    private function getRandomContent(string $channelName): string
    {
        $messages = [
            'Salut tout le monde !',
            'Comment ça va ?',
            'Belle journée aujourd\'hui',
            'J\'aime manger des roches',
            'Mauvaise idée gros',
            'Bonne idée',
            'T\'es plus sexy que le pape',
            'nice',
        ];

        return $messages[array_rand($messages)];
    }
}
