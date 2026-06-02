// ==========================================
// firebase-sync.js
// Sincronização em tempo real com Firestore
// Intercepta localStorage → salva na nuvem
// Carrega da nuvem → popula localStorage
// ==========================================

// Chaves do sistema que devem ser sincronizadas com o Firestore.
// Chaves de preferência local (cfg_mes, cfg_ano, valoresOcultos) ficam
// apenas no localStorage — são preferências de interface, não dados financeiros.
const SYNC_KEYS = [
  'despesas_gastos',
  'a_pagar',
  'receitas',
  'cartoes',
  'cat_despesas',
  'cat_receitas',
  'tipos_despesa',
  'metas'
];

// ID fixo do documento no Firestore (único usuário = único doc por coleção)
const FIRESTORE_DOC_ID = 'meus-dados';
const FIRESTORE_COLLECTION = 'financeiro';

// ==========================================
// ESTADO INTERNO
// ==========================================
let _db            = null;   // instância do Firestore
let _unsubscribe   = null;   // cancelar listener em tempo real
let _syncAtivo     = false;
let _ignorarUpdate = false;  // evita loop: Firestore → localStorage → Firestore

// Indicador visual (opcional — coloque no HTML se quiser)
function _setSyncStatus(status) {
  // status: 'conectado' | 'sincronizando' | 'erro' | 'offline'
  const dot = document.getElementById('sync-status-dot');
  const txt = document.getElementById('sync-status-txt');
  const cores = {
    conectado:     '#27ae60',
    sincronizando: '#f39c12',
    erro:          '#e74c3c',
    offline:       '#95a5a6'
  };
  const textos = {
    conectado:     'Sincronizado',
    sincronizando: 'Salvando...',
    erro:          'Erro de sincronização',
    offline:       'Offline'
  };
  if (dot) dot.style.color = cores[status] || '#95a5a6';
  if (txt) txt.textContent = textos[status] || status;
}

// ==========================================
// INTERCEPTAR localStorage.setItem
// Quando o app salva um dado, também salva no Firestore
// ==========================================
const _originalSetItem = localStorage.setItem.bind(localStorage);
const _originalGetItem = localStorage.getItem.bind(localStorage);

localStorage.setItem = function(key, value) {
  // Sempre salva localmente (comportamento normal)
  _originalSetItem(key, value);

  // Se for uma chave sincronizável e o Firestore estiver pronto, sobe para a nuvem
  if (_syncAtivo && !_ignorarUpdate && SYNC_KEYS.includes(key)) {
    _salvarChaveNoFirestore(key, value);
  }
};

// ==========================================
// SALVAR UMA CHAVE ESPECÍFICA NO FIRESTORE
// Usa merge para não sobrescrever outras chaves
// ==========================================
async function _salvarChaveNoFirestore(key, value) {
  if (!_db) return;
  try {
    _setSyncStatus('sincronizando');
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const ref = doc(_db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    // Parseia o valor para salvar como objeto/array nativo (não como string JSON)
    let parsed;
    try { parsed = JSON.parse(value); } catch { parsed = value; }
    await setDoc(ref, { [key]: parsed }, { merge: true });
    _setSyncStatus('conectado');
  } catch (err) {
    console.error('[Sync] Erro ao salvar no Firestore:', key, err);
    _setSyncStatus('erro');
  }
}

// ==========================================
// INICIAR LISTENER EM TEMPO REAL
// onSnapshot dispara imediatamente com os dados atuais
// e toda vez que o documento mudar
// ==========================================
async function _iniciarListenerTempoReal() {
  if (!_db) return;

  const { doc, onSnapshot } =
    await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

  const ref = doc(_db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);

  // Cancela listener anterior se existir
  if (_unsubscribe) _unsubscribe();

  _unsubscribe = onSnapshot(ref,
    (snap) => {
      if (!snap.exists()) {
        // Primeira vez: documento não existe, sobe os dados locais
        console.log('[Sync] Documento não encontrado — subindo dados locais...');
        _subirDadosLocais();
        return;
      }

      const dados = snap.data();
      console.log('[Sync] Dados recebidos do Firestore em tempo real.');

      // Bloqueia o interceptor para não criar loop
      _ignorarUpdate = true;

      SYNC_KEYS.forEach(key => {
        if (dados[key] !== undefined) {
          const serializado = JSON.stringify(dados[key]);
          _originalSetItem(key, serializado);
        }
      });

      _ignorarUpdate = false;
      _setSyncStatus('conectado');

      // Re-renderiza as telas com os dados atualizados
      _reRenderizar();
    },
    (err) => {
      console.error('[Sync] Erro no listener:', err);
      _setSyncStatus('erro');
    }
  );

  console.log('[Sync] Listener em tempo real ativo.');
}

// ==========================================
// SUBIR DADOS LOCAIS PARA O FIRESTORE
// Usado na primeira vez ou quando o doc não existe
// ==========================================
async function _subirDadosLocais() {
  if (!_db) return;
  try {
    _setSyncStatus('sincronizando');
    const { doc, setDoc } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    const payload = {};
    SYNC_KEYS.forEach(key => {
      const raw = _originalGetItem(key);
      if (raw !== null) {
        try { payload[key] = JSON.parse(raw); } catch { payload[key] = raw; }
      } else {
        payload[key] = [];
      }
    });

    const ref = doc(_db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    await setDoc(ref, payload, { merge: true });
    console.log('[Sync] Dados locais subidos com sucesso.');
    _setSyncStatus('conectado');
  } catch (err) {
    console.error('[Sync] Erro ao subir dados locais:', err);
    _setSyncStatus('erro');
  }
}

// ==========================================
// RE-RENDERIZAR TELAS APÓS UPDATE DO FIRESTORE
// ==========================================
function _reRenderizar() {
  // Só re-renderiza a aba que está visível para não causar lag
  const abas = {
    'content-analise':   () => typeof renderizarAnalise   === 'function' && renderizarAnalise(),
    'content-despesas':  () => typeof renderizarDespesas  === 'function' && renderizarDespesas(),
    'content-a-pagar':   () => typeof renderizarAPagar    === 'function' && renderizarAPagar(),
    'content-receita':   () => typeof renderizarReceitas  === 'function' && renderizarReceitas(),
    'content-dados':     () => typeof renderizarDados     === 'function' && renderizarDados()
  };

  Object.entries(abas).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el && !el.classList.contains('hidden')) fn();
  });

  if (typeof atualizarIconeNotificacao === 'function') atualizarIconeNotificacao();
}

// ==========================================
// PONTO DE ENTRADA — chamado pelo firebase-config.js
// após o Firebase Auth estar pronto e o usuário logado
// ==========================================
async function iniciarSync(firebaseApp) {
  try {
    const { getFirestore } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    _db = getFirestore(firebaseApp);
    _syncAtivo = true;

    console.log('[Sync] Firestore conectado. Iniciando listener...');
    _setSyncStatus('sincronizando');
    await _iniciarListenerTempoReal();

  } catch (err) {
    console.error('[Sync] Falha ao inicializar Firestore:', err);
    _setSyncStatus('erro');
  }
}

// Expõe globalmente
window.iniciarSync = iniciarSync;
