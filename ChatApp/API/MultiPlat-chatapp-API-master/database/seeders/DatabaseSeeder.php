<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Seeder principal pour remplir la base de données avec les données de test.
 */

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            NotifTypeSeeder::class,
            UserSeeder::class,
            ChannelSeeder::class,
            MessageSeeder::class,
            DMChannelSeeder::class,
            InvitationSeeder::class,
        ]);
    }
}
