#!/bin/bash
# Script de démarrage pour le backend Blender

echo "🚀 Démarrage du serveur de conversion Blender..."

# Démarrer Xvfb (serveur X virtuel) en arrière-plan
echo "📺 Démarrage de Xvfb..."
Xvfb :99 -screen 0 1024x768x24 &
XVFB_PID=$!

# Attendre que Xvfb soit prêt
sleep 2

# Démarrer Gunicorn
echo "🔥 Démarrage de Gunicorn (eventlet)..."
exec gunicorn --bind 0.0.0.0:5000 -k eventlet -w 1 --timeout 300 app:app
