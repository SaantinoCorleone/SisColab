// Importamos las dependencias
const http      = require('http');
const WebSocket = require('ws');
require('dotenv').config();
const { db } = require('./firebase');

const PORT = process.env.PORT || 3000;

// Creamos el servidor HTTP 
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, '../client', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const tipos = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
  const contentType = tipos[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Servidor WebSocket montado sobre el servidor HTTP en la ruta /ws
const wss = new WebSocket.Server({ server, path: '/ws' });
const clientes = new Map(); 
const historialMensajes = []; 


function generarNombre() {
  let nombre;
  const activos = [...clientes.values()].map(c => c.nombre);
  do {
    nombre = `Usuario_${Math.floor(Math.random() * 900) + 100}`;
  } while (activos.includes(nombre));
  return nombre;
}


function broadcastUsuarios() {
  const lista = [...clientes.values()].map(c => c.nombre);
  broadcast({ tipo: 'usuarios', lista });
}

wss.on('connection', (socket) => {
  const nombre = generarNombre();
  clientes.set(socket, { nombre }); 
  console.log(`🟢 ${nombre} conectado — activos: ${clientes.size}`);


  broadcast({ tipo: 'sistema', texto: `${nombre} se unió al chat` }, socket);
  socket.send(JSON.stringify({ tipo: 'bienvenida', texto: `Eres ${nombre}` }));
  broadcastUsuarios();


 db.collection('mensajes').orderBy('hora', 'desc').limit(50).get().then(snapshot => {
  const mensajes = snapshot.docs.reverse().map(doc => doc.data());
  socket.send(JSON.stringify({ tipo: 'historial', mensajes }));
}).catch(err => console.error('Error historial:', err));

  socket.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const cliente = clientes.get(socket);

      if (!msg.tipo || !msg.texto) return;


      if (msg.tipo === 'cambioNombre') {
        cliente.nombre = msg.nombre;
        broadcastUsuarios();
        return;
      }

      const mensaje = {
        tipo:  'mensaje',
        autor: msg.autor || cliente.nombre,
        texto: msg.texto,
        hora:  new Date().toISOString(),
      };


      historialMensajes.push(mensaje);
      if (historialMensajes.length > 20) historialMensajes.shift();

      broadcast(mensaje); 
      db.collection('mensajes').add(mensaje).catch(err => console.error('Error guardando:', err));

    } catch (err) {
      console.error('Error:', err.message);
    }
  });


  socket.on('close', () => {
    const { nombre } = clientes.get(socket) ?? {};
    clientes.delete(socket);
    console.log(`🔴 ${nombre} desconectado — activos: ${clientes.size}`);
    broadcast({ tipo: 'sistema', texto: `${nombre} abandonó el chat` });
    broadcastUsuarios();
  });

  socket.on('error', (err) => {
    const { nombre } = clientes.get(socket) ?? {};
    console.error(`Error en ${nombre}:`, err.message);
  });
});

// Función auxiliar 
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
