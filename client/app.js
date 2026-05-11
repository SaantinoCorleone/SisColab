// Cliente WebSocket para SisColab Chat
// Autenticación con Firebase y manejo de mensajes en tiempo real
import { initializeApp } from
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, onAuthStateChanged, signOut
} from
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey:            "AIzaSyDon4-La4bm7NsAaSdS3jEmdOSAbirJHIk",
  authDomain:        "nexochat-grupo-eae53.firebaseapp.com",
  projectId:         "nexochat-grupo-eae53",
  storageBucket:     "nexochat-grupo-eae53.firebasestorage.app",
  messagingSenderId: "908829023217",
  appId:             "1:908829023217:web:73b11ae3cc65619add4250"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const provider    = new GoogleAuthProvider();

const btnLogin         = document.getElementById('login-google');
const btnLogout        = document.getElementById('logout-google');
const usuarioLogueado  = document.getElementById('usuario-logueado');

// En caso de: Login con Google
btnLogin.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    localStorage.setItem('usuario', result.user.displayName);
    location.reload();
  } catch (e) {
    console.error('Error login:', e);
  }
});

// En caso de: Logout
btnLogout.addEventListener('click', async () => {
  await signOut(auth);
  localStorage.removeItem('usuario');
  location.reload();
});

// En caso de: Detectar sesión activa
onAuthStateChanged(auth, (user) => {
  if (user) {
    usuarioLogueado.textContent = `👤 ${user.displayName}`;
    btnLogin.style.display  = 'none';
    btnLogout.style.display = 'inline-block';
    localStorage.setItem('usuario', user.displayName);
  } else {
    btnLogin.style.display  = 'inline-block';
    btnLogout.style.display = 'none';
    usuarioLogueado.textContent = '';
  }
});

//Chat WebSocket
const WS_URL = 'ws://localhost:3000/ws';

const areaMensajes   = document.getElementById('area-mensajes');
const inputMensaje   = document.getElementById('input-mensaje');
const btnEnviar      = document.getElementById('btn-enviar');
const estadoConexion = document.getElementById('estado-conexion');
const listaUsuarios  = document.getElementById('usuarios');

// En caso de no elegir el nombre de Google, si no uno temporal
let nombrePropio =
  localStorage.getItem('usuario') ||
  `Usuario_${Math.floor(Math.random() * 900) + 100}`;

let socket    = null;
let reconexion = null;

function conectar() {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    actualizarEstado(true);
    mostrarSistema('Conectado al servidor.');
    // Enviar nombre real al servidor
    socket.send(JSON.stringify({
      tipo:   'cambioNombre',
      nombre: localStorage.getItem('usuario') || nombrePropio,
      texto:  '-'   // campo requerido por validación del servidor
    }));
    if (reconexion) { clearTimeout(reconexion); reconexion = null; }
  };

  socket.onmessage = (evento) => {
    const datos = JSON.parse(evento.data);

    if (datos.tipo === 'bienvenida') {
      // Solo usamos el nombre del servidor si no hay sesión de Google
      if (!localStorage.getItem('usuario')) {
        nombrePropio = datos.texto.replace('Eres ', '');
      }
      return;
    }

    if (datos.tipo === 'historial') {
      datos.mensajes.forEach(mostrarMensaje);
      return;
    }

    if (datos.tipo === 'mensaje') {
      mostrarMensaje(datos);
      return;
    }

    if (datos.tipo === 'sistema') {
      mostrarSistema(datos.texto);
      return;
    }

    if (datos.tipo === 'usuarios') {
      listaUsuarios.innerHTML = datos.lista
        .map(n => `<li>${n}</li>`)
        .join('');
    }
  };

  socket.onclose = () => {
    actualizarEstado(false);
    mostrarSistema('Desconectado. Reconectando en 3s...');
    reconexion = setTimeout(conectar, 3000);
  };

  socket.onerror = () => {
    mostrarSistema('Error en la conexión WebSocket.');
  };
}

function enviarMensaje() {
  const texto = inputMensaje.value.trim();
  if (!texto || !socket || socket.readyState !== WebSocket.OPEN) return;

  // Usar nombre actualizado del localStorage o el temporal
  const autor = localStorage.getItem('usuario') || nombrePropio;

  socket.send(JSON.stringify({ tipo: 'mensaje', autor, texto }));
  inputMensaje.value = '';
  inputMensaje.focus();
}

function mostrarMensaje(datos) {
  const autor   = localStorage.getItem('usuario') || nombrePropio;
  const esPropio = datos.autor?.trim() === autor?.trim();

  const burbuja = document.createElement('div');
  burbuja.className = `mensaje ${esPropio ? 'propio' : 'otro'}`;

  const hora = datos.hora
    ? new Date(datos.hora).toLocaleTimeString('es-BO', {
        hour: '2-digit', minute: '2-digit'
      })
    : '';

  burbuja.innerHTML = `
    ${!esPropio ? `<div class="autor">${datos.autor}</div>` : ''}
    <div>${datos.texto}</div>
    <div class="hora">${hora}</div>
  `;

  areaMensajes.appendChild(burbuja);
  bajarScroll();
}

function mostrarSistema(texto) {
  const aviso = document.createElement('div');
  aviso.className   = 'mensaje sistema';
  aviso.textContent = texto;
  areaMensajes.appendChild(aviso);
  bajarScroll();
}

function actualizarEstado(conectado) {
  estadoConexion.textContent = conectado ? '🟢 Conectado' : '🔴 Desconectado';
  estadoConexion.className   = `estado ${conectado ? 'conectado' : 'desconectado'}`;
  btnEnviar.disabled         = !conectado;
}

function bajarScroll() {
  areaMensajes.scrollTop = areaMensajes.scrollHeight;
}

btnEnviar.addEventListener('click', enviarMensaje);
inputMensaje.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') enviarMensaje();
});

btnEnviar.disabled = true;
conectar();