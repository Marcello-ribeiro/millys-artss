import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

function escaparHTML(texto = "") {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

app.post("/chat", async (req, res) => {
    try {
        const { message, siteContext } = req.body;

        const contextoDoSite =
            siteContext || "Nenhuma informação do site foi enviada.";

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
- Nunca diga que pedido foi realizado
- Nunca diga que pedido foi enviado
- Nunca invente preços
- Nunca invente produtos
- Nunca invente estoque
- Nunca invente entrega
- Responda curto
- Seja simpática
- Sempre em português

LOJA:
- Milly's Arts
- Presentes personalizados
- Atendimento pelo WhatsApp
- Instagram: @millysarts
- WhatsApp: +55 (82)99101-6562

PRODUTOS:
- Use primeiro os produtos reais encontrados no texto do site
- Se não tiver informação suficiente, fale de forma geral

QUANDO O CLIENTE QUISER FINALIZAR:
so mostre o botão de finalizar no WhatsApp se o cliente já tiver mencionado o nome do produto que deseja comprar.
 Se ele mencionar o nome do produto, responda:
"Perfeito 😊 Clique no botão abaixo para finalizar no WhatsApp."
Se ele não tiver mencionado o nome do produto, responda:
"Me diga qual produto você deseja, por favor 😊"
e sugira alguns produtos com base no texto do site,
 se tiver informação suficiente para isso. Se não tiver,
  responda de forma simpática, sem sugerir produtos.

TEXTO REAL DO SITE:
${contextoDoSite}
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

        res.json({ reply });

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

    if (error) {
        console.log("ERRO SUPABASE LOGS:", error);

        return res.status(500).send(`
            <pre style="font-family:Arial; padding:20px;">
Erro ao carregar logs:

${JSON.stringify(error, null, 2)}
            </pre>
        `);
    }

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
                            ${new Date(log.created_at).toLocaleString("pt-BR")}
                        </span>
                    </div>

                    <div class="pergunta-box">
                        <h3>PERGUNTA DO CLIENTE</h3>
                        <p>${escaparHTML(log.pergunta)}</p>
                    </div>

                    <div class="resposta-box">
                        <h3>RESPOSTA DA MILLY</h3>
                        <p>${escaparHTML(log.resposta)}</p>
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
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Logs IA | Milly's Arts</title>

    <style>
        *{
            margin:0;
            padding:0;
            box-sizing:border-box;
            font-family:Arial, sans-serif;
        }

        body{
            min-height:100vh;
            background:#0f0f0f;
            color:white;
            padding:35px;
        }

        .topo{
            background:linear-gradient(135deg,#171717,#262626);
            padding:35px;
            border-radius:24px;
            margin-bottom:30px;
            border:1px solid #303030;
        }

        .topo h1{
            font-size:42px;
            margin-bottom:10px;
            color:#ffffff;
        }

        .topo p{
            color:#a3a3a3;
            font-size:16px;
        }

        .stats{
            background:#171717;
            border:1px solid #303030;
            padding:25px;
            border-radius:20px;
            margin-bottom:20px;
        }

        .stats h2{
            font-size:45px;
            color:#60a5fa;
        }

        .stats p{
            color:#a3a3a3;
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
            background:#171717;
            border:1px solid #303030;
            border-radius:24px;
            padding:25px;
            margin-bottom:25px;
        }

        .log-topo{
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:20px;
            gap:15px;
        }

        .cliente{
            color:#60a5fa;
            font-weight:800;
            font-size:18px;
        }

        .data{
            color:#737373;
            font-size:13px;
        }

        .pergunta-box{
            background:linear-gradient(135deg,#1f1f1f,#2a2a2a);
            border:1px solid #3a3a3a;
            padding:20px;
            border-radius:18px;
            margin-top:15px;
        }

        .resposta-box{
            background:linear-gradient(135deg,#111827,#1e293b);
            border:1px solid #334155;
            padding:20px;
            border-radius:18px;
            margin-top:15px;
        }

        .pergunta-box h3{
            font-size:13px;
            margin-bottom:14px;
            color:#d4d4d4;
            letter-spacing:1px;
        }

        .resposta-box h3{
            font-size:13px;
            margin-bottom:14px;
            color:#60a5fa;
            letter-spacing:1px;
        }

        .pergunta-box p{
            line-height:1.8;
            color:#ffffff;
            font-size:16px;
            font-weight:500;
            white-space:pre-wrap;
        }

        .resposta-box p{
            line-height:1.8;
            color:#dbeafe;
            font-size:16px;
            font-weight:500;
            white-space:pre-wrap;
        }

        .sem-logs{
            background:#171717;
            border:1px solid #303030;
            padding:30px;
            border-radius:20px;
            text-align:center;
            color:#888;
        }

        @media(max-width:700px){
            body{
                padding:16px;
            }

            .topo h1{
                font-size:30px;
            }

            .log-topo{
                flex-direction:column;
                align-items:flex-start;
            }
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
            const confirmar = confirm("Deseja apagar todos os logs?");

            if (!confirmar) return;

            await fetch("/limpar-logs?senha=millyadmin123", {
                method:"DELETE"
            });

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