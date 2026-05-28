# 📸 Sistema Distribuido de Procesamiento de Imágenes (Fase 1)

¡Hola! Bienvenido a la primera fase de nuestro procesador de imágenes. Básicamente, estamos construyendo el "motor" de una herramienta al estilo de Google Photos, usando computación paralela y distribuida para procesar imágenes súper rápido.

En esta etapa inicial logramos crear una prueba de concepto sólida: nuestro sistema ya puede dividir el trabajo pesado entre varios "servidores" virtuales y procesar fotos en paralelo.

## 🚀 ¿Qué hace y cómo funciona?

Para que esto funcione rápido y no saturemos una sola máquina, armamos una arquitectura tipo **Maestro-Trabajador (Master-Worker)**. Se divide en dos conceptos clave:

*   **🌐 Computación Distribuida:** En vez de correr todo en un solo programa pesado, usamos Docker para simular múltiples computadoras conectadas en red (`mpi-master`, `mpi-worker1` y `mpi-worker2`). El "Maestro" toma las fotos, las vuelve archivos de datos (bytes) y se las manda a los "Trabajadores" a través de la red simulada usando **MPI (Message Passing Interface con OpenMPI)**.
*   **⚡ Computación Paralela:** ¡Aquí es donde ocurre la magia! Mientras el Trabajador 1 usa su procesador para encontrar los bordes de una foto, al mismo exacto tiempo el Trabajador 2 está aplicándole un filtro de desenfoque a otra foto en la cola. Todo esto lo logramos utilizando las herramientas avanzadas de **OpenCV**.

## ⚙️ ¿Cómo probar el proyecto?

Hicimos que probar esto sea súper fácil, no tienes que meterte a tirar comandos raros si no quieres. 

### Lo que necesitas tener instalado:
* **Docker Desktop** (o Docker Engine) abierto.

### La forma fácil (¡1 Click!):
Simplemente abre tu consola en esta carpeta y ejecuta nuestro script automático:
```cmd
.\run.bat
```
*(¿Qué hace esto por debajo? Levanta los contenedores, dibuja una imagen de prueba por ti para que haya algo que procesar y le avisa a MPI que arranque el análisis entre todos los nodos).*

### La forma manual (Paso a paso para depurar):
Si quieres ver exactamente qué está pasando por debajo, puedes abrir tu consola y usar estos comandos:
```bash
# 1. Por si acaso, limpiamos cualquier contenedor viejo que haya quedado:
docker-compose down

# 2. Encendemos nuestros nodos virtuales en segundo plano:
docker-compose up --build -d

# 3. Creamos la imagen de prueba para tener algo que procesar:
docker exec -it mpi-master python /app/generate_sample.py

# 4. ¡Soltamos a los trabajadores! Damos la orden a MPI para que orqueste todo:
docker exec -it mpi-master mpiexec --allow-run-as-root -host mpi-master,mpi-worker1,mpi-worker2 -n 3 python /app/main.py
```

Después de unos segunditos, verás que dentro de la carpeta `/outputs` (que se creará aquí mismo) aparecerán todas las imágenes ya procesadas por el clúster.

## 🔮 ¿Qué sigue para las próximas fases? (To-Do List)

Ya armamos todo el motor y los cimientos (la infraestructura y las matemáticas de OpenCV). Para que el resto del equipo pueda llevar esto al siguiente nivel, nos harían falta estas cositas:

*   [ ] **Frontend (Interfaz Gráfica):** Una página web bonita (puede ser en React, Next.js o Vue) donde la gente pueda simplemente arrastrar sus fotos y ver los resultados sin tocar la consola ni saber qué es Docker.
*   [ ] **Guardado en la Nube (Storage Escalable):** Dejar de usar carpetas locales (`inputs` / `outputs`) y conectar el sistema a una base de datos o un servicio en la nube (como Amazon S3 o Firebase) para manejar un volumen de datos real.
*   [ ] **Más magia con Inteligencia Artificial:** Ya que tenemos OpenCV configurado, ¡el límite es nuestra imaginación! Podríamos agregar detección de objetos con YOLO, clasificación de imágenes, o filtros avanzados dinámicos para dárselos de comer a los trabajadores.
