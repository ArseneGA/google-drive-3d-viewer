/**
 * 3D Drive Viewer - Main Viewer Logic v1.2
 * Receives file content via postMessage and renders with Three.js
 */

console.log('🚀 Viewer.js v1.4 loaded - esm.sh CDN');

import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader';
import { ThreeMFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/3MFLoader';
import { FBXLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader';

// ============================================
// STATE
// ============================================

let scene, camera, renderer, controls;
let currentModel = null;
let originalMaterials = new Map(); // Stocke les matériaux d'origine pour restauration

// ============================================
// UI ELEMENTS
// ============================================

const loader = document.getElementById('loader');
const errorOverlay = document.getElementById('error-overlay');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const canvas = document.getElementById('viewer-canvas');

let lastFileData = null; // Pour le bouton retry

// ============================================
// INITIALIZATION
// ============================================

function initThreeJS() {
  console.log('🎨 Initializing Three.js...');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);
  // Fog désactivé pour une vue nette à toutes les distances

  // Camera
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(0, 5, 10);

  // Renderer
  renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    alpha: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting (soft Google-style)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(5, 10, 7.5);
  mainLight.castShadow = true;
  mainLight.shadow.camera.near = 0.1;
  mainLight.shadow.camera.far = 50;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);

  // Grid helper (subtle)
  const gridHelper = new THREE.GridHelper(20, 20, 0xd0d0d0, 0xe8e8e8);
  gridHelper.material.opacity = 0.3;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0.01; // Permettre de zoomer très près
  controls.maxDistance = 10000; // Permettre de dézoomer très loin
  
  // Permettre rotation complète à 360° sur tous les axes
  controls.minPolarAngle = 0; // Angle vertical minimum (0 = vue du dessus)
  controls.maxPolarAngle = Math.PI; // Angle vertical maximum (π = vue du dessous)
  controls.minAzimuthAngle = -Infinity; // Pas de limite de rotation horizontale
  controls.maxAzimuthAngle = Infinity; // Rotation horizontale illimitée
  
  controls.target.set(0, 0, 0);

  // Window resize
  window.addEventListener('resize', onWindowResize, false);

  // Animation loop
  animate();

  console.log('✅ Three.js initialized');
}

function onWindowResize() {
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}


/**
 * Met à jour les options du sélecteur de caméra et l'affichage conditionnel
 */
// Caméras supprimées: on rend toujours avec la caméra orbitale

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ============================================
// MODEL LOADING
// ============================================

function clearCurrentModel() {
  if (currentModel) {
    scene.remove(currentModel);
    currentModel.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    currentModel = null;
  }
}

function centerModel(object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Center the model
  object.position.x = -center.x;
  object.position.y = -center.y;
  object.position.z = -center.z;

  // Calculate optimal camera distance based on model size
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraDistance = Math.abs(maxDim / Math.tan(fov / 2));
  cameraDistance *= 1.8; // Add padding for better view
  
  // Adjust camera far plane if model is very large
  if (cameraDistance > camera.far * 0.8) {
    camera.far = cameraDistance * 3;
    camera.updateProjectionMatrix();
  }
  
  // Adjust camera near plane if model is very small
  if (maxDim < 1) {
    camera.near = maxDim * 0.001;
    camera.updateProjectionMatrix();
  }

  // Position camera at an angle for better perspective
  const angle = Math.PI / 4; // 45 degrees
  camera.position.set(
    Math.cos(angle) * cameraDistance,
    cameraDistance * 0.5,
    Math.sin(angle) * cameraDistance
  );
  
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  
  // Update control limits based on model size
  controls.minDistance = maxDim * 0.01;
  controls.maxDistance = maxDim * 100;
  
  controls.update();
  // Réinitialiser la caméra active sur la caméra orbitale
  activeCamera = camera;

  console.log(`📐 Model centered. Size: ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}, Distance: ${cameraDistance.toFixed(2)}`);
}

/**
 * Sauvegarde les matériaux d'origine d'un modèle
 */
function saveOriginalMaterials(model) {
  originalMaterials.clear();
  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      // Clone le matériau pour le sauvegarder
      if (Array.isArray(child.material)) {
        originalMaterials.set(child.uuid, child.material.map(m => m.clone()));
      } else {
        originalMaterials.set(child.uuid, child.material.clone());
      }
    }
  });
  console.log(`💾 ${originalMaterials.size} matériaux d'origine sauvegardés`);
}

/**
 * Applique un nouveau matériau (couleur) au modèle 3D actuel.
 * @param {number} hexColor - La couleur au format hexadécimal (ex: 0xff0000)
 */
function applyMaterial(hexColor) {
  if (!currentModel) {
    console.warn("⚠️ Pas de modèle chargé à mettre à jour.");
    return;
  }

  const newMaterial = new THREE.MeshPhongMaterial({
    color: hexColor,
    specular: 0x111111,
    shininess: 50,
    flatShading: false,
  });

  // Parcourir le modèle pour appliquer le nouveau matériau
  currentModel.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // ⚠️ IMPORTANT: Disposer de l'ancien matériau pour libérer la mémoire GPU
      if (child.material && !originalMaterials.has(child.uuid)) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      child.material = newMaterial;
    }
  });

  // NOTE: On ne dispose pas de newMaterial ici car il est partagé par tous les meshes
  console.log(`🎨 Couleur du modèle mise à jour à: #${hexColor.toString(16)}`);
}

/**
 * Restaure les couleurs/matériaux d'origine du modèle
 */
function restoreOriginalMaterials() {
  if (!currentModel) {
    console.warn("⚠️ Pas de modèle chargé à restaurer.");
    return;
  }

  if (originalMaterials.size === 0) {
    console.warn("⚠️ Aucun matériau d'origine sauvegardé.");
    return;
  }

  currentModel.traverse((child) => {
    if (child instanceof THREE.Mesh && originalMaterials.has(child.uuid)) {
      const originalMat = originalMaterials.get(child.uuid);
      child.material = originalMat;
    }
  });

  console.log("🔄 Couleurs d'origine restaurées");
}

/**
 * Applique des couleurs différentes à chaque objet (mode multicouleur)
 */
function applyMulticolor() {
  if (!currentModel) {
    console.warn("⚠️ Pas de modèle chargé à colorer.");
    return;
  }

  const colors = [
    0x4285f4, // Bleu Google
    0x34a853, // Vert Google
    0xfbbc05, // Jaune Google
    0xea4335, // Rouge Google
    0x9c27b0, // Violet
    0xff6d00, // Orange
    0x00bcd4, // Cyan
    0xe91e63, // Rose
  ];

  let colorIndex = 0;
  let meshCount = 0;

  currentModel.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const color = colors[colorIndex % colors.length];
      const newMaterial = new THREE.MeshPhongMaterial({
        color: color,
        specular: 0x111111,
        shininess: 50,
        flatShading: false,
      });

      // Disposer de l'ancien matériau si ce n'est pas l'original
      if (child.material && !originalMaterials.has(child.uuid)) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }

      child.material = newMaterial;
      colorIndex++;
      meshCount++;
    }
  });

  console.log(`🌈 Mode multicouleur appliqué à ${meshCount} objets`);
}

function loadSTL(arrayBuffer) {
  console.log('📦 Loading STL model...');
  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);

  // Créer un mesh avec un matériau par défaut
  const defaultMaterial = new THREE.MeshPhongMaterial({
    color: 0x4285f4, // Google Blue
    specular: 0x111111,
    shininess: 50,
    flatShading: false,
  });
  const mesh = new THREE.Mesh(geometry, defaultMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  clearCurrentModel();
  currentModel = mesh;
  scene.add(mesh);
  centerModel(mesh);
  
  // Sauvegarder le matériau d'origine avant toute modification
  saveOriginalMaterials(mesh);

  console.log('✅ STL model loaded');
}

function loadOBJ(text) {
  console.log('📦 Loading OBJ model...');
  const loader = new OBJLoader();
  const object = loader.parse(text);

  // Appliquer les propriétés de base et matériau par défaut aux meshes
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshPhongMaterial({
        color: 0x34a853, // Google Green
        specular: 0x111111,
        shininess: 50,
      });
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  clearCurrentModel();
  currentModel = object;
  scene.add(object);
  centerModel(object);

  // Sauvegarder les matériaux d'origine
  saveOriginalMaterials(object);

  console.log('✅ OBJ model loaded');
}

function loadGLTF(arrayBuffer, fileName) {
  console.log('📦 Loading GLTF/GLB model...');
  const loader = new GLTFLoader();

  try {
    // Utilise parse() au lieu de load() pour éviter les problèmes de CSP avec blob URLs
    loader.parse(arrayBuffer, '', (gltf) => {
      clearCurrentModel();

      const model = gltf.scene;

      // Assurer que le modèle hérité prend en charge les ombres
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      currentModel = model;
      scene.add(model);
      centerModel(model);
      
      // Sauvegarder les matériaux d'origine (GLTF/GLB ont souvent leurs propres matériaux)
      saveOriginalMaterials(model);

      // Caméras supprimées: aucune extraction

      console.log(`✅ ${fileName} loaded successfully!`);
      hideLoader();

    }, (error) => {
      console.error('❌ Error loading GLTF/GLB model:', error);
      showError(`Erreur de chargement GLTF/GLB: ${error.message}. Vérifiez le format d'exportation.`);
      hideLoader();
    });
  } catch (error) {
    console.error('❌ Error parsing GLTF/GLB model:', error);
    showError(`Erreur de parsing GLTF/GLB: ${error.message}`);
    hideLoader();
  }
}

function load3MF(arrayBuffer) {
  console.log('📦 Loading 3MF model...');
  const loader = new ThreeMFLoader();

  try {
    // Le ThreeMFLoader parse l'ArrayBuffer directement
    const object = loader.parse(arrayBuffer);

    clearCurrentModel();
    currentModel = object;
    scene.add(object);
    centerModel(object);

    // Assurer le support des ombres sur les meshes
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Sauvegarder les matériaux d'origine (3MF supporte les couleurs)
    saveOriginalMaterials(object);

    console.log('✅ 3MF model loaded');

  // Caméras supprimées
  } catch (error) {
    console.error('❌ Error loading 3MF model:', error);
    showError(`Erreur de chargement 3MF: ${error.message}`);
  }
}

function loadFBX(arrayBuffer, fileName) {
  console.log('📦 Loading FBX model...');
  const loader = new FBXLoader();

  // Créer un Blob URL pour le loader FBX car il est asynchrone
  const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  loader.load(url, (object) => {
    URL.revokeObjectURL(url);
    clearCurrentModel();

    currentModel = object;
    scene.add(object);
    centerModel(object);

    // Activer les ombres
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Sauvegarder les matériaux d'origine (FBX a souvent des matériaux complexes)
    saveOriginalMaterials(object);

    console.log(`✅ ${fileName} loaded successfully!`);
    hideLoader();

    // Caméras supprimées

  }, undefined, // onProgress
  (error) => {
    URL.revokeObjectURL(url);
    console.error('❌ Error loading FBX model:', error);
    showError(`Erreur de chargement FBX: ${error.message}.`);
    hideLoader();
  });
}

// ============================================
// FILE LOADING FROM POSTMESSAGE
// ============================================

function loadModelFromData(fileName, arrayBuffer) {
  try {
    console.log(`🚀 Loading model: ${fileName}`);
    console.log(`📦 File size: ${(arrayBuffer.byteLength / 1024).toFixed(2)} KB`);
    
    showLoader();
    lastFileData = { fileName, arrayBuffer };

    const fileNameLower = fileName.toLowerCase();

    if (fileNameLower.endsWith('.stl')) {
      loadSTL(arrayBuffer);
    } else if (fileNameLower.endsWith('.obj')) {
      // Convert ArrayBuffer to text for OBJ
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(arrayBuffer);
      loadOBJ(text);
    } else if (fileNameLower.endsWith('.gltf') || fileNameLower.endsWith('.glb')) {
      // 🚀 NOUVEAU SUPPORT GLTF/GLB
      loadGLTF(arrayBuffer, fileName);
      return; // Sortir, car loadGLTF est asynchrone et gère hideLoader()
    } else if (fileNameLower.endsWith('.3mf')) {
      // 🚀 NOUVEAU SUPPORT 3MF
      load3MF(arrayBuffer);
    } else if (fileNameLower.endsWith('.fbx')) {
      // 🚀 NOUVEAU SUPPORT FBX
      loadFBX(arrayBuffer, fileName);
      return; // Le chargement FBX est asynchrone
    } else {
      throw new Error(`Format non supporté: ${fileName}. Formats supportés: .stl, .obj, .gltf, .glb, .3mf, .fbx`);
    }

    hideLoader();
    console.log('🎉 Model loaded successfully!');

  } catch (error) {
    console.error('❌ Error loading model:', error);
    showError(error.message);
  }
}

// ============================================
// UI HELPERS
// ============================================

function showLoader() {
  loader.classList.remove('hidden');
  errorOverlay.style.display = 'none';
}

function hideLoader() {
  loader.classList.add('hidden');
}

function showError(message) {
  hideLoader();
  errorMessage.textContent = message;
  errorOverlay.style.display = 'flex';
}

function hideError() {
  errorOverlay.style.display = 'none';
}

// ============================================
// MESSAGE HANDLING
// ============================================

window.addEventListener('message', (event) => {
  console.log('📨 Message received from:', event.origin);
  console.log('📨 Message type:', event.data?.type);
  console.log('📨 Full message data:', event.data);

  if (event.data.type === 'load_model') {
    const { fileName, fileData } = event.data;
    console.log('📦 load_model received:', {
      fileName,
      hasFileData: !!fileData,
      fileDataType: fileData?.constructor?.name,
      fileDataSize: fileData?.byteLength
    });
    
    if (fileName && fileData) {
      loadModelFromData(fileName, fileData);
    } else {
      console.error('❌ Données manquantes:', { fileName, hasFileData: !!fileData });
      showError('Données du fichier invalides');
    }
  } else if (event.data.type === 'load_error') {
    console.error('❌ Erreur reçue:', event.data.error);
    showError(event.data.error || 'Erreur inconnue');
  } else if (event.data.type === 'conversion_status') {
    const { status, progress } = event.data;
    const text = document.getElementById('loader-text');
    if (text && status) {
      text.textContent = progress != null ? `${status} (${progress}%)` : status;
    }
    const bar = document.getElementById('loader-bar-fill');
    if (bar && progress != null) {
      bar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    }
  }
});

// Retry button
retryBtn.addEventListener('click', () => {
  if (lastFileData) {
    hideError();
    loadModelFromData(lastFileData.fileName, lastFileData.arrayBuffer);
  }
});

// ============================================
// STARTUP
// ============================================

console.log('🎬 3D Drive Viewer starting...');
console.log('🌐 Running on:', window.location.href);

// Initialize Three.js
initThreeJS();

// Notify parent that viewer is ready (avec retry)
if (window.parent !== window) {
  const notifyParent = () => {
    window.parent.postMessage({ type: 'viewer_ready' }, '*');
    console.log('📡 Notified parent: viewer ready');
  };
  
  // Envoyer immédiatement
  notifyParent();
  
  // Puis réessayer toutes les 100ms pendant 3 secondes (au cas où le parent n'est pas prêt)
  let attempts = 0;
  const retryInterval = setInterval(() => {
    attempts++;
    notifyParent();
    if (attempts >= 30) {
      clearInterval(retryInterval);
      console.log('⏹️ Stopped retry after 30 attempts');
    }
  }, 100);
}

// Hide loader initially
hideLoader();

console.log('✅ Viewer initialized and waiting for file data...');

// ============================================
// LOGIQUE DE CONTRÔLE DE MATÉRIAUX
// ============================================

const colorSwatches = document.querySelectorAll('.color-swatch');

colorSwatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    const hex = swatch.getAttribute('data-color');
    if (hex) {
      // Convertit la chaîne "0xRRGGBB" en nombre
      const colorNumber = parseInt(hex, 16); 
      applyMaterial(colorNumber);
    }
  });
});

// Bouton couleur d'origine
const originalColorBtn = document.getElementById('original-color-btn');
if (originalColorBtn) {
  originalColorBtn.addEventListener('click', () => {
    restoreOriginalMaterials();
  });
}

// Bouton multicouleur
const multicolorBtn = document.getElementById('multicolor-btn');
if (multicolorBtn) {
  multicolorBtn.addEventListener('click', () => {
    applyMulticolor();
  });
}
