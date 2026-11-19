const produtosDestaque = document.querySelector("#produtosDestaque");
const cartCount = document.querySelector("#cartCount");

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

async function carregarProdutosDestaque(){
    if(!produtosDestaque) return;

    produtosDestaque.innerHTML = `
        <p class="loading-produtos">Carregando produtos...</p>
    `;

    const { data, error } = await supabaseClient
        .from("produtos")
        .select(`
            id,
            nome,
            preco,
            descricao,
            destaque,
            aparecer_home,
            ativo,
            esgotado,
            tem_tamanho,
            produto_imagens (
                imagem_url,
                principal,
                ordem
            )
        `)
        .eq("ativo", true)
        .eq("destaque", true)
        .eq("aparecer_home", true)
        .order("criado_em", { ascending: false })
        .limit(8);

    if(error){
        console.error(error);

        produtosDestaque.innerHTML = `
            <p class="erro-produtos">
                Não foi possível carregar os produtos agora.
            </p>
        `;

        return;
    }

    if(!data || data.length === 0){
        produtosDestaque.innerHTML = `
            <p class="vazio-produtos">
                Nenhum produto em destaque cadastrado ainda.
            </p>
        `;

        return;
    }

    produtosDestaque.innerHTML = "";

    preencherColagem(data);

    data.forEach(produto => {
        const imagens = produto.produto_imagens || [];

        const imagemPrincipal =
            imagens.find(img => img.principal)?.imagem_url ||
            imagens.sort((a, b) => (a.ordem || 0) - (b.ordem || 0))[0]?.imagem_url ||
            "./assets/img/placeholder-produto.png";

        const card = document.createElement("article");
        card.className = `produto-card ${produto.esgotado ? "produto-esgotado" : ""}`;

        card.innerHTML = `
            <div class="produto-img">
                <img src="${imagemPrincipal}" alt="${produto.nome}">
                ${
                    produto.esgotado
                        ? `<span class="produto-badge-esgotado">ESGOTADO</span>`
                        : `<span class="produto-badge">Destaque</span>`
                }
            </div>

            <div class="produto-info">
                <h3>${produto.nome}</h3>

                <p class="produto-preco">
                    ${formatarPreco(produto.preco)}
                </p>

                <div class="produto-actions">
                    <a href="produto.html?id=${produto.id}" class="btn-ver">
                        Ver detalhes
                    </a>

                    ${
                        produto.esgotado
                            ? `
                                <button 
                                    class="btn-cart btn-cart-esgotado" 
                                    type="button"
                                    disabled
                                    aria-label="Produto esgotado"
                                >
                                    Esgotado
                                </button>
                            `
                            : `
                                <button 
                                    class="btn-cart" 
                                    type="button"
                                    aria-label="Adicionar ao carrinho"
                                    data-id="${produto.id}"
                                >
                                    <svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 8h13l-1.2 12H6.7L5.5 8Z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg>
                                </button>
                            `
                    }
                </div>
            </div>
        `;

        produtosDestaque.appendChild(card);
    });

    ativarBotoesCarrinho();
}

// coloca fotos de dois produtos em destaque nas polaroids do topo
function preencherColagem(produtos){
    const molduras = document.querySelectorAll(".polaroid-a, .polaroid-b");

    const comFoto = produtos.filter(produto => !produto.esgotado && (produto.produto_imagens || []).length);

    molduras.forEach((moldura, index) => {
        const produto = comFoto[index];
        if(!produto) return;

        const imagens = produto.produto_imagens;
        const imagem = imagens.find(img => img.principal) || imagens[0];

        moldura.querySelector("img").src = imagem.imagem_url;
        moldura.querySelector("figcaption").textContent = produto.nome;
        moldura.hidden = false;
    });
}

function ativarBotoesCarrinho(){
    const botoes = document.querySelectorAll(".btn-cart:not(.btn-cart-esgotado)");

    botoes.forEach(botao => {
        botao.addEventListener("click", async () => {
            const id = Number(botao.dataset.id);

            const { data, error } = await supabaseClient
                .from("produtos")
                .select(`
                    id,
                    nome,
                    preco,
                    tem_tamanho,
                    esgotado,
                    produto_imagens (
                        imagem_url,
                        principal,
                        ordem
                    )
                `)
                .eq("id", id)
                .single();

            if(error || !data){
                mostrarToast("Não foi possível adicionar o produto agora.");
                return;
            }

            if(data.esgotado){
                mostrarToast("Esse produto está esgotado no momento.");
                return;
            }

            if(data.tem_tamanho){
                window.location.href = `produto.html?id=${data.id}`;
                return;
            }

            const imagens = data.produto_imagens || [];

            const imagemPrincipal =
                imagens.find(img => img.principal)?.imagem_url ||
                imagens.sort((a, b) => (a.ordem || 0) - (b.ordem || 0))[0]?.imagem_url ||
                "./assets/img/placeholder-produto.png";

            const carrinho = JSON.parse(localStorage.getItem("carrinhoMillys")) || [];

            const produtoExistente = carrinho.find(item => item.id === data.id && !item.tamanho);

            if(produtoExistente){
                produtoExistente.quantidade += 1;
            }else{
                carrinho.push({
                    id: data.id,
                    nome: data.nome,
                    preco: Number(data.preco),
                    imagem: imagemPrincipal,
                    tamanho: null,
                    quantidade: 1
                });
            }

            localStorage.setItem("carrinhoMillys", JSON.stringify(carrinho));

            atualizarContadorCarrinho();
            mostrarToast("Produto adicionado ao carrinho.");
        });
    });
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
    carregarProdutosDestaque();
});

const banners = document.querySelectorAll(".banner-slide");

let atual = 0;

if(banners.length > 1){
    setInterval(() => {
        banners[atual].classList.remove("active");
        atual = (atual + 1) % banners.length;
        banners[atual].classList.add("active");
    }, 5000);
}