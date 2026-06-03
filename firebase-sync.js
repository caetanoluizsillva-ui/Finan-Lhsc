// ==========================================
// firebase-sync.js
// Sincronização em tempo real com Firestore
//
// COMO FUNCIONA:
// 1. Intercepta localStorage.setItem — quando o app salva,
//    também sobe para o Firestore automaticamente.
// 2. onSnapshot — escuta mudanças no Firestore em tempo real.
//    Quando chega update (de outro dispositivo), popula o
//    localStorage e re-renderiza a tela visível.
// ==========================================

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

// Preferências locais (não sincronizam entre dispositivos)
// cfg_mes, cfg_ano, valoresOcultos — ficam só no dispositivo

const FIRESTORE_COLLECTION = 'financeiro';
const FIRESTORE_DOC_ID     = 'meus-dados';

// ==========================================
// ESTADO INTERNO
// ==========================================
let _db             = null;
let _unsubscribe    = null;
let _syncAtivo      = false;
let _ignorarUpdate  = false; // evita loop: Firestore→localStorage→Firestore

// ==========================================
// GUARDAR REFERÊNCIA AO setItem ORIGINAL
// ANTES de qualquer script sobrescrever
// (este arquivo deve ser carregado PRIMEIRO)
// ==========================================
const _originalSetItem = Storage.prototype.setItem.bind(localStorage);
const _originalGetItem = Storage.prototype.getItem.bind(localStorage);

// ==========================================
// INTERCEPTOR — instala no prototype para
// capturar TODAS as chamadas, inclusive as
// feitas por app.js e render.js
// ==========================================
const _setItemOriginal = Storage.prototype.setItem;
Storage.prototype.setItem = function(key, value) {
  // Executa o comportamento original
  _setItemOriginal.call(this, key, value);

  // Só sincroniza o localStorage do window (não sessionStorage)
  if (this !== localStorage) return;
  if (!_syncAtivo || _ignorarUpdate) return;
  if (!SYNC_KEYS.includes(key)) return;

  _salvarChaveNoFirestore(key, value);
};

// ==========================================
// STATUS VISUAL (opcional no HTML)
// Adicione ao HTML para ver o status:
// <i id="sync-status-dot"></i>
// <span id="sync-status-txt"></span>
// ==========================================
function _setSyncStatus(status) {
  const cores  = { ok: '#27ae60', salvando: '#f39c12', erro: '#e74c3c' };
  const textos = { ok: '☁ Sincronizado', salvando: '↑ Salvando...', erro: '✗ Erro sync' };
  const dot = document.getElementById('sync-status-dot');
  const txt = document.getElementById('sync-status-txt');
  if (dot) dot.style.color = cores[status] || '#999';
  if (txt) txt.textContent  = textos[status] || status;
}

// ==========================================
// SALVAR UMA CHAVE NO FIRESTORE
// merge:true para não apagar outras chaves
// ==========================================
async function _salvarChaveNoFirestore(key, value) {
  if (!_db) return;
  try {
    _setSyncStatus('salvando');
    const { doc, setDoc } = await import(
      'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
    );
    let parsed;
    try { parsed = JSON.parse(value); } catch { parsed = value; }
    await setDoc(
      doc(_db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID),
      { [key]: parsed },
      { merge: true }
    );
    _setSyncStatus('ok');
  } catch (err) {
    console.error('[Sync] Erro ao salvar:', key, err);
    _setSyncStatus('erro');
  }
}

// ==========================================
// SUBIR TODOS OS DADOS LOCAIS PARA O FIRESTORE
// Usado na primeira vez (documento não existe)
// ==========================================
async function _subirDadosLocais() {
  if (!_db) return;
  try {
    _setSyncStatus('salvando');
    const { doc, setDoc } = await import(
      'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
    );
    const payload = {};
    SYNC_KEYS.forEach(key => {
      const raw = _originalGetItem(key);
      try { payload[key] = raw ? JSON.parse(raw) : []; }
      catch { payload[key] = []; }
    });
    await setDoc(
      doc(_db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID),
      payload,
      { merge: true }
    );
    console.log('[Sync] Dados locais enviados para o Firestore.');
    _setSyncStatus('ok');
  } catch (err) {
    console.error('[Sync] Erro ao subir dados locais:', err);
    _setSyncStatus('erro');
  }
}

// ==========================================
// RE-RENDERIZAR A ABA VISÍVEL
// Chamado toda vez que o Firestore envia update
// ==========================================
function _reRenderizar() {
  // Pequeno delay para garantir que o localStorage já foi atualizado
  setTimeout(() => {
    try {
      // Renderiza a aba visível
      const mapa = {
        'content-analise':  () => typeof renderizarAnalise  === 'function' && renderizarAnalise(),
        'content-despesas': () => typeof renderizarDespesas === 'function' && renderizarDespesas(),
        'content-a-pagar':  () => typeof renderizarAPagar   === 'function' && renderizarAPagar(),
        'content-receita':  () => typeof renderizarReceitas === 'function' && renderizarReceitas(),
        'content-dados':    () => typeof renderizarDados    === 'function' && renderizarDados(),
      };
      for (const [id, fn] of Object.entries(mapa)) {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden')) { fn(); break; }
      }
      // Notificações sempre atualizadas
      if (typeof atualizarIconeNotificacao === 'function') atualizarIconeNotificacao();
    } catch (e) {
      console.warn('[Sync] Erro ao re-renderizar:', e);
    }
  }, 50);
}

// ==========================================
// LISTENER EM TEMPO REAL (onSnapshot)
// Dispara imediatamente com dados atuais
// e a cada mudança no Firestore
// ==========================================
async function _iniciarListener() {
  const { doc, onSnapshot } = await import(
    'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
  );

  if (_unsubscribe) _unsubscribe(); // cancela listener anterior

  const ref = doc(_db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);

  _unsubscribe = onSnapshot(ref,
    (snap) => {
      if (!snap.exists()) {
        // Primeira vez: documento vazio → sobe dados locais
        console.log('[Sync] Documento não existe. Subindo dados locais...');
        _subirDadosLocais();
        return;
      }

      const dados = snap.data();
      console.log('[Sync] Recebeu dados do Firestore.');

      // Bloqueia interceptor para não criar loop
      _ignorarUpdate = true;
      SYNC_KEYS.forEach(key => {
        if (dados[key] !== undefined) {
          _originalSetItem(key, JSON.stringify(dados[key]));
        }
      });
      _ignorarUpdate = false;

      _setSyncStatus('ok');
      _reRenderizar();
    },
    (err) => {
      console.error('[Sync] Erro no listener:', err);
      _setSyncStatus('erro');
    }
  );

  console.log('[Sync] Listener ativo — aguardando dados do Firestore...');
}

// ==========================================
// PONTO DE ENTRADA
// Chamado pelo firebase-config.js após login
// ==========================================
async function iniciarSync(firebaseApp) {
  try {
    const { getFirestore } = await import(
      'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
    );
    _db = getFirestore(firebaseApp);
    _syncAtivo = true;
    _setSyncStatus('salvando');
    await _iniciarListener();
  } catch (err) {
    console.error('[Sync] Falha ao iniciar Firestore:', err);
    _setSyncStatus('erro');
  }
}

// Expõe globalmente
window.iniciarSync = iniciarSync;
