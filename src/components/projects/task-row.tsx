"use client";
import { useState } from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronRight, Eye, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import type { Task, Tag } from "@/lib/types";
import { useTableSettings } from '@/hooks/use-table-settings';
import { parseUTCDate } from '@/lib/date-utils';
import { AlertModal } from '@/components/shared/alert-modal';
import { useTasks } from '@/hooks/use-tasks';
import { useToast } from '@/hooks/use-toast';

interface TaskRowProps {
  task: Task & { subtasks?: any[] };
  level: number;
  isSelected: boolean;
  isManager: boolean;
  currentUserId?: string;
  hasSubtasks: boolean;
  isExpanded: boolean;
  visibleColumns: string[];
  onSelect: (checked: boolean) => void;
  onToggleExpand: () => void;
  onViewTask: (task: Task) => void;
  onOpenObservations: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const renderCell = (task: Task, columnId: string, columns: any[]) => {
    // Primeiro, verifica se é uma coluna personalizada
    const customColumn = columns.find(c => c.id === columnId);
    if (customColumn && customColumn.id.startsWith('custom_')) {
        const value = task.custom_fields?.[columnId];
        switch (customColumn.type) {
            case 'text': case 'number': return value || 'N/A';
            case 'date': return value ? parseUTCDate(value).toLocaleDateString() : 'N/A';
            case 'progress': return <div className="flex items-center gap-2"><Progress value={value || 0} className="w-[60%]" /> <span>{value || 0}%</span></div>;
            default: return 'N/A';
        }
    }

    // Se não for personalizada, trata como uma coluna padrão
    switch (columnId) {
        case 'formatted_id': return <Badge variant="secondary">{task.formatted_id}</Badge>;
        case 'project_name': return task.project_name || 'N/A';
        case 'assignee_name': return task.assignee_name || 'N/A';
        case 'status_name': return <Badge style={{ backgroundColor: task.status_color }} className="text-white">{task.status_name}</Badge>;
        case 'priority': return <Badge variant={task.priority === 'Alta' ? 'destructive' : task.priority === 'Média' ? 'secondary' : 'outline'}>{task.priority}</Badge>;
        case 'tags': return <div className="flex flex-wrap gap-1">{task.tags?.map((t: Tag) => <Badge key={t.id} variant="outline">{t.name}</Badge>)}</div>;
        case 'progress': return <div className="flex items-center gap-2"><Progress value={task.progress || 0} className="w-[60%]" /> <span>{task.progress || 0}%</span></div>;
        case 'start_date': return task.start_date ? parseUTCDate(task.start_date).toLocaleDateString() : 'N/A';
        case 'end_date': return task.end_date ? parseUTCDate(task.end_date).toLocaleDateString() : 'N/A';
        case 'duration':
            if (task.start_date && task.end_date) {
                const diffTime = Math.abs(parseUTCDate(task.end_date).getTime() - parseUTCDate(task.start_date).getTime());
                return `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} dias`;
            }
            return 'N/A';
        default: return null;
    }
};

export default function TaskRow({
  task, level, isSelected, isManager, currentUserId, hasSubtasks, isExpanded,
  visibleColumns, onSelect, onToggleExpand, onViewTask, onOpenObservations,
  onEditTask, onDeleteTask
}: TaskRowProps) {
  const { columns } = useTableSettings();
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>("");
  const { saveTask } = useTasks();
  const { toast } = useToast();

  const canEdit = isManager || task.assignee_id === currentUserId;
  const canDelete = isManager;

  const startEditing = (colId: string) => {
    setEditingColumn(colId);
    const col = columns.find(c => c.id === colId);
    let value: any;
    if (colId.startsWith('custom_')) {
      value = task.custom_fields?.[colId] ?? '';
    } else {
      // @ts-ignore
      value = task[colId] ?? '';
    }
    if (col?.type === 'date' && value) {
      value = parseUTCDate(value)?.toISOString().split('T')[0];
    }
    setEditValue(value);
  };

  const handleBlur = async () => {
    if (!editingColumn) return;
    const col = columns.find(c => c.id === editingColumn);
    let value: any = editValue;

    if (col?.type === 'number' || col?.type === 'progress') {
      const num = Number(value);
      if (isNaN(num) || (col?.type === 'progress' && (num < 0 || num > 100))) {
        toast({ title: 'Valor inválido', variant: 'destructive' });
        setEditingColumn(null);
        return;
      }
      value = num;
    } else if (col?.type === 'date') {
      const date = parseUTCDate(value);
      if (!date || isNaN(date.getTime())) {
        toast({ title: 'Data inválida', variant: 'destructive' });
        setEditingColumn(null);
        return;
      }
      value = date;
    }

    let payload: any;
    if (editingColumn.startsWith('custom_')) {
      payload = { custom_fields: { ...(task.custom_fields || {}), [editingColumn]: value } };
    } else {
      payload = { [editingColumn]: value };
    }

    const success = await saveTask(payload, task.id);
    if (!success) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
    setEditingColumn(null);
  };

  return (
    <>
      <AlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onConfirm={() => { onDeleteTask(task.id); setIsAlertModalOpen(false); }}
        title="Excluir Tarefa"
        description={`Tem certeza de que deseja excluir a tarefa "${task.name}"? Esta ação não pode ser desfeita.`}
      />
      <TableRow className={isSelected ? 'bg-muted/50' : ''}>
        <TableCell>
            <div className="flex items-center" style={{ paddingLeft: `${level * 1.5}rem` }}>
                {hasSubtasks && (
                    <Button variant="ghost" size="icon" onClick={onToggleExpand} className="h-6 w-6 mr-1">
                        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </Button>
                )}
                {!hasSubtasks && <div className="w-7 mr-1" />} 
                <Checkbox checked={isSelected} onCheckedChange={onSelect} />
            </div>
        </TableCell>
        <TableCell className="font-medium">{task.wbs_code} {task.name}</TableCell>
        
        {visibleColumns.map(colId => {
            const isEditing = editingColumn === colId;
            const isEditable = ['start_date', 'end_date', 'progress'].includes(colId) || colId.startsWith('custom_');
            const col = columns.find(c => c.id === colId);
            const inputType = col?.type === 'date' ? 'date' : (col?.type === 'number' || col?.type === 'progress') ? 'number' : 'text';
            return (
                <TableCell key={colId} onDoubleClick={() => isEditable && startEditing(colId)}>
                    {isEditing ? (
                        <Input
                            type={inputType}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleBlur}
                            autoFocus
                            className="h-8"
                        />
                    ) : (
                        renderCell(task, colId, columns)
                    )}
                </TableCell>
            );
        })}

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewTask(task)}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenObservations(task)}><MessageSquare className="mr-2 h-4 w-4" />Observações</DropdownMenuItem>
              {(canEdit || canDelete) && <DropdownMenuSeparator />}
              {canEdit && <DropdownMenuItem onClick={() => onEditTask(task)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>}
              {canDelete && <DropdownMenuItem onClick={() => setIsAlertModalOpen(true)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    </>
  );
}
