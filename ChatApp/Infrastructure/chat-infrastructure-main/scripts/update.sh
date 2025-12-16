#!/bin/bash

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Mise à jour des projets...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

choose_branch() {
    local project=$1
    echo -e "${BLUE}-> $project${NC}"
    cd $project

    # Récupère toutes les branches distantes
    git fetch origin

    echo "Branches distantes disponibles :"
    git branch -r | grep origin/ | grep -v HEAD | sed 's|origin/||' | sort -u

    # Demande à l'utilisateur de choisir une branche
    read -p "Entrez la branche à utiliser pour $project (default main) : " BRANCH_CHOICE
    BRANCH_CHOICE=${BRANCH_CHOICE:-main}

    # Vérifie si la branche existe localement, sinon la crée
    if git show-ref --verify --quiet refs/heads/$BRANCH_CHOICE; then
        git checkout $BRANCH_CHOICE
        git pull origin $BRANCH_CHOICE
    else
        git checkout -b $BRANCH_CHOICE origin/$BRANCH_CHOICE
    fi
    cd ..
}

# Mettre à jour l'API
if [ -d "api" ]; then
    choose_branch "api"
else
    echo -e "${RED}API non trouvée, clone d'abord avec setup.sh${NC}"
fi

# Mettre à jour le WebSocket
if [ -d "websocket" ]; then
    choose_branch "websocket"
else
    echo -e "${RED}WebSocket non trouvé, clone d'abord avec setup.sh${NC}"
fi

# Rebuild et redémarrage des conteneurs Docker
echo -e "${BLUE}Rebuild et redémarrage des conteneurs...${NC}"
bash "$SCRIPT_DIR/start.sh"

echo -e "${GREEN}Mise à jour terminée!${NC}"
