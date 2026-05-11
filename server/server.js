const http      = require('http');
const WebSocket = require('ws');
const fs        = require('fs');
const path      = require('path');
require('dotenv').config();
const { db } = require('./firebase');

const PORT = process.env.PORT || 3000;

//Servidor HTTP
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, '../client',
    req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const tipos = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.css':  'text/css'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': tipos[ext] || 'text/plain' });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server, path: '/ws' });

const sockets  = new Map();
const usuarios = new Map();

// Genera un nombre temporal único que no esté en uso
function generarNombre() {
  let nombre;
  do {
    nombre = `Usuario_${Math.floor(Math.random() * 900) + 100}`;
  } while (usuarios.has(nombre));
  return nombre;
}

// Envía la lista de usuarios únicos a todos los clientes
function broadcastUsuarios() {
  broadcast({ tipo: 'usuarios', lista: [...usuarios.keys()] });
}

// Carga los últimos 20 mensajes de Firestore y los envía al socket
async function enviarHistorial(socket) {
  try {
    const snapshot = await db.collection('mensajes')
      .orderBy('hora', 'asc')
      .limitToLast(20)
      .get();
    const mensajes = snapshot.docs.map(doc => doc.data());
    socket.send(JSON.stringify({ tipo: 'historial', mensajes }));
    console.log(`Historial enviado: ${mensajes.length} mensajes`);
  } catch (err) {
    console.error('Error cargando historial:', err.message);
  }
}

// Conexión del WebSocket y manejo de eventos
wss.on('connection', (socket) => {
  const nombreTemporal = generarNombre();

  // Registra el socket con nombre temporal hasta que el cliente confirme
  sockets.set(socket, { nombre: nombreTemporal, confirmado: false });
  console.log(`${nombreTemporal} conectado — sockets activos: ${sockets.size}`);

  socket.send(JSON.stringify({ tipo: 'bienvenida', texto: `Eres ${nombreTemporal}` }));
  // Enviar la lista actual de usuarios al nuevo cliente al conectarse
  socket.send(JSON.stringify({ tipo: 'usuarios', lista: [...usuarios.keys()] }));
  enviarHistorial(socket);

  socket.on('message', async (data) => {
    try {
      const msg  = JSON.parse(data);
      const info = sockets.get(socket);

      if (msg.tipo === 'cambioNombre' && msg.nombre) {
        const nombreAnterior = info.nombre;
        const nombreNuevo    = msg.nombre;

        if (!info.confirmado) {
          info.confirmado = true;
          info.nombre     = nombreNuevo;

          if (!usuarios.has(nombreNuevo)) {
            // Registra a un usuario y anunciar unión
            usuarios.set(nombreNuevo, new Set([socket]));
            broadcast({ tipo: 'sistema', texto: `${nombreNuevo} se unió al chat` }, socket);
          } else {
            usuarios.get(nombreNuevo).add(socket);
          }

          // Limpia el nombre temporal del mapa si quedó registrado con google
          if (usuarios.has(nombreAnterior) && nombreAnterior !== nombreNuevo) {
            usuarios.delete(nombreAnterior);
          }

          // Enviar lista actualizada a TODOS, incluyendo al recién conectado
          broadcastUsuarios();
          socket.send(JSON.stringify({ tipo: 'usuarios', lista: [...usuarios.keys()] }));
        }
        return;
      }

      if (msg.tipo !== 'mensaje' || !msg.texto) return;

      const mensaje = {
        tipo:  'mensaje',
        autor: info.nombre,
        texto: msg.texto,
        hora:  new Date().toISOString(),
      };

      broadcast(mensaje);
      db.collection('mensajes').add(mensaje)
        .catch(err => console.error('Error guardando:', err.message));

    } catch (err) {
      console.error('Error procesando mensaje:', err.message);
    }
  });

  socket.on('close', () => {
    const info = sockets.get(socket);
    if (!info) return;

    const { nombre, confirmado } = info;
    sockets.delete(socket);

    if (confirmado && usuarios.has(nombre)) {
      const socketsDelUsuario = usuarios.get(nombre);
      socketsDelUsuario.delete(socket);

      if (socketsDelUsuario.size === 0) {
        // Por si el usuario cierra pestaña y se sale del chat
        usuarios.delete(nombre);
        console.log(`${nombre} salió — usuarios activos: ${usuarios.size}`);
        broadcast({ tipo: 'sistema', texto: `${nombre} abandonó el chat` });
        broadcastUsuarios();
      } else {
        //Por si tiene otras pestañas abiertas no anuncia salida
        console.log(`${nombre} cerró una pestaña — le quedan ${socketsDelUsuario.size}`);
      }
    }
  });

  socket.on('error', (err) => {
    const info = sockets.get(socket);
    console.error(`Error en ${info?.nombre}:`, err.message);
  });
});

function broadcast(mensaje, excepto = null) {
  const datos = JSON.stringify(mensaje);
  sockets.forEach((_, socket) => {
    if (socket !== excepto && socket.readyState === WebSocket.OPEN) {
      socket.send(datos);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(`WebSocket en ws://localhost:${PORT}/ws`);
});