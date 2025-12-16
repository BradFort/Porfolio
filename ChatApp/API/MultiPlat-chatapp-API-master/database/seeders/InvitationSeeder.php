<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Seeder pour remplir la base de données avec des invitations de test.
 */

namespace Database\Seeders;

use App\Models\Channel;
use App\Models\Invitation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class InvitationSeeder extends Seeder
{
    /**
     * Exécute le seeder de la base de données.
     */
    public function run(): void
    {
        $this->command->info('Création des invitations de test...');

        // Récupérer les utilisateurs existants
        $users = User::all()->keyBy('name');

        $systemUser = $users->get('System');
        $alice = $users->get('Alice Dupont');
        $bob = $users->get('Bob Martin');
        $charlie = $users->get('Charlie Durand');
        $diana = $users->get('Diana Lopez');

        // Récupérer les channels existants
        $channels = Channel::all()->keyBy('name');

        $generalChannel = $channels->get('Général');
        $randomChannel = $channels->get('Random');
        $secretChannel = $channels->get('Secret');

        if (!$systemUser || !$generalChannel || !$secretChannel) {
            $this->command->warn('Les utilisateurs ou channels nécessaires n\'existent pas.');
            return;
        }

        // Invitations pour le channel Général
        if ($alice && !$generalChannel->isMember($alice)) {
            Invitation::create([
                'channel_id' => $generalChannel->id,
                'inviter_id' => $systemUser->id,
                'invited_user_id' => $alice->id,
                'message' => 'Bienvenue sur le channel Général !',
                'status' => Invitation::STATUS_PENDING,
            ]);
            $this->command->info('✓ Invitation créée: System → Alice (Général)');
        }

        if ($bob && !$generalChannel->isMember($bob)) {
            Invitation::create([
                'channel_id' => $generalChannel->id,
                'inviter_id' => $systemUser->id,
                'invited_user_id' => $bob->id,
                'message' => 'Bienvenue sur le channel Général !',
                'status' => Invitation::STATUS_PENDING,
            ]);
            $this->command->info('✓ Invitation créée: System → Bob (Général)');
        }

        // Invitations pour le channel Secret
        if ($alice && !$secretChannel->isMember($alice)) {
            $secretChannel->addMember($alice);
        }

        if ($charlie && !$secretChannel->isMember($charlie)) {
            Invitation::create([
                'channel_id' => $secretChannel->id,
                'inviter_id' => $alice->id,
                'invited_user_id' => $charlie->id,
                'message' => 'Viens découvrir notre salon secret !',
                'status' => Invitation::STATUS_PENDING,
            ]);
            $this->command->info('✓ Invitation créée: Alice → Charlie (Secret)');
        }

        if ($diana && !$secretChannel->isMember($diana)) {
            Invitation::create([
                'channel_id' => $secretChannel->id,
                'inviter_id' => $bob->id,
                'invited_user_id' => $diana->id,
                'message' => 'Invitation pour rejoindre le Secret',
                'status' => Invitation::STATUS_PENDING,
            ]);
            $this->command->info('✓ Invitation créée: Bob → Diana (Secret)');
        }

        // Exemple d'invitation expirée
        if ($diana) {
            Invitation::create([
                'channel_id' => $secretChannel->id,
                'inviter_id' => $systemUser->id,
                'invited_user_id' => $diana->id,
                'message' => 'Cette invitation était expirée (test)',
                'status' => Invitation::STATUS_EXPIRED,
                'expires_at' => Carbon::now()->subDays(2),
                'created_at' => Carbon::now()->subDays(3),
                'updated_at' => Carbon::now()->subHours(1),
            ]);
            $this->command->info('✓ Invitation expirée créée (pour test)');
        }

        // Exemple d'invitation acceptée
        if ($alice && $generalChannel->isMember($alice)) {
            Invitation::create([
                'channel_id' => $generalChannel->id,
                'inviter_id' => $systemUser->id,
                'invited_user_id' => $alice->id,
                'message' => 'Bienvenue dans le channel !',
                'status' => Invitation::STATUS_ACCEPTED,
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(4),
            ]);
            $this->command->info('✓ Invitation acceptée créée (historique)');
        }

        $pendingCount = Invitation::where('status', Invitation::STATUS_PENDING)->count();
        $this->command->info("Seeder terminé ! {$pendingCount} invitation(s) en attente créée(s)");
    }
}
