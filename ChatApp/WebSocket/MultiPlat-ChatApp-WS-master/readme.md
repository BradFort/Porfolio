# ChatApp WebSocket Server 🚀 V 1.0.0

### 1. Objectif du Projet

Ce dépôt contient le **serveur WebSocket** complémentaire à l’API principale [`chatappAPI`](https://github.com/Zack7292/MultiPlat-chatapp-API.git).  
Son rôle est d’assurer la **communication en temps réel** entre les utilisateurs (messages, connexions, notifications, etc.), via **Redis** comme système d’échange de données (Pub/Sub).

### 2. Pré-requis
- Node.js (version 14 ou supérieure)
- npm (version 6 ou supérieure)
- Git pour cloner le dépôt
- Un IDE (VSCode, PHPStorm, etc.)
- ChatappAPI (API RESTful pour la gestion des utilisateurs, salons, messages)

### 3. Tehnologies Utilisées
| Technologie | Rôle / Utilisation |
|--------------|--------------------|
| **Node.js** | Environnement d’exécution JavaScript côté serveur |
| **Express.js** | Framework minimaliste pour créer le serveur et gérer les connexions HTTP |
| **Socket.io** | Communication bidirectionnelle en temps réel entre le client et le serveur |
| **Redis** | Système de messagerie (Pub/Sub) pour la communication entre serveurs et la diffusion des messages |
| **ioredis** | Client Redis performant utilisé pour le streaming et la gestion des canaux en temps réel |
| **Axios** | Effectue les requêtes HTTP vers l’API Laravel (authentification, messages, etc.) |
| **Winston** | Gère la journalisation (logs) du serveur de manière structurée et persistante |
| **Nodemon** | Redémarre automatiquement le serveur lors des modifications en développement |
| **dotenv** | Gère les variables d’environnement (ex. : port, URL de l’API, clé Redis) |
| **CORS** | Autorise les connexions cross-origin depuis le client web (React ou autre) |

### 4. Installation
```bash
# Cloner le dépôt
    git clone https://github.com/Zack7292/MultiPlat-ChatApp-WS.git

# Se déplacer dans le répertoire du projet
    cd <endroit cloned>
    
# Installer les dépendances

    npm install
```
### 5. Démarrer le serveur
```bash
  # S'assurer que les conteneurs Docker de ChatappAPI sont en cours d'exécution
    # Démarrer le serveur WebSocket
    npm start
```

## 🌐 Accès via Nginx

### Configuration WebSocket

Nginx gère l'upgrade de connexion HTTP → WebSocket :
```nginx
location /ws {
    proxy_pass http://websocket:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Connexion depuis les clients

**Développement** :
```javascript
// Direct
const socket = io('http://localhost:3001');

// Via Nginx
const socket = io('http://localhost', { path: '/ws/socket.io' });
```

**Production** :
```javascript
const socket = io('https://chatapp-xp.fun', { 
  path: '/ws/socket.io',
  secure: true,
  rejectUnauthorized: true
});
```

### Health Check

Le serveur WebSocket expose un endpoint de santé :
```
GET /health
```

Nginx vérifie ce endpoint toutes les 30 secondes pour s'assurer que le service est opérationnel.

### Logs WebSocket via Nginx

Les logs de connexion WebSocket sont accessibles via :
```bash
docker-compose logs -f nginx
docker-compose logs -f websocket
```

### 6. Architecture

```plaintext
MultiPlat-ChatApp-WS/
├── Dockerfile
├── package.json
├── readme.md
├── src/
│   ├── server.js
│   ├── handlers/
│   │   ├── AuthHandler.js
│   │   ├── DMHandler.js
│   │   ├── InvitationHandler.js
│   │   ├── MessageHandlers.js
│   │   ├── PresenceHandler.js
│   │   ├── RedisForwarder.js
│   │   └── UserListHandler.js
│   ├── services/
│   │   └── SocketManager.js
│   └── utils/
│       ├── logger.js
│       └── sentry.js
```
