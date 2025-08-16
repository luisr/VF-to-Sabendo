import { z } from 'zod';
import { ai } from '../genkit';
import type { Flow } from '@genkit-ai/flow';

// Define o formato de entrada esperado para o flow
const ReplanInputSchema = z.object({
  currentProjectTasks: z.array(z.object({
    name: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    responsavel: z.string().optional(),
    prioridade: z.string().optional(),
    dependencias: z.array(z.string()).optional(),
  })),
  newPlanCSV: z.string(), // O conteúdo do novo plano em formato CSV
});

// Define o formato de saída estruturado que a IA deve gerar
const SuggestionSchema = z.object({
  taskName: z.string().describe('Nome da tarefa afetada.'),
  action: z
    .enum(['update', 'create', 'delete', 'no_change'])
    .describe('A ação sugerida pela IA.'),
  justification: z.string().describe('Motivo da sugestão.'),
  changes: z
    .object({
      old_start_date: z.string().nullish(),
      new_start_date: z.string().nullish(),
      old_end_date: z.string().nullish(),
      new_end_date: z.string().nullish(),
    })
    .optional(),
});

export const replanAssistantFlow: Flow = ai.defineFlow(
  {
    name: 'replanAssistantFlow',
    inputSchema: ReplanInputSchema,
    outputSchema: z.array(SuggestionSchema),
  },
  async (input) => {
    const { currentProjectTasks, newPlanCSV } = input;
    const model = ai.model('googleai/gemini-1.5-flash');

    const prompt = `
      Você é um assistente de planejamento de projetos especialista. Sua tarefa é analisar um projeto existente e um novo plano,
      e gerar sugestões de replanejamento.

      **Projeto Atual (em JSON):**
      ${JSON.stringify(currentProjectTasks, null, 2)}

      **Novo Plano (em CSV):**
      ${newPlanCSV}

      **Sua Tarefa:**
      Compare o "Novo Plano" com o "Projeto Atual". Para cada tarefa, determine a ação necessária. As ações podem ser:
      1. **update**: Se uma tarefa existente no "Projeto Atual" tem datas diferentes no "Novo Plano".
      2. **create**: Se uma tarefa do "Novo Plano" não existe no "Projeto Atual".
      3. **delete**: Se uma tarefa do "Projeto Atual" não está presente no "Novo Plano".
      4. **no_change**: Se uma tarefa existe em ambos os planos com as mesmas datas.

      **Regras Importantes:**
      - A comparação de tarefas deve ser feita pelo nome da tarefa (case-insensitive).
      - Valide a consistência do cronograma e das dependências: nenhuma tarefa pode iniciar antes do fim de suas dependências e as datas devem ser coerentes.
      - Forneça a saída estritamente no formato JSON como um array onde cada objeto possui as chaves:
        taskName, action, justification e changes { old_start_date, new_start_date, old_end_date, new_end_date }.

      Analise cuidadosamente e gere a lista de sugestões.
    `;

    const llmResponse = await model.generate({
      prompt: prompt,
      output: {
        schema: z.array(SuggestionSchema),
      },
    });

    return llmResponse.output() || [];
  }
);
