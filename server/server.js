// IMPORTACIÓN DE DEPENDENCIAS
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// CREACIÓN DEL SERVIDOR HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Servidor de chat activo');
});

// CREACIÓN DEL SERVIDOR WEBSOCKET
const wss = new WebSocket.Server({ server, path: '/ws' });

const clientes = new Map();
let contadorId = 1;

// GENERAR NOMBRE TEMPORAL
function generarNombre() {
  return `Usuario_${contadorId++}`;
}

// OBTENER FECHA ACTUAL
function now() {
  return new Date().toISOString();
}

// BROADCAST A TODOS LOS CLIENTES
function broadcast(mensaje, excepto = null) {
  const datos = JSON.stringify(mensaje);

  clientes.forEach((_, socket) => {
    if (socket !== excepto && socket.readyState === WebSocket.OPEN) {
      socket.send(datos);
    }
  });
}

// BROADCAST DE LISTA DE USUARIOS
function broadcastUsuarios() {
  const lista = [...clientes.values()].map(c => c.nombre);

  broadcast({
    type: 'users',
    sender: 'Servidor',
    payload: lista,
    timestamp: now()
  });
}

// NUEVA CONEXIÓN
wss.on('connection', (socket) => {
  const nombre = generarNombre();
  clientes.set(socket, { nombre });

  console.log(`Cliente conectado: ${nombre} — activos: ${clientes.size}`);

  // Mensaje de bienvenida
  socket.send(JSON.stringify({
    type: 'welcome',
    sender: 'Servidor',
    payload: `Eres ${nombre}`,
    timestamp: now()
  }));

  // Aviso de unión
  broadcast({
    type: 'join',
    sender: nombre,
    payload: `${nombre} se unió al chat`,
    timestamp: now()
  });

  broadcastUsuarios();

  // RECEPCIÓN DE MENSAJES
  socket.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const cliente = clientes.get(socket);

      // Validar campos obligatorios
      if (
        !msg.type ||
        !msg.sender ||
        msg.payload === undefined ||
        !msg.timestamp
      ) {
        console.log('Mensaje incompleto');
        return;
      }

      // Solo procesamos chat
      if (msg.type === 'chat') {
        const mensaje = {
          type: 'chat',
          sender: cliente.nombre,
          payload: msg.payload,
          timestamp: now()
        };

        broadcast(mensaje);
      }
    } catch (err) {
      console.error('Error procesando el mensaje:', err.message);
    }
  });

  // DESCONEXIÓN
  socket.on('close', () => {
    const { nombre } = clientes.get(socket) ?? {};
    clientes.delete(socket);

    console.log(`Usuario desconectado: ${nombre} — activos: ${clientes.size}`);

    broadcast({
      type: 'leave',
      sender: nombre,
      payload: `${nombre} salió del chat`,
      timestamp: now()
    });

    broadcastUsuarios();
  });

  // ERROR
  socket.on('error', (err) => {
    const { nombre } = clientes.get(socket) ?? {};
    console.error(`Error en socket de ${nombre}:`, err.message);
  });
});

// ARRANCAR SERVIDOR
server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(`WebSocket en ws://localhost:${PORT}/ws`);
});