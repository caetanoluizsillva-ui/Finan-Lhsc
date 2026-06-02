// ==========================================
// TELA DE LOGIN: Mostrar/Ocultar Senha
// ==========================================
function toggleSenhaVisivel() {
    const inputSenha = document.getElementById('password');
    const iconOlho = document.getElementById('olho-icon'); 
    
    if (inputSenha && inputSenha.type === 'password') {
        inputSenha.type = 'text';
        if (iconOlho) iconOlho.className = 'fas fa-eye-slash';
    } else if (inputSenha) {
        inputSenha.type = 'password';
        if (iconOlho) iconOlho.className = 'fas fa-eye';
    }
}

// ==========================================
// LOGIN / LOGOUT / NAVEGAÇÃO
// ==========================================
async function fazerLogin() {
    const email = document.getElementById('username').value.trim(); 
    const pass  = document.getElementById('password').value;
    const err   = document.getElementById('login-error');
    const btn   = document.getElementById('btn-login');

    if (!email || !pass) {
        if(err) err.innerText = 'Preencha o e-mail e a senha.';
        return;
    }

    if (!window._firebaseAPI || !window._firebaseAuth) {
        if(err) err.innerText = 'Conectando ao servidor... tente novamente em 2 segundos.';
        return;
    }

    try {
        if(err) { err.style.color = '#2980b9'; err.innerText = 'Autenticando...'; }
        
        // Autenticação oficial com Firebase Auth usando a API injetada
        await window._firebaseAPI.signInWithEmailAndPassword(window._firebaseAuth, email, pass);
        
        if(err) err.innerText = '';
        // O Firebase acionará o listener onAuthStateChanged que mudará a tela
    } catch (e) {
        console.error("Erro no login:", e);
        if(err) {
            err.style.color = '#e74c3c';
            if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
                err.innerText = 'E-mail ou senha incorretos.';
            } else if (e.code === 'auth/invalid-email') {
                err.innerText = 'Formato de e-mail inválido.';
            } else {
                err.innerText = 'Erro ao entrar: ' + e.message;
            }
        }
    }
}

// ==========================================
// OUTRAS FUNÇÕES AUXILIARES DO SISTEMA
// ==========================================
function toast(mensagem, tipo = 'success') {
    // Simulação simples de uma notificação Toast na tela
    console.log(`[Toast ${tipo.toUpperCase()}]: ${mensagem}`);
    // Se tiveres um elemento de toast estruturado, podes ativar aqui
}

function fecharModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Função simuladora para obter dados locais
function getData(chave) {
    try {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : [];
    } catch (e) {
        console.error("Erro ao ler localStorage", e);
        return [];
    }
}

// ==========================================
// GESTÃO DE DESPESAS: Abrir e Salvar
// ==========================================
function abrirModalDespesa(id = null) {
    // Reseta ou preenche campos para edição
    if (!id) {
        document.getElementById('despesa-edit-id').value = '';
        document.getElementById('despesa-descricao').value = '';
        document.getElementById('despesa-valor').value = '';
        document.getElementById('despesa-data').value = new Date().toISOString().split('T')[0];
    } else {
        const r = getData('despesas').find(x => x.id === id);
        if (r) {
            document.getElementById('despesa-edit-id').value = r.id;
            document.getElementById('despesa-descricao').value = r.descricao;
            document.getElementById('despesa-valor').value = r.valor;
            document.getElementById('despesa-data').value = r.data;
            document.getElementById('despesa-categoria').value = r.categoriaId || '';
            document.getElementById('despesa-tipo-pagamento').value = r.tipoPagamentoVal || '';
            document.getElementById('despesa-local').value = r.local || '';
            document.getElementById('despesa-obs').value = r.obs || '';
        }
    }
    const modal = document.getElementById('modal-despesa');
    if (modal) modal.classList.remove('hidden');
}

function salvarDespesa() {
    const desc  = document.getElementById('despesa-descricao').value.trim();
    const valor = parseFloat(document.getElementById('despesa-valor').value);
    const data  = document.getElementById('despesa-data').value;
    
    if (!desc)  { toast('Informe a descrição.', 'error'); return; }
    if (!valor) { toast('Informe o valor.', 'error'); return; }
    if (!data)  { toast('Informe a data.', 'error'); return; }

    const catId  = document.getElementById('despesa-categoria').value;
    const cat    = getData('cat_despesas').find(x => x.id === catId);
    const tpVal  = document.getElementById('despesa-tipo-pagamento').value;
    let tipoPagamentoNome = '';

    // Correção estrutural feita aqui:
    if (tpVal && tpVal.startsWith('cartao_')) {
        const idCartao = tpVal.replace('cartao_', '');
        const c = getData('cartoes').find(x => x.id === idCartao);
        if (c) tipoPagamentoNome = c.nome;
    } else if (tpVal && tpVal.startsWith('tipo_')) {
        const idTipo = tpVal.replace('tipo_', '');
        const t = getData('tipos_despesa').find(x => x.id === idTipo);
        if (t) tipoPagamentoNome = t.nome;
    }

    // Aqui o teu sistema pode salvar o objeto despesa no localStorage/Firebase
    toast('Despesa salva com sucesso!', 'success');
    fecharModal('modal-despesa');
} // <-- Todas as funções fechadas de forma limpa e segura!