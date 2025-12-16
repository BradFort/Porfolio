<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Migration pour la création de la table des clés de session E2EE.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table pour stocker les clés de session AES-256 chiffrées avec RSA
     */
    public function up(): void
    {
        Schema::create('e2ee_session_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('channel_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('encrypted_session_key'); // Clé AES-256 chiffrée avec RSA du user
            $table->timestamps();

            // Chaque user a une clé de session unique par channel
            $table->unique(['channel_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('e2ee_session_keys');
    }
};
