// IMPORTAR FIREBASE
import { initializeApp } from
'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from
'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';


// CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {

  apiKey: "AIzaSyDon4-La4bm7NsAaSdS3jEmdOSAbirJHIk",

  authDomain: "nexochat-grupo-eae53.firebaseapp.com",

  projectId: "nexochat-grupo-eae53",

  storageBucket: "nexochat-grupo-eae53.firebasestorage.app",

  messagingSenderId: "908829023217",

  appId: "1:908829023217:web:73b11ae3cc65619add4250"

};


// INICIALIZAR FIREBASE
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();


// ELEMENTOS HTML
const btnLogin =
document.getElementById('login-google');

const btnLogout =
document.getElementById('logout-google');

const usuarioLogueado =
document.getElementById('usuario-logueado');


// LOGIN GOOGLE
btnLogin.addEventListener('click', async () => {

  try {

    const resultado =
      await signInWithPopup(auth, provider);

    const user = resultado.user;

    localStorage.setItem(
      'usuario',
      user.displayName
    );
    console.log(user.displayName);

    location.reload();

  } catch (error) {

    console.error(error);

  }

});


// LOGOUT
btnLogout.addEventListener('click', async () => {

  await signOut(auth);

  localStorage.removeItem('usuario');

  location.reload();

});


// DETECTAR SESIÓN
onAuthStateChanged(auth, (user) => {

  if (user) {

    usuarioLogueado.textContent =
      `Hola ${user.displayName}`;

    btnLogin.style.display = 'none';

    btnLogout.style.display = 'inline-block';

    localStorage.setItem(
      'usuario',
      user.displayName
    );

  }

});