"use client";
import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from "@/components/shared/page-header";
import ProjectSelector from '@/components/shared/project-selector';
import { useProjects } from '@/hooks/use-projects';
import type { Project, ProjectAnalysis } from '@/lib/types';
import { useBaselines } from '@/hooks/use-baselines';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertTriangle, ListChecks, CalendarClock, CheckCircle2, ArrowLeftRight, LineChart as LineChartIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import IntelligentReplanningModal from '@/components/bi/intelligent-replanning-modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import HeatmapChart from '@/components/bi/heatmap-chart';
import ProjectReportModal, { ReportData, AIReportAnalysis } from '@/components/bi/ProjectReportModal';
import { generateProjectReport } from '@/ai/flows/project-report-generator';

const KpiCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => ( <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div>{description && <p className="text-xs text-muted-foreground">{description}</p>}</CardContent></Card> );

// --- GRÁFICOS RESTAURADOS E FUNCIONAIS ---
export const BurndownChart = ({ data }: { data: any[] }) => {
  if (!Array.isArray(data) || data.length === 0) return <div className="flex items-center justify-center h-[350px] text-muted-foreground">Dados de burndown indisponíveis.</div>;
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="ideal" name="Ideal" stroke="#8884d8" /><Line type="monotone" dataKey="real" name="Real" stroke="#82ca9d" /></LineChart>
    </ResponsiveContainer>
  );
};

export const SCurveChart = ({ data }: { data: any[] }) => {
    if (!Array.isArray(data) || data.length === 0) return <div className="flex items-center justify-center h-[350px] text-muted-foreground">Dados da Curva S indisponíveis.</div>;
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="planned_value" name="Valor Planejado" stroke="#3b82f6" /><Line type="monotone" dataKey="earned_value" name="Valor Agregado" stroke="#22c55e" /><Line type="monotone" dataKey="actual_cost" name="Custo Real" stroke="#ef4444" /></LineChart>
        </ResponsiveContainer>
    );
};

type DeviationData = { name: string; deviation: number; assignee_name?: string | null; status_name?: string | null; baseline_start_date?: string | null; current_start_date?: string | null; baseline_end_date?: string | null; current_end_date?: string | null; };
export const DeviationChart = ({ data }: { data: DeviationData[] }) => {
    if (!Array.isArray(data) || data.length === 0) return <div className="flex items-center justify-center h-[350px] text-muted-foreground">Sem dados de desvio para exibir.</div>;
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={80} /><Tooltip /><Legend /><Bar dataKey="deviation" name="Desvio (dias)" fill="#8884d8" /></BarChart>
        </ResponsiveContainer>
    );
};

export default function BIPage() {
  const { loading: loadingProjects, selectedProjectId, projects } = useProjects();
  const currentProject = useMemo<Project | undefined>(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const { baselines, selectedBaselineId, setSelectedBaselineId } = useBaselines();
  const [analysisData, setAnalysisData] = useState<ProjectAnalysis | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIReportAnalysis | null>(null);

  const handleGenerateReport = async () => {
      if (!selectedProjectId || !currentProject) {
        toast({ title: 'Nenhum projeto selecionado.', variant: 'destructive' });
        return;
      }
      setIsReportModalOpen(true);
      setIsGeneratingReport(true);
      setReportData(null);
      setAiAnalysis(null);
      try {
        const { data: rawReportData, error: dataError } = await supabase.rpc('get_project_report_data', { p_project_id: selectedProjectId });
        if (dataError) throw new Error(`Erro ao buscar dados: ${dataError.message}`);
        setReportData(rawReportData);

        const aiInput = {
          projectName: currentProject.name,
          kpis: JSON.stringify(rawReportData.analysis.performance_kpis),
          taskHistory: JSON.stringify(rawReportData.analysis.status_distribution),
          overviewChartData: JSON.stringify(rawReportData.analysis.burndown_data),
          change_history: JSON.stringify(rawReportData.change_history),
          criticalPathInfo: JSON.stringify(rawReportData.analysis.criticalPathInfo),
        };

        const analysisResult = await generateProjectReport(aiInput);
        setAiAnalysis(analysisResult);
      } catch (err: any) {
        toast({ title: 'Erro ao Gerar Relatório', description: err.message, variant: 'destructive' });
        setIsReportModalOpen(false);
      } finally {
        setIsGeneratingReport(false);
      }
  };

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!selectedProjectId || selectedProjectId === 'consolidated') {
        setAnalysisData(null); setLoadingData(false); setFetchError(null);
        return;
      }
      setLoadingData(true); setFetchError(null);
      try {
        const { data, error } = await supabase.rpc('get_project_analysis', { p_project_id: selectedProjectId, p_baseline_id: selectedBaselineId ?? null });
        if (error) throw new Error(error.message);
        setAnalysisData(data);
      } catch (err: any) {
        setAnalysisData(null); setFetchError(err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchAnalysisData();
  }, [selectedProjectId, selectedBaselineId]);

  const renderContent = () => {
    if (loadingProjects) return <div className="flex-1 flex items-center justify-center"><Loader2/></div>;
    if (!selectedProjectId || selectedProjectId === 'consolidated') return <div className="flex-1 flex items-center justify-center">Selecione um projeto para ver a análise.</div>;
    if (loadingData) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin"/></div>;
    if (fetchError) return <div className="flex-1 flex items-center justify-center">Erro: {fetchError}</div>;
    if (!analysisData) return <div className="flex-1 flex items-center justify-center">Sem dados de análise para este projeto.</div>;

    const { performance_kpis: kpis, burndown_data, baseline_kpis, deviation_chart, s_curve_data, heatmap_data } = analysisData;

    return (
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance"><LineChartIcon className="h-4 w-4 mr-2"/>Análise de Desempenho</TabsTrigger>
          <TabsTrigger value="baseline"><ArrowLeftRight className="h-4 w-4 mr-2"/>Análise de Linha de Base</TabsTrigger>
        </TabsList>
        <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard title="Total de Tarefas" value={kpis?.total_tasks ?? 0} icon={ListChecks} />
                <KpiCard title="% Concluído" value={`${(kpis?.total_tasks ?? 0) > 0 ? (((kpis?.completed_tasks ?? 0) / kpis.total_tasks) * 100).toFixed(0) : 0}%`} icon={CheckCircle2} />
                <KpiCard title="Tarefas Atrasadas" value={kpis?.overdue_tasks ?? 0} icon={CalendarClock} />
            </div>
            <Card><CardHeader><CardTitle>Gráfico de Burndown</CardTitle></CardHeader><CardContent><BurndownChart data={burndown_data || []} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Curva S</CardTitle></CardHeader><CardContent><SCurveChart data={s_curve_data || []} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Mapa de Calor de Status</CardTitle></CardHeader><CardContent><HeatmapChart data={heatmap_data || []} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="baseline" className="space-y-4">
            {baseline_kpis ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <KpiCard title="Desvio Médio" value={`${Number(baseline_kpis.average_deviation ?? 0).toFixed(1)}d`} icon={ArrowLeftRight} />
                  <KpiCard title="Tarefas Atrasadas" value={baseline_kpis.tasks_delayed ?? 0} icon={AlertTriangle} />
                </div>
                <Card>
                  <CardHeader><CardTitle>Desvios por Tarefa</CardTitle><CardDescription>Comparação com a linha de base</CardDescription></CardHeader>
                  <CardContent>
                    <DeviationChart data={deviation_chart || []} />
                    {Array.isArray(deviation_chart) && deviation_chart.length > 0 && (
                      <div className="mt-4 overflow-x-auto">
                        <Table>
                          <TableHeader><TableRow><TableHead>Tarefa</TableHead><TableHead>Responsável</TableHead><TableHead>Status</TableHead><TableHead>Início Planejado</TableHead><TableHead>Início Real</TableHead><TableHead>Fim Planejado</TableHead><TableHead>Fim Real</TableHead><TableHead className="text-right">Desvio (dias)</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {deviation_chart.map((task: DeviationData, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>{task.name}</TableCell>
                                <TableCell>{task.assignee_name || '-'}</TableCell>
                                <TableCell>{task.status_name || '-'}</TableCell>
                                <TableCell>{task.baseline_start_date ? new Date(task.baseline_start_date).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>{task.current_start_date ? new Date(task.current_start_date).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>{task.baseline_end_date ? new Date(task.baseline_end_date).toLocaleDateString() : '-'}</TableCell>
                                <TableCell>{task.current_end_date ? new Date(task.current_end_date).toLocaleDateString() : '-'}</TableCell>
                                <TableCell className="text-right">{task.deviation}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : <div className="flex-1 flex items-center justify-center p-8">Selecione uma linha de base para ver os desvios.</div>}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <PageHeader
        title="Centro de Análise do Projeto"
        actions={
            <div className="flex gap-4">
                <ProjectSelector showConsolidatedView={false} />
                <Select value={selectedBaselineId || ''} onValueChange={setSelectedBaselineId} disabled={!selectedProjectId || selectedProjectId === 'consolidated'}>
                    <SelectTrigger className="w-[220px]"><SelectValue placeholder="Analisar Linha de Base..." /></SelectTrigger>
                    <SelectContent>{baselines.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={() => setIsReplanModalOpen(true)} disabled={!selectedProjectId || selectedProjectId === 'consolidated'}>Replanejar</Button>
                <Button onClick={handleGenerateReport} disabled={!selectedProjectId || selectedProjectId === 'consolidated' || loadingData}>
                  {isGeneratingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar Relatório"}
                </Button>
            </div>
        }
      />
      {renderContent()}
      <IntelligentReplanningModal isOpen={isReplanModalOpen} onOpenChange={setIsReplanModalOpen} selectedProjectId={selectedProjectId} />
      <ProjectReportModal
        isOpen={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        reportData={reportData}
        aiAnalysis={aiAnalysis}
        isLoading={isGeneratingReport}
      />
    </div>
  );
}
