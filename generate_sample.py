import cv2
import numpy as np
import os

def create_sample_image():
    input_dir = '/app/inputs'
    if not os.path.exists(input_dir):
        os.makedirs(input_dir)

    # Crear una imagen simulada (Mock base image)
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    
    # Fondo azul claro simulando cielo
    img[:] = (250, 200, 150) 
    
    # Un círculo rojo (como un sol)
    cv2.circle(img, (100, 100), 50, (0, 0, 255), -1)
    
    # Un rectángulo verde (como una montaña o terreno)
    cv2.rectangle(img, (0, 300), (600, 400), (0, 200, 0), -1)
    
    # Algunas líneas complejas para que Canny (bordes) funcione bien
    cv2.line(img, (300, 150), (400, 250), (255, 0, 0), 5)
    cv2.line(img, (400, 150), (300, 250), (255, 0, 0), 5)
    
    # Guardar la imagen generada
    output_path = os.path.join(input_dir, 'sample_photo.jpg')
    cv2.imwrite(output_path, img)
    print(f"Imagen de prueba generada con éxito en: {output_path}")

if __name__ == "__main__":
    create_sample_image()
