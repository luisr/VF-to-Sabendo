"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import type { Project } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "./use-users";
import { parseUTCDate, formatToISODate } from "@/lib/date-utils";

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  selectedProjectId: string | null;
  setSelectedProjectId: Dispatch<SetStateAction<string | null>>;
  refetchProjects: () => Promise<void>;
  saveProject: (
    projectData: any,
    projectId?: string
  ) => Promise<{ success: boolean; newProjectId?: string | null }>;
  deleteProject: (id: string) => Promise<boolean>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { user, loading: userLoading } = useUsers();
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('get_my_projects_details');
    if (error) {
      toast({ title: "Erro ao carregar projetos", description: error.message, variant: "destructive" });
      setProjects([]);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    if (!userLoading) fetchProjects();
  }, [fetchProjects, userLoading]);

  useEffect(() => {
    if (!loading && projects.length > 0 && !selectedProjectId) setSelectedProjectId('consolidated');
    if (selectedProjectId && selectedProjectId !== 'consolidated' && !projects.find(p => p.id === selectedProjectId)) {
      setSelectedProjectId('consolidated');
    }
  }, [projects, loading, selectedProjectId]);

  const saveProject = async (
    projectData: any,
    projectId?: string
  ): Promise<{ success: boolean; newProjectId?: string | null }> => {
    const { name, description, start_date, end_date, budget, collaborator_ids } = projectData;
    
    // CORREÇÃO: Garante que as datas sejam formatadas corretamente para a RPC
    const formattedStartDate = start_date ? formatToISODate(parseUTCDate(start_date)) : null;
    const formattedEndDate = end_date ? formatToISODate(parseUTCDate(end_date)) : null;

    const { data, error } = await supabase.rpc('manage_project', {
      p_project_id: projectId || null,
      p_name: name,
      p_description: description,
      p_start_date: formattedStartDate,
      p_end_date: formattedEndDate,
      p_budget: budget,
      p_collaborator_ids: collaborator_ids || []
    });

    if (error) {
      toast({ title: 'Erro ao salvar projeto', description: error.message, variant: 'destructive' });
      return { success: false };
    }
    await fetchProjects();
    toast({ title: projectId ? "Projeto atualizado!" : "Projeto criado!" });
    return { success: true, newProjectId: data };
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('delete_project', { p_project_id: id });
    if (error || (data && !data.success)) {
      toast({ title: 'Erro ao excluir projeto', description: data?.message || error?.message, variant: 'destructive' });
      return false;
    }
    toast({ title: "Projeto excluído!" });
    await fetchProjects();
    if (selectedProjectId === id) setSelectedProjectId('consolidated');
    return true;
  };

  const contextValue: ProjectsContextType = {
    projects,
    loading,
    selectedProjectId,
    setSelectedProjectId,
    refetchProjects: fetchProjects,
    saveProject,
    deleteProject,
  };

  return (
    <ProjectsContext.Provider value={contextValue}>{children}</ProjectsContext.Provider>
  );
};

export const useProjects = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (context === undefined)
    throw new Error("useProjects must be used within a ProjectsProvider");
  return context;
};
