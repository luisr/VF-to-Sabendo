"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "./use-projects";
import type { ProjectBaseline } from "@/lib/types";

interface BaselinesContextType {
  baselines: ProjectBaseline[];
  selectedBaselineId: string | null;
  setSelectedBaselineId: (id: string | null) => void;
  createBaseline: (name: string) => Promise<boolean>;
  deleteBaseline: (id: string) => Promise<boolean>; // Nova função
  loading: boolean;
}

const BaselinesContext = createContext<BaselinesContextType | undefined>(undefined);

export const BaselinesProvider = ({ children }: { children: ReactNode }) => {
  const [baselines, setBaselines] = useState<ProjectBaseline[]>([]);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { selectedProjectId } = useProjects();
  const { toast } = useToast();

  const fetchBaselines = useCallback(
    async (baselineIdToSelect?: string) => {
      if (!selectedProjectId || selectedProjectId === "consolidated") {
        setBaselines([]);
        setSelectedBaselineId(null);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase.rpc("get_project_baselines", {
        p_project_id: selectedProjectId,
      });
      if (error) {
        toast({
          title: "Erro ao buscar linhas de base",
          description: error.message,
          variant: "destructive",
        });
        setBaselines([]);
      } else {
        setBaselines(data || []);
        if (baselineIdToSelect) {
          setSelectedBaselineId(baselineIdToSelect);
        }
      }
      setLoading(false);
    },
    [selectedProjectId, toast]
  );

  useEffect(() => {
    setSelectedBaselineId(null);
    fetchBaselines();
  }, [fetchBaselines]);

  const createBaseline = async (name: string): Promise<boolean> => {
    if (!selectedProjectId || selectedProjectId === "consolidated") return false;
    const { data: baselineId, error } = await supabase.rpc(
      "create_project_baseline",
      { p_project_id: selectedProjectId, p_baseline_name: name }
    );
    if (error || !baselineId) {
      toast({
        title: "Erro ao criar linha de base",
        description: error?.message,
        variant: "destructive",
      });
      return false;
    }
    setSelectedBaselineId(baselineId);
    toast({ title: "Linha de Base criada!" });
    await fetchBaselines(baselineId);
    return true;
  };

  // Nova função para apagar uma linha de base
  const deleteBaseline = async (id: string): Promise<boolean> => {
    const { error } = await supabase.rpc('delete_project_baseline', { p_baseline_id: id });
    if (error) {
      toast({ title: "Erro ao apagar linha de base", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Linha de Base apagada!" });
    // Se a linha de base apagada era a que estava selecionada, limpa a seleção.
    if (selectedBaselineId === id) {
      setSelectedBaselineId(null);
    }
    await fetchBaselines();
    return true;
  };
  
  const contextValue = { baselines, selectedBaselineId, setSelectedBaselineId, createBaseline, deleteBaseline, loading };

  return (<BaselinesContext.Provider value={contextValue}>{children}</BaselinesContext.Provider>);
};

export const useBaselines = () => {
  const context = useContext(BaselinesContext);
  if (context === undefined) throw new Error("useBaselines must be used within a BaselinesProvider");
  return context;
};
