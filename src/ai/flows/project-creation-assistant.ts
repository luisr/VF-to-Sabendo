// src/ai/flows/project-creation-assistant.ts
'use server';

/**
 * @fileOverview An AI assistant to guide project creation, asking questions and suggesting tasks.
 *
 * - projectCreationAssistant - A function that guides project creation.
 * - ProjectCreationAssistantInput - The input type for the projectCreationAssistant function.
 * - ProjectCreationAssistantOutput - The return type for the projectCreationAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectCreationAssistantInputSchema = z.object({
  goal:
    z
      .string()
      .describe("What are you hoping to achieve with this project?"),
  details:
    z
      .string()
      .describe("Include any relevant details about the project you want me to know."),
});
export type ProjectCreationAssistantInput = z.infer<typeof ProjectCreationAssistantInputSchema>;

const ProjectCreationAssistantOutputSchema = z.object({
  suggestedTasks: z.array(z.string()).describe("Uma lista de tarefas sugeridas para o projeto."),
  timelineEstimate: z.string().describe("Uma estimativa de cronograma para o projeto."),
  complexityAssessment: z.string().describe("Uma avaliação da complexidade do projeto (ex: baixa, média, alta)."),
});
export type ProjectCreationAssistantOutput = z.infer<typeof ProjectCreationAssistantOutputSchema>;

export async function projectCreationAssistant(input: ProjectCreationAssistantInput): Promise<ProjectCreationAssistantOutput> {
  return projectCreationAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'projectCreationAssistantPrompt',
  input: {schema: ProjectCreationAssistantInputSchema},
  output: {schema: ProjectCreationAssistantOutputSchema},
  prompt: `Você é um assistente de gerenciamento de projetos de IA ajudando um gerente de projetos a configurar um novo projeto.
  
  **IMPORTANTE: Todas as respostas devem ser exclusivamente em português do Brasil.**

  Com base no objetivo e nos detalhes do projeto, você sugerirá tarefas, estimará um cronograma e avaliará a complexidade do projeto.
  O objetivo do projeto é: {{{goal}}}
  Detalhes adicionais do projeto: {{{details}}}

  Sugira tarefas, estime o cronograma e avalie a complexidade do projeto.`,
});

const projectCreationAssistantFlow = ai.defineFlow(
  {
    name: 'projectCreationAssistantFlow',
    inputSchema: ProjectCreationAssistantInputSchema,
    outputSchema: ProjectCreationAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
