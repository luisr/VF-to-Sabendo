# Registo de Interação e Depuração do Projeto "To Sabendo"

Este documento resume a jornada de depuração e refatoração colaborativa para estabilizar e limpar a base de código do projeto.

## 1. Problema Inicial Identificado

- **Erro:** O usuário reportou um erro `column "dependencies" of relation "tasks" does not exist` ao tentar atualizar tarefas.
- **Diagnóstico:** Identificámos uma inconsistência entre as migrações do Supabase (que removeram a coluna `dependencies`) e o código da aplicação/funções RPC (que ainda a tentavam usar).

## 2. A Descoberta da Complexidade

- **Análise:** Ao investigar, descobrimos uma grande quantidade de funções de base de dados duplicadas, legadas e com nomes inconsistentes, bem como tabelas redundantes (`users`, `user_profiles`, `collaborators`, `project_collaborators`).
- **Decisão Estratégica:** Em vez de fazer pequenos remendos, optámos por uma refatoração completa para limpar a dívida técnica.

## 3. A Saga da "Master Migration"

Foi criado um plano para executar uma grande migração que iria:
1.  Unificar as tabelas de usuários e colaboradores.
2.  Remover tabelas e funções legadas.
3.  Implementar uma lógica centralizada para a gestão de tarefas (`manage_task`).

A criação desta migração passou por várias iterações para corrigir erros sucessivos:
- **v2.1:** Corrigido um erro de sintaxe com nomes de funções que continham hifens (`--`).
- **v2.2:** Corrigido um erro `relation "public.profiles" does not exist` ao garantir que a tabela `profiles` era criada antes de ser usada.
- **v2.3:** Corrigido um erro de "planner" do PostgreSQL ao usar SQL dinâmico (`EXECUTE`) para a migração de dados.
- **v3.0 (Final da Master Migration):** Corrigido um erro de dependência ao criar os `ENUMs` (`task_priority`) antes de qualquer tabela que os utilizasse. **Esta foi a versão que funcionou.**

## 4. A Fase de "Seed" e Reparação do Frontend

- **Problema Pós-Migração:** A aplicação quebrou porque o banco de dados estava vazio e o frontend ainda usava código antigo.
- **Script de Seed:** Criámos um script (`0023`) para popular o banco com dados essenciais (status, tags, um projeto de teste e o usuário principal). Este script também passou por iterações para garantir a sua robustez.
- **Reparação dos Hooks:** Começámos a consertar a aplicação, um hook de cada vez:
    - `use-tasks.tsx` (a causa original do problema)
    - A página de Login (`login/page.tsx`)
    - `use-users.tsx`
    - `use-dashboard-preferences.tsx`
    - `use-table-settings.tsx`
    - `use-projects.tsx`

## 5. A "Caça aos Fantasmas" Final (Estado Atual)

- **Problema Atual:** Após consertar os hooks principais, a aplicação começou a revelar a ausência de várias funções de leitura de dados que foram eliminadas na limpeza inicial, mas que são necessárias para os componentes do dashboard e outras páginas.
- **Erros Identificados:** `get_my_projects_details`, `get_recent_tasks`, `get_overview_chart_data`, e agora `get_all_user_tasks`, `get_tasks_for_project`, e `get_bi_data`.
- **Estratégia Atual:** Recriar estas funções de leitura em migrações pequenas e focadas para restaurar a funcionalidade completa da aplicação.

---
Este registo serve como memória do nosso processo.
