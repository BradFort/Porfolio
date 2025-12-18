
# Portfolio de Bradley Fortin

Bienvenue sur mon portfolio !  
Voici une sélection de projets scolaires que j'ai réalisés. Chaque projet inclut un résumé, les technologies utilisées et ses principales fonctionnalités.

---

## 🖥️ Projets

### 🎯 BattleShip

![BattleShip](https://img.shields.io/badge/Game-BattleShip-blue?style=for-the-badge)

**Description :** Jeu de bataille navale où le joueur place ses navires et affronte un adversaire IA.

**Technologies :**  
![Laravel](https://img.shields.io/badge/Laravel-EF2D5E?style=for-the-badge&logo=laravel&logoColor=white) 
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white) 
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white) 
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Fonctionnalités :**
- Placement interactif des navires
- Gestion des tours de jeu
- Détection des touches et des navires coulés
- Affrontement contre une IA

#### ⚙️ Prérequis
- Node.js et npm
- Docker et Docker Compose
- Un IDE compatible (VS Code, IntelliJ IDEA, etc.)

#### 🧩 Installation et configuration

**Côté Client :**

1. Ouvrir le projet dans un IDE
2. Dans le terminal du client, installer les dépendances :
```bash
npm install
```

**Côté API :**

1. Créer le fichier `.env` en copiant le contenu de `.env.example`

2. Installer les dépendances Laravel avec Docker :
```bash
docker run --rm \
  -u "$(id -u):$(id -g)" \
  -v "$(pwd):/var/www/html" \
  -w /var/www/html \
  laravelsail/php84-composer:latest \
  composer install --ignore-platform-reqs
```

3. Démarrer les conteneurs Docker :
```bash
sail compose up -d
```

4. Exécuter les migrations de base de données :
```bash
sail artisan migrate
```

5. Peupler la base de données :
```bash
sail artisan db:seed
```

6. Générer un token d'authentification :
```bash
sail artisan tinker
```

Dans le tinker, exécuter les commandes suivantes :
```php
$user = \App\Models\User::find(1)
// Appuyer sur Q pour sortir de l'affichage
$user->createToken('api-test')->plainTextToken
```

**Note :** Sauvegarder le token généré, il sera nécessaire pour connecter le client à l'API.

**Lancement du jeu :**

1. Démarrer le client :
```bash
npm run dev
```

2. Cliquer sur le lien affiché dans le terminal pour ouvrir le jeu dans le navigateur

3. Configuration de la partie :
   - Entrer votre nom
   - Entrer le nom de l'adversaire
   - URL de l'API : `http://localhost/battleship-ia`
   - Coller le token généré précédemment
   - Cliquer sur "Lancer l'attaque"

4. Placer tous vos bateaux sur la grille de jeu

5. La partie peut commencer !

---

### ♟️ Jeu de Dames Mobile

![Jeu de Dames](https://img.shields.io/badge/Game-Dames-green?style=for-the-badge)

**Description :** Jeu de dames conçu pour mobile, avec interface tactile et animations simples.

**Technologies :**  
![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)

**Fonctionnalités :**
- Déplacement intuitif des pions
- Capture automatique des pions adverses
- Gestion des tours de jeu
- Interface tactile optimisée pour mobile

---

### 💬 ChatApp

![ChatApp](https://img.shields.io/badge/App-Chat-red?style=for-the-badge)

**Description :** Application de chat en temps réel permettant la communication entre plusieurs utilisateurs.

**Technologies :**  
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) 
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white) 
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white) 
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Fonctionnalités :**
- Envoi et réception de messages en temps réel
- Interface responsive et moderne
- Gestion des utilisateurs connectés
- Notifications de connexion/déconnexion

---

## 🚀 Comment utiliser ce portfolio

Cloner ce repository :
```bash
git clone https://github.com/ton-utilisateur/PortFolio.git
```

Consulter les instructions spécifiques à chaque projet dans leurs sections respectives ci-dessus.

---

## 📧 Contact

Pour toute question ou collaboration, n'hésite pas à me contacter !

[Ajoute tes liens : LinkedIn, Email, etc.]
