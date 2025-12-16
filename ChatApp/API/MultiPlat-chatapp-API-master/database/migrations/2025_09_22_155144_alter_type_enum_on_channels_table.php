<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Migration pour modifier l'énumération du champ type dans la table channels.
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
            Schema::table('channels', function (Blueprint $table) {
                $table->enum('type', ['public', 'private', 'dm'])->change();
            });
        });
    }

    /**
     * Restaure les migrations.
     */
    public function down(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->enum('type', ['public', 'private'])->change();
        });
    }
};
