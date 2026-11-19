// Detalhes visuais compartilhados: ano do rodapé, contador do carrinho
// e um leve efeito de profundidade na colagem do topo da página inicial.

(function(){
    document.querySelectorAll("[data-ano]").forEach(el => {
        el.textContent = new Date().getFullYear();
    });

    // deixa o contador do carrinho apagado quando está zerado
    const contador = document.querySelector("#cartCount");

    if(contador){
        const marcar = () => contador.classList.toggle("vazio", contador.textContent.trim() === "0");
        marcar();
        new MutationObserver(marcar).observe(contador, { childList: true, characterData: true, subtree: true });
    }

    const colagem = document.querySelector(".hero-colagem");
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = window.matchMedia("(pointer: fine)").matches;

    if(!colagem || reduzir || !mouse) return;

    colagem.querySelectorAll(".camada").forEach(el => {
        el.style.setProperty("--prof", (Number(el.dataset.prof) || 10) + "px");
    });

    const hero = colagem.closest(".hero") || colagem;
    let quadro = 0;

    hero.addEventListener("pointermove", evento => {
        cancelAnimationFrame(quadro);
        quadro = requestAnimationFrame(() => {
            const area = hero.getBoundingClientRect();
            const x = (evento.clientX - area.left) / area.width - .5;
            const y = (evento.clientY - area.top) / area.height - .5;
            colagem.style.setProperty("--mx", x.toFixed(3));
            colagem.style.setProperty("--my", y.toFixed(3));
        });
    });

    hero.addEventListener("pointerleave", () => {
        colagem.style.setProperty("--mx", 0);
        colagem.style.setProperty("--my", 0);
    });
})();
