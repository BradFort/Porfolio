<?php
/**
 * Auteur(s): Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier
 *
 * Modèle Eloquent pour les utilisateurs de l'application.
 * Permet de gérer les informations, rôles, relations et permissions des utilisateurs.
 */

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Laravel\Sanctum\HasApiTokens;
use Tymon\JWTAuth\Contracts\JWTSubject;

/**
 * Class User
 * Modèle représentant un utilisateur de l'application.
 *
 * @property int $id Identifiant de l'utilisateur
 * @property string $name Nom de l'utilisateur
 * @property string $email Adresse email
 * @property string $password Mot de passe
 * @property string $status Statut de l'utilisateur
 * @property string $role Rôle de l'utilisateur
 * @property string $theme Thème choisi
 * @property string $lang Langue choisie
 * @property bool $mfa_enabled MFA activé
 */
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
        'role',
        'theme',
        'lang',
        'mfa_enabled',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'mfa_enabled' => 'boolean',
        ];
    }

    /**
     * Les rôles disponibles
     */
    const ROLE_USER = 'user';
    const ROLE_MODERATOR = 'moderator';
    const ROLE_ADMIN = 'admin';

    /**
     * Relation many-to-many avec les channels.
     * @return BelongsToMany
     */
    public function channels(): BelongsToMany
    {
        return $this->belongsToMany(Channel::class, 'user_channels')
                    ->withTimestamps()
                    ->withPivot('joined_at');
    }

    /**
     * Relation avec les channels créés par l'utilisateur.
     * @return HasMany
     */
    public function createdChannels(): HasMany
    {
        return $this->hasMany(Channel::class, 'created_by');
    }

    /**
     * Types de notifications désactivés pour l'utilisateur.
     * @return BelongsToMany
     */
    public function disabledNotificationTypes(): BelongsToMany
    {
        return $this->belongsToMany(NotificationType::class, 'user_disabled_notification_types', 'user_id', 'notification_type_id')
            ->withTimestamps();
    }

    /**
     * Vérifie si l'utilisateur est administrateur.
     * @return bool Vrai si admin, faux sinon
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Vérifie si l'utilisateur est modérateur.
     * @return bool Vrai si modérateur, faux sinon
     */
    public function isModerator(): bool
    {
        return $this->role === self::ROLE_MODERATOR;
    }

    /**
     * Vérifie si l'utilisateur a des permissions élevées (admin ou modérateur).
     * @return bool Vrai si permissions élevées, faux sinon
     */
    public function hasElevatedPermissions(): bool
    {
        return $this->isAdmin() || $this->isModerator();
    }

    /**
     * Identifiant à stocker dans le claim subject du JWT.
     * @return mixed Identifiant JWT
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Tableau des claims personnalisés à ajouter au JWT.
     * @return array Claims personnalisés
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    /**
     * Relation avec les messages envoyés par l'utilisateur.
     * @return HasMany
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Relation avec les tickets créés par l'utilisateur.
     * @return HasMany
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Relation avec les tickets assignés à l'utilisateur.
     * @return HasMany
     */
    public function assignedTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'assigned_to');
    }

    /**
     * Relation avec les commentaires de ticket rédigés par l'utilisateur.
     * @return HasMany
     */
    public function ticketComments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }


}
