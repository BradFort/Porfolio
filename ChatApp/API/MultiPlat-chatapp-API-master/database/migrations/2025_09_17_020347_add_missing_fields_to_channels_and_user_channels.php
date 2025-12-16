<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Migration pour l'ajout de champs manquants aux tables channels et user_channels.
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
        // champs manquants à la table channels
        Schema::table('channels', function (Blueprint $table) {
            $table->enum('type', ['public', 'private'])->default('public')->after('description');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade')->after('type');

            // index pour optimiser les requêtes (why not have it ¯\_(ツ)_/¯ )
            $table->index(['type', 'created_at']);
        });

        // champ manquant à la table user_channels
        Schema::table('user_channels', function (Blueprint $table) {
            $table->timestamp('joined_at')->useCurrent()->after('channel_id');

            // pour éviter les doublons
            $table->unique(['user_id', 'channel_id']);

            // index pour optimiser les requêtes (why not have it too! ¯\_(ツ)_/¯ )
            $table->index(['user_id', 'joined_at']);
            $table->index(['channel_id', 'joined_at']);
        });
    }

    /**
     * Annule les migrations.
     */
    public function down(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->dropIndex(['type', 'created_at']);
            $table->dropForeign(['created_by']);
            $table->dropColumn(['type', 'created_by']);
        });

        Schema::table('user_channels', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'joined_at']);
            $table->dropIndex(['channel_id', 'joined_at']);
            $table->dropUnique(['user_id', 'channel_id']);
            $table->dropColumn('joined_at');
        });
    }
};
