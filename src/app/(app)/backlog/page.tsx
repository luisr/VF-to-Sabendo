
"use client";

import { useState, useEffect, Suspense } from "react";
import PageHeader from "@/components/shared/page-header";
import ProjectSelector from "@/components/shared/project-selector";
import BacklogView from "@/components/backlog/backlog-view";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { Loader2 } from "lucide-react";

const BacklogPageContent = () => {
    const [selectedProject, setSelectedProject] = useState("consolidated");
    const { projects, loading: projectsLoading } = useProjects();
    const { setSelectedProjectId } = useTasks();

    useEffect(() => {
        if (selectedProject && selectedProject !== 'consolidated') {
            setSelectedProjectId(selectedProject);
        } else {
            setSelectedProjectId(null);
        }
    }, [selectedProject, setSelectedProjectId]);

    if (projectsLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <PageHeader 
                title="Backlog" 
                actions={
                     <ProjectSelector 
                        projects={projects}
                        value={selectedProject} 
                        onValueChange={setSelectedProject} 
                    />
                }
            />
            <BacklogView selectedProject={selectedProject} viewType="backlog" />
        </div>
    )
}

export default function BacklogPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <BacklogPageContent />
        </Suspense>
    )
}
