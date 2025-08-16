// Risk Prediction flow
'use server';
/**
 * @fileOverview An AI-powered risk analysis tool for project managers.
 *
 * - riskPrediction - A function that identifies potential project risks.
 * - RiskPredictionInput - The input type for the riskPrediction function.
 * - RiskPredictionOutput - The return type for the riskPrediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RiskPredictionInputSchema = z.object({
  historicalData: z
    .string()
    .describe('Historical project data, including timelines, dependencies, and outcomes.'),
  currentConditions: z
    .string()
    .describe(
      'Current project conditions, including task status, resource allocation, and change history.'
    ),
  changeHistory: z
    .string()
    .describe('Detailed change history with justifications for each change.'),
  criticalPathInfo: z
    .string()
    .describe('Information about the project\'s critical path, including key tasks and dependencies.'),
});
export type RiskPredictionInput = z.infer<typeof RiskPredictionInputSchema>;

const RiskPredictionOutputSchema = z.object({
  risks: z
    .array(z.string())
    .describe('Uma lista de possíveis riscos do projeto identificados pela IA.'),
  justifications: z
    .array(z.string())
    .describe('Justificativas para cada risco identificado com base nos dados de entrada.'),
});
export type RiskPredictionOutput = z.infer<typeof RiskPredictionOutputSchema>;

export async function riskPrediction(input: RiskPredictionInput): Promise<RiskPredictionOutput> {
  return riskPredictionFlow(input);
}

const riskPredictionPrompt = ai.definePrompt({
  name: 'riskPredictionPrompt',
  input: {schema: RiskPredictionInputSchema},
  output: {schema: RiskPredictionOutputSchema},
  prompt: `Você é um analista de riscos de projetos de IA.
  
  **IMPORTANTE: Todas as respostas devem ser exclusivamente em português do Brasil.**

  Analise os dados do projeto fornecidos para identificar riscos potenciais e suas justificativas.

Dados Históricos: {{{historicalData}}}
Condições Atuais: {{{currentConditions}}}
Histórico de Mudanças: {{{changeHistory}}}
Análise do Caminho Crítico: {{{criticalPathInfo}}}

Identifique riscos potenciais e forneça justificativas com base em padrões históricos, desvios atuais e análise do caminho crítico.`,
});

const riskPredictionFlow = ai.defineFlow(
  {
    name: 'riskPredictionFlow',
    inputSchema: RiskPredictionInputSchema,
    outputSchema: RiskPredictionOutputSchema,
  },
  async input => {
    const {output} = await riskPredictionPrompt(input);
    return output!;
  }
);
