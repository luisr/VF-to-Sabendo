"use client"
import { useMemo } from 'react';
import { DragDropContext, Draggable, DropResult } from '@hello-pangea/dnd';
import { StrictModeDroppable } from '@/components/shared/strict-mode-droppable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, ArrowUp, ArrowRight, ArrowDown, GripVertical } from 'lucide-react';
import type { Task } from '@/lib/types';
import type { TaskStatus } from '@/hooks/use-table-settings';
import { cn } from '@/lib/utils';
import { parseUTCDate } from '@/lib/date-utils';

interface KanbanBoardProps {
  tasks: Task[];
  statuses: TaskStatus[];
  onDragEnd: (result: DropResult) => void;
  loading: boolean;
  onEditTask: (task: Task) => void;
}

const priorityIcons: Record<Task['priority'], React.ReactNode> = {
    'Baixa': <ArrowDown className="h-4 w-4 text-gray-500" />,
    'Média': <ArrowRight className="h-4 w-4 text-yellow-500" />,
    'Alta': <ArrowUp className="h-4 w-4 text-red-500" />,
};

function getInitials(name?: string) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}


export default function KanbanBoard({ tasks, statuses, onDragEnd, loading, onEditTask }: KanbanBoardProps) {
    
    const columns = useMemo(() => {
        const tasksByStatus: Record<string, Task[]> = {};
        statuses.forEach(status => { tasksByStatus[status.id] = []; });
        tasks.forEach(task => {
            if (task.status_id && tasksByStatus[task.status_id]) {
                tasksByStatus[task.status_id].push(task);
            }
        });
        return statuses.map(status => ({
            ...status,
            tasks: tasksByStatus[status.id]?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) || []
        }));
    }, [tasks, statuses]);
    
    if (loading) {
         return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-4 items-start h-full pb-4">
                        {columns.map(column => (
                            <StrictModeDroppable
                                key={column.id}
                                droppableId={column.id}
                                isDropDisabled={false}
                                isCombineEnabled={false}
                                ignoreContainerClipping={false}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                            "bg-muted/60 rounded-lg w-80 flex flex-col flex-shrink-0 max-h-full transition-colors",
                                            snapshot.isDraggingOver && "bg-muted"
                                        )}
                                    >
                                        <div className="p-3 px-4 flex items-center justify-between border-b" style={{ borderColor: column.color }}>
                                            <div className="flex items-center gap-3">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color }}></span>
                                                <h3 className="font-semibold text-md">{column.name}</h3>
                                            </div>
                                            <Badge variant="secondary" className="text-sm">{column.tasks.length}</Badge>
                                        </div>
                                        <div className="p-2 flex-1 overflow-y-auto">
                                            {column.tasks.map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                    {(providedDraggable, snapshotDraggable) => (
                                                        <div
                                                            ref={providedDraggable.innerRef}
                                                            {...providedDraggable.draggableProps}
                                                            className={cn("group relative mb-2.5", snapshotDraggable.isDragging && "opacity-80")}
                                                        >
                                                            <div {...providedDraggable.dragHandleProps} className="absolute top-1/2 -left-3.5 -translate-y-1/2 text-muted-foreground opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1">
                                                                <GripVertical className="h-5 w-5" />
                                                            </div>
                                                            <Card
                                                                onClick={() => onEditTask(task)}
                                                                className={cn(
                                                                    "cursor-pointer bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-200",
                                                                    snapshotDraggable.isDragging && "ring-2 ring-primary"
                                                                )}
                                                            >
                                                                <CardContent className="p-3">
                                                                    <p className="font-semibold text-sm mb-2.5">{task.name}</p>
                                                                    {task.tags && task.tags.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                                                            {task.tags.map(tag => tag && <Badge key={tag.id} variant="secondary" className="text-xs font-medium">{tag.name}</Badge>)}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between items-center">
                                                                        <TooltipProvider delayDuration={200}>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Avatar className="h-7 w-7">
                                                                                        <AvatarImage src={task.assignee_avatar} alt={task.assignee_name} />
                                                                                        <AvatarFallback className="text-xs font-bold">{getInitials(task.assignee_name)}</AvatarFallback>
                                                                                    </Avatar>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent><p>{task.assignee_name || 'Não atribuído'}</p></TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                                           <span className="text-xs font-medium">{task.end_date ? parseUTCDate(task.end_date)?.toLocaleDateString() : ''}</span>
                                                                            <TooltipProvider delayDuration={200}>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <span className='cursor-default'>{priorityIcons[task.priority || 'Média']}</span>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent><p>Prioridade: {task.priority}</p></TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </StrictModeDroppable>
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
}
