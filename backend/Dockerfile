# Dockerfile pour le backend de conversion Blender
FROM ubuntu:22.04

# Éviter les prompts interactifs
ENV DEBIAN_FRONTEND=noninteractive

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    xvfb \
    wget \
    xz-utils \
    ca-certificates \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libxi6 \
    libxfixes3 \
    libxkbcommon0 \
    libdbus-1-3 \
    libegl1 \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Installer Blender 3.6 LTS depuis les binaires officiels
ENV BLENDER_VERSION=3.6.15
ENV BLENDER_MAJOR=3.6
RUN wget -q https://download.blender.org/release/Blender${BLENDER_MAJOR}/blender-${BLENDER_VERSION}-linux-x64.tar.xz -O /tmp/blender.tar.xz \
    && tar -xJf /tmp/blender.tar.xz -C /opt \
    && mv /opt/blender-${BLENDER_VERSION}-linux-x64 /opt/blender \
    && ln -s /opt/blender/blender /usr/local/bin/blender \
    && rm -f /tmp/blender.tar.xz

# Corrections runtime pour libmount/GLib et environnement headless
RUN ln -sf /proc/self/mounts /etc/mtab \
    && touch /etc/fstab \
    && mkdir -p /tmp/runtime \
    && chmod 700 /tmp/runtime

# Variables d'environnement complémentaires pour un runtime stable
ENV XDG_RUNTIME_DIR=/tmp/runtime
ENV SDL_AUDIODRIVER=dummy
ENV GIO_USE_VFS=local

# Variables d'environnement pour Blender headless
ENV BLENDER_USER_CONFIG=/tmp
ENV BLENDER_SYSTEM_DATAFILES=/usr/share/blender
ENV DISPLAY=:99

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip3 install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY app.py .
COPY start.sh .

# Rendre le script de démarrage exécutable
RUN chmod +x start.sh

# Exposer le port
EXPOSE 5000

# Lancer l'application avec le script de démarrage
CMD ["./start.sh"]
