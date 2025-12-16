#!/bin/bash

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Arrêt des services ChatApp...${NC}"

# Arrêter les conteneurs
docker-compose down

echo -e "${GREEN}Tous les services sont arrêtés.${NC}"
