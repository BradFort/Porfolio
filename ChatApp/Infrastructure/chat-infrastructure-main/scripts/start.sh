#!/bin/bash
set -e

echo "Démarrage de ChatApp"
echo "======================="

# Determine the script directory so relative paths work regardless of current working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Base directory of the project (one level up from scripts/)
BASE_DIR="$SCRIPT_DIR/.."

DOMAIN="chatapp-xp.fun"
CERT_PATH="$BASE_DIR/certs/live/$DOMAIN/fullchain.pem"

# Function to fetch public IP using available tools
get_public_ip() {
  # prefer curl
  if command -v curl >/dev/null 2>&1; then
    ip=$(curl -s https://ipinfo.io/ip || curl -s https://ifconfig.co || true)
  elif command -v wget >/dev/null 2>&1; then
    ip=$(wget -qO- https://ipinfo.io/ip || wget -qO- https://ifconfig.co || true)
  elif command -v dig >/dev/null 2>&1; then
    # use OpenDNS resolver
    ip=$(dig +short myip.opendns.com @resolver1.opendns.com || true)
  else
    ip=""
  fi
  # trim whitespace
  echo "$ip" | tr -d '\n' | tr -d '\r'
}

# Production IP for chatapp-xp.fun
TARGET_IP="178.128.228.91"
CURRENT_IP="$(get_public_ip)"

if [ -z "$CURRENT_IP" ]; then
  echo "Info: Unable to determine public IP address (no curl/wget/dig or network issue)."
  echo "Assuming non-production environment; skipping certificate enforcement."
  ENFORCE_CERT=0
else
  if [ "$CURRENT_IP" = "$TARGET_IP" ]; then
    echo "Info: Public IP $CURRENT_IP matches production IP $TARGET_IP -> enforcing certificate presence."
    ENFORCE_CERT=1
  else
    echo "Info: Public IP is $CURRENT_IP (production is $TARGET_IP) -> skipping certificate enforcement for local/dev."
    ENFORCE_CERT=0
  fi
fi

# Vérifier si le certificat existe only when ENFORCE_CERT=1
if [ "$ENFORCE_CERT" -eq 1 ]; then
    if [ ! -f "$CERT_PATH" ]; then
        echo "ERREUR: Certificat SSL introuvable à $CERT_PATH"
        echo ""
        echo "Vous devez générer le certificat AVANT de démarrer Docker :"
        echo "1. Installez certbot sur votre machine"
        echo "2. Exécutez : sudo certbot certonly --standalone -d $DOMAIN"
        echo "3. Copiez les certificats : sudo cp -r /etc/letsencrypt/live/$DOMAIN ./certs/live/"
        echo "4. Ajustez les permissions : sudo chown -R \$USER:\$USER ./certs"
        echo ""
        exit 1
    fi
    echo "✓ Certificat SSL trouvé"
else
    echo "Info: Enforcement du Certificat skip (Environement local)."
fi

# Construction et démarrage de tous les conteneurs
echo "Construction et démarrage des conteneurs..."
docker-compose build --no-cache
docker-compose up -d


# Attendre que les services soient prêts
echo "Attente que les services soient prêts..."
sleep 10

# Afficher le statut
docker-compose ps

echo ""
echo "✓ ChatApp est démarré!"
echo ""
echo "Services disponibles:"
echo "   - API: https://$DOMAIN/chatappAPI/"
echo "   - WebSocket: wss://$DOMAIN/ws"
echo "   - MySQL: localhost:3313"
echo "   - Redis: localhost:6379"
echo ""
echo "Logs: docker-compose logs -f"
echo "Arrêt: docker-compose down"