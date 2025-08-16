"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/use-users";
import { useProjects } from "@/hooks/use-projects"; // Importa o hook de projetos

// Estrutura de dados unificada
export interface DashboardData {
  kpis: {
    total_budget?: number;
    total_cost?: number;
    total_projects?: number;
    total_tasks?: number;
    completed_tasks?: number;
    tasks_at_risk?: number;
    overall_progress?: number;
  };
  overview_chart: { month_start: string; completed_count: number; pending_count: number }[];
  status_distribution: { status: string; task_count: number; color?: string }[];
  budget_vs_cost: { month: string; budget: number; cost: number }[];
  recent_tasks: { id: string; name: string; status: string; project_name?: string; assignee_name?: string; status_color?: string }[];
}

interface DashboardContextType {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  selectedManagerId: string | null; 
  setSelectedManagerId: (managerId: string | null) => void;
  refetchData: () => void;
}
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: userLoading } = useUsers();
  
  // A FONTE DA VERDADE: O selectedProjectId agora vem do useProjects
  const { selectedProjectId } = useProjects();

  const fetchData = useCallback(async () => {
    if (userLoading) return;
    setLoading(true);

    const params = {
      p_project_id: selectedProjectId === 'consolidated' ? null : selectedProjectId,
      p_manager_id: selectedManagerId,
    };
    
    const { data, error } = await supabase.rpc('get_dashboard_page_data', params);

    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('permission') || error.code === '42501' || error.status === 403) {
        const desc = 'Você não tem permissão para acessar estes dados.';
        toast({ title: 'Permissão negada', description: desc, variant: 'destructive' });
        setError(desc);
      } else {
        const desc = 'Falha ao se conectar ao servidor. Tente novamente.';
        toast({ title: 'Erro de rede', description: error.message, variant: 'destructive' });
        setError(desc);
      }
      setDashboardData(null);
    } else {
      setDashboardData(data as DashboardData);
      setError(null);
    }
    setLoading(false);
  }, [selectedProjectId, selectedManagerId, toast, userLoading]);

  useEffect(() => {
    // Se o usuário não for gerente, zera o filtro de gerente
    if (user && user.role !== 'Gerente' && user.role !== 'Admin') {
        setSelectedManagerId(null);
    }
    fetchData();
  }, [selectedProjectId, selectedManagerId, fetchData, user]);

  return (
    <DashboardContext.Provider
      value={{
        dashboardData,
        loading,
        error,
        selectedManagerId,
        setSelectedManagerId,
        refetchData: fetchData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
