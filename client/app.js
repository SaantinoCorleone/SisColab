// Autenticación con Firebase Google
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

const btnLogin        = document.getElementById('login-google');
const btnLogout       = document.getElementById('logout-google');
const usuarioLogueado = document.getElementById('usuario-logueado');

// Login con Google
btnLogin.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    localStorage.setItem('usuario', result.user.displayName);
    location.reload();
  } catch (e) {
    console.error('Error login:', e);
  }
});

// Logout
btnLogout.addEventListener('click', async () => {
  await signOut(auth);
  localStorage.removeItem('usuario');
  location.reload();
});

// Detectar sesión activa al cargar
onAuthStateChanged(auth, (user) => {
  if (user) {
    usuarioLogueado.textContent = `👤 ${user.displayName}`;
    btnLogin.style.display      = 'none';
    btnLogout.style.display     = 'inline-block';
    localStorage.setItem('usuario', user.displayName);
  } else {
    btnLogin.style.display      = 'inline-block';
    btnLogout.style.display     = 'none';
    usuarioLogueado.textContent = '';
  }
});

// WebSocket 
const WS_URL = 'ws://localhost:3000/ws';

const areaMensajes   = document.getElementById('area-mensajes');
const inputMensaje   = document.getElementById('input-mensaje');
const btnEnviar      = document.getElementById('btn-enviar');
const estadoConexion = document.getElementById('estado-conexion');
const listaUsuarios  = document.getElementById('usuarios');


// Si hay sesión Google se usa ese nombre; si no, se espera al servidor.
let nombrePropio = localStorage.getItem('usuario') || null;

let socket     = null;
let reconexion = null;

function conectar() {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    actualizarEstado(true);
    mostrarSistema('Conectado al servidor.');

    // Si hay sesión Google, enviar el nombre real de inmediato.
    // Si no hay Google, esperar la 'bienvenida' del servidor 
    const nombreGoogle = localStorage.getItem('usuario');
    if (nombreGoogle) {
      socket.send(JSON.stringify({
        tipo:   'cambioNombre',
        nombre: nombreGoogle
      }));
    }

    if (reconexion) { clearTimeout(reconexion); reconexion = null; }
  };

  socket.onmessage = (evento) => {
    const datos = JSON.parse(evento.data);

    if (datos.tipo === 'bienvenida') {
      // Si no hay Google, usar el nombre asignado por el servidor
      if (!localStorage.getItem('usuario')) {
        nombrePropio = datos.texto.replace('Eres ', '');
        socket.send(JSON.stringify({
          tipo:   'cambioNombre',
          nombre: nombrePropio
        }));
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
    socket = null;
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
  socket.send(JSON.stringify({ tipo: 'mensaje', texto }));
  inputMensaje.value = '';
  inputMensaje.focus();
}

function mostrarMensaje(datos) {
  // Comparar con el nombre actual para saber si el mensaje es propio
  const autor    = localStorage.getItem('usuario') || nombrePropio;
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