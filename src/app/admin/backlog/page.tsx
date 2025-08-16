
"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import PageHeader from "@/components/shared/page-header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import BacklogView from "@/components/backlog/backlog-view";
import ProjectSelector from "@/components/shared/project-selector";
import { useProjects } from "@/hooks/use-projects"; // Para popular o seletor

// Hook dedicado para buscar os dados do backlog global
const useGlobalBacklog = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchBacklog = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_global_backlog_tasks');
            if (error) {
                toast({ title: "Erro ao buscar backlog global", description: error.message, variant: "destructive" });
                setTasks([]);
            } else {
                setTasks(data || []);
            }
            setLoading(false);
        };
        fetchBacklog();
    }, [toast]);

    return { tasks, loading };
};

const AdminBacklogPageContent = () => {
    const { tasks: allBacklogTasks, loading: backlogLoading } = useGlobalBacklog();
    const { projects, loading: projectsLoading } = useProjects();
    const [selectedProject, setSelectedProject] = useState("consolidated");

    const filteredTasks = useMemo(() => {
        if (selectedProject === "consolidated") {
            return allBacklogTasks;
        }
        return allBacklogTasks.filter(task => task.project_id === selectedProject);
    }, [selectedProject, allBacklogTasks]);

    const projectSelectorOptions = useMemo(() => {
        return [{ id: 'consolidated', name: 'Visão Consolidada' }, ...projects];
    }, [projects]);

    if (backlogLoading || projectsLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <PageHeader 
                title="Backlog Global (Admin)"
                description="Todas as tarefas 'A Fazer' da organização. Use o filtro para inspecionar um projeto."
                actions={
                    <ProjectSelector 
                        projects={projectSelectorOptions}
                        value={selectedProject} 
                        onValueChange={setSelectedProject} 
                    />
                }
            />
            <BacklogView tasks={filteredTasks} viewType="backlog" />
        </div>
    )
}

export default function AdminBacklogPage() {
    return (
        <Suspense fallback={<div>Carregando Backlog...</div>}>
            <AdminBacklogPageContent />
        </Suspense>
    )
}
