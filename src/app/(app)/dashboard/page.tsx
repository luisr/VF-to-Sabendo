"use client";
import { Suspense, useState, useMemo } from 'react';
import { useDashboard } from '@/hooks/use-dashboard';
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences';
import { useProjects } from '@/hooks/use-projects';
import { useUsers } from '@/hooks/use-users';
import KpiCard from "@/components/dashboard/kpi-card";
import PageHeader from "@/components/shared/page-header";
import ProjectSelector from "@/components/shared/project-selector";
import { Button } from "@/components/ui/button";
import DashboardManagerModal from "@/components/dashboard/dashboard-manager-modal";
import { CheckCircle, DollarSign, ListTodo, Settings, Loader2, Zap } from "lucide-react";
import OverviewChart from '@/components/dashboard/overview-chart';
import RecentTasksCard from '@/components/dashboard/recent-tasks-card';
import StatusDistributionChart from '@/components/dashboard/status-distribution-chart';
import BudgetVsCostChart from '@/components/dashboard/budget-vs-cost-chart';
import RecentProjectsCard from '@/components/dashboard/recent-projects-card';

// O DashboardContent agora é mais limpo, pois a lógica de estado
// está centralizada nos hooks.
const DashboardContent = () => {
    const { user, users } = useUsers();
    const { projects, selectedProjectId } = useProjects(); // A única fonte de verdade para o projeto
    const { dashboardData, loading, selectedManagerId } = useDashboard();
    const { preferences, setPreference, savePreferences } = useDashboardPreferences();
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    const isManager = user?.role === 'Gerente' || user?.role === 'Admin';
    const isConsolidated = selectedProjectId === 'consolidated' || selectedProjectId === null;
    
    const currentProject = useMemo(() => 
        isConsolidated ? null : projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId, isConsolidated]);

    const selectedManager = useMemo(() =>
        selectedManagerId ? users.find(u => u.id === selectedManagerId) : null,
    [users, selectedManagerId]);

    const viewPrefs = useMemo(() =>
        isConsolidated ? preferences.consolidated : preferences.project,
    [preferences, isConsolidated]);

    const pageDescription = useMemo(() => {
        if (isConsolidated) {
            if (selectedManager) {
                return `Visão consolidada para o gerente: ${selectedManager.full_name}`;
            }
            return "Visão consolidada de todos os projetos.";
        }
        return `Resumo do projeto: ${currentProject?.name}`;
    }, [isConsolidated, selectedManager, currentProject]);

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }
    
    const kpis = dashboardData?.kpis || {};
    const chartData = dashboardData?.overview_chart || [];
    const recentTasks = dashboardData?.recent_tasks || [];
    const statusDistribution = dashboardData?.status_distribution || [];
    const budgetVsCost = dashboardData?.budget_vs_cost || [];

    return (
        <div className="flex flex-col h-full p-4 space-y-4">
            <PageHeader
                title={isManager ? "BI Dashboard" : "Painel de Controle"}
                description={pageDescription}
                actions={
                    <div className="flex items-center gap-4">
                        <ProjectSelector showConsolidatedView={isManager} />
                        {isManager && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsManagerOpen(true)}
                            >
                                <Settings className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                }
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {viewPrefs.kpiBudget && <KpiCard title="Orçamento" value={`R$ ${Number(kpis.total_budget || 0).toLocaleString('pt-BR')}`} icon={<DollarSign />} />}
                {viewPrefs.kpiCompletedTasks && <KpiCard title="Tarefas Concluídas" value={`${kpis.completed_tasks || 0} / ${kpis.total_tasks || 0}`} icon={<ListTodo />} />}
                {viewPrefs.kpiCompletion && <KpiCard title="Progresso Geral" value={`${Math.round(kpis.overall_progress || 0)}%`} icon={<CheckCircle />} />}
                {viewPrefs.kpiRisk && <KpiCard title="Tarefas em Risco" value={`${kpis.tasks_at_risk || 0}`} icon={<Zap />} valueClassName={(kpis.tasks_at_risk || 0) > 0 ? "text-destructive" : ""} />}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {viewPrefs.chartOverview && <OverviewChart chartData={chartData} />}
                {viewPrefs.chartStatusDistribution && <StatusDistributionChart data={statusDistribution} />}
                {viewPrefs.chartBudgetVsCost && <BudgetVsCostChart data={budgetVsCost} />}
                {viewPrefs.cardRecentTasks && <RecentTasksCard tasks={recentTasks} />}
                {viewPrefs.cardRecentProjects && <RecentProjectsCard projects={projects} />}
            </div>
            {isManager && (
              <DashboardManagerModal
                isOpen={isManagerOpen}
                onOpenChange={setIsManagerOpen}
                preferences={preferences}
                setPreference={setPreference}
                onSave={() => {
                  savePreferences();
                  setIsManagerOpen(false);
                }}
              />
            )}
        </div>
    );
}

// O Wrapper da página agora só precisa do DashboardProvider,
// que por sua vez já depende do ProjectsProvider.
export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <DashboardContent />
        </Suspense>
    );
}
