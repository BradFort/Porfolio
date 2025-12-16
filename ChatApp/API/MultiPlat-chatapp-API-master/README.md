# 💬 ChatApp API - Laravel Multi-Plateforme

![Laravel](https://img.shields.io/badge/Laravel-12-red?style=flat-square&logo=laravel)
![PHP](https://img.shields.io/badge/PHP-8.2+-blue?style=flat-square&logo=php)
![Docker](https://img.shields.io/badge/Docker-ready-blue?style=flat-square&logo=docker)
![Redis](https://img.shields.io/badge/Redis-enabled-red?style=flat-square&logo=redis)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=flat-square&logo=mysql)
![JWT](https://img.shields.io/badge/JWT-Auth-green?style=flat-square)

## 🎯 Vue d'ensemble

API RESTful temps réel pour application de messagerie instantanée multi-plateforme avec chiffrement de bout en bout (E2EE), authentification à deux facteurs (MFA), système de tickets de support, et gestion complète des utilisateurs, salons, messages et invitations.

**Version actuelle** : 1.0.0

**Auteurs** : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier

**Architecture** : Client ↔ API (Laravel) ↔ Redis (Pub/Sub) ↔ WebSocket Server

## ✨ Fonctionnalités Principales

### 🔐 Sécurité & Authentification
- **JWT (JSON Web Tokens)** pour l'authentification API
- **MFA (Multi-Factor Authentication)** avec codes à 6 chiffres envoyés par email (Brevo API)
- **E2EE (End-to-End Encryption)** : Chiffrement de bout en bout RSA-4096 + AES-256-GCM
- **Rate limiting** sur les routes sensibles
- **Validation stricte** des entrées utilisateur

### 👥 Gestion des Utilisateurs
- Système de **permissions multi-niveaux** (admin, modérateur, membre)
- **Préférences utilisateur** (thème, langue, notifications)
- **Support multilingue** (français, anglais)
- **Statistiques utilisateur** (activité, messages, salons)

### 💬 Messagerie Temps Réel
- **Messages texte, vocaux et pièces jointes**
- **Broadcasting Redis** pour la communication temps réel
- **Soft delete** sur les messages (récupération possible)
- **Compression automatique** des images uploadées
- **Stockage cloud** avec DigitalOcean Spaces + CDN

### 🏠 Gestion des Salons
- **Salons publics, privés et DM** (messages directs)
- **Système d'invitations** avec expiration automatique (7 jours)
- **Gestion des rôles** par salon
- **E2EE optionnel** par salon

### 🎫 Système de Support
- **Tickets de support** avec priorités (low, medium, high, urgent)
- **Statuts** : open, in_progress, resolved, closed
- **Commentaires** sur les tickets
- **Attribution** à des modérateurs/admins

### 🔔 Notifications
- **Personnalisables** par type d'événement
- Types : Messages, DM, Invitations, Mentions, Événements de salon

### 🐳 Infrastructure
- **Déploiement Docker** simplifié avec Laravel Sail
- **Configuration Nginx** pour production (SSL/TLS, compression, sécurité)
- **Monitoring** avec Sentry pour le tracking d'erreurs
- **Health checks** intégrés

## 1. Objectifs

Développement d'une **API RESTful** conteneurisée avec **Docker** permettant la gestion :
- des **utilisateurs** (création, authentification, suppression, préférences linguistiques)
- des **permissions** (admin, modérateur, utilisateur)
- des **salons de discussion** (création, modification, suppression, publics/privés)
- des **messages** (création, modification, suppression)
- des **invitations** (création, acceptation, refus, expiration automatique)
- des **notifications** (préférences personnalisables par type)
- des **configurations utilisateur** (préférences, thèmes, langue, etc.)
- du **temps réel** avec **Redis** pour la diffusion instantanée

L'API persiste les données dans une base SQL (MySQL) et utilise Redis comme couche de communication temps réel via le protocole Pub/Sub.

---

## 2. Justification framework utilisé et Choix Techniques

### Pourquoi Laravel ?
- **Robustesse & Sécurité** : Laravel offre une structure solide avec des fonctionnalités intégrées pour la sécurité (protection CSRF, validation des entrées, etc.).
- **Ecosystème Riche** : Large éventail de packages et une communauté active facilitant le développement rapide.
- **ORM Eloquent** : Simplifie les interactions avec la base de données via un ORM intuitif.
- **Artisan CLI** : Outils en ligne de commande puissants pour automatiser les tâches courantes (migrations, seeders, etc.).
- **Middleware** : Gestion facile des permissions et de l’authentification via des middlewares.
- **Support Docker** : Intégration fluide avec Docker via Laravel Sail pour un environnement de développement conteneurisé.


### Technologies Utilisées
- **Langage / Framework** : Laravel 12 (PHP 8.2+)
- **Base de données** : MySQL 8.0 (persistance)
- **Authentification** : JWT (tymon/jwt-auth) + MFA avec codes par email
- **Email** : Brevo API pour l'envoi des codes MFA
- **Chiffrement** : E2EE avec RSA-4096 (clés utilisateur) + AES-256-GCM (messages)
- **Stockage** : DigitalOcean Spaces avec CDN (fichiers/images)
- **Compression** : PHP GD (optimisation automatique des images)
- **Cache & Temps Réel** : Redis (Pub/Sub pour messages en direct)
- **Conteneurisation** : Docker & Docker Compose (Laravel Sail)
- **Monitoring** : Sentry pour le tracking d'erreurs
- **Documentation API** : Swagger / OpenAPI (darkaonline/l5-swagger)
- **Validation** : Laravel Request Validation + DNS validation pour emails

---

## 3. Structure du Projet

```
MultiPlat-chatapp-API/
├── app/
│   ├── Console/
│   │   └── Commands/
│   │       └── ExpireInvitations.php           # Expire invitations périmées
│   ├── Events/
│   │   ├── MessageSent.php                     # Event message envoyé
│   │   └── DMCreated.php                       # Event DM créé
│   ├── Exceptions/
│   │   └── Handler.php                         # Gestion personnalisée erreurs
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php              # Auth JWT
│   │   │   ├── MFAController.php               # Auth 2FA
│   │   │   ├── ChannelController.php           # Salons
│   │   │   ├── DMChannelController.php         # Messages directs
│   │   │   ├── MessageController.php           # Messages standard
│   │   │   ├── EncryptedMessageController.php  # Messages E2EE
│   │   │   ├── E2EEController.php              # Clés E2EE
│   │   │   ├── InvitationController.php        # Invitations
│   │   │   ├── TicketController.php            # Tickets support
│   │   │   ├── TicketCommentController.php     # Commentaires tickets
│   │   │   ├── NotificationTypeController.php  # Types notifications
│   │   │   ├── UserChannelController.php       # Membres salons
│   │   │   ├── UserController.php              # Utilisateurs
│   │   │   └── Controller.php                  # Base controller
│   │   ├── Middleware/
│   │   │   ├── SecurityHeaders.php             # Headers sécurité HTTP
│   │   │   └── SentryContext.php               # Context Sentry
│   │   ├── Requests/
│   │   │   ├── SendInvitationRequest.php       # Validation invitations
│   │   │   ├── StoreChannelRequest.php         # Validation création salon
│   │   │   ├── UpdateChannelRequest.php        # Validation modif salon
│   │   │   └── StrongPasswordRequest.php       # Validation MDP fort
│   │   ├── Resources/
│   │   │   ├── ChannelResource.php             # Transform salon
│   │   │   ├── ChannelDetailResource.php       # Transform salon détaillé
│   │   │   ├── ChannelCollection.php           # Collection salons
│   │   │   ├── DMChannelResource.php           # Transform DM
│   │   │   ├── MessageResource.php             # Transform message
│   │   │   ├── UserResource.php                # Transform utilisateur
│   │   │   └── NotificationTypeCollection.php  # Collection notifications
│   │   └── Schemas/                            # Schémas OpenAPI/Swagger
│   │       ├── ChannelSchema.php
│   │       ├── DMChannelSchema.php
│   │       ├── MessageSchema.php
│   │       ├── UserSchema.php
│   │       ├── UserChannelSchema.php
│   │       └── NotificationTypeSchema.php
│   ├── Models/
│   │   ├── Channel.php                         # Modèle Salon
│   │   ├── DMChannel.php                       # Modèle DM
│   │   ├── Message.php                         # Modèle Message
│   │   ├── EncryptedMessage.php                # Modèle Message E2EE
│   │   ├── User.php                            # Modèle Utilisateur
│   │   ├── UserChannel.php                     # Pivot User-Channel
│   │   ├── Invitation.php                      # Modèle Invitation
│   │   ├── MFACode.php                         # Codes 2FA temporaires
│   │   ├── UserE2eeKey.php                     # Clés publiques RSA
│   │   ├── E2eeSessionKey.php                  # Clés session AES chiffrées
│   │   ├── Ticket.php                          # Modèle Ticket support
│   │   ├── TicketComment.php                   # Modèle Commentaire
│   │   └── NotificationType.php                # Modèle Type notification
│   ├── Services/
│   │   ├── ChannelService.php                  # Logique salons
│   │   ├── DMChannelService.php                # Logique DM
│   │   ├── MessageService.php                  # Logique messages
│   │   ├── InvitationService.php               # Logique invitations
│   │   ├── MFAService.php                      # Logique MFA
│   │   ├── BrevoApiService.php                 # Envoi emails (Brevo API)
│   │   ├── E2EEService.php                     # Logique E2EE
│   │   ├── EmailValidationService.php          # Validation DNS emails
│   │   └── FileCompressionService.php          # Compression images
│   └── Providers/
│       └── AppServiceProvider.php              # Service provider
├── database/
│   ├── migrations/                             # 23 migrations
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   ├── 0001_01_01_000002_create_jobs_table.php
│   │   ├── 2025_09_10_173607_create_channels_table.php
│   │   ├── 2025_09_10_173831_create_messages_table.php
│   │   ├── 2025_09_10_175628_create_dm_channels_table.php
│   │   ├── 2025_09_10_181011_create_user_channels_table.php
│   │   ├── 2025_09_17_020347_add_missing_fields_to_channels_and_user_channels.php
│   │   ├── 2025_09_17_033929_create_personal_access_tokens_table.php
│   │   ├── 2025_09_22_155144_alter_type_enum_on_channels_table.php
│   │   ├── 2025_10_03_195758_create_invitation_table.php
│   │   ├── 2025_10_20_204532_create_notification_type_table.php
│   │   ├── 2025_10_20_205013_add_lang_to_users_table.php
│   │   ├── 2025_10_20_205300_create_user_disabled_notification_types_table.php
│   │   ├── 2025_11_16_000001_add_mfa_to_users.php
│   │   ├── 2025_11_17_020200_create_encrypted_messages_table.php
│   │   ├── 2025_11_17_184505_create_user_e2ee_keys_simplified_table.php
│   │   ├── 2025_11_17_184530_create_e2ee_session_keys_table.php
│   │   ├── 2025_11_18_000100_add_e2ee_fields_to_channels_table.php
│   │   ├── 2025_11_27_210737_add_voice_message_fields_to_messages_table.php
│   │   ├── 2025_11_28_000000_add_soft_deletes_to_messages_table.php
│   │   ├── 2025_11_28_173552_create_tickets_table.php
│   │   └── 2025_11_28_173951_create_ticket_comments_table.php
│   ├── seeders/                                # 7 seeders
│   │   ├── DatabaseSeeder.php                  # Seeder principal
│   │   ├── NotifTypeSeeder.php                 # Types notifications
│   │   ├── UserSeeder.php                      # Utilisateurs test
│   │   ├── ChannelSeeder.php                   # Salons test
│   │   ├── MessageSeeder.php                   # Messages test
│   │   ├── DMChannelSeeder.php                 # DM test
│   │   └── InvitationSeeder.php                # Invitations test
│   └── factories/
│       ├── ChannelFactory.php
│       ├── DMChannelFactory.php
│       ├── MessageFactory.php
│       └── UserFactory.php
├── routes/
│   ├── api.php                                 # 100+ endpoints API
│   └── channels.php                            # Canaux broadcasting Redis
├── config/
│   ├── app.php                                 # Config app
│   ├── auth.php                                # Config auth
│   ├── cache.php                               # Config cache
│   ├── cors.php                                # Config CORS
│   ├── database.php                            # Config DB
│   ├── filesystems.php                         # Config stockage (Spaces)
│   ├── jwt.php                                 # Config JWT
│   ├── l5-swagger.php                          # Config Swagger
│   ├── logging.php                             # Config logs
│   ├── mail.php                                # Config mail (Brevo)
│   ├── queue.php                               # Config queues
│   ├── sentry.php                              # Config Sentry
│   └── services.php                            # Config services externes
├── docker-compose.yml                          # Config Docker (MySQL, Redis)
├── Dockerfile                                  # Image Docker
├── docker-entrypoint.sh                        # Script démarrage
├── .env.example                                # Variables environnement
├── composer.json                               # Dépendances PHP
├── phpunit.xml                                 # Config tests PHPUnit
└── README.md                                   # Documentation
```


## 4. Installation et Démarrage

### Prérequis
- **Docker Desktop** installé et en cours d'exécution
- **Git** pour cloner le dépôt
- **Composer** (Docker s'en charge)
- Un IDE (VSCode, PHPStorm, etc.)

### Étapes d'Installation

#### 1. Ouvrir Docker Desktop

Assurez-vous que Docker Desktop est démarré avant de continuer.

#### 2. Cloner le Repository

```bash
git clone https://github.com/Zack7292/MultiPlat-chatapp-API.git
cd MultiPlat-chatapp-API
```

#### 3. Installer les Dépendances

```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html \
    laravelsail/php84-composer:latest \
    composer install --ignore-platform-reqs
```

#### 4. Configuration de l'Environnement

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Générer la clé d'application
./vendor/bin/sail artisan key:generate
```

### Lancement des Conteneurs

```bash
# Créer un alias pour sail (facilite l'utilisation)
alias sail='sh $([ -f sail ] && echo sail || echo vendor/bin/sail)'

# Arrêter les conteneurs existants, démarrer et initialiser la base de données
sail down && sail up -d && sail artisan migrate:fresh --seed
```

> 💡 **Note** : Lors du premier lancement, il est possible que la commande échoue car l'alias `sail` n'est pas encore chargé. Dans ce cas, relancez simplement la commande une seconde fois.

### Accéder à l'API
L'API sera accessible à l'adresse suivante : `http://localhost:{PORT}/chatappAPI` (le port est défini dans le fichier `docker-compose.yml`).

---
## 5. Endpoints de l'API

L'API gère l'authentification, les utilisateurs, les salons (channels), les messages, les conversations privées (DM), les invitations et les notifications.

Toutes les routes protégées nécessitent un **token d'authentification Bearer** (via Laravel Sanctum).

**Préfixe de base** : `/chatappAPI`

---

### 🌐 Accès via Nginx (Recommandé)

En production, l'API est accessible via Nginx qui gère :
- La terminaison SSL/TLS
- Le routage des requêtes
- La compression gzip
- Les headers de sécurité

#### URLs de l'API

**Développement** :
- Direct : `http://localhost:8000/chatappAPI`
- Via Nginx : `http://localhost/chatappAPI`

**Production** :
- `https://chatapp-xp.fun/chatappAPI`

#### Configuration Nginx pour l'API

Nginx route toutes les requêtes `/chatappAPI/*` vers le conteneur Laravel :
```nginx
location /chatappAPI/ {
    proxy_pass http://api:8000/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

#### Health Check

L'API expose un endpoint de santé pour Nginx :
```
GET /chatappAPI/health
```

Ce endpoint est vérifié automatiquement toutes les 30 secondes.

### 🔐 Authentification

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `POST` | `/register` | Inscription d'un nouvel utilisateur | ❌ |
| `POST` | `/login` | Connexion et récupération d'un token | ❌ |
| `POST` | `/logout` | Déconnexion de l'utilisateur courant | ✅ |
| `GET` | `/me` | Récupérer les informations de l'utilisateur connecté | ✅ |
| `POST` | `/refresh` | Rafraîchir le token JWT | ✅ |

### 🔑 MFA (Authentification à Deux Facteurs)

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `POST` | `/mfa/toggle` | Activer/désactiver le MFA | ✅ |
| `POST` | `/mfa/verify` | Vérifier un code MFA | ❌ |
| `POST` | `/mfa/resend` | Renvoyer un code MFA | ❌ |

#### Fonctionnement du MFA

1. **Activation** : L'utilisateur active le MFA via `/mfa/toggle`
2. **Connexion** : Lors du login, si MFA activé, un code à 6 chiffres est envoyé par email
3. **Vérification** : L'utilisateur soumet le code via `/mfa/verify` pour obtenir le token JWT
4. **Expiration** : Les codes expirent après 10 minutes
5. **Email** : Envoi via Brevo API avec validation DNS du domaine email

#### Exemple : Inscription

```bash
curl -X POST http://localhost:8080/chatappAPI/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

#### Exemple : Connexion

```bash
curl -X POST http://localhost:8080/chatappAPI/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Réponse** :
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "1|abcdef123456..."
  }
}
```

---


### 👤 Utilisateurs

| Méthode | Endpoint | Description | Auth Requise | Permission |
|----------|-----------|--------------|---------------|------------|
| `POST` | `/user` | Créer un utilisateur | ✅ | Admin |
| `GET` | `/user` | Lister tous les utilisateurs | ✅ | Admin |
| `GET` | `/user/{user}` | Récupérer un utilisateur par ID | ✅ | Tous |
| `PUT` | `/user/{user}` | Modifier un utilisateur | ✅ | Owner/Admin |
| `DELETE` | `/user/{user}` | Supprimer un utilisateur | ✅ | Admin |
| `GET` | `/user/{user}/channels` | Obtenir les channels d'un utilisateur | ✅ | Tous |
| `GET` | `/user/{user}/notifs` | Lister les préférences de notification | ✅ | Owner/Admin |
| `POST` | `/user/{user}/notifs/toggle` | Activer/désactiver un type de notification | ✅ | Owner/Admin |
| `PUT` | `/user/{user}/lang/{lang}` | Changer la langue de l'utilisateur | ✅ | Owner/Admin |

#### Recherche d'utilisateurs

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `GET` | `/users/available-for-invite/{channel}` | Liste des utilisateurs invitables dans un salon | ✅ |
| `GET` | `/users/available-for-dm` | Liste des utilisateurs disponibles pour DM | ✅ |

---

## 📎 Système de Pièces Jointes et Messages Vocaux

### Fonctionnalités

- 📤 **Upload de fichiers** : Pièces jointes et messages vocaux
- 🖼️ **Compression automatique** : Images optimisées (JPEG 75%, PNG niveau 6)
- 📁 **Organisation intelligente** : 256 sous-dossiers (hash MD5 utilisateur)
- ☁️ **Support cloud** : DigitalOcean Spaces avec CDN
- 🗑️ **Soft delete** : Conservation 30 jours avant suppression définitive
- 🧹 **Nettoyage automatique** : Suppression planifiée des fichiers obsolètes

### Limites de Taille

| Type | Taille maximale |
|------|----------------|
| Pièces jointes | 5 MB |
| Messages vocaux | 5 MB |

### Structure de Stockage
```
storage/app/public/  # Stockage local
├── attachments/
│   ├── 00/ ... ff/          # 256 sous-dossiers
│       └── timestamp_userid_filename.ext
└── voice-messages/
    ├── 00/ ... ff/          # 256 sous-dossiers
    └── timestamp_userid_audio.webm
```
### Compression Automatique

Les images sont automatiquement compressées lors de l'upload :

**Paramètres :**
- Seuil : 500 KB (images plus petites non compressées)
- Dimensions max : 2000px (redimensionnement automatique)
- JPEG : Qualité 75%
- PNG : Niveau de compression 6, transparence préservée
- Économies : 40-70% pour JPEG, 20-50% pour PNG

---

### 💬 Channels (Salons)

#### Routes principales

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `GET` | `/channel` | Lister tous les salons | ✅ |
| `GET` | `/channel/public` | Lister uniquement les salons publics | ✅ |
| `POST` | `/channel` | Créer un nouveau salon | ✅ |
| `GET` | `/my-channels` | Lister les salons de l'utilisateur connecté | ✅ |

#### Opérations sur un salon spécifique

| Méthode | Endpoint | Description | Auth Requise | Permission |
|----------|-----------|--------------|---------------|------------|
| `GET` | `/channel/{channel}` | Voir les infos d'un salon | ✅ | Membre/Admin |
| `PUT` | `/channel/{channel}` | Modifier un salon | ✅ | Admin/Moderator |
| `DELETE` | `/channel/{channel}` | Supprimer un salon | ✅ | Admin |

#### Actions utilisateur sur un salon

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `POST` | `/channel/{channel}/join` | Rejoindre un salon public | ✅ |
| `POST` | `/channel/{channel}/leave` | Quitter un salon | ✅ |
| `POST` | `/channel/{channel}/invite` | Inviter un utilisateur (crée une invitation) | ✅ |

#### Gestion des membres du salon

| Méthode | Endpoint | Description | Auth Requise | Permission |
|----------|-----------|--------------|---------------|------------|
| `GET` | `/channel/{channel}/user` | Lister les membres d'un salon | ✅ | Membre |
| `PUT` | `/channel/{channel}/user/{userChannel}` | Modifier le rôle d'un membre | ✅ | Admin/Moderator |

#### Messages d'un salon

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `GET` | `/channel/{channel}/message` | Lister les messages du salon (50 derniers) | ✅ |
| `POST` | `/channel/{channel}/message` | Envoyer un message dans le salon | ✅ |
| `GET` | `/channel/{channel}/message/{message}` | Voir un message spécifique | ✅ |
| `DELETE` | `/message/{message}` | Supprimer un message | ✅ |

#### Exemple : Créer un salon

```bash
curl -X POST http://localhost:8080/chatappAPI/channel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Général",
    "description": "Salon de discussion général",
    "type": "public"
  }'
```

---

### 📬 Invitations aux Salons

Système complet de gestion des invitations avec expiration automatique et notifications temps réel.

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `POST` | `/channel/{channel}/invite` | Inviter un utilisateur dans un salon | ✅ |
| `GET` | `/invitations` | Lister toutes mes invitations | ✅ |
| `GET` | `/invitations/count` | Nombre d'invitations en attente | ✅ |
| `GET` | `/invitations/{invitation}` | Voir une invitation spécifique | ✅ |
| `POST` | `/invitations/{invitation}/accept` | Accepter une invitation | ✅ |
| `POST` | `/invitations/{invitation}/reject` | Refuser une invitation | ✅ |

#### Caractéristiques du système d'invitations

- ⏰ **Expiration automatique** après 7 jours
- 🔔 **Notifications temps réel** via Redis
- 📊 **Statuts** : `pending`, `accepted`, `rejected`, `expired`
- 🔒 **Unicité** : Un utilisateur ne peut avoir qu'une seule invitation active par salon
- 🗑️ **Nettoyage automatique** : Suppression des invitations expirées anciennes

#### Exemple : Inviter un utilisateur

```bash
curl -X POST http://localhost:8080/chatappAPI/channel/1/invite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "message": "Rejoins-nous dans ce salon !"
  }'
```

#### Exemple : Accepter une invitation

```bash
curl -X POST http://localhost:8080/chatappAPI/invitations/1/accept \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 💭 DM (Conversations Privées)

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `GET` | `/dm` | Lister toutes mes conversations privées | ✅ |
| `POST` | `/dm` | Créer une nouvelle conversation DM | ✅ |
| `GET` | `/dm/{dm}` | Voir une conversation DM spécifique | ✅ |
| `PUT` | `/dm/{dm}` | Modifier une conversation DM | ✅ |

#### Messages d'un DM

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `GET` | `/dm/{dm}/message` | Lister les messages d'un DM | ✅ |
| `POST` | `/dm/{dm}/message` | Envoyer un message dans un DM | ✅ |
| `GET` | `/dm/{dm}/message/{message}` | Voir un message spécifique | ✅ |

#### Utilisateurs d'un DM

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `GET` | `/dm/{dm}/user` | Lister les participants d'un DM | ✅ |
| `PUT` | `/dm/{dm}/user/{userChannel}` | Modifier le statut d'un participant | ✅ |

---

### 🔐 E2EE (Chiffrement de Bout en Bout)

#### Gestion des Clés

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `POST` | `/e2ee/keys/register` | Enregistrer la clé publique RSA-4096 | ✅ |
| `GET` | `/e2ee/keys/user/{userId}` | Récupérer la clé publique d'un utilisateur | ✅ |
| `GET` | `/e2ee/keys/channel/{channelId}` | Récupérer les clés de tous les membres d'un salon | ✅ |

#### Clés de Session AES

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `POST` | `/e2ee/session-keys/distribute` | Distribuer une clé de session AES-256 chiffrée | ✅ |
| `GET` | `/e2ee/session-keys/{channelId}` | Récupérer sa clé de session pour un salon | ✅ |
| `GET` | `/e2ee/channel/{channelId}/status` | Vérifier si E2EE est activé sur un salon | ✅ |

#### Messages Chiffrés

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `POST` | `/encrypted-messages` | Envoyer un message chiffré E2EE | ✅ |
| `GET` | `/encrypted-messages/channel/{channelId}` | Lister les messages chiffrés d'un salon | ✅ |
| `GET` | `/encrypted-messages/{messageId}` | Récupérer un message chiffré spécifique | ✅ |

#### Fonctionnement du E2EE

1. **Enregistrement des clés** : Chaque utilisateur génère une paire de clés RSA-4096 et enregistre sa clé publique
2. **Activation E2EE** : Un modérateur/admin active E2EE sur un salon via `PUT /channel/{id}/e2ee`
3. **Distribution clé de session** : Le créateur génère une clé AES-256, la chiffre avec la clé RSA de chaque membre
4. **Envoi de messages** : Les messages sont chiffrés avec AES-256-GCM avant envoi
5. **Réception** : Chaque membre déchiffre la clé de session avec sa clé privée RSA, puis déchiffre les messages

---

### 🎫 Système de Support (Tickets)

| Méthode | Endpoint | Description | Auth Requise | Permission |
|----------|-----------|--------------|---------------|------------|
| `GET` | `/tickets` | Lister tous les tickets | ✅ | Utilisateur voit ses tickets, Admin voit tout |
| `POST` | `/tickets` | Créer un nouveau ticket | ✅ | Tous |
| `GET` | `/tickets/{ticket}` | Voir un ticket spécifique | ✅ | Owner/Admin |
| `PUT` | `/tickets/{ticket}` | Modifier un ticket | ✅ | Owner/Admin/Moderator |
| `DELETE` | `/tickets/{ticket}` | Supprimer un ticket | ✅ | Owner/Admin |

#### Commentaires de Tickets

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `GET` | `/tickets/{ticket}/comments` | Lister les commentaires d'un ticket | ✅ |
| `POST` | `/tickets/{ticket}/comments` | Ajouter un commentaire | ✅ |
| `PUT` | `/comments/{comment}` | Modifier un commentaire | ✅ |
| `DELETE` | `/comments/{comment}` | Supprimer un commentaire | ✅ |

#### Statuts et Priorités

**Statuts** : `open`, `in_progress`, `resolved`, `closed`  
**Priorités** : `low`, `medium`, `high`, `urgent`

---

### 🔔 Notifications

| Méthode | Endpoint | Description | Auth Requise |
|----------|-----------|--------------|---------------|
| `GET` | `/notification-types` | Lister tous les types de notifications disponibles | ✅ |
| `GET` | `/user/{user}/notifs` | Lister les préférences de notification d'un utilisateur | ✅ |
| `POST` | `/user/{user}/notifs/toggle` | Activer/désactiver un type de notification | ✅ |

#### Types de notifications supportés

Les utilisateurs peuvent personnaliser leurs préférences pour :
- Messages dans les salons
- Messages privés (DM)
- Invitations aux salons
- Mentions dans les messages
- Événements de salon (membre rejoint/quitté)

---

## 6. Broadcasting

### 🔴 Events Redis (Pub/Sub)

#### Channels de broadcasting

| Canal | Description | Données |
|-------|-------------|---------|
| `channel.{id}` | Messages envoyés dans un salon | Message complet avec utilisateur |
| `chatappapi-database-channel.user.joined` | Utilisateur rejoint un salon | ID channel, ID user |
| `chatappapi-database-dm.created` | Nouvelle conversation privée créée | DM complet avec participants |
| `chatappapi-database-invitation.created` | Nouvelle invitation | Invitation avec channel et inviteur |
| `chatappapi-database-invitation.accepted` | Invitation acceptée | Channel et utilisateur acceptant |
| `chatappapi-database-invitation.rejected` | Invitation refusée | Channel et utilisateur refusant |

#### Structure d'un event message

```json
{
  "id": 123,
  "content": "Bonjour tout le monde!",
  "channel_id": 1,
  "user": {
    "id": 5,
    "name": "John Doe",
    "username": "johndoe"
  },
  "created_at": "2025-01-22T10:30:00.000000Z"
}
```

#### Structure d'un event invitation.created

```json
{
  "id": 42,
  "recipient_id": 8,
  "channel": {
    "id": 3,
    "name": "Tech Talk",
    "description": "Discussions techniques",
    "type": "private"
  },
  "inviter": {
    "id": 5,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "Rejoins-nous pour discuter de Laravel!",
  "created_at": "2025-01-22T10:30:00.000Z"
}
```

---

## 7. Sécurité et Permissions

### Authentification

- **Laravel Sanctum** pour l'authentification API basée sur tokens
- Tokens persistants dans la base de données
- Révocation de tokens lors de la déconnexion
- Protection contre les attaques CSRF

### Système de Permissions

#### Rôles disponibles

| Rôle | Permissions | Champ DB |
|------|-------------|----------|
| **Admin** | Accès complet à toutes les ressources | `is_admin = true` |
| **Moderator** | Gestion des membres et messages d'un salon | `role = 'moderator'` (UserChannel) |
| **Member** | Lecture et écriture dans les salons autorisés | `role = 'member'` (UserChannel) |

#### Contrôles d'accès

- **Vérification d'appartenance** : Un utilisateur doit être membre d'un salon pour y accéder
- **Salons privés** : Accès uniquement sur invitation
- **Salons publics** : Jointure libre avec la route `/channel/{id}/join`
- **Messages** : Suppression limitée à l'auteur, modérateurs et admins
- **Invitations** : Seuls les membres peuvent inviter d'autres utilisateurs

### Validation et Protection

- ✅ **Validation stricte** des entrées utilisateur (Laravel Request Validation)
- ✅ **Protection contre les injections SQL** via Eloquent ORM
- ✅ **Échappement automatique** des sorties (protection XSS)
- ✅ **Rate limiting** sur les routes sensibles
- ✅ **Middleware de permissions** pour toutes les routes protégées
- ✅ **Hashing sécurisé** des mots de passe (bcrypt)

### Broadcasting Sécurisé

- **Canaux privés** pour les DM (authentification requise)
- **Autorisation** requise pour écouter les événements de salon privé
- **Validation** de l'appartenance avant broadcast d'événements

---

### Commandes Artisan Personnalisées

#### Expirer les invitations

```bash
# Marquer les invitations périmées comme expirées
sail artisan invitations:expire

# Nettoyer les invitations expirées depuis plus de 7 jours
sail artisan invitations:expire --clean
```

**Fonctionnement** :
- Vérifie toutes les invitations avec `expires_at < now()`
- Change le statut à `expired`
- Option `--clean` : Supprime les invitations expirées depuis > 7 jours

---

## 8. Configuration Avancée

### Variables d'Environnement Importantes

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `APP_PORT` | Port d'accès à l'API | 8080 |
| `FORWARD_DB_PORT` | Port MySQL exposé | 3306 |
| `FORWARD_REDIS_PORT` | Port Redis exposé | 6379 |
| `SANCTUM_STATEFUL_DOMAINS` | Domaines autorisés | localhost:8080 |
| `SESSION_LIFETIME` | Durée de session (minutes) | 120 |
| `INVITATION_EXPIRATION_DAYS` | Expiration des invitations (jours) | 7 |

### Configuration Docker

#### Ports exposés

```yaml
services:
  laravel.test:
    ports:
      - '${APP_PORT:-8080}:80'

  mysql:
    ports:
      - '${FORWARD_DB_PORT:-3306}:3306'

  redis:
    ports:
      - '${FORWARD_REDIS_PORT:-6379}:6379'
```

### Base de données : Seeders

Le projet inclut des seeders pour initialiser la base avec des données de test.

```bash
# Réinitialiser la base avec données de test
sail artisan migrate:fresh --seed

# Seeder spécifique
sail artisan db:seed --class=UserSeeder
```

**Données créées par défaut** :
- 1 utilisateur système (system@chatapp.local)
- 12 utilisateurs de test (Alice, Bob, Charlie, Diana, etc.)
- 5+ salons (Général, Random, Secret, Développeurs, Gaming, Équipe)
- Messages d'exemple dans chaque salon
- Conversations DM entre utilisateurs
- Invitations de test en statut pending et accepted

---

## 9. Dépannage

### Problème : Les conteneurs ne démarrent pas

```bash
# Nettoyer les conteneurs existants
sail down -v
docker system prune -a

# Redémarrer
sail up -d
```

### Problème : Erreur de permission (Linux/Mac)

```bash
# Corriger les permissions
sudo chown -R $USER:$USER .
chmod -R 755 storage bootstrap/cache
```

### Problème : Base de données non accessible

```bash
# Vérifier l'état des conteneurs
sail ps

# Recréer la base de données
sail artisan migrate:fresh --seed
```

### Problème : Redis ne se connecte pas

```bash
# Vérifier que Redis tourne
sail redis-cli ping
# Devrait retourner: PONG

# Nettoyer le cache Redis
sail artisan cache:clear
sail artisan config:clear
```

### Problème : Token invalide ou expiré

```bash
# Nettoyer les tokens expirés
sail artisan sanctum:prune-expired
```

---

## 10. Documentation API

### Accéder à la Documentation Interactive

Une fois le serveur démarré, accédez à la documentation Swagger complète :

```
http://localhost:8080/api/documentation
```

## 📚 Ressources Utiles

- [Documentation Laravel](https://laravel.com/docs)
- [Documentation Laravel Sanctum](https://laravel.com/docs/sanctum)
- [Documentation Redis](https://redis.io/documentation)
- [Laravel Sail Documentation](https://laravel.com/docs/sail)
- [API REST Best Practices](https://restfulapi.net/)

---

## 👥 Équipe

- **Zack Livernois**
- **Zachary Bombardier**
- **Antoine Davignon**
- **Bradley Fortin**
- **Samuel Grenier**

---

**Dernière mise à jour** : 4 décembre 2025

**Version** : 1.0.0

> **PS** : CE README A ÉTÉ GÉNÉRÉE EN PARTIE À L'AIDE DE L'INTELLIGENCE ARTIFICIELLE

