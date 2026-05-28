import os
import glob
import shutil
import subprocess
import threading
import time
import zipfile
import io
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for all routes to make frontend development seamless
CORS(app)

# Local directories linked to Docker container volumes
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INPUTS_DIR = os.path.join(BASE_DIR, 'inputs')
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')

# Ensure directories exist
os.makedirs(INPUTS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

# Global dictionary to track MPI execution status
processing_state = {
    "status": "idle",  # "idle", "processing", "completed", "failed"
    "error": None,
    "start_time": 0,
    "duration": 0,
    "total_tasks": 0,
    "completed_tasks": 0
}

def clear_directory(directory_path):
    """Safely removes all files and subdirectories from a given directory."""
    for item in glob.glob(os.path.join(directory_path, '*')):
        try:
            if os.path.isfile(item) or os.path.islink(item):
                os.unlink(item)
            elif os.path.isdir(item):
                shutil.rmtree(item)
        except Exception as e:
            print(f"Error clearing {item}: {e}")

def run_mpi_processing():
    """Background worker thread that triggers the MPI cluster on Docker."""
    global processing_state
    
    # Reset tracking status
    processing_state["status"] = "processing"
    processing_state["error"] = None
    processing_state["start_time"] = time.time()
    processing_state["duration"] = 0
    
    # Construct the docker execution command
    # We are already inside the mpi-master container
    cmd = [
        "mpiexec", "--allow-run-as-root",
        "-host", "mpi-master,mpi-worker1,mpi-worker2",
        "-n", "3",
        "python", "/app/main.py"
    ]
    
    try:
        print(f"[Backend] Launching MPI subprocess: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, check=False)
        
        duration = time.time() - processing_state["start_time"]
        processing_state["duration"] = round(duration, 2)
        
        if result.returncode == 0:
            print("[Backend] MPI processing completed successfully.")
            processing_state["status"] = "completed"
        else:
            print(f"[Backend] MPI processing failed. Return code: {result.returncode}")
            print(f"Stdout:\n{result.stdout}")
            print(f"Stderr:\n{result.stderr}")
            processing_state["status"] = "failed"
            # Extract standard error or meaningful stdout
            processing_state["error"] = result.stderr if result.stderr.strip() else result.stdout
            
    except Exception as e:
        duration = time.time() - processing_state["start_time"]
        processing_state["duration"] = round(duration, 2)
        print(f"[Backend] Exception while running MPI process: {e}")
        processing_state["status"] = "failed"
        processing_state["error"] = str(e)

@app.route('/api/upload', methods=['POST'])
def upload_images():
    """Uploads multiple images to the inputs folder, clearing past runs first."""
    if 'files' not in request.files:
        return jsonify({"error": "No files key found in request."}), 400
        
    uploaded_files = request.files.getlist('files')
    if not uploaded_files or uploaded_files[0].filename == '':
        return jsonify({"error": "No files selected."}), 400
        
    # Clear both directories before saving new files to start a fresh batch
    clear_directory(INPUTS_DIR)
    clear_directory(OUTPUTS_DIR)
    
    saved_files = []
    for file in uploaded_files:
        filename = file.filename
        # Validate extension (JPG, PNG)
        ext = os.path.splitext(filename)[1].lower()
        if ext in ['.jpg', '.jpeg', '.png']:
            dest_path = os.path.join(INPUTS_DIR, filename)
            file.save(dest_path)
            saved_files.append(filename)
            
    # Reset processing state for the new batch
    global processing_state
    processing_state = {
        "status": "idle",
        "error": None,
        "start_time": 0,
        "duration": 0,
        "total_tasks": len(saved_files) * 3, # 3 operations per image: grayscale, blur, edges
        "completed_tasks": 0
    }
    
    return jsonify({
        "message": f"Successfully uploaded {len(saved_files)} images.",
        "files": saved_files
    }), 200

@app.route('/api/process', methods=['POST'])
def start_processing():
    """Triggers the MPI cluster in a background thread to prevent gateway timeouts."""
    global processing_state
    
    if processing_state["status"] == "processing":
        return jsonify({"error": "MPI Processing is already running."}), 400
        
    # Ensure there are images in the inputs directory to process
    inputs = glob.glob(os.path.join(INPUTS_DIR, '*.[jp][pn]*[g]'))
    if not inputs:
        return jsonify({"error": "No images available in inputs. Please upload images first."}), 400
        
    # Run the processing asynchronously
    thread = threading.Thread(target=run_mpi_processing)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "message": "MPI process initiated in background cluster.",
        "status": "processing"
    }), 202

@app.route('/api/status', methods=['GET'])
def get_status():
    """Returns the current execution status of the MPI cluster."""
    global processing_state
    
    # Dynamic computation of completed tasks based on files in outputs directory
    if processing_state["status"] == "processing":
        outputs = glob.glob(os.path.join(OUTPUTS_DIR, '*'))
        processing_state["completed_tasks"] = len(outputs)
        
    return jsonify(processing_state), 200

@app.route('/api/results', methods=['GET'])
def get_results():
    """Lists all processed images along with original mapping and file size."""
    # Find all original images
    original_images = [os.path.basename(p) for p in glob.glob(os.path.join(INPUTS_DIR, '*.[jp][pn]*[g]'))]
    
    # Find all processed images
    processed_paths = glob.glob(os.path.join(OUTPUTS_DIR, '*'))
    
    results = []
    for path in processed_paths:
        filename = os.path.basename(path)
        
        # main.py names outputs as f"{op}_{img_name}"
        # Valid ops: 'grayscale', 'blur', 'edges'
        operation = "unknown"
        original_name = filename
        
        for op in ['grayscale', 'blur', 'edges']:
            if filename.startswith(f"{op}_"):
                operation = op
                original_name = filename[len(op)+1:]
                break
                
        file_size = os.path.getsize(path)
        
        results.append({
            "filename": filename,
            "operation": operation,
            "originalName": original_name,
            "sizeBytes": file_size,
            "url": f"http://localhost:5000/api/download/{filename}"
        })
        
    return jsonify({
        "originals": original_images,
        "processed": results
    }), 200

@app.route('/api/download/<filename>', methods=['GET'])
def download_image(filename):
    """Downloads a processed image (or an original one as a fallback)."""
    # Check outputs directory first
    if os.path.exists(os.path.join(OUTPUTS_DIR, filename)):
        return send_from_directory(OUTPUTS_DIR, filename)
    # Check inputs directory next
    elif os.path.exists(os.path.join(INPUTS_DIR, filename)):
        return send_from_directory(INPUTS_DIR, filename)
    else:
        return jsonify({"error": "File not found."}), 404

@app.route('/api/download-all', methods=['GET'])
def download_all_images():
    """Generates an in-memory ZIP of all processed images and downloads it."""
    processed_files = glob.glob(os.path.join(OUTPUTS_DIR, '*'))
    if not processed_files:
        return jsonify({"error": "No processed images available to download."}), 400
        
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for file_path in processed_files:
            filename = os.path.basename(file_path)
            zf.write(file_path, filename)
            
    memory_file.seek(0)
    
    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name='mpi_processed_images.zip'
    )

if __name__ == '__main__':
    # Run the server on port 5000
    print("[Backend] Starting Flask server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
