// ========= UTIL =========
function caminhoAbsoluto(src){
    return new URL(src, document.baseURI).href;
}

// ========= CUPOM =========
const CUPONS = {
   // "NIVER01":0.30
};

let cupomAtual=null;
let valorDesconto=0;

function aplicarCupom(){
    const input=document.getElementById("cupomInput");
    const msg=document.getElementById("cupomMsg");
    if(!input||!msg) return;

    const codigo=input.value.trim().toUpperCase();

    if(!CUPONS[codigo]){
        cupomAtual=null;
        valorDesconto=0;
        msg.innerText="Cupom inválido 😢";
        showToast("❌ Cupom inválido");
        atualizarCarrinho();
        return;
    }

    cupomAtual=codigo;
    atualizarCarrinho();

    let economia = valorDesconto.toFixed(2).replace(".",",");
    msg.innerText="Cupom aplicado!";
    showToast(`🎉 CUPOM APLICADO! 🎉Você economizou R$ ${economia}`);
}

// ========= CONFIG =========
const PRECOS_TAMANHO={
    "Mini":25,"P":35,"M":50,"G":70,"GG":90
};

function precoPorTamanho(precoBase,tamanho){
    if(!tamanho) return precoBase;
    return PRECOS_TAMANHO[tamanho]??precoBase;
}

const PRECOS_LIVRO={
    "P":15,"G":20
};

function precoPorTamanho2(precoBase,tamanho){
    if(!tamanho) return precoBase;
    return PRECOS_LIVRO[tamanho]??precoBase;
}

// ========= MODAL PRODUTO =========
let produtoAtual=null;

function abrirProduto(nome,preco,img,temTamanho=false,categoria="buque"){

    if(ITENS_ESGOTADOS.includes(nome)){
    showModal(
        "Produto indisponível",
        `O produto "${nome}" está esgotado no momento 😿`
    );
    return;
}

    produtoAtual={nome,precoBase:preco,preco,img,temTamanho,tamanho:null,categoria};

    const imgEl=document.getElementById("pm-img");
    const nomeEl=document.getElementById("pm-nome");
    const precoEl=document.getElementById("pm-preco");
    const area=document.getElementById("pm-tamanho");

    if(!imgEl) return;

    imgEl.src=img;
    nomeEl.innerText=nome;
    area.innerHTML="";

    // preço inicial
    if(temTamanho)
        precoEl.innerText="Escolha o tamanho";
    else
        precoEl.innerText="R$ "+preco.toFixed(2);

    // seletor de tamanho
    if(temTamanho){
      if(temTamanho){

    let opcoes = `<option value="">Escolher</option>`;

    if(categoria === "livro"){
        opcoes += `
            <option value="P">P</option>
            <option value="G">G</option>
        `;
    } else {
        opcoes += `
            <option value="Mini">Mini</option>
            <option value="P">P</option>
            <option value="M">M</option>
            <option value="G">G</option>
            <option value="GG">GG</option>
        `;
    }

    area.innerHTML = `
        <label>Tamanho:</label>
        <select id="pm-select">
            ${opcoes}
        </select>
    `;
}

        const sel=document.getElementById("pm-select");

        sel.onchange=()=>{
    produtoAtual.tamanho=sel.value.trim();

    let preco;

    if(produtoAtual.categoria==="livro")
        preco=precoPorTamanho2(produtoAtual.precoBase,produtoAtual.tamanho);
    else
        preco=precoPorTamanho(produtoAtual.precoBase,produtoAtual.tamanho);

    if(preco===undefined){
        precoEl.innerText="Tamanho indisponível";
        produtoAtual.preco=0;
        return;
    }

    produtoAtual.preco=preco;
    precoEl.innerText="R$ "+preco.toFixed(2);
};
    }

    document.getElementById("productModal").classList.add("active");
}

function fecharProduto(){
    document.getElementById("productModal").classList.remove("active");
}

// adicionar ao carrinho com proteção anti NaN
document.addEventListener("click",e=>{
    if(e.target && e.target.id==="pm-add"){

        if(produtoAtual.temTamanho && (!produtoAtual.tamanho || !produtoAtual.preco)){
            showModal("Escolha o tamanho","Selecione antes de adicionar 🌷");
            return;
        }

        addToCart(
            produtoAtual.nome,
            produtoAtual.preco,
            produtoAtual.img,
            produtoAtual.tamanho,
            produtoAtual.temTamanho
        );

        fecharProduto();
    }
});

// ========= ELEMENTOS =========
document.addEventListener("DOMContentLoaded",()=>{
    window.cartSidebar=document.getElementById("cartSidebar");
    window.cartItems=document.getElementById("cartItems");
    window.cartTotal=document.getElementById("cartTotal");
    window.formaPagamento=document.getElementById("formaPagamento");
    window.modalTitulo=document.getElementById("modalTitulo");
    window.modalMensagem=document.getElementById("modalMensagem");
    window.modalAviso=document.getElementById("modalAviso");
    updateCartCount();
});

// ========= MODAL ALERTA =========
function showModal(titulo,mensagem){
    modalTitulo.innerText=titulo;
    modalMensagem.innerText=mensagem;
    modalAviso.classList.add("active");
}
function fecharModal(){
    modalAviso.classList.remove("active");
}

// ========= STORAGE =========
function getCart(){
    let c=JSON.parse(localStorage.getItem("carrinho"))||[];
    c.forEach(i=>{
        if(i.tamanho===undefined)i.tamanho=null;
        if(i.temTamanho===undefined)i.temTamanho=false;
        if(i.precoBase===undefined)i.precoBase=i.preco;
    });
    return c;
}
function saveCart(c){
    localStorage.setItem("carrinho",JSON.stringify(c));
    updateCartCount();
}

// ========= CONTADOR =========
function updateCartCount(){
    const el=document.getElementById("cart-count");
    if(!el) return;
    el.textContent=getCart().reduce((s,i)=>s+i.qtd,0);
}

// ========= OPEN/CLOSE =========
function openCart(){
    cartSidebar.classList.add("active");
    document.body.classList.add("cart-open"); // <<< adiciona
    atualizarCarrinho();
}

function closeCart(){
    cartSidebar.classList.remove("active");
    document.body.classList.remove("cart-open"); // <<< remove
}

// ========= ADD =========
function addToCart(nome,preco,img,tamanho=null,temTamanho=false){
    let carrinho=getCart();
    let existente=carrinho.find(i=>i.nome===nome && i.tamanho===tamanho);

    if(existente){
        existente.qtd++;
    }else{
        carrinho.push({
            nome,
            precoBase:preco,
            preco,
            qtd:1,
            img:caminhoAbsoluto(img),
            tamanho,
            temTamanho
        });
    }

    saveCart(carrinho);
    atualizarCarrinho();

     mostrarToast("🛍️ " + nome + " adicionado ao carrinho!");
}

// ========= REMOVER ITEM =========
function removerItem(index){
    let carrinho=getCart();
    carrinho.splice(index,1);
    saveCart(carrinho);
    atualizarCarrinho();
}

// ========= QTD =========
function aumentarQtd(i){
    let c=getCart();
    c[i].qtd++;
    saveCart(c);
    atualizarCarrinho();
}
function diminuirQtd(i){
    let c=getCart();
    c[i].qtd--;
    if(c[i].qtd<=0)c.splice(i,1);
    saveCart(c);
    atualizarCarrinho();
}

// ========= RENDER =========
function atualizarCarrinho(){
    let carrinho=getCart();
    if(!cartItems) return;

    cartItems.innerHTML="";

    if(!carrinho.length){
        cartItems.innerHTML="<p>Seu carrinho está vazio 😢</p>";
        cartTotal.innerText="Total: R$ 0,00";
        return;
    }

    let total=0;

    carrinho.forEach((item,i)=>{
        let sub=item.preco*item.qtd;
        total+=sub;

        cartItems.innerHTML+=`
        <div class="cart-item">
            <img src="${item.img}" class="cart-thumb">

            <div class="cart-info">
                <div class="cart-name">${item.nome}</div>
                <div class="cart-price">R$ ${item.preco.toFixed(2)}</div>

                <div class="cart-qtd">
                    <button onclick="diminuirQtd(${i})">−</button>
                    <span>${item.qtd}</span>
                    <button onclick="aumentarQtd(${i})">+</button>
                </div>

                <button class="remove-btn" onclick="removerItem(${i})">🗑 Remover</button>
            </div>

            <div class="cart-subtotal">R$ ${sub.toFixed(2)}</div>
        </div>`;
    });

    valorDesconto=0;
    if(cupomAtual){
        let regra=CUPONS[cupomAtual];
        valorDesconto=regra<1?total*regra:regra;
    }

    let totalFinal=Math.max(0,total-valorDesconto);
    cartTotal.innerText="Total: R$ "+totalFinal.toFixed(2);
}

// ========= FINALIZAR =========
function finalizarCompra(){

    let carrinho=getCart();
    let nomeInput = document.getElementById("nomeCliente");
    let nome = nomeInput ? nomeInput.value.trim() : "";

    if(!carrinho.length)
        return showModal("Carrinho vazio","Você ainda não escolheu nenhum mimo 😢");

    if(!formaPagamento.value)
        return showModal("Ops!","Escolha a forma de pagamento ✨");

    if(!nome)
        return showModal("Falta seu nome 😊","Digite seu nome antes de finalizar o pedido.");

    for(let i of carrinho)
        if(i.temTamanho && !i.tamanho)
            return showModal("Escolha o tamanho","Selecione o tamanho do buquê 🌷");

    let msg="NOVO PEDIDO — Milly's Arts*\n\n";

    msg+=`Cliente: ${nome}\n\n`;

    let total=0;

    carrinho.forEach(i=>{
        let sub=i.preco*i.qtd;
        total+=sub;

        let tamanhoTxt = i.tamanho ? ` (${i.tamanho})` : "";

        msg+=`→ ${i.qtd}x ${i.nome}${tamanhoTxt} — R$ ${sub.toFixed(2)}\n`;
    });

    msg+="\n";

    let desconto=0;
    if(cupomAtual){
        let regra=CUPONS[cupomAtual];
        desconto=regra<1?total*regra:regra;
    }

    let totalFinal=Math.max(0,total-desconto);

    if(cupomAtual)
        msg+=`Cupom: ${cupomAtual}\nDesconto: -R$ ${desconto.toFixed(2)}\n`;

    msg+=`━━━━━━━━━━━━━━\nTOTAL: R$ ${totalFinal.toFixed(2)}\nPagamento: ${formaPagamento.value}`;

    window.open(`https://wa.me/5582991016562?text=${encodeURIComponent(msg)}`,"_blank");

}
// ========= TOAST =========
function showToast(msg,tipo="ok"){
    const toast=document.getElementById("toast");
    if(!toast) return;

    toast.textContent=msg;

    toast.classList.remove("erro","ok");
    toast.classList.add(tipo);

    toast.classList.add("show");

    setTimeout(()=>{
        toast.classList.remove("show");
    },2500);
}

// =============================
// CONTROLE DE ESGOTADO POR NOME
// =============================

const ITENS_ESGOTADOS = [
    //"Buquê de Borboletas"
];

document.addEventListener("DOMContentLoaded",()=>{

    document.querySelectorAll(".produto").forEach(produto=>{

        const nome = produto.querySelector("h3")?.innerText.trim();

        if(ITENS_ESGOTADOS.includes(nome)){
            produto.classList.add("esgotado");
        }

    });

});

// ===== TOAST =====
function mostrarToast(mensagem, tipo = "ok") {
    const toast = document.getElementById("toast");

    toast.textContent = mensagem;

    // remove classes antigas
    toast.classList.remove("ok", "erro");

    // adiciona tipo
    toast.classList.add(tipo);
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}