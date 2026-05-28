FROM ubuntu:22.04

# Evitar prompts interactivos de apt
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias del sistema, MPI, OpenCV y SSH
RUN apt-get update && apt-get install -y \
    mpich \
    python3 \
    python3-pip \
    python3-mpi4py \
    python3-opencv \
    openssh-server \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de API (Flask)
RUN pip3 install flask flask-cors

# Configuración de SSH para permitir comunicación entre contenedores MPI
RUN mkdir -p /var/run/sshd && \
    echo 'root:password' | chpasswd && \
    echo "PermitRootLogin yes" >> /etc/ssh/sshd_config

# Generar llaves SSH y configurar login sin contraseña (passwordless)
RUN mkdir -p /root/.ssh && \
    ssh-keygen -t rsa -f /root/.ssh/id_rsa -q -N "" && \
    cp /root/.ssh/id_rsa.pub /root/.ssh/authorized_keys && \
    echo "StrictHostKeyChecking no" > /root/.ssh/config && \
    echo "UserKnownHostsFile /dev/null" >> /root/.ssh/config && \
    chmod 600 /root/.ssh/*

WORKDIR /app

# Asegurar directorios de in/out
RUN mkdir -p inputs outputs

# Script para iniciar SSH y mantener el contenedor vivo
RUN printf '#!/bin/bash\n/usr/sbin/sshd\nexec "$@"\n' > /root/start.sh && \
    chmod +x /root/start.sh

# Crear alias para python -> python3
RUN ln -s /usr/bin/python3 /usr/bin/python || true

ENTRYPOINT ["/root/start.sh"]
CMD ["tail", "-f", "/dev/null"]
