<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Seeder pour remplir la base de données avec des salons de messages directs (DM) de test.
 */

namespace Database\Seeders;

use App\Models\DMChannel;
use App\Models\User;
use App\Models\Message;
use Illuminate\Database\Seeder;

class DMChannelSeeder extends Seeder
{
    /**
     * Exécute le seeder.
     */
    public function run(): void
    {
        $users = User::where('email', '!=', 'system@chatapp.local')->get();

        if ($users->count() < 2) {
            $this->command->warn('Il faut au moins 2 utilisateurs pour créer des DMs');
            return;
        }

        $this->createSpecificDMs($users);

        // Create DMs for test user with other users (excluding those already handled in specific pairs)
        $testUser = $users->where('email', 'test@test.ca')->first();
        if ($testUser) {
            $otherUsers = $users->where('email', '!=', 'test@test.ca')->where('email', '!=', 'test2@test.ca');
            $dmIndex = 0;
            foreach ($otherUsers as $otherUser) {
                $dm = DMChannel::createBetweenUsers($testUser, $otherUser);
                if ($dmIndex !== 0) {
                    $this->addTestMessages($dm, $testUser, $otherUser);
                }
                $this->command->info("DM créé entre {$testUser->name} et {$otherUser->name}" . ($dmIndex === 0 ? ' (sans messages)' : ''));
                $dmIndex++;
            }
        }

        $this->command->info('DM Channels créés : ' . DMChannel::count());
    }

    /**
     * Créer des DMs spécifiques entre des paires d'utilisateurs
     */
    private function createSpecificDMs($users): void
    {
        $specificPairs = [
            ['alice@chatapp.local', 'bob@chatapp.local'],
            ['alice@chatapp.local', 'charlie@chatapp.local'],
            ['bob@chatapp.local', 'diana@chatapp.local'],
            ['test@test.ca', 'test2@test.ca'],
        ];

        foreach ($specificPairs as $pair) {
            $user1 = $users->where('email', $pair[0])->first();
            $user2 = $users->where('email', $pair[1])->first();

            if ($user1 && $user2) {
                $dm = DMChannel::createBetweenUsers($user1, $user2);

                $this->addTestMessages($dm, $user1, $user2);

                $this->command->info("DM créé entre {$user1->name} et {$user2->name}");
            }
        }
    }

    /**
     * Ajouter des messages de test à un DM
     */
    private function addTestMessages(DMChannel $dm, User $user1, User $user2): void
    {
        $conversations = [
            [
                'user' => $user1,
                'content' => 'Yo mon homme',
                'time_offset' => 120
            ],
            [
                'user' => $user2,
                'content' => 'Jsuis pas un homme',
                'time_offset' => 115
            ],
            [
                'user' => $user1,
                'content' => 'Ok l\'opossum',
                'time_offset' => 110
            ],
            [
                'user' => $user2,
                'content' => 'Bro touch grass',
                'time_offset' => 105
            ],
            [
                'user' => $user1,
                'content' => 'Mdr t\'es qu\'un panda roux',
                'time_offset' => 30
            ],
            [
                'user' => $user2,
                'content' => 'Ark jsuis pas roux',
                'time_offset' => 25
            ]
        ];

        foreach ($conversations as $msg) {
            Message::factory()
                ->fromUser($msg['user'])
                ->inChannel($dm->channel)
                ->create([
                    'content' => $msg['content'],
                    'created_at' => now()->subMinutes($msg['time_offset']),
                    'updated_at' => now()->subMinutes($msg['time_offset'])
                ]);
        }

        $dm->touch();
    }
}
