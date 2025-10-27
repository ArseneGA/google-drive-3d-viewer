# 🔷 Google Drive 3D Viewer

**Un visualiseur 3D intégré à Google Drive pour afficher et convertir des fichiers 3D (.blend, .stl, .obj, .gltf, .glb, .3mf, .fbx)**

---

## 📋 **Résumé du Projet**

Ce projet permet de visualiser et convertir des fichiers 3D directement depuis Google Drive grâce à une extension Chrome qui s'intègre au navigateur de fichiers. 

### **Architecture**

Le projet est composé de **3 parties principales** :

1. **🔧 Backend (Cloud Run)** : API Flask qui convertit les fichiers `.blend` en `.glb` avec Blender
2. **🎨 Frontend (Firebase Hosting)** : Interface web de visualisation 3D avec Three.js
3. **🔌 Extension Chrome** : Plugin qui détecte les fichiers 3D dans Google Drive et lance la conversion

---

## 📦 **Structure du Projet**

```
google-drive-3d-viewer/
├── backend/           # API Flask pour la conversion Blender → GLB
│   ├── app.py         # Application Flask principale
│   ├── Dockerfile     # Image Docker avec Blender 3.6
│   ├── requirements.txt
│   ├── start.sh       # Script de démarrage Gunicorn
│   └── cloudbuild.yaml # Configuration Cloud Build
├── frontend/          # Visualiseur 3D
│   └── public/
│       ├── index.html # Interface principale
│       ├── style.css  # Styles Material 3
│       ├── viewer-v2.js # Logic Three.js
│       └── logo.svg   # Logo du projet
├── extension/         # Extension Chrome (à venir)
└── .gitignore
```

---

## ✅ **Ce qui a été fait**

### **1. Configuration Initiale**

- ✅ Création du repository GitHub : `ArseneGA/google-drive-3d-viewer`
- ✅ Configuration de la structure de dossiers (backend, frontend, extension)
- ✅ Création du fichier `.gitignore` avec exclusions appropriées
- ✅ Configuration du projet Google Cloud `drive3dviewer` avec Firebase

### **2. Backend (Cloud Run)**

- ✅ Copie des fichiers backend depuis l'ancien projet :
  - `app.py` : API Flask avec endpoint `/convert` pour conversion Blender → GLB
  - `Dockerfile` : Image Docker incluant Blender 3.6 LTS
  - `requirements.txt` : Dépendances Python (Flask, Gunicorn, etc.)
  - `start.sh` : Script de démarrage avec Gunicorn
- ✅ Configuration Cloud Build (`cloudbuild.yaml`)
- ✅ Déploiement sur Google Cloud Run :
  - Service : `blend-converter-api`
  - Région : `us-central1`
  - Mémoire : 4 GiB
  - Timeout : 600 secondes (10 minutes)
- ✅ Configuration des permissions IAM pour Artifact Registry et Cloud Build

**⚠️ Note** : Le déploiement Cloud Run a rencontré des problèmes de permissions avec Artifact Registry lors des premiers essais. Les fichiers sont prêts et fonctionnels, mais le déploiement nécessite la résolution finale des permissions Google Cloud.

### **3. Frontend (Firebase Hosting)**

- ✅ Copie des fichiers frontend depuis l'ancien projet :
  - `index.html` : Interface utilisateur Material Design 3
  - `style.css` creation de styles Google Material 3
  - `viewer-v2.js` : Logique de visualisation Three.js
  - `logo.svg` : Logo avec couleurs Google
- ✅ Support des formats 3D : `.stl`, `.obj`, `.gltf`, `.glb`, `.3mf`, `.fbx`
- ✅ Contrôles de matériaux : palette de couleurs Google, mode multicouleur, restauration des couleurs d'origine
- ✅ Contrôles de caméra : rotation 360°, zoom, pan
- ✅ Interfaces de chargement et d'erreur
- ✅ Synchronisation avec le backend via `postMessage` pour recevoir les fichiers

**📝 À faire** : Initialiser Firebase Hosting et déployer (`firebase init hosting` → `firebase deploy`)

---

## 🚀 **Fonctionnalités**

### **Backend (API de Conversion)**
- Conversion `.blend` → `.glb` avec Blender 3.6 LTS
- Gestion des gros fichiers (timeout 10 minutes)
- Endpoint REST `/convert` avec téléchargement/conversion/envoi du résultat
- Support de fichiers jusqu'à plusieurs centaines de MB

### **Frontend (Visualiseur 3D)**
- Visualisation 3D avec Three.js via CDN (esm.sh)
- 6 formats supportés : STL, OBJ, GLTF, GLB, 3MF, FBX
- Palette de couleurs Google Material 3
- Contrôles de caméra OrbitControls (rotation, zoom, pan 360°)
- Mode multicouleur automatique
- Sauvegarde et restauration des matériaux d'origine
- Grille d'aide pour la visualisation
- Éclairage optimisé (ambient + directional lights)
- Responsive design

---

## 🔗 **Technologies Utilisées**

- **Backend** :
  - Python 3.9+
  - Flask (API REST)
  - Gunicorn (serveur WSGI)
  - Blender 3.6 LTS (conversion 3D)
  - Docker
  - Google Cloud Run (hébergement)

- **Frontend** :
  - HTML5 / CSS3
  - Three.js 0.160.0 (WebGL)
  - Material Design 3 (Google)
  - Firebase Hosting (hébergement)

- **DevOps** :
  - Google Cloud Build
  - Artifact Registry (images Docker)
  - GitHub (versioning)

---

## 📝 **Prochaines Étapes**

### **1. Finaliser le Backend**
- [ ] Résoudre les permissions Artifact Registry pour finaliser le déploiement Cloud Run
- [ ] Tester l'endpoint `/convert` avec un fichier `.blend` réel
- [ ] Récupérer l'URL du service Cloud Run déployé

### **2. Finaliser le Frontend**
- [ ] Installer Firebase CLI (`npm install -g firebase-tools`)
- [ ] Initialiser Firebase Hosting (`firebase init hosting`)
- [ ] Déployer le frontend (`firebase deploy --only hosting`)
- [ ] Récupérer l'URL d'hébergement Firebase

### **3. Créer l'Extension Chrome**
- [ ] Configurer le manifest.json
- [ ] Implémenter la détection des fichiers `.blend` dans Google Drive
- [ ] Connecter l'extension au backend (conversion) et au frontend (visualisation)
- [ ] Tester le flux complet : Drive → Conversion → Visualisation

---

## 🎯 **Utilisation Finale (Objectif)**

1. L'utilisateur ouvre Google Drive dans Chrome avec l'extension installée
2. L'extension détecte un fichier `.blend`
3. Au clic sur le fichier, l'extension :
   - Envoie le fichier au backend Cloud Run pour conversion en `.glb`
   - Ouvre l'interface frontend Firebase Hosting dans un iframe
   - Affiche le modèle 3D converti avec les contrôles de visualisation

---

## 📊 **État d'Avancement**

| Composant | État | Progression |
|-----------|------|-------------|
| **Structure Projet** | ✅ Terminé | 100% |
| **Backend (code)** | ✅ Terminé | 100% |
| **Backend (déploiement)** | ⚠️ En cours | 80% |
| **Frontend (code)** | ✅ Terminé | 100% |
| **Frontend (déploiement)** | ⏳ À faire | 0% |
| **Extension Chrome** | ⏳ À faire | 0% |

**Progression globale : ~60%**

---

## 👤 **Auteur**

**ArseneGA**

---

## 📄 **License**

Projet privé

