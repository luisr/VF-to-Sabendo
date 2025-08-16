"use client";
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ChangeHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reason: string) => void;
}

export default function ChangeHistoryModal({ isOpen, onOpenChange, onSave }: ChangeHistoryModalProps) {
  const [reason, setReason] = useState('');

  const handleSave = () => {
    onSave(reason);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Justificar Alteração de Prazo</DialogTitle>
          <DialogDescription>
            Você alterou as datas da tarefa. Por favor, forneça uma breve justificativa para o histórico do projeto.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Justificativa</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Atraso na entrega do fornecedor, re-priorização de demandas, etc."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!reason}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}