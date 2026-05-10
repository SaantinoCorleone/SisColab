// Cliente WebSocket para SisColab Chat

const WS_URL = 'ws://localhost:3000/ws';

const areaMensajes = document.getElementById('area-mensajes');
const inputMensaje = document.getElementById('input-mensaje');
const btnEnviar = document.getElementById('btn-enviar');
const estadoConexion = document.getElementById('estado-conexion');

let socket = null;
let nombrePropio = null;
let reconexion = null;

function conectarWebSocket() {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    actualizarEstado(true);
    mostrarSistema('Conectado al servidor WebSocket.');

    if (reconexion) {
      clearTimeout(reconexion);
      reconexion = null;
    }
  };

  socket.onmessage = (evento) => {
    const datos = JSON.parse(evento.data);

    if (datos.type === 'welcome') {
      nombrePropio = datos.payload.replace('Eres ', '');
      mostrarSistema(datos.payload);
      return;
    }

    if (datos.type === 'chat') {
      mostrarMensaje(datos);
      return;
    }

    if (datos.type === 'join' || datos.type === 'leave') {
      mostrarSistema(datos.payload);
      return;
    }

    if (datos.type === 'users' && Array.isArray(datos.payload)) {
      const ul = document.getElementById('usuarios');
      ul.innerHTML = datos.payload.map(n => `<li>${n}</li>`).join('');
      return;
    }
  };

  socket.onclose = () => {
    actualizarEstado(false);
    mostrarSistema('Conexión cerrada. Intentando reconectar...');

    reconexion = setTimeout(() => {
      conectarWebSocket();
    }, 3000);
  };

  socket.onerror = () => {
    mostrarSistema('Ocurrió un error con la conexión WebSocket.');
  };
}

function enviarMensaje() {
  const texto = inputMensaje.value.trim();

  if (!texto || !socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  const mensaje = {
    type: 'chat',
    sender: nombrePropio || 'Usuario_temporal',
    payload: texto,
    timestamp: new Date().toISOString()
  };

  socket.send(JSON.stringify(mensaje));

  inputMensaje.value = '';
  inputMensaje.focus();
}

function mostrarMensaje(datos) {
  const mensaje = document.createElement('div');
  const esPropio = datos.sender === nombrePropio;

  mensaje.className = `mensaje ${esPropio ? 'propio' : 'otro'}`;

  const hora = datos.timestamp
    ? new Date(datos.timestamp).toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  mensaje.innerHTML = `
    ${!esPropio ? `<div class="autor">${datos.sender}</div>` : ''}
    <div>${datos.payload}</div>
    <div class="hora">${hora}</div>
  `;

  areaMensajes.appendChild(mensaje);
  bajarScroll();
}

function mostrarSistema(texto) {
  const aviso = document.createElement('div');
  aviso.className = 'mensaje sistema';
  aviso.textContent = texto;
  areaMensajes.appendChild(aviso);
  bajarScroll();
}

function actualizarEstado(conectado) {
  estadoConexion.textContent = conectado ? 'Conectado' : 'Desconectado';
  estadoConexion.className = conectado
    ? 'estado conectado'
    : 'estado desconectado';

  btnEnviar.disabled = !conectado;
}

function bajarScroll() {
  areaMensajes.scrollTop = areaMensajes.scrollHeight;
}

btnEnviar.addEventListener('click', enviarMensaje);

inputMensaje.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    enviarMensaje();
  }
});

btnEnviar.disabled = true;
conectarWebSocket();