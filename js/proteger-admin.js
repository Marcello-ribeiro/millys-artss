async function protegerAdmin(){
    const { data, error } = await supabaseClient.auth.getSession();

    if(error || !data.session){
        window.location.href = "login.html";
        return;
    }
}

document.addEventListener("DOMContentLoaded", protegerAdmin);