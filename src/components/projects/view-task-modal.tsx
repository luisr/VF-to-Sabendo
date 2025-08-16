"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Task } from "@/lib/types";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import { parseUTCDate } from '@/lib/date-utils';

interface ViewTaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

const DetailItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-4">
        <span className="text-sm font-semibold text-gray-500 col-span-1">{label}</span>
        <div className="text-sm col-span-2">{value}</div>
    </div>
);

export default function ViewTaskModal({ isOpen, onOpenChange, task }: ViewTaskModalProps) {
    if (!task) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{task.wbs_code}: {task.name}</DialogTitle>
                    <DialogDescription>Detalhes completos da tarefa.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <DetailItem label="Descrição" value={task.description || 'N/A'} />
                    <Separator />
                    <DetailItem label="Projeto" value={task.project_name || 'N/A'} />
                    <DetailItem label="Responsável" value={task.assignee_name || 'N/A'} />
                    <DetailItem label="Status" value={<Badge style={{ backgroundColor: task.status_color }} className="text-white">{task.status_name}</Badge>} />
                    <DetailItem label="Prioridade" value={<Badge variant={task.priority === 'Alta' ? 'destructive' : task.priority === 'Média' ? 'secondary' : 'outline'}>{task.priority}</Badge>} />
                    <DetailItem 
                        label="Progresso" 
                        value={
                            <div className="flex items-center gap-2">
                                <Progress value={task.progress || 0} className="w-[80%]" /> 
                                <span>{task.progress || 0}%</span>
                            </div>
                        } 
                    />
                    <Separator />
                    <DetailItem label="Data de Início" value={task.start_date ? parseUTCDate(task.start_date)?.toLocaleDateString() : 'N/A'} />
                    <DetailItem label="Data de Fim" value={task.end_date ? parseUTCDate(task.end_date)?.toLocaleDateString() : 'N/A'} />
                     <DetailItem 
                        label="Dependências" 
                        value={task.dependencies?.length > 0 ? task.dependencies.join(', ') : 'Nenhuma'} 
                    />
                    {task.parent_id && <DetailItem label="Subtarefa de" value={task.parent_id} />}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
