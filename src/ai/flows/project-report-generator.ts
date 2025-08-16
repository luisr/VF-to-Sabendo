'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProjectReportInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  kpis: z.string().describe('Key Performance Indicators (KPIs) in JSON format.'),
  taskHistory: z.string().describe('A summary of the task history and current status.'),
  overviewChartData: z.string().describe('Data for the overview chart in JSON format.'),
  change_history: z.string().describe('A JSON array of task date changes, including justifications.'),
  criticalPathInfo: z.string().describe('A JSON object containing the critical path tasks and total duration.'),
});
export type GenerateProjectReportInput = z.infer<typeof GenerateProjectReportInputSchema>;

const GenerateProjectReportOutputSchema = z.object({
  reportTitle: z.string().describe("The main title for the report."),
  executiveSummary: z.string().describe("A high-level executive summary, using Markdown for formatting."),
  kpiAnalysis: z.string().describe("A detailed analysis of the KPIs, using Markdown."),
  taskAnalysis: z.string().describe("An analysis of task progress and status, using Markdown."),
  criticalPathAnalysis: z.string().describe("An explanation of the critical path and its implications for the project timeline."),
  chartInsight: z.string().describe("Interpretation derived from the overview chart data, using Markdown."),
  justificationAnalysis: z.string().describe("An analysis of the justifications for date changes, using Markdown."),
  recommendations: z.string().describe("Actionable recommendations, formatted as a Markdown bulleted list."),
});
export type GenerateProjectReportOutput = z.infer<typeof GenerateProjectReportOutputSchema>;

export async function generateProjectReport(input: GenerateProjectReportInput): Promise<GenerateProjectReportOutput> {
  return generateProjectReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectReportPrompt',
  input: {schema: GenerateProjectReportInputSchema},
  output: {schema: GenerateProjectReportOutputSchema},
  prompt: `Você é um analista de projetos de IA de classe mundial. Sua tarefa é gerar um relatório de projeto abrangente e bem formatado para um gerente de projetos, utilizando Markdown.
  
  **IMPORTANTE: Todas as respostas devem ser exclusivamente em português do Brasil.**

  O relatório é para: {{{projectName}}}.

  Analise os seguintes dados:
  - KPIs: {{{kpis}}}
  - Histórico de Tarefas: {{{taskHistory}}}
  - Dados do Gráfico de Burndown: {{{overviewChartData}}}
  - Histórico de Alterações com Justificativas: {{{change_history}}}
  - Caminho Crítico: {{{criticalPathInfo}}}

  Com base em sua análise, gere as seguintes seções para o relatório, usando a formatação Markdown indicada:
  
  1.  **Sumário Executivo**: Um parágrafo de alto nível sobre a saúde do projeto. Use **negrito** para destacar as conclusões mais importantes.

  2.  **Análise de Indicadores-Chave (KPIs)**: Crie um subtítulo "### Análise de KPIs". Interprete os KPIs fornecidos.

  3.  **Caminho Crítico**: Crie um subtítulo "### Análise do Caminho Crítico". Explique o que é o caminho crítico e por que ele é importante. Liste as tarefas que compõem o caminho crítico e a sua duração total. Destaque os riscos associados a atrasos nessas tarefas específicas.

  4.  **Andamento das Tarefas**: Crie um subtítulo "### Andamento das Tarefas". Comente sobre o progresso geral.

  5.  **Análise de Mudanças no Cronograma**: Crie um subtítulo "### Análise de Justificativas". Analise as justificativas para as mudanças de datas.

  6.  **Recomendações**: Crie um subtítulo "### Recomendações". Forneça recomendações acionáveis em uma lista com marcadores.

  Estruture sua saída de acordo com o esquema definido.`,
});

const generateProjectReportFlow = ai.defineFlow(
  {
    name: 'generateProjectReportFlow',
    inputSchema: GenerateProjectReportInputSchema,
    outputSchema: GenerateProjectReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
