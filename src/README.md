# To Sabendo - Gestão de Projetos

Esta é uma aplicação de gestão de projetos construída com Next.js, TypeScript, Tailwind CSS, ShadCN UI, Supabase e Genkit para funcionalidades de IA.

## Configuração do Ambiente

Siga estes passos **exatamente na ordem correta** para evitar erros de banco de dados e autenticação. Se você já tentou configurar antes, **é altamente recomendável começar com um banco de dados limpo** (veja as instruções de limpeza no `supabase/schema.sql`).

### Passo 1: Configure as Variáveis de Ambiente

1.  No seu painel Supabase, vá para **Project Settings > API**.
2.  Copie o **Project URL** e a **Project API Key** (a chave `anon` `public`).
3.  No Google AI Studio (`https://aistudio.google.com/app/apikey`), crie e copie sua **API Key**.
4.  Crie um arquivo `.env` na raiz do projeto (ou renomeie `.env.example`).
5.  Adicione as chaves ao arquivo `.env`:
    ```
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL="SUA_URL_AQUI"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_AQUI"

    # Google AI (para Genkit)
    GEMINI_API_KEY="SUA_CHAVE_GEMINI_AQUI"
    ```

### Passo 2: Execute o Script de Schema

1.  Vá para a seção **SQL Editor** no seu painel Supabase.
2.  Abra uma **New query**. Copie todo o conteúdo do arquivo `supabase/schema.sql`, cole no editor e clique em **RUN**.
3.  Isso criará a estrutura do banco de dados (tabelas, tipos, políticas de segurança). O script é idempotente, então é seguro executá-lo várias vezes.

### Passo 3: Crie os Usuários na Autenticação do Supabase

1.  Vá para a seção **Authentication > Users** no seu painel Supabase.
2.  Clique em **Add user** e crie os três usuários abaixo. Use a senha que preferir (sugerimos `password123`).
    *   `admin@example.com`
    *   `gp@example.com`
    *   `membro@example.com`
3.  **Importante**: Após criar cada usuário, clique nele na lista para ver seus detalhes e **copie o `ID` (UUID)** de cada um. Você precisará deles no próximo passo.

### Passo 4: Edite e Execute o Script de Seed

1.  Abra o arquivo `supabase/seed.sql` no seu editor de código.
2.  No topo do arquivo, você verá as variáveis `admin_user_id`, `gp_user_id`, e `member_user_id`.
3.  **Cole os UUIDs** que você copiou do painel do Supabase nas variáveis correspondentes.
4.  Salve o arquivo.
5.  Volte para o **SQL Editor** no Supabase, abra uma nova query, copie todo o conteúdo do `seed.sql` atualizado e clique em **RUN**.
6.  Este script irá popular as tabelas com dados de exemplo (perfis de usuário, projetos, tarefas, etc.), agora corretamente vinculados aos usuários da autenticação. O script é idempotente e pode ser executado várias vezes.

### Passo 5: Configure a URL de Recuperação de Senha

1.  Em **Authentication** -> **URL Configuration**, defina o **Site URL** como `http://localhost:3000` (ou a porta que você estiver usando). Isso é crucial para que a recuperação de senha funcione.

## Como Executar

Após configurar o ambiente, siga os passos abaixo para rodar a aplicação localmente:

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

    A aplicação estará disponível em `http://localhost:3000`.

## Usuários de Exemplo

Use os emails abaixo e a senha que você definiu no passo 3 para fazer login:

-   **Admin**: `admin@example.com`
-   **Admin**: `gp@example.com`
-   **Membro**: `membro@example.com`
