


const adminMenuBtns = document.querySelectorAll(".admin-menu button");
const adminTabs = document.querySelectorAll(".admin-tab");

/* FORM PRODUTO */
const formProduto = document.querySelector("#formProduto");
const produtoId = document.querySelector("#produtoId");
const tituloFormProduto = document.querySelector("#tituloFormProduto");

const nomeProduto = document.querySelector("#nomeProduto");
const precoProduto = document.querySelector("#precoProduto");
const categoriaProduto = document.querySelector("#categoriaProduto");
const descricaoProduto = document.querySelector("#descricaoProduto");
const imagensProduto = document.querySelector("#imagensProduto");

const ativoProduto = document.querySelector("#ativoProduto");
const destaqueProduto = document.querySelector("#destaqueProduto");
const homeProduto = document.querySelector("#homeProduto");
const esgotadoProduto = document.querySelector("#esgotadoProduto");

const listaProdutosAdmin = document.querySelector("#listaProdutosAdmin");
const btnLimparProduto = document.querySelector("#btnLimparProduto");
const btnRecarregarProdutos = document.querySelector("#btnRecarregarProdutos");

/* FORM CUPOM */
const formCupom = document.querySelector("#formCupom");
const cupomId = document.querySelector("#cupomId");
const tituloFormCupom = document.querySelector("#tituloFormCupom");

const codigoCupom = document.querySelector("#codigoCupom");
const tipoCupom = document.querySelector("#tipoCupom");
const valorCupom = document.querySelector("#valorCupom");
const validadeCupom = document.querySelector("#validadeCupom");
const ativoCupom = document.querySelector("#ativoCupom");

const listaCuponsAdmin = document.querySelector("#listaCuponsAdmin");
const btnLimparCupom = document.querySelector("#btnLimparCupom");
const btnRecarregarCupons = document.querySelector("#btnRecarregarCupons");

const uploadImagensProduto = document.querySelector("#uploadImagensProduto");
const nomeArquivos = document.querySelector("#nomeArquivos");

const modalConfirm = document.querySelector("#modalConfirm");
const modalConfirmTexto = document.querySelector("#modalConfirmTexto");
const btnCancelarConfirm = document.querySelector("#btnCancelarConfirm");
const btnConfirmarAcao = document.querySelector("#btnConfirmarAcao");




let acaoConfirmada = null;

let produtosAdmin = [];
let cuponsAdmin = [];

function formatarPreco(valor){
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


function abrirConfirmacao(texto, callback){
    modalConfirmTexto.textContent = texto;
    acaoConfirmada = callback;
    modalConfirm.classList.add("ativo");
}

function fecharConfirmacao(){
    modalConfirm.classList.remove("ativo");
    acaoConfirmada = null;
}

btnCancelarConfirm.addEventListener("click", fecharConfirmacao);

btnConfirmarAcao.addEventListener("click", async () => {
    if(acaoConfirmada){
        await acaoConfirmada();
    }

    fecharConfirmacao();
});

uploadImagensProduto.addEventListener("change", () => {
    const total = uploadImagensProduto.files.length;

    nomeArquivos.textContent = total
        ? `${total} foto(s) selecionada(s)`
        : "Nenhuma foto selecionada";
});

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

/* ABAS */
adminMenuBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;

        adminMenuBtns.forEach(item => item.classList.remove("ativo"));
        adminTabs.forEach(item => item.classList.remove("ativo"));

        btn.classList.add("ativo");
        document.querySelector(`#tab-${tab}`).classList.add("ativo");
    });
});

/* CATEGORIAS */
async function carregarCategoriasAdmin(){
    const { data, error } = await supabaseClient
        .from("categorias")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome", { ascending: true });

    if(error){
        console.error(error);
        mostrarToast("Erro ao carregar categorias.");
        return;
    }

    categoriaProduto.innerHTML = `<option value="">Selecione</option>`;

    data.forEach(categoria => {
        const option = document.createElement("option");
        option.value = categoria.id;
        option.textContent = categoria.nome;
        categoriaProduto.appendChild(option);
    });
}

/* PRODUTOS */
async function carregarProdutosAdmin(){
    listaProdutosAdmin.innerHTML = `<p class="admin-empty">Carregando produtos...</p>`;

    const { data, error } = await supabaseClient
        .from("produtos")
        .select(`
            id,
            nome,
            preco,
            descricao,
            ativo,
            destaque,
            aparecer_home,
            esgotado,
            tem_tamanho,
            categoria_id,
            categorias (
                nome
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
        .order("criado_em", { ascending: false });

    if(error){
        console.error(error);
        listaProdutosAdmin.innerHTML = `<p class="admin-empty">Erro ao carregar produtos.</p>`;
        return;
    }

    produtosAdmin = data || [];
    renderizarProdutosAdmin();
}

function renderizarProdutosAdmin(){
    if(!produtosAdmin.length){
        listaProdutosAdmin.innerHTML = `<p class="admin-empty">Nenhum produto cadastrado.</p>`;
        return;
    }

    listaProdutosAdmin.innerHTML = "";

    produtosAdmin.forEach(produto => {
        const imagens = produto.produto_imagens || [];

        const imagemPrincipal =
            imagens.find(img => img.principal)?.imagem_url ||
            imagens.sort((a, b) => (a.ordem || 0) - (b.ordem || 0))[0]?.imagem_url ||
            "./assets/img/placeholder-produto.png";

        const div = document.createElement("article");
        div.className = "admin-item";

        div.innerHTML = `
            <div class="admin-item-img">
                <img src="${imagemPrincipal}" alt="${produto.nome}">
            </div>

            <div class="admin-item-info">
                <h3>${produto.nome}</h3>
                <p>${formatarPreco(produto.preco)} • ${produto.categorias?.nome || "Sem categoria"}</p>

                <div class="admin-item-tags">
                    ${produto.ativo ? `<span class="admin-tag">Ativo</span>` : `<span class="admin-tag">Inativo</span>`}
                    ${produto.destaque ? `<span class="admin-tag">Destaque</span>` : ""}
                    ${produto.aparecer_home ? `<span class="admin-tag">Home</span>` : ""}
                    ${produto.esgotado ? `<span class="admin-tag admin-tag-esgotado">Esgotado</span>` : ""}
                    ${produto.tem_tamanho ? `<span class="admin-tag">Tamanhos</span>` : ""}
                    ${imagens.length ? `<span class="admin-tag">${imagens.length} foto(s)</span>` : ""}
                </div>
            </div>

            <div class="admin-item-actions">
                <button type="button" class="btn-editar" data-id="${produto.id}">
                    Editar
                </button>

                <button type="button" class="btn-excluir" data-id="${produto.id}">
                    Excluir
                </button>
            </div>
        `;

        listaProdutosAdmin.appendChild(div);
    });

    ativarAcoesProdutosAdmin();
}

function ativarAcoesProdutosAdmin(){
    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", () => editarProduto(Number(btn.dataset.id)));
    });

    document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.addEventListener("click", () => excluirProduto(Number(btn.dataset.id)));
    });
}

function pegarTamanhosSelecionados(){
    return [...document.querySelectorAll('input[name="tamanho"]:checked')]
        .map(input => input.value);
}

function limparFormProduto(){
    formProduto.reset();
    produtoId.value = "";
    tituloFormProduto.textContent = "Adicionar produto";
    ativoProduto.checked = true;
    destaqueProduto.checked = false;
    homeProduto.checked = false;
    esgotadoProduto.checked = false;
    uploadImagensProduto.value = "";
    nomeArquivos.textContent = "Nenhuma foto selecionada";
}

async function comprimirImagem(arquivo, qualidade = 0.75, larguraMaxima = 1200){
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = event => {
            img.src = event.target.result;
        };

        img.onload = () => {
            const canvas = document.createElement("canvas");

            let largura = img.width;
            let altura = img.height;

            if(largura > larguraMaxima){
                altura = Math.round((altura * larguraMaxima) / largura);
                largura = larguraMaxima;
            }

            canvas.width = largura;
            canvas.height = altura;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, largura, altura);

            canvas.toBlob(blob => {
                if(!blob){
                    reject("Erro ao comprimir imagem.");
                    return;
                }

                const imagemComprimida = new File(
                    [blob],
                    arquivo.name.replace(/\.[^/.]+$/, ".webp"),
                    { type: "image/webp" }
                );

                resolve(imagemComprimida);
            }, "image/webp", qualidade);
        };

        img.onerror = () => reject("Erro ao carregar imagem.");
        reader.onerror = () => reject("Erro ao ler imagem.");

        reader.readAsDataURL(arquivo);
    });
}

async function salvarProduto(event){
    event.preventDefault();

    const tamanhos = pegarTamanhosSelecionados();
    const temTamanho = tamanhos.length > 0;

    const payload = {
        nome: nomeProduto.value.trim(),
        preco: Number(precoProduto.value),
        descricao: descricaoProduto.value.trim(),
        categoria_id: Number(categoriaProduto.value),
        ativo: ativoProduto.checked,
        destaque: destaqueProduto.checked,
        aparecer_home: homeProduto.checked,
        esgotado: esgotadoProduto.checked,
        tem_tamanho: temTamanho
    };

    if(!payload.nome || !payload.preco || !payload.categoria_id){
        mostrarToast("Preencha nome, preço e categoria.");
        return;
    }

    let idProdutoSalvo = produtoId.value ? Number(produtoId.value) : null;

    if(idProdutoSalvo){
        const { error } = await supabaseClient
            .from("produtos")
            .update(payload)
            .eq("id", idProdutoSalvo);

        if(error){
            console.error(error);
            mostrarToast("Erro ao atualizar produto.");
            return;
        }
    }else{
        const { data, error } = await supabaseClient
            .from("produtos")
            .insert(payload)
            .select("id")
            .single();

        if(error){
            console.error(error);
            mostrarToast("Erro ao criar produto.");
            return;
        }

        idProdutoSalvo = data.id;
    }

    await salvarImagensProduto(idProdutoSalvo);
    await salvarTamanhosProduto(idProdutoSalvo, tamanhos);

    limparFormProduto();
    await carregarProdutosAdmin();

    mostrarToast("Produto salvo com sucesso.");
}

async function salvarImagensProduto(idProdutoSalvo){
    const urlsDigitadas = imagensProduto.value
        .split("\n")
        .map(url => url.trim())
        .filter(Boolean);

    const arquivos = [...uploadImagensProduto.files];
    const urlsUpload = [];

    for(const arquivo of arquivos){
        try{
            const arquivoComprimido = await comprimirImagem(arquivo);

            const nomeArquivo = `${idProdutoSalvo}/${Date.now()}-${crypto.randomUUID()}.webp`;

            const { error: uploadError } = await supabaseClient.storage
                .from("produtos")
                .upload(nomeArquivo, arquivoComprimido, {
                    contentType: "image/webp",
                    upsert: false
                });

            if(uploadError){
                console.error(uploadError);
                mostrarToast("Erro ao enviar imagem.");
                continue;
            }

            const { data } = supabaseClient.storage
                .from("produtos")
                .getPublicUrl(nomeArquivo);

            urlsUpload.push(data.publicUrl);

        }catch(erro){
            console.error(erro);
            mostrarToast("Erro ao processar imagem.");
        }
    }

    const urls = [...urlsDigitadas, ...urlsUpload];

    await supabaseClient
        .from("produto_imagens")
        .delete()
        .eq("produto_id", idProdutoSalvo);

    if(!urls.length) return;

    const imagensPayload = urls.map((url, index) => ({
        produto_id: idProdutoSalvo,
        imagem_url: url,
        principal: index === 0,
        ordem: index
    }));

    const { error } = await supabaseClient
        .from("produto_imagens")
        .insert(imagensPayload);

    if(error){
        console.error(error);
        mostrarToast("Produto salvo, mas houve erro nas imagens.");
        return;
    }

    imagensProduto.value = urls.join("\n");
    uploadImagensProduto.value = "";
}

async function salvarTamanhosProduto(idProdutoSalvo, tamanhos){
    await supabaseClient
        .from("produto_tamanhos")
        .delete()
        .eq("produto_id", idProdutoSalvo);

    if(!tamanhos.length) return;

    const tamanhosPayload = tamanhos.map(tamanho => ({
        produto_id: idProdutoSalvo,
        tamanho,
        ativo: true
    }));

    const { error } = await supabaseClient
        .from("produto_tamanhos")
        .insert(tamanhosPayload);

    if(error){
        console.error(error);
        mostrarToast("Produto salvo, mas houve erro nos tamanhos.");
    }
}

function editarProduto(id){
    const produto = produtosAdmin.find(item => item.id === id);

    if(!produto) return;

    produtoId.value = produto.id;
    tituloFormProduto.textContent = "Editar produto";

    nomeProduto.value = produto.nome;
    precoProduto.value = produto.preco;
    categoriaProduto.value = produto.categoria_id || "";
    descricaoProduto.value = produto.descricao || "";

    ativoProduto.checked = produto.ativo;
    destaqueProduto.checked = produto.destaque;
    homeProduto.checked = produto.aparecer_home;
    esgotadoProduto.checked = produto.esgotado === true;

    const imagensOrdenadas = [...(produto.produto_imagens || [])]
        .sort((a, b) => {
            if(a.principal) return -1;
            if(b.principal) return 1;
            return (a.ordem || 0) - (b.ordem || 0);
        });

    imagensProduto.value = imagensOrdenadas
        .map(img => img.imagem_url)
        .join("\n");

    document.querySelectorAll('input[name="tamanho"]').forEach(input => {
        input.checked = false;
    });

    (produto.produto_tamanhos || []).forEach(item => {
        const checkbox = document.querySelector(`input[name="tamanho"][value="${item.tamanho}"]`);
        if(checkbox && item.ativo){
            checkbox.checked = true;
        }
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function excluirProduto(id){
    abrirConfirmacao("Tem certeza que quer excluir esse produto?", async () => {
        const { error } = await supabaseClient
            .from("produtos")
            .delete()
            .eq("id", id);

        if(error){
            console.error(error);
            mostrarToast("Erro ao excluir produto.");
            return;
        }

        await carregarProdutosAdmin();
        mostrarToast("Produto excluído.");
    });
}

/* CUPONS */
async function carregarCuponsAdmin(){
    listaCuponsAdmin.innerHTML = `<p class="admin-empty">Carregando cupons...</p>`;

    const { data, error } = await supabaseClient
        .from("cupons")
        .select("*")
        .order("criado_em", { ascending: false });

    if(error){
        console.error(error);
        listaCuponsAdmin.innerHTML = `<p class="admin-empty">Erro ao carregar cupons.</p>`;
        return;
    }

    cuponsAdmin = data || [];
    renderizarCuponsAdmin();
}

function renderizarCuponsAdmin(){
    if(!cuponsAdmin.length){
        listaCuponsAdmin.innerHTML = `<p class="admin-empty">Nenhum cupom cadastrado.</p>`;
        return;
    }

    listaCuponsAdmin.innerHTML = "";

    cuponsAdmin.forEach(cupom => {
        const div = document.createElement("article");
        div.className = "admin-item";

        const valor =
            cupom.tipo === "porcentagem"
            ? `${Number(cupom.valor)}%`
            : formatarPreco(cupom.valor);

        div.innerHTML = `
            <div class="admin-item-img">
                <img src="./assets/img/logo.png" alt="Cupom">
            </div>

            <div class="admin-item-info">
                <h3>${cupom.codigo}</h3>
                <p>${valor} • ${cupom.tipo === "porcentagem" ? "Porcentagem" : "Valor fixo"}</p>

                <div class="admin-item-tags">
                    ${cupom.ativo ? `<span class="admin-tag">Ativo</span>` : `<span class="admin-tag">Inativo</span>`}
                    ${cupom.validade ? `<span class="admin-tag">Até ${cupom.validade}</span>` : `<span class="admin-tag">Sem validade</span>`}
                </div>
            </div>

            <div class="admin-item-actions">
                <button type="button" class="btn-editar-cupom btn-editar" data-id="${cupom.id}">
                    Editar
                </button>

                <button type="button" class="btn-excluir-cupom btn-excluir" data-id="${cupom.id}">
                    Excluir
                </button>
            </div>
        `;

        listaCuponsAdmin.appendChild(div);
    });

    ativarAcoesCuponsAdmin();
}

function ativarAcoesCuponsAdmin(){
    document.querySelectorAll(".btn-editar-cupom").forEach(btn => {
        btn.addEventListener("click", () => editarCupom(Number(btn.dataset.id)));
    });

    document.querySelectorAll(".btn-excluir-cupom").forEach(btn => {
        btn.addEventListener("click", () => excluirCupom(Number(btn.dataset.id)));
    });
}

function limparFormCupom(){
    formCupom.reset();
    cupomId.value = "";
    tituloFormCupom.textContent = "Adicionar cupom";
    ativoCupom.checked = true;
    tipoCupom.value = "porcentagem";
}

async function salvarCupom(event){
    event.preventDefault();

    const payload = {
        codigo: codigoCupom.value.trim().toUpperCase(),
        tipo: tipoCupom.value,
        valor: Number(valorCupom.value),
        validade: validadeCupom.value || null,
        ativo: ativoCupom.checked
    };

    if(!payload.codigo || !payload.valor){
        mostrarToast("Preencha código e valor.");
        return;
    }

    if(cupomId.value){
        const { error } = await supabaseClient
            .from("cupons")
            .update(payload)
            .eq("id", Number(cupomId.value));

        if(error){
            console.error(error);
            mostrarToast("Erro ao atualizar cupom.");
            return;
        }
    }else{
        const { error } = await supabaseClient
            .from("cupons")
            .insert(payload);

        if(error){
            console.error(error);
            mostrarToast("Erro ao criar cupom. Talvez o código já exista.");
            return;
        }
    }

    limparFormCupom();
    await carregarCuponsAdmin();

    mostrarToast("Cupom salvo com sucesso.");
}

function editarCupom(id){
    const cupom = cuponsAdmin.find(item => item.id === id);

    if(!cupom) return;

    cupomId.value = cupom.id;
    tituloFormCupom.textContent = "Editar cupom";

    codigoCupom.value = cupom.codigo;
    tipoCupom.value = cupom.tipo;
    valorCupom.value = cupom.valor;
    validadeCupom.value = cupom.validade || "";
    ativoCupom.checked = cupom.ativo;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function excluirCupom(id){
    abrirConfirmacao("Tem certeza que quer excluir esse cupom?", async () => {
        const { error } = await supabaseClient
            .from("cupons")
            .delete()
            .eq("id", id);

        if(error){
            console.error(error);
            mostrarToast("Erro ao excluir cupom.");
            return;
        }

        await carregarCuponsAdmin();
        mostrarToast("Cupom excluído.");
    });
}


/* EVENTOS */
formProduto.addEventListener("submit", salvarProduto);
btnLimparProduto.addEventListener("click", limparFormProduto);
btnRecarregarProdutos.addEventListener("click", carregarProdutosAdmin);

formCupom.addEventListener("submit", salvarCupom);
btnLimparCupom.addEventListener("click", limparFormCupom);
btnRecarregarCupons.addEventListener("click", carregarCuponsAdmin);

document.addEventListener("DOMContentLoaded", async () => {
    await carregarCategoriasAdmin();
    await carregarProdutosAdmin();
    await carregarCuponsAdmin();
});

const btnLogout = document.querySelector("#btnLogout");

if(btnLogout){
    btnLogout.addEventListener("click", async () => {

        await supabaseClient.auth.signOut();

        localStorage.removeItem("adminLogado");

        window.location.replace("login.html");
    });
}