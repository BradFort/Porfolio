FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (production only)
RUN npm ci --only=production

# Copier le code source
COPY . .

# Copier le contenu de .env.example dans .env si présent
RUN if [ -f .env.example ]; then cp .env.example .env; fi

# Créer le dossier logs
RUN mkdir -p logs && chmod 755 logs

# Exposer le port WebSocket
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer le serveur
CMD ["npm", "start"]
