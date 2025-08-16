# Roadmap de Evolução do Projeto "To Sabendo"

Este documento descreve os próximos passos para a evolução do projeto, com base nas funcionalidades solicitadas. Iremos marcar cada item como concluído à medida que avançamos.

---

## Fase 1: Funcionalidades Essenciais e Usabilidade

O objetivo desta fase é garantir que as funcionalidades centrais sejam robustas e que a experiência do usuário seja fluida.

- [x] **Revisar e Validar Fluxo de Projetos**
    - [x] Validar a criação de um novo projeto.
    - [x] Validar a edição de um projeto existente.
    - [x] Validar a gestão de colaboradores no modal de edição.

- [ ] **Implementar Gerenciador da Tabela**
    - [ ] Conectar o modal "Gerenciar Tabela" para permitir a criação, edição e exclusão de **Status**.
    - [ ] Adicionar a funcionalidade para gerir **Tags** no mesmo modal.

- [x] **Implementar Modal de Observações de Tarefas**
    - [x] Ligar o botão de "Observações" na linha da tarefa para abrir um modal.
    - [x] Permitir que os usuários adicionem comentários de texto a uma tarefa.
    - [x] Permitir o upload de ficheiros anexos às observações.

- [x] **Implementar Ordenação e Preferências da Tabela**
    - [x] Permitir que o usuário clique nos cabeçalhos da tabela (ex: "Nome", "Prioridade") para ordenar as tarefas.
    - [x] Salvar as preferências de ordenação e as colunas visíveis do usuário na coluna `profiles.table_settings` que já criámos.

- [x] **Configurar Serviço de Notificações de Tarefas**
    - [x] Utilizar o utilitário `sendTaskNotification` para enviar alertas aos usuários.
   
---

## Fase 2: Funcionalidades Avançadas de Gestão

O objetivo desta fase é introduzir ferramentas de gestão de projetos mais sofisticadas.

- [x] **Adicionar Suporte a 'Marcos' (Milestones)**
    - [x] **Backend:** Adicionar uma coluna booleana `is_milestone` à tabela `tasks`.
    - [x] **Frontend:** Adicionar um checkbox nos modais de criação/edição de tarefas para definir uma tarefa como um marco.

- [x] **Adicionar Lógica de Propagação de Datas em Dependências**
    - [x] **Frontend:** No modal de gestão de dependências, adicionar um `select` ou `checkbox` com a opção: "Ajustar datas das tarefas dependentes automaticamente?".
    - [x] **Backend:** Implementada a lógica na função `manage_task` que ajusta as datas de início das tarefas dependentes.

- [x] **Implementar Importação e Exportação de Tarefas via CSV**
    - [x] Ligar os botões de "Importar" e "Exportar" para chamarem as respetivas Supabase Edge Functions (`import-tasks`, `export-tasks`).
    - [x] Garantir que o processo de deploy das Edge Functions esteja documentado e funcional.

- [x] **Melhorar a Visão de Gráfico de Gantt**
    - [x] Destacar visualmente as tarefas que são "marcos" no gráfico de Gantt.
    - [x] Investigar e implementar uma forma de criar e visualizar múltiplas "Linhas de Base" (Baselines) do projeto no gráfico de Gantt.
    - [x] Adicionar controlos de "zoom" (Dia, Semana, Mês, Ano) à visualização do Gantt.

---