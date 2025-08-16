"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";

interface ProjectSelectorProps {
  className?: string;
  // A propriedade showConsolidatedView pode permanecer para controlar
  // se a "Visão Consolidada" deve ser uma opção.
  showConsolidatedView?: boolean;
  onChange?: (projectId: string) => void;
}

export default function ProjectSelector({
  className,
  showConsolidatedView = true,
  onChange,
}: ProjectSelectorProps) {

  // O componente agora obtém tudo o que precisa do hook useProjects.
  const { 
    projects, 
    loading, 
    selectedProjectId, 
    setSelectedProjectId 
  } = useProjects();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Carregando...</span>
      </div>
    )
  }

  // Não renderiza nada se não houver projetos e a visão consolidada não for mostrada.
  if (projects.length === 0 && !showConsolidatedView) {
    return null;
  }

  return (
    <Select
      // O valor e o callback de mudança vêm diretamente do hook.
      value={selectedProjectId || ""}
      onValueChange={(value) => {
        setSelectedProjectId(value);
        onChange?.(value);
      }}
    >
      <SelectTrigger className={className || "w-[280px]"}>
        <SelectValue placeholder="Selecione um projeto" />
      </SelectTrigger>
      <SelectContent>
        {showConsolidatedView && <SelectItem value="consolidated">Visão Consolidada</SelectItem>}
        {projects.map(project => (
          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
