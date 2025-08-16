"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import type { Task } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { formatToISODate, parseUTCDate } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";
import { useTableSettings, SortDirection } from "./use-table-settings";
import { useProjects } from "./use-projects";
import { useBaselines } from "@/hooks/use-baselines";

type TaskSubmissionData = Partial<Omit<Task, 'tags' | 'dependency_ids'>> & {
  tag_ids?: string[];
  dependency_ids?: string[];
  justification?: string;
  propagate_dates?: boolean;
};

type TaskNode = Task & { subtasks: TaskNode[] };

const sortTasks = (tasks: TaskNode[], sortBy: string | null, sortDirection: SortDirection): TaskNode[] => {
    if (!sortBy) return tasks;
    const compare = (a: any, b: any) => {
        const valA = a[sortBy] ?? '';
        const valB = b[sortBy] ?? '';
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') return sortDirection === 'asc' ? valA - valB : valB - valA;
        if (typeof valA === 'string' && typeof valB === 'string') return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return 0;
    };
    const sortedTopLevel = [...tasks].sort(compare);
    return sortedTopLevel.map(task => ({ ...task, subtasks: task.subtasks ? sortTasks(task.subtasks, sortBy, sortDirection) : [] }));
};

const nestTasks = (tasks: Task[]): TaskNode[] => {
    if (!tasks || tasks.length === 0) return [];
    const taskMap: { [key: string]: TaskNode } = {};
    tasks.forEach(task => taskMap[task.id] = { ...task, subtasks: [] });
    const nestedTasks: TaskNode[] = [];
    tasks.forEach(task => {
        if (task.parent_id && taskMap[task.parent_id]) {
            taskMap[task.parent_id].subtasks.push(taskMap[task.id]);
        } else {
            nestedTasks.push(taskMap[task.id]);
        }
    });
    return nestedTasks;
};

interface ReplanSuggestion { /* ... */ }

interface TasksContextType {
  tasks: TaskNode[];
  rawTasks: Task[];
  loading: boolean;
  filterByAssignee: string | null;
  setFilterByAssignee: (userId: string | null) => void;
  filterByStatus: string | null;
  setFilterByStatus: (statusId: string | null) => void;
  saveTask: (taskData: TaskSubmissionData, taskId?: string, notify?: boolean) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  refetchTasks: () => void;
  applyReplan: (suggestions: ReplanSuggestion[], observation: string) => Promise<{ success: boolean; message?: string }>;
  updateTaskStatus: (taskId: string, newStatusId: string) => Promise<void>;
  setParentTask: (taskId: string, parentId: string | null) => Promise<void>;
  exportTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [rawTasks, setRawTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProjectId } = useProjects();
  const { selectedBaselineId } = useBaselines();
  const { toast } = useToast();
  const { sortBy, sortDirection, isSettingsReady } = useTableSettings();
  const [filterByAssignee, setFilterByAssignee] = useState<string | null>(null);
  const [filterByStatus, setFilterByStatus] = useState<string | null>(null);

  // CORREÇÃO: Lógica de fetchTasks restaurada
  const fetchTasks = useCallback(async () => { 
    if (!selectedProjectId) { setRawTasks([]); setLoading(false); return; }
    setLoading(true);
    const rpcName = selectedProjectId === 'consolidated' ? 'get_all_user_tasks' : 'get_tasks_for_project';
    const rpcParams = selectedProjectId === 'consolidated' ? {} : { p_project_id: selectedProjectId, p_baseline_id: selectedBaselineId };
    
    let query = supabase.rpc(rpcName, rpcParams as any);

    if (selectedProjectId !== 'consolidated') {
        if (filterByAssignee) query = query.eq('assignee_id', filterByAssignee);
        if (filterByStatus) {
            if (filterByStatus === 'backlog') {
                const { data: doneStatus } = await supabase.from('task_statuses').select('id').eq('name', 'Concluído').single();
                if (doneStatus) query = query.not('status_id', 'eq', doneStatus.id);
            } else {
                query = query.eq('status_id', filterByStatus);
            }
        }
    }
    const { data, error } = await query;
    if (error) { toast({ title: "Erro ao carregar tarefas", description: error.message, variant: "destructive" }); setRawTasks([]);
    } else { setRawTasks((data as Task[]) || []); }
    setLoading(false);
  }, [selectedProjectId, filterByAssignee, filterByStatus, selectedBaselineId, toast]);

  useEffect(() => {
    if (isSettingsReady && selectedProjectId) fetchTasks();
    else if (!selectedProjectId) { setRawTasks([]); setLoading(false); }
  }, [fetchTasks, isSettingsReady, selectedProjectId, selectedBaselineId]);
  
  const tasks = useMemo(() => sortTasks(nestTasks(rawTasks), sortBy, sortDirection), [rawTasks, sortBy, sortDirection]);

  const sendTaskNotification = async (assigneeId?: string | null, taskName?: string | null, statusId?: string | null, endDate?: string | Date | null) => { /* ... */ };

  const formatTaskDate = (date: any): string | null => {
    if (!date) return null;
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    try {
      return formatToISODate(parseUTCDate(date));
    } catch (error) {
      console.warn("Valor de data inválido:", date, error);
      return null;
    }
  };

  const saveTask = async (taskData: TaskSubmissionData, taskId?: string, notify: boolean = true): Promise<boolean> => {
    const finalProjectId = taskId ? rawTasks.find(t => t.id === taskId)?.project_id : (taskData.project_id || selectedProjectId);
    if (!finalProjectId || finalProjectId === 'consolidated') {
      toast({ title: "Ação Inválida", description: "Selecione um projeto para salvar.", variant: "destructive" });
      return false;
    }
    const { error } = await supabase.rpc('manage_task', {
        p_task_id: taskId || null, p_project_id: finalProjectId,
        p_name: taskData.name || null, p_description: taskData.description || null,
        p_assignee_id: taskData.assignee_id || null, p_status_id: taskData.status_id || null,
        p_priority: taskData.priority || 'Medium', p_progress: taskData.progress || 0,
        p_start_date: formatTaskDate(taskData.start_date),
        p_end_date: formatTaskDate(taskData.end_date),
        p_parent_id: taskData.parent_id || null, p_is_milestone: taskData.is_milestone || false,
        p_tag_ids: taskData.tag_ids || [], p_dependency_ids: taskData.dependency_ids || [],
        p_custom_fields: taskData.custom_fields || {},
        p_justification: taskData.justification || null, p_propagate_dates: taskData.propagate_dates || false
    });
    if (error) { toast({ title: "Erro ao salvar tarefa", description: error.message, variant: "destructive" }); return false; }
    toast({ title: taskId ? "Tarefa atualizada!" : "Tarefa criada!" });
    await fetchTasks();
    if (notify) { await sendTaskNotification(taskData.assignee_id, taskData.name, taskData.status_id, taskData.end_date); }
    return true;
  };
  
  const deleteTask = async (taskId: string): Promise<boolean> => { /* ... */ return true; };
  const applyReplan = async (suggestions: ReplanSuggestion[], observation: string): Promise<{ success: boolean; message?: string }> => { /* ... */ return { success: true }; };
  const updateTaskStatus = async (taskId: string, newStatusId: string) => { /* ... */ };
  const setParentTask = async (taskId: string, parentId: string | null) => { /* ... */ };
  const exportTasks = async () => { /* ... */ };

  const contextValue = {
      tasks, rawTasks, loading,
      filterByAssignee, setFilterByAssignee,
      filterByStatus, setFilterByStatus,
      saveTask, deleteTask, refetchTasks: fetchTasks, applyReplan,
      updateTaskStatus, setParentTask, exportTasks
  };
  
  return <TasksContext.Provider value={contextValue}>{children}</TasksContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) throw new Error("useTasks must be used within a TasksProvider");
  return context;
};
