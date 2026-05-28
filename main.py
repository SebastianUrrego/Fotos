"""
Sistema Distribuido de Procesamiento de Imágenes (Fase 1)
Arquitectura: Master-Worker
Tecnologías: Python, MPI, OpenCV
"""
from mpi4py import MPI
import cv2
import os
import glob
import time

# Inicialización de MPI
comm = MPI.COMM_WORLD
rank = comm.Get_rank()
size = comm.Get_size()

INPUT_DIR = '/app/inputs'
OUTPUT_DIR = '/app/outputs'

def process_image(image, operation):
    """Aplica el procesamiento OpenCV a la imagen."""
    try:
        if operation == 'grayscale':
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        elif operation == 'blur':
            # Aplicar filtro de suavizado
            return cv2.GaussianBlur(image, (15, 15), 0)
        elif operation == 'edges':
            # Detección de bordes usando el algoritmo Canny
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            return cv2.Canny(gray, 100, 200)
    except Exception as e:
        print(f"[Worker {rank}] Error al procesar '{operation}': {e}")
    return image

def master_node():
    print(f"[Master] Iniciando sistema distribuido con {size} nodos en total.")
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    image_paths = glob.glob(os.path.join(INPUT_DIR, '*.[jp][pn]*[g]')) 
    if not image_paths:
        print("[Master] No se encontraron imágenes en la carpeta 'inputs/'.")
        # Mandar señal de fin a los workers
        for i in range(1, size):
            comm.send({'command': 'stop'}, dest=i, tag=1)
        return

    print(f"[Master] Se encontraron {len(image_paths)} imágenes para procesar.")
    
    if size < 2:
        print("[Master] Error: Se requiere al menos 1 nodo Worker (Mínimo 2 procesos totales).")
        return

    operations = ['grayscale', 'blur', 'edges']
    tasks = []
    
    # Construir lista de tareas: por cada imagen se van a hacer 3 procesamientos
    for path in image_paths:
        img_name = os.path.basename(path)
        for op in operations:
            tasks.append((path, img_name, op))
            
    total_tasks = len(tasks)
    worker_status = {i: 'idle' for i in range(1, size)}
    
    task_idx = 0
    start_time = time.time()
    
    # Asignación dinámica de tareas (Dynamic Load Balancing)
    while task_idx < total_tasks or 'working' in worker_status.values():
        for i in range(1, size):
            # Asignar nueva tarea si el worker está ocioso y hay tareas disponibles
            if worker_status[i] == 'idle' and task_idx < total_tasks:
                path, img_name, op = tasks[task_idx]
                
                # Leemos la imagen directamente en el master para serializarla y enviarla
                image_data = cv2.imread(path)
                if image_data is None:
                    print(f"[Master] Advertencia: No se pudo cargar la imagen {path}")
                    task_idx += 1
                    continue
                
                print(f"[Master] Enviando tarea ({op} -> {img_name}) al Worker {i}")
                
                task_msg = {
                    'command': 'process',
                    'operation': op,
                    'name': img_name,
                    'image': image_data
                }
                # Enviar mensaje conteniendo la matriz numpy de la imagen
                comm.send(task_msg, dest=i, tag=1)
                
                worker_status[i] = 'working'
                task_idx += 1
                
            # Verificar si un worker ocupado ha terminado su trabajo
            elif worker_status[i] == 'working':
                if comm.Iprobe(source=i, tag=2):
                    result_msg = comm.recv(source=i, tag=2)
                    
                    status = result_msg.get('status')
                    if status == 'success':
                        res_img = result_msg.get('result_image')
                        op = result_msg.get('operation')
                        img_name = result_msg.get('name')
                        
                        out_name = f"{op}_{img_name}"
                        out_path = os.path.join(OUTPUT_DIR, out_name)
                        cv2.imwrite(out_path, res_img)
                        print(f"[Master] Recibida imagen procesada desde Worker {i} -> {out_name}")
                    else:
                        error_msg = result_msg.get('error', 'Error desconocido')
                        print(f"[Master] El Worker {i} reportó un error: {error_msg}")
                        
                    worker_status[i] = 'idle'
                    
    # Apagar a todos los workers
    for i in range(1, size):
        comm.send({'command': 'stop'}, dest=i, tag=1)
        
    duration = time.time() - start_time
    print(f"\n[Master] Procesamiento total completado en {duration:.2f} segundos.")
    print("[Master] Apagando el sistema distribuido.")

def worker_node():
    print(f"[Worker {rank}] Inicializado y en espera de tareas.")
    
    while True:
        # Bloquear hasta recibir un mensaje del Master (tag 1)
        task_msg = comm.recv(source=0, tag=1)
        command = task_msg.get('command')
        
        if command == 'stop':
            print(f"[Worker {rank}] Señal de apagado recibida. Terminando proceso.")
            break
            
        elif command == 'process':
            op = task_msg.get('operation')
            img_name = task_msg.get('name')
            image = task_msg.get('image')
            
            # Procesar la imagen solicitada
            result_img = process_image(image, op)
            
            if result_img is not None:
                result_msg = {
                    'status': 'success',
                    'operation': op,
                    'name': img_name,
                    'result_image': result_img
                }
            else:
                result_msg = {
                    'status': 'error',
                    'error': 'Fallo durante el procesamiento en OpenCV'
                }
                
            # Retornar la matriz numpy de la imagen procesada al Master (tag 2)
            comm.send(result_msg, dest=0, tag=2)

if __name__ == '__main__':
    if rank == 0:
        master_node()
    else:
        worker_node()
