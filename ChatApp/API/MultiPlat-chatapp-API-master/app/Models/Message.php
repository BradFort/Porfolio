<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les messages d'un channel.
 * Permet de gérer le contenu, les fichiers joints et les relations avec l'utilisateur et le channel.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

/**
 * Class Message
 * Modèle représentant un message dans un channel.
 *
 * @property int $id Identifiant du message
 * @property string $content Contenu du message
 * @property int $channel_id Identifiant du channel
 * @property int $user_id Identifiant de l'utilisateur
 * @property string $type Type du message
 * @property string|null $file_path Chemin du fichier joint
 * @property int|null $duration Durée (pour audio/vidéo)
 * @property string|null $file_name Nom du fichier joint
 * @property int|null $file_size Taille du fichier joint
 * @property string|null $mime_type Type MIME du fichier
 */
class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'content',
        'channel_id',
        'user_id',
        'type',
        'file_path',
        'duration',
        'file_name',
        'file_size',
        'mime_type',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur (expéditeur du message).
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec le channel du message.
     * @return BelongsTo
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Scope pour récupérer les messages d'un channel précis.
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param Channel $channel Channel concerné
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForChannel($query, Channel $channel)
    {
        return $query->where('channel_id', $channel->id);
    }

    /**
     * Retourne un tableau d'informations pour l'affichage du message.
     * @return array Informations à afficher
     */
    public function show(): array
    {
        return [
            $this->user->name,
            $this->created_at->format('H:i'),
            $this->created_at,
            $this->content
        ];
    }

    /**
     * Retourne l'URL complète du fichier joint (local ou CDN).
     * @return string|null URL du fichier ou null si absent
     */
    public function getFileUrl(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        $disk = config('filesystems.default');

        if ($disk === 'spaces') {
            return Storage::disk('spaces')->url($this->file_path);
        }

        return asset('storage/' . $this->file_path);
    }
}
