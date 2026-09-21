const listaCarrinho = document.querySelector("#listaCarrinho");
const cartCount = document.querySelector("#cartCount");

const subtotalCarrinho = document.querySelector("#subtotalCarrinho");
const descontoCarrinho = document.querySelector("#descontoCarrinho");
const totalCarrinho = document.querySelector("#totalCarrinho");

const cupomInput = document.querySelector("#cupomInput");
const btnAplicarCupom = document.querySelector("#btnAplicarCupom");
const cupomMensagem = document.querySelector("#cupomMensagem");

const btnFinalizarPedido = document.querySelector("#btnFinalizarPedido");

let cupomAplicado = null;
let descontoAtual = 0;

function pegarCarrinho(){
    return JSON.parse(localStorage.getItem("carrinhoMillys")) || [];
}

function salvarCarrinho(carrinho){
    localStorage.setItem("carrinhoMillys", JSON.stringify(carrinho));
}

function formatarPreco(valor){
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function calcularSubtotal(){
    const carrinho = pegarCarrinho();

    return carrinho.reduce((total, item) => {
        return total + (Number(item.preco) * Number(item.quantidade));
    }, 0);
}

function calcularDesconto(subtotal){
    if(!cupomAplicado) return 0;

    if(cupomAplicado.tipo === "porcentagem"){
        return subtotal * (Number(cupomAplicado.valor) / 100);
    }

    if(cupomAplicado.tipo === "fixo"){
        return Number(cupomAplicado.valor);
    }

    return 0;
}

function atualizarResumo(){
    const carrinho = pegarCarrinho();

    const quantidadeTotal = carrinho.reduce((soma, item) => {
        return soma + Number(item.quantidade);
    }, 0);

    if(cartCount){
        cartCount.textContent = quantidadeTotal;
    }

    const subtotal = calcularSubtotal();
    descontoAtual = Math.min(calcularDesconto(subtotal), subtotal);
    const total = subtotal - descontoAtual;

    subtotalCarrinho.textContent = formatarPreco(subtotal);
    descontoCarrinho.textContent = formatarPreco(descontoAtual);
    totalCarrinho.textContent = formatarPreco(total);
}

function renderizarCarrinho(){
    const carrinho = pegarCarrinho();

    if(!carrinho.length){
        listaCarrinho.innerHTML = `
            <div class="carrinho-vazio">
                <h2>Seu carrinho está vazio</h2>
                <p>Escolha algum produto personalizado para continuar.</p>
                <a href="produtos.html" class="btn-primary">Ver produtos</a>
            </div>
        `;

        atualizarResumo();
        return;
    }

    listaCarrinho.innerHTML = "";

    carrinho.forEach((item, index) => {
        const div = document.createElement("article");
        div.className = "item-carrinho";

        div.innerHTML = `
            <div class="item-img">
                <img src="${item.imagem}" alt="${item.nome}">
            </div>

            <div class="item-info">
                <h3>${item.nome}</h3>

                ${item.tamanho ? `<p>Tamanho: ${item.tamanho}</p>` : ""}

                <span class="item-preco">
                    ${formatarPreco(item.preco)}
                </span>
            </div>

            <div class="item-acoes">
                <div class="qtd-box">
                    <button type="button" data-acao="menos" data-index="${index}">-</button>
                    <span>${item.quantidade}</span>
                    <button type="button" data-acao="mais" data-index="${index}">+</button>
                </div>

                <button type="button" class="btn-remover" data-index="${index}">
                    Remover
                </button>
            </div>
        `;

        listaCarrinho.appendChild(div);
    });

    ativarAcoesCarrinho();
    atualizarResumo();
}

function ativarAcoesCarrinho(){
    const botoesQtd = document.querySelectorAll(".qtd-box button");
    const botoesRemover = document.querySelectorAll(".btn-remover");

    botoesQtd.forEach(botao => {
        botao.addEventListener("click", () => {
            const carrinho = pegarCarrinho();
            const index = Number(botao.dataset.index);
            const acao = botao.dataset.acao;

            if(acao === "mais"){
                carrinho[index].quantidade += 1;
            }

            if(acao === "menos"){
                carrinho[index].quantidade -= 1;

                if(carrinho[index].quantidade <= 0){
                    carrinho.splice(index, 1);
                }
            }

            salvarCarrinho(carrinho);
            renderizarCarrinho();
        });
    });

    botoesRemover.forEach(botao => {
        botao.addEventListener("click", () => {
            const carrinho = pegarCarrinho();
            const index = Number(botao.dataset.index);

            carrinho.splice(index, 1);

            salvarCarrinho(carrinho);
            renderizarCarrinho();
        });
    });
}

async function aplicarCupom(){
    const codigo = cupomInput.value.trim().toUpperCase();

    cupomMensagem.textContent = "";
    cupomMensagem.className = "";

    if(!codigo){
        cupomMensagem.textContent = "Digite um cupom.";
        cupomMensagem.classList.add("erro");
        return;
    }

    const { data, error } = await supabaseClient
        .from("cupons")
        .select("*")
        .eq("codigo", codigo)
        .eq("ativo", true)
        .single();

    if(error || !data){
        cupomAplicado = null;
        cupomMensagem.textContent = "Cupom inválido ou inativo.";
        cupomMensagem.classList.add("erro");
        atualizarResumo();
        return;
    }

    if(data.validade){
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const validade = new Date(data.validade + "T00:00:00");

        if(validade < hoje){
            cupomAplicado = null;
            cupomMensagem.textContent = "Cupom expirado.";
            cupomMensagem.classList.add("erro");
            atualizarResumo();
            return;
        }
    }

    if(data.codigo === "NAMORADOS15"){
    const carrinho = pegarCarrinho();

    const valorPolaroides = carrinho
        .filter(item =>
            item.nome.toLowerCase().includes("polaroid")
        )
        .reduce((soma, item) => {
            return soma + (Number(item.preco) * Number(item.quantidade));
        }, 0);

    const possuiOutrosProdutos = carrinho.some(item =>
        !item.nome.toLowerCase().includes("polaroid")
    );

    if(valorPolaroides > 0 && valorPolaroides < 10 && !possuiOutrosProdutos){
        cupomAplicado = null;

        cupomMensagem.textContent =
            "O cupom NAMORADOS15 exige no mínimo R$10 em polaroides.";

        cupomMensagem.classList.add("erro");

        atualizarResumo();
        return;
    }
}

    cupomAplicado = data;

    cupomMensagem.textContent = "Cupom aplicado com sucesso.";
    cupomMensagem.classList.add("ok");

    atualizarResumo();
}

function finalizarPedido(){
    const carrinho = pegarCarrinho();

    if(!carrinho.length){
        mostrarToast("Seu carrinho está vazio.");
        return;
    }

    const subtotal = calcularSubtotal();
    const desconto = descontoAtual;
    const total = subtotal - desconto;

    let mensagem = "Olá! Quero finalizar um pedido na Milly's Arts.%0A%0A";

    mensagem += "*Produtos:*%0A";

    carrinho.forEach((item, index) => {
        mensagem += `${index + 1}. ${item.nome}%0A`;
        if(item.tamanho){
            mensagem += `Tamanho: ${item.tamanho}%0A`;
        }
        mensagem += `Quantidade: ${item.quantidade}%0A`;
        mensagem += `Preço unitário: ${formatarPreco(item.preco)}%0A`;
        mensagem += `Subtotal: ${formatarPreco(item.preco * item.quantidade)}%0A%0A`;
    });

    

    if(cupomAplicado){
        mensagem += `Cupom: ${cupomAplicado.codigo}%0A`;
        mensagem += `Desconto: ${formatarPreco(desconto)}%0A`;
    }

    mensagem += `Total: ${formatarPreco(total)}%0A%0A`;
    mensagem += "Pode confirmar meu pedido?";

    const numero = "5582991016562";
    const link = `https://wa.me/${numero}?text=${mensagem}`;

    window.open(link, "_blank");
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

btnAplicarCupom.addEventListener("click", aplicarCupom);

cupomInput.addEventListener("keydown", event => {
    if(event.key === "Enter"){
        aplicarCupom();
    }
});

btnFinalizarPedido.addEventListener("click", finalizarPedido);

document.addEventListener("DOMContentLoaded", () => {
    renderizarCarrinho();
});