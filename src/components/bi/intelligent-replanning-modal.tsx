
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import type { Project } from '@/lib/types';
import { Loader2, ArrowRight, Sparkles, Check, X } from 'lucide-react';
import { DatePicker } from '@/components/shared/date-picker';
import { getReplanSuggestions } from '@/app/(app)/projects/actions';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { parseUTCDate } from '@/lib/date-utils';

interface Suggestion {
    taskName: string;
    action: 'create' | 'update' | 'delete' | 'no_change';
    justification: string;
    changes?: {
        old_start_date?: string;
        new_start_date?: string;
        old_end_date?: string;
        new_end_date?: string;
    };
    approved: boolean;
}

interface IntelligentReplanningModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjectId: string | null;
}


export default function IntelligentReplanningModal({ isOpen, onOpenChange, selectedProjectId }: IntelligentReplanningModalProps) {
  const { toast } = useToast();
  const { projects } = useProjects();
  const { rawTasks: tasks, applyReplan } = useTasks();
  const project = projects.find(p => p.id === selectedProjectId) as Project | undefined;
  const [step, setStep] = useState(1);
  const [fileContent, setFileContent] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [observation, setObservation] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setFileContent(text);
        };
        reader.readAsText(file);
    }
  };


  const handleAnalyze = async () => {
    if (!fileContent) {
      toast({ title: "Erro", description: "Por favor, carregue um arquivo de baseline.", variant: "destructive" });
      return;
    }
    if (!project) {
      toast({ title: "Projeto não encontrado", description: "Selecione um projeto válido.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await getReplanSuggestions(project, tasks, fileContent);
      setSuggestions(result);
      setStep(2);
    } catch (error) {
      console.error(error);
      toast({ title: "Erro na Análise", description: "Não foi possível gerar sugestões. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (index: number, field: 'new_start_date' | 'new_end_date', date: Date) => {
    setSuggestions(current => {
        const newSuggestions = [...current];
        if (newSuggestions[index].changes) {
            newSuggestions[index].changes[field] = date.toISOString().slice(0, 10);
        }
        return newSuggestions;
    });
  };

  const toggleApproval = (index: number) => {
    setSuggestions(current => {
        const newSuggestions = [...current];
        newSuggestions[index].approved = !newSuggestions[index].approved;
        return newSuggestions;
    });
  };

  const handleConfirm = async () => {
    const approved = suggestions.filter(s => s.approved);
    if (approved.length === 0) {
      toast({ title: "Nenhuma alteração", description: "Aprove pelo menos uma sugestão.", variant: "destructive" });
      return;
    }
    const summary = approved.reduce(
      (acc, s) => ({ ...acc, [s.action]: acc[s.action] + 1 }),
      { create: 0, update: 0, delete: 0 } as Record<'create' | 'update' | 'delete', number>
    );
    const proceed = window.confirm(
      `Criar: ${summary.create}, Atualizar: ${summary.update}, Excluir: ${summary.delete}. Confirmar aplicação?`
    );
    if (!proceed) return;
    setIsApplying(true);
    const result = await applyReplan(approved, observation);
    setIsApplying(false);
    if (result.success) {
      toast({
        title: 'Replanejamento aplicado',
        description: `${summary.create} criadas, ${summary.update} atualizadas, ${summary.delete} excluídas.`,
      });
      handleClose(false);
    } else {
      toast({ title: 'Erro', description: result.message, variant: 'destructive' });
    }
  };
  
  const handleClose = (open: boolean) => {
    if (!open) {
        setStep(1);
        setFileContent('');
        setSuggestions([]);
        setIsLoading(false);
        setIsApplying(false);
        setObservation('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
            <DialogTitle className='flex items-center'><Sparkles className="mr-2 h-6 w-6 text-primary"/> Replanejamento Inteligente</DialogTitle>
            <DialogDescription>
                A IA irá analisar o estado atual do projeto, comparar com um baseline e sugerir otimizações.
            </DialogDescription>
        </DialogHeader>

        {step === 1 && (
            <div>
                 <div className="my-4">
                    <Label>1. Carregue o arquivo de baseline do projeto (CSV)</Label>
                    <Input type="file" accept=".csv" onChange={handleFileChange} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">O baseline deve conter as tarefas originais planejadas.</p>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleAnalyze} disabled={isLoading || !fileContent}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Analisar e Gerar Sugestões"}
                        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </DialogFooter>
            </div>
        )}

        {step === 2 && (
            <div>
                <Label>2. Revise e edite as sugestões da IA</Label>
                <div className="space-y-3 max-h-60 overflow-y-auto my-2 border p-2 rounded-md">
                    {suggestions.map((s, i) => (
                        <div key={i} className="p-2 rounded-md bg-muted/50">
                            <div className="flex items-center justify-between">
                               <div>
                                   <p><strong>{s.taskName}</strong> - <span className="text-primary">{s.action.toUpperCase()}</span></p>
                                   <p className="text-sm text-muted-foreground">{s.justification}</p>
                               </div>
                               <Button size="icon" variant={s.approved ? 'secondary' : 'outline'} onClick={() => toggleApproval(i)}>
                                   {s.approved ? <Check /> : <X />}
                               </Button>
                            </div>
                            {s.action === 'update' && s.changes && (
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                    <p>De: <span className="line-through">{s.changes.old_start_date}</span> até <span className="line-through">{s.changes.old_end_date}</span></p>
                                    <div className="flex items-center gap-2">
                                        Para:
                                        <DatePicker date={parseUTCDate(s.changes.new_start_date)} onDateChange={(d) => handleDateChange(i, 'new_start_date', d)} />
                                        <DatePicker date={parseUTCDate(s.changes.new_end_date)} onDateChange={(d) => handleDateChange(i, 'new_end_date', d)} />
                                    </div>
                                </div>
                            )}
                             {s.action === 'create' && s.changes && (
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                    Datas:
                                    <DatePicker date={parseUTCDate(s.changes.new_start_date)} onDateChange={(d) => handleDateChange(i, 'new_start_date', d)} />
                                    <DatePicker date={parseUTCDate(s.changes.new_end_date)} onDateChange={(d) => handleDateChange(i, 'new_end_date', d)} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                 <div className="my-4">
                    <Label>3. Adicionar observação (opcional)</Label>
                    <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ex: Ajustes realizados devido a atraso do fornecedor."/>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                    <Button onClick={handleConfirm} disabled={isApplying}>
                        {isApplying ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>Confirmar e Aplicar {suggestions.filter(s => s.approved).length} Mudanças</>
                        )}
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
