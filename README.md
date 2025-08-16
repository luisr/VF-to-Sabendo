# To Sabendo - Gerenciador de Projetos com IA (Versão Refatorada)

Bem-vindo ao **To Sabendo**, um gerenciador de projetos de código aberto construído com Next.js, Supabase e Tailwind CSS. Esta versão é o resultado de uma refatoração completa, focada em simplicidade, robustez e manutenibilidade.

## Visão Geral

Este projeto é uma plataforma completa para gestão de projetos e análise inteligente, com funcionalidades que incluem:
- **Gestão de Projetos e Tarefas:** Crie e gerencie projetos, tarefas e subtarefas.
- **Colaboração em Equipe:** Adicione colaboradores aos projetos.
- **Segurança Robusta:** Utiliza uma arquitetura de Row Level Security (RLS) com funções `SECURITY DEFINER` para garantir o acesso seguro aos dados sem problemas de recursão.
- **Autenticação Integrada:** Gerenciamento de usuários via Supabase Auth.
- **Análise Inteligente no Painel de BI:** Recursos de IA integrados ao painel de Business Intelligence oferecem insights automatizados e auxiliam no planejamento.
- **Gráficos Nivo:** os componentes de visualização utilizam a biblioteca [Nivo](https://nivo.rocks/) e são carregados dinamicamente no lado do cliente.

## Setup e Instalação (O Processo Definitivo)

O processo de setup foi consolidado para ser o mais simples e à prova de erros possível, utilizando um script de limpeza e um de construção.

### Pré-requisitos
- Conta no [Supabase](https://supabase.com)
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/)

### Passo 1: Configurar o Projeto Supabase
1.  **Crie um Projeto:** No seu [painel do Supabase](https://supabase.com/dashboard/projects), crie um novo projeto.
2.  **Obtenha as Credenciais:** Em **Project Settings > API**, copie a **Project URL** e a chave **`anon` public**.

### Passo 2: Configurar o Ambiente Local
1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/seu-usuario/to-sabendo.git
    cd to-sabendo
    ```
2.  **Instale as Dependências:**
    ```bash
    npm install
    ```
3.  **Configure as Variáveis de Ambiente:**
    - Crie um ficheiro `.env.local` na raiz do projeto.
    - Adicione as suas credenciais do Supabase:
      ```env
      NEXT_PUBLIC_SUPABASE_URL=SUA_PROJECT_URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
      ```

### Configuração do Twilio
1.  **Crie uma Conta:** Acesse o [painel do Twilio](https://www.twilio.com/console) e registre-se.
2.  **Obtenha as Credenciais:** No painel, em **Account Info**, copie o `Account SID` e o `Auth Token`.
3.  **Número de Origem do WhatsApp:** Utilize um número de WhatsApp fornecido pelo Twilio (sandbox ou número habilitado) e copie-o com o prefixo `whatsapp:`.
4.  **Adicione ao `.env.local`:**
    ```env
    TWILIO_ACCOUNT_SID=SEU_ACCOUNT_SID
    TWILIO_AUTH_TOKEN=SEU_AUTH_TOKEN
    TWILIO_WHATSAPP_FROM=whatsapp:+5511999999999
    ```

### Passo 3: Criar o seu Usuário Principal
1.  No painel do seu projeto Supabase, vá para **Authentication**.
2.  Clique em **"Add user"** e crie um usuário com o seu email e uma senha.
3.  **IMPORTANTE:** Clique no usuário que você acabou de criar e, na secção "User Details", **copie o `ID` do usuário**.

### Passo 4: Configurar o Banco de Dados (O Processo de 2 Cliques)
Toda a configuração do banco de dados foi consolidada em dois scripts principais.

1.  **Limpe o Banco de Dados (`teardown.sql`):**
    - No painel do Supabase, vá para o **SQL Editor**.
    - Abra o ficheiro `supabase/teardown.sql` no seu projeto local.
    - Copie todo o conteúdo, cole no SQL Editor e clique em **"Run"**. Isto garante que o seu banco de dados esteja limpo antes da configuração.

2.  **Construa e Popule o Banco de Dados (`setup.sql`):**
    - No ficheiro `supabase/setup.sql`, na `PART 5: SEED DATA`, **substitua o ID de usuário de exemplo** pelo **seu próprio ID de usuário** que você copiou no Passo 3.
    - Volte ao SQL Editor no Supabase.
    - Copie todo o conteúdo do ficheiro `supabase/setup.sql` (já com o seu ID).
    - Cole no editor e clique em **"Run"**.

Pronto! O seu banco de dados está configurado, as políticas de segurança estão ativas, e a sua conta de usuário já está associada a um projeto de exemplo com tarefas de demonstração.

### Passo 5: Executar a Aplicação
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000), faça login com o usuário que você criou, e comece a usar o To Sabendo.

### Script utilitário para testar Supabase

Um script opcional está disponível em `scripts/temp_get_data.js` para testar chamadas RPC no Supabase.

1. Certifique-se de que as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estejam definidas no `.env.local`.
2. Execute o script:

```bash
node scripts/temp_get_data.js
```

O script exibirá no terminal os utilizadores existentes e tentará carregar os projetos associados.
