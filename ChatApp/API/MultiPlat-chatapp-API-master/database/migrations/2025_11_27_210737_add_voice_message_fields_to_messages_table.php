<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Migration pour l'ajout des champs de message vocal à la table messages.
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
        Schema::table('messages', function (Blueprint $table) {
            $table->enum('type', ['text', 'voice', 'attachment'])->default('text')->after('user_id');
            $table->string('file_path')->nullable()->after('type');
            $table->integer('duration')->nullable()->after('file_path')->comment('Duration in seconds (max 60)');
            $table->string('file_name')->nullable()->after('duration')->comment('Original filename for attachments');
            $table->bigInteger('file_size')->nullable()->after('file_name')->comment('File size in bytes');
            $table->string('mime_type')->nullable()->after('file_size')->comment('MIME type of the file');
        });
    }

    /**
     * Annule les migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['type', 'file_path', 'duration', 'file_name', 'file_size', 'mime_type']);
        });
    }
};
