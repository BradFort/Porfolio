<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Migration pour l'ajout des champs E2EE à la table channels.
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
        Schema::table('channels', function (Blueprint $table) {
            $table->boolean('e2ee_enabled')->default(false)->after('type');
            $table->foreignId('e2ee_enabled_by')->nullable()->constrained('users')->onDelete('set null')->after('e2ee_enabled');
        });
    }

    /**
     * Annule les migrations.
     */
    public function down(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->dropForeign(['e2ee_enabled_by']);
            $table->dropColumn(['e2ee_enabled', 'e2ee_enabled_by']);
        });
    }
};
