"use client";
import React, { useMemo } from "react";
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import type { Task as AppTask } from "@/lib/types";

// Tipos e Tooltip (sem alterações, mas mantidos para clareza)
interface CustomGanttTask extends GanttTask { assignee_name?: string; }
const TooltipContent: React.FC<{ task: CustomGanttTask }> = ({ task }) => { /* ...código do tooltip... */ };

// LÓGICA DE CONVERSÃO FINAL, DEFINITIVA E CORRETA
const convertTasksForGantt = (tasks: AppTask[], showBaselines: boolean): CustomGanttTask[] => {
  if (!Array.isArray(tasks)) return [];

  const ganttTasks: CustomGanttTask[] = [];

  tasks.forEach(task => {
    if (!task.start_date || !task.end_date) return; // Ignora tarefas sem datas

    const hasBaseline = showBaselines && task.baseline_start_date && task.baseline_end_date;

    // Se a tarefa tem linha de base, criamos um container para agrupar as duas barras
    if (hasBaseline) {
      // 1. O Container (visível na lista)
      ganttTasks.push({
        id: task.id,
        name: task.name,
        type: 'project', // Vira um "projeto" para poder ter filhos
        project: task.parent_id || undefined, // Mantém a hierarquia original
        start: new Date(task.start_date),
        end: new Date(task.end_date),
        progress: task.progress || 0,
        hideChildren: false,
        assignee_name: task.assignee_name,
      });

      // 2. A Barra de Progresso Atual (filha do container)
      ganttTasks.push({
        id: `${task.id}-actual`,
        name: 'Progresso Atual',
        type: task.is_milestone ? 'milestone' : 'task',
        project: task.id, // Aninhado dentro da tarefa principal
        start: new Date(task.start_date),
        end: new Date(task.end_date),
        progress: task.progress || 0,
        dependencies: task.dependency_ids,
        styles: {
          progressColor: 'hsl(var(--primary))',
          progressSelectedColor: 'hsl(var(--primary-foreground))',
        },
      });
      
      // 3. A Barra de Linha de Base (filha do container, em VERMELHO)
      ganttTasks.push({
        id: `${task.id}-baseline`,
        name: 'Linha de Base',
        type: 'task', // Linha de base não é marco
        project: task.id, // Aninhado dentro da tarefa principal
        start: new Date(task.baseline_start_date!),
        end: new Date(task.baseline_end_date!),
        progress: 100,
        isDisabled: true,
        styles: {
          progressColor: '#ef4444', // Vermelho (cor de erro/alerta)
          progressSelectedColor: '#ef4444',
          backgroundColor: '#fee2e2', // Fundo vermelho claro
          backgroundSelectedColor: '#fee2e2',
        },
      });

    } else {
      // Se não tem linha de base, é uma tarefa simples
      const parentIds = new Set(tasks.map(t => t.parent_id).filter(Boolean));
      const isParent = parentIds.has(task.id);

      ganttTasks.push({
        id: task.id,
        name: task.name,
        start: new Date(task.start_date),
        end: new Date(task.end_date),
        progress: task.progress || 0,
        isDisabled: false,
        type: isParent ? 'project' : (task.is_milestone ? 'milestone' : 'task'),
        project: task.parent_id || undefined,
        dependencies: task.dependency_ids,
        hideChildren: false,
        assignee_name: task.assignee_name,
      });
    }
  });

  return ganttTasks;
};


interface GanttChartWrapperProps {
  tasks: AppTask[];
  viewMode: 'day' | 'week' | 'month' | 'year';
  showBaselines?: boolean;
}

const GanttChartWrapper: React.FC<GanttChartWrapperProps> = ({ tasks, viewMode, showBaselines = false }) => {
  const ganttTasks = useMemo(() => convertTasksForGantt(tasks, showBaselines), [tasks, showBaselines]);
  const ganttViewModeMap = { day: ViewMode.Day, week: ViewMode.Week, month: ViewMode.Month, year: ViewMode.Year };
  
  // Reativa a lista de tarefas para que a hierarquia seja visível
  const listCellWidth = ganttTasks.some(t => t.type === 'project') ? "150px" : "";

  return (
    <div className="w-full gantt-container" style={{ height: '400px', fontFamily: 'inherit' }}>
      <Gantt
        tasks={ganttTasks}
        viewMode={ganttViewModeMap[viewMode]}
        locale="pt-BR"
        listCellWidth={listCellWidth} // Mostra a lista se houver itens aninhados
        ganttHeight={400}
        TooltipContent={TooltipContent}
        arrowColor="hsl(var(--primary))"
        barProgressColor="hsl(var(--primary))"
        barProgressSelectedColor="hsl(var(--primary-foreground))"
      />
    </div>
  );
};

export default GanttChartWrapper;
