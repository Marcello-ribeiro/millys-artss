# Milly's Arts

Loja virtual de presentes personalizados: buquês, lembranças, quadros, chaveiros e outros presentes feitos com carinho.

## Recursos

- Página inicial com destaques e produtos mais vendidos
- Catálogo de produtos e página de cada produto
- Carrinho de compras
- Login e painel administrativo (`admin.html`)
- Assistente de chat com IA, servido pelo backend (`/chat`)
- Back-end em Node.js com Express

## Tecnologias

- HTML, CSS e JavaScript no front-end
- Node.js e Express no servidor
- Supabase
- Groq SDK (chat com IA)

## Rodando localmente

Requisitos: [Node.js](https://nodejs.org) instalado.

```bash
git clone https://github.com/Marcello-ribeiro/millys-artss.git
cd millys-artss
npm install
```

Crie um arquivo `.env` na raiz com as suas chaves (ele **não** é versionado, está no `.gitignore`):

```env
SUPABASE_URL=
SUPABASE_KEY=
GROQ_API_KEY=
```

Depois inicie o servidor:

```bash
npm start
```

O servidor sobe em http://localhost:3000.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `index.html`, `produtos.html`, `produto.html`, `carrinho.html` | Páginas da loja |
| `login.html`, `admin.html` | Acesso e administração |
| `server.js` | Servidor Express |
| `css/`, `js/`, `assets/` | Estilos, scripts e imagens |
