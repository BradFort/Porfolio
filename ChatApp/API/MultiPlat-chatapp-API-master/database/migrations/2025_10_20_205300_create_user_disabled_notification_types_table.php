<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Migration pour la création de la table de liaison utilisateur-type de notification désactivé.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute les migrations.
     */
    public function up(): void
    {
        Schema::create('user_disabled_notification_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Table name is 'notificationType' per existing migration
            $table->foreignId('notification_type_id')->constrained('notificationType')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'notification_type_id'], 'user_notification_type_unique');
        });
    }

    /**
     * Restaure les migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_disabled_notification_types');
    }
};
