#!/bin/bash

set -e

echo "Setup de l'infrastructure ChatApp"
echo "======================================"

# Couleurs
GREEN='\033[0.32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED} Docker n'est pas installé${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED} Docker Compose n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN} Docker et Docker Compose sont installés${NC}"

# Cloner les repos si nécessaire
echo -e "\n${BLUE} Clonage des repositories...${NC}"

if [ ! -d "api" ]; then
    git clone git@github.com:Multiplateforme2025/MultiPlat-chatapp-API.git api
    echo -e "${GREEN} API clonée${NC}"
else
    echo -e "${BLUE}  API déjà présente${NC}"
fi

if [ ! -d "websocket" ]; then
    git clone git@github.com:Multiplateforme2025/MultiPlat-ChatApp-WS.git websocket
    echo -e "${GREEN} WebSocket cloné${NC}"
else
    echo -e "${BLUE}  WebSocket déjà présent${NC}"
fi

# Configuration de l'environnement
echo -e "\n${BLUE}  Configuration de l'environnement...${NC}"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN} Fichier .env créé${NC}"
    echo -e "${RED}  IMPORTANT: Édite le fichier .env avec tes configurations${NC}"
    read -p "Appuie sur Entrée pour continuer après avoir édité .env..."
else
    echo -e "${BLUE}  .env déjà présent${NC}"
fi

# Copier les .env dans les sous-projets
if [ -f "api/.env.example" ] && [ ! -f "api/.env" ]; then
    cp api/.env.example api/.env
    echo -e "${GREEN} API .env créé${NC}"
fi

if [ -f "websocket/.env.example" ] && [ ! -f "websocket/.env" ]; then
    cp websocket/.env.example websocket/.env
    echo -e "${GREEN} WebSocket .env créé${NC}"
fi

# Créer les dossiers nécessaires
echo -e "\n${BLUE} Création des dossiers...${NC}"
mkdir -p certs logs

echo -e "\n${GREEN} Setup terminé!${NC}"
echo -e "${BLUE}Prochaine étape: ${NC}docker-compose up -d"