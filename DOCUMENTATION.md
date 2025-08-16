# Documentação Técnica do Projeto "To Sabendo"

## Arquitetura do Banco de Dados

O banco de dados foi projetado para ser a única fonte da verdade, com uma estrutura normalizada e segura.

### Tabelas Principais
- `profiles`: Armazena os perfis públicos dos usuários, sincronizada com a `auth.users` do Supabase. É a tabela central para informações de usuários.
- `projects`: Contém os projetos, cada um com um `owner_id` que aponta para um perfil.
- `collaborators`: Tabela de junção que define a relação de muitos-para-muitos entre `projects` e `profiles`.
- `tasks`: A tabela principal para as tarefas, ligada a um `project_id`.
- `task_statuses` e `tags`: Tabelas de suporte para categorização.

## Arquitetura de Segurança (Row Level Security - RLS)

A segurança é um pilar deste projeto. Nós implementamos uma arquitetura de RLS robusta para garantir que os usuários só possam aceder aos dados que lhes pertencem.

### A Estratégia "Função Auxiliar"

Para evitar problemas de recursão infinita (onde uma política numa tabela `A` precisa de verificar uma tabela `B`, cuja política verifica a tabela `A`), nós usamos **funções auxiliares com `SECURITY DEFINER`**.

1.  **Funções Auxiliares:** Funções como `is_project_member(project_id, user_id)` são definidas com `SECURITY DEFINER`. Isto permite que elas sejam executadas com privilégios elevados, "contornando" a RLS da tabela que elas precisam de ler (ex: `collaborators`).
2.  **Verificação Explícita:** A segurança é garantida porque a primeira coisa que a função faz é verificar se o `user_id` passado como argumento corresponde ao `auth.uid()` (o usuário atualmente logado).
3.  **Políticas Simplificadas:** As políticas de RLS nas tabelas (`projects`, `tasks`, etc.) tornam-se muito mais simples e legíveis, pois elas apenas chamam estas funções auxiliares em vez de conterem subconsultas complexas.

**Exemplo:**
```sql
-- A política na tabela 'tasks' é simples:
CREATE POLICY "Allow task access to project members" ON public.tasks
  FOR ALL
  USING ( is_project_member(project_id, auth.uid()) );

-- A função auxiliar 'is_project_member' faz o trabalho pesado de forma segura:
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id AND p.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.collaborators c
    WHERE c.project_id = p_project_id AND c.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
Esta arquitetura é segura, eficiente e evita os erros de "recursão infinita" que podem acontecer com implementações de RLS mais ingénuas.

## Funções RPC (API do Banco de Dados)

A interação do frontend com o backend é feita principalmente através de Funções RPC (Remote Procedure Call).

- **`manage_project(...)`**: Ponto de entrada único para criar e atualizar projetos e os seus colaboradores.
- **`manage_task(...)`**: Ponto de entrada único para criar e atualizar tarefas, as suas tags e dependências.
- **`get_my_projects_details()`**: Busca todos os projetos associados ao usuário atual.
- **`get_tasks_for_project(project_id)`**: Busca todas as tarefas de um projeto específico.

 Todas as funções que modificam dados (`manage_...`) contêm verificações de segurança explícitas no seu interior, garantindo que um usuário não possa modificar dados de um projeto ao qual não pertence.

## Notificações de Tarefa

A aplicação inclui um utilitário chamado `sendTaskNotification` para enviar notificações sobre tarefas através de um provedor externo (e-mail, SMS, etc.). Para utilizá-lo:

1. Defina a variável de ambiente `NOTIFICATION_API_KEY` com a credencial do serviço de notificação escolhido.
2. Forneça um objeto provedor com um método `send(recipient, message)`.

Exemplo de uso:

```ts
await sendTaskNotification(provider, 'usuario@example.com', 'Nova tarefa atribuída');
```

O utilitário valida a presença da variável `NOTIFICATION_API_KEY` antes de enviar a mensagem.
