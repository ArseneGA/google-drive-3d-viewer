#!/usr/bin/env python3
"""
Backend Flask pour convertir des fichiers .blend en .glb
Utilise Blender CLI pour la conversion
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, join_room
import subprocess
import tempfile
import os
import logging
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Permettre les requêtes depuis l'extension Chrome
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Script Python pour Blender
BLENDER_SCRIPT = """
import bpy
import sys

# Ouvrir le fichier .blend
blend_file = sys.argv[-2]
output_file = sys.argv[-1]

print(f"Opening {blend_file}...")
bpy.ops.wm.open_mainfile(filepath=blend_file)

print(f"Exporting to {output_file}...")
bpy.ops.export_scene.gltf(
    filepath=output_file,
    export_format='GLB',
    export_apply=True
)

print("Conversion successful!")
"""

@app.route('/', methods=['GET'])
def health_check():
    """Endpoint de santé pour vérifier que le serveur fonctionne"""
    return jsonify({
        'status': 'ok',
        'service': 'Blend to GLB Converter',
        'version': '1.0.0'
    })

def emit_status(job_id: str, message: str, progress: int | None = None):
    if not job_id:
        return
    payload = {"type": "status", "message": message}
    if progress is not None:
        payload["progress"] = progress
    socketio.emit('conversion_status', payload, to=job_id)


@app.route('/convert', methods=['POST'])
def convert_blend_to_glb():
    """
    Convertit un fichier .blend en .glb
    
    Paramètres:
        - file: Le fichier .blend (multipart/form-data)
    
    Retourne:
        - Le fichier .glb converti
    """
    try:
        # Récupérer jobId pour les statuts temps réel
        job_id = request.form.get('jobId')
        emit_status(job_id, "Connexion au moteur de conversion…", 5)

        # Vérifier qu'un fichier a été envoyé
        if 'file' not in request.files:
            logger.error("Aucun fichier fourni")
            return jsonify({'error': 'Aucun fichier fourni'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            logger.error("Nom de fichier vide")
            return jsonify({'error': 'Nom de fichier vide'}), 400
        
        if not file.filename.endswith('.blend'):
            logger.error(f"Format invalide: {file.filename}")
            return jsonify({'error': 'Le fichier doit être un .blend'}), 400
        
        logger.info(f"🎨 Conversion de {file.filename}...")
        
        # Créer des fichiers temporaires
        with tempfile.NamedTemporaryFile(suffix='.blend', delete=False) as tmp_blend:
            blend_path = tmp_blend.name
            file.save(blend_path)
            logger.info(f"   Fichier .blend sauvegardé: {blend_path}")
        emit_status(job_id, f"Téléchargement reçu ({os.path.getsize(blend_path)//1024} KB)", 20)
        
        # Créer le fichier de sortie .glb
        glb_path = blend_path.replace('.blend', '.glb')
        
        # Créer le script Blender temporaire
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as tmp_script:
            script_path = tmp_script.name
            tmp_script.write(BLENDER_SCRIPT)
            logger.info(f"   Script Blender créé: {script_path}")
        
        # Exécuter Blender en mode background
        logger.info("   🔄 Exécution de Blender...")
        emit_status(job_id, "Conversion en cours via Blender CLI…", 60)
        
        # Variables d'environnement pour mode headless sécurisé
        blender_env = {
            **os.environ,
            'BLENDER_USER_CONFIG': '/tmp',
            'BLENDER_SYSTEM_DATAFILES': '/usr/share/blender',
            'HOME': '/tmp',
            'TMPDIR': '/tmp',
            'TEMP': '/tmp',
            'TMP': '/tmp',
            # Désactiver certaines fonctionnalités réseau/système au niveau OS (pas d'override OCIO)
        }
        
        result = subprocess.run([
            'blender',
            '--background',
            '-noaudio',
            '--factory-startup',  # Ignorer les préférences utilisateur
            '--enable-autoexec',  # Permettre l'exécution de scripts
            '--python-use-system-env',  # Utiliser les variables d'environnement système
            '--python', script_path,
            '--', blend_path, glb_path
        ], 
        capture_output=True, 
        text=True, 
        timeout=120,
        env=blender_env)
        
        # Logger la sortie Blender pour debug
        logger.info(f"   📋 Blender stdout: {result.stdout[:500]}")
        if result.stderr:
            logger.warning(f"   ⚠️ Blender stderr: {result.stderr[:500]}")
        
        # Nettoyer les fichiers temporaires
        os.unlink(blend_path)
        os.unlink(script_path)
        
        if result.returncode != 0:
            logger.error(f"❌ Erreur Blender (code {result.returncode})")
            return jsonify({
                'error': 'Erreur de conversion',
                'details': result.stderr or result.stdout,
                'returncode': result.returncode
            }), 500
        
        # Vérifier que le fichier .glb a été créé
        if not os.path.exists(glb_path):
            logger.error("Fichier .glb non créé")
            return jsonify({'error': 'La conversion a échoué'}), 500
        
        logger.info(f"   ✅ Conversion réussie: {glb_path}")
        emit_status(job_id, "Optimisation et préparation du fichier .glb…", 85)
        
        # Retourner le fichier .glb
        emit_status(job_id, "Terminé ✅", 100)
        return send_file(
            glb_path,
            mimetype='model/gltf-binary',
            as_attachment=True,
            download_name=file.filename.replace('.blend', '.glb')
        )
    
    except subprocess.TimeoutExpired:
        logger.error("Timeout lors de la conversion")
        return jsonify({'error': 'La conversion a pris trop de temps (>2 min)'}), 408
    
    except Exception as e:
        logger.error(f"Erreur inattendue: {str(e)}")
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@app.route('/formats', methods=['GET'])
def supported_formats():
    """Retourne les formats supportés"""
    return jsonify({
        'input': ['.blend'],
        'output': ['.glb'],
        'max_size_mb': 50
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
