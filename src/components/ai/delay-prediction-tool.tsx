
"use client";

import { useState, useEffect, useMemo } from "react";
import { predictDelayBudgetOverrun, type PredictDelayBudgetOverrunOutput } from "@/ai/flows/delay-budget-overrun-prediction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Clock, CircleDollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import ProjectSelector from "../shared/project-selector";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { isAfter } from "date-fns";
import { parseUTCDate } from '@/lib/date-utils';


export default function DelayPredictionTool() {
  const [taskProgress, setTaskProgress] = useState("");
  const [resourceAllocation, setResourceAllocation] = useState("");
  const [historicalData, setHistoricalData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictDelayBudgetOverrunOutput | null>(null);
  const { toast } = useToast();
  const { rawTasks } = useTasks();
  const { projects, selectedProjectId } = useProjects();

  const projectContext = useMemo(() => {
    if (!selectedProjectId) return null;
    const relevantProjects = selectedProjectId === 'consolidated'
        ? projects
        : projects.filter(p => p.id === selectedProjectId);

    const relevantTasks = selectedProjectId === 'consolidated'
        ? rawTasks
        : rawTasks.filter(t => (t as any).project_id === selectedProjectId);

    if (relevantTasks.length === 0) return { taskProgress: "", resourceAllocation: "", historicalData: "Nenhum dado histórico disponível." };

    const overdueTasks = relevantTasks.filter(
      t => (t as any).status !== 'Feito' && isAfter(new Date(), parseUTCDate((t as any).end)!)
    );
    const taskProgressSummary = `Total de ${relevantTasks.length} tarefas. ${overdueTasks.length} tarefas estão atrasadas. ${relevantTasks.filter(t => (t as any).status === 'Feito').length} tarefas concluídas.`;

    const budgetSummary = relevantProjects.map(p => {
        const projectTasks = rawTasks.filter(t => (t as any).project_id === p.id);
        const spent = projectTasks.reduce((sum, t) => sum + (Number((t as any).custom_fields?.cost) || 0), 0);
        const budget = p.budget ?? 0;
        const spentPercentage = budget > 0 ? ((spent / budget) * 100).toFixed(0) : '0';
        return `Projeto ${p.name}: ${spentPercentage}% do orçamento utilizado.`;
    }).join(' ');
    const resourceAllocationSummary = `Recursos alocados nos projetos. ${budgetSummary}`;

    const historicalDataSummary = "Dados históricos indicam que projetos com mais de 15% de tarefas atrasadas geralmente excedem o orçamento em 10%.";

    return {
        taskProgress: taskProgressSummary,
        resourceAllocation: resourceAllocationSummary,
        historicalData: historicalDataSummary
    };
  }, [selectedProjectId, rawTasks, projects]);


  useEffect(() => {
    if (projectContext) {
      setTaskProgress(projectContext.taskProgress);
      setResourceAllocation(projectContext.resourceAllocation);
      setHistoricalData(projectContext.historicalData);
      setResult(null);
    }
  }, [projectContext]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await predictDelayBudgetOverrun({ taskProgress, resourceAllocation, historicalProjectData: historicalData });
      setResult(response);
    } catch (error) {
      console.error("AI Delay Prediction Error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a previsão. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Previsão de Atraso e Estouro de Orçamento</CardTitle>
          <CardDescription>
            Selecione um projeto ou a visão consolidada para realizar a análise. Os dados serão carregados automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="project-select">Escopo da Análise</Label>
            <ProjectSelector />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="taskProgress">Progresso da Tarefa</Label>
            <Textarea
              id="taskProgress"
              placeholder="Resumo do progresso das tarefas do projeto..."
              value={taskProgress}
              onChange={(e) => setTaskProgress(e.target.value)}
              required
              readOnly
              className="bg-muted/50 h-24"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="resourceAllocation">Alocação de Recursos</Label>
            <Textarea
              id="resourceAllocation"
              placeholder="Resumo da alocação de recursos e orçamento..."
              value={resourceAllocation}
              onChange={(e) => setResourceAllocation(e.target.value)}
              required
              readOnly
              className="bg-muted/50 h-24"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="historicalData">Dados Históricos do Projeto</Label>
            <Textarea
              id="historicalData"
              placeholder="Resumo de dados históricos relevantes..."
              value={historicalData}
              onChange={(e) => setHistoricalData(e.target.value)}
              required
              readOnly
              className="bg-muted/50 h-24"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading || !taskProgress}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
            Gerar Previsão
          </Button>
        </CardFooter>
      </form>

      {result && (
        <div className="p-6 pt-0 space-y-4">
            <h3 className="text-lg font-semibold">Análise da Previsão por IA</h3>
            {result.delayPrediction && (
                 <Alert variant="destructive">
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Possível Atraso Previsto</AlertTitle>
                    <AlertDescription>{result.delayPrediction}</AlertDescription>
                </Alert>
            )}
             {result.budgetOverrunPrediction && (
                 <Alert variant="destructive">
                    <CircleDollarSign className="h-4 w-4" />
                    <AlertTitle>Possível Estouro de Orçamento Previsto</AlertTitle>
                    <AlertDescription>{result.budgetOverrunPrediction}</AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Justificativa</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">{result.justification}</p>
                </CardContent>
            </Card>
        </div>
      )}
    </Card>
  );
}
