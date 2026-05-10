// IMPORTACIÓN DE DEPENDENCIAS
const http      = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// CREACIÓN DEL SERVIDOR HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Servidor de chat activo');
});

// CREACIÓN EN SERVIDOR WEBSOCKET 
const wss = new WebSocket.Server({ server, path: '/ws' });

const clientes = new Map();

// GENERADOR DE NOMBRES SIN DUPLICADOS
function generarNombre() {
  let nombre;
  const nombresActivos = [...clientes.values()].map(c => c.nombre);
  do {
    nombre = `Usuario_${Math.floor(Math.random() * 900) + 100}`;
  } while (nombresActivos.includes(nombre));
  return nombre;
}

// BROADCAST DE LISTA DE USUARIOS CONECTADOS
function broadcastUsuarios() {
  const lista = [...clientes.values()].map(c => c.nombre);
  broadcast({ tipo: 'usuarios', lista });
}

// NUEVA CONEXIÓN A WEBSOCKET
wss.on('connection', (socket) => {
  const nombre = generarNombre();
  clientes.set(socket, { nombre });

  console.log(`Cliente conectado: ${nombre} — activos: ${clientes.size}`);

  broadcast({ tipo: 'sistema', texto: `${nombre} se unió al chat` }, socket);
  socket.send(JSON.stringify({ tipo: 'Bienvenid@', texto: `Eres ${nombre}` }));
  broadcastUsuarios();

  // RECEPCIÓN DE MENSAJE
  socket.on('message', (data) => {
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

      broadcast(mensaje);

    } catch (err) {
      console.error('Error procesando el mensaje:', err.message);
    }
  });

  // DESCONEXIÓN DEL USUARIO
  socket.on('close', () => {
    const { nombre } = clientes.get(socket) ?? {};
    clientes.delete(socket);
    console.log(`Usuario desconectado: ${nombre} — activos: ${clientes.size}`);
    broadcast({ tipo: 'sistema', texto: `${nombre} abandonó el chat` });
    broadcastUsuarios();
  });

  // ERROR en el socket
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

// ARRANCAR SERVIDOR
server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(`WebSocket en ws://localhost:${PORT}/ws`);
});