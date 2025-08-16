
"use client";
import { useMemo, useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format, isSameDay, isWithinInterval, startOfDay, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks } from '@/hooks/use-tasks';
import { useTableSettings, type TaskStatus } from '@/hooks/use-table-settings';
import type { Task } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export const isTaskOnDate = (task: Task, date: Date) => {
    const start = parseISO(`${task.start_date}T00:00:00`);
    const end = parseISO(`${task.end_date}T00:00:00`);
    if (!isValid(start) || !isValid(end)) return false;
    return (
        isSameDay(date, start) ||
        isSameDay(date, end) ||
        isWithinInterval(date, { start: startOfDay(start), end: startOfDay(end) })
    );
};

const DayContent = ({ date, tasksForDay, statuses }: { date: Date; tasksForDay: Task[]; statuses: TaskStatus[] }) => {
    const dayTasks = tasksForDay.filter(task => isTaskOnDate(task, date));

    if (dayTasks.length === 0) return <div>{format(date, 'd')}</div>;
    
    return (
        <div className="relative h-full w-full">
            {format(date, 'd')}
            <div className="absolute bottom-1 right-1 flex -space-x-1">
                {dayTasks.slice(0, 2).map(task => {
                    const status = statuses.find(s => s.id === task.status_id);
                    return (
                        <div key={task.id} className="h-2 w-2 rounded-full" style={{ backgroundColor: status?.color || '#ccc' }} />
                    );
                })}
                 {dayTasks.length > 2 && <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />}
            </div>
        </div>
    );
};

export default function InteractiveCalendar() {
    const { tasks, loading: tasksLoading } = useTasks();
    const { statuses } = useTableSettings();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const tasksForSelectedDay = useMemo(() => {
        if (!selectedDate) return [];
        return tasks.filter(task => isTaskOnDate(task, selectedDate));
    }, [tasks, selectedDate]);
    
    if (tasksLoading) {
        return (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2">Carregando tarefas do calendário...</span>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            <div className="md:col-span-2">
                <Card className="h-full">
                    <CardContent className="p-0">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="w-full"
                            locale={ptBR}
                            components={{
                                DayContent: ({ date }) => <DayContent date={date} tasksForDay={tasks} statuses={statuses} />, 
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-2">
                    Tarefas para {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : 'Nenhum dia selecionado'}
                </h3>
                <div className="space-y-2 h-[calc(100%-2rem)] overflow-y-auto">
                    {tasksForSelectedDay.length > 0 ? tasksForSelectedDay.map(task => {
                        const status = statuses.find(s => s.id === task.status_id);
                        return (
                             <Card key={task.id}>
                                <CardContent className="p-3">
                                    <p className="font-medium">{task.name}</p>
                                    <Badge variant="outline" style={{ borderColor: status?.color, color: status?.color }}>
                                        {status?.name || 'N/A'}
                                    </Badge>
                                </CardContent>
                            </Card>
                        )
                    }) : (
                        <p className="text-muted-foreground">Nenhuma tarefa para este dia.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
