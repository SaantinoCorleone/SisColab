// Importamos las dependencias
const http      = require('http');
const WebSocket = require('ws');
const fs        = require('fs');
const path      = require('path');
require('dotenv').config();
const { db } = require('./firebase');

const PORT = process.env.PORT || 3000;

// Servidor HTTP que sirve los archivos del /client
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

// Servidor WebSocket en /ws
const wss      = new WebSocket.Server({ server, path: '/ws' });
const clientes = new Map();

// Genera nombre único sin duplicados
function generarNombre() {
  let nombre;
  const activos = [...clientes.values()].map(c => c.nombre);
  do {
    nombre = `Usuario_${Math.floor(Math.random() * 900) + 100}`;
  } while (activos.includes(nombre));
  return nombre;
}

// Avisa a todos quiénes están conectados
function broadcastUsuarios() {
  const lista = [...clientes.values()].map(c => c.nombre);
  broadcast({ tipo: 'usuarios', lista });
}

// Envía los últimos 20 mensajes de Firestore al cliente nuevo
async function enviarHistorial(socket) {
  try {
    const snapshot = await db.collection('mensajes')
      .orderBy('hora', 'asc')
      .limitToLast(20)
      .get();
    const mensajes = snapshot.docs.map(doc => doc.data());
    socket.send(JSON.stringify({ tipo: 'historial', mensajes }));
    console.log(`📜 Historial enviado: ${mensajes.length} mensajes`);
  } catch (err) {
    console.error('Error cargando historial:', err.message);
  }
}

// Nueva conexión WebSocket
wss.on('connection', (socket) => {
  const nombre = generarNombre();
  clientes.set(socket, { nombre });
  console.log(`🟢 ${nombre} conectado — activos: ${clientes.size}`);

  broadcast({ tipo: 'sistema', texto: `${nombre} se unió al chat` }, socket);
  socket.send(JSON.stringify({ tipo: 'bienvenida', texto: `Eres ${nombre}` }));
  broadcastUsuarios();
  enviarHistorial(socket);

  // Mensaje recibido 
  socket.on('message', async (data) => {
    try {
      const msg     = JSON.parse(data);
      const cliente = clientes.get(socket);


      if (msg.tipo === 'cambioNombre' && msg.nombre) {
        cliente.nombre = msg.nombre;
        broadcastUsuarios();
        return;
      }


      if (msg.tipo !== 'mensaje' || !msg.texto) return;

      const mensaje = {
        tipo:  'mensaje',
        autor: msg.autor || cliente.nombre,
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

  // En caso de: desconexión
  socket.on('close', () => {
    const { nombre } = clientes.get(socket) ?? {};
    clientes.delete(socket);
    console.log(`🔴 ${nombre} desconectado — activos: ${clientes.size}`);
    broadcast({ tipo: 'sistema', texto: `${nombre} abandonó el chat` });
    broadcastUsuarios();
  });

  // En caso de: error de socket
  socket.on('error', (err) => {
    const { nombre } = clientes.get(socket) ?? {};
    console.error(`Error en ${nombre}:`, err.message);
  });
});

// Envía a todas las personas conectadas 
function broadcast(mensaje, excepto = null) {
  const datos = JSON.stringify(mensaje);
  clientes.forEach((_, socket) => {
    if (socket !== excepto && socket.readyState === WebSocket.OPEN) {
      socket.send(datos);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(`WebSocket en ws://localhost:${PORT}/ws`);
});