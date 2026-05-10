// IMPORTACIÓN DE DEPENDENCIAS
const http      = require('http');
const WebSocket = require('ws');
require('dotenv').config();
const { db } = require('./firebase');

const PORT = process.env.PORT || 3000;

// CREACIÓN DEL SERVIDOR HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Servidor de chat activo');
});

// CREACIÓN EN SERVIDOR WEBSOCKET 
const wss = new WebSocket.Server({ server, path: '/ws' });

const clientes = new Map();
let contadorId = 1; //contador de usuarios

// NUEVA CONEXIÓN A WEBSOCKET
wss.on('connection', (socket) => {
  const nombre = `Usuario_${contadorId++}`;
  clientes.set(socket, { nombre });

  console.log(`Cliente conectado: ${nombre} — activos: ${clientes.size}`);


  broadcast({ tipo: 'sistema', texto: `${nombre} se unió al chat` }, socket);
  socket.send(JSON.stringify({ tipo: 'Bienvenid@', texto: `Eres ${nombre}` }));
  enviarHistorial(socket);

  // RECEPCIÓN DE MENSAJE
  socket.on('message', async (data) => {
    try {
      const msg     = JSON.parse(data);
      const cliente = clientes.get(socket);

      if (msg.tipo === 'cambioNombre') {
        cliente.nombre = msg.nombre;
        return;
      }

      const mensaje = {
        tipo:  'mensaje',
        autor: cliente.nombre,
        texto: msg.texto,
        hora:  new Date().toISOString(),
      };

      
      await guardarMensaje(mensaje);
      broadcast(mensaje);

    } catch (err) {
      console.error('Error procesando el mensaje:', err.message);
    }
  });

  // En caso de: DESCONEXIÓN DEL USUARIO
  socket.on('close', () => {
    const { nombre } = clientes.get(socket) ?? {};
    clientes.delete(socket);
    console.log(`Usuario desconectado: ${nombre} — activos: ${clientes.size}`);
    broadcast({ tipo: 'sistema', texto: `${nombre} salió del chat` });
  });

  // En caso de: ERROR en el socket
  socket.on('error', (err) => {
    const { nombre } = clientes.get(socket) ?? {};
    console.error(`Error en socket de ${nombre}:`, err.message);
  });
});

// FUNCIONES AUXILIARES
function broadcast(mensaje, excepto = null) {
  const datos = JSON.stringify(mensaje);
  clientes.forEach((_, socket) => {
    if (socket !== excepto && socket.readyState === WebSocket.OPEN) {
      socket.send(datos);
    }
  });
}
// Guarda un mensaje en Firestore
async function guardarMensaje(mensaje) {
  await db.collection('mensajes').add(mensaje);
}

// Envía el historial de los últimos 50 mensajes al cliente
async function enviarHistorial(socket) {
  try {
    const snapshot = await db.collection('mensajes')
      .orderBy('hora', 'desc')
      .limit(50)
      .get();
    const historial = snapshot.docs.map(doc => doc.data()).reverse();
    socket.send(JSON.stringify({ tipo: 'historial', mensajes: historial }));
  } catch (err) {
    console.error('Error cargando historial:', err.message);
  }
}

// EN CASO DE ARRANCAR 
server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(`WebSocket en ws://localhost:${PORT}/ws`);
});