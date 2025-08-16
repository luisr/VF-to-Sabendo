"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/shared/multi-select';
import { DatePicker } from '@/components/shared/date-picker';
import type { Project, User } from '@/lib/types';
import { parseUTCDate, formatToISODate } from '@/lib/date-utils';

interface EditProjectModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (
    projectData: any,
    projectId: string
  ) => Promise<{ success: boolean; newProjectId?: string | null }>;
  project: Project;
  users: User[];
}

export default function EditProjectModal({ isOpen, onOpenChange, onSave, project, users }: EditProjectModalProps) {
  // Inicializa o estado como vazio. O useEffect irá populá-lo.
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [budget, setBudget] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);

  // CORREÇÃO: Este useEffect sincroniza o estado interno do modal com a propriedade `project`.
  // Ele é executado sempre que o modal é aberto ou o projeto selecionado muda.
  useEffect(() => {
    if (isOpen && project) {
      setName(project.name);
      setDescription(project.description || '');
      setStartDate(project.start_date ? parseUTCDate(project.start_date) : undefined);
      setEndDate(project.end_date ? parseUTCDate(project.end_date) : undefined);
      setBudget(project.budget?.toString() || '');
      setCollaboratorIds(project.collaborator_ids || []);
    }
  }, [project, isOpen]); // A dependência `isOpen` garante a reinicialização ao reabrir.

  const userOptions = users.map(u => ({ value: u.id, label: u.name || u.email || '' }));

  const handleSave = async () => {
    const projectData = {
      name,
      description,
      start_date: startDate ? formatToISODate(startDate) : null,
      end_date: endDate ? formatToISODate(endDate) : null,
      budget: budget ? parseFloat(budget) : null,
      collaborator_ids: collaboratorIds,
    };
    const { success } = await onSave(projectData, project.id);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Data de Início</Label>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">Data de Fim</Label>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget">Orçamento (Custo)</Label>
            <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Ex: 5000.00" />
          </div>
          <div className="grid gap-2">
            <Label>Colaboradores</Label>
            <MultiSelect
              options={userOptions}
              selected={collaboratorIds}
              onChange={setCollaboratorIds}
              placeholder="Selecione os colaboradores..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
