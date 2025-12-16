# ChatApp Infrastructure V1.0.0

Infrastructure Docker Compose pour le déploiement de ChatApp (API Laravel + WebSocket + Clients).

## 🏗️ Architecture
```
┌─────────────┐
│   Nginx     │ :80, :443
│ (Reverse    │
│   Proxy)    │
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐   ┌─────▼─────┐
│  API Laravel│   │  WebSocket  │   │  Certbot  │
│    :8000    │   │    :3001    │   │           │
└──────┬──────┘   └──────┬──────┘   └───────────┘
       │                 │
       ├─────────────────┤
       │                 │
┌──────▼──────┐   ┌──────▼──────┐
│    MySQL    │   │    Redis    │
│    :3306    │   │    :6379    │
└─────────────┘   └─────────────┘
```

## 🔒 Nginx - Reverse Proxy et Sécurité

### Rôle
Nginx agit comme reverse proxy et point d'entrée unique pour :
- Router les requêtes HTTP/HTTPS vers l'API Laravel
- Gérer les connexions WebSocket
- Servir les certificats SSL/TLS
- Rediriger automatiquement HTTP → HTTPS

### Configuration

#### Développement (HTTP)
En local, Nginx écoute sur le port 80 et route :
- `/chatappAPI/*` → API Laravel (port 8000)
- `/ws/*` → WebSocket Server (port 3001)
- `/health` → Endpoint de santé Nginx

#### Production (HTTPS)
Avec certificat Let's Encrypt :
- Port 443 (HTTPS) pour tout le trafic sécurisé
- Port 80 redirige automatiquement vers 443
- WebSocket upgrade via WSS (WebSocket Secure)

### Fichiers de configuration
```
nginx/
├── nginx.conf              # Configuration principale
├── sites/
│   ├── chatapp-dev.conf   # Config développement (HTTP)
│   └── chatapp-prod.conf  # Config production (HTTPS)
└── certs/                 # Certificats SSL (production)
```

### Endpoints exposés

| Route | Destination | Description |
|-------|-------------|-------------|
| `/chatappAPI/*` | `api:8000` | API REST Laravel |
| `/ws` | `websocket:3001` | WebSocket temps réel |
| `/health` | Nginx | Health check |

### Certificats SSL (Production)

Le service `certbot` gère automatiquement :
- L'obtention des certificats Let's Encrypt
- Le renouvellement automatique (tous les 12h)
- Stockage dans `/etc/letsencrypt`

#### Première installation SSL
```bash
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email ${LETSENCRYPT_EMAIL} \
  --agree-tos \
  --no-eff-email \
  -d ${DOMAIN_NAME} \
  -d www.${DOMAIN_NAME}
```

#### Renouvellement manuel
```bash
docker-compose exec certbot certbot renew
docker-compose exec nginx nginx -s reload
```

## 📋 Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Git
- 2 Go RAM minimum
- 10 Go espace disque

## 🚀 Installation rapide

### 1. Cloner le repo
```bash
git clone https://github.com/Multiplateforme2025/chat-infrastructure.git
cd chat-infrastructure
```

### 2. Setup initial
```bash
./scripts/setup.sh
```

### 3. Configurer l'environnement

Éditer `.env` avec tes configurations:
```bash
nano .env
```

### 4. Démarrer l'application
```bash
./scripts/start.sh
```

Ou manuellement:
```bash
docker-compose up -d
```

## 🔧 Commandes utiles

### Démarrage
```bash
docker-compose up -d              # Démarrer en arrière-plan
docker-compose up -d --build      # Reconstruire et démarrer
```

### Logs
```bash
docker-compose logs -f            # Tous les logs
docker-compose logs -f api        # Logs API uniquement
docker-compose logs -f websocket  # Logs WebSocket uniquement
```

### Arrêt
```bash
docker-compose down               # Arrêter les conteneurs
docker-compose down -v            # Arrêter et supprimer les volumes
./scripts/stop.sh                 # Arrêter tout
```

### Maintenance
```bash
docker-compose exec api php artisan migrate     # Migrations
docker-compose exec api php artisan cache:clear # Clear cache
docker-compose restart api                      # Redémarrer l'API
./scripts/update.sh                             # Sélectionner la branche des repos à utiliser
```

### Accès aux conteneurs
```bash
docker-compose exec api sh        # Shell dans l'API
docker-compose exec mysql mysql -u root -p  # MySQL CLI
```

## 📍 Endpoints

### Développement (local)
- API REST: `http://localhost/api`
- WebSocket: `ws://localhost/ws`
- MySQL: `localhost:3313`
- Redis: `localhost:6379`

### Production
- API REST: `https://votre-domaine.com/api`
- WebSocket: `wss://votre-domaine.com/ws`

## 🔐 Configuration SSL (Production)

### 1. Configurer le domaine

Éditer `nginx/sites/chatapp-prod.conf` et remplacer `votre-domaine.com`.

### 2. Obtenir le certificat Let's Encrypt
```bash
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@votre-domaine.com \
  --agree-tos \
  --no-eff-email \
  -d votre-domaine.com \
  -d www.votre-domaine.com
```

### 3. Recharger Nginx
```bash
docker-compose exec nginx nginx -s reload
```

## 🐛 Dépannage

### Les conteneurs ne démarrent pas
```bash
docker-compose logs
docker-compose ps
```

### Problèmes de permissions (API)
```bash
docker-compose exec api chown -R www-data:www-data storage bootstrap/cache
docker-compose exec api chmod -R 775 storage bootstrap/cache
```

### MySQL "Connection refused"
```bash
# Attendre que MySQL soit complètement démarré
docker-compose logs mysql
# Vérifier la santé
docker-compose ps
```

### Reset complet
```bash
docker-compose down -v
docker system prune -a
./scripts/setup.sh
docker-compose up -d --build
```

## 📦 Mise à jour
```bash
cd api && git pull && cd ..
cd websocket && git pull && cd ..
docker-compose up -d --build
```

## 📚 Documentation

- [API Laravel](https://github.com/Multiplateforme2025/MultiPlat-chatapp-API)
- [WebSocket Server](https://github.com/Multiplateforme2025/MultiPlat-ChatApp-WS)
- [Client Electron](https://github.com/Multiplateforme2025/ChatApp_Multiplateforme)
- [Client Mobile](https://github.com/Multiplateforme2025/MultiPlat-chatapp-ReactNative)

## 👥 Équipe

Zack Livernois, Zachary Bombardier, Antoine Davignon, Bradley Fortin, Samuel Grenier

>**README Généré à l'aide de l'IA**
