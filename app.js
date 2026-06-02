// ==========================================
// LOGIN / LOGOUT / NAVEGAÇÃO
// ==========================================
async function fazerLogin() {
    const email  = document.getElementById('username').value.trim(); 
    const pass   = document.getElementById('password').value;
    const err    = document.getElementById('login-error');
    const btnLogin = document.getElementById('btn-login');

    if (!email || !pass) {
        err.innerText = 'Preencha o e-mail e a senha.';
        return;
    }

    if (!window._firebaseAPI || !window._firebaseAuth) {
        err.innerText = 'Firebase ainda inicializando. Aguarde alguns segundos e tente novamente.';
        return;
    }

    try {
        err.style.color = '#2980b9';
        err.innerText = 'Autenticando...';
        if (btnLogin) { btnLogin.disabled = true; btnLogin.textContent = 'Aguarde...'; }

        const { signInWithEmailAndPassword } = window._firebaseAPI;
        await signInWithEmailAndPassword(window._firebaseAuth, email, pass);
        
        err.innerText = '';
        // A transição de tela é feita automaticamente pelo onAuthStateChanged abaixo
    } catch (error) {
        console.error("Erro no login:", error);
        err.style.color = '#c0392b';
        // Mensagens amigáveis por código de erro Firebase
        const msgs = {
            'auth/user-not-found':    'E-mail não cadastrado.',
            'auth/wrong-password':    'Senha incorreta.',
            'auth/invalid-email':     'E-mail inválido.',
            'auth/too-many-requests': 'Muitas tentativas. Aguarde e tente novamente.',
            'auth/invalid-credential':'E-mail ou senha incorretos.',
            'auth/network-request-failed': 'Sem conexão com a internet.',
        };
        err.innerText = msgs[error.code] || 'Erro ao autenticar. Verifique seus dados.';
        if (btnLogin) { btnLogin.disabled = false; btnLogin.textContent = 'Entrar no Sistema'; }
    }
}
document.getElementById('password').addEventListener('keypress', e => { if (e.key==='Enter') fazerLogin(); });

async function fazerLogout()
// ==========================================
// LOGIN — TOGGLE VISIBILIDADE DE SENHA
// ==========================================
function toggleSenhaVisivel() {
  const input = document.getElementById('password');
  const icone = document.getElementById('icone-senha');
  if (input.type === 'password') {
    input.type = 'text';
    icone.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icone.classList.replace('fa-eye-slash', 'fa-eye');
  }
}
 {
    if (window._firebaseAPI && window._firebaseAuth) {
        const { signOut } = window._firebaseAPI;
        await signOut(window._firebaseAuth); // Desloga do Firebase
    }
    
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    ['username','password'].forEach(id => document.getElementById(id).value = '');
}

function mudarAba(nome, id, el) {
    const icon = el.querySelector('.menu-icon').innerText;
    document.getElementById('page-title').innerHTML =
        `<span class="title-icon">${icon}</span><span class="title-text">${nome}</span>`;
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('content-' + id).classList.remove('hidden');
    const renders = {
        analise: renderizarAnalise,
        despesas: renderizarDespesas,
        'a-pagar': renderizarAPagar,
        receita: renderizarReceitas,
        dados: renderizarDados,
        configuracoes: renderizarConfiguracoes
    };
    if (renders[id]) renders[id]();
    setTimeout(atualizarIconeNotificacao, 200);
}

function voltarParaAnalise() {
    mudarAba('Análise','analise', document.querySelector('.menu-item'));
    renderizarAnalise();
}

// ==========================================
// STORAGE E VARIÁVEIS GLOBAIS
// ==========================================
function getData(key, def=[]) {
    try { const v=localStorage.getItem(key); return v?JSON.parse(v):def; } catch { return def; }
}

function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function brl(n) { return 'R$ '+(+n||0).toLocaleString('pt-BR',{minimumFractionDigits:2}); }

const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let _mesSel = null; 
let _anoSel = new Date().getFullYear();

function getMesSel()  { return _mesSel; }
function getAnoSel()  { return _anoSel; }

function _atualizarHeaderMes() {
    const label = document.getElementById('header-mes-label');
    if (!label) return;
    if (_mesSel === null) {
        label.textContent = 'Todos';
    } else {
        label.textContent = MESES_ABREV[_mesSel] + ' ' + String(_anoSel).slice(2);
    }
}

function navegarMes(dir) {
    if (_mesSel === null) {
        const hoje = new Date();
        _mesSel = hoje.getMonth();
        _anoSel = hoje.getFullYear();
    }
    _mesSel += dir;
    if (_mesSel < 0)  { _mesSel = 11; _anoSel--; }
    if (_mesSel > 11) { _mesSel = 0;  _anoSel++; }
    _atualizarHeaderMes();
    localStorage.setItem('cfg_mes', JSON.stringify(_mesSel));
    localStorage.setItem('cfg_ano', JSON.stringify(_anoSel));
    _sincronizarAnoConfig();
    renderizarDespesas(); renderizarAPagar(); renderizarReceitas(); renderizarAnalise();
}

function abrirMesPicker() {
    const grid = document.getElementById('mes-picker-grid');
    grid.innerHTML = `<button class="mes-picker-btn${_mesSel===null?' mes-picker-ativo':''}" onclick="selecionarMesPicker(null)">Todos</button>` +
        MESES_FULL.map((m,i) =>
            `<button class="mes-picker-btn${_mesSel===i?' mes-picker-ativo':''}" onclick="selecionarMesPicker(${i})">${MESES_ABREV[i]}</button>`
        ).join('');
    document.getElementById('modal-mes-picker').classList.remove('hidden');
}

function selecionarMesPicker(idx) {
    _mesSel = idx;
    _atualizarHeaderMes();
    localStorage.setItem('cfg_mes', JSON.stringify(_mesSel));
    fecharModal('modal-mes-picker');
    renderizarDespesas(); renderizarAPagar(); renderizarReceitas(); renderizarAnalise();
}

function _sincronizarAnoConfig() {
    const sel = document.getElementById('config-ano-select');
    if (sel) sel.value = _anoSel;
}

function _atualizarDataHoje() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2,'0');
    const mes = MESES_ABREV[hoje.getMonth()];
    const el = document.getElementById('header-data-hoje');
    if (el) el.textContent = `${dia}/${mes}`;
}

// ==========================================
// TOAST & MODAIS
// ==========================================
function toast(msg, tipo='success') {
    const t=document.getElementById('toast');
    t.textContent=msg; t.className=`toast toast-${tipo}`;
    t.classList.remove('hidden');
    setTimeout(()=>t.classList.add('hidden'),2800);
}

function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if(e.target===el) el.classList.add('hidden'); });
});

function _pickerCor(scope, hiddenId, el) {
    document.querySelectorAll(`${scope} .color-opt`).forEach(c=>c.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById(hiddenId).value = el.dataset.color;
}
function selecionarCor(el)       { _pickerCor('#modal-cartao',  'cartao-cor', el); }
function selecionarCorCat(el)    { _pickerCor('#modal-categoria','cat-cor', el); }
function selecionarIcone(el) {
    document.querySelectorAll('.icon-opt').forEach(i=>i.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('cat-icone').value = el.dataset.icon;
}
function _resetPicker(scope, hiddenId, defaultColor) {
    document.querySelectorAll(`${scope} .color-opt`).forEach((el,i) => {
        el.classList.toggle('selected', el.dataset.color===defaultColor);
    });
    document.getElementById(hiddenId).value = defaultColor;
}

// ==========================================
// DESPESAS (gastos realizados)
// ==========================================
function _populateDespesaSelects() {
    const cats    = getData('cat_despesas');
    const cartoes = getData('cartoes');
    const tipos   = getData('tipos_despesa');
    document.getElementById('despesa-categoria').innerHTML = '<option value="">Sem categoria</option>' + cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
    const optsCartoes = cartoes.map(c=>`<option value="cartao_${c.id}">💳 ${c.nome}</option>`).join('');
    const optsTipos   = tipos.map(t=>`<option value="tipo_${t.id}">${t.icone} ${t.nome}</option>`).join('');
    document.getElementById('despesa-tipo-pagamento').innerHTML = '<option value="">Selecione...</option>' + optsCartoes + optsTipos;
}

function abrirModalDespesa(id=null) {
    document.getElementById('modal-despesa-titulo').textContent = id ? 'Editar Despesa' : 'Nova Despesa';
    ['despesa-edit-id','despesa-descricao','despesa-local','despesa-obs'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('despesa-valor').value = '';
    document.getElementById('despesa-data').value  = new Date().toISOString().slice(0,10);
    _populateDespesaSelects();
    if (id) {
        const r = getData('despesas_gastos').find(x=>x.id===id);
        if (r) {
            document.getElementById('despesa-edit-id').value = r.id;
            document.getElementById('despesa-descricao').value = r.descricao;
            document.getElementById('despesa-valor').value = r.valor;
            document.getElementById('despesa-data').value = r.data;
            document.getElementById('despesa-categoria').value = r.categoriaId||'';
            document.getElementById('despesa-tipo-pagamento').value = r.tipoPagamentoVal||'';
            document.getElementById('despesa-local').value = r.local||'';
            document.getElementById('despesa-obs').value = r.obs||'';
        }
    }
    document.getElementById('modal-despesa').classList.remove('hidden');
}

function salvarDespesa() {
    const desc  = document.getElementById('despesa-descricao').value.trim();
    const valor = parseFloat(document.getElementById('despesa-valor').value);
    const data  = document.getElementById('despesa-data').value;
    if (!desc)  { toast('Informe a descrição.','error'); return; }
    if (!valor) { toast('Informe o valor.','error'); return; }
    if (!data)  { toast('Informe a data.','error'); return; }

    const catId  = document.getElementById('despesa-categoria').value;
    const cat    = getData('cat_despesas').find(x=>x.id===catId);
    const tpVal  = document.getElementById('despesa-tipo-pagamento').value;
    let tipoPagamentoNome = '';
    if (tpVal.startsWith('cartao_')) {
        const c = getData('cartoes').find(x=>x.id===tpVal.replace('cartao_',''));
        tipoPagamentoNome = c ? '💳 '+c.nome : '';
    } else if (tpVal.startsWith('tipo_')) {
        const t = getData('tipos_despesa').find(x=>x.id===tpVal.replace('tipo_',''));
        tipoPagamentoNome = t ? t.icone+' '+t.nome : '';
    }

    const lista  = getData('despesas_gastos');
    const editId = document.getElementById('despesa-edit-id').value;
    const obj = {
        id:               editId||uid(),
        descricao:        desc,
        valor, data,
        categoriaId:      catId,
        categoriaNome:    cat?cat.nome:'',
        categoriaIcone:   cat?cat.icone:'💸',
        categoriaCor:     cat?cat.cor:'#e74c3c',
        tipoPagamentoVal: tpVal,
        tipoPagamentoNome,
        local:            document.getElementById('despesa-local').value.trim(),
        obs:              document.getElementById('despesa-obs').value.trim()
    };
    if (editId) { lista[lista.findIndex(x=>x.id===editId)]=obj; toast('Despesa atualizada!'); }
    else { lista.push(obj); toast('Despesa registrada!'); }
    setData('despesas_gastos', lista);
    fecharModal('modal-despesa');
    renderizarDespesas(); renderizarAnalise();
}

function excluirDespesa(id) {
    if (!confirm('Excluir esta despesa?')) return;
    setData('despesas_gastos', getData('despesas_gastos').filter(x=>x.id!==id));
    toast('Despesa excluída.','info');
    renderizarDespesas();
}

function renderizarDespesas() {
    const cats  = getData('cat_despesas');
    const fCat  = document.getElementById('filtro-despesa-cat');
    const curCat = fCat.value;
    fCat.innerHTML = '<option value="">Todas as categorias</option>' + cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
    fCat.value = curCat;

    let todas = getData('despesas_gastos');
    if (_mesSel !== null) {
        const anoStr = String(_anoSel);
        const mesStr = String(_mesSel+1).padStart(2,'0');
        todas = todas.filter(x => x.data && x.data.startsWith(anoStr+'-'+mesStr));
    } else {
        todas = todas.filter(x => x.data && x.data.startsWith(String(_anoSel)));
    }

    const curTipo = document.getElementById('filtro-despesa-tipo').value;
    if (curCat)  todas = todas.filter(x=>x.categoriaId===curCat);

    const total = todas.reduce((s,x)=>s+x.valor,0);
    document.getElementById('despesas-total').textContent = brl(total);

    const el = document.getElementById('lista-despesas');
    if (!todas.length) {
        el.innerHTML='<div class="registros-empty"><i class="fas fa-receipt"></i><p>Nenhuma despesa encontrada.</p></div>';
        return;
    }
    el.innerHTML = todas.sort((a,b)=>b.data.localeCompare(a.data)).map(r=>{
        const dataFmt = r.data ? new Date(r.data+'T00:00').toLocaleDateString('pt-BR') : '—';
        return `
    <div class="reg-item" style="border-left:4px solid ${r.categoriaCor||'#e74c3c'}">
        <div class="reg-icon" style="background:${r.categoriaCor||'#e74c3c'}20;color:${r.categoriaCor||'#e74c3c'}">${r.categoriaIcone||'💸'}</div>
        <div class="reg-info">
            <span class="reg-nome">${r.descricao}</span>
            <span class="reg-sub">${r.categoriaNome||'Sem categoria'} &nbsp;·&nbsp; ${dataFmt}${r.tipoPagamentoNome?' &nbsp;·&nbsp; '+r.tipoPagamentoNome:''}${r.local?' &nbsp;·&nbsp; '+r.local:''}</span>
        </div>
        <div class="reg-valor" style="color:#e74c3c">${brl(r.valor)}</div>
        <div class="reg-actions">
            <button class="btn-icon btn-edit" onclick="abrirModalDespesa('${r.id}')"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn-icon btn-del"  onclick="excluirDespesa('${r.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`}).join('');
}

// ==========================================
// A PAGAR (Contas pendentes/pagas)
// ==========================================
function _populateSelectAPagar() {
    const cats    = getData('cat_despesas');
    const cartoes = getData('cartoes');
    const tipos   = getData('tipos_despesa');
    document.getElementById('apagar-categoria').innerHTML = '<option value="">Sem categoria</option>' + cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
    const optsCartoes = cartoes.map(c=>`<option value="cartao_${c.id}">💳 ${c.nome}</option>`).join('');
    const optsTipos   = tipos.map(t=>`<option value="tipo_${t.id}">${t.icone} ${t.nome}</option>`).join('');
    document.getElementById('apagar-tipo-pagamento').innerHTML = '<option value="">Selecione...</option>' + optsCartoes + optsTipos;
}

function abrirModalAPagar(id=null) {
    document.getElementById('modal-apagar-titulo').textContent = id ? 'Editar Despesa' : 'Nova Despesa';
    ['apagar-edit-id','apagar-descricao','apagar-obs'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('apagar-valor').value='';
    document.getElementById('apagar-vencimento').value = new Date().toISOString().slice(0,10);
    document.getElementById('apagar-tipo').value='Fixo';
    document.getElementById('apagar-parcelas').value='1';
    document.getElementById('apagar-pago').checked = false;
    _populateSelectAPagar();
    if (id) {
        const r = getData('a_pagar').find(x=>x.id===id);
        if (r) {
            document.getElementById('apagar-edit-id').value = r.id;
            document.getElementById('apagar-descricao').value = r.descricao;
            document.getElementById('apagar-valor').value = r.valor;
            document.getElementById('apagar-vencimento').value = r.vencimento;
            document.getElementById('apagar-tipo').value = r.tipo;
            document.getElementById('apagar-parcelas').value = r.parcelas||1;
            document.getElementById('apagar-pago').checked = r.pago||false;
            document.getElementById('apagar-obs').value = r.obs||'';
            document.getElementById('apagar-categoria').value = r.categoriaId||'';
            document.getElementById('apagar-tipo-pagamento').value = r.tipoPagamentoVal||'';
        }
    }
    _toggleParcelas();
    document.getElementById('modal-a-pagar').classList.remove('hidden');
}

function _toggleParcelas() {
    const tipo = document.getElementById('apagar-tipo').value;
    document.getElementById('row-parcelas').style.display = tipo === 'Parcelado' ? '' : 'none';
}

function salvarAPagar() {
    const desc  = document.getElementById('apagar-descricao').value.trim();
    const valor = parseFloat(document.getElementById('apagar-valor').value);
    const venc  = document.getElementById('apagar-vencimento').value;
    
    if (!desc)  { toast('Informe a descrição.','error'); return; }
    if (!valor) { toast('Informe o valor.','error'); return; }
    if (!venc)  { toast('Informe o vencimento.','error'); return; }

    const catId   = document.getElementById('apagar-categoria').value;
    const cat     = getData('cat_despesas').find(x=>x.id===catId);
    const pago    = document.getElementById('apagar-pago').checked;
    const tipoSelecionado = document.getElementById('apagar-tipo').value;
    const parcelas = parseInt(document.getElementById('apagar-parcelas').value)||1;
    const tpVal = document.getElementById('apagar-tipo-pagamento').value;
    
    let tipoPagamentoNome = '';
    if (tpVal.startsWith('cartao_')) {
        const cartao = getData('cartoes').find(x=>x.id===tpVal.replace('cartao_',''));
        tipoPagamentoNome = cartao ? '💳 '+cartao.nome : '';
    }

    const lista  = getData('a_pagar');
    const editId = document.getElementById('apagar-edit-id').value;

    const somarMesesFuturos = (dataReferencia, mesesASomar) => {
        let [ano, mes, dia] = dataReferencia.split('-');
        let dataObj = new Date(ano, parseInt(mes) - 1 + mesesASomar, 1); 
        let ultimoDiaDoMesDestino = new Date(dataObj.getFullYear(), dataObj.getMonth() + 1, 0).getDate();
        dataObj.setDate(Math.min(parseInt(dia), ultimoDiaDoMesDestino));
        return `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}`;
    };

    if (editId) {
        const obj = { id: editId, descricao: desc, valor, vencimento: venc, tipo: tipoSelecionado, parcelas, pago, status: calcularStatus(venc, pago), obs: document.getElementById('apagar-obs').value.trim(), categoriaId: catId, categoriaNome: cat?cat.nome:'', categoriaIcone:cat?cat.icone:'🏷️', categoriaCor: cat?cat.cor:'#95a5a6', tipoPagamentoVal: tpVal, tipoPagamentoNome };
        lista[lista.findIndex(x=>x.id===editId)] = obj; 
        toast('Despesa atualizada!');
    } else {
        if (tipoSelecionado === 'Parcelado' && parcelas > 1) {
            let valorDaParcela = parseFloat((valor / parcelas).toFixed(2));
            let diferencaCentavos = valor - (valorDaParcela * parcelas);
            for (let i = 0; i < parcelas; i++) {
                const dataDaParcela = somarMesesFuturos(venc, i);
                let valorDesteMes = (i === 0) ? valorDaParcela + diferencaCentavos : valorDaParcela;
                const statusPago = (i === 0) ? pago : false;
                
                lista.push({ id: uid(), descricao: `${desc} (${i + 1}/${parcelas})`, valor: parseFloat(valorDesteMes.toFixed(2)), vencimento: dataDaParcela, tipo: 'Parcelado', parcelas, pago: statusPago, status: calcularStatus(dataDaParcela, statusPago), obs: document.getElementById('apagar-obs').value.trim(), categoriaId: catId, categoriaNome: cat?cat.nome:'', categoriaIcone:cat?cat.icone:'🏷️', categoriaCor: cat?cat.cor:'#95a5a6', tipoPagamentoVal: tpVal, tipoPagamentoNome });
            }
            toast(`${parcelas} parcelas registradas!`);
        } else {
            lista.push({ id: uid(), descricao: desc, valor, vencimento: venc, tipo: tipoSelecionado, parcelas, pago, status: calcularStatus(venc, pago), obs: document.getElementById('apagar-obs').value.trim(), categoriaId: catId, categoriaNome: cat?cat.nome:'', categoriaIcone:cat?cat.icone:'🏷️', categoriaCor: cat?cat.cor:'#95a5a6', tipoPagamentoVal: tpVal, tipoPagamentoNome });
            toast('Despesa cadastrada!');
        }
    }
    
    setData('a_pagar', lista);
    fecharModal('modal-a-pagar');
    renderizarAPagar(); renderizarAnalise();
}

function calcularStatus(vencimento, pago) {
    if (pago) return 'pago';
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const venc = new Date(vencimento+'T00:00');
    return venc < hoje ? 'vencido' : 'pendente';
}

function marcarPago(id, valor) {
    const lista = getData('a_pagar');
    const idx   = lista.findIndex(x=>x.id===id);
    if (idx === -1) return;
    lista[idx].pago   = valor;
    lista[idx].status = calcularStatus(lista[idx].vencimento, valor);
    if (valor) {
        if (_mesSel !== null) {
            const ano = _anoSel;
            const mes = String(_mesSel + 1).padStart(2, '0');
            lista[idx].dataPagamento = `${ano}-${mes}-01`;
        } else {
            lista[idx].dataPagamento = new Date().toISOString().slice(0, 10);
        }
    } else {
        delete lista[idx].dataPagamento;
    }
    setData('a_pagar', lista);
    renderizarAPagar();
    atualizarIconeNotificacao();
    toast(valor ? 'Marcado como pago! ✓' : 'Revertido para pendente.', valor?'success':'info');
}

function excluirAPagar(id) {
    if (!confirm('Excluir esta despesa?')) return;
    setData('a_pagar', getData('a_pagar').filter(x=>x.id!==id));
    toast('Despesa excluída.','info');
    renderizarAPagar();
}

function renderizarAPagar() {
    const todosAPagar = getData('a_pagar').map(r => { r.status = calcularStatus(r.vencimento, r.pago||false); return r; });
    setData('a_pagar', todosAPagar);

    const cats = getData('cat_despesas');
    const fCat = document.getElementById('filtro-apagar-cat');
    const curCat = fCat ? fCat.value : '';
    if (fCat) {
        fCat.innerHTML = '<option value="">Todas as categorias</option>' + cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
        fCat.value = curCat;
    }

    const hoje = new Date(); hoje.setHours(0,0,0,0);
    let lista;
    if (_mesSel !== null) {
        const prefixo = String(_anoSel) + '-' + String(_mesSel + 1).padStart(2, '0');
        lista = todosAPagar.filter(x => {
            if (x.status === 'pago') return (x.dataPagamento || x.vencimento || '').startsWith(prefixo);
            if (x.status === 'vencido') return true;
            return (x.vencimento || '').startsWith(prefixo);
        });
    } else {
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();
        const anoStr   = String(_anoSel);
        lista = todosAPagar.filter(x => {
            if (x.status === 'pago') return (x.dataPagamento || x.vencimento || '').startsWith(anoStr);
            if (x.status === 'vencido') return true;
            if (!x.vencimento) return true;
            const [aV, mV] = x.vencimento.split('-').map(Number);
            return (aV < anoAtual) || (aV === anoAtual && (mV - 1) <= mesAtual);
        });
    }

    const fStatus = document.getElementById('filtro-apagar-status');
    const curStatus = fStatus ? fStatus.value : '';
    if (curStatus) lista = lista.filter(x => x.status === curStatus);
    if (curCat)  lista = lista.filter(x => x.categoriaId === curCat);

    const total = lista.filter(x => x.status !== 'pago').reduce((s, x) => s + x.valor, 0);
    const apagarTotalEl = document.getElementById('apagar-total');
    if (apagarTotalEl) apagarTotalEl.textContent = brl(total);

    const el = document.getElementById('lista-a-pagar');
    if (!el) return;
    
    if (!lista.length) {
        el.innerHTML = '<div class="registros-empty"><i class="fas fa-file-invoice-dollar"></i><p>Nenhuma despesa encontrada para o período.</p></div>';
        return;
    }
    
    const statusCfg = { pendente: {label:'Pendente', cls:'badge-pendente'}, pago: {label:'Pago', cls:'badge-pago'}, vencido: {label:'Vencido', cls:'badge-vencido'} };
    
    el.innerHTML = lista.sort((a,b) => {
        const ordemStatus = { vencido: 0, pendente: 1, pago: 2 };
        const oa = ordemStatus[a.status] ?? 1; const ob = ordemStatus[b.status] ?? 1;
        if (oa !== ob) return oa - ob;
        return a.vencimento.localeCompare(b.vencimento);
    }).map(r=>{
        const s = statusCfg[r.status]||statusCfg.pendente;
        const dataFmt = r.vencimento ? new Date(r.vencimento+'T00:00').toLocaleDateString('pt-BR') : '—';
        const parcelaTag = r.tipo==='Parcelado'&&r.parcelas>1 ? `<span class="reg-tipo-tag">📦 ${r.parcelas}x</span>` : '';
        const btnPago = r.pago ? `<button class="btn-pago-toggle btn-pago-sim" onclick="marcarPago('${r.id}',false)" title="Reverter"><i class="fas fa-check-circle"></i> Pago</button>` : `<button class="btn-pago-toggle btn-pago-nao" onclick="marcarPago('${r.id}',true)" title="Pagar"><i class="far fa-circle"></i> Pagar</button>`;
        return `
    <div class="reg-item${r.status==='pago'?' reg-pago':''}" data-id="${r.id}" style="border-left:4px solid ${r.categoriaCor||'#95a5a6'}">
        <div class="reg-icon" style="background:${r.categoriaCor||'#95a5a6'}20;color:${r.categoriaCor||'#95a5a6'}">${r.categoriaIcone||'🏷️'}</div>
        <div class="reg-info">
            <span class="reg-nome">${r.descricao}</span>
            <span class="reg-sub">${r.categoriaNome||'Sem categoria'} &nbsp;·&nbsp; Venc: ${dataFmt}${r.tipoPagamentoNome?' &nbsp;·&nbsp; '+r.tipoPagamentoNome:''}</span>
        </div>
        <div class="reg-meio">
            <span class="badge ${s.cls}">${s.label}</span>
            <span class="reg-tipo-tag">${r.tipo}</span>
            ${parcelaTag}
        </div>
        <div class="reg-valor" style="color:#e74c3c">${brl(r.valor)}</div>
        <div class="reg-actions">
            ${btnPago}
            <button class="btn-icon btn-edit" onclick="abrirModalAPagar('${r.id}')"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn-icon btn-del"  onclick="excluirAPagar('${r.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`}).join('');
}

// ==========================================
// RECEITAS
// ==========================================
function _populateSelectReceita() {
    const cats   = getData('cat_receitas');
    const contas = getData('contas');
    document.getElementById('receita-categoria').innerHTML = '<option value="">Sem categoria</option>' + cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
    document.getElementById('receita-conta').innerHTML = '<option value="">Nenhuma</option>' + contas.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
}

function abrirModalReceita(id=null) {
    document.getElementById('modal-receita-titulo').textContent = id ? 'Editar Receita' : 'Nova Receita';
    ['receita-edit-id','receita-descricao','receita-obs'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('receita-valor').value='';
    document.getElementById('receita-data').value = new Date().toISOString().slice(0,10);
    document.getElementById('receita-tipo').value='Recorrente';
    document.getElementById('receita-status').value='recebido';
    _populateSelectReceita();
    if (id) {
        const r = getData('receitas').find(x=>x.id===id);
        if (r) {
            document.getElementById('receita-edit-id').value   = r.id;
            document.getElementById('receita-descricao').value = r.descricao;
            document.getElementById('receita-valor').value     = r.valor;
            document.getElementById('receita-data').value      = r.data;
            document.getElementById('receita-tipo').value      = r.tipo;
            document.getElementById('receita-status').value    = r.status;
            document.getElementById('receita-obs').value       = r.obs||'';
            document.getElementById('receita-categoria').value = r.categoriaId||'';
            document.getElementById('receita-conta').value     = r.contaId||'';
        }
    }
    document.getElementById('modal-receita').classList.remove('hidden');
}

function salvarReceita() {
    const desc  = document.getElementById('receita-descricao').value.trim();
    const valor = parseFloat(document.getElementById('receita-valor').value);
    const data  = document.getElementById('receita-data').value;
    if (!desc)  { toast('Informe a descrição.','error'); return; }
    if (!valor) { toast('Informe o valor.','error'); return; }
    if (!data)  { toast('Informe a data.','error'); return; }

    const catId  = document.getElementById('receita-categoria').value;
    const cat    = getData('cat_receitas').find(x=>x.id===catId);
    const contaId= document.getElementById('receita-conta').value;
    const conta  = getData('contas').find(x=>x.id===contaId);
    const lista  = getData('receitas');
    const editId = document.getElementById('receita-edit-id').value;

    const obj = { id: editId||uid(), descricao: desc, valor, data, tipo: document.getElementById('receita-tipo').value, status: document.getElementById('receita-status').value, obs: document.getElementById('receita-obs').value.trim(), categoriaId: catId, categoriaNome: cat?cat.nome:'', categoriaIcone:cat?cat.icone:'💰', categoriaCor: cat?cat.cor:'#2ecc71', contaId, contaNome: conta?conta.nome:'' };
    if (editId) { lista[lista.findIndex(x=>x.id===editId)]=obj; toast('Receita atualizada!'); }
    else { lista.push(obj); toast('Receita cadastrada!'); }
    setData('receitas', lista);
    fecharModal('modal-receita');
    renderizarReceitas();
}

function excluirReceita(id) {
    if (!confirm('Excluir esta receita?')) return;
    setData('receitas', getData('receitas').filter(x=>x.id!==id));
    toast('Receita excluída.','info');
    renderizarReceitas();
}

function renderizarReceitas() {
    const cats = getData('cat_receitas');
    const fCat = document.getElementById('filtro-receita-cat');
    const curCat = fCat ? fCat.value : '';
    if (fCat) {
        fCat.innerHTML = '<option value="">Todas as categorias</option>' + cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
        fCat.value = curCat;
    }

    const todasReceitas = getData('receitas');
    let lista = [...todasReceitas];

    if (_mesSel !== null) {
        const prefixo = String(_anoSel) + '-' + String(_mesSel + 1).padStart(2, '0');
        lista = lista.filter(x => x.data && x.data.startsWith(prefixo));
    } else {
        lista = lista.filter(x => x.data && x.data.startsWith(String(_anoSel)));
    }
    if (curCat) lista = lista.filter(x => x.categoriaId === curCat);

    const totalMes = lista.filter(x => x.status === 'recebido').reduce((s, x) => s + x.valor, 0);
    const receitaTotalEl = document.getElementById('receita-total');
    if (receitaTotalEl) receitaTotalEl.textContent = brl(totalMes);

    const el = document.getElementById('lista-receitas');
    if (!el) return;
    if (!lista.length) { el.innerHTML = '<div class="registros-empty"><i class="fas fa-hand-holding-usd"></i><p>Nenhuma receita encontrada.</p></div>'; return; }
    
    el.innerHTML = lista.sort((a,b)=>b.data.localeCompare(a.data)).map(r=>{
        const dataFmt = r.data ? new Date(r.data+'T00:00').toLocaleDateString('pt-BR') : '—';
        const sCls = r.status==='recebido'?'badge-pago':'badge-pendente';
        const sLabel = r.status==='recebido'?'Recebido':'Previsto';
        return `
    <div class="reg-item" style="border-left:4px solid ${r.categoriaCor||'#2ecc71'}">
        <div class="reg-icon" style="background:${r.categoriaCor||'#2ecc71'}20;color:${r.categoriaCor||'#2ecc71'}">${r.categoriaIcone||'💰'}</div>
        <div class="reg-info">
            <span class="reg-nome">${r.descricao}</span>
            <span class="reg-sub">${r.categoriaNome||'Sem categoria'} &nbsp;·&nbsp; ${dataFmt}${r.contaNome?' &nbsp;·&nbsp; '+r.contaNome:''}</span>
        </div>
        <div class="reg-meio">
            <span class="badge ${sCls}">${sLabel}</span>
            <span class="reg-tipo-tag">${r.tipo}</span>
        </div>
        <div class="reg-valor" style="color:#27ae60">${brl(r.valor)}</div>
        <div class="reg-actions">
            <button class="btn-icon btn-edit" onclick="abrirModalReceita('${r.id}')"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn-icon btn-del"  onclick="excluirReceita('${r.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`}).join('');
}

// ==========================================
// CARTÕES, CATEGORIAS E TIPOS
// ==========================================
function abrirModalCartao(id=null) {
    document.getElementById('modal-cartao-titulo').textContent = id?'Editar Cartão':'Novo Cartão';
    ['cartao-edit-id','cartao-nome','cartao-digitos','cartao-limite','cartao-vencimento'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('cartao-bandeira').value='Visa';
    _resetPicker('#modal-cartao','cartao-cor','#3498db');
    if (id) {
        const c = getData('cartoes').find(x=>x.id===id);
        if (c) {
            document.getElementById('cartao-edit-id').value   = c.id;
            document.getElementById('cartao-nome').value      = c.nome;
            document.getElementById('cartao-bandeira').value  = c.bandeira;
            document.getElementById('cartao-digitos').value   = c.digitos||'';
            document.getElementById('cartao-limite').value    = c.limite||'';
            document.getElementById('cartao-vencimento').value= c.vencimento||'';
            _resetPicker('#modal-cartao','cartao-cor', c.cor);
        }
    }
    document.getElementById('modal-cartao').classList.remove('hidden');
}

function salvarCartao() {
    const nome = document.getElementById('cartao-nome').value.trim();
    if (!nome) { toast('Informe o nome.','error'); return; }
    const cartoes = getData('cartoes');
    const editId  = document.getElementById('cartao-edit-id').value;
    const obj = { id: editId||uid(), nome, bandeira: document.getElementById('cartao-bandeira').value, digitos: document.getElementById('cartao-digitos').value.trim(), limite: parseFloat(document.getElementById('cartao-limite').value)||0, vencimento: parseInt(document.getElementById('cartao-vencimento').value)||null, cor: document.getElementById('cartao-cor').value };
    if (editId) { cartoes[cartoes.findIndex(x=>x.id===editId)]=obj; toast('Cartão atualizado!'); }
    else { cartoes.push(obj); toast('Cartão cadastrado!'); }
    setData('cartoes', cartoes);
    fecharModal('modal-cartao');
    renderizarCartoes();
}

function excluirCartao(id) {
    if (!confirm('Excluir este cartão?')) return;
    setData('cartoes', getData('cartoes').filter(x=>x.id!==id));
    toast('Cartão excluído.','info');
    renderizarCartoes();
}

function renderizarCartoes() {
    const lista   = document.getElementById('lista-cartoes');
    const cartoes = getData('cartoes');
    if (!cartoes.length) { lista.innerHTML='<p class="dados-empty">Nenhum cartão cadastrado.</p>'; return; }
    const bi = {Visa:'fab fa-cc-visa',Mastercard:'fab fa-cc-mastercard',Amex:'fab fa-cc-amex'};
    lista.innerHTML = cartoes.map(c=>`
    <div class="dados-item cartao-item" style="border-left:4px solid ${c.cor}">
        <div class="cartao-visual">
            <span style="color:${c.cor};font-size:13px;font-weight:600"><i class="${bi[c.bandeira]||'fas fa-credit-card'}"></i> ${c.bandeira}</span>
            <span style="font-size:11px;color:#95a5a6;font-family:monospace">${c.digitos?'•••• '+c.digitos:''}</span>
        </div>
        <div class="dados-item-info">
            <span class="dados-item-nome">${c.nome}</span>
            <span class="dados-item-sub">Limite: ${c.limite?brl(c.limite):'—'} &nbsp;|&nbsp; Venc: ${c.vencimento?'Dia '+c.vencimento:'—'}</span>
        </div>
        <div class="dados-item-actions">
            <button class="btn-icon btn-edit" onclick="abrirModalCartao('${c.id}')"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn-icon btn-del"  onclick="excluirCartao('${c.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

function abrirModalCategoria(tipo, id=null) {
    document.getElementById('modal-cat-titulo').textContent=(id?'Editar':'Nova')+' Categoria';
    ['cat-edit-id','cat-nome'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('cat-tipo').value=tipo;
    document.getElementById('cat-icone').value='🏠';
    document.querySelectorAll('.icon-opt').forEach((el,i)=>el.classList.toggle('selected',i===0));
    _resetPicker('#modal-categoria','cat-cor','#3498db');
    if (id) {
        const key = tipo==='despesa'?'cat_despesas':'cat_receitas';
        const c = getData(key).find(x=>x.id===id);
        if (c) {
            document.getElementById('cat-edit-id').value=c.id;
            document.getElementById('cat-nome').value=c.nome;
            document.getElementById('cat-icone').value=c.icone;
            document.querySelectorAll('.icon-opt').forEach(el=>el.classList.toggle('selected',el.dataset.icon===c.icone));
            _resetPicker('#modal-categoria','cat-cor', c.cor);
        }
    }
    document.getElementById('modal-categoria').classList.remove('hidden');
}

function salvarCategoria() {
    const nome = document.getElementById('cat-nome').value.trim();
    if (!nome) { toast('Informe o nome.','error'); return; }
    const tipo = document.getElementById('cat-tipo').value;
    const key  = tipo==='despesa'?'cat_despesas':'cat_receitas';
    const cats = getData(key);
    const editId = document.getElementById('cat-edit-id').value;
    const obj = { id:editId||uid(), nome, icone:document.getElementById('cat-icone').value, cor:document.getElementById('cat-cor').value };
    if (editId) { cats[cats.findIndex(x=>x.id===editId)]=obj; toast('Categoria atualizada!'); }
    else { cats.push(obj); toast('Categoria cadastrada!'); }
    setData(key, cats);
    fecharModal('modal-categoria');
    tipo==='despesa' ? renderizarCatDespesas() : renderizarCatReceitas();
}

function excluirCategoria(tipo, id) {
    if (!confirm('Excluir esta categoria?')) return;
    const key = tipo==='despesa'?'cat_despesas':'cat_receitas';
    setData(key, getData(key).filter(x=>x.id!==id));
    toast('Categoria excluída.','info');
    tipo==='despesa' ? renderizarCatDespesas() : renderizarCatReceitas();
}

function _renderCats(listaId, tipo) {
    const key  = tipo==='despesa'?'cat_despesas':'cat_receitas';
    const lista= document.getElementById(listaId);
    const cats = getData(key);
    if (!cats.length) { lista.innerHTML='<p class="dados-empty">Nenhuma categoria.</p>'; return; }
    lista.innerHTML = cats.map(c=>`
    <div class="dados-item" style="border-left:4px solid ${c.cor}">
        <span class="cat-icone-badge" style="background:${c.cor}20;color:${c.cor}">${c.icone}</span>
        <div class="dados-item-info"><span class="dados-item-nome">${c.nome}</span></div>
        <div class="dados-item-actions">
            <button class="btn-icon btn-edit" onclick="abrirModalCategoria('${tipo}','${c.id}')"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn-icon btn-del"  onclick="excluirCategoria('${tipo}','${c.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}
function renderizarCatDespesas() { _renderCats('lista-cat-despesas','despesa'); }
function renderizarCatReceitas() { _renderCats('lista-cat-receitas','receita'); }

function abrirModalTipo(id=null) {
    document.getElementById('modal-tipo-titulo').textContent = id ? 'Editar Tipo' : 'Novo Tipo de Despesa';
    document.getElementById('tipo-edit-id').value = '';
    document.getElementById('tipo-nome').value = '';
    document.getElementById('tipo-icone').value = '💳';
    document.querySelectorAll('#icon-picker-tipo .icon-opt').forEach((el,i)=>el.classList.toggle('selected',i===0));
    _resetPicker('#modal-tipo','tipo-cor','#f39c12');
    if (id) {
        const t = getData('tipos_despesa').find(x=>x.id===id);
        if (t) {
            document.getElementById('tipo-edit-id').value = t.id;
            document.getElementById('tipo-nome').value    = t.nome;
            document.getElementById('tipo-icone').value   = t.icone;
            document.querySelectorAll('#icon-picker-tipo .icon-opt').forEach(el=>el.classList.toggle('selected',el.dataset.icon===t.icone));
            _resetPicker('#modal-tipo','tipo-cor', t.cor);
        }
    }
    document.getElementById('modal-tipo').classList.remove('hidden');
}

function salvarTipo() {
    const nome = document.getElementById('tipo-nome').value.trim();
    if (!nome) { toast('Informe o nome.','error'); return; }
    const tipos  = getData('tipos_despesa');
    const editId = document.getElementById('tipo-edit-id').value;
    const obj = { id:editId||uid(), nome, icone:document.getElementById('tipo-icone').value, cor:document.getElementById('tipo-cor').value };
    if (editId) { tipos[tipos.findIndex(x=>x.id===editId)]=obj; toast('Tipo atualizado!'); }
    else { tipos.push(obj); toast('Tipo cadastrado!'); }
    setData('tipos_despesa', tipos);
    fecharModal('modal-tipo');
    renderizarTiposDespesa();
}

function excluirTipo(id) {
    if (!confirm('Excluir este tipo?')) return;
    setData('tipos_despesa', getData('tipos_despesa').filter(x=>x.id!==id));
    toast('Tipo excluído.','info');
    renderizarTiposDespesa();
}

function renderizarTiposDespesa() {
    const lista = document.getElementById('lista-tipos-despesa');
    const tipos = getData('tipos_despesa');
    if (!tipos.length) { lista.innerHTML='<p class="dados-empty">Nenhum tipo cadastrado.</p>'; return; }
    lista.innerHTML = tipos.map(t=>`
    <div class="dados-item" style="border-left:4px solid ${t.cor}">
        <span class="cat-icone-badge" style="background:${t.cor}20;color:${t.cor}">${t.icone}</span>
        <div class="dados-item-info"><span class="dados-item-nome">${t.nome}</span></div>
        <div class="dados-item-actions">
            <button class="btn-icon btn-edit" onclick="abrirModalTipo('${t.id}')"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn-icon btn-del"  onclick="excluirTipo('${t.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

function renderizarDados() {
    renderizarTiposDespesa();
    renderizarCartoes();
    renderizarCatDespesas();
    renderizarCatReceitas();
}

function renderizarConfiguracoes() {
    const sel = document.getElementById('config-ano-select');
    sel.innerHTML = '';
    const anoAtual = new Date().getFullYear();
    for (let a = anoAtual + 1; a >= anoAtual - 5; a--) {
        const opt = document.createElement('option');
        opt.value = a; opt.textContent = a;
        if (a === _anoSel) opt.selected = true;
        sel.appendChild(opt);
    }
}

function salvarAnoConfig(ano) {
    _anoSel = parseInt(ano);
    localStorage.setItem('cfg_ano', JSON.stringify(_anoSel));
    _atualizarHeaderMes();
    renderizarDespesas(); renderizarAPagar(); renderizarReceitas(); renderizarAnalise();
}

// ==========================================
// ANÁLISE / DASHBOARD
// ==========================================
let _pizzaChart = null;

function renderizarAnalise() {
    const despesas = getData('despesas_gastos');
    const apagar   = getData('a_pagar');
    const cartoes  = getData('cartoes');

    function filtrarPeriodo(lista, campoData) {
        if (_mesSel !== null) {
            const prefixo = String(_anoSel) + '-' + String(_mesSel + 1).padStart(2, '0');
            return lista.filter(x => x[campoData] && x[campoData].startsWith(prefixo));
        } else {
            return lista.filter(x => x[campoData] && x[campoData].startsWith(String(_anoSel)));
        }
    }

    const despPeriodo  = filtrarPeriodo(despesas, 'data');
    const apagarPeriodo = (() => {
        if (_mesSel !== null) {
            const prefixo = String(_anoSel) + '-' + String(_mesSel + 1).padStart(2, '0');
            return apagar.filter(x => {
                const s = calcularStatus(x.vencimento, x.pago||false);
                if (s !== 'pago') return x.vencimento && x.vencimento.startsWith(prefixo);
                return (x.dataPagamento || x.vencimento || '').startsWith(prefixo);
            });
        } else {
            const anoStr = String(_anoSel);
            return apagar.filter(x => {
                const s = calcularStatus(x.vencimento, x.pago||false);
                if (s !== 'pago') return x.vencimento && x.vencimento.startsWith(anoStr);
                return (x.dataPagamento || x.vencimento || '').startsWith(anoStr);
            });
        }
    })().map(r => { r.status = calcularStatus(r.vencimento, r.pago || false); return r; });

    const gastosCartao = despPeriodo.filter(x => x.tipoPagamentoVal && x.tipoPagamentoVal.startsWith('cartao_'));
    document.getElementById('kpi-cartoes').textContent = brl(gastosCartao.reduce((s, x) => s + x.valor, 0));

    const totalDespesas = despPeriodo.reduce((s, x) => s + x.valor, 0);
    document.getElementById('kpi-total-despesas').textContent = brl(totalDespesas);

    const contasPagas = apagarPeriodo.filter(x => x.status === 'pago');
    document.getElementById('kpi-pagas').textContent = brl(contasPagas.reduce((s, x) => s + x.valor, 0));

    const pendentesValor = apagarPeriodo.filter(x => x.status !== 'pago').reduce((s, x) => s + x.valor, 0);
    document.getElementById('kpi-previsao').textContent = brl(totalDespesas + pendentesValor);

    // Gráfico Pizza
    const porCategoria = {};
    despPeriodo.forEach(d => {
        const nome = d.categoriaNome || 'Sem categoria';
        if (!porCategoria[nome]) porCategoria[nome] = { valor: 0, cor: d.categoriaCor||'#95a5a6' };
        porCategoria[nome].valor += d.valor;
    });

    const catLabels = Object.keys(porCategoria);
    const catValues = catLabels.map(k => porCategoria[k].valor);
    const catColors = catLabels.map(k => porCategoria[k].cor);

    const pizzaContainer = document.getElementById('pizza-container');
    const pizzaEmpty     = document.getElementById('pizza-empty');

    if (catLabels.length === 0) {
        if(pizzaContainer) pizzaContainer.classList.add('hidden');
        if(pizzaEmpty) pizzaEmpty.classList.remove('hidden');
    } else {
        if(pizzaContainer) pizzaContainer.classList.remove('hidden');
        if(pizzaEmpty) pizzaEmpty.classList.add('hidden');

        if (_pizzaChart) { _pizzaChart.destroy(); }
        const ctx = document.getElementById('chart-pizza');
        if (ctx) {
            _pizzaChart = new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: { labels: catLabels, datasets: [{ data: catValues, backgroundColor: catColors, borderWidth: 2, borderColor: '#fff' }] },
                options: { responsive: false, cutout: '60%', plugins: { legend: { display: false } } }
            });
        }
    }
}

// ==========================================
// FIREBASE / SYNC MODULE E AUTENTICAÇÃO REAL
// ==========================================
const SYNC_KEYS = ['despesas_gastos', 'a_pagar', 'receitas', 'cartoes', 'cat_despesas', 'cat_receitas', 'tipos_despesa', 'metas'];

let _db          = null;   
let _userId      = null;   // ID oficial gerado pelo login do Google Firebase
let _isOnline    = navigator.onLine;
let _statusBarEl = null;   

function _criarStatusBar() {
    if (document.getElementById('sync-status-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'sync-status-bar';
    bar.style.cssText = `position:fixed; bottom:0; left:0; right:0; z-index:9999; padding:6px 16px; font-size:12px; font-weight:600; display:flex; align-items:center; gap:8px; transition: all 0.4s ease; transform:translateY(100%);`;
    document.body.appendChild(bar);
    _statusBarEl = bar;
}

function _mostrarStatus(msg, tipo='info', duracao=3500) {
    if (!_statusBarEl) _criarStatusBar();
    const cores = { info:{bg:'#2980b9',fg:'#fff'}, success:{bg:'#27ae60',fg:'#fff'}, warning:{bg:'#f39c12',fg:'#fff'}, error:{bg:'#c0392b',fg:'#fff'}, offline:{bg:'#7f8c8d',fg:'#fff'}, sync:{bg:'#8e44ad',fg:'#fff'} };
    const c = cores[tipo] || cores.info;
    _statusBarEl.style.background = c.bg; _statusBarEl.style.color = c.fg;
    _statusBarEl.innerHTML = `<span>${msg}</span>`;
    _statusBarEl.style.transform = 'translateY(0)';
    if (duracao > 0) setTimeout(() => { _statusBarEl.style.transform = 'translateY(100%)'; }, duracao);
}

function _getPendingQueue() { try { return JSON.parse(localStorage.getItem('_sync_queue') || '[]'); } catch { return []; } }
function _setPendingQueue(q) { localStorage.setItem('_sync_queue', JSON.stringify(q)); }
function _addToPendingQueue(colecao, dados) {
    const q = _getPendingQueue().filter(x => x.colecao !== colecao);
    q.push({ colecao, dados, ts: Date.now() });
    _setPendingQueue(q);
    _atualizarIndicadorSync();
}

function _atualizarIndicadorSync() {
    const q = _getPendingQueue();
    const badge = document.getElementById('sync-badge');
    if (!badge) return;
    badge.style.display = (q.length > 0 && !_isOnline) ? 'inline-block' : 'none';
}

function setData(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    if (SYNC_KEYS.includes(key)) {
        if (_db && _userId && _isOnline) _syncCollection(key, val);
        else _addToPendingQueue(key, val);
    }
}

async function _syncCollection(key, dados) {
    if (!_db || !_userId) return;
    try {
        const { doc, setDoc } = window._firestoreApi;
        // SALVA DADOS ASSOCIADOS AO USUÁRIO LOGADO
        await setDoc(doc(_db, 'usuarios', _userId, 'dados', key), { payload: JSON.stringify(dados), updatedAt: Date.now() });
        _setPendingQueue(_getPendingQueue().filter(x => x.colecao !== key));
        _atualizarIndicadorSync();
    } catch (e) {
        console.warn('Sync falhou para', key, e.message);
        _addToPendingQueue(key, dados);
    }
}

async function _baixarDadosFirebase() {
    if (!_db || !_userId) return;
    try {
        const { collection, getDocs } = window._firestoreApi;
        // LÊ DADOS ASSOCIADOS AO USUÁRIO LOGADO
        const snap = await getDocs(collection(_db, 'usuarios', _userId, 'dados'));
        let baixou = false;
        snap.forEach(docSnap => {
            const key = docSnap.id;
            const data = docSnap.data();
            if (data.payload) {
                const dadosServidor = JSON.parse(data.payload);
                const local = (() => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } })();
                if (Array.isArray(dadosServidor) && dadosServidor.length >= local.length) {
                    localStorage.setItem(key, data.payload);
                    baixou = true;
                }
            }
        });
        if (baixou) {
            renderizarDespesas(); renderizarAPagar(); renderizarReceitas(); renderizarAnalise(); renderizarDados();
            _mostrarStatus('Dados sincronizados da nuvem ✓', 'success', 3000);
        }
    } catch (e) {
        console.warn('Erro ao baixar dados Firebase:', e.message);
    }
}

async function _processarFilaPendente() {
    const q = _getPendingQueue();
    if (!q.length) return;
    _mostrarStatus(`Sincronizando ${q.length} item(ns)...`, 'sync', 0);
    for (const item of q) {
        try { await _syncCollection(item.colecao, item.dados); } catch(e) {}
    }
    _atualizarIndicadorSync();
    _mostrarStatus('Sincronização concluída!', 'success', 3000);
}

async function initFirebaseSync() {
    _criarStatusBar();

    // Se Firebase desabilitado, bloqueia o acesso ao sistema (não há login alternativo)
    if (!window.FIREBASE_ENABLED) {
        const statusEl = document.getElementById('firebase-init-status');
        if (statusEl) statusEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#e67e22"></i> Firebase desabilitado. Edite firebase-config.js.';
        return;
    }

    try {
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.type = 'module';
            s.textContent = `
                import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
                import { getFirestore, doc, setDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
                // Ferramentas de Auth real
                import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

                window._firebaseAPI = { initializeApp, getFirestore, doc, setDoc, collection, getDocs, getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
                window.dispatchEvent(new Event('firebaseLoaded'));
            `;
            document.head.appendChild(s);
            window.addEventListener('firebaseLoaded', resolve, { once: true });
            setTimeout(() => reject(new Error('Firebase timeout')), 10000);
        });

        const { initializeApp, getFirestore, doc, setDoc, collection, getDocs, getAuth, onAuthStateChanged } = window._firebaseAPI;
        window._firestoreApi = { doc, setDoc, collection, getDocs };

        const app  = initializeApp(window.FIREBASE_CONFIG);
        _db        = getFirestore(app);
        const auth = getAuth(app);
        window._firebaseAuth = auth;

        // Firebase pronto: atualiza indicador de loading na tela de login
        const statusEl = document.getElementById('firebase-init-status');
        if (statusEl) statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#27ae60"></i> Pronto. Faça o login.';

        // Restaura botão de login se foi desabilitado
        const btnLogin = document.getElementById('btn-login');
        if (btnLogin) { btnLogin.disabled = false; btnLogin.textContent = 'Entrar no Sistema'; }

        // Observador Mágico: verifica o estado do login
        onAuthStateChanged(auth, async (user) => {
            const btnL = document.getElementById('btn-login');
            if (user) {
                // Usuário logado corretamente!
                _userId = user.uid;
                localStorage.setItem('_firebase_uid', _userId);
                _mostrarStatus('Conectado: ' + user.email, 'success', 3000);

                // Mostra o dashboard e esconde o login
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('app-screen').classList.remove('hidden');

                const hoje = new Date();
                _mesSel = hoje.getMonth(); _anoSel = hoje.getFullYear();
                _atualizarHeaderMes(); _atualizarDataHoje();

                // Baixa dados da nuvem
                await _baixarDadosFirebase();
                await _processarFilaPendente();
                renderizarAnalise();
            } else {
                // Usuário deslogado! Força a tela de login
                _userId = null;
                document.getElementById('app-screen').classList.add('hidden');
                document.getElementById('login-screen').classList.remove('hidden');
                if (btnL) { btnL.disabled = false; btnL.textContent = 'Entrar no Sistema'; }
            }
        });

        window.addEventListener('online', async () => {
            _isOnline = true;
            if (_db && _userId) {
                await _processarFilaPendente();
                await _baixarDadosFirebase();
            }
        });

    } catch (e) {
        console.error('Erro Firebase:', e.message);
        const statusEl = document.getElementById('firebase-init-status');
        if (statusEl) statusEl.innerHTML = '<i class="fas fa-times-circle" style="color:#c0392b"></i> Falha ao conectar ao Firebase. Verifique sua conexão.';
    }
}

// =========================================
// NOTIFICAÇÕES NATIVAS
// =========================================
function obterNotificacoes() {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
    const todas = getData('a_pagar', []);
    const notifs = [];

    todas.forEach(r => {
        if (r.pago) return;
        const venc = new Date(r.vencimento + 'T00:00');
        if (isNaN(venc)) return;
        if (venc < hoje) notifs.push({ id: r.id, tipo: 'vencido', titulo: r.descricao });
        else if (venc.getTime() === hoje.getTime()) notifs.push({ id: r.id, tipo: 'hoje', titulo: r.descricao });
        else if (venc.getTime() === amanha.getTime()) notifs.push({ id: r.id, tipo: 'amanha', titulo: r.descricao });
    });
    return notifs;
}

function atualizarIconeNotificacao() {
    const notifs = obterNotificacoes();
    const badge  = document.getElementById('notif-badge');
    if (!badge) return;
    if (notifs.length > 0) { badge.textContent = notifs.length; badge.classList.remove('hidden'); }
    else { badge.classList.add('hidden'); }
}

async function dispararNotificacoesPush() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== 'granted') return;
    const notifs = obterNotificacoes();
    if (notifs.length > 0) {
        new Notification('Finanças LHSC', { body: `Você tem ${notifs.length} conta(s) pendente(s).`, icon: 'icon-192.png' });
    }
}

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================
(function initApp() {
    const hoje = new Date();
    _mesSel = hoje.getMonth(); _anoSel = hoje.getFullYear();
    localStorage.setItem('cfg_mes', JSON.stringify(_mesSel));
    localStorage.setItem('cfg_ano', JSON.stringify(_anoSel));
    _atualizarHeaderMes(); _atualizarDataHoje();
    initFirebaseSync();
})();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', ()=>{
        navigator.serviceWorker.register('sw.js').then(r=>console.log('SW ativo')).catch(e=>console.log('SW erro',e));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        atualizarIconeNotificacao();
        dispararNotificacoesPush();
    }, 1000);
});