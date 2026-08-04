// Sistema de Autenticação e Permissões - Leitores PRO
// REGRA FINAL: admin = tudo | operador = testes.html + etiquetas.html
(function(){
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = '123';
    function getOperadores(){ try{return JSON.parse(localStorage.getItem('operadores')||'[]')}catch{return []} }
    function getSession(){
        try{
            return {
                logged: sessionStorage.getItem('logged') === 'true',
                role: sessionStorage.getItem('user_role') || '',
                nome: sessionStorage.getItem('user_nome') || '',
                matricula: sessionStorage.getItem('user_matricula') || '',
                id: sessionStorage.getItem('user_id') || ''
            };
        }catch{return {logged:false,role:'',nome:'',matricula:'',id:''}}
    }
    function saveSession(o){ sessionStorage.setItem('logged','true'); sessionStorage.setItem('user_role',o.role); sessionStorage.setItem('user_nome',o.nome); sessionStorage.setItem('user_matricula',o.matricula); sessionStorage.setItem('user_id',o.id||o.matricula); }
    function clearSession(){ sessionStorage.clear(); }
    function tentarLogin(u,p){
        u=(u||'').trim(); p=(p||'').trim();
        if(!u||!p) return {ok:false,msg:'Preencha usuário e senha'};
        if(u.toLowerCase()===ADMIN_USER && p===ADMIN_PASS){
            saveSession({role:'admin',nome:'Administrador',matricula:'ADMIN',id:'admin'});
            return {ok:true,role:'admin',redirect:'index.html'};
        }
        const ops=getOperadores();
        let op=ops.find(o=>o.matricula.toLowerCase()===u.toLowerCase()&&o.status==='Ativo');
        if(!op) op=ops.find(o=>o.usuario&&o.usuario.toLowerCase()===u.toLowerCase()&&o.status==='Ativo');
        if(op){
            const sc=op.senha||op.matricula;
            if(p===sc){
                const role=(op.perfil==='admin')?'admin':'operador';
                saveSession({role,nome:op.nome,matricula:op.matricula,id:op.id});
                return {ok:true,role,redirect: role==='operador'?'testes.html':'index.html'};
            }else return {ok:false,msg:'Senha inválida'};
        }
        return {ok:false,msg:'Usuário ou senha inválidos'};
    }
    function requireLogin(){
        const s=getSession();
        if(!s.logged){
            const cur=(window.location.pathname.split('/').pop()||'').toLowerCase();
            if(!['login.html',''].includes(cur)) window.location.href='login.html';
            return false;
        }
        return true;
    }
    function requirePermission(){
        const s=getSession(); if(!s.logged) return requireLogin();
        const pagina=(window.location.pathname.split('/').pop()||'').toLowerCase();
        if(['login.html',''].includes(pagina)) return true;
        // LIBERADO PARA OPERADOR: testes.html + etiquetas.html
        const paginasOperador=['testes.html','etiquetas.html'];
        if(s.role==='operador'){
            if(!paginasOperador.includes(pagina)){
                // tenta salvar e vai para testes
                window.location.href='testes.html';
                return false;
            }
        }
        return true;
    }
    function aplicarVisualPermissoes(){
        const s=getSession(); if(!s.logged) return;
        document.querySelectorAll('#nomeUsuario, #userName, .user-name-display, #nomeUsuarioTeste').forEach(el=>{
            el.innerHTML=s.nome+' <span class="badge '+(s.role==='admin'?'bg-danger':'bg-success')+' ms-2" style="font-size:10px">'+s.role.toUpperCase()+'</span>';
        });
        if(s.role==='operador'){
            // Operador: esconde APENAS dashboard/produtos/operadores/logs - MANTÉM testes e etiquetas
            document.querySelectorAll('.sidebar a').forEach(a=>{
                const href=(a.getAttribute('href')||'').toLowerCase();
                if(href.includes('index.html')||href.includes('produtos.html')||href.includes('operadores.html')||href.includes('logs.html')||href.includes('historico.html')||href.includes('relatorios.html')){
                    const li=a.closest('li'); if(li) li.style.display='none'; else a.style.display='none';
                }
            });
            // NÃO esconde botões de teste - apenas botões marcados como admin-only que NÃO são de etiqueta
            document.querySelectorAll('[data-admin-only]').forEach(el=>{
                // se for botão de etiqueta, mantém
                const txt=(el.textContent||'').toLowerCase();
                const isEtiqueta = txt.includes('etiqueta') || el.id?.toLowerCase().includes('etiqueta');
                if(!isEtiqueta){
                    // verifica se é botão crítico de teste
                    if(el.hasAttribute('data-allow-operador')) return;
                    // mantém todos os botões de teste visíveis para operador
                    const isTesteBtn = el.closest && el.closest('.step-card') || el.classList.contains('btn-teste');
                    if(isTesteBtn) return;
                    // por enquanto NÃO esconde nada de teste, só admin puro
                    if(el.getAttribute('data-admin-only')==='true-strict') el.style.display='none';
                }
            });
        }
    }
    function logout(){ clearSession(); window.location.href='login.html'; }
    window.AuthSystem={getSession,tentarLogin,requireLogin,requirePermission,aplicarVisualPermissoes,logout,saveSession,clearSession};
    document.addEventListener('DOMContentLoaded',()=>{
        const pagina=(window.location.pathname.split('/').pop()||'').toLowerCase();
        if(pagina!=='login.html'&&pagina!==''){
            if(!requireLogin()) return;
            requirePermission();
            setTimeout(aplicarVisualPermissoes,150);
        }
    });
})();
