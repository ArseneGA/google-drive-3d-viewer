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
│   ├── firebase.json   # Configuration Firebase Hosting
│   ├── .firebaserc     # Liaison projet Firebase
│   └── public/
│       ├── index.html # Interface principale
│       ├── style.css  # Styles Material 3
│       ├── viewer-v2.js # Logic Three.js
│       ├── logo.svg   # Logo du projet
│       └── 404.html    # Page d'erreur
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

### **2. Backend (Cloud Run)** ✅ **DÉPLOYÉ**

**Déploiement effectué avec succès :**

- ✅ Copie des fichiers backend depuis l'ancien projet
- ✅ Configuration Cloud Build (`cloudbuild.yaml`)
- ✅ **Déploiement sur Google Cloud Run réussie :**
  - Service : `blend-converter-api`
  - Région : `us-central1`
  - Mémoire : 4 GiB
  - Timeout : 600 secondes (10 minutes)
  - Image : Conteneur Docker avec Blender 3.6.15 LTS

**Commandes de déploiement :**
```bash
cd backend
gcloud run deploy blend-converter-api \
  --source . \
  --platform managed \
  --project drive3dviewer \
  --region us-central1 \
  --allow-unauthenticated \
  --memory=4Gi \
  --timeout=600 \
  --port=5000
```

**Résolution des permissions IAM :**
- Compte de service Cloud Build : Rôle `Logs Writer` + `Artifact Registry Writer`
- Compte utilisateur : Rôle `Owner` pour gestion des permissions

**Endpoints disponibles :**
- `GET /` : Health check
- `POST /convert` : Conversion `.blend` → `.glb`
- `GET /formats` : Formats supportés

### **3. Frontend (Firebase Hosting)** ✅ **DÉPLOYÉ**

**Déploiement effectué avec succès :**

- ✅ Copie des fichiers frontend depuis l'ancien projet
- ✅ Configuration Firebase Hosting (`firebase.json`, `.firebaserc`)
- ✅ **Déploiement Firebase Hosting réussi :**
  - URL : `https://drive3dviewer.web.app`
  - Projet : `drive3dviewer`
  - Dossier public : `public/`

**Commandes de déploiement :**
```bash
cd frontend
firebase init hosting
# Configuration : projet drive3dviewer, dossier public, mode non-SPA
firebase deploy --only hosting
```

**Fonctionnalités déployées :**
- Support 6 formats : `.stl`, `.obj`, `.gltf`, `.glb`, `.3mf`, `.fbx`
- Contrôles de matériaux : palette de couleurs Google, mode multicouleur
- Contrôles de caméra : rotation 360°, zoom, pan
- Communication `postMessage` pour réception des fichiers depuis l'extension

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

### **1. ✅ Backend** - Terminé
- ✅ Déploiement Cloud Run réussi
- ✅ Service en ligne et fonctionnel
- ⏳ Récupérer l'URL exacte du service Cloud Run pour l'extension

### **2. ✅ Frontend** - Terminé
- ✅ Firebase Hosting configuré et déployé
- ✅ URL : `https://drive3dviewer.web.app`

### **3. ⏳ Extension Chrome** - À développer
- [ ] Créer le dossier `extension/`
- [ ] Configurer `manifest.json` (Manifest V3)
- [ ] Implémenter la détection des fichiers 3D dans Google Drive
- [ ] Connecter l'extension au backend Cloud Run
- [ ] Connecter l'extension au frontend Firebase Hosting
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
| **Backend (déploiement)** | ✅ Terminé | 100% |
| **Frontend (code)** | ✅ Terminé | 100% |
| **Frontend (déploiement)** | ✅ Terminé | 100% |
| **Extension Chrome** | ⏳ À faire | 0% |

**Progression globale : ~83%**

---

## 🔗 **URLs Déployées**

```
Backend (Cloud Run)  : https://blend-converter-api-xxxxx.a.run.app
                      (URL à récupérer via: gcloud run services describe blend-converter-api --region=us-central1)
Frontend (Firebase)  : https://drive3dviewer.web.app ✅
Extension            : (En développement)
```

---

## 👤 **Auteur**

**ArseneGA**

---

## 📄 **License**

Projet privé

