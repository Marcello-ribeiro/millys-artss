import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({
  limit: "1mb"
}));

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post("/chat", async (req, res) => {

  try {

    const { message, siteContext } = req.body;

    const contextoDoSite =
      siteContext ||
      "Nenhuma informação do site foi enviada.";

    const resposta = await groq.chat.completions.create({

      model: "llama-3.1-8b-instant",

      messages: [

        {
          role: "system",

          content: `

Você é Milly, a assistente virtual oficial da loja Milly's Arts.

REGRAS:
- Seu nome SEMPRE é Milly
- Nunca diga que é IA
- Nunca fale sobre tecnologia
- Sempre responda em português
- Seja simpática, curta e profissional
- Nunca invente informações

SOBRE A LOJA:
- Loja de presentes personalizados
- Produtos feitos com carinho
- Atendimento pelo WhatsApp
- Instagram: @millysarts
- WhatsApp: (82) 99101-6562

PRODUTOS:
- Use os produtos reais encontrados no texto do site abaixo
- Nunca invente produtos

SE NÃO SOUBER:
"Por favor, entre em contato pelo WhatsApp 😊"

TEXTOS DOS CLIENTES:
- tente entender perguntas com erros de digitação
- responda de forma amigável
- use alguns emojis sem exagerar

- Nunca diga que está enviando pedido pelo WhatsApp
- Nunca diga que o pedido será entregue
- Quando o cliente quiser finalizar, diga apenas: "Perfeito! Para finalizar com segurança,
 clique no botão abaixo e fale conosco pelo WhatsApp 😊"

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

    const reply =
      resposta.choices[0].message.content;

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

app.get("/logs", async (req, res) => {

  const senha = req.query.senha;

  if (senha !== "millyadmin123") {

    return res.status(401).send(`

      <html>

        <body style="
          background:#111;
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

  const logsHtml = data.map(log => `

    <div class="log-card">

      <div class="log-header">

        <div class="cliente">
          Cliente
        </div>

        <div class="data">
          ${new Date(log.created_at).toLocaleString("pt-BR")}
        </div>

      </div>

      <div class="box pergunta">

        <div class="titulo">
          Pergunta
        </div>

        <p>
          ${log.pergunta || ""}
        </p>

      </div>

      <div class="box resposta">

        <div class="titulo">
          Resposta da Milly
        </div>

        <p>
          ${log.resposta || ""}
        </p>

      </div>

    </div>

  `).join("");

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
}

body{

  min-height:100vh;

  background:
  linear-gradient(
    135deg,
    #fff3fc,
    #f4ddff
  );

  font-family:Arial,sans-serif;

  color:#2c1338;

  padding:25px;
}

.container{

  max-width:1200px;

  margin:auto;
}

.header{

  background:
  linear-gradient(
    135deg,
    #ff67c8,
    #9333ea
  );

  color:white;

  padding:30px;

  border-radius:24px;

  margin-bottom:25px;

  box-shadow:
  0 15px 45px rgba(147,51,234,.25);
}

.header h1{

  font-size:32px;

  margin-bottom:10px;
}

.header p{

  opacity:.9;
}

.stats{

  display:grid;

  grid-template-columns:
  repeat(auto-fit,minmax(200px,1fr));

  gap:15px;

  margin-bottom:25px;
}

.stat{

  background:white;

  padding:20px;

  border-radius:18px;

  box-shadow:
  0 10px 25px rgba(0,0,0,.06);
}

.stat h2{

  color:#9333ea;

  font-size:28px;

  margin-bottom:5px;
}

.log-card{

  background:white;

  border-radius:22px;

  padding:22px;

  margin-bottom:20px;

  box-shadow:
  0 12px 30px rgba(0,0,0,.08);

  border:
  1px solid rgba(217,70,196,.12);
}

.log-header{

  display:flex;

  justify-content:space-between;

  align-items:center;

  gap:10px;

  margin-bottom:18px;
}

.cliente{

  font-weight:700;

  color:#9333ea;
}

.data{

  font-size:13px;

  color:#7c6585;
}

.box{

  padding:16px;

  border-radius:16px;

  margin-top:12px;

  line-height:1.6;
}

.titulo{

  font-size:13px;

  font-weight:700;

  margin-bottom:8px;

  text-transform:uppercase;

  letter-spacing:.5px;
}

.pergunta{

  background:#fff0fa;

  border:1px solid #ffd1f2;
}

.resposta{

  background:#f6efff;

  border:1px solid #e7d2ff;
}

.empty{

  background:white;

  padding:35px;

  border-radius:22px;

  text-align:center;

  color:#7c6585;
}

::-webkit-scrollbar{
  width:8px;
}

::-webkit-scrollbar-thumb{
  background:#d946ef;
  border-radius:20px;
}

@media(max-width:700px){

  body{
    padding:14px;
  }

  .header h1{
    font-size:25px;
  }

  .log-header{
    flex-direction:column;
    align-items:flex-start;
  }

}

</style>

</head>

<body>

<div class="container">

  <div class="header">

    <h1>
      Logs da IA
    </h1>

    <p>
      Perguntas dos clientes e respostas da Milly.
    </p>

  </div>

  <div class="stats">

    <div class="stat">

      <h2>
        ${data.length}
      </h2>

      <p>
        Total de mensagens
      </p>

    </div>

  </div>

  ${
    data.length > 0
    ? logsHtml
    : `
      <div class="empty">
        Nenhum log encontrado.
      </div>
    `
  }

</div>

</body>

</html>

  `);

});

app.listen(3000, () => {

  console.log(
    "Servidor rodando em http://localhost:3000"
  );

});