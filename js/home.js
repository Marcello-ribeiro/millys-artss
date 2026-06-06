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
                                    🛍️
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
                alert("Erro ao adicionar produto.");
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