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
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "@/hooks/use-projects";
import { MultiSelect } from "../shared/multi-select";
import { addDays } from "date-fns";
import { parseUTCDate } from '@/lib/date-utils';

interface AddTaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskData: any) => void;
  selectedProject: string;
  statuses: TaskStatus[];
  users: User[];
  tasks: Task[];
  tags: Tag[];
}

export default function AddTaskModal({ 
    isOpen, onOpenChange, onSave, selectedProject, 
    statuses = [], users = [], tasks = [], tags = []
}: AddTaskModalProps) {
    const { toast } = useToast();
    const { projects, loading: loadingProjects } = useProjects();
    
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [statusId, setStatusId] = useState<string | undefined>();
    const [priority, setPriority] = useState("Média");
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    const [progress, setProgress] = useState(0);
    const [parentId, setParentId] = useState<string | null>(null);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [dependencyIds, setDependencyIds] = useState<string[]>([]);
    const [isMilestone, setIsMilestone] = useState(false);
    const [autoAdjustDate, setAutoAdjustDate] = useState(true);

    useEffect(() => {
        if (isOpen && statuses.length > 0) {
            setName(""); setDescription(""); setAssigneeId(null);
            setStatusId(statuses[0]?.id); setPriority("Média");
            setStartDate(new Date()); setEndDate(new Date());
            setProgress(0); setParentId(null); setTagIds([]);
            setDependencyIds([]); setIsMilestone(false);
            setAutoAdjustDate(true);
        }
    }, [isOpen, statuses]);
    
    useEffect(() => {
        if (autoAdjustDate && dependencyIds.length > 0) {
            let latestEndDate: Date | null = null;
            dependencyIds.forEach(depId => {
                const depTask = tasks.find(t => t.id === depId);
                if (depTask?.end_date) {
                    const depEndDate = parseUTCDate(depTask.end_date)!;
                    if (!latestEndDate || depEndDate > latestEndDate) latestEndDate = depEndDate;
                }
            });
            if (latestEndDate) setStartDate(addDays(latestEndDate, 1));
        }
    }, [dependencyIds, tasks, autoAdjustDate]);

    const handleSubmit = () => {
        if (!name) {
            toast({ title: "Erro de Validação", description: "Nome da tarefa é obrigatório.", variant: "destructive"});
            return;
        }
        onSave({
            name, description, assignee_id: assigneeId, status_id: statusId,
            priority, start_date: startDate, end_date: endDate, progress,
            parent_id: parentId, tag_ids: tagIds, project_id: selectedProject,
            is_milestone: isMilestone, dependency_ids: dependencyIds,
        });
        onOpenChange(false);
    };

    const availableAssignees = useMemo(() => {
        if (loadingProjects || !selectedProject || selectedProject === 'consolidated' || !projects.length) return [];
        const project = projects.find(p => p.id === selectedProject);
        if (!project) return [];
        const memberIds = new Set([project.owner_id, ...(project.collaborator_ids || [])]);
        return users.filter(user => memberIds.has(user.id));
    }, [selectedProject, projects, users, loadingProjects]);
    
    const possibleTaskRelations = useMemo(() => {
        if (!selectedProject || selectedProject === 'consolidated') return [];
        return tasks.filter(task => task.project_id === selectedProject).map(t => ({ value: t.id, label: t.name }));
    }, [tasks, selectedProject]);
    
    const tagOptions = tags.map(tag => ({ value: tag.id, label: tag.name }));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[600px] overflow-y-auto">
                <DialogHeader><DialogTitle>Adicionar Nova Tarefa</DialogTitle></DialogHeader>
                <div className="p-4 space-y-4">
                    <div className="flex items-center space-x-4">
                        <Label htmlFor="name" className="w-1/4 text-right">Tarefa</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
                    </div>
                    <div className="flex items-start space-x-4">
                        <Label htmlFor="description" className="w-1/4 text-right pt-2">Descrição</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Subtarefa de</Label>
                        <Select value={parentId || "null"} onValueChange={(v) => setParentId(v === "null" ? null : v)}>
                            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="null">Nenhuma</SelectItem>
                                {possibleTaskRelations.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Depende de</Label>
                        <div className="flex-1"><MultiSelect options={possibleTaskRelations} selected={dependencyIds} onChange={setDependencyIds} /></div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="w-1/4" />
                        <div className="flex flex-1 items-center space-x-2">
                            <Switch id="auto-adjust-date" checked={autoAdjustDate} onCheckedChange={setAutoAdjustDate} />
                            <Label htmlFor="auto-adjust-date">Ajustar data de início</Label>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Início</Label>
                        <DatePicker date={startDate} setDate={setStartDate} className="flex-1" disabled={autoAdjustDate && dependencyIds.length > 0} />
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Fim</Label>
                        <DatePicker date={endDate} setDate={setEndDate} className="flex-1" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Responsável</Label>
                        <Select value={assigneeId || 'unassigned'} onValueChange={(v) => setAssigneeId(v === 'unassigned' ? null : v)} disabled={loadingProjects}>
                            <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Ninguém</SelectItem>
                                {availableAssignees.map(u => <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Status</Label>
                        <Select value={statusId} onValueChange={setStatusId}>
                            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Tags</Label>
                        <div className="flex-1"><MultiSelect options={tagOptions} selected={tagIds} onChange={setTagIds} /></div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Prioridade</Label>
                        <Select value={priority} onValueChange={(p) => setPriority(p as any)}>
                            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Baixa">Baixa</SelectItem>
                                <SelectItem value="Média">Média</SelectItem>
                                <SelectItem value="Alta">Alta</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Progresso</Label>
                        <div className="flex flex-1 items-center space-x-2">
                            <Slider value={[progress]} onValueChange={(v) => setProgress(v[0])} />
                            <span className="text-sm">{progress}%</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Label className="w-1/4 text-right">Marco</Label>
                        <div className="flex-1"><Switch checked={isMilestone} onCheckedChange={setIsMilestone} /></div>
                    </div>
                </div>
                <DialogFooter className="justify-center space-x-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                  <Button variant="default" type="submit" onClick={handleSubmit}>Salvar Tarefa</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
