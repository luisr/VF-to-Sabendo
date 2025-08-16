"use client";

import { useMemo } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { Loader2 } from "lucide-react";
import GanttChartWrapper from "./gantt-chart-wrapper";

interface RoadmapViewProps {
  selectedProject: string;
  userRole?: "admin" | "manager";
}

export default function RoadmapView({ selectedProject }: RoadmapViewProps) {
  const { tasks, loading } = useTasks();

  const roadmapTasks = useMemo(
    () => (tasks || []).filter((t) => t.is_milestone),
    [tasks]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Carregando roadmap...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto border rounded-lg bg-card p-4">
      {roadmapTasks.length > 0 ? (
        <div className="h-[400px]">
          <GanttChartWrapper
            tasks={roadmapTasks}
            isConsolidated={false}
            viewMode="month"
            showBaselines={false}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Nenhum marco para exibir no roadmap.
        </div>
      )}
    </div>
  );
}

