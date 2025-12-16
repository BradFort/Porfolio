<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Migration pour la création de la table des invitations.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exécute la migration pour créer la table des invitations.
     */
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('channel_id')
                ->constrained('channels')
                ->onDelete('cascade');

            $table->foreignId('inviter_id')
                ->constrained('users')
                ->onDelete('cascade');

            $table->foreignId('invited_user_id')
                ->constrained('users')
                ->onDelete('cascade');

            // Statut de l'invitation
            $table->enum('status', ['pending', 'accepted', 'rejected', 'expired'])
                ->default('pending');

            // Message optionnel de l'inviteur
            $table->text('message')->nullable();

            // Timestamps
            $table->timestamps();
            $table->timestamp('expires_at')->nullable();

            // Index pour optimiser les requêtes
            $table->index(['invited_user_id', 'status', 'expires_at']);
            $table->index(['channel_id', 'invited_user_id']);

            // Empêcher les invitations en double pour le même utilisateur et channel (status pending)
            $table->index(['channel_id', 'invited_user_id', 'status']);
        });
    }

    /**
     * Annule la migration en supprimant la table des invitations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
