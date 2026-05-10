# 🍄 Micelio — SisColab Chat

Chat colaborativo en tiempo real desarrollado con **WebSockets**, como proyecto de la materia de **Sistemas Colaborativos**.

---

## 📌 ¿De qué trata el proyecto?

**Micelio** es una aplicación de chat en tiempo real que permite a múltiples usuarios conectarse simultáneamente y comunicarse de forma instantánea, sin necesidad de recargar la página. Cada usuario recibe un nombre temporal único al conectarse, y puede ver quién más está conectado en una lista lateral que se actualiza en tiempo real.

El nombre *Micelio* hace referencia a la red de hongos subterránea que conecta árboles entre sí — una metáfora de la comunicación colaborativa en red.

---

## 🧱 Arquitectura

```
SisColab/
├── client/               # Frontend (HTML, CSS, JS puro)
│   ├── index.html        # Interfaz del chat
│   ├── app.js            # Lógica del cliente WebSocket
│   └── styles.css        # Estilos de la interfaz
│
└── server/               # Backend (Node.js)
    ├── server.js         # Servidor HTTP + WebSocket
    └── package.json      # Dependencias
```

### Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Backend | Node.js |
| Comunicación | WebSocket (`ws`) |
| Variables de entorno | `dotenv` |
| Base de datos | *(no requerida — estado en memoria)* |

---

## ⚙️ Requisitos previos

Antes de correr el proyecto, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- npm (viene incluido con Node.js)
- Extensión **Live Server** en VS Code *(recomendado para el cliente)*

Verifica tu instalación con:

```bash
node -v
npm -v
```

---

## 🚀 Cómo correr el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/SaantinoCorleone/SisColab.git
cd SisColab
```

### 2. Instalar dependencias del servidor

```bash
cd server
npm install
```

### 3. Iniciar el servidor

```bash
node server.js
```

Si todo está bien, verás en la terminal:

```
Servidor en http://localhost:3000
WebSocket en ws://localhost:3000/ws
```

### 4. Abrir el cliente

Abre el archivo `client/index.html` con **Live Server** desde VS Code:

> Clic derecho sobre `index.html` → **Open with Live Server**

⚠️ **No abras el archivo directamente con doble clic** — los WebSockets requieren que el HTML se sirva desde un servidor HTTP.

### 5. Probar el chat

Abre **dos o más pestañas** del navegador con la misma URL del Live Server. Cada pestaña será un usuario distinto y podrás chatear entre ellas en tiempo real.

---

## ✨ Funcionalidades

- ✅ Conexión en tiempo real mediante WebSockets
- ✅ Nombres de usuario temporales únicos (`Usuario_XXX`) generados automáticamente al conectarse
- ✅ Sin duplicados — si hay colisión de nombres, se regenera automáticamente
- ✅ Notificaciones de sistema cuando un usuario se une o abandona el chat
- ✅ Lista lateral de usuarios conectados que se actualiza en tiempo real
- ✅ Reconexión automática si se pierde la conexión con el servidor
- ✅ Mensajes con hora y diferenciación visual entre mensajes propios y ajenos
- ✅ Scroll automático al último mensaje

---

## 📡 Protocolo de mensajes WebSocket

El servidor y el cliente se comunican mediante mensajes JSON con el campo `tipo`:

| Tipo | Dirección | Descripción |
|------|-----------|-------------|
| `Bienvenid@` | Servidor → Cliente | Informa al usuario su nombre asignado |
| `mensaje` | Ambos | Mensaje de chat con autor, texto y hora |
| `sistema` | Servidor → Cliente | Notificación del sistema (entradas/salidas) |
| `usuarios` | Servidor → Cliente | Lista actualizada de usuarios conectados |
| `cambioNombre` | Cliente → Servidor | Solicitud de cambio de nombre *(en desarrollo)* |

---

## 🌿 Ramas del proyecto

El proyecto sigue un flujo de trabajo por ramas, donde cada integrante trabaja en su propia feature:

| Rama | Integrante | Descripción |
|------|-----------|-------------|
| `main` | — | Rama principal estable |
| `Jhonatan-INT-01-cliente-web` | Jhonatan | Interfaz del cliente web |
| `Nayra-Implementar-servidor-WebSocket` | Nayra | Servidor WebSocket |
| `feature/USR-01-gestion-usuarios` | Orlando | Gestión de usuarios conectados |

### Flujo de trabajo Git

```bash
# Crear tu rama desde la rama base correspondiente
git checkout Jhonatan-INT-01-cliente-web
git pull origin Jhonatan-INT-01-cliente-web
git checkout -b feature/tu-rama

# Trabajar y subir cambios
git add .
git commit -m "feat: descripción del cambio"
git push origin feature/tu-rama
```

> ⚠️ Los merges a `main` se hacen mediante **Pull Request** y deben aprobarse en orden para evitar conflictos.

---

## 👥 Integrantes

| N° | Nombre | Tarea |
|----|--------|-------|
| 1 | Jhonatan | Cliente web (HTML, CSS, JS) |
| 2 | Nayra | Servidor WebSocket |
| 6 | Orlando | Gestión de usuarios (USR-01) |

---

## 📝 Licencia

Proyecto académico desarrollado para la materia de **Sistemas Colaborativos**.  
Uso educativo — sin licencia comercial.