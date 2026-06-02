// ==========================================
// FIREBASE CONFIGURATION
// ==========================================
// INSTRUÇÕES:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um projeto (ou use um existente)
// 3. Vá em "Configurações do projeto" > "Seus apps" > "Web"
// 4. Copie as chaves e cole abaixo
// 5. No Firebase Console, ative:
//    - Authentication > Sign-in method > E-mail/Senha
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
const FIREBASE_ENABLED = true;

// FIX: Exporta com o nome correto que o app.js espera (window.FIREBASE_CONFIG)
window.FIREBASE_CONFIG  = firebaseConfig;   // era: window.FIREBASE_CONFIG = FIREBASE_CONFIG (variável inexistente)
window.FIREBASE_ENABLED = FIREBASE_ENABLED;
