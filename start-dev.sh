#!/bin/bash
# Script de démarrage pour le développement en mode tunnel
# Lance le backend + tunnel + frontend en une seule commande

echo "🚀 Démarrage de ShareTips en mode tunnel..."

# Arrêter les processus existants
pkill -f "dotnet run" 2>/dev/null
pkill -f "lt --port 5250" 2>/dev/null

# 1. Lancer le backend
echo "📦 Démarrage du backend..."
cd backend/ShareTipsBackend
dotnet run &
BACKEND_PID=$!
cd ../..

# Attendre que le backend démarre
sleep 5

# 2. Lancer le tunnel pour le backend
echo "🔗 Création du tunnel backend..."
lt --port 5250 --subdomain sharetips-backend &
TUNNEL_PID=$!
sleep 2

# 3. Mettre à jour le .env frontend avec l'URL du tunnel
TUNNEL_URL="https://sharetips-backend.loca.lt"
sed -i '' "s|EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=${TUNNEL_URL}|" frontend/.env
echo "✅ API URL configurée: $TUNNEL_URL"

# 4. Lancer le frontend en mode tunnel
echo "📱 Démarrage du frontend..."
cd frontend
npx expo start --tunnel --clear

# Cleanup à la fermeture
trap "kill $BACKEND_PID $TUNNEL_PID 2>/dev/null" EXIT
