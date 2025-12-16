<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Commande artisan pour nettoyer les fichiers des messages supprimés il y a plus de X jours.
 */

namespace App\Console\Commands;

use App\Models\Message;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupOldAttachments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'attachments:cleanup {--days=30 : Nombre de jours avant suppression des messages supprimés} {--dry-run : Afficher ce qui serait supprimé sans le faire}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Nettoie les fichiers des messages supprimés il y a plus de X jours';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $dryRun = $this->option('dry-run');

        $this->info("Nettoyage des fichiers de messages supprimés il y a plus de {$days} jours...");

        if ($dryRun) {
            $this->warn("Mode DRY-RUN: Aucune suppression ne sera effectuée");
        }

        // Récupérer les messages supprimés il y a plus de X jours
        $messages = Message::onlyTrashed()
            ->where('deleted_at', '<', now()->subDays($days))
            ->whereIn('type', ['attachment', 'voice'])
            ->whereNotNull('file_path')
            ->get();

        if ($messages->isEmpty()) {
            $this->info("Aucun fichier à nettoyer");
            return Command::SUCCESS;
        }

        $this->info("{$messages->count()} fichier(s) trouvé(s)");

        $deletedFiles = 0;
        $deletedSize = 0;
        $errors = 0;

        $progressBar = $this->output->createProgressBar($messages->count());
        $progressBar->start();

        foreach ($messages as $message) {
            try {
                $filePath = $message->file_path;
                // Déterminer le disque de stockage
                $disk = config('filesystems.default') === 'spaces' ? 'spaces' : 'public';

                // Calculer la taille avant suppression
                if (Storage::disk($disk)->exists($filePath)) {
                    $size = Storage::disk($disk)->size($filePath);
                    $deletedSize += $size;

                    if (!$dryRun) {
                        // Supprimer le fichier
                        Storage::disk($disk)->delete($filePath);

                        // Supprimer définitivement le message de la base
                        $message->forceDelete();
                    }

                    $deletedFiles++;
                } else {
                    // Le fichier n'existe plus, supprimer quand même l'enregistrement
                    if (!$dryRun) {
                        $message->forceDelete();
                    }
                }
            } catch (\Exception $e) {
                $errors++;
                $this->error("\nErreur lors du traitement du message {$message->id}: {$e->getMessage()}");
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Afficher les résultats
        $sizeInMB = round($deletedSize / (1024 * 1024), 2);

        if ($dryRun) {
            $this->info("Résumé (DRY-RUN):");
            $this->line("   • Fichiers qui seraient supprimés: {$deletedFiles}");
            $this->line("   • Espace qui serait libéré: {$sizeInMB} MB");
        } else {
            $this->info("Nettoyage terminé!");
            $this->line("   • Fichiers supprimés: {$deletedFiles}");
            $this->line("   • Espace libéré: {$sizeInMB} MB");
        }

        if ($errors > 0) {
            $this->warn("   • Erreurs rencontrées: {$errors}");
        }

        return Command::SUCCESS;
    }
}
