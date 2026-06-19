# 📸 Sistema Distribuido de Procesamiento de Imágenes (Con Interfaz Web)

Bienvenido al procesador de imágenes. Este proyecto es una herramienta estilo plataforma web completa, diseñada usando computación **paralela y distribuida** para procesar imágenes extremadamente rápido aplicando múltiples filtros en tiempo real. 

El sistema ya no se limita a comandos de consola; ahora cuenta con una arquitectura web completa, una API moderna en Flask y un panel de interfaz gráfica inmersiva desarrollada en React.

---

## 🚀 ¿Qué hace y cómo funciona?

El sistema unifica tres componentes clave para lograr una experiencia escalable:

### 1. El Frontend (Página Web interactiva)
Construido usando **React y Vite**, la aplicación provee un diseño de alta calidad (Dark Mode con detalles cyan). Las características principales son:
* **Área Drag & Drop:** Los usuarios arrastran múltiples imágenes (.PNG o .JPG) directamente a la página.
* **Galería interactiva pre-procesamiento:** Visualización de miniaturas simulando el escenario original.
* **Galería Directa de Resultados (Modo Lightbox):** Tras mandarle la señal al clúster, el servidor recibe los nuevos resultados. La web muestra las imágenes en una nueva cuadrícula expandible automáticamente (Tarjeta de Original y sus 5 nuevos filtros calculados al mismo tiempo).

### 2. El Backend Web (Python + Flask)
Actúa como comunicador o puente entre la página web de los clientes y el poder de cálculo del clúster oculto (Docker). 
El servidor está expuesto en un puerto seguro para que el Frontend mande sus fotos usando una API RESTful (`/api/upload`, `/api/process`, `/api/results`). Las fotos se depositan en el directorio interno del servidor y luego el Backend arranca un proceso en segundo plano de MPI.

### 3. Computación Paralela y Distribuida (El Clúster MPI + Docker)
Para lograr que la edición masiva no rompa el sistema y ocurra asíncronamente mientras el usuario espera, aplicamos 2 conceptos:
* **🌐 Computación Distribuida (Master-Worker):** Usamos Docker Compose para crear físicamente varias máquinas aisladas en terminales distintas conectadas por su propia red interna (`mpi-master`, `mpi-worker1`, `mpi-worker2`). Utilizando la interfaz **OpenMPI**, el "Master" asimila las fotos locales en arrays numéricos de imagen reales y los manda por la red de Docker distribuyéndolos en partes equitativas a los Trabajadores.
* **⚡ Computación Paralela (OpenCV Load Balancing):** En vez de asignar estáticamente tareas lentas, usamos un **Balanceo Dinámico De Cargas (Dynamic Load Balancing)**. Mientras un trabajador renderiza el "Filtro Sepia" a una foto, otro trabajador le está aplicando un desenfoque Gaussiano ("Blur"). Un proceso se libera e inmediatamente solicita otra parte de otra matriz asíncronamente reduciendo los cuellos de botella. 

Toda la detección paralela y los cálculos lógicos se hacen con librerías matriciales embebidas en nivel bajo como OpenCV (procesando el `Sepia`, `Negativo`, `Desenfoque`, `Escala de Grises`, y `Bordes` ). 

---

## ⚙️ ¿Cómo levantar la Aplicación Web completa?

Para probar el proyecto completo se necesitan 3 componentes levantados al tiempo.
Asegúrate de contar con **Docker Desktop**, **Node.js** y **Python (con pip)** en tu computadora. Puedes ejecutar esto simultáneamente en distintas terminales.

### Paso 1: Levantar los Nodos del Clúster (Docker)
En la carpeta raíz del proyecto, enciende los tres trabajadores paralelos en segundo plano. Esto deja a nuestro clúster escuchando las peticiones:
```bash
docker-compose up --build -d
```

### Paso 2: Encender el Servidor API de Flask (Backend)
Debemos instalar los requisitos previos de Python (si no lo has hecho) y luego encender el servicio que orquestará los llamados hacia el Clúster. 
Abre una consola en la raíz de tu proyecto `d:\Escritorio2\uni\paralela`:
```bash
# 1. Instala el módulo de Flask y utilidades web
pip install flask flask-cors

# 2. Corre el script (esto debe quedar abierto escuchando peticiones en el puerto 5000)
python server.py
```

### Paso 3: Lanzar la Página Web (Frontend React)
Para ver la interfaz gráfica bonita y visualizar todo el proceso:
Abre otra nueva consola en `d:\Escritorio2\uni\paralela\frontend`
```bash
# 1. Instalar las dependencias de componentes si es primera vez (Opcional si ya se hizo)
npm install

# 2. Iniciar el entorno en puerto 5173 o 5174
npm run dev
```

🚀 Abre en tu navegador favorito el enlace que Vite te escupa (normalmente `http://localhost:5173/` o `http://localhost:5174/`).

1. Arrastra unas cuantas fotos.
2. Da clic en subir.
3. Observa cómo el servidor Flask comanda al Clúster escondido (Docker), orquesta a cada Worker, procesa un total de 5 imágenes hijas por cada foto subida y te las retorna gráficamente hermosas y renderizadas en la interfaz final.


<img width="1890" height="900" alt="image" src="https://github.com/user-attachments/assets/bf75cd90-63ae-4d45-a7ba-c42934abd7d6" />

<img width="1001" height="906" alt="image" src="https://github.com/user-attachments/assets/73bdecfb-0857-4f49-94e1-5af35f214b6e" />
