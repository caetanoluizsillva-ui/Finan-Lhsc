// ==========================================
// LOGIN / LOGOUT / NAVEGAÇÃO
// ==========================================
function fazerLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const err  = document.getElementById('login-error');
    if (user === 'lhsc' && pass === '123') {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        err.innerText = '';
        // Garante que o mês/ano estão no estado correto (mês atual) ao entrar
        const hoje = new Date();
        _mesSel = hoje.getMonth();
        _anoSel = hoje.getFullYear();
        _atualizarHeaderMes();
        _atualizarDataHoje();
        // Renderiza o dashboard inicial
        renderizarAnalise();
    } else {
        err.innerText = 'Usuário ou senha incorretos.';
    }
}
document.getElementById('password').addEventListener('keypress', e => { if (e.key==='Enter') fazerLogin(); });

function fazerLogout() {
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
// STORAGE
// ==========================================
function getData(key, def=[]) {
    try { const v=localStorage.getItem(key); return v?JSON.parse(v):def; } catch { return def; }
}
// setData: salva local + sincroniza com Firebase quando disponível
// (definição completa no módulo Firebase mais abaixo)
function uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function brl(n) { return 'R$ '+(+n||0).toLocaleString('pt-BR',{minimumFractionDigits:2}); }

// ==========================================
// MÊS / ANO GLOBAL
// ==========================================
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let _mesSel = null; // null = Todos; número 0-11 = mês específico
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
        // Partindo de "Todos": usa o mês atual como base antes de navegar
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
    renderizarDespesas();
    renderizarAPagar();
    renderizarReceitas();
    renderizarAnalise();
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
    renderizarDespesas();
    renderizarAPagar();
    renderizarReceitas();
    renderizarAnalise();
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
// CONFIGURAÇÕES
// ==========================================
function renderizarConfiguracoes() {
    const sel = document.getElementById('config-ano-select');
    sel.innerHTML = '';
    const anoAtual = new Date().getFullYear();
    for (let a = anoAtual + 1; a >= anoAtual - 5; a--) {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        if (a === _anoSel) opt.selected = true;
        sel.appendChild(opt);
    }
}

function salvarAnoConfig(ano) {
    _anoSel = parseInt(ano);
    localStorage.setItem('cfg_ano', JSON.stringify(_anoSel));
    _atualizarHeaderMes();
    renderizarDespesas();
    renderizarAPagar();
    renderizarReceitas();
    renderizarAnalise();
}

// ==========================================
// TOAST
// ==========================================
function toast(msg, tipo='success') {
    const t=document.getElementById('toast');
    t.textContent=msg; t.className=`toast toast-${tipo}`;
    t.classList.remove('hidden');
    setTimeout(()=>t.classList.add('hidden'),2800);
}

// ==========================================
// MODAL
// ==========================================
function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if(e.target===el) el.classList.add('hidden'); });
});

// ==========================================
// PICKERS genéricos
// ==========================================
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
    document.getElementById('despesa-categoria').innerHTML =
        '<option value="">Sem categoria</option>' + cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
    const optsCartoes = cartoes.map(c=>`<option value="cartao_${c.id}">💳 ${c.nome}</option>`).join('');
    const optsTipos   = tipos.map(t=>`<option value="tipo_${t.id}">${t.icone} ${t.nome}</option>`).join('');
    document.getElementById('despesa-tipo-pagamento').innerHTML =
        '<option value="">Selecione...</option>' + optsCartoes + optsTipos;
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
            document.getElementById('despesa-edit-id').value         = r.id;
            document.getElementById('despesa-descricao').value       = r.descricao;
            document.getElementById('despesa-valor').value           = r.valor;
            document.getElementById('despesa-data').value            = r.data;
            document.getElementById('despesa-categoria').value       = r.categoriaId||'';
            document.getElementById('despesa-tipo-pagamento').value  = r.tipoPagamentoVal||'';
            document.getElementById('despesa-local').value           = r.local||'';
            document.getElementById('despesa-obs').value             = r.obs||'';
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
        valor,
        data,
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
    renderizarDespesas();
    renderizarAnalise();
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
    fCat.innerHTML = '<option value="">Todas as categorias</option>' +
        cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
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
        <div class="reg-icon" style="background:${r.categoriaCor||'#e74c3c'}20;color:${r.categoriaCor||'#e74c3c'}">
            ${r.categoriaIcone||'💸'}
        </div>
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
// CONTAS A PAGAR COM DIVISÃO DE PARCELAS INTELIGENTE
// ==========================================
function _populateSelectAPagar() {
    const cats    = getData('cat_despesas');
    const cartoes = getData('cartoes');
    const tipos   = getData('tipos_despesa');
    const sCat    = document.getElementById('apagar-categoria');
    const sTipo   = document.getElementById('apagar-tipo-pagamento');
    sCat.innerHTML = '<option value="">Sem categoria</option>' + cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
    const optsCartoes = cartoes.map(c=>`<option value="cartao_${c.id}">💳 ${c.nome}</option>`).join('');
    const optsTipos   = tipos.map(t=>`<option value="tipo_${t.id}">${t.icone} ${t.nome}</option>`).join('');
    sTipo.innerHTML = '<option value="">Selecione...</option>' + optsCartoes + optsTipos;
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
            document.getElementById('apagar-edit-id').value    = r.id;
            document.getElementById('apagar-descricao').value  = r.descricao;
            document.getElementById('apagar-valor').value      = r.valor;
            document.getElementById('apagar-vencimento').value = r.vencimento;
            document.getElementById('apagar-tipo').value       = r.tipo;
            document.getElementById('apagar-parcelas').value   = r.parcelas||1;
            document.getElementById('apagar-pago').checked     = r.pago||false;
            document.getElementById('apagar-obs').value        = r.obs||'';
            document.getElementById('apagar-categoria').value  = r.categoriaId||'';
            document.getElementById('apagar-tipo-pagamento').value = r.tipoPagamentoVal||'';
        }
    }
    _toggleParcelas();
    document.getElementById('modal-a-pagar').classList.remove('hidden');
}

function _toggleParcelas() {
    const tipo = document.getElementById('apagar-tipo').value;
    const row  = document.getElementById('row-parcelas');
    if (row) row.style.display = tipo === 'Parcelado' ? '' : 'none';
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
    } else if (tpVal.startsWith('tipo_')) {
        const tipo = getData('tipos_despesa').find(x=>x.id===tpVal.replace('tipo_',''));
        tipoPagamentoNome = tipo ? tipo.icone+' '+tipo.nome : '';
    }

    const lista  = getData('a_pagar');
    const editId = document.getElementById('apagar-edit-id').value;

    // Função interna inteligente para calcular datas futuras sem bugar meses com 28 ou 30 dias
    const somarMesesFuturos = (dataReferencia, mesesASomar) => {
        let [ano, mes, dia] = dataReferencia.split('-');
        let dataObj = new Date(ano, parseInt(mes) - 1 + mesesASomar, 1); 
        let ultimoDiaDoMesDestino = new Date(dataObj.getFullYear(), dataObj.getMonth() + 1, 0).getDate();
        let diaSeguro = Math.min(parseInt(dia), ultimoDiaDoMesDestino);
        dataObj.setDate(diaSeguro);
        
        let aFinal = dataObj.getFullYear();
        let mFinal = String(dataObj.getMonth() + 1).padStart(2, '0');
        let dFinal = String(dataObj.getDate()).padStart(2, '0');
        
        return `${aFinal}-${mFinal}-${dFinal}`;
    };

    if (editId) {
        // Se está a editar um registo existente (salva normalmente e não re-divide)
        const obj = {
            id:            editId,
            descricao:     desc,
            valor,
            vencimento:    venc,
            tipo:          tipoSelecionado,
            parcelas,
            pago,
            status:        calcularStatus(venc, pago),
            obs:           document.getElementById('apagar-obs').value.trim(),
            categoriaId:   catId,
            categoriaNome: cat?cat.nome:'',
            categoriaIcone:cat?cat.icone:'🏷️',
            categoriaCor:  cat?cat.cor:'#95a5a6',
            tipoPagamentoVal: tpVal,
            tipoPagamentoNome
        };
        lista[lista.findIndex(x=>x.id===editId)] = obj; 
        toast('Despesa atualizada!');
        
    } else {
        // Lógica de Novo Registo
        if (tipoSelecionado === 'Parcelado' && parcelas > 1) {
            // Divide o valor pelo número de parcelas
            let valorDaParcela = parseFloat((valor / parcelas).toFixed(2));
            // Calcula possíveis diferenças de centavos devido ao arredondamento
            let diferencaCentavos = valor - (valorDaParcela * parcelas);

            // Cria um registo individual para cada mês
            for (let i = 0; i < parcelas; i++) {
                const dataDaParcela = somarMesesFuturos(venc, i);
                const ehPrimeiraParcela = (i === 0);
                const statusPago = ehPrimeiraParcela ? pago : false;
                
                // Joga a diferença dos centavos sempre na primeira parcela
                let valorDesteMes = valorDaParcela;
                if (ehPrimeiraParcela) {
                    valorDesteMes += diferencaCentavos;
                }
                
                const objParcela = {
                    id:            uid(),
                    descricao:     `${desc} (${i + 1}/${parcelas})`, // Ex: TV Nova (1/4)
                    valor:         parseFloat(valorDesteMes.toFixed(2)),
                    vencimento:    dataDaParcela,
                    tipo:          'Parcelado',
                    parcelas:      parcelas, // Mantém o número original para exibir o ícone 📦
                    pago:          statusPago,
                    status:        calcularStatus(dataDaParcela, statusPago),
                    obs:           document.getElementById('apagar-obs').value.trim(),
                    categoriaId:   catId,
                    categoriaNome: cat?cat.nome:'',
                    categoriaIcone:cat?cat.icone:'🏷️',
                    categoriaCor:  cat?cat.cor:'#95a5a6',
                    tipoPagamentoVal: tpVal,
                    tipoPagamentoNome
                };
                lista.push(objParcela);
            }
            toast(`${parcelas} parcelas de contas registadas!`);
            
        } else {
            // Conta única normal ou Fixa
            const obj = {
                id:            uid(),
                descricao:     desc,
                valor,
                vencimento:    venc,
                tipo:          tipoSelecionado,
                parcelas,
                pago,
                status:        calcularStatus(venc, pago),
                obs:           document.getElementById('apagar-obs').value.trim(),
                categoriaId:   catId,
                categoriaNome: cat?cat.nome:'',
                categoriaIcone:cat?cat.icone:'🏷️',
                categoriaCor:  cat?cat.cor:'#95a5a6',
                tipoPagamentoVal: tpVal,
                tipoPagamentoNome
            };
            lista.push(obj);
            toast('Despesa cadastrada!');
        }
    }
    
    setData('a_pagar', lista);
    fecharModal('modal-a-pagar');
    renderizarAPagar();
    renderizarAnalise();
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
        // Registra a data de pagamento no mês atualmente selecionado
        // Se há mês selecionado, usa o 1º dia desse mês como referência de contabilização
        // Se não há filtro de mês, usa a data de hoje
        if (_mesSel !== null) {
            const ano = _anoSel;
            const mes = String(_mesSel + 1).padStart(2, '0');
            lista[idx].dataPagamento = `${ano}-${mes}-01`;
        } else {
            lista[idx].dataPagamento = new Date().toISOString().slice(0, 10);
        }
    } else {
        // Ao desmarcar como pago, remove a data de pagamento
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
    const todosAPagar = getData('a_pagar').map(r => {
        r.status = calcularStatus(r.vencimento, r.pago||false);
        return r;
    });
    setData('a_pagar', todosAPagar);

    const cats = getData('cat_despesas');
    const fCat = document.getElementById('filtro-apagar-cat');
    const curCat = fCat ? fCat.value : '';
    if (fCat) {
        fCat.innerHTML = '<option value="">Todas as categorias</option>' +
            cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
        fCat.value = curCat;
    }

    // Lógica de exibição:
    // - VENCIDAS não pagas  → aparecem SEMPRE (independente do mês selecionado)
    // - PENDENTES           → aparecem apenas no mês atual ou no mês selecionado
    //                         (meses futuros só aparecem quando aquele mês for selecionado)
    // - PAGAS               → aparecem apenas no mês em que foram pagas (ou vencimento)
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    let lista;
    if (_mesSel !== null) {
        // Mês específico selecionado
        const anoStr = String(_anoSel);
        const mesStr = String(_mesSel + 1).padStart(2, '0');
        const prefixo = anoStr + '-' + mesStr;
        lista = todosAPagar.filter(x => {
            if (x.status === 'pago') {
                // Pagas: exibe pelo mês de pagamento ou vencimento
                const refData = x.dataPagamento || x.vencimento || '';
                return refData.startsWith(prefixo);
            }
            if (x.status === 'vencido') {
                // Vencidas não pagas: sempre exibe
                return true;
            }
            // Pendentes: exibe apenas se o vencimento é do mês selecionado
            return (x.vencimento || '').startsWith(prefixo);
        });
    } else {
        // "Todos" selecionado: mostra vencidas + pendentes até o mês atual + pagas do ano
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth(); // 0-11
        const anoStr   = String(_anoSel);
        lista = todosAPagar.filter(x => {
            if (x.status === 'pago') {
                const refData = x.dataPagamento || x.vencimento || '';
                return refData.startsWith(anoStr);
            }
            if (x.status === 'vencido') {
                return true;
            }
            // Pendentes: exibe apenas até o mês atual (não mostra meses futuros no "Todos")
            if (!x.vencimento) return true;
            const [aV, mV] = x.vencimento.split('-').map(Number);
            return (aV < anoAtual) || (aV === anoAtual && (mV - 1) <= mesAtual);
        });
    }

    const fStatus = document.getElementById('filtro-apagar-status');
    const curStatus = fStatus ? fStatus.value : '';
    if (curStatus) lista = lista.filter(x => x.status === curStatus);
    if (curCat)  lista = lista.filter(x => x.categoriaId === curCat);

    // Total: soma apenas pendentes/vencidas (o que ainda falta pagar)
    const total = lista.filter(x => x.status !== 'pago').reduce((s, x) => s + x.valor, 0);
    const apagarTotalEl = document.getElementById('apagar-total');
    if (apagarTotalEl) apagarTotalEl.textContent = brl(total);

    const el = document.getElementById('lista-a-pagar');
    if (!el) return;
    
    if (!lista.length) {
        el.innerHTML = '<div class="registros-empty"><i class="fas fa-file-invoice-dollar"></i><p>Nenhuma despesa encontrada para o período.</p></div>';
        return;
    }
    
    const statusCfg = {
        pendente: {label:'Pendente', cls:'badge-pendente'},
        pago:     {label:'Pago',     cls:'badge-pago'},
        vencido:  {label:'Vencido',  cls:'badge-vencido'}
    };
    
    el.innerHTML = lista.sort((a,b) => {
        // Vencidas primeiro, depois pendentes, depois pagas
        const ordemStatus = { vencido: 0, pendente: 1, pago: 2 };
        const oa = ordemStatus[a.status] ?? 1;
        const ob = ordemStatus[b.status] ?? 1;
        if (oa !== ob) return oa - ob;
        return a.vencimento.localeCompare(b.vencimento);
    }).map(r=>{
        const s = statusCfg[r.status]||statusCfg.pendente;
        const dataFmt = r.vencimento ? new Date(r.vencimento+'T00:00').toLocaleDateString('pt-BR') : '—';
        const parcelaTag = r.tipo==='Parcelado'&&r.parcelas>1 ? `<span class="reg-tipo-tag">📦 ${r.parcelas}x</span>` : '';
        const btnPago = r.pago
            ? `<button class="btn-pago-toggle btn-pago-sim" onclick="marcarPago('${r.id}',false)" title="Clique para reverter"><i class="fas fa-check-circle"></i> Pago</button>`
            : `<button class="btn-pago-toggle btn-pago-nao" onclick="marcarPago('${r.id}',true)" title="Marcar como pago"><i class="far fa-circle"></i> Pagar</button>`;
        return `
    <div class="reg-item${r.status==='pago'?' reg-pago':''}" data-id="${r.id}" style="border-left:4px solid ${r.categoriaCor||'#95a5a6'}">
        <div class="reg-icon" style="background:${r.categoriaCor||'#95a5a6'}20;color:${r.categoriaCor||'#95a5a6'}">
            ${r.categoriaIcone||'🏷️'}
        </div>
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
    document.getElementById('receita-categoria').innerHTML =
        '<option value="">Sem categoria</option>' + cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
    document.getElementById('receita-conta').innerHTML =
        '<option value="">Nenhuma</option>' + contas.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
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

    const obj = {
        id:            editId||uid(),
        descricao:     desc,
        valor,
        data,
        tipo:          document.getElementById('receita-tipo').value,
        status:        document.getElementById('receita-status').value,
        obs:           document.getElementById('receita-obs').value.trim(),
        categoriaId:   catId,
        categoriaNome: cat?cat.nome:'',
        categoriaIcone:cat?cat.icone:'💰',
        categoriaCor:  cat?cat.cor:'#2ecc71',
        contaId,
        contaNome: conta?conta.nome:''
    };
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
        fCat.innerHTML = '<option value="">Todas as categorias</option>' +
            cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
        fCat.value = curCat;
    }

    const todasReceitas = getData('receitas');
    let lista = [...todasReceitas];

    if (_mesSel !== null) {
        const anoStr = String(_anoSel);
        const mesStr = String(_mesSel + 1).padStart(2, '0');
        lista = lista.filter(x => x.data && x.data.startsWith(anoStr + '-' + mesStr));
    } else {
        lista = lista.filter(x => x.data && x.data.startsWith(String(_anoSel)));
    }

    if (curCat) lista = lista.filter(x => x.categoriaId === curCat);

    const fMesOld = document.getElementById('filtro-receita-mes');
    if (fMesOld) fMesOld.style.display = 'none';

    const totalMes = lista
        .filter(x => x.status === 'recebido')
        .reduce((s, x) => s + x.valor, 0);
    const receitaTotalEl = document.getElementById('receita-total');
    if (receitaTotalEl) receitaTotalEl.textContent = brl(totalMes);

    const el = document.getElementById('lista-receitas');
    if (!el) return;
    
    if (!lista.length) {
        el.innerHTML = '<div class="registros-empty"><i class="fas fa-hand-holding-usd"></i><p>Nenhuma receita encontrada para este mês.</p></div>';
        return;
    }
    
    el.innerHTML = lista.sort((a,b)=>b.data.localeCompare(a.data)).map(r=>{
        const dataFmt = r.data ? new Date(r.data+'T00:00').toLocaleDateString('pt-BR') : '—';
        const sCls = r.status==='recebido'?'badge-pago':'badge-pendente';
        const sLabel = r.status==='recebido'?'Recebido':'Previsto';
        return `
    <div class="reg-item" style="border-left:4px solid ${r.categoriaCor||'#2ecc71'}">
        <div class="reg-icon" style="background:${r.categoriaCor||'#2ecc71'}20;color:${r.categoriaCor||'#2ecc71'}">
            ${r.categoriaIcone||'💰'}
        </div>
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
// CARTÕES DE CRÉDITO E RESTANTE (INALTERADO)
// ==========================================
function abrirModalCartao(id=null) {
    document.getElementById('modal-cartao-titulo').textContent = id?'Editar Cartão':'Novo Cartão de Crédito';
    ['cartao-edit-id','cartao-nome','cartao-digitos'].forEach(i=>document.getElementById(i).value='');
    ['cartao-limite','cartao-vencimento'].forEach(i=>document.getElementById(i).value='');
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
    if (!nome) { toast('Informe o nome do cartão.','error'); return; }
    const cartoes = getData('cartoes');
    const editId  = document.getElementById('cartao-edit-id').value;
    const obj = {
        id:         editId||uid(),
        nome,
        bandeira:   document.getElementById('cartao-bandeira').value,
        digitos:    document.getElementById('cartao-digitos').value.trim(),
        limite:     parseFloat(document.getElementById('cartao-limite').value)||0,
        vencimento: parseInt(document.getElementById('cartao-vencimento').value)||null,
        cor:        document.getElementById('cartao-cor').value
    };
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
    if (!cartoes.length) { lista.innerHTML='<p class="dados-empty">Nenhum cartão cadastrado ainda.</p>'; return; }
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
    const labels={despesa:'Despesa / Contas a Pagar',receita:'Receita'};
    document.getElementById('modal-cat-titulo').textContent=(id?'Editar':'Nova')+' Categoria de '+(labels[tipo]||tipo);
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
    if (!cats.length) { lista.innerHTML='<p class="dados-empty">Nenhuma categoria cadastrada ainda.</p>'; return; }
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

function abrirModalMeta(id=null) {
    document.getElementById('modal-meta-titulo').textContent = id?'Editar Meta':'Nova Meta';
    ['meta-edit-id','meta-obs'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('meta-valor').value='';
    const cats = getData('cat_despesas');
    document.getElementById('meta-categoria').innerHTML =
        '<option value="">Selecione uma categoria de despesa...</option>' +
        cats.map(c=>`<option value="${c.id}">${c.icone} ${c.nome}</option>`).join('');
    if (id) {
        const m = getData('metas').find(x=>x.id===id);
        if (m) {
            document.getElementById('meta-edit-id').value   = m.id;
            document.getElementById('meta-categoria').value = m.categoriaId;
            document.getElementById('meta-valor').value     = m.valor;
            document.getElementById('meta-obs').value       = m.obs||'';
        }
    }
    document.getElementById('modal-meta').classList.remove('hidden');
}

function salvarMeta() {
    const catId = document.getElementById('meta-categoria').value;
    const valor = parseFloat(document.getElementById('meta-valor').value);
    if (!catId) { toast('Selecione uma categoria.','error'); return; }
    if (!valor||valor<=0) { toast('Informe um valor válido.','error'); return; }
    const cat    = getData('cat_despesas').find(x=>x.id===catId);
    const metas  = getData('metas');
    const editId = document.getElementById('meta-edit-id').value;
    if (!editId && metas.find(m=>m.categoriaId===catId)) {
        toast('Já existe uma meta para esta categoria.','error'); return;
    }
    const obj = {
        id:editId||uid(), categoriaId:catId,
        categoriaNome:cat?cat.nome:catId, categoriaIcone:cat?cat.icone:'🏷️',
        categoriaCor:cat?cat.cor:'#7f8c8d', valor,
        obs:document.getElementById('meta-obs').value.trim()
    };
    if (editId) { metas[metas.findIndex(x=>x.id===editId)]=obj; toast('Meta atualizada!'); }
    else { metas.push(obj); toast('Meta cadastrada!'); }
    setData('metas', metas);
    fecharModal('modal-meta');
    renderizarMetas();
}

function excluirMeta(id) {
    if (!confirm('Excluir esta meta?')) return;
    setData('metas', getData('metas').filter(x=>x.id!==id));
    toast('Meta excluída.','info');
    renderizarMetas();
}

function renderizarMetas() {
    const lista = document.getElementById('lista-metas');
    const metas = getData('metas');
    const total = metas.reduce((s,m)=>s+m.valor,0);
    document.getElementById('metas-total-valor').textContent = brl(total);
    if (!metas.length) { lista.innerHTML='<p class="dados-empty">Nenhuma meta cadastrada ainda.</p>'; return; }
    lista.innerHTML = metas.map(m=>`
    <div class="dados-item" style="border-left:4px solid ${m.categoriaCor}">
        <span class="cat-icone-badge" style="background:${m.categoriaCor}20;color:${m.categoriaCor}">${m.categoriaIcone}</span>
        <div class="dados-item-info">
            <span class="dados-item-nome">${m.categoriaNome}</span>
            <span class="dados-item-sub">Limite: <strong>${brl(m.valor)}</strong>${m.obs?' &nbsp;·&nbsp; '+m.obs:''}</span>
        </div>
        <div class="dados-item-actions">
            <button class="btn-icon btn-edit" onclick="abrirModalMeta('${m.id}')"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn-icon btn-del"  onclick="excluirMeta('${m.id}')"><i class="fas fa-trash"></i></button>
        </div>
    </div>`).join('');
}

function renderizarDados() {
    renderizarTiposDespesa();
    renderizarCartoes();
    renderizarCatDespesas();
    renderizarCatReceitas();
    renderizarMetas();
}

function selecionarIconeTipo(el) {
    document.querySelectorAll('#icon-picker-tipo .icon-opt').forEach(i=>i.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('tipo-icone').value = el.dataset.icon;
}
function selecionarCorTipo(el) { _pickerCor('#modal-tipo','tipo-cor', el); }

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
    if (!nome) { toast('Informe o nome do tipo.','error'); return; }
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
    if (!tipos.length) { lista.innerHTML='<p class="dados-empty">Nenhum tipo cadastrado ainda.</p>'; return; }
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


// ==========================================
// MELHORIAS DE FLUXO E TECLADO
// ==========================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const elementoAtivo = document.activeElement;
        const modal = elementoAtivo.closest('.modal-box');
        
        if (modal && (elementoAtivo.tagName === 'INPUT' || elementoAtivo.tagName === 'SELECT')) {
            e.preventDefault(); 
            
            if (elementoAtivo.tagName === 'SELECT') {
                elementoAtivo.size = 1;
            }

            const camposFocaveis = Array.from(modal.querySelectorAll('input:not([type="hidden"]), select, button.btn-save'));
            const indexAtual = camposFocaveis.indexOf(elementoAtivo);
            
            if (indexAtual > -1 && indexAtual < camposFocaveis.length - 1) {
                camposFocaveis[indexAtual + 1].focus();
            }
        }
    }
});

document.addEventListener('focusin', function(e) {
    const elemento = e.target;
    if (elemento.tagName === 'SELECT' && elemento.closest('.modal-box')) {
        elemento.size = Math.max(1, Math.min(elemento.options.length, 5)); 
    }
});

document.addEventListener('focusout', function(e) {
    const elemento = e.target;
    if (elemento.tagName === 'SELECT' && elemento.size > 1) {
        elemento.size = 1; 
    }
});

function aplicarFluxoContinuo(nomeFuncao, idModal, prefixoCampos) {
    if (typeof window[nomeFuncao] === 'function') {
        const funcaoOriginal = window[nomeFuncao];
        
        window[nomeFuncao] = function() {
            const inputEdit = document.getElementById(`${prefixoCampos}-edit-id`);
            const editId = inputEdit ? inputEdit.value : '';
            const ehNovo = !editId; 
            
            let mockAtivo = false;
            const fecharModalBackup = window.fecharModal;
            
            if (ehNovo) {
                window.fecharModal = function(id) {
                    if (id === idModal) {
                        const desc = document.getElementById(`${prefixoCampos}-descricao`);
                        const val = document.getElementById(`${prefixoCampos}-valor`);
                        if (desc) desc.value = '';
                        if (val) val.value = '';
                        if (desc) desc.focus(); 
                    } else {
                        fecharModalBackup(id);
                    }
                };
                mockAtivo = true;
            }
            
            funcaoOriginal();
            
            if (mockAtivo) {
                window.fecharModal = fecharModalBackup;
            }
        };
    }
}

aplicarFluxoContinuo('salvarDespesa', 'modal-despesa', 'despesa');
aplicarFluxoContinuo('salvarAPagar', 'modal-a-pagar', 'apagar');
aplicarFluxoContinuo('salvarReceita', 'modal-receita', 'receita');

// ==========================================
// DASHBOARD - TELA ANÁLISE
// ==========================================

let _pizzaChart = null;

function renderizarAnalise() {
    const despesas = getData('despesas_gastos');
    const apagar   = getData('a_pagar');
    const cartoes  = getData('cartoes');

    // Filtrar pelo período selecionado
    function filtrarPeriodo(lista, campoData) {
        if (_mesSel !== null) {
            const anoStr = String(_anoSel);
            const mesStr = String(_mesSel + 1).padStart(2, '0');
            return lista.filter(x => x[campoData] && x[campoData].startsWith(anoStr + '-' + mesStr));
        } else {
            return lista.filter(x => x[campoData] && x[campoData].startsWith(String(_anoSel)));
        }
    }

    const despPeriodo  = filtrarPeriodo(despesas, 'data');
    // Para contas a pagar: não pagas aparecem pelo vencimento; pagas pelo dataPagamento
    const apagarPeriodo = (() => {
        if (_mesSel !== null) {
            const anoStr = String(_anoSel);
            const mesStr = String(_mesSel + 1).padStart(2, '0');
            const prefixo = anoStr + '-' + mesStr;
            return apagar.filter(x => {
                const s = calcularStatus(x.vencimento, x.pago||false);
                if (s !== 'pago') return x.vencimento && x.vencimento.startsWith(prefixo);
                const refData = x.dataPagamento || x.vencimento || '';
                return refData.startsWith(prefixo);
            });
        } else {
            const anoStr = String(_anoSel);
            return apagar.filter(x => {
                const s = calcularStatus(x.vencimento, x.pago||false);
                if (s !== 'pago') return x.vencimento && x.vencimento.startsWith(anoStr);
                const refData = x.dataPagamento || x.vencimento || '';
                return refData.startsWith(anoStr);
            });
        }
    })().map(r => {
        r.status = calcularStatus(r.vencimento, r.pago || false);
        return r;
    });

    // ---- KPI: Cartões de Crédito ----
    const gastosCartao = despPeriodo.filter(x => x.tipoPagamentoVal && x.tipoPagamentoVal.startsWith('cartao_'));
    const totalCartao  = gastosCartao.reduce((s, x) => s + x.valor, 0);
    document.getElementById('kpi-cartoes').textContent     = brl(totalCartao);
    document.getElementById('kpi-cartoes-sub').textContent = `${gastosCartao.length} transaç${gastosCartao.length === 1 ? 'ão' : 'ões'}`;

    // ---- KPI: Total Despesas ----
    const totalDespesas = despPeriodo.reduce((s, x) => s + x.valor, 0);
    document.getElementById('kpi-total-despesas').textContent = brl(totalDespesas);
    document.getElementById('kpi-total-sub').textContent = `${despPeriodo.length} lançamento${despPeriodo.length !== 1 ? 's' : ''}`;

    // ---- KPI: Contas Pagas ----
    const contasPagas = apagarPeriodo.filter(x => x.status === 'pago');
    const totalPagas  = contasPagas.reduce((s, x) => s + x.valor, 0);
    document.getElementById('kpi-pagas').textContent     = brl(totalPagas);
    document.getElementById('kpi-pagas-sub').textContent = `${contasPagas.length} conta${contasPagas.length !== 1 ? 's' : ''}`;

    // ---- KPI: Previsão de Gastos ----
    const pendentesValor = apagarPeriodo.filter(x => x.status !== 'pago').reduce((s, x) => s + x.valor, 0);
    const previsaoTotal  = totalDespesas + pendentesValor;
    document.getElementById('kpi-previsao').textContent     = brl(previsaoTotal);
    document.getElementById('kpi-previsao-sub').textContent = `gastos + R$ ${pendentesValor.toLocaleString('pt-BR',{minimumFractionDigits:2})} pendente`;

    // ---- Gráfico Pizza por Categoria ----
    const porCategoria = {};
    despPeriodo.forEach(d => {
        const nome = d.categoriaNome || 'Sem categoria';
        const cor  = d.categoriaCor  || '#95a5a6';
        if (!porCategoria[nome]) porCategoria[nome] = { valor: 0, cor };
        porCategoria[nome].valor += d.valor;
    });

    const catLabels = Object.keys(porCategoria);
    const catValues = catLabels.map(k => porCategoria[k].valor);
    const catColors = catLabels.map(k => porCategoria[k].cor);

    const pizzaContainer = document.getElementById('pizza-container');
    const pizzaEmpty     = document.getElementById('pizza-empty');

    if (catLabels.length === 0) {
        pizzaContainer.classList.add('hidden');
        pizzaEmpty.classList.remove('hidden');
    } else {
        pizzaContainer.classList.remove('hidden');
        pizzaEmpty.classList.add('hidden');

        if (_pizzaChart) { _pizzaChart.destroy(); _pizzaChart = null; }
        const ctx = document.getElementById('chart-pizza').getContext('2d');
        _pizzaChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catValues,
                    backgroundColor: catColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: false,
                cutout: '60%',
                plugins: { legend: { display: false }, tooltip: {
                    callbacks: {
                        label: ctx => ` ${brl(ctx.parsed)}`
                    }
                }}
            }
        });

        // Legenda customizada
        const totalPizza = catValues.reduce((a,b) => a+b, 0);
        document.getElementById('pizza-legend').innerHTML = catLabels.map((l, i) => {
            const pct = totalPizza ? ((catValues[i] / totalPizza) * 100).toFixed(1) : 0;
            return `<div class="pizza-leg-item">
                <span class="pizza-leg-dot" style="background:${catColors[i]}"></span>
                <span class="pizza-leg-nome">${l}</span>
                <span class="pizza-leg-pct">${pct}%</span>
                <span class="pizza-leg-val">${brl(catValues[i])}</span>
            </div>`;
        }).join('');
    }

    // ---- Top 10 Gastos sem Cartão ----
    const semCartao = despPeriodo
        .filter(x => !x.tipoPagamentoVal || !x.tipoPagamentoVal.startsWith('cartao_'))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

    const top10El = document.getElementById('top10-lista');
    if (!semCartao.length) {
        top10El.innerHTML = '<div class="dash-empty"><i class="fas fa-receipt"></i><p>Sem despesas no período</p></div>';
    } else {
        const maxVal = semCartao[0].valor;
        top10El.innerHTML = semCartao.map((d, i) => {
            const pct = maxVal ? (d.valor / maxVal * 100).toFixed(0) : 0;
            const dataFmt = d.data ? new Date(d.data + 'T00:00').toLocaleDateString('pt-BR') : '—';
            return `<div class="top10-item">
                <span class="top10-rank">${i + 1}</span>
                <div class="top10-info">
                    <span class="top10-desc">${d.descricao}</span>
                    <div class="top10-bar-wrap">
                        <div class="top10-bar" style="width:${pct}%;background:${d.categoriaCor||'#3498db'}"></div>
                    </div>
                    <span class="top10-sub">${d.categoriaNome||'Sem categoria'} · ${dataFmt}</span>
                </div>
                <span class="top10-valor">${brl(d.valor)}</span>
            </div>`;
        }).join('');
    }

    // ---- Detalhamento por Cartão ----
    const detalheEl = document.getElementById('dash-cartoes-detalhe');
    if (!cartoes.length) {
        detalheEl.innerHTML = '<div class="dash-empty"><i class="fas fa-credit-card"></i><p>Nenhum cartão cadastrado</p></div>';
    } else {
        detalheEl.innerHTML = cartoes.map(c => {
            const gastosC = gastosCartao.filter(x => x.tipoPagamentoVal === 'cartao_' + c.id);
            const totalC  = gastosC.reduce((s, x) => s + x.valor, 0);
            const limiteUso = c.limite ? Math.min((totalC / c.limite * 100), 100).toFixed(0) : null;
            return `<div class="dash-cartao-item">
                <div class="dash-cartao-chip" style="background:${c.cor||'#3498db'}">
                    <i class="fas fa-credit-card"></i>
                </div>
                <div class="dash-cartao-info">
                    <span class="dash-cartao-nome">${c.nome}</span>
                    <span class="dash-cartao-sub">${c.bandeira||''} ${c.digitos?'···· '+c.digitos:''}</span>
                    ${c.limite ? `<div class="dash-cartao-bar-wrap">
                        <div class="dash-cartao-bar" style="width:${limiteUso}%;background:${+limiteUso>80?'#e74c3c':c.cor||'#3498db'}"></div>
                    </div>
                    <span class="dash-cartao-limite">${brl(totalC)} de ${brl(c.limite)} (${limiteUso}%)</span>` : ''}
                </div>
                <div class="dash-cartao-total">
                    <span class="dash-cartao-valor">${brl(totalC)}</span>
                    <span class="dash-cartao-qtd">${gastosC.length} lançamento${gastosC.length!==1?'s':''}</span>
                </div>
            </div>`;
        }).join('');
    }

    // ---- Contas por status ----
    function renderContaLista(elId, lista) {
        const el = document.getElementById(elId);
        if (!lista.length) {
            el.innerHTML = '<div class="dash-contas-empty">Nenhuma conta</div>';
            return;
        }
        el.innerHTML = lista.map(r => {
            const dataFmt = r.vencimento ? new Date(r.vencimento+'T00:00').toLocaleDateString('pt-BR') : '—';
            return `<div class="dash-conta-item">
                <div class="dash-conta-icon" style="background:${r.categoriaCor||'#95a5a6'}20;color:${r.categoriaCor||'#95a5a6'}">${r.categoriaIcone||'🏷️'}</div>
                <div class="dash-conta-info">
                    <span class="dash-conta-desc">${r.descricao}</span>
                    <span class="dash-conta-data">${dataFmt}</span>
                </div>
                <span class="dash-conta-valor">${brl(r.valor)}</span>
            </div>`;
        }).join('');
    }

    renderContaLista('contas-pagas-lista',     apagarPeriodo.filter(x => x.status === 'pago'));
    renderContaLista('contas-pendentes-lista',  apagarPeriodo.filter(x => x.status === 'pendente'));
    renderContaLista('contas-vencidas-lista',   apagarPeriodo.filter(x => x.status === 'vencido'));
}

// ==========================================
// FIREBASE / SYNC MODULE
// Suporte offline + online com fila de pendências
// ==========================================

// Chaves do localStorage que são sincronizadas com Firebase
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

let _db          = null;   // instância Firestore
let _userId      = null;   // ID do usuário (auth anônimo Firebase)
let _isOnline    = navigator.onLine;
let _syncPending = false;  // há dados locais não sincronizados?
let _statusBarEl = null;   // elemento da barra de status

// ---- Barra de status de conexão ----
function _criarStatusBar() {
    if (document.getElementById('sync-status-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'sync-status-bar';
    bar.style.cssText = `
        position:fixed; bottom:0; left:0; right:0; z-index:9999;
        padding:6px 16px; font-size:12px; font-weight:600;
        display:flex; align-items:center; gap:8px;
        transition: all 0.4s ease; transform:translateY(100%);
    `;
    document.body.appendChild(bar);
    _statusBarEl = bar;
}

function _mostrarStatus(msg, tipo='info', duracao=3500) {
    if (!_statusBarEl) _criarStatusBar();
    const cores = {
        info:    { bg:'#2980b9', fg:'#fff' },
        success: { bg:'#27ae60', fg:'#fff' },
        warning: { bg:'#f39c12', fg:'#fff' },
        error:   { bg:'#c0392b', fg:'#fff' },
        offline: { bg:'#7f8c8d', fg:'#fff' },
        sync:    { bg:'#8e44ad', fg:'#fff' }
    };
    const c = cores[tipo] || cores.info;
    _statusBarEl.style.background = c.bg;
    _statusBarEl.style.color = c.fg;
    const icons = { info:'ℹ️', success:'✅', warning:'⚠️', error:'❌', offline:'📶', sync:'🔄' };
    _statusBarEl.innerHTML = `<span>${icons[tipo]||'ℹ️'}</span><span>${msg}</span>`;
    _statusBarEl.style.transform = 'translateY(0)';
    if (duracao > 0) {
        setTimeout(() => { _statusBarEl.style.transform = 'translateY(100%)'; }, duracao);
    }
}

// ---- Fila de operações pendentes (para sync offline→online) ----
function _getPendingQueue() {
    try { return JSON.parse(localStorage.getItem('_sync_queue') || '[]'); } catch { return []; }
}
function _setPendingQueue(q) { localStorage.setItem('_sync_queue', JSON.stringify(q)); }
function _addToPendingQueue(colecao, dados) {
    const q = _getPendingQueue();
    // Remove entradas anteriores da mesma coleção (guarda apenas o último estado)
    const filtrada = q.filter(x => x.colecao !== colecao);
    filtrada.push({ colecao, dados, ts: Date.now() });
    _setPendingQueue(filtrada);
    _syncPending = true;
    _atualizarIndicadorSync();
}

function _atualizarIndicadorSync() {
    const q = _getPendingQueue();
    const badge = document.getElementById('sync-badge');
    if (!badge) return;
    if (q.length > 0 && !_isOnline) {
        badge.style.display = 'inline-block';
        badge.title = `${q.length} coleção(ões) aguardando sync`;
    } else {
        badge.style.display = 'none';
    }
}

// ---- Override de setData para integrar Firebase ----
const _setDataOriginal = window.setData || function(k,v){ localStorage.setItem(k, JSON.stringify(v)); };

function setData(key, val) {
    // Sempre salva local primeiro (offline-first)
    localStorage.setItem(key, JSON.stringify(val));

    // Se é uma chave sincronizável, envia para Firebase ou adiciona à fila
    if (SYNC_KEYS.includes(key)) {
        if (_db && _userId && _isOnline) {
            _syncCollection(key, val);
        } else if (SYNC_KEYS.includes(key)) {
            _addToPendingQueue(key, val);
        }
    }
}

// ---- Firebase: enviar uma coleção ----
async function _syncCollection(key, dados) {
    if (!_db || !_userId) return;
    try {
        const { doc, setDoc } = window._firestoreApi;
        await setDoc(doc(_db, 'usuarios', _userId, 'dados', key), { payload: JSON.stringify(dados), updatedAt: Date.now() });
        // Remove da fila de pendentes se estava lá
        const q = _getPendingQueue().filter(x => x.colecao !== key);
        _setPendingQueue(q);
        _atualizarIndicadorSync();
    } catch (e) {
        console.warn('Sync falhou para', key, e.message);
        _addToPendingQueue(key, dados);
    }
}

// ---- Firebase: baixar todos os dados do servidor ----
async function _baixarDadosFirebase() {
    if (!_db || !_userId) return;
    try {
        const { collection, getDocs } = window._firestoreApi;
        const snap = await getDocs(collection(_db, 'usuarios', _userId, 'dados'));
        let baixou = false;
        snap.forEach(docSnap => {
            const key = docSnap.id;
            const data = docSnap.data();
            if (data.payload) {
                const dadosServidor = JSON.parse(data.payload);
                // Merge: servidor ganha se tiver mais itens (estratégia simples)
                const local = (() => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } })();
                if (Array.isArray(dadosServidor) && dadosServidor.length >= local.length) {
                    localStorage.setItem(key, data.payload);
                    baixou = true;
                }
            }
        });
        if (baixou) {
            // Re-renderiza tudo com dados novos
            renderizarDespesas();
            renderizarAPagar();
            renderizarReceitas();
            renderizarAnalise();
            renderizarDados();
            _mostrarStatus('Dados sincronizados do servidor ✓', 'success', 3000);
        }
    } catch (e) {
        console.warn('Erro ao baixar dados Firebase:', e.message);
    }
}

// ---- Processar fila de operações offline ----
async function _processarFilaPendente() {
    const q = _getPendingQueue();
    if (!q.length) return;
    _mostrarStatus(`Sincronizando ${q.length} item(ns) pendente(s)...`, 'sync', 0);
    let sucessos = 0;
    for (const item of q) {
        try {
            await _syncCollection(item.colecao, item.dados);
            sucessos++;
        } catch(e) {
            console.warn('Falha ao sincronizar', item.colecao, e);
        }
    }
    if (sucessos === q.length) {
        _mostrarStatus('Todos os dados sincronizados! ✓', 'success', 3000);
    } else {
        _mostrarStatus(`${sucessos}/${q.length} sincronizados. Tentaremos novamente.`, 'warning', 4000);
    }
    _atualizarIndicadorSync();
}

// ---- Monitorar conexão ----
function _monitorarConexao() {
    window.addEventListener('online', () => {
        _isOnline = true;
        _mostrarStatus('Conexão restaurada! Sincronizando dados...', 'success', 0);
        setTimeout(() => {
            if (_db && _userId) {
                _processarFilaPendente();
                _baixarDadosFirebase();
            } else {
                _mostrarStatus('Online! Firebase não configurado – dados salvos localmente.', 'info', 4000);
            }
        }, 800);
    });

    window.addEventListener('offline', () => {
        _isOnline = false;
        _mostrarStatus('Sem conexão – trabalhando offline. Seus dados estão seguros.', 'offline', 0);
        setTimeout(() => { if(_statusBarEl) _statusBarEl.style.transform = 'translateY(100%)'; }, 5000);
    });
}

// ---- Inicialização do Firebase ----
async function initFirebaseSync() {
    _criarStatusBar();
    _monitorarConexao();

    // Adiciona badge de sync no header
    const header = document.querySelector('header');
    if (header && !document.getElementById('sync-badge')) {
        const badge = document.createElement('span');
        badge.id = 'sync-badge';
        badge.title = 'Dados pendentes de sincronização';
        badge.style.cssText = `
            display:none; background:#e74c3c; color:#fff;
            border-radius:50%; width:10px; height:10px;
            position:absolute; top:10px; right:80px;
            animation: pulse 1.5s infinite;
        `;
        header.style.position = 'relative';
        header.appendChild(badge);

        // Adiciona animação de pulse via style tag
        if (!document.getElementById('sync-style')) {
            const st = document.createElement('style');
            st.id = 'sync-style';
            st.textContent = `
                @keyframes pulse {
                    0%,100%{opacity:1;transform:scale(1);}
                    50%{opacity:.5;transform:scale(1.3);}
                }
                #sync-status-bar { font-family: inherit; }
            `;
            document.head.appendChild(st);
        }
    }

    // Se Firebase não está habilitado, trabalha apenas com localStorage
    if (!window.FIREBASE_ENABLED) {
        console.info('Firebase desabilitado – modo localStorage puro.');
        _atualizarIndicadorSync();
        return;
    }

    // Carrega Firebase via CDN e inicializa
    try {
        // Injeta scripts Firebase via tag <script> (compatível sem type=module)
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.type = 'module';
            s.textContent = `
                import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
                import { getFirestore, doc, setDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
                import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

                window._firebaseAPI = { initializeApp, getFirestore, doc, setDoc, collection, getDocs, getAuth, signInAnonymously };
                window.dispatchEvent(new Event('firebaseLoaded'));
            `;
            document.head.appendChild(s);
            window.addEventListener('firebaseLoaded', resolve, { once: true });
            setTimeout(() => reject(new Error('Firebase timeout')), 10000);
        });

        const { initializeApp, getFirestore, doc, setDoc, collection, getDocs, getAuth, signInAnonymously } = window._firebaseAPI;
        window._firestoreApi = { doc, setDoc, collection, getDocs };

        const app  = initializeApp(window.FIREBASE_CONFIG);
        _db        = getFirestore(app);
        const auth = getAuth(app);

        // Auth anônimo para identificar o dispositivo/usuário
        const cred = await signInAnonymously(auth);
        _userId = cred.user.uid;
        localStorage.setItem('_firebase_uid', _userId);

        console.info('Firebase conectado. UID:', _userId);
        _mostrarStatus('Firebase conectado ✓', 'success', 3000);

        // Baixa dados do servidor e processa fila pendente
        await _baixarDadosFirebase();
        await _processarFilaPendente();
        _atualizarIndicadorSync();

        // Listener de reconexão para re-tentar sync
        window.addEventListener('online', async () => {
            if (_db && _userId) {
                await _processarFilaPendente();
                await _baixarDadosFirebase();
            }
        });

    } catch (e) {
        console.error('Erro ao inicializar Firebase:', e.message);
        _mostrarStatus('Firebase indisponível – modo offline ativo. Dados salvos localmente.', 'warning', 5000);
    }

    _atualizarIndicadorSync();
}

// ==========================================
// CONFIGURAÇÕES - adiciona seção Firebase
// ==========================================
const _renderConfiguracoes_original = window.renderizarConfiguracoes || renderizarConfiguracoes;

function renderizarConfiguracoes() {
    const sel = document.getElementById('config-ano-select');
    sel.innerHTML = '';
    const anoAtual = new Date().getFullYear();
    for (let a = anoAtual + 1; a >= anoAtual - 5; a--) {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        if (a === _anoSel) opt.selected = true;
        sel.appendChild(opt);
    }

    // Adiciona painel Firebase nas configurações (se ainda não existe)
    const contentConf = document.getElementById('content-configuracoes');
    if (contentConf && !document.getElementById('config-firebase-panel')) {
        const panel = document.createElement('div');
        panel.id = 'config-firebase-panel';
        panel.innerHTML = `
        <div class="config-group" style="margin-top:20px;">
            <h4 style="margin:0 0 12px;color:var(--text-secondary,#666);font-size:13px;text-transform:uppercase;letter-spacing:.5px;">
                <i class="fas fa-cloud"></i> Sincronização Firebase
            </h4>
            <div class="config-item">
                <div class="config-item-info">
                    <span class="config-item-label">Status Firebase</span>
                    <span class="config-item-desc" id="firebase-status-desc">
                        ${window.FIREBASE_ENABLED
                            ? (_userId ? `✅ Conectado (UID: ${(_userId||'').slice(0,8)}...)` : '⏳ Conectando...')
                            : '⚙️ Desabilitado – edite firebase-config.js para ativar'}
                    </span>
                </div>
            </div>
            <div class="config-item">
                <div class="config-item-info">
                    <span class="config-item-label">Conexão Atual</span>
                    <span class="config-item-desc" id="conexao-status-desc">
                        ${_isOnline ? '🟢 Online' : '🔴 Offline'}
                    </span>
                </div>
            </div>
            <div class="config-item">
                <div class="config-item-info">
                    <span class="config-item-label">Itens na fila offline</span>
                    <span class="config-item-desc">${_getPendingQueue().length} item(ns) aguardando sync</span>
                </div>
                <div class="config-item-control">
                    <button class="btn-primary" style="font-size:12px;padding:6px 12px;"
                        onclick="exportarDadosJSON()">
                        <i class="fas fa-download"></i> Exportar JSON
                    </button>
                </div>
            </div>
        </div>`;
        contentConf.querySelector('.content-body').appendChild(panel);
    }
}

// ---- Exportar dados como JSON (backup manual) ----
function exportarDadosJSON() {
    const backup = {};
    SYNC_KEYS.forEach(k => {
        try { backup[k] = JSON.parse(localStorage.getItem(k) || '[]'); } catch { backup[k] = []; }
    });
    backup._exportadoEm = new Date().toISOString();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `financas_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup exportado!', 'success');
}

// =========================================
// SISTEMA DE NOTIFICAÇÕES — CONTAS VENCIDAS
// e contas com vencimento amanhã
// =========================================

function obterNotificacoes() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const todas = getData('a_pagar', []);
    const notifs = [];

    todas.forEach(r => {
        if (r.pago) return;
        const venc = new Date(r.vencimento + 'T00:00');
        if (isNaN(venc)) return;

        if (venc < hoje) {
            // Vencida
            const diasAtraso = Math.round((hoje - venc) / 86400000);
            notifs.push({
                id: r.id,
                tipo: 'vencido',
                titulo: r.descricao,
                desc: `Venceu ${diasAtraso === 0 ? 'hoje' : diasAtraso === 1 ? 'ontem' : `há ${diasAtraso} dias`} (${formatarData(r.vencimento)})`,
                valor: r.valor,
                vencimento: r.vencimento
            });
        } else if (venc.getTime() === hoje.getTime()) {
            // Vence hoje
            notifs.push({
                id: r.id,
                tipo: 'hoje',
                titulo: r.descricao,
                desc: `Vence HOJE — ${formatarData(r.vencimento)}`,
                valor: r.valor,
                vencimento: r.vencimento
            });
        } else if (venc.getTime() === amanha.getTime()) {
            // Vence amanhã
            notifs.push({
                id: r.id,
                tipo: 'amanha',
                titulo: r.descricao,
                desc: `Vence amanhã — ${formatarData(r.vencimento)}`,
                valor: r.valor,
                vencimento: r.vencimento
            });
        }
    });

    // Ordena: vencidos primeiro, depois hoje, depois amanhã
    const ordem = { vencido: 0, hoje: 1, amanha: 2 };
    notifs.sort((a, b) => ordem[a.tipo] - ordem[b.tipo]);
    return notifs;
}

function formatarData(str) {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
}

function atualizarIconeNotificacao() {
    const notifs = obterNotificacoes();
    const btn    = document.getElementById('notif-btn');
    const badge  = document.getElementById('notif-badge');
    if (!btn || !badge) return;

    if (notifs.length > 0) {
        badge.textContent = notifs.length > 99 ? '99+' : notifs.length;
        badge.classList.remove('hidden');
        btn.classList.add('has-notif');
    } else {
        badge.classList.add('hidden');
        btn.classList.remove('has-notif');
    }
}

function toggleNotifPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    if (panel.classList.contains('hidden')) {
        renderizarNotifPanel();
        panel.classList.remove('hidden');
        // Fecha ao clicar fora
        setTimeout(() => {
            document.addEventListener('click', fecharNotifPanelFora, { once: true });
        }, 50);
    } else {
        panel.classList.add('hidden');
    }
}

function fecharNotifPanel() {
    const panel = document.getElementById('notif-panel');
    if (panel) panel.classList.add('hidden');
}

function fecharNotifPanelFora(e) {
    const panel = document.getElementById('notif-panel');
    const btn   = document.getElementById('notif-btn');
    if (panel && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        panel.classList.add('hidden');
    } else if (panel && !panel.classList.contains('hidden')) {
        setTimeout(() => {
            document.addEventListener('click', fecharNotifPanelFora, { once: true });
        }, 50);
    }
}

function renderizarNotifPanel() {
    const lista  = document.getElementById('notif-panel-lista');
    if (!lista) return;
    const notifs = obterNotificacoes();

    if (notifs.length === 0) {
        lista.innerHTML = `<div class="notif-empty"><i class="fas fa-check-circle"></i><p>Nenhuma notificação pendente 🎉</p></div>`;
        return;
    }

    const icones = {
        vencido: '<i class="fas fa-exclamation-triangle"></i>',
        hoje:    '<i class="fas fa-clock"></i>',
        amanha:  '<i class="fas fa-bell"></i>'
    };
    const labels = {
        vencido: 'Vencida',
        hoje:    'Vence Hoje',
        amanha:  'Vence Amanhã'
    };

    lista.innerHTML = notifs.map(n => `
        <div class="notif-item notif-item--clicavel" onclick="irParaConta('${n.id}')" title="Clique para ir à conta">
            <div class="notif-item-icon ${n.tipo}">${icones[n.tipo]}</div>
            <div class="notif-item-body">
                <div class="notif-item-titulo">${n.titulo}</div>
                <div class="notif-item-desc">${n.desc}</div>
                <div class="notif-item-valor">${brl(n.valor)}</div>
                <span class="notif-item-tag ${n.tipo}">${labels[n.tipo]}</span>
            </div>
            <div class="notif-item-arrow"><i class="fas fa-chevron-right"></i></div>
        </div>
    `).join('');
}

// Navega para a aba A Pagar e destaca a conta específica
function irParaConta(id) {
    fecharNotifPanel();

    // Acessa a aba A Pagar via menu
    const menuItems = document.querySelectorAll('.menu-item');
    let menuAPagar = null;
    menuItems.forEach(item => {
        if (item.getAttribute('onclick') && item.getAttribute('onclick').includes('a-pagar')) {
            menuAPagar = item;
        }
    });

    if (menuAPagar) {
        mudarAba('A Pagar', 'a-pagar', menuAPagar);
    }

    // Aguarda render e destaca o item
    setTimeout(() => {
        // Remove destaques anteriores
        document.querySelectorAll('.reg-item--destaque').forEach(el => el.classList.remove('reg-item--destaque'));

        const itemEl = document.querySelector(`[data-id="${id}"]`);
        if (itemEl) {
            itemEl.classList.add('reg-item--destaque');
            itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Remove destaque após 3s
            setTimeout(() => itemEl.classList.remove('reg-item--destaque'), 3500);
        }
    }, 250);
}

// Dispara notificação push nativa do sistema operacional (PWA)
async function dispararNotificacoesPush() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;

    const notifs = obterNotificacoes();
    if (notifs.length === 0) return;

    // Agrupa para não spammar
    const vencidas = notifs.filter(n => n.tipo === 'vencido').length;
    const hoje_c   = notifs.filter(n => n.tipo === 'hoje').length;
    const amanha_c = notifs.filter(n => n.tipo === 'amanha').length;

    let msgs = [];
    if (vencidas > 0) msgs.push(`${vencidas} conta(s) vencida(s)`);
    if (hoje_c  > 0) msgs.push(`${hoje_c} conta(s) vence(m) hoje`);
    if (amanha_c > 0) msgs.push(`${amanha_c} conta(s) vence(m) amanhã`);

    if (msgs.length > 0) {
        new Notification('💰 Sistema Financeiro LHSC', {
            body: msgs.join(' · '),
            icon: 'icon-192.png',
            badge: 'icon-192.png',
            tag: 'financas-notif',
            renotify: false
        });
    }
}

// Hook: atualiza badge sempre que os dados mudarem
const _origSetData = window.setData;
if (typeof setData === 'function') {
    const _setDataOrig = setData;
    window.setData = function(key, value) {
        _setDataOrig(key, value);
        setTimeout(atualizarIconeNotificacao, 100);
    };
}


// ==========================================
// INIT E SW (INICIALIZAÇÃO DO APP - MOVIDO PARA O FINAL)
// ==========================================
(function initApp() {
    // Sempre inicia no mês e ano atuais — sem restaurar o que estava salvo
    const hoje = new Date();
    _mesSel = hoje.getMonth();
    _anoSel = hoje.getFullYear();
    // Salva só no localStorage puro (não passa pelo Firebase setData)
    localStorage.setItem('cfg_mes', JSON.stringify(_mesSel));
    localStorage.setItem('cfg_ano', JSON.stringify(_anoSel));
    // Atualiza o header (DOM está pronto pois o script está no final do body)
    _atualizarHeaderMes();
    _atualizarDataHoje();
    // Inicializa o módulo Firebase/Sync (assíncrono, não bloqueia o restante)
    initFirebaseSync();
})();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', ()=>{
        navigator.serviceWorker.register('sw.js')
            .then(r=>console.log('SW:',r.scope)).catch(e=>console.log('SW err:',e));
    });
}

// Inicializa notificações ao carregar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        atualizarIconeNotificacao();
        dispararNotificacoesPush();
        // Verifica a cada 5 minutos
        setInterval(() => {
            atualizarIconeNotificacao();
            dispararNotificacoesPush();
        }, 5 * 60 * 1000);
    }, 1000);
});