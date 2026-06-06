const listaProdutos = document.querySelector("#listaProdutos");
const filtrosCategorias = document.querySelector("#filtrosCategorias");
const ordenarProdutos = document.querySelector("#ordenarProdutos");
const cartCount = document.querySelector("#cartCount");

let produtosCarregados = [];
let categoriaAtual = "todos";

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

async function carregarCategorias(){
    const { data, error } = await supabaseClient
        .from("categorias")
        .select("id, nome, slug")
        .eq("ativo", true)
        .order("nome", { ascending: true });

    if(error){
        console.error(error);
        return;
    }

    data.forEach(categoria => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.categoria = categoria.slug;
        btn.textContent = categoria.nome;

        filtrosCategorias.appendChild(btn);
    });

    ativarFiltros();
}

async function carregarProdutos(){
    listaProdutos.innerHTML = `
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
            ativo,
            esgotado,
            tem_tamanho,
            categorias (
                nome,
                slug
            ),
            produto_imagens (
                imagem_url,
                principal,
                ordem
            )
        `)
        .eq("ativo", true)
        .order("criado_em", { ascending: false });

    if(error){
        console.error(error);

        listaProdutos.innerHTML = `
            <p class="erro-produtos">
                Não foi possível carregar os produtos.
            </p>
        `;

        return;
    }

    produtosCarregados = data || [];

    pegarCategoriaPelaUrl();
    renderizarProdutos();
}

function pegarCategoriaPelaUrl(){
    const params = new URLSearchParams(window.location.search);
    const categoriaUrl = params.get("categoria");

    if(categoriaUrl){
        categoriaAtual = categoriaUrl;
    }
}

function ativarFiltros(){
    const botoes = filtrosCategorias.querySelectorAll("button");

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            categoriaAtual = botao.dataset.categoria;

            botoes.forEach(btn => btn.classList.remove("ativo"));
            botao.classList.add("ativo");

            renderizarProdutos();
        });
    });
}

function marcarFiltroAtivo(){
    const botoes = filtrosCategorias.querySelectorAll("button");

    botoes.forEach(botao => {
        botao.classList.toggle(
            "ativo",
            botao.dataset.categoria === categoriaAtual
        );
    });
}

function ordenarLista(lista){
    const tipo = ordenarProdutos.value;

    const listaOrdenada = [...lista];

    if(tipo === "menor"){
        listaOrdenada.sort((a, b) => Number(a.preco) - Number(b.preco));
    }

    if(tipo === "maior"){
        listaOrdenada.sort((a, b) => Number(b.preco) - Number(a.preco));
    }

    if(tipo === "nome"){
        listaOrdenada.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return listaOrdenada;
}

function renderizarProdutos(){
    marcarFiltroAtivo();

    let lista = produtosCarregados;

    if(categoriaAtual !== "todos"){
        lista = lista.filter(produto => {
            return produto.categorias?.slug === categoriaAtual;
        });
    }

    lista = ordenarLista(lista);

    if(!lista.length){
        listaProdutos.innerHTML = `
            <p class="vazio-produtos">
                Nenhum produto encontrado nessa categoria.
            </p>
        `;
        return;
    }

    listaProdutos.innerHTML = "";

    lista.forEach(produto => {
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
                ${produto.esgotado ? `<span class="produto-badge-esgotado">Esgotado</span>` : ""}
                ${produto.destaque && !produto.esgotado ? `<span class="produto-badge">Destaque</span>` : ""}
            </div>

            <div class="produto-info">
                <h3>${produto.nome}</h3>

                <p class="produto-categoria">
                    ${produto.categorias?.nome || "Sem categoria"}
                </p>

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
                            data-id="${produto.id}"
                            aria-label="Adicionar ao carrinho"
                        >
                            🛍️
                        </button>
                    `
            }
                </div>
            </div>
        `;

        listaProdutos.appendChild(card);
    });

    ativarBotoesCarrinho();
}

function ativarBotoesCarrinho(){
    const botoes = document.querySelectorAll(".btn-cart");

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            const id = Number(botao.dataset.id);
            const produto = produtosCarregados.find(item => item.id === id);

            if(!produto){
                mostrarToast("Produto não encontrado.");
                return;
            }

            if(produto.tem_tamanho){
                window.location.href = `produto.html?id=${produto.id}`;
                return;
            }

            adicionarAoCarrinho(produto, null);
        });
    });
}

function adicionarAoCarrinho(produto, tamanho){
    if(produto.esgotado){
        mostrarToast("Esse produto está esgotado no momento.");
        return;
    }

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

if(ordenarProdutos){
    ordenarProdutos.addEventListener("change", renderizarProdutos);
}

document.addEventListener("DOMContentLoaded", async () => {
    atualizarContadorCarrinho();
    await carregarCategorias();
    await carregarProdutos();
});