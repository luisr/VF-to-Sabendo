"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect } from '@/components/shared/multi-select';
import { DatePicker } from '@/components/shared/date-picker';
import { parseUTCDate, formatToISODate } from '@/lib/date-utils';

interface AddProjectModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (projectData: any) => Promise<{ success: boolean; newProjectId?: string | null }>;
  users: any[];
  initialStartDate?: string | null;
  initialEndDate?: string | null;
}

export default function AddProjectModal({
  isOpen,
  onOpenChange,
  onSave,
  users,
  initialStartDate,
  initialEndDate,
}: AddProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialStartDate ? parseUTCDate(initialStartDate) ?? undefined : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialEndDate ? parseUTCDate(initialEndDate) ?? undefined : undefined
  );
  const [budget, setBudget] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate ? parseUTCDate(initialStartDate) ?? undefined : undefined);
      setEndDate(initialEndDate ? parseUTCDate(initialEndDate) ?? undefined : undefined);
      setDateError(null);
    }
  }, [initialStartDate, initialEndDate, isOpen]);

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (endDate && date && endDate < date) {
      setDateError('A data final não pode ser anterior à inicial');
    } else {
      setDateError(null);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    if (startDate && date && date < startDate) {
      setDateError('A data final não pode ser anterior à inicial');
    } else {
      setDateError(null);
    }
  };

  const userOptions = users.map(u => ({ value: u.id, label: u.name || u.email || '' }));

  const handleSave = async () => {
    if (startDate && endDate && endDate < startDate) {
      setDateError('A data final não pode ser anterior à inicial');
      return;
    }

    const projectData = {
      name,
      description,
      start_date: startDate ? formatToISODate(startDate) : null,
      end_date: endDate ? formatToISODate(endDate) : null,
      budget: budget ? parseFloat(budget) : null,
      collaborator_ids: collaboratorIds,
    };

    const { success } = await onSave(projectData);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
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
              <DatePicker date={startDate} setDate={handleStartDateChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">Data de Fim</Label>
              <DatePicker date={endDate} setDate={handleEndDateChange} />
            </div>
          </div>
          {dateError && <p className="text-sm text-red-500">{dateError}</p>}
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
          <Button onClick={handleSave}>Salvar Projeto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
