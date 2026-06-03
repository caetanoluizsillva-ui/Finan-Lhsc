// ==========================================
// firebase-sync.js  —  Sincronização Firestore
// ==========================================
// ESTRATÉGIA SIMPLES E ROBUSTA:
//
// ESCRITA: monkey-patch em Storage.prototype.setItem
//   instalado ANTES de app.js/render.js rodarem
//   (firebase-sync.js deve ser o 1º script no HTML)
//
// LEITURA: onSnapshot dispara imediatamente com os
//   dados do Firestore e a cada mudança remota.
//   Sobrescreve o localStorage e re-renderiza.
//
// PRIMEIRA VEZ: se o documento Firestore não existe,
//   sobe tudo que estiver no localStorage.
// ==========================================

;(function() {

  const SYNC_KEYS = [
    'despesas_gastos','a_pagar','receitas','cartoes',
    'cat_despesas','cat_receitas','tipos_despesa','metas'
  ];

  const COL = 'financeiro';
  const DOC = 'meus-dados';

  let _db           = null;
  let _syncAtivo    = false;
  let _bloqueado    = false;   // evita loop write→Firestore→onSnapshot→write
  let _unsubscribe  = null;

  // ── Guarda o setItem original ──────────────────────
  const _origSet = Storage.prototype.setItem;
  const _origGet = Storage.prototype.getItem;

  // ── Instala interceptor AGORA (síncrono) ───────────
  Storage.prototype.setItem = function(key, value) {
    _origSet.call(this, key, value);                    // comportamento normal
    if (this === localStorage &&
        _syncAtivo &&
        !_bloqueado &&
        SYNC_KEYS.includes(key)) {
      _push(key, value);                                // sobe para o Firestore
    }
  };

  // ── Sobe uma chave para o Firestore ────────────────
  async function _push(key, rawValue) {
    if (!_db) return;
    try {
      _setStatus('salvando');
      const { doc, setDoc } = await _fsMod();
      let val;
      try { val = JSON.parse(rawValue); } catch { val = rawValue; }
      await setDoc(doc(_db, COL, DOC), { [key]: val }, { merge: true });
      _setStatus('ok');
    } catch (e) {
      console.error('[Sync] push erro:', key, e);
      _setStatus('erro');
    }
  }

  // ── Sobe TODO o localStorage para o Firestore ──────
  async function _pushTudo() {
    if (!_db) return;
    try {
      _setStatus('salvando');
      const { doc, setDoc } = await _fsMod();
      const payload = {};
      SYNC_KEYS.forEach(k => {
        const raw = _origGet.call(localStorage, k);
        try { payload[k] = raw ? JSON.parse(raw) : []; }
        catch { payload[k] = []; }
      });
      await setDoc(doc(_db, COL, DOC), payload, { merge: true });
      console.log('[Sync] Dados locais enviados ao Firestore.');
      _setStatus('ok');
    } catch (e) {
      console.error('[Sync] pushTudo erro:', e);
      _setStatus('erro');
    }
  }

  // ── Importa módulo Firestore (cached pelo browser) ─
  let _fsModCache = null;
  async function _fsMod() {
    if (!_fsModCache) {
      _fsModCache = await import(
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'
      );
    }
    return _fsModCache;
  }

  // ── Re-renderiza a aba visível ─────────────────────
  function _render() {
    // Aguarda 30ms para o localStorage já estar populado
    setTimeout(() => {
      try {
        const abas = {
          'content-analise':  'renderizarAnalise',
          'content-despesas': 'renderizarDespesas',
          'content-a-pagar':  'renderizarAPagar',
          'content-receita':  'renderizarReceitas',
          'content-dados':    'renderizarDados',
        };
        for (const [id, fn] of Object.entries(abas)) {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('hidden') && typeof window[fn] === 'function') {
            window[fn]();
            break;
          }
        }
        if (typeof atualizarIconeNotificacao === 'function') atualizarIconeNotificacao();
      } catch(e) { console.warn('[Sync] render err:', e); }
    }, 30);
  }

  // ── Listener em tempo real ─────────────────────────
  async function _listen() {
    const { doc, onSnapshot } = await _fsMod();
    if (_unsubscribe) _unsubscribe();

    _unsubscribe = onSnapshot(
      doc(_db, COL, DOC),
      (snap) => {
        if (!snap.exists()) {
          // Documento ainda não existe → envia dados locais
          _pushTudo();
          return;
        }
        const dados = snap.data();
        _bloqueado = true;
        SYNC_KEYS.forEach(k => {
          if (dados[k] !== undefined) {
            _origSet.call(localStorage, k, JSON.stringify(dados[k]));
          }
        });
        _bloqueado = false;
        _setStatus('ok');
        _render();
        console.log('[Sync] Dados sincronizados do Firestore.');
      },
      (err) => {
        console.error('[Sync] listener erro:', err);
        _setStatus('erro');
      }
    );
  }

  // ── Status visual (elementos opcionais no HTML) ────
  function _setStatus(s) {
    const cores  = { ok:'#27ae60', salvando:'#f39c12', erro:'#e74c3c' };
    const labels = { ok:'☁ Sincronizado', salvando:'↑ Salvando...', erro:'✗ Erro sync' };
    const dot = document.getElementById('sync-status-dot');
    const txt = document.getElementById('sync-status-txt');
    if (dot) dot.style.color = cores[s] || '#999';
    if (txt) txt.textContent  = labels[s] || s;
  }

  // ── Ponto de entrada: chamado pelo firebase-config.js ─
  async function iniciarSync(firebaseApp) {
    try {
      const { getFirestore } = await _fsMod();
      _db        = getFirestore(firebaseApp);
      _syncAtivo = true;
      _setStatus('salvando');
      await _listen();
    } catch (e) {
      console.error('[Sync] iniciarSync erro:', e);
      _setStatus('erro');
    }
  }

  window.iniciarSync = iniciarSync;

})();
