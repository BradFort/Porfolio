<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Seeder pour remplir la base de données avec des utilisateurs de test.
 */

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Exécute le remplissage de la base de données avec des utilisateurs.
     */
    public function run(): void
    {
        // Créer un utilisateur système s'il n'existe pas
        $systemUser = User::firstOrCreate(
            ['email' => 'system@chatapp.local'],
            [
                'name' => 'System',
                'password' => bcrypt('system-password'),
                'role' => User::ROLE_ADMIN,
                'status' => 'online',
                'theme' => 'light'
            ]
        );

        // Créer des utilisateurs de test spécifiques s'ils n'existent pas
        $testUsers = [
            [
                'name' => 'Alice Dupont',
                'email' => 'alice@chatapp.local',
                'role' => User::ROLE_USER,
                'status' => 'online',
                'theme' => 'light'
            ],
            [
                'name' => 'Bob Martin',
                'email' => 'bob@chatapp.local',
                'role' => User::ROLE_MODERATOR,
                'status' => 'away',
                'theme' => 'dark'
            ],
            [
                'name' => 'Charlie Durand',
                'email' => 'charlie@chatapp.local',
                'role' => User::ROLE_USER,
                'status' => 'offline',
                'theme' => 'light'
            ],
            [
                'name' => 'Diana Lopez',
                'email' => 'diana@chatapp.local',
                'role' => User::ROLE_USER,
                'status' => 'online',
                'theme' => 'dark'
            ],
            [
                'name' => 'Eve Tremblay',
                'email' => 'eve@chatapp.local',
                'role' => User::ROLE_USER,
                'status' => 'offline',
                'theme' => 'light',
                'password' => bcrypt('evepass')
            ],
            [
                'name' => 'Frank Gagnon',
                'email' => 'frank@chatapp.local',
                'role' => User::ROLE_MODERATOR,
                'status' => 'away',
                'theme' => 'dark',
                'password' => bcrypt('frankpass')
            ],
            [
                'name' => 'Grace Pelletier',
                'email' => 'grace@chatapp.local',
                'role' => User::ROLE_USER,
                'status' => 'online',
                'theme' => 'light',
                'password' => bcrypt('gracepass')
            ],
            [
                'name' => 'Henry Dubois',
                'email' => 'henry@chatapp.local',
                'role' => User::ROLE_USER,
                'status' => 'offline',
                'theme' => 'dark',
                'password' => bcrypt('henrypass')
            ],
            [
                'name' => 'test',
                'email' => 'test@test.ca',
                'role' => User::ROLE_USER,
                'status' => 'online',
                'theme' => 'dark',
                'lang' => 'en',
                'password' => bcrypt('test1234')
            ],
            [
                'name' => 'test2',
                'email' => 'test2@test.ca',
                'role' => User::ROLE_USER,
                'status' => 'online',
                'theme' => 'light',
                'password' => bcrypt('test1234')
            ],
            [
                'name' => 'test3needtob25charlongkkk',
                'email' => 'test3@test.ca',
                'role' => User::ROLE_USER,
                'status' => 'online',
                'theme' => 'light',
                'password' => bcrypt('test1234')
            ],
            [
                'name' => 'MFATest',
                'email' => 'zack.livernois@hotmail.ca',
                'role' => User::ROLE_USER,
                'status' => 'online',
                'theme' => 'light',
                'password' => bcrypt('test1234')
            ]
        ];

        $createdTestUsers = [];
        foreach ($testUsers as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'password' => $userData['password'] ?? bcrypt('password')
                ])
            );
            $createdTestUsers[] = $user;
        }
    }
}
