\# SisColab - Proyecto ARQ-01



\# Descripción
Es una aplicación web SPA de mensajería colaborativa en tiempo real desarrollada mediante WebSocket. El sistema permite que múltiples usuarios se comuniquen simultáneamente dentro de una plataforma web utilizando comunicación bidireccional persistente entre cliente y servidor.

La aplicación fue desarrollada como parte de una práctica académica orientada al aprendizaje de tecnologías WebSocket, arquitecturas cliente-servidor y trabajo colaborativo utilizando Scrum y Git.

Se ha configurado un entorno de desarrollo utilizando Node.js, dividiendo el proyecto en carpetas para el servidor, el cliente y la documentación técnica.

📌 Objetivo

Desarrollar un sistema de chat colaborativo en tiempo real que permita:

- Comunicación instantánea entre múltiples usuarios.
- Interacción simultánea mediante WebSocket.
- Visualización del historial de mensajes.
- Gestión automática de usuarios temporales.
- Persistencia básica de datos.
- Autenticación mediante proveedor externo.


🎯 Características principales

[x] Servidor WebSocket con múltiples conexiones simultáneas.
[x] Cliente web para envío y recepción de mensajes en tiempo real.
[x] Historial visible de mensajes con recuperación al reconectar.
[x] Asignación automática de nombre temporal (Usuario_XXX).
[x] Notificaciones de ingreso y salida de usuarios.
[x] Autenticación vía Firebase Auth (OAuth 2.0 / JWT).
[x] Persistencia de mensajes en Firebase.

⚙️ Requisitos Previos

-Node.js v18.x o superior
-npm v9.x o superior (incluido con Node.js)
-Cuenta de Firebase activa
-Proyecto de Firebase creado y configurado



\## Estructura del Equipo

1. Andy Santiago Rocha Claure

2\. Jhonatan Ortuño Cáceres

3\. Lenny Zoraida Calle Machaca

4\. Mannuel Antonio Guzman Paniagua

5\. Nayra Oviedo Paco

6\. Orlando Condori Balderrama

7\. Walter bullain muñoz



\# Carpetas del proyecto

\* \*\*/server\*\*: Backend inicializado con npm.

\* \*\*/client\*\*: Frontend inicializado con npm.

\* \*\*/docs\*\*: Carpeta para documentos y guías del proyecto.

## 🚀 Cómo correr el proyecto

### 1. Clonar el repositorio
```bash
git clone https://github.com/SaantinoCorleone/SisColab.git
cd SisColab
```

### 2. Instalar dependencias
```bash
cd server
npm install
```

### 3. Configurar variables de entorno
Copiar el archivo de ejemplo y completar con las credenciales reales:
```bash
cp server/.env.example server/.env
```
> ⚠️ Las credenciales reales del `.env` deben solicitarse al equipo de desarrollo.

### 4. Correr el servidor
```bash
cd server
node server.js
```

### 5. Abrir el cliente
Abrir en el navegador:
```
http://localhost:3000
```
