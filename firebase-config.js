// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
// INSTRUÇÕES:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um projeto (ou use um existente)
// 3. Vá em "Configurações do projeto" > "Seus apps" > "Web"
// 4. Copie as chaves e cole abaixo
// 5. No Firebase Console, ative:
//    - Authentication > Sign-in method > Anônimo (para uso sem login Firebase)
//    - Firestore Database > Criar banco de dados (modo produção ou teste)
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyApdn5OqDXkckc4vzsY2fFfgZT0AWw139s",
  authDomain: "finan-lhsc.firebaseapp.com",
  projectId: "finan-lhsc",
  storageBucket: "finan-lhsc.firebasestorage.app",
  messagingSenderId: "7930639364",
  appId: "1:7930639364:web:7a2e6865a4a78db5bcb151"
};

// ==========================================
// CONTROLE DE SINCRONIZAÇÃO
// Altere para false para usar apenas localStorage (modo offline total)
// ==========================================
const FIREBASE_ENABLED = true; // <- mude para true após configurar as chaves acima

// Exporta para uso no app.js
window.FIREBASE_CONFIG   = firebaseConfig; // CORREÇÃO APLICADA AQUI
window.FIREBASE_ENABLED  = FIREBASE_ENABLED;