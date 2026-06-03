// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey           : "AIzaSyApdn5OqDXkckc4vzsY2fFfgZT0AWw139s",
  authDomain       : "finan-lhsc.firebaseapp.com",
  projectId        : "finan-lhsc",
  storageBucket    : "finan-lhsc.firebasestorage.app",
  messagingSenderId: "7930639364",
  appId            : "1:7930639364:web:7a2e6865a4a78db5bcb151"
};

window.FIREBASE_CONFIG   = firebaseConfig;
window.FIREBASE_ENABLED  = true;

// ==========================================
// INICIALIZAÇÃO DO FIREBASE
// ==========================================
(async function initFirebase() {
  try {
    // Importa Auth e App em PARALELO — economiza ~400-800ms em mobile
    const [
      { initializeApp },
      { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail }
    ] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js")
    ]);

    const app  = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Expõe globalmente para app.js e firebase-sync.js
    window._firebaseApp  = app;
    window._firebaseAuth = auth;
    window._firebaseAPI  = { signInWithEmailAndPassword, signOut, sendPasswordResetEmail };

    // Atualiza status visual na tela de login
    const dot = document.getElementById('firebase-status-dot');
    const txt = document.getElementById('firebase-status-txt');
    if (dot) dot.style.color = '#27ae60';
    if (txt) txt.textContent = 'Conectado';

    console.log('[Firebase] Inicializado.');

    // Monitora estado de autenticação
    onAuthStateChanged(auth, async function(user) {
      if (user) {
        // Usuário logado: mostra o app
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');

        // Inicia sincronização Firestore
        if (typeof iniciarSync === 'function') {
          await iniciarSync(app);
        }
      } else {
        // Usuário deslogado: mostra o login
        document.getElementById('app-screen').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
      }
    });

  } catch (err) {
    console.error('[Firebase] Erro na inicialização:', err);
    const dot = document.getElementById('firebase-status-dot');
    const txt = document.getElementById('firebase-status-txt');
    if (dot) dot.style.color = '#e74c3c';
    if (txt) txt.textContent = 'Erro de conexão';
  }
})();
