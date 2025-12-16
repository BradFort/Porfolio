<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Seeder pour remplir la base de données avec des salons (channels) de test.
 */

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Database\Seeder;

class ChannelSeeder extends Seeder
{
    /**
     * Remplit la base de données avec des salons de test et des utilisateurs.
     *
     * @return void
     */
    public function run(): void
    {
        $systemUser = User::first();
        $allUsers = User::all();

        $generalChannel = Channel::factory()
            ->public()
            ->createdBy($systemUser)
            ->create([
                'name' => 'Général',
                'description' => 'Salon général pour tous'
            ]);

        $randomChannel = Channel::factory()
            ->public()
            ->createdBy($systemUser)
            ->create([
                'name' => 'Random',
                'description' => 'Discussions diverses'
            ]);

        $secretChannel = Channel::factory()
            ->private()
            ->createdBy($systemUser)
            ->create([
                'name' => 'Secret',
                'description' => 'Salon privé pour les utilisateurs invités'
            ]);

        // Ajouter l'utilisateur système à tous les channels
        $generalChannel->addMember($systemUser);
        $randomChannel->addMember($systemUser);
        $secretChannel->addMember($systemUser);

        // Ajouter TOUS les utilisateurs au channel "Général"
        foreach ($allUsers as $user) {
            if (!$generalChannel->isMember($user)) {
                $generalChannel->addMember($user);
            }
        }

        // Ajouter des utilisateurs spécifiques au channel "Random"
        $randomMembers = $allUsers->take(3);
        foreach ($randomMembers as $user) {
            if (!$randomChannel->isMember($user)) {
                $randomChannel->addMember($user);
            }
        }

        // Ajouter seulement Alice et Bob au channel "Secret" (privé)
        $secretMembers = $allUsers->whereIn('email', ['alice@chatapp.local', 'bob@chatapp.local']);
        foreach ($secretMembers as $user) {
            if (!$secretChannel->isMember($user)) {
                $secretChannel->addMember($user);
            }
        }

        // Créer des channels de test avec des membres spécifiques
        if (app()->environment('local')) {
            // Channel "Développeurs" - seulement les modérateurs et admins
            $devChannel = Channel::factory()
                ->private()
                ->createdBy($systemUser)
                ->create([
                    'name' => 'Développeurs',
                    'description' => 'Channel privé pour l\'équipe de développement'
                ]);

            $devChannel->addMember($systemUser);
            // Ajouter Bob (modérateur)
            $bob = User::where('email', 'bob@chatapp.local')->first();
            if ($bob) {
                $devChannel->addMember($bob);
            }

            // Channel "Gaming" - pour les utilisateurs actifs
            $gamingChannel = Channel::factory()
                ->public()
                ->createdBy($systemUser)
                ->create([
                    'name' => 'Gaming',
                    'description' => 'Discussions sur les jeux vidéo'
                ]);

            $gamingChannel->addMember($systemUser);
            // Ajouter Alice et Charlie
            $gamers = $allUsers->whereIn('email', ['alice@chatapp.local', 'charlie@chatapp.local']);
            foreach ($gamers as $gamer) {
                $gamingChannel->addMember($gamer);
            }

            // Channel "Équipe" - tous les utilisateurs de test
            $teamChannel = Channel::factory()
                ->public()
                ->createdBy($systemUser)
                ->create([
                    'name' => 'Équipe',
                    'description' => 'Channel pour toute l\'équipe'
                ]);

            $teamChannel->addMember($systemUser);

            $createdTestUsers = User::whereIn('email', [
                'alice@chatapp.local',
                'bob@chatapp.local',
                'charlie@chatapp.local',
                'diana@chatapp.local'
            ])->get();

            foreach ($createdTestUsers as $user) {
                $teamChannel->addMember($user);
            }
        }

        $this->command->info('Channels et utilisateurs de test créés avec succès !');
        $this->command->info('Utilisateurs créés : ' . $allUsers->count());
        $this->command->info('Channels créés : ' . Channel::count());
    }
}
