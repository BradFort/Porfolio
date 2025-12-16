# ChatApp XP - Application de Chat Multiplateforme

## 🎯 Vue d'ensemble

ChatApp XP est une application de messagerie instantanée multiplateforme développée avec Electron, JavaScript et WebSocket. L'interface s'inspire du design nostalgique de Windows XP tout en offrant des fonctionnalités modernes de chat en temps réel, incluant le chiffrement de bout en bout (E2EE), les messages vocaux, les pièces jointes, l'authentification multi-facteurs et un système de tickets de support.

**Version actuelle** : 1.0.0

**Auteurs** : Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier

---

## ✨ Fonctionnalités

### 🔐 Authentification et Sécurité
- ✅ **Système d'authentification complet** (inscription/connexion/déconnexion)
- ✅ **Authentification multi-facteurs (MFA/2FA)**
- ✅ **Tokens JWT** sécurisés avec encodage base64
- ✅ **Chiffrement de bout en bout (E2EE)** avec TweetNaCl
- ✅ **Gestion des clés cryptographiques** sécurisées
- ✅ **Validation des entrées** (anti-injection, XSS)
- ✅ **Limite de connexions** (protection anti-spam)
- ✅ **Content Security Policy** stricte
- ✅ **Stockage sécurisé** des tokens avec SecureStorage

### 💬 Messagerie
- ✅ **Chat en temps réel** via WebSocket (Socket.IO)
- ✅ **Messages directs (DM)** chiffrés entre utilisateurs
- ✅ **Salons publics et privés**
- ✅ **Messages vocaux**
- ✅ **Pièces jointes**
- ✅ **Messages chiffrés E2EE** pour les conversations privées
- ✅ **Historique des messages** avec pagination
- ✅ **Indicateurs de frappe** en temps réel
- ✅ **Notifications** (push système et internes)
- ✅ **Limite de messages** (10 000 caractères)
- ✅ **Suppression de messages** (utilisateur et admin)
- ✅ **Mode hors ligne** avec file d'attente de messages

### 👥 Gestion d'utilisateurs
- ✅ **Authentification complète** (inscription/connexion/MFA)
- ✅ **Profils utilisateurs** avec avatars
- ✅ **Statuts utilisateur** (En ligne, Absent, Occupé, Hors ligne)
- ✅ **Liste d'utilisateurs** dynamique en temps réel
- ✅ **Panel administrateur** pour la gestion
- ✅ **Gestion des permissions** (admin/utilisateur)
- ✅ **Préférences utilisateur** (langue, notifications, thème, MFA)
- ✅ **Statistiques personnelles**

### 📢 Canaux et Organisation
- ✅ **Création de canaux** publics/privés
- ✅ **Système d'invitations** pour canaux privés
- ✅ **Gestion des invitations** (accepter/refuser avec notifications)
- ✅ **Rejoindre/quitter** des canaux
- ✅ **Gestion des permissions** par canal
- ✅ **Compteur d'invitations** en temps réel avec badge
- ✅ **Liste des membres** par canal

### 🎫 Système de Tickets
- ✅ **Création de tickets** de support
- ✅ **Gestion des tickets** (ouvert, en cours, résolu, fermé)
- ✅ **Priorités** (basse, normale, haute, urgente)
- ✅ **Assignation aux administrateurs**
- ✅ **Commentaires** sur les tickets
- ✅ **Page de détails** des tickets avec internationalisation
- ✅ **Filtrage et tri** des tickets
- ✅ **Notifications** sur les changements de statut
- ✅ **Support du thème** dans la page de détails

### 🎨 Interface Utilisateur
- ✅ **Design Windows XP** authentique
- ✅ **Notifications visuelles** et sonores
- ✅ **Internationalisation (i18n)** - Support multilingue (FR/EN)
  - Changement de langue en temps réel
  - Traduction complète de l'interface
  - Support dans les modales et pages secondaires
  - Bouton de changement rapide dans la barre de menu
- ✅ **Animations fluides** et transitions
- ✅ **Modales modernes** pour les interactions

### 📊 Statistiques et Monitoring
- ✅ **Page de statistiques** pour admins et utilisateurs
- ✅ **Suivi des erreurs** avec Sentry
- ✅ **Logs détaillés** des actions utilisateur
- ✅ **Monitoring WebSocket** (connexion/déconnexion)

### 🔧 Autres Fonctionnalités
- ✅ **Gestion des erreurs** robuste
- ✅ **Système d'événements** personnalisé
- ✅ **Reconnexion automatique** WebSocket avec backoff exponentiel
- ✅ **Cache local** avec localStorage
- ✅ **Mises à jour automatiques** (electron-updater)
- ✅ **Support multi-fenêtres**

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│  Client (Electron/React Native) │
└────────────┬────────────────────┘
             │
             │ HTTP Request
             ▼
        ┌─────────┐
        │   API   │
        └────┬────┘
             │
             │ Publish/Subscribe
             ▼
        ┌─────────┐
        │  Redis  │
        └────┬────┘
             │
             │ Event Notification
             ▼
      ┌─────────────┐
      │  WebSocket  │
      └──────┬──────┘
             │
             │ Real-time Push
             ▼
┌─────────────────────────────────┐
│  Client (Electron/React Native) │
└─────────────────────────────────┘
```

### Modularité

**Processus principal (Main)**
- `src/main/index.js` - Point d'entrée Electron
- `src/main/api.js` - Configuration API
- `src/main/services/ChatService.js` - Service de gestion du chat
- `src/main/services/WebSocketListener.js` - Gestionnaire WebSocket

**Modèles de données**
- `src/models/User.js` - Modèle utilisateur
- `src/models/Message.js` - Modèle message
- `src/models/Channel.js` - Modèle canal
- `src/models/DirectMessagesChannel.js` - Modèle DM
- `src/models/MessageReceiver.js` - Récepteur de messages

**Interface utilisateur (Renderer)**
- `src/renderer/src/components/auth/` - Authentification
- `src/renderer/src/components/chat/` - Interface de chat principale
  - `channel/` - Gestion des canaux
  - `gestionEtat/` - Gestion d'état
  - `htmlEvents/` - Événements DOM
  - `theme/` - Gestion des thèmes
  - `ui/` - Composants d'interface
  - `websocketEvents/` - Événements WebSocket
- `src/renderer/src/components/admin/` - Panel d'administration
- `src/renderer/src/components/dm/` - Messages directs
- `src/renderer/src/components/invitations/` - Système d'invitations
- `src/renderer/src/components/notifs/` - Notifications
- `src/renderer/src/components/historique/` - Historique
- `src/renderer/src/components/menu/` - Menu de navigation
- `src/renderer/src/lang/` - Internationalisation (i18n)
- `src/renderer/src/pages/` - Pages HTML (login, register, adminPanel)

**Preload**
- `src/preload/index.js` - Script de préchargement Electron

---

## 📦 Prérequis

### Logiciels requis

| Logiciel | Version minimale | Recommandée |
|----------|-----------------|-------------|
| **Node.js** | 18.x | 20.x ou LTS |
| **npm** | 8.x | 10.x |
| **Docker** | 28.x | 28.x |


### Systèmes d'exploitation supportés

- ✅ **Windows** : 10, 11
- ✅ **macOS** : 10.14 (Mojave) ou supérieur
- ✅ **Linux** : Ubuntu 18.04+, Debian 10+, Fedora 32+

### Vérification des prérequis

```bash
# Vérifier Node.js
node --version  # Doit afficher v18.x.x ou supérieur

# Vérifier npm
npm --version   # Doit afficher 8.x.x ou supérieur
```

---

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/ZacharyBombardier/ChatApp_Multiplateforme.git
cd ChatApp_Multiplateforme
```

### 2. Installer les dépendances

```bash
npm install
```

**Dépendances installées :**

**Production :**
- `@electron-toolkit/preload` (3.0.2) - Scripts preload sécurisés
- `@electron-toolkit/utils` (4.0.0) - Utilitaires Electron
- `electron-updater` (6.3.9) - Mise à jour automatique
- `socket.io-client` (4.8.1) - Client WebSocket
- `uuid` (11.1.0) - Génération UUID

**Développement :**
- `electron` (37.4.0) - Framework
- `electron-builder` (25.1.8) - Compilation
- `electron-vite` (4.0.0) - Build system
- `eslint` (9.31.0) - Linter
- `prettier` (3.6.2) - Formateur
- `jest` (30.1.1) - Tests

### 3. Configuration

```bash
# Vérifier que les dépendances sont installées
npm list --depth=0
```

#### API REST

**Fichier** : `src/main/api.js`

```javascript
getApiUrl() {
  return 'http://localhost:8080/chatappAPI'  // Modifier selon votre environnement
}
```

#### WebSocket Server

Le serveur WebSocket doit être configuré avant le premier lancement.

**Fichier à modifier** : `src/main/services/WebSocketListener.js`

```javascript
// Configuration de l'URL du serveur
this.serverUrl = 'ws://localhost:3001' // Modifier selon votre environnement
```

### Variables d'environnement (optionnel)

Créer un fichier `.env` à la racine du projet :

```env
# Serveur WebSocket
SOCKET_URL=http://localhost:3000

# Configuration Electron
ELECTRON_DISABLE_SECURITY_WARNINGS=true
```

---

## 🎮 Lancement

## 🌐 Configuration Nginx (Production)

### Architecture de connexion

En production, le client Electron se connecte via Nginx qui centralise l'accès à l'API et au WebSocket.

```
Electron App
    ↓
Nginx (:80/:443)
    ├─→ API Laravel (:8000)
    └─→ WebSocket (:3001)
```

### Configuration des URLs

#### Développement (local)

**Fichier : `src/main/api.js`**
```javascript
getApiUrl() {
  // Connexion directe sans Nginx
  return 'http://localhost:8080/chatappAPI'
}
```

**Fichier : `src/main/services/WebSocketListener.js`**
```javascript
constructor(chatService) {
  this.chatService = chatService
  // Connexion directe sans Nginx
  this.serverUrl = 'ws://localhost:3001'
  this.socket = null
}
```

#### Production (via Nginx)

**Fichier : `src/main/api.js`**
```javascript
getApiUrl() {
  // Détection automatique de l'environnement
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    return 'http://localhost:8080/chatappAPI'
  }

  // Production via Nginx
  return 'https://chatapp-xp.fun/chatappAPI'
}
```

**Fichier : `src/main/services/WebSocketListener.js`**
```javascript
constructor(chatService) {
  this.chatService = chatService

  // Détection automatique de l'environnement
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    this.serverUrl = 'ws://localhost:3001'
  } else {
    // Production via Nginx
    this.serverUrl = 'wss://chatapp-xp.fun/ws'
  }

  this.socket = null
}
```

### Headers et sécurité avec Nginx

Nginx ajoute automatiquement des headers de sécurité :

```
X-Real-IP: <client_ip>
X-Forwarded-For: <client_ip>
X-Forwarded-Proto: https
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

### Mode développement

```bash
npm run dev
```

**Ce que fait cette commande :**
- Lance Electron en mode développement
- Active le rechargement automatique (hot reload)
- Ouvre les DevTools automatiquement
- Affiche les logs de débogage

### Mode prévisualisation

```bash
npm start
```

**Ce que fait cette commande :**
- Lance l'application avec la build de production
- Pas de rechargement automatique
- Simule l'environnement de production

### Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement avec hot reload |
| `npm start` | Prévisualisation production |
| `npm run build` | Build de l'application |
| `npm run lint` | Vérification ESLint |
| `npm run format` | Formatage Prettier |
| `npm test` | Exécution des tests Jest |

---

## 📦 Build et Distribution

### Build générale

```bash
npm run build
```

Cette commande compile l'application et prépare les fichiers dans le dossier `out/`.

### Build par plateforme

#### Windows
```bash
npm run build:win
```
**Génère :**
- `dist/win-unpacked/` - Version non empaquetée
- `dist/ChatApp-Setup-0.3.0.exe` - Installateur Windows

#### macOS
```bash
npm run build:mac
```
**Génère :**
- `dist/mac/` - Application macOS
- `dist/ChatApp-0.3.0.dmg` - Image disque macOS

#### Linux
```bash
npm run build:linux
```
**Génère :**
- `dist/linux-unpacked/` - Version non empaquetée
- `dist/ChatApp-0.3.0.AppImage` - Application portable
- `dist/ChatApp-0.3.0.deb` - Package Debian/Ubuntu

### Pour exécuter les builds

#### Windows
- Fichier: chatapp-multiplateforme-0.3.0-setup.exe
- Installation: Double-click pour exécuter l'installateur

#### Linux
- AppImage (recommended): chatapp-multiplateforme-0.3.0.AppImage
- chmod +x chatapp-multiplateforme-0.3.0.AppImage && ./chatapp-multiplateforme-0.3.0.AppImage

- Debian/Ubuntu: chatapp-multiplateforme_0.3.0_amd64.deb
- sudo dpkg -i chatapp-multiplateforme_0.3.0_amd64.deb

- Snap: chatapp-multiplateforme_0.3.0_amd64.snap
- sudo snap install chatapp-multiplateforme_0.3.0_amd64.snap --dangerous

#### MacOS
Fichier: chatapp-multiplateforme-0.3.0.dmg
Installation: Ouvrir DMG, déplacer au répertoire d'Applications

### Configuration du build

La configuration se trouve dans `electron-builder.yml`. Modifiez ce fichier pour personnaliser :
- Icônes d'application
- Nom de produit
- Packages générés
- Permissions macOS

---

## 📖 Guide d'utilisation

### Première connexion

1. **Lancer l'application** : `npm run dev`
2. **Lancer les autres composants** : Assurez vous de lancer l'API et le serveur WebSocket
3. **Page de connexion** apparaît automatiquement si vous n'êtes pas connectés
4. **S'inscrire** : Cliquer sur "Pas de compte ? Créez-en un" si nouveau compte
5. **Se connecter** : Entrer identifiants et cliquer "Se connecter"

### Envoi de messages

1. **Sélectionner un canal** dans la barre latérale gauche
2. **Taper le message** dans la zone de texte en bas
3. **Appuyer sur Entrée** ou cliquer sur "Envoyer"

### Messages directs (DM)

1. **Cliquer sur un utilisateur** dans la liste à droite
2. **Une nouvelle conversation DM** s'ouvre
3. **Envoyer des messages** privés

### Création de canaux

1. **Cliquer sur "Créer un canal"**
2. **Remplir le formulaire** :
   - Nom du canal
   - Description
   - Type (Public/Privé)
3. **Soumettre** le formulaire

### Changement de statut
Le statut se synchronise automatiquement selon l'état de votre connexion au serveur WebSockets

### Panel administrateur

**Accès** : Réservé aux administrateurs

1. **Menu** → "Admin Panel"
2. **Fonctionnalités** :
   - Gérer les utilisateurs
   - Modérer les canaux

### Configuration des notifications

Les notifications sont activées par défaut. Pour les désactiver vous devrez le faire directement dans l'application :

**BARRE D'OPTIONS** au haut de l'application :
1. Onglet "Paramètres"
2. Notifications
3. Modifiez la valeur du Slider

---

### Scénarios de test

#### Test d'envoi de messages
1. Envoyer un message dans un canal public
2. Vérifier l'affichage
3. Vérifier la persistance après rechargement

#### Test d'indicateur de frappe
1. Commencer à taper dans la zone de message
2. Les autres utilisateurs du salon verrons s'afficher "Utilisateur est en train d'écrire..."
3. Arrêter de taper → l'indicateur disparaît

#### Test de notifications
1. Recevoir un message dans un DM inactif
2. Vérifier notification système
3. Vérifier notification interne

---

## 📁 Structure du projet

```
Multi_desktop/
├── babel.config.js                # Configuration Babel pour transpilation
├── dev-app-update.yml             # Configuration des mises à jour en dev
├── electron-builder.yml           # Configuration du build Electron
├── electron.vite.config.mjs       # Configuration Vite pour Electron
├── eslint.config.mjs              # Configuration ESLint
├── package.json                   # Dépendances et scripts npm
├── README.md                      # Documentation principale
│
├── build/                         # Ressources de build
│   ├── entitlements.mac.plist    # Permissions macOS
│   ├── icon.icns                 # Icône macOS
│   └── icon.ico                  # Icône Windows
│
├── resources/                     # Ressources d'application
│   ├── jdVance.icns              # Icône alternative macOS
│   ├── jdVance.ico               # Icône alternative Windows
│   └── jdVance.png               # Icône PNG
│
└── src/
    ├── main/                      # Processus principal Electron
    │   ├── index.js              # Point d'entrée Electron
    │   ├── api.js                # Client API HTTP
    │   └── services/
    │       ├── ChatService.js    # Service de gestion du chat
    │       ├── SecureStorage.js  # Stockage sécurisé des tokens
    │       └── WebSocketListener.js # Gestionnaire WebSocket
    │
    ├── models/                    # Modèles de données
    │   ├── Channel.js            # Modèle canal
    │   ├── DirectMessagesChannel.js # Modèle DM
    │   ├── Message.js            # Modèle message
    │   ├── MessageReceiver.js    # Récepteur de messages
    │   ├── Ticket.js             # Modèle ticket
    │   └── User.js               # Modèle utilisateur
    │
    ├── preload/                   # Scripts preload (Bridge IPC)
    │   └── index.js              # Script de préchargement sécurisé
    │
    ├── renderer/                  # Processus de rendu (UI)
    │   ├── index.html            # Page principale de l'application
    │   │
    │   ├── assets/               # Assets statiques
    │   │   ├── css/              # Feuilles de style
    │   │   │   ├── adminPanel.css
    │   │   │   ├── attachment.css
    │   │   │   ├── create-channel.css
    │   │   │   ├── create-ticket.css
    │   │   │   ├── e2ee-settings.css
    │   │   │   ├── e2ee-toggle.css
    │   │   │   ├── index.css
    │   │   │   ├── invitation-modal.css
    │   │   │   ├── login.css
    │   │   │   ├── main.css
    │   │   │   ├── menu.css
    │   │   │   ├── mfa-settings-modal.css
    │   │   │   ├── mfa-verification-modal.css
    │   │   │   ├── notification-settings-modal.css
    │   │   │   ├── register.css
    │   │   │   ├── stats.css
    │   │   │   ├── ticket-detail.css
    │   │   │   └── voice-message.css
    │   │   │
    │   │   ├── images/           # Images
    │   │   │   ├── electron.svg
    │   │   │   └── wavy-lines.svg
    │   │   │
    │   │   └── js/               # Scripts pages spécifiques
    │   │       ├── login.js
    │   │       ├── register.js
    │   │       ├── ticketDetail.js
    │   │       └── ticketDetailTheme.js
    │   │
    │   └── src/                   # Code source renderer
    │       ├── constants.js      # Constantes globales
    │       ├── renderer.js       # Point d'entrée renderer
    │       │
    │       ├── components/       # Composants applicatifs
    │       │   ├── TimeManager.js # Gestion du temps/dates
    │       │   │
    │       │   ├── admin/        # Administration
    │       │   │   └── adminPannel.js
    │       │   │
    │       │   ├── auth/         # Authentification
    │       │   │   ├── auth.js
    │       │   │   ├── MFASettingsModal.js
    │       │   │   └── MFAVerificationModal.js
    │       │   │
    │       │   ├── chat/         # Composants chat
    │       │   │   ├── Chat.js   # Classe principale du chat
    │       │   │   │
    │       │   │   ├── attachment/
    │       │   │   │   ├── AttachmentButton.js
    │       │   │   │   ├── AttachmentHandler.js
    │       │   │   │   └── AttachmentRenderer.js
    │       │   │   │
    │       │   │   ├── channel/  # Gestion des canaux
    │       │   │   │   ├── create-channel.js
    │       │   │   │   ├── NewChannelModal.js
    │       │   │   │   ├── SetupChannelButtonManager.js
    │       │   │   │   └── UserChannelManager.js
    │       │   │   │
    │       │   │   ├── gestionEtat/ # Gestion d'état
    │       │   │   │   └── EtatManager.js
    │       │   │   │
    │       │   │   ├── htmlEvents/ # Événements DOM
    │       │   │   │   └── AddChannelSelectionListener.js
    │       │   │   │
    │       │   │   ├── offline/  # Mode hors ligne
    │       │   │   │   ├── pendingMessageNotifier.js
    │       │   │   │   └── queuedMessageNotifier.js
    │       │   │   │
    │       │   │   ├── theme/    # Thèmes Windows XP
    │       │   │   │   └── ThemeManager.js
    │       │   │   │
    │       │   │   ├── ui/       # Composants d'interface
    │       │   │   │   ├── ChannelChatBarFiller.js
    │       │   │   │   ├── DmChatBarFiller.js
    │       │   │   │   ├── MessageUiFiller.js
    │       │   │   │   └── UserSideBarFiller.js
    │       │   │   │
    │       │   │   ├── voice/
    │       │   │   │   ├── VoiceMessageButton.js
    │       │   │   │   ├── VoiceMessageRecorder.js
    │       │   │   │   └── VoiceMessagePlayer.js
    │       │   │   │
    │       │   │   └── websocketEvents/ # Événements WebSocket
    │       │   │       ├── onDMCreated.js
    │       │   │       ├── onE2EEStatusChanged.js
    │       │   │       ├── onInvitationAccepted.js
    │       │   │       ├── onInvitationRejected.js
    │       │   │       ├── onNewInvitation.js
    │       │   │       ├── onNewMessage.js
    │       │   │       ├── onRadisMessageNotif.js
    │       │   │       ├── onRedisUserlistUpdate.js
    │       │   │       ├── onRequestDmChannelIds.js
    │       │   │       └── onUserTyping.js
    │       │   │
    │       │   ├── crypto/       # Chiffrement E2EE
    │       │   │   ├── CryptoService.js
    │       │   │   ├── E2EEKeyManager.js
    │       │   │   ├── E2EEManager.js
    │       │   │   ├── E2EEMessageService.js
    │       │   │   └── E2EESettingsModal.js
    │       │   │
    │       │   ├── dm/           # Messages directs
    │       │   │   ├── E2EEToggle.js
    │       │   │   ├── NewDMModal.js
    │       │   │   └── SetupNewDMButton.js
    │       │   │
    │       │   ├── historique/   # Historique
    │       │   │   └── historique.js
    │       │   │
    │       │   ├── invitations/  # Système d'invitations
    │       │   │   ├── InvitationModal.js
    │       │   │   ├── InviteUserModal.js
    │       │   │   └── SetupInvitationButton.js
    │       │   │
    │       │   ├── menu/         # Menu de navigation
    │       │   │   └── MenuManager.js
    │       │   │
    │       │   ├── notifs/       # Notifications
    │       │   │   ├── NotificationManager.js
    │       │   │   └── NotificationSettingsModal.js
    │       │   │
    │       │   ├── stats/        # Statistiques
    │       │   │   ├── StatsManager.js
    │       │   │   └── UserStatsDisplay.js
    │       │   │
    │       │   └── ticket/       # Système de tickets
    │       │       ├── ticketManager.js
    │       │       ├── CreateTicket.js
    │       │       └── TicketListModal.js
    │       │
    │       ├── lang/             # Internationalisation
    │       │   ├── en.js         # Traductions anglaises
    │       │   ├── fr.js         # Traductions françaises
    │       │   ├── i18nDom.js    # Utilitaires i18n DOM
    │       │   └── LanguageManager.js # Gestionnaire de langues
    │       │
    │       └── pages/            # Pages HTML secondaires
    │           ├── adminPanel.html
    │           ├── login.html
    │           ├── register.html
    │           ├── stats.html
    │           └── ticketDetail.html
    │
    └── resources/                 # Ressources embarquées
        └── jdVance.ico
```

**Légende** :
- 🆕 = Nouveaux fichiers/dossiers ajoutés en version 1.0.0
- Les fichiers sans indicateur existaient depuis les versions précédentes

---

## 🛠️ Technologies utilisées

### 🧱 Framework et build
- **Electron** 37.4.0 — Framework pour application desktop multiplateforme
- **Electron-Vite** 4.0.0 — Système de build optimisé pour Electron
- **Vite** 7.0.5 — Outil de build rapide et moderne
- **Electron Builder** 25.1.8 — Outil de packaging et de distribution
- **Electron Updater** 6.3.9 — Gestion des mises à jour automatiques

### 💻 Frontend
- **JavaScript (ES6+)** — Langage principal
- **HTML5 / CSS3** — Interface utilisateur
- **Windows XP Design** — Thème visuel nostalgique
- **UUID** 11.1.0 — Génération d’identifiants uniques

### 🔄 Communication temps réel
- **Socket.IO Client** 4.8.1 — Communication WebSocket en temps réel
- **WebSocket** — Protocole de communication bidirectionnelle

### 🧪 Tests et qualité du code
- **Jest** 30.1.1 — Framework de tests unitaires
- **ESLint** 9.31.0 — Analyse et correction du code
- **Prettier** 3.6.2 — Formatage automatique du code
- **@electron-toolkit/eslint-config** — Configuration ESLint optimisée pour Electron
- **@electron-toolkit/eslint-config-prettier** — Intégration ESLint + Prettier

### ⚙️ Outils de développement
- **Babel** 7.28.3 — Transpilation du code moderne
- **@electron-toolkit/preload** — Gestion sécurisée du contexte de preload
- **@electron-toolkit/utils** — Utilitaires pour Electron

### Médias et Fichiers
- **Web Audio API** - Enregistrement audio
- **MediaRecorder** - Capture audio navigateur
- **Blob API** - Gestion des fichiers binaires
- **FormData** - Upload de fichiers
- **Audio Element** - Lecture des messages vocaux

---

## 👥 Équipe

- **Zack Livernois**
- **Zachary Bombardier**
- **Antoine Davignon**
- **Bradley Fortin**
- **Samuel Grenier**

---

**Dernière mise à jour** : 4 Décembre 2025

**Version** : 1.0.0

> **PS** : CE README A ÉTÉ GÉNÉRÉ EN PARTIE À L'AIDE DE L'INTELLIGENCE ARTIFICIELLE
