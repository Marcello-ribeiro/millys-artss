const produtoDetalhe = document.querySelector("#produtoDetalhe");
const cartCount = document.querySelector("#cartCount");

let produtoAtual = null;
let tamanhoSelecionado = null;

function formatarPreco(valor){
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function atualizarContadorCarrinho(){
    const carrinho = JSON.parse(localStorage.getItem("carrinhoMillys")) || [];
    const total = carrinho.reduce((soma, item) => soma + item.quantidade, 0);

    if(cartCount){
        cartCount.textContent = total;
    }
}

async function carregarProduto(){
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if(!id){
        produtoDetalhe.innerHTML = `<p class="erro-produtos">Produto não encontrado.</p>`;
        return;
    }

    produtoDetalhe.innerHTML = `<p class="loading-produtos">Carregando produto...</p>`;

    const { data, error } = await supabaseClient
        .from("produtos")
        .select(`
            id,
            nome,
            preco,
            descricao,
            ativo,
            tem_tamanho,
            categorias (
                nome,
                slug
            ),
            produto_imagens (
                imagem_url,
                principal,
                ordem
            ),
            produto_tamanhos (
                tamanho,
                ativo
            )
        `)
        .eq("id", id)
        .eq("ativo", true)
        .single();

    if(error || !data){
        console.error(error);
        produtoDetalhe.innerHTML = `<p class="erro-produtos">Produto não encontrado.</p>`;
        return;
    }

    produtoAtual = data;
    renderizarProduto();
}

function renderizarProduto(){
    const imagensOrdenadas = [...(produtoAtual.produto_imagens || [])]
        .sort((a, b) => {
            if(a.principal) return -1;
            if(b.principal) return 1;
            return (a.ordem || 0) - (b.ordem || 0);
        });

    const imagens = imagensOrdenadas.length
        ? imagensOrdenadas
        : [{ imagem_url: "./assets/img/placeholder-produto.png" }];

    const tamanhos = (produtoAtual.produto_tamanhos || [])
        .filter(item => item.ativo);

    produtoDetalhe.innerHTML = `
        <div class="produto-layout">

            <div class="galeria-produto">
                <div class="imagem-principal">
                    <img id="imagemPrincipalProduto" src="${imagens[0].imagem_url}" alt="${produtoAtual.nome}">
                </div>

                <div class="miniaturas">
                    ${imagens.map((img, index) => `
                        <button class="miniatura ${index === 0 ? "ativa" : ""}" type="button" data-img="${img.imagem_url}">
                            <img src="${img.imagem_url}" alt="${produtoAtual.nome}">
                        </button>
                    `).join("")}
                </div>
            </div>

            <div class="info-produto">
                <span class="categoria">${produtoAtual.categorias?.nome || "Produto"}</span>

                <h1>${produtoAtual.nome}</h1>

                <p class="preco">${formatarPreco(produtoAtual.preco)}</p>

                <p class="descricao">
                    ${produtoAtual.descricao || "Produto personalizado feito com carinho."}
                </p>

                ${
                    produtoAtual.tem_tamanho && tamanhos.length
                    ? `
                        <div class="tamanhos-box">
                            <h3>Escolha o tamanho</h3>

                            <div class="tamanhos-lista">
                                ${tamanhos.map(item => `
                                    <button class="tamanho-btn" type="button" data-tamanho="${item.tamanho}">
                                        ${item.tamanho}
                                    </button>
                                `).join("")}
                            </div>
                        </div>
                    `
                    : ""
                }

                <div class="produto-compra">
                    <button class="btn-comprar" id="btnAdicionarCarrinho" type="button">
                        Adicionar ao carrinho
                    </button>

                    <a 
                        class="btn-whatsapp" 
                        href="${montarLinkWhatsapp()}" 
                        target="_blank"
                    >
                        Comprar pelo WhatsApp
                    </a>
                </div>
            </div>

        </div>
    `;

    ativarGaleria();
    ativarTamanhos();
    ativarCompra();
}

function ativarGaleria(){
    const imagemPrincipal = document.querySelector("#imagemPrincipalProduto");
    const miniaturas = document.querySelectorAll(".miniatura");

    miniaturas.forEach(btn => {
        btn.addEventListener("click", () => {
            imagemPrincipal.src = btn.dataset.img;

            miniaturas.forEach(item => item.classList.remove("ativa"));
            btn.classList.add("ativa");
        });
    });
}

function ativarTamanhos(){
    const botoes = document.querySelectorAll(".tamanho-btn");

    botoes.forEach(btn => {
        btn.addEventListener("click", () => {
            tamanhoSelecionado = btn.dataset.tamanho;

            botoes.forEach(item => item.classList.remove("ativo"));
            btn.classList.add("ativo");
        });
    });
}

function ativarCompra(){
    const btn = document.querySelector("#btnAdicionarCarrinho");

    btn.addEventListener("click", () => {
        if(produtoAtual.tem_tamanho && !tamanhoSelecionado){
            mostrarToast("Escolha um tamanho antes.");
            return;
        }

        adicionarAoCarrinho(produtoAtual, tamanhoSelecionado);
    });
}

function adicionarAoCarrinho(produto, tamanho){
    const imagens = produto.produto_imagens || [];

    const imagemPrincipal =
        imagens.find(img => img.principal)?.imagem_url ||
        imagens.sort((a, b) => (a.ordem || 0) - (b.ordem || 0))[0]?.imagem_url ||
        "./assets/img/placeholder-produto.png";

    const carrinho = JSON.parse(localStorage.getItem("carrinhoMillys")) || [];

    const produtoExistente = carrinho.find(item => {
        return item.id === produto.id && item.tamanho === tamanho;
    });

    if(produtoExistente){
        produtoExistente.quantidade += 1;
    }else{
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: Number(produto.preco),
            imagem: imagemPrincipal,
            tamanho,
            quantidade: 1
        });
    }

    localStorage.setItem("carrinhoMillys", JSON.stringify(carrinho));

    atualizarContadorCarrinho();
    mostrarToast("Produto adicionado ao carrinho.");
}

function montarLinkWhatsapp() {
    const nomeProduto = produtoAtual?.nome || "produto";

    const texto = `Olá! Tudo bem? Acabei de ver o produto "${nomeProduto}" na Milly's Arts e gostaria de receber mais informações sobre ele.`;

    return `https://wa.me/5582991016562?text=${encodeURIComponent(texto)}`;
}

function mostrarToast(mensagem){
    let toast = document.querySelector(".toast");

    if(!toast){
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = mensagem;
    toast.classList.add("ativo");

    setTimeout(() => {
        toast.classList.remove("ativo");
    }, 2300);
}

document.addEventListener("DOMContentLoaded", () => {
    atualizarContadorCarrinho();
    carregarProduto();
});