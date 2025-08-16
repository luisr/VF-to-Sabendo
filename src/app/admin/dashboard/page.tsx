
"use client";

import { useState, Suspense, useEffect } from "react";
import KpiCard from "@/components/dashboard/kpi-card";
import OverviewChart from "@/components/dashboard/overview-chart";
import StatusDistributionChart from "@/components/dashboard/status-distribution-chart";
import BudgetVsCostChart from "@/components/dashboard/budget-vs-cost-chart";
import PageHeader from "@/components/shared/page-header";
import ProjectSelector from "@/components/shared/project-selector";
import { CheckCircle, DollarSign, ListTodo, Zap, Settings, Loader2 } from "lucide-react";
import RecentTasksCard from "@/components/dashboard/recent-tasks-card";
import { Button } from "@/components/ui/button";
import DashboardManagerModal from "@/components/dashboard/dashboard-manager-modal";
import { useProjects } from "@/hooks/use-projects";
import { useDashboardPreferences } from "@/hooks/use-dashboard-preferences"; // Importar
import { DashboardProvider, useDashboard, DashboardData } from "@/hooks/use-dashboard";
import { supabase } from "@/lib/supabase";

// Componente para a visão consolidada do Admin
const ConsolidatedView = () => {
  const { dashboardData: adminData, loading: adminLoading } = useDashboard();

  if (adminLoading || !adminData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const {
    kpis = {},
    overview_chart: chartData = [],
    status_distribution: statusDistribution = [],
    budget_vs_cost: budgetVsCost = [],
    recent_tasks: recentTasks = [],
  } = adminData;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Projetos"
          value={`${kpis.total_projects || 0}`}
          icon={<ListTodo />}
          change=""
        />
        <KpiCard
          title="Orçamento Total"
          value={`R$ ${Number(kpis.total_budget || 0).toLocaleString('pt-BR')}`}
          icon={<DollarSign />}
          change=""
        />
        <KpiCard
          title="Tarefas Concluídas"
          value={`${kpis.completed_tasks || 0} / ${kpis.total_tasks || 0}`}
          icon={<CheckCircle />}
          change=""
        />
        <KpiCard
          title="Tarefas em Risco"
          value={`${kpis.tasks_at_risk || 0}`}
          icon={<Zap />}
          change=""
          valueClassName={(kpis.tasks_at_risk || 0) > 0 ? 'text-destructive' : ''}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OverviewChart chartData={chartData} />
        <StatusDistributionChart data={statusDistribution} />
        <BudgetVsCostChart data={budgetVsCost} />
        <RecentTasksCard tasks={recentTasks} />
      </div>
    </div>
  );
};

// Componente para a visão de projeto único (quando o Admin seleciona um)
const ProjectSpecificView = ({ projectId }: { projectId: string }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { preferences } = useDashboardPreferences();
  const prefs = preferences.project;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_dashboard_page_data', {
        p_project_id: projectId,
      });
      if (!error) setData(data);
      setLoading(false);
    };
    fetchData();
  }, [projectId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { kpis = {}, overview_chart: chartData = [], recent_tasks: recentTasks = [] } = data;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {prefs.kpiBudget && (
          <KpiCard
            title="Orçamento do Projeto"
            value={`R$ ${Number(kpis.total_budget || 0).toLocaleString('pt-BR')}`}
            icon={<DollarSign />}
            change=""
          />
        )}
        {prefs.kpiCompletedTasks && (
          <KpiCard
            title="Tarefas Concluídas"
            value={`${kpis.completed_tasks || 0} / ${kpis.total_tasks || 0}`}
            icon={<ListTodo />}
            change=""
          />
        )}
        {prefs.kpiCompletion && (
          <KpiCard
            title="Progresso"
            value={`${Math.round(kpis.overall_progress || 0)}%`}
            icon={<CheckCircle />}
            change=""
          />
        )}
        {prefs.kpiRisk && (
          <KpiCard
            title="Tarefas em Risco"
            value={`${kpis.tasks_at_risk || 0}`}
            icon={<Zap />}
            change=""
            valueClassName={(kpis.tasks_at_risk || 0) > 0 ? 'text-destructive' : ''}
          />
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {prefs.chartOverview && <OverviewChart chartData={chartData} />}
        {prefs.cardRecentTasks && <RecentTasksCard tasks={recentTasks} />}
      </div>
    </div>
  );
};

const AdminDashboardPageContent = () => {
  const [selectedProject, setSelectedProject] = useState("consolidated");
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const { projects, loading: projectsLoading, setSelectedProjectId } = useProjects();
  const { preferences, setPreference, savePreferences } = useDashboardPreferences();

  useEffect(() => {
    setSelectedProjectId(selectedProject);
  }, [selectedProject, setSelectedProjectId]);

  const handlePreferencesSave = () => {
    savePreferences();
    setIsManagerOpen(false);
  };
  
  if (projectsLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Painel do Admin"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsManagerOpen(true)}>
                <Settings className="h-5 w-5" />
              </Button>
              <ProjectSelector 
                projects={[{ id: 'consolidated', name: 'Visão Consolidada' }, ...projects]} 
                value={selectedProject} 
                onValueChange={setSelectedProject} 
              />
            </div>
          }
        />
        
        {selectedProject === 'consolidated' ? (
          <ConsolidatedView />
        ) : (
          <ProjectSpecificView projectId={selectedProject} />
        )}

      </div>
      <DashboardManagerModal
        isOpen={isManagerOpen}
        onOpenChange={setIsManagerOpen}
        preferences={preferences}
        setPreference={setPreference}
        onSave={handlePreferencesSave}
      />
    </>
  );
}

export default function AdminDashboardWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <DashboardProvider>
        <AdminDashboardPageContent />
      </DashboardProvider>
    </Suspense>
  );
}
