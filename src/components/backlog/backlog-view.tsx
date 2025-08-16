
"use client"
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from '@/lib/types';
import { useTasks } from '@/hooks/use-tasks';
import { useTableSettings } from '@/hooks/use-table-settings';
import { Loader2 } from 'lucide-react';

interface BacklogViewProps {
  selectedProject: string;
  userRole?: 'admin' | 'manager' | 'member';
  viewType: 'backlog' | 'my-tasks';
}

// O tipo de Task que vem do hook agora inclui o nome do projeto
type TaskWithProject = Task & { projects: { name: string } | null };

export default function BacklogView({ selectedProject, userRole = 'admin', viewType }: BacklogViewProps) {
    const { tasks, loading, updateTask, userId } = useTasks();
    const { statuses } = useTableSettings();

    const handleStatusChange = (taskId: string, newStatusId: string) => {
        const originalTask = tasks.find(t => t.id === taskId);
        if (originalTask) {
            updateTask({ id: taskId, status_id: newStatusId }, originalTask);
        }
    };

    const getPriorityVariant = (priority: string): BadgeProps['variant'] => {
        switch (priority?.toLowerCase()) {
            case 'alta': return 'destructive';
            case 'média': return 'secondary';
            default: return 'outline';
        }
    };

    const visibleTasks = useMemo(() => {
        const allTasks = (tasks as TaskWithProject[]) || [];
        const safeStatuses = statuses || [];

        return allTasks.filter(task => {
            if (viewType === 'my-tasks') {
                const doneStatusIds = safeStatuses.filter(s => s.name.toLowerCase() === 'feito').map(s => s.id);
                if (task.assignee_id !== userId || (task.status_id && doneStatusIds.includes(task.status_id))) {
                    return false;
                }
            } else if (viewType === 'backlog') {
                const todoStatusIds = safeStatuses.filter(s => s.name.toLowerCase() === 'a fazer').map(s => s.id);
                if (!task.status_id || !todoStatusIds.includes(task.status_id)) {
                    return false;
                }
            }

            if (selectedProject !== 'consolidated' && task.project_id !== selectedProject) {
                return false;
            }

            return true;
        });
        
    }, [tasks, statuses, viewType, userId, selectedProject]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2">Carregando...</span>
            </div>
        )
    }

    return (
        <div className="border rounded-lg w-full bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                             <Checkbox />
                        </TableHead>
                        <TableHead>Nome da Tarefa</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visibleTasks.length > 0 ? visibleTasks.map((task: TaskWithProject) => {
                       const status = (statuses || []).find(s => s.id === task.status_id);
                        return (
                            <TableRow key={task.id}>
                                <TableCell>
                                    <Checkbox />
                                </TableCell>
                                <TableCell className="font-medium">{task.name}</TableCell>
                                {/* Corrigido: Mostrar o nome do projeto */}
                                <TableCell>{task.projects?.name || 'N/A'}</TableCell>
                                <TableCell>
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{task.assignee_id?.substring(0,2).toUpperCase() || 'N/A'}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Select 
                                        defaultValue={task.status_id || ''} 
                                        onValueChange={(newStatusId) => handleStatusChange(task.id, newStatusId)}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Selecione um status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(statuses || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        )
                    }) : (
                         <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Nenhuma tarefa encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
