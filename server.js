import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

app.post("/chat", async (req, res) => {

    try {

        const { message } = req.body;

        const resposta = await groq.chat.completions.create({

            model: "llama-3.1-8b-instant",

            messages: [

                {
                    role: "system",
                    content: `

Você é Milly, atendente virtual da loja Milly's Arts.

REGRAS:
- Seu nome é Milly
- Nunca diga que é IA
- Nunca diga que pedido foi confirmado
- Nunca diga que pagamento foi aprovado
- Nunca invente preços
- Nunca invente produtos
- Nunca invente estoque
- Nunca invente entrega
- Responda curto
- Seja simpática
- Sempre em português

PRODUTOS:
- Polaroids
- Quadros
- Chaveiros
- Rosas
- Presentes personalizados

Quando o cliente quiser finalizar:
"Perfeito 😊 Clique no botão abaixo para finalizar no WhatsApp."

`
                },

                {
                    role: "user",
                    content: message
                }

            ]

        });

        const reply = resposta.choices[0].message.content;

        await supabase
            .from("ia_logs")
            .insert([
                {
                    pergunta: message,
                    resposta: reply
                }
            ]);

        res.json({
            reply
        });

    } catch (erro) {

        console.log(erro);

        res.status(500).json({
            error: "Erro na IA"
        });

    }

});

app.delete("/limpar-logs", async (req, res) => {

    const senha = req.query.senha;

    if (senha !== "millyadmin123") {

        return res.status(401).json({
            error: "Não autorizado"
        });

    }

    try {

        await supabase
            .from("ia_logs")
            .delete()
            .gt("id", 0);

        res.json({
            success: true
        });

    } catch (erro) {

        console.log(erro);

        res.status(500).json({
            error: "Erro ao limpar logs"
        });

    }

});

app.get("/logs", async (req, res) => {

    const senha = req.query.senha;

    if (senha !== "millyadmin123") {

        return res.send(`

        <html>

            <body style="
                background:#0f0f0f;
                color:white;
                display:flex;
                align-items:center;
                justify-content:center;
                height:100vh;
                font-family:Arial;
            ">

                <h1>Acesso negado</h1>

            </body>

        </html>

        `);

    }

    const { data, error } = await supabase
        .from("ia_logs")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    let htmlLogs = "";

    if (data && data.length > 0) {

        data.forEach(log => {

            htmlLogs += `

            <div class="log-card">

                <div class="log-topo">

                    <span class="cliente">
                        Cliente
                    </span>

                    <span class="data">
                        ${new Date(log.created_at).toLocaleString()}
                    </span>

                </div>

                <div class="pergunta-box">

                    <h3>PERGUNTA</h3>

                    <p>${log.pergunta}</p>

                </div>

                <div class="resposta-box">

                    <h3>RESPOSTA DA MILLY</h3>

                    <p>${log.resposta}</p>

                </div>

            </div>

            `;

        });

    } else {

        htmlLogs = `
            <div class="sem-logs">
                Nenhum log encontrado.
            </div>
        `;

    }

    res.send(`

    <html>

        <head>

            <title>Logs IA | Milly's Arts</title>

            <meta charset="UTF-8">

            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <style>

                *{
                    margin:0;
                    padding:0;
                    box-sizing:border-box;
                    font-family:Arial;
                }

                body{
                    background:#111;
                    color:white;
                    padding:35px;
                }

                .topo{
                    background:linear-gradient(90deg,#1b1b1b,#2a2a2a);
                    padding:35px;
                    border-radius:24px;
                    margin-bottom:30px;
                    border:1px solid #333;
                }

                .topo h1{
                    font-size:42px;
                    margin-bottom:10px;
                }

                .topo p{
                    color:#aaa;
                    font-size:16px;
                }

                .stats{
                    background:#1b1b1b;
                    border:1px solid #333;
                    padding:25px;
                    border-radius:20px;
                    margin-bottom:20px;
                }

                .stats h2{
                    font-size:45px;
                    color:#fff;
                }

                .stats p{
                    color:#aaa;
                    margin-top:5px;
                }

                .limpar-logs-btn{
                    background:#2c2c2c;
                    color:white;
                    border:none;
                    padding:14px 20px;
                    border-radius:14px;
                    cursor:pointer;
                    font-size:15px;
                    font-weight:700;
                    margin-bottom:25px;
                    transition:.2s;
                }

                .limpar-logs-btn:hover{
                    background:#3a3a3a;
                }

                .log-card{
                    background:#1a1a1a;
                    border:1px solid #333;
                    border-radius:24px;
                    padding:25px;
                    margin-bottom:25px;
                }

                .log-topo{
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:20px;
                }

                .cliente{
                    color:#fff;
                    font-weight:700;
                }

                .data{
                    color:#888;
                    font-size:14px;
                }

            .pergunta-box{

    background:linear-gradient(
        135deg,
        #1f1f1f,
        #2a2a2a
    );

    border:1px solid #3a3a3a;

    padding:20px;

    border-radius:18px;

    margin-top:15px;

}

.resposta-box{

    background:linear-gradient(
        135deg,
        #111827,
        #1e293b
    );

    border:1px solid #334155;

    padding:20px;

    border-radius:18px;

    margin-top:15px;

}

                .pergunta-box h3,
                .resposta-box h3{
                    font-size:14px;
                    margin-bottom:15px;
                    color:#bbb;
                }

                .pergunta-box p,
                .resposta-box p{
                    line-height:1.7;
                    color:#f1f1f1;
                }

                .sem-logs{
                    background:#1b1b1b;
                    border:1px solid #333;
                    padding:30px;
                    border-radius:20px;
                    text-align:center;
                    color:#888;
                }

            </style>

        </head>

        <body>

            <div class="topo">

                <h1>Logs da IA</h1>

                <p>Perguntas dos clientes e respostas da Milly.</p>

            </div>

            <div class="stats">

                <h2>${data?.length || 0}</h2>

                <p>Total de mensagens</p>

            </div>

            <button class="limpar-logs-btn" onclick="limparLogs()">
                Limpar Logs
            </button>

            ${htmlLogs}

            <script>

                async function limparLogs() {

                    const confirmar = confirm(
                        "Deseja apagar todos os logs?"
                    );

                    if (!confirmar) return;

                    await fetch(
                        "/limpar-logs?senha=millyadmin123",
                        {
                            method:"DELETE"
                        }
                    );

                    location.reload();

                }

            </script>

        </body>

    </html>

    `);

});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});