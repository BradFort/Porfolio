# ChatApp Mobile - Application de Clavardage Multi-plateforme

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Multiplateforme2025/MultiPlat-chatapp-ReactNative)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.12-000020?logo=expo)](https://expo.dev/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)](https://react.dev/)

## 🎯 Vue d'ensemble

Application mobile de clavardage en temps réel développée avec React Native et Expo, intégrant authentification JWT, WebSockets pour la messagerie instantanée, chiffrement de bout en bout (E2EE), et support multiplateforme (iOS, Android, Web) avec un style Windows XP unique.

**Version actuelle** : 1.0.0

**Architecture** : Client Mobile - API Laravel - Redis - WebSocket Server

**Auteurs** : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier

---

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- **Système JWT** avec refresh automatique
- **MFA (Authentification Multi-Facteurs)** par email
  - Activation/désactivation depuis les paramètres
  - Modal de vérification du code à 6 chiffres
  - Renvoi du code si expiré
- Inscription et connexion sécurisées
- Validation des mots de passe (8 caractères min, lettres, chiffres, symboles, casse mixte)
- Vérification des mots de passe compromis
- Persistance de session avec AsyncStorage
- Déconnexion avec révocation des tokens

### 💬 Messagerie en temps réel
- **WebSocket** pour communication bidirectionnelle instantanée
- Messages texte avec historique complet
- **Messages vocaux** (enregistrement, lecture, durée, barre de progression)
- **Pièces jointes** (documents, images via caméra/galerie)
- Support des messages directs (DM) et salons publics/privés
- Indicateurs de frappe en temps réel
- Gestion des utilisateurs en ligne/hors ligne par salon
- Synchronisation automatique des messages
- Menu contextuel utilisateur (appui long pour DM rapide)

### 🔒 Chiffrement de bout en bout (E2EE)
- **Chiffrement RSA + AES** pour les messages directs
- Toggle E2EE par DM (activable/désactivable)
- Génération automatique des clés (publique/privée)
- Stockage sécurisé des clés avec SecureStore
- Synchronisation des clés de session
- Gestion des permissions (seul l'activateur peut désactiver)
- Indicateurs visuels de l'état E2EE

### 🏢 Gestion des salons
- Liste des salons publics et privés avec icônes différenciés
- Création de salons avec nom, description et type (public/privé)
- Rejoindre/quitter un salon
- Système d'invitations pour salons privés
- Création de conversations privées (DM)
- Affichage des membres en ligne/hors ligne
- Badge de compteur pour les invitations

### 🎫 Système de tickets (Support)
- Création de tickets avec titre, description et priorité
- Gestion des priorités (low, medium, high, critical)
- Statuts de tickets (open, in_progress, resolved, closed)
- Ajout de commentaires aux tickets
- Attribution des tickets aux administrateurs
- Historique complet des tickets
- Interface de gestion pour utilisateurs et admins

### 🛠️ Panneau d'administration
- Gestion complète des utilisateurs
- Gestion des salons (publics, privés, DMs)
- Gestion des messages avec filtres (all, channels, dms)
- Suppression sécurisée avec modals de confirmation
- Statistiques d'activité utilisateur
- Réservé aux utilisateurs avec rôle admin

### 🔔 Notifications personnalisables
- **Système de notifications avancé** avec types configurables
  - Tous les messages (all)
  - Messages directs uniquement (dm)
  - Mentions uniquement (mention)
  - Messages de salons (channel)
- Toggle individuel pour chaque type de notification
- Sauvegarde automatique des préférences
- Synchronisation en temps réel
- Notifications toast personnalisées (succès, erreur, info, warning)

### ⚙️ Paramètres utilisateur
- **Thème Windows XP authentique** avec mode clair/sombre
  - Barre de titre avec icône et fermeture
  - Bordures 3D caractéristiques
  - Palette de couleurs XP (bleu, gris, vert, rouge)
  - Boutons stylisés avec effets de relief
  - Barre de statut en bas de fenêtre
- Sélection de langue (FR/EN) avec i18next
- Préférences de notifications avancées
- Gestion du profil utilisateur
- Activation/désactivation du MFA

### 📊 Statistiques & Activité
- Statistiques personnelles (messages, salons)
- Activité par jour de la semaine
- Top salons les plus actifs
- Graphiques visuels avec barres de progression

### 📱 Expérience utilisateur
- Interface responsive (iOS, Android, Web)
- Animations fluides (fade-in, gesture handler)
- Indicateurs de chargement et de statut
- Modals de confirmation pour actions critiques
- Gestion des erreurs avec messages clairs
- Mode hors ligne avec cache local
- Support du dark mode système
- Safe area pour écrans modernes

---

## Architecture

### Architecture frontend

```
app/
├── _layout.jsx                             # Root layout avec tous les providers (Auth, Theme, Channels, Messages, OnlineUsers)
├── constants.js                            # Constantes globales de l'application
├── (auth)/                                 # Module d'authentification
│   ├── login.jsx                           # Écran de connexion avec support MFA
│   ├── LoginScreen.styles.js               # Styles connexion
│   ├── register.jsx                        # Écran d'inscription avec validation forte
│   └── RegisterScreen.styles.js            # Styles inscription
└── (main)/                                 # Module principal de l'application
    ├── index.jsx                           # Vue principale (chat + liste salons + sidebar utilisateurs)
    ├── ChatScreen.styles.js                # Styles du chat principal
    ├── admin.jsx                           # Panneau d'administration (gestion users/channels/messages)
    ├── AdminPanel.styles.js                # Styles du panneau admin
    ├── settings.jsx                        # Paramètres utilisateur (thème/langue/MFA/notifications)
    ├── SettingsScreen.styles.js            # Styles des paramètres
    ├── notifications.jsx                   # Gestion avancée des préférences de notifications
    ├── NotificationsSettingsScreen.styles.js # Styles des notifications
    ├── stats.jsx                           # Statistiques d'activité utilisateur
    ├── new-channel.jsx                     # Création de salon (public/privé)
    ├── new-channel.styles.js               # Styles de création de salon
    ├── new-dm.jsx                          # Création de conversation privée (DM)
    ├── tickets.jsx                         # Liste des tickets de support
    ├── TicketsScreen.styles.js             # Styles de la liste des tickets
    ├── ticket-details.jsx                  # Détails et gestion d'un ticket
    ├── TicketDetailsScreen.styles.js       # Styles des détails de ticket
    ├── create-ticket.jsx                   # Création d'un nouveau ticket
    └── CreateTicketScreen.styles.js        # Styles de création de ticket

contexts/                                   # État global (React Context API)
├── AuthContext.js                          # Authentification JWT + MFA + préférences notifications
├── ChannelsContext.js                      # Gestion des salons et DMs + invitations
├── MessagesContext.js                      # Messages temps réel + WebSocket + indicateurs de frappe
├── OnlineUsersContext.js                   # Liste des utilisateurs en ligne (global + par channel)
└── ThemeContext.jsx                        # Gestion du thème Windows XP (clair/sombre)

services/
├── apiService.js                           # Client HTTP générique (wrapper fetch + gestion erreurs)
├── authService.js                          # Services d'authentification (login, register, MFA)
├── chatService.js                          # Orchestration temps réel (WebSocket + événements)
├── websocketService.js                     # Gestion connexion WebSocket (reconnexion auto)
├── notificationService.js                  # Notifications toast personnalisées
├── crypto/                                 # Module de chiffrement E2EE
│   ├── CryptoService.js                    # Services cryptographiques de base (RSA, AES, conversions)
│   ├── E2EEKeyManager.js                   # Gestion des clés E2EE (génération, stockage, sync)
│   ├── E2EEManager.js                      # Manager principal E2EE (chiffrement/déchiffrement messages)
│   ├── E2EEDMService.js                    # Services E2EE spécifiques aux DMs
│   ├── E2EEMessageService.js               # Chiffrement/déchiffrement des messages
│   └── E2EESettingsModal.js                # Modal de configuration E2EE
└── websocket/
    └── WebSocketService.js                 # Implémentation WebSocket avec gestion des états

hooks/                                      # Hooks React personnalisés
├── useAdmin.js                             # Gestion des ressources admin (users, channels, messages)
├── useChannels.js                          # Re-export du ChannelsContext
├── useChat.js                              # Hook combiné complet (auth + channels + messages + websocket)
├── useConfirmation.js                      # Modals de confirmation pour actions critiques
├── useFadeAnimation.js                     # Animation fade-in/fade-out
├── useMessages.js                          # Re-export du MessagesContext
└── useWebSocket.js                         # Gestion connexion WebSocket (statut, reconnexion)

components/                                 # Composants réutilisables
├── AttachmentMenu.jsx                      # Menu d'attachements (fichiers, messages vocaux)
├── E2EEToggle.jsx                          # Toggle activation/désactivation E2EE pour DM
├── FileAttachment.jsx                      # Sélection et envoi de fichiers/images
├── LoadingScreen.jsx                       # Écran de chargement Windows XP
├── MessageBubble.jsx                       # Bulle de message (texte, voix, fichier)
├── MFADisableModal.jsx                     # Modal de désactivation MFA (avec password)
├── MFAPasswordModal.jsx                    # Modal saisie password pour MFA
├── MFAVerifyModal.jsx                      # Modal vérification code MFA à 6 chiffres
├── NotificationProvider.jsx                # Provider pour notifications toast globales
├── UserContextMenu.jsx                     # Menu contextuel utilisateur (appui long → DM rapide)
├── UsersList.jsx                           # Liste des utilisateurs d'un salon (online/offline)
├── UsersModal.jsx                          # Modal d'affichage des utilisateurs d'un salon
├── VoiceMessagePlayer.jsx                  # Lecteur de messages vocaux (play/pause/durée)
├── VoiceRecorder.jsx                       # Enregistreur de messages vocaux (max 60s)
├── XPButton.jsx                            # Bouton stylisé Windows XP
├── XPErrorModal.jsx                        # Modal d'erreur Windows XP
└── XPInput.jsx                             # Champ de saisie Windows XP

constants/
├── colors.js                               # Palette de couleurs Windows XP
├── themes.js                               # Définition des thèmes (clair/sombre)
└── language/                               # Internationalisation (i18next)
    ├── en.json                             # Traductions anglais (365 clés)
    ├── fr.json                             # Traductions français (369 clés)
    └── js/
        └── i18n.js                         # Configuration i18next

config/
└── api.js                                  # Configuration URLs API et WebSocket (mise à jour automatique par set-ip.js)

assets/
└── images/                                 # Assets visuels de l'application
    ├── icon.png                            # Icône principale
    ├── splash-icon.png                     # Icône splash screen
    ├── favicon.png                         # Favicon web
    ├── jdVance.png                         # Image de profil par défaut
    └── ...                                 # Autres assets visuels


```

---

## Prérequis

### Logiciels requis

- **Node.js** : v18.x ou supérieur
- **npm** : v9.x ou supérieur (ou **yarn** v1.22+)
- **Expo CLI** : Installé automatiquement avec le projet

### Pour le développement mobile

- **iOS** : macOS avec Xcode 14+ (pour simulateur iOS)
- **Android** : Android Studio avec SDK API 33+ (pour émulateur Android)
- **Appareil physique** : Application Expo Go installée

### Backend requis

L'application mobile nécessite que le backend soit opérationnel :

- **API REST** : Port 8080 (voir dépôt `chatapp-api`)
- **WebSocket Server** : Port 3001
- **Base de données** : PostgreSQL
- **Redis** : Pour Pub/Sub et cache
- **Docker Compose** : Recommandé pour orchestration

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/ZacharyBombardier/MultiPlat-chatapp-ReactNative.git
cd {répertoire de destination du clone}
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 3. Vérifier l'installation

```bash
npx expo --version
# Devrait afficher : ~54.0.12
```

---

## Configuration

### Variables d'environnement

La config est dans `config/api.js` :

```env
# API Configuration (gérée automatiquement par set-ip.js)
API_BASE_URL=http://192.168.x.x:8080/chatappAPI
WS_URL=ws://192.168.x.x:3001

# Expo
EXPO_PUBLIC_ENV=development
```

### Configuration automatique de l'IP

Le script `set-ip.js` détecte automatiquement votre IP locale et met à jour `config/api.js` avant chaque démarrage.

**Fichier : `config/api.js`**

```javascript
export const API_BASE_URL = 'http://192.168.1.100:8080/chatappAPI';
export const WS_URL = 'ws://192.168.1.100:3001';
```

> **Important** : Ce fichier est mis à jour automatiquement par `npm run local`. Ne pas modifier manuellement sauf pour debug.

> **En cas d'erreur** : Vérifier l'ip utilisé par le script `set-ip.js`, celui-ci utilise peut-être une mauvaise
> configuration : par exemple l'ip d'un vpn pourrait être une cause d'erreur.

### Configuration Expo

Le fichier `app.json` contient la configuration Expo :

```json
{
  "expo": {
    "name": "chatapp",
    "slug": "chatapp",
    "version": "1.0.0",
    "scheme": "chatapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "plugins": [
      "expo-router",
      ["expo-splash-screen", { ... }]
    ]
  }
}
```

---

## Démarrage

>**Préparation** : Assurez vous de démarrer les autres projets (API - Serveur WebSockets)

### Démarrer le serveur de développement

```bash
npm start
```

Cette commande :
1. Exécute `set-ip.js` pour détecter l'IP locale
2. Met à jour `config/api.js` automatiquement
3. Lance le serveur Metro Bundler
4. Affiche un QR code pour Expo Go

### Options de lancement

```bash
# Android
npm run android

# iOS (macOS uniquement)
npm run ios

# Web
npm run web

# Lancer avec tunnel (pour tester sans être sur le même réseau)
npm run tunnel

# Pour lancer dans un environment local:
npm run local
```

### Utiliser Expo Go

1. Installer **Expo Go** sur votre appareil mobile :
    - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
    - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scanner le QR code affiché dans le terminal

3. L'application se charge automatiquement sur votre appareil

---

## Technologies utilisées

### Core

- **React Native** `0.81.5` - Framework mobile multiplateforme
- **Expo** `~54.0.12` - Toolchain et SDK
- **Expo Router** `~6.0.10` - Navigation file-based
- **React** `19.1.0` - Bibliothèque UI

### Navigation

- **@react-navigation/native** `^7.1.8` - Navigation
- **@react-navigation/bottom-tabs** `^7.4.0` - Onglets
- **@react-navigation/elements** `^2.6.3` - Éléments de navigation
- **react-native-screens** `~4.16.0` - Écrans natifs
- **react-native-safe-area-context** `~5.6.0` - Safe area

### État et données

- **React Context API** - Gestion d'état globale
- **AsyncStorage** `2.2.0` - Stockage local persistant
- **Expo Secure Store** `^15.0.7` - Stockage sécurisé (clés E2EE)
- **WebSocket** - Communication temps réel

### Cryptographie et Sécurité (E2EE)

- **tweetnacl** `^1.0.3` - Cryptographie (NaCl)
- **tweetnacl-util** `^0.15.1` - Utilitaires pour NaCl
- **jsrsasign** `^11.1.0` - Signature et chiffrement RSA/JWT
- **aes-js** `^3.1.2` - Chiffrement AES
- **expo-crypto** `~15.0.7` - API crypto native Expo
- **expo-random** `^14.0.1` - Génération nombres aléatoires sécurisés
- **react-native-quick-crypto** `^0.7.17` - Implémentation crypto native
- **react-native-get-random-values** `^2.0.0` - Polyfill pour crypto.getRandomValues

### Audio et Médias

- **expo-av** `^16.0.7` - Audio/Vidéo (messages vocaux)
- **expo-document-picker** `^14.0.7` - Sélection de documents
- **expo-image-picker** `^17.0.8` - Sélection d'images/caméra
- **expo-file-system** `^19.0.19` - Système de fichiers

### UI/UX

- **Expo Vector Icons** `^15.0.2` - Icônes
- **Expo Image** `~3.0.8` - Optimisation images
- **React Native Reanimated** `~4.1.1` - Animations
- **React Native Gesture Handler** `~2.28.0` - Gestes tactiles
- **@expo/react-native-action-sheet** `^4.1.1` - Action sheets natifs
- **Expo Haptics** `~15.0.7` - Retours haptiques

### Internationalisation

- **i18next** `^25.5.3` - Gestion des traductions
- **react-i18next** `^16.0.0` - Intégration React

### Monitoring et Debug

- **@sentry/react-native** `^7.6.0` - Suivi des erreurs et performances

### Développement

- **TypeScript** `~5.9.2` - Typage statique
- **ESLint** `^9.25.0` - Linting
- **eslint-config-expo** `~10.0.0` - Config ESLint Expo
- **ora** `^5.4.1` - Spinner pour scripts CLI

---

## API et WebSocket

### Endpoints REST API

>**Important** : Tous les endpoints sont préfixés par API_BASE_URL, qui inclut /chatappAPI.

#### Authentification

```javascript
// Inscription
POST /register
Body: { username, email, password }
Response: { success, message, data: { user, token } }

// Connexion
POST /login
Body: { email, password }
Response: { 
  success, 
  message, 
  data: { 
    user: { id, username, email, ... }, 
    token,
    mfa_required?: true,  // Si MFA activé
    temp_token?: string   // Token temporaire pour MFA
  } 
}

// Déconnexion
POST /logout
Headers: { Authorization: Bearer <token> }

// Utilisateur courant
GET /me
Headers: { Authorization: Bearer <token> }
Response: { user: { id, username, email, theme, mfa_enabled, ... } }
```

#### MFA (Multi-Factor Authentication)

```javascript
// Activer/Désactiver MFA
POST /mfa/toggle
Body: { mfa_enabled: boolean, password?: string }
Response: { success, message }

// Vérifier code MFA
POST /mfa/verify
Body: { email, code, temp_token }
Response: { success, message, data: { user, token } }

// Renvoyer code MFA
POST /mfa/resend
Body: { email, temp_token }
Response: { success, message }
```

#### E2EE (End-to-End Encryption)

```javascript
// Enregistrer clé publique
POST /e2ee/keys/register
Body: { public_key }
Response: { success, message }

// Récupérer clé publique d'un utilisateur
GET /e2ee/keys/:userId
Response: { success, data: { public_key } }

// Activer E2EE pour un DM
POST /dm/:dmId/e2ee/enable
Response: { success, data: { e2ee_enabled, e2ee_enabled_by } }

// Désactiver E2EE pour un DM
POST /dm/:dmId/e2ee/disable
Response: { success, message }

// Récupérer clé de session chiffrée
GET /dm/:dmId/e2ee/session-key
Response: { success, data: { encrypted_session_key } }

// Distribuer clé de session
POST /dm/:dmId/e2ee/session-key
Body: { encrypted_keys: [{ user_id, encrypted_key }] }
Response: { success, message }
```

#### Utilisateurs

```javascript
// Liste des utilisateurs
GET /user
Headers: { Authorization: Bearer <token> }

// Détails utilisateur
GET /user/:userId
Headers: { Authorization: Bearer <token> }

// Mettre à jour utilisateur
PUT /user/:userId
Headers: { Authorization: Bearer <token> }
Body: { ...userData }

// Supprimer utilisateur
DELETE /user/:userId
Headers: { Authorization: Bearer <token> }

// Préférences notifications
POST /user/notifications/:notificationType
PUT /user/:userId/lang/:lang

```

#### Salons (Channels)

```javascript
// Liste des salons
GET /channel
GET /channel/public
GET /my-channels

// Détails salon
GET /channel/:channelId

// Créer un salon
POST /channel
Body: { ...channelData }

// Mettre à jour un salon
PUT /channel/:channelId
Body: { ...channelData }

// Supprimer un salon
DELETE /channel/:channelId

// Rejoindre / quitter
POST /channel/:channelId/join
POST /channel/:channelId/leave

// Inviter un utilisateur
POST /channel/:channelId/invite
Body: { user_id, message }
```

#### Messages

```javascript
// Récupérer messages
GET /channel/:channelId/message?limit=50

// Envoyer un message
POST /channel/:channelId/message
Body: { content, type?: 'text'|'voice'|'attachment' }

// Récupérer message spécifique
GET /channel/:channelId/message/:messageId

// Supprimer message
DELETE /message/:messageId
```

#### Tickets (Support)

```javascript
// Liste des tickets
GET /tickets
Response: { success, data: [tickets] }

// Détails d'un ticket
GET /tickets/:ticketId
Response: { success, data: ticket }

// Créer un ticket
POST /tickets
Body: { title, description, priority: 'low'|'medium'|'high' }
Response: { success, data: ticket }

// Mettre à jour statut
PUT /tickets/:ticketId/status
Body: { status: 'open'|'in_progress'|'resolved'|'closed' }

// Mettre à jour priorité
PUT /tickets/:ticketId/priority
Body: { priority: 'low'|'medium'|'high' }

// Assigner à un admin
POST /tickets/:ticketId/assign
Body: { admin_id }

// Ajouter un commentaire
POST /tickets/:ticketId/comments
Body: { content }

// Récupérer commentaires
GET /tickets/:ticketId/comments

// Supprimer un ticket (admin uniquement, resolved/closed uniquement)
DELETE /tickets/:ticketId
```

#### Notifications

```javascript
// Types de notifications disponibles
GET /notification-types
Response: { success, data: [{ id, type, type_en, type_fr }] }

// Préférences utilisateur
GET /users/:userId/notification-types
Response: { success, data: [disabled_notification_types] }

// Toggle notification
POST /users/notifications/:notificationTypeId
Response: { success, message }
```

#### Statistiques

```javascript
// Statistiques utilisateur
GET /user/:userId/stats
Response: { 
  success, 
  data: { 
    stats: {
      total_messages,
      total_channels,
      top_channels: [{ name, total }],
      activity_by_day: { monday: count, ... }
    }
  }
}
```
```

#### DMs

```javascript
// Liste des DMs
GET /dm

// Créer un DM
POST /dm
Body: { recipientId }

// Détails DM
GET /dm/:dmId

// Messages DM
GET /dm/:dmId/message?limit=50
    POST /dm/:dmId/message
Body: { content }
```

#### Invitations

```javascript
// Liste des invitations
GET /invitations
GET /invitations/count

// Accepter / refuser invitation
POST /invitations/:invitationId/accept
POST /invitations/:invitationId/reject
```

### WebSocket Events

#### Connexion et authentification

```javascript
// Se connecter au WebSocket
ws://<server>

// Message d'authentification
{
    type: 'authenticate',
        token: '<jwt_token>',
    userId: 123,
    username: 'john',
    channel: 1,
    dmChannelIds: [5, 7]
}

// Réponse
{
    type: 'authenticated',
        userId: 123,
    username: 'john'
}
```

#### Messages

```javascript
// Nouveau message
{
    type: 'redis_message',
        channelId: 1,
    message: { id, content, userId, username, created_at }
}

// Notification message (autre salon)
{
    type: 'redis_message_notif',
        channelId: 2,
    message: { ... }
}
```

#### Indicateurs de frappe

```javascript
// Utilisateur commence à écrire
{ type: 'typing_start', channelId: 1 }

// Utilisateur arrête d'écrire
{ type: 'typing_stop', channelId: 1 }

// Recevoir événements
{ type: 'user_typing_start', channelId: 1, userId, username }
{ type: 'user_typing_stop', channelId: 1, userId, username }
```

#### Présence utilisateurs

```javascript
{ type: 'user_connected', userId, username }
{ type: 'user_disconnected', userId, username }
{ type: 'initial_online_users', users: [{ userId, username }, ...] }
```

#### Invitations et DM

```javascript
{ type: 'new_invitation', channelId, channelName, inviterId, inviterName }
{ type: 'invitation_accepted', channelId, userId, username }
{ type: 'dm_created', channel: { id, name, isDirect, members: [] } }
```

#### E2EE (Chiffrement de bout en bout)

```javascript
// État E2EE changé pour un DM
{ 
  type: 'e2ee_status_changed', 
  channelId: 5, 
  dmId: 5,
  enabled: true, 
  enabledBy: 10 
}

// DM E2EE activé
{ 
  type: 'dm_e2ee_enabled', 
  dmId: 5, 
  enabledBy: 10,
  enabledByName: 'Alice'
}

// DM E2EE désactivé
{ 
  type: 'dm_e2ee_disabled', 
  dmId: 5, 
  disabledBy: 10 
}
```

---

## 🌐 Connexion via Nginx (Production)

### Architecture réseau

En production, l'application mobile se connecte via Nginx qui agit comme reverse proxy unique pour l'API et le WebSocket.
```
Mobile App
    ↓
Nginx (:80/:443)
    ├─→ API Laravel (:8000)
    └─→ WebSocket (:3001)
```

### Configuration des URLs

#### Développement (local)

**Fichier : `config/api.js`**
```javascript
// Connexion directe aux services (sans Nginx)
export const API_BASE_URL = 'http://192.168.1.100:8080/chatappAPI';
export const WS_URL = 'ws://192.168.1.100:3001';
```

#### Production (via Nginx)

**Fichier : `config/api.js`**
```javascript
// Connexion via Nginx (recommandé)
export const API_BASE_URL = 'https://chatapp-xp.fun/chatappAPI';
export const WS_URL = 'wss://chatapp-xp.fun/ws';
```

### Configuration WebSocket pour Nginx

Lorsque tu utilises Nginx, le client WebSocket doit spécifier le path correct :

**Fichier : `services/websocketService.js`**
```javascript
// Développement (connexion directe)
this.ws = new WebSocket('ws://192.168.1.100:3001');

// Production (via Nginx)
this.ws = new WebSocket('wss://chatapp-xp.fun/ws');
```

### Ajustements pour la production

1. **Mise à jour automatique des URLs** :

Créer un script `config/environment.js` :
```javascript
import { Platform } from 'react-native';

const ENV = {
  dev: {
    API_BASE_URL: 'http://192.168.1.100:8080/chatappAPI',
    WS_URL: 'ws://192.168.1.100:3001',
  },
  prod: {
    API_BASE_URL: 'https://chatapp-xp.fun/chatappAPI',
    WS_URL: 'wss://chatapp-xp.fun/ws',
  }
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars;
```

2. **Utiliser dans les services** :

**Fichier : `config/api.js`**
```javascript
import getEnvVars from './environment';

const { API_BASE_URL, WS_URL } = getEnvVars();

export { API_BASE_URL, WS_URL };
```

### Headers et sécurité avec Nginx

Nginx ajoute automatiquement des headers de sécurité et de proxy :
```
X-Real-IP: <client_ip>
X-Forwarded-For: <client_ip>
X-Forwarded-Proto: https
```

Ces headers sont transparents pour l'application mobile, mais assurent :
- ✅ Identification correcte de l'IP client
- ✅ Détection du protocole (HTTP/HTTPS)
- ✅ Support du SSL/TLS
- ✅ Compression gzip des réponses

### Debugging en production

1. **Vérifier l'état de Nginx** :
```bash
docker-compose exec nginx nginx -t
docker-compose logs -f nginx
```

2. **Vérifier les certificats SSL** :
```bash
docker-compose exec nginx ls -la /etc/nginx/certs
```

## Gestion des états

L'application utilise **React Context API** pour la gestion d'état globale, organisée en contextes spécialisés :

### AuthContext

Gère l'authentification, les informations utilisateur et les préférences de notifications.

```javascript
const {
    user,                            // Utilisateur connecté
    isAuthenticated,             // Booléen indiquant si l'utilisateur est authentifié
    isLoading,                   // État de chargement pour l'authentification
    login,                       // Fonction de connexion
    logout,                      // Fonction de déconnexion
    register,                    // Fonction d'inscription
    updateUser,                  // Met à jour les informations utilisateur
    checkAuthStatus,             // Vérifie le statut de connexion
    notificationPreferences,     // Préférences de notifications
    isNotificationTypeEnabled,   // Vérifie si un type de notification est activé
    refreshNotificationPreferences // Recharge les préférences de notification
} = useAuth();

```

**Fonctionnalités** :
- Stockage sécurisé des informations utilisateur et préférences dans AsyncStorage
- Gestion de l'état d'authentification (isAuthenticated, isLoading)
- **Support MFA (Multi-Factor Authentication)** : gestion des tokens temporaires et vérification des codes
- Connexion et synchronisation WebSocket pour les DMs et notifications
- Déconnexion automatique sur erreur 401 ou expiration de token
- Gestion des préférences de notifications (types désactivés, cache local)
- Rechargement automatique des préférences utilisateur (MFA, thème, langue)

### ChannelsContext

Gère la liste des salons et les opérations sur les channels.

```javascript
const {
    channels,           // Liste des salons publics/privés
    dms,                // Liste des conversations directes (DM)
    selectedChannel,    // Salon ou DM actif
    loading,            // État de chargement
    loadChannels,       // Fonction pour récupérer les salons et DMs
    createChannel,      // Créer un nouveau salon
    joinChannel,        // Rejoindre un salon
    leaveChannel,       // Quitter un salon
    createDM,           // Créer une conversation directe
    selectChannel       // Définir le salon ou DM actif
} = useChannels();
```

**Fonctionnalités** :
- Chargement automatique des salons et DMs depuis l'API
- Création, jointure et sortie de salons
- Création de DMs avec notifications utilisateur
- Synchronisation en temps réel via WebSocket pour les événements de channel et DM
- Mise à jour automatique du channel actif

### MessagesContext

Gère les messages d'un salon ou DM et la connexion WebSocket.

```javascript
const {
    messages,           // Messages du salon ou DM actif
    loading,            // État de chargement des messages
    currentChannelId,   // ID du salon ou DM actif
    typingUsers,        // Utilisateurs en train d'écrire
    loadMessages,       // Charger l'historique des messages
    sendMessage,        // Envoyer un message
    deleteMessage,      // Supprimer un message
    startTyping,        // Indiquer que l'utilisateur tape
    stopTyping,         // Indiquer que l'utilisateur a arrêté de taper
    clearMessages,      // Vider les messages et reset le channel actif
    setCurrentChannelId // Définir le channel actif
} = useMessages();
```

**Fonctionnalités** :
- Connexion et reconnection WebSocket automatique
- Synchronisation en temps réel des messages et indicateurs de frappe
- Gestion des notifications de nouveaux messages (avec déduplication)
- Extraction et affichage automatique du nom des participants pour les DMs
- Cache local des messages pour une meilleure réactivité

### OnlineUsersContext

Gère la liste globale et par channel des utilisateurs en ligne.

```javascript
const {
    onlineUsers,           // Liste globale des utilisateurs en ligne
    channelOnlineUsers,    // Liste des utilisateurs en ligne par channel
    isUserOnline,          // Vérifie si un utilisateur est en ligne
    getChannelOnlineUsers, // Obtenir les utilisateurs en ligne d'un channel spécifique
    getAllOnlineUsers,     // Obtenir tous les utilisateurs en ligne globalement
    clearOnlineUsers       // Réinitialiser toutes les listes d'utilisateurs en ligne
} = useOnlineUsers();
```

**Fonctionnalités** :
- Gestion en temps réel des utilisateurs connectés/déconnectés via WebSocket
- Synchronisation des utilisateurs en ligne par channel et globalement
- Mise à jour automatique lors de la connexion ou déconnexion de l’utilisateur courant
- Prévention des doublons dans les listes

---
## 🔐 Chiffrement E2EE et Sécurité

### Architecture E2EE

L'application implémente un système de **chiffrement de bout en bout (E2EE)** pour les messages directs (DM) utilisant une combinaison de cryptographie asymétrique (RSA) et symétrique (AES).

#### Flux de chiffrement

```
1. Génération des clés
   ├─ Clé RSA privée (stockée localement dans SecureStore)
   ├─ Clé RSA publique (synchronisée avec le serveur)
   └─ Clés de session AES-256 (par DM)

2. Activation E2EE sur un DM
   ├─ Utilisateur A active E2EE
   ├─ Génération clé de session AES-256
   ├─ Chiffrement de la clé avec RSA public de chaque participant
   └─ Distribution via API

3. Envoi d'un message chiffré
   ├─ Récupération de la clé de session (déchiffrée avec RSA privée)
   ├─ Chiffrement du message avec AES-256
   ├─ Envoi du message chiffré via WebSocket
   └─ Déchiffrement par le destinataire

4. Réception d'un message chiffré
   ├─ Réception via WebSocket
   ├─ Récupération de la clé de session du DM
   ├─ Déchiffrement avec AES-256
   └─ Affichage du message en clair
```

### Services E2EE

#### CryptoService.js
Services cryptographiques de base :
- Génération de clés RSA (2048 bits)
- Chiffrement/déchiffrement RSA
- Chiffrement/déchiffrement AES-256
- Conversions (base64, hex, utf8)
- Génération de nonces aléatoires sécurisés

#### E2EEKeyManager.js
Gestion des clés :
- Génération automatique des paires de clés RSA au premier lancement
- Stockage sécurisé dans `SecureStore` (iOS Keychain / Android Keystore)
- Synchronisation de la clé publique avec le serveur
- Récupération des clés publiques des autres utilisateurs
- Cache local pour optimisation

#### E2EEManager.js
Manager principal E2EE :
- Création et distribution des clés de session AES
- Chiffrement/déchiffrement des clés de session avec RSA
- Gestion du cache des clés de session par DM
- Validation de l'état E2EE d'un DM
- Gestion des erreurs de chiffrement

#### E2EEDMService.js
Services spécifiques aux DMs :
- Activation/désactivation E2EE pour un DM
- Vérification des permissions (seul l'activateur peut désactiver)
- Synchronisation de l'état E2EE avec le serveur
- Gestion du cache local de l'état E2EE
- Événements WebSocket pour sync multi-appareils

#### E2EEMessageService.js
Chiffrement/déchiffrement des messages :
- Chiffrement des messages texte avant envoi
- Déchiffrement des messages reçus
- Gestion des messages non chiffrés (fallback)
- Validation de l'intégrité des messages

### Utilisation du E2EE

#### Activer E2EE sur un DM

```javascript
import E2EEDMService from './services/crypto/E2EEDMService';

// Initialiser E2EE (génère les clés si nécessaire)
await E2EEDMService.initialize();

// Activer E2EE pour un DM
const result = await E2EEDMService.enableE2EE(dmId, currentUserId);
if (result) {
    console.log('✅ E2EE activé avec succès');
}

// Désactiver E2EE (uniquement si currentUserId = activateur)
const canDisable = E2EEDMService.canToggleE2EE(dmId, currentUserId);
if (canDisable.canDisable) {
    await E2EEDMService.disableE2EE(dmId, currentUserId);
}
```

#### Composant E2EEToggle

```jsx
import { E2EEToggle } from './components/E2EEToggle';

<E2EEToggle 
    dmId={currentDM.id} 
    currentUserId={user.id}
    theme={theme}
/>
```

Le toggle affiche :
- 🔒 **Vert** si E2EE activé
- 🔓 **Rouge** si E2EE désactivé
- **Indication de qui a activé** l'E2EE
- **Verrouillage** si activé par un autre utilisateur (impossible de désactiver)

#### Envoyer un message chiffré

```javascript
import E2EEMessageService from './services/crypto/E2EEMessageService';

// Le chiffrement est automatique si E2EE est activé sur le DM
const messageToSend = {
    content: 'Message secret',
    channel_id: dmId
};

// E2EEMessageService.encryptMessage() est appelé automatiquement
// par le MessagesContext avant l'envoi
```

### Sécurité des clés

#### Stockage sécurisé

```javascript
// iOS: Keychain Services
// Android: Android Keystore System
import * as SecureStore from 'expo-secure-store';

// Sauvegarde de la clé privée (format PEM)
await SecureStore.setItemAsync('e2ee_private_key', privateKeyPem);

// Récupération
const privateKey = await SecureStore.getItemAsync('e2ee_private_key');

// Suppression (lors de la déconnexion)
await SecureStore.deleteItemAsync('e2ee_private_key');
```

#### Bonnes pratiques implémentées

1. ✅ **Les clés privées ne quittent JAMAIS l'appareil**
2. ✅ **Les clés de session sont générées aléatoirement par DM**
3. ✅ **Chiffrement AES-256 en mode GCM**
4. ✅ **Nonces aléatoires sécurisés pour chaque opération**
5. ✅ **Validation de l'intégrité avec signatures**
6. ✅ **Stockage sécurisé natif (Keychain/Keystore)**
7. ✅ **Synchronisation temps réel de l'état E2EE via WebSocket**

### Limitations et considérations

- ⚠️ **E2EE uniquement pour les DMs** : Les salons publics/privés n'utilisent pas E2EE
- ⚠️ **Pas de récupération de clé** : Si l'appareil est perdu, les messages E2EE passés sont inaccessibles
- ⚠️ **Un seul appareil par utilisateur** : Pas de synchronisation multi-appareils des clés privées
- ⚠️ **Désactivation réservée à l'activateur** : Protection contre la désactivation non autorisée
- ⚠️ **Pas de forward secrecy** : Les clés de session ne changent pas automatiquement
- ℹ️ **Métadonnées non chiffrées** : Émetteur, destinataire, timestamps visibles par le serveur

### Dépendances cryptographiques

```json
{
  "tweetnacl": "^1.0.3",           // NaCl (Networking and Cryptography library)
  "tweetnacl-util": "^0.15.1",     // Utilitaires pour NaCl
  "jsrsasign": "^11.1.0",          // RSA/JWT signature et chiffrement
  "aes-js": "^3.1.2",              // Chiffrement AES-256
  "expo-crypto": "~15.0.7",        // API crypto native Expo
  "expo-random": "^14.0.1",        // Génération aléatoire sécurisée
  "expo-secure-store": "^15.0.7"   // Stockage sécurisé natif
}
```

### MFA (Multi-Factor Authentication)

#### Flux d'authentification avec MFA

```
1. Connexion classique
   ├─ Utilisateur saisit email + password
   ├─ Vérification des credentials
   └─ Si MFA activé → Génération code 6 chiffres

2. Vérification MFA
   ├─ Envoi du code par email (valide 10 minutes)
   ├─ Token JWT temporaire (valide 1 heure)
   ├─ Affichage modal MFAVerifyModal
   ├─ Utilisateur saisit le code à 6 chiffres
   ├─ Vérification du code via /mfa/verify
   └─ Si valide → Token JWT permanent + connexion

3. Renvoyer le code
   ├─ Bouton "Renvoyer" dans MFAVerifyModal
   ├─ Timer de 60 secondes entre chaque renvoi
   └─ Nouveau code généré et envoyé

4. Activation MFA
   ├─ Paramètres → Toggle MFA ON
   ├─ Confirmation par modal
   └─ MFA activé (codes envoyés à chaque connexion)

5. Désactivation MFA
   ├─ Paramètres → Toggle MFA OFF
   ├─ Modal MFAPasswordModal (demande password)
   ├─ Vérification du password
   └─ MFA désactivé
```

#### Composants MFA

- **MFAVerifyModal.jsx** : Saisie et vérification du code à 6 chiffres avec timer et renvoi
- **MFAPasswordModal.jsx** : Confirmation du password pour désactiver MFA
- **MFADisableModal.jsx** : Alternative pour désactivation avec password et confirmation

#### API MFA

```javascript
// Activer MFA
POST /mfa/toggle
Body: { mfa_enabled: true }
Response: { success: true, message: 'MFA activé' }

// Désactiver MFA (nécessite password)
POST /mfa/toggle
Body: { mfa_enabled: false, password: 'userPassword' }
Response: { success: true, message: 'MFA désactivé' }

// Vérifier code MFA
POST /mfa/verify
Body: { email, code, temp_token }
Response: { success: true, data: { user, token } }

// Renvoyer code MFA
POST /mfa/resend
Body: { email, temp_token }
Response: { success: true, message: 'Code renvoyé' }
```

#### Sécurité MFA

1. ✅ **Codes à usage unique** : Expiration après 10 minutes
2. ✅ **Rate limiting** : Protection contre brute force
3. ✅ **Token temporaire** : Valide 1 heure uniquement pour vérification
4. ✅ **Password requis** : Pour désactiver MFA
5. ✅ **Notification email** : À chaque connexion MFA

---

## Internationalisation

L'application supporte **Français** et **Anglais** avec i18next.

### Configuration

**Fichier : `app/_layout.jsx`**

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        fr: { translation: fr }
    },
    lng: 'fr', // Langue par défaut
    fallbackLng: 'fr',
    interpolation: { escapeValue: false }
});
```

### Utilisation dans les composants

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
    const { t, i18n } = useTranslation();

    return (
        <View>
            <Text>{t('login.title')}</Text>
            <Button onPress={() => i18n.changeLanguage('en')}>
                {t('settings.language')}
            </Button>
        </View>
    );
}
```

### Fichiers de traduction

**`locales/fr.json`**

```json
{
  "login": {
    "title": "Connexion",
    "username": "Nom d'utilisateur",
    "password": "Mot de passe",
    "submit": "Se connecter"
  },
  "channels": {
    "title": "Salons",
    "create": "Créer un salon"
  }
}
```

**`locales/en.json`**

```json
{
  "login": {
    "title": "Login",
    "username": "Username",
    "password": "Password",
    "submit": "Sign In"
  },
  "channels": {
    "title": "Channels",
    "create": "Create Channel"
  }
}
```

---

## Tests

### Lancer ESLint

```bash
npm run lint
```

## Scripts disponibles

```bash
# Démarrer le serveur de développement
npm start

# Préparer et démarrer en local (met à jour l'IP automatiquement)
npm run prelocal
npm run local

# Démarrer sur Android
npm run android

# Démarrer sur iOS (macOS uniquement)
npm run ios

# Démarrer sur Web
npm run web

# Lancer avec tunnel (pour réseau différent)
npm run tunnel

# Lancer ESLint
npm run lint

# Réinitialiser le projet (supprime exemple de code)
npm run reset-project

# Mettre à jour l'IP locale dans config/api.js
node set-ip.js
```

---

## Dépannage

### Problème : Metro Bundler ne démarre pas

```bash
# Nettoyer le cache
npx expo start --clear

# Ou supprimer node_modules et réinstaller
rm -rf node_modules
npm install
```

### Problème : Erreur de connexion à l'API

1. Vérifier que le backend est démarré :
   ```bash
   docker ps
   # API doit être sur port 8080, WebSocket sur 3001
   ```

2. Vérifier l'IP dans `config/api.js` :
   ```bash
   node set-ip.js
   cat config/api.js
   ```

3. Vérifier la connectivité réseau :
    - Appareil mobile et PC doivent être sur le même réseau Wi-Fi
    - Pare-feu Windows/Mac ne bloque pas les ports 8080 et 3001

### Problème : WebSocket se déconnecte fréquemment

1. Vérifier les logs du serveur WebSocket
2. Augmenter le timeout de reconnexion dans `services/websocketService.js` :
   ```javascript
   this.reconnectDelay = 5000; // 5 secondes au lieu de 2
   ```

### Problème : AsyncStorage corruption

```bash
# Réinitialiser l'app sur l'appareil
# Android
adb shell pm clear host.exp.exponent

# iOS
Supprimer l'app et réinstaller
```

### Problème : E2EE ne fonctionne pas

1. **Vérifier les clés dans SecureStore** :
   ```bash
   # Les clés doivent être présentes après l'initialisation
   # Vérifier les logs: [E2EE] Loaded keys from SecureStore
   ```

2. **Réinitialiser les clés E2EE** :
    - Se déconnecter de l'application
    - Supprimer l'app et réinstaller
    - Se reconnecter (nouvelles clés générées automatiquement)

3. **Vérifier les permissions** :
    - Seul l'utilisateur qui active l'E2EE peut le désactiver
    - Vérifier les logs: `[E2EE] État E2EE calculé: {enabled, enabledBy}`

### Problème : Messages vocaux ne s'enregistrent pas

1. **Vérifier les permissions microphone** :
   ```javascript
   // Android: RECORD_AUDIO dans app.json
   // iOS: NSMicrophoneUsageDescription dans app.json
   ```

2. **Tester les permissions** :
   ```bash
   # Android
   adb shell pm grant host.exp.exponent android.permission.RECORD_AUDIO
   ```

3. **Vérifier expo-av** :
   ```bash
   npx expo install expo-av
   ```

### Problème : MFA - Code non reçu

1. **Vérifier l'email dans les logs backend**
2. **Vérifier le service d'email (Mailtrap, SMTP)**
3. **Renvoyer le code** via le bouton "Renvoyer le code" dans la modal MFA

### Problème : Pièces jointes ne s'envoient pas

1. **Vérifier les permissions caméra/galerie** :
   ```javascript
   // iOS: NSCameraUsageDescription, NSPhotoLibraryUsageDescription
   ```

2. **Taille maximale** : 5MB par fichier
3. **Vérifier expo-image-picker et expo-document-picker** :
   ```bash
   npx expo install expo-image-picker expo-document-picker
   ```

### Problème : Expo Go ne se connecte pas

1. **Utiliser le tunnel** :
   ```bash
   npx expo start --tunnel
   ```

2. **Vérifier le pare-feu** :
    - Autoriser Node.js dans le pare-feu Windows
    - Autoriser les connexions entrantes sur port 8081

3. **Réinitialiser Expo** :
   ```bash
   npx expo start --clear --reset-cache
   ```

### Problème : Erreur "Module not found"

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

# Redémarrer Metro
npx expo start --clear
```

### Logs et debugging

```bash
# Voir les logs en direct
npx expo start

# Logs Android
adb logcat *:S ReactNative:V ReactNativeJS:V

# Logs iOS
# Utiliser la console Xcode
```

---

## Ressources du projet

- **Repo Desktop** : [chatapp-desktop](https://github.com/ZacharyBombardier/ChatApp_Multiplateforme)
- **Repo React-Native** : [chatapp-mobile](https://github.com/ZacharyBombardier/MultiPlat-chatapp-ReactNative)
- **Repo API** : [chatapp-api](https://github.com/Zack7292/MultiPlat-chatapp-API)
- **Repo Serveur WebSocket** : [chatapp-ws](https://github.com/Zack7292/MultiPlat-ChatApp-WS)

---

## 👥 Équipe

- **Zack Livernois** - Développement full-stack, architecture E2EE
- **Zachary Bombardier** - Développement mobile, UI/UX Windows XP
- **Antoine Davignon** - Backend API, WebSocket, MFA
- **Bradley Fortin** - Tickets, statistiques, documentation
- **Samuel Grenier** - Tests, déploiement, DevOps

---

## 📄 Licence

Ce projet est développé dans un cadre académique pour le cours de développement multi-plateforme.

**© 2025 - Équipe ChatApp XP - Tous droits réservés**

---

## 🙏 Remerciements

- **Expo Team** pour l'excellent framework
- **React Native Community** pour les packages essentiels
- **Microsoft** pour l'inspiration Windows XP nostalgique
- **TweetNaCl** pour la bibliothèque cryptographique robuste

---

**Dernière mise à jour** : 4 décembre 2025

**Version** : 1.0.0

**Environnement** : Production-ready

> **Note** : CE README A ÉTÉ GÉNÉRÉ EN PARTIE À L'AIDE DE L'INTELLIGENCE ARTIFICIELLE (GitHub Copilot) POUR ACCÉLÉRER LA DOCUMENTATION DU PROJET.

---

⭐ **N'oubliez pas de mettre une étoile si vous aimez ce projet !** ⭐
