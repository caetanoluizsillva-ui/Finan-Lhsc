// ==========================================
// FIREBASE CONFIGURATIONo
// ==========================================
const firebaseConfig = {
  apiKey           : "AIzaSyApdn5OqDXkckc4vzsY2fFfgZT0AWw139s",
  authDomain       : "finan-lhsc.firebaseapp.com",
  projectId        : "finan-lhsc",
  storageBucket    : "finan-lhsc.firebasestorage.app",
  messagingSenderId: "7930639364",
  appId            : "1:7930639364:web:7a2e6865a4a78db5bcb151"
};

const FIREBASE_ENABLED = true;

window.FIREBASE_CONFIG  = firebaseConfig;
window.FIREBASE_ENABLED = FIREBASE_ENABLED;

// ==========================================
// INICIALIZAÇÃO DO FIREBASE
// Popula window._firebaseAPI e window._firebaseAuth
// que são usados pelo app.js no login/logout
// ==========================================
(async function initFirebase() {
  if (!FIREBASE_ENABLED) return;

  try {
    const { initializeApp }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail }
                               = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

    const app  = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Expõe para o app.js
    window._firebaseAuth = auth;
    window._firebaseAPI  = {
      signInWithEmailAndPassword,
      signOut,
      sendPasswordResetEmail
    };

    // Redireciona automaticamente se já estiver logado
    onAuthStateChanged(auth, function(user) {
      if (user) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
      }
    });

    // Atualiza indicador visual de status (se existir)
    var dot = document.getElementById('firebase-status-dot');
    var txt = document.getElementById('firebase-status-txt');
    if (dot) dot.style.color = '#27ae60';
    if (txt) txt.textContent = 'Conectado ao Firebase';

    console.log('[Firebase] Inicializado com sucesso.');

  } catch (err) {
    console.error('[Firebase] Erro na inicializacao:', err);
    var dot = document.getElementById('firebase-status-dot');
    var txt = document.getElementById('firebase-status-txt');
    if (dot) dot.style.color = '#e74c3c';
    if (txt) txt.textContent = 'Erro de conexao';
  }
})();