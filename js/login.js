const formLogin = document.querySelector("#formLogin");
const emailLogin = document.querySelector("#emailLogin");
const senhaLogin = document.querySelector("#senhaLogin");
const loginErro = document.querySelector("#loginErro");

async function verificarLoginExistente(){
    const { data } = await supabaseClient.auth.getSession();

    if(data.session){
        window.location.href = "admin.html";
    }
}

async function fazerLogin(event){
    event.preventDefault();

    loginErro.textContent = "";

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: emailLogin.value.trim(),
        password: senhaLogin.value
    });

   if(error){
    console.log("ERRO LOGIN:", error);
    loginErro.textContent = error.message;
    return;
}

    window.location.href = "admin.html";
}

formLogin.addEventListener("submit", fazerLogin);

document.addEventListener("DOMContentLoaded", verificarLoginExistente);