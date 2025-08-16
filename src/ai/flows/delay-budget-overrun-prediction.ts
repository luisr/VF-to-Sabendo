// 'use server'

/**
 * @fileOverview An AI tool that predicts potential project delays or budget overruns.
 *
 * - predictDelayBudgetOverrun - A function that handles the delay/budget overrun prediction process.
 * - PredictDelayBudgetOverrunInput - The input type for the predictDelayBudgetOverrun function.
 * - PredictDelayBudgetOverrunOutput - The return type for the predictDelayBudgetOverrun function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictDelayBudgetOverrunInputSchema = z.object({
  taskProgress: z.string().describe('The current progress of the tasks in the project.'),
  resourceAllocation: z.string().describe('Information about how resources are allocated to the project.'),
  historicalProjectData: z.string().describe('Historical data from similar projects, including deviations and their justifications.'),
});
export type PredictDelayBudgetOverrunInput = z.infer<typeof PredictDelayBudgetOverrunInputSchema>;

const PredictDelayBudgetOverrunOutputSchema = z.object({
  delayPrediction: z.nullable(z.string()).describe('Uma previsão de possíveis atrasos no projeto, ou nulo se nenhum atraso for previsto.'),
  budgetOverrunPrediction: z.nullable(z.string()).describe('Uma previsão de possíveis estouros de orçamento no projeto, ou nulo se nenhum estouro for previsto.'),
  justification: z.string().describe('A explicação da IA para as previsões de atraso e estouro de orçamento, com base nos dados de entrada.'),
});
export type PredictDelayBudgetOverrunOutput = z.infer<typeof PredictDelayBudgetOverrunOutputSchema>;

export async function predictDelayBudgetOverrun(input: PredictDelayBudgetOverrunInput): Promise<PredictDelayBudgetOverrunOutput> {
  return predictDelayBudgetOverrunFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictDelayBudgetOverrunPrompt',
  input: {schema: PredictDelayBudgetOverrunInputSchema},
  output: {schema: PredictDelayBudgetOverrunOutputSchema},
  prompt: `Você é um assistente de IA que ajuda gerentes de projeto a prever possíveis atrasos e estouros de orçamento.
  
  **IMPORTANTE: Todas as respostas devem ser exclusivamente em português do Brasil.**

  Analise o progresso das tarefas, a alocação de recursos e os dados históricos de projetos fornecidos para identificar riscos potenciais.

  Se um atraso ou estouro de orçamento for previsto, forneça uma explicação clara com base nos dados.
  Se nenhum atraso ou estouro de orçamento for previsto, defina o campo de saída correspondente como nulo e explique por que se espera que o projeto permaneça no prazo e dentro do orçamento.

  Progresso da Tarefa: {{{taskProgress}}}
  Alocação de Recursos: {{{resourceAllocation}}}
  Dados Históricos do Projeto: {{{historicalProjectData}}}

  Garanta que a saída indique claramente se um atraso ou estouro de orçamento é esperado e forneça uma justificativa detalhada para a previsão.
  `,
});

const predictDelayBudgetOverrunFlow = ai.defineFlow(
  {
    name: 'predictDelayBudgetOverrunFlow',
    inputSchema: PredictDelayBudgetOverrunInputSchema,
    outputSchema: PredictDelayBudgetOverrunOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
