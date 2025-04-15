# Backend - App Mobile E-Commerce (UNIFACISA SI)

**Repositório:** [https://github.com/taavaresdiego/minhaLojaApp-backend](https://github.com/taavaresdiego/minhaLojaApp-backend)

## Descrição do Projeto

Este repositório contém o código-fonte do servidor backend para o aplicativo móvel de e-commerce desenvolvido na disciplina de Desenvolvimento de Aplicativos Móveis e IOT (2025.1) do curso de Sistemas de Informação da UNIFACISA.

**Este servidor fornece a API RESTful e os serviços de WebSocket necessários para o [projeto frontend correspondente (App Mobile E-Commerce)](Link-Para-O-Repositorio-Frontend-AQUI), que foi construído com React Native/Expo.**

O backend é construído com Node.js e Express, utilizando SQLite como banco de dados e fornece funcionalidades para autenticação de usuários, gerenciamento de produtos (leitura), criação de pedidos, e funcionalidades de chat (demonstração de IA com Gemini e chat live com Socket.IO).

## Tecnologias Utilizadas

- **Node.js:** Ambiente de execução JavaScript server-side.
- **Express.js:** Framework web minimalista para Node.js, usado para criar a API REST.
- **SQLite3:** Banco de dados SQL file-based (arquivo `database.db`). Biblioteca `sqlite3`.
- **Socket.IO:** Biblioteca para comunicação em tempo real (WebSockets) usada no chat live.
- **JSON Web Token (JWT):** Para autenticação de usuário baseada em token. Biblioteca `jsonwebtoken`.
- **bcrypt:** Para hashing seguro de senhas.
- **@google/generative-ai:** SDK oficial do Google para interagir com a API do Gemini (usado no chat com IA).
- **dotenv:** Para carregar variáveis de ambiente a partir de um arquivo `.env`.
- **nodemon:** Ferramenta para reiniciar automaticamente o servidor durante o desenvolvimento.
- **cors:** Middleware para habilitar Cross-Origin Resource Sharing.

## Funcionalidades / Endpoints da API

### API RESTful

- **Autenticação (`/api/auth`)**
  - `POST /register`: Registra um novo usuário. Body: `{ "nomeCompleto": "...", "cpf": "...", "email": "...", "senha": "..." }`.
  - `POST /login`: Autentica um usuário e retorna um token JWT e dados básicos do usuário. Body: `{ "email": "...", "senha": "..." }`.
- **Produtos (`/api/products`)**
  - `GET /`: Retorna a lista de produtos (Rota protegida por JWT - Requer Header `Authorization: Bearer <token>`).
- **Pedidos (`/api/orders`)**
  - `POST /`: Cria um novo pedido com base nos itens do carrinho (Rota protegida por JWT). Body: `{ "items": [{ "product": { "id": ..., "preco": ... }, "quantity": ... }, ...] }`.
- **Chat IA (`/api/chat`)**
  - `POST /ai`: Recebe uma mensagem do usuário, chama a API Gemini e retorna a resposta (Rota protegida por JWT). Body: `{ "message": "..." }`.

### WebSocket (Socket.IO) - Chat Live

- **Evento de Conexão:** `connection`, `disconnect`.
- **Receber Mensagem:** Ouve pelo evento `liveChatMessage` do cliente. Payload esperado: `{ senderId: '...', senderName: '...', text: '...' }`.
- **Enviar Mensagem:** Emite o evento `liveChatMessage` para os outros clientes conectados (broadcast). Payload enviado: `{ id: '...', senderId: '...', senderName: '...', text: '...', timestamp: ... }`.

## Pré-requisitos

- **Node.js (Versão LTS recomendada):** [https://nodejs.org/](https://nodejs.org/) (inclui npm).
- **npm** ou **Yarn:** Gerenciador de pacotes.
- **(Opcional) Cliente de API REST:** Postman, Insomnia ou similar para testar os endpoints REST.
- **(Opcional) DB Browser for SQLite:** Para inspecionar o banco de dados `database.db`. [https://sqlitebrowser.org/](https://sqlitebrowser.org/)
- **Chave de API do Google Gemini:** Necessária para a funcionalidade do Chat com IA. Obtenha em [Google AI Studio](https://aistudio.google.com/app/apikey).

## Configuração e Instalação

1.  **Clonar o Repositório (se aplicável):**

    ```bash
    git clone [https://github.com/taavaresdiego/minhaLojaApp-backend.git](https://github.com/taavaresdiego/minhaLojaApp-backend.git)
    cd minhaLojaApp-backend
    ```

    _Ou apenas navegue até a pasta existente do projeto backend._

2.  **Instalar Dependências:**

    ```bash
    npm install
    ```

3.  **Configurar Variáveis de Ambiente:**

    - Crie um arquivo chamado `.env` na raiz do projeto backend.
    - Adicione as seguintes variáveis ao `.env`, substituindo pelos seus valores:

      ```dotenv
      # Arquivo: .env

      # Chave secreta FORTE e ALEATÓRIA para assinar os tokens JWT
      JWT_SECRET=SuaChaveSuperSecretaParaJWT!TroquePorAlgoSeguro123$%

      # Sua chave de API obtida do Google AI Studio para usar o Gemini
      GEMINI_API_KEY=SUA_CHAVE_API_DO_GEMINI_AQUI

      # Porta onde o servidor vai rodar (opcional, padrão é 4000)
      # PORT=4000
      ```

    - **IMPORTANTE:** Adicione o arquivo `.env` ao seu `.gitignore`!

4.  **Banco de Dados:** O arquivo `database.db` e as tabelas (`Users`, `Products`, `Orders`, `OrderItems`) serão criados automaticamente na primeira vez que você iniciar o servidor. Dados iniciais (seed) para `Products` são inseridos se a tabela estiver vazia.

## Executando o Servidor

- **Modo de Desenvolvimento (com Nodemon):**

  ```bash
  npm run start:dev
  ```

  O servidor iniciará (geralmente em `http://localhost:4000`) e reiniciará automaticamente ao salvar arquivos `.js`.

- **Modo de Produção (Exemplo):**

  ```bash
  node server.js
  ```

- **Para Parar o Servidor:** Pressione `Ctrl + C` no terminal onde ele está rodando.

## Testando

- Use ferramentas como **Postman** ou **Insomnia** para enviar requisições HTTP para os endpoints da API REST listados acima.
- Lembre-se de obter um **token JWT** via `POST /api/auth/login` e incluí-lo no cabeçalho `Authorization: Bearer <token>` para acessar as rotas protegidas.
- Para testar o chat live (Socket.IO), você precisará de um cliente WebSocket compatível ou usar duas instâncias do aplicativo frontend conectado.

## Estrutura do Projeto Backend
