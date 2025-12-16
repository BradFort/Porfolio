<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Migration pour la création de la table des types de notifications.
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
        Schema::create('notificationType', function (Blueprint $table) {
            $table->id();
            $table->string('type_fr');
            $table->string('type_en');
            $table->timestamps();
        });
    }

    /**
     * Rétrograde les migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notificationType');
    }
};
