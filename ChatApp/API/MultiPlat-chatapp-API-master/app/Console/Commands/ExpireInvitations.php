<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Commande artisan pour expirer les invitations dépassant leur date limite et nettoyer les anciennes invitations.
 */

namespace App\Console\Commands;

use App\Services\InvitationService;
use Illuminate\Console\Command;

class ExpireInvitations extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'invitations:expire
                            {--clean : Supprimer les invitations expirées depuis plus de 7 jours}';

    /**
     * The console command description.
     */
    protected $description = 'Expirer les invitations qui ont dépassé leur date limite';

    /**
     * Execute the console command.
     */
    public function handle(InvitationService $invitationService): int
    {
        $this->info('Recherche des invitations expirées...');

        // Expirer les invitations
        $expiredCount = $invitationService->expireOldInvitations();

        if ($expiredCount > 0) {
            $this->info("{$expiredCount} invitation(s) expirée(s)");
        } else {
            $this->info('Aucune invitation à expirer');
        }

        // Nettoyer les anciennes invitations si demandé
        if ($this->option('clean')) {
            $this->info('Nettoyage des anciennes invitations expirées...');
            $cleanedCount = $invitationService->cleanupExpiredInvitations(7);

            if ($cleanedCount > 0) {
                $this->info("{$cleanedCount} ancienne(s) invitation(s) supprimée(s)");
            } else {
                $this->info('Aucune ancienne invitation à supprimer');
            }
        }

        return Command::SUCCESS;
    }
}
