"use client";
import { useState, useMemo, forwardRef, Fragment } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import TaskRow from './task-row';
import { useTableSettings } from '@/hooks/use-table-settings';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';

type TaskWithSubtasks = Task & { subtasks?: TaskWithSubtasks[] };

interface TableViewProps {
    tasks: TaskWithSubtasks[];
    onEditTask: (task: Task) => void;
    onViewTask: (task: Task) => void;
    onOpenObservations: (task: Task) => void;
    deleteTask: (taskId: string) => Promise<boolean>;
    isManager: boolean;
    selectedTasks: Set<string>;
    setSelectedTasks: (tasks: Set<string>) => void;
}

const TableView = forwardRef<HTMLDivElement, TableViewProps>(({
    tasks,
    onEditTask,
    onViewTask,
    onOpenObservations,
    deleteTask,
    isManager,
    selectedTasks,
    setSelectedTasks,
}, ref) => {
    const { 
        visibleColumns, 
        columns, 
        isSettingsReady, 
        sortBy, 
        sortDirection, 
        setSort 
    } = useTableSettings();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const finalVisibleColumns = useMemo(() => {
        if (!isSettingsReady) return [];
        return columns.filter(c => visibleColumns.includes(c.id));
    }, [columns, visibleColumns, isSettingsReady]);

    const allTaskIds = useMemo(() => {
        const ids: string[] = [];
        const traverse = (taskList: TaskWithSubtasks[]) => {
            for (const task of taskList) {
                ids.push(task.id);
                if (task.subtasks) traverse(task.subtasks);
            }
        };
        traverse(tasks);
        return ids;
    }, [tasks]);

    const handleSelectAll = (checked: boolean) => {
        setSelectedTasks(checked ? new Set(allTaskIds) : new Set());
    };
    
    const renderTaskRows = (tasksToRender: TaskWithSubtasks[], level = 0): React.ReactNode[] => {
        return tasksToRender.map(task => (
            <Fragment key={task.id}>
                <TaskRow
                    task={task}
                    level={level}
                    isSelected={selectedTasks.has(task.id)}
                    isManager={isManager}
                    hasSubtasks={!!task.subtasks && task.subtasks.length > 0}
                    isExpanded={expandedRows.has(task.id)}
                    visibleColumns={finalVisibleColumns.map(c => c.id)} 
                    onSelect={(isChecked) => {
                        const newSelectedTasks = new Set(selectedTasks);
                        if (isChecked) newSelectedTasks.add(task.id);
                        else newSelectedTasks.delete(task.id);
                        setSelectedTasks(newSelectedTasks);
                    }}
                    onToggleExpand={() => {
                        const newExpandedRows = new Set(expandedRows);
                        if (newExpandedRows.has(task.id)) newExpandedRows.delete(task.id);
                        else newExpandedRows.add(task.id);
                        setExpandedRows(newExpandedRows);
                    }}
                    onViewTask={onViewTask}
                    onOpenObservations={onOpenObservations}
                    onEditTask={onEditTask}
                    onDeleteTask={deleteTask}
                />
                {expandedRows.has(task.id) && task.subtasks && renderTaskRows(task.subtasks, level + 1)}
            </Fragment>
        ));
    };

    const SortableHeader = ({ columnId, children }: { columnId: string, children: React.ReactNode }) => (
        <Button variant="ghost" onClick={() => setSort(columnId)} className="px-2 py-1 -ml-2">
            {children}
            {sortBy === columnId && (
                sortDirection === 'asc' 
                    ? <ArrowUp className="ml-2 h-4 w-4" /> 
                    : <ArrowDown className="ml-2 h-4 w-4" />
            )}
        </Button>
    );

    const colSpan = finalVisibleColumns.length + 3;
    
    return (
        <div ref={ref} className="border rounded-md overflow-x-auto flex-1">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">
                            <Checkbox 
                                checked={allTaskIds.length > 0 && selectedTasks.size === allTaskIds.length} 
                                onCheckedChange={(checked) => handleSelectAll(!!checked)} 
                                disabled={allTaskIds.length === 0}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader columnId="name">Nome</SortableHeader>
                        </TableHead>
                        {finalVisibleColumns.map(col => (
                            <TableHead key={col.id}>
                                <SortableHeader columnId={col.id}>{col.name}</SortableHeader>
                            </TableHead>
                        ))}
                        <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                {/* **CORREÇÃO**: A lógica de renderização do corpo da tabela foi restaurada */}
                <TableBody>
                     {tasks.length > 0 ? (
                        renderTaskRows(tasks)
                    ) : (
                        <TableRow><TableCell colSpan={colSpan} className="h-24 text-center">Nenhuma tarefa encontrada.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
});

TableView.displayName = "TableView";
export default TableView;
