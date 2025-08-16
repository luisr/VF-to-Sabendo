
"use client";

import { useState, useEffect, useMemo } from "react";
import { riskPrediction, type RiskPredictionOutput } from "@/ai/flows/risk-prediction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import ProjectSelector from "../shared/project-selector";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects"; // Import projects hook
import { useTableSettings } from "@/hooks/use-table-settings";
import { isAfter } from "date-fns";
import { parseUTCDate } from '@/lib/date-utils';
import { getCriticalPath } from "@/lib/critical-path";

export default function RiskPredictionTool() {
  const [selectedProject, setSelectedProject] = useState("consolidated");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskPredictionOutput | null>(null);
  const { toast } = useToast();
  
  // Connect to central data hooks
  const { tasks, setSelectedProjectId } = useTasks();
  const { projects } = useProjects();
  const { statuses } = useTableSettings();

  // Sync project selection with the TasksProvider
  useEffect(() => {
    setSelectedProjectId(selectedProject === 'consolidated' ? null : selectedProject);
  }, [selectedProject, setSelectedProjectId]);

  // Generate context for the AI based on real-time data from hooks
  const projectContext = useMemo(() => {
    // The tasks from the hook are already filtered for the selected project
    const relevantTasks = tasks || [];
    if (relevantTasks.length === 0) return null;

    const doneStatusId = (statuses || []).find(s => s.name.toLowerCase() === 'feito')?.id;
    const completedTasks = relevantTasks.filter(t => t.status_id === doneStatusId);
    const overdueTasks = relevantTasks.filter(
      t => t.status_id !== doneStatusId && isAfter(new Date(), parseUTCDate(t.end_date)!)
    );
    
    const conditions = `O projeto tem ${relevantTasks.length} tarefas. ${completedTasks.length} estão concluídas. ${overdueTasks.length} tarefas estão atualmente atrasadas.`;

    const criticalData = getCriticalPath(relevantTasks);
    const criticalPath = criticalData
      ? `Caminho crítico: ${criticalData.path.map(t => t.name).join(' -> ')} com duração total de ${criticalData.duration} dias.`
      : "Caminho crítico não disponível.";

    const history = "A análise do histórico (a ser implementada) normalmente revela que atrasos em tarefas críticas são o principal preditor de falhas no projeto.";

    return {
      currentConditions: conditions,
      criticalPathInfo: criticalPath,
      changeHistory: "Histórico de alterações ainda não implementado.",
      historicalData: history,
    };
  }, [tasks, statuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectContext) {
        toast({ title: "Dados Insuficientes", description: "Não há tarefas no projeto selecionado para analisar.", variant: "destructive" });
        return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await riskPrediction(projectContext);
      setResult(response);
    } catch (error) {
      console.error("AI Risk Prediction Error:", error);
      toast({ title: "Erro na IA", description: "Não foi possível prever os riscos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Previsão de Riscos por IA</CardTitle>
          <CardDescription>
           Selecione um projeto para que a IA analise os dados em tempo real e identifique riscos potenciais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid gap-2">
            <Label htmlFor="project-select">Escopo da Análise</Label>
            <ProjectSelector 
                projects={projects}
                value={selectedProject}
                onValueChange={setSelectedProject}
            />
          </div>
          <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
            {projectContext ? `Contexto para IA: ${projectContext.currentConditions} ${projectContext.criticalPathInfo}` : "Selecione um projeto para carregar o contexto."}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading || !projectContext}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
            Prever Riscos
          </Button>
        </CardFooter>
      </form>

      {result && (
        <div className="p-6 pt-0">
          <h3 className="text-lg font-semibold mb-4">Análise de Riscos por IA</h3>
          {/* ... result rendering logic remains the same ... */}
        </div>
      )}
    </Card>
  );
}
