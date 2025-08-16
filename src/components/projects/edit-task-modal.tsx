"use client";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { Task, User, Tag, TaskStatus } from "@/lib/types";
import { DatePicker } from "../shared/date-picker";
import { parseUTCDate } from "@/lib/date-utils";
import { MultiSelect } from "../shared/multi-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, GitBranch } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";

interface EditTaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdate: (updatedData: Partial<Task> & { justification?: string, propagate_dates?: boolean }) => void;
  task: Task;
  statuses: TaskStatus[];
  users: User[];
  tasks: Task[];
  tags: Tag[];
}

export default function EditTaskModal({ 
    isOpen, onOpenChange, onTaskUpdate, task, 
    statuses = [], users = [], tasks: allTasks = [], tags = [] 
}: EditTaskModalProps) {
    
    const { projects, loading: loadingProjects } = useProjects();
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [statusId, setStatusId] = useState<string | undefined>();
    const [priority, setPriority] = useState("Média");
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [progress, setProgress] = useState(0);
    const [parentId, setParentId] = useState<string | null>(null);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [dependencyIds, setDependencyIds] = useState<string[]>([]);
    const [isMilestone, setIsMilestone] = useState(false);
    
    const [initialStartDate, setInitialStartDate] = useState<Date | undefined>();
    const [initialEndDate, setInitialEndDate] = useState<Date | undefined>();
    const [justification, setJustification] = useState('');
    const [propagateDates, setPropagateDates] = useState(true);

    const endDateChanged = useMemo(() => initialEndDate?.getTime() !== endDate?.getTime(), [initialEndDate, endDate]);
    const datesChanged = useMemo(() => initialStartDate?.getTime() !== startDate?.getTime() || endDateChanged, [initialStartDate, startDate, endDateChanged]);
    
    useEffect(() => {
        if (task && isOpen) {
            setName(task.name || '');
            setDescription(task.description || '');
            setAssigneeId(task.assignee_id || null);
            setStatusId(task.status_id);
            setPriority(task.priority || 'Média');
            const sDate = task.start_date ? parseUTCDate(task.start_date) : undefined;
            const eDate = task.end_date ? parseUTCDate(task.end_date) : undefined;
            setStartDate(sDate); setEndDate(eDate);
            setInitialStartDate(sDate); setInitialEndDate(eDate);
            setProgress(task.progress || 0);
            setParentId(task.parent_id);
            setTagIds(task.tags?.map(t => t.id) || []);
            setDependencyIds(task.dependency_ids || []);
            setIsMilestone(task.is_milestone || false);
            setJustification('');
            setPropagateDates(true);
        }
    }, [task, isOpen]);

    const availableAssignees = useMemo(() => {
        if (loadingProjects) return [];
        const project = projects.find(p => p.id === task.project_id);
        if (!project) return [];
        const memberIds = new Set([project.owner_id, ...(project.collaborator_ids || [])]);
        return users.filter(user => memberIds.has(user.id));
    }, [task.project_id, projects, users, loadingProjects]);

    const handleSave = () => {
        const updatedData = {
            name, description, assignee_id: assigneeId, status_id: statusId,
            priority, start_date: startDate, end_date: endDate, progress,
            parent_id: parentId, tag_ids: tagIds, dependency_ids: dependencyIds,
            is_milestone: isMilestone,
            justification: datesChanged ? justification : undefined,
            propagate_dates: endDateChanged ? propagateDates : false
        };
        onTaskUpdate(updatedData);
        onOpenChange(false);
    };
    
    const tagOptions = tags.map(tag => ({ value: tag.id, label: tag.name }));
    const taskOptions = allTasks.filter(t => t.id !== task.id).map(t => ({ value: t.id, label: t.name }));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[600px] overflow-y-auto">
                <DialogHeader><DialogTitle>Editar Tarefa: {name}</DialogTitle></DialogHeader>
                <div className="p-4 space-y-6">
                    <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
                        <div className="flex-1 space-y-4">
                            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                            <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                            <div className="flex space-x-4">
                                <div className="flex-1"><Label>Início</Label><DatePicker date={startDate} setDate={setStartDate} /></div>
                                <div className="flex-1"><Label>Fim</Label><DatePicker date={endDate} setDate={setEndDate} /></div>
                            </div>
                            {datesChanged && (
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Justifique</AlertTitle>
                                    <AlertDescription>
                                        <Textarea placeholder="Motivo..." value={justification} onChange={(e) => setJustification(e.target.value)} className="mt-2"/>
                                    </AlertDescription>
                                </Alert>
                            )}
                            {endDateChanged && (
                                <Alert variant="destructive" className="mt-4">
                                    <GitBranch className="h-4 w-4" />
                                    <AlertTitle>Propagar Mudanças?</AlertTitle>
                                    <AlertDescription>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Switch id="propagate-dates" checked={propagateDates} onCheckedChange={setPropagateDates} />
                                            <Label htmlFor="propagate-dates">Sim, ajustar tarefas dependentes</Label>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div><Label>Progresso: {progress}%</Label><Slider value={[progress]} onValueChange={(v) => setProgress(v[0])} /></div>
                            <div className="flex items-center space-x-2"><Switch checked={isMilestone} onCheckedChange={setIsMilestone} /><Label>Marco</Label></div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div><Label>Responsável</Label><Select value={assigneeId || 'unassigned'} onValueChange={(v) => setAssigneeId(v === 'unassigned' ? null : v)} disabled={loadingProjects}><SelectTrigger><SelectValue placeholder="Ninguém" /></SelectTrigger><SelectContent><SelectItem value="unassigned">Ninguém</SelectItem>{availableAssignees.map(u=><SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}</SelectContent></Select></div>
                            <div className="flex space-x-4">
                                <div className="flex-1"><Label>Status</Label><Select value={statusId} onValueChange={setStatusId}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{statuses.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                                <div className="flex-1"><Label>Prioridade</Label><Select value={priority} onValueChange={(p)=>setPriority(p as any)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Baixa">Baixa</SelectItem><SelectItem value="Média">Média</SelectItem><SelectItem value="Alta">Alta</SelectItem></SelectContent></Select></div>
                            </div>
                            <div><Label>Tags</Label><MultiSelect options={tagOptions} selected={tagIds} onChange={setTagIds}/></div>
                            <div><Label>Tarefa Pai</Label><Select value={parentId || 'none'} onValueChange={(v) => setParentId(v === 'none' ? null : v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Nenhuma</SelectItem>{taskOptions.map(t=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label>Dependências</Label><MultiSelect options={taskOptions} selected={dependencyIds} onChange={setDependencyIds}/></div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="justify-center space-x-2 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button variant="default" onClick={handleSave} disabled={datesChanged && !justification.trim()}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
