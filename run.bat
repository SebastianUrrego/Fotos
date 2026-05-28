@echo off
echo ==============================================================
echo  Sistema Distribuido de Imagenes (Fase 1) - Runner
echo ==============================================================
echo.

echo [1/3] Levantando los nodos de red Docker (1 Master, 2 Workers)...
docker-compose up --build -d

echo.
echo [2/3] Generando imagen de prueba dentro del contenedor Master...
REM Ejecutamos el script de Python directamente en el Master
docker exec -it mpi-master python /app/generate_sample.py

echo.
echo [3/3] Ejecutando el procesamiento distribuido con MPI...
REM Ejecutamos mpiexec distribuyendolo entre el cluster de 3 nodos (Master en nodo inicial)
REM mpiexec envia trabajos via SSH entre los contenedores interconectados
docker exec -it mpi-master mpiexec --allow-run-as-root -host mpi-master,mpi-worker1,mpi-worker2 -n 3 python /app/main.py

echo.
echo ==============================================================
echo PROCESAMIENTO FINALIZADO.
echo Revisa los resultados generados en la carpeta local 'outputs'
echo.
echo Para limpiar y detener los contenedores simulados ejecuta:
echo docker-compose down
echo ==============================================================
