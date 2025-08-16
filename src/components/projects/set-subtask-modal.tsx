"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Task } from "@/lib/types";

interface SetSubtaskModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  onSetParent: (parentId: string) => void;
}

export default function SetSubtaskModal({
  isOpen,
  onOpenChange,
  tasks,
  onSetParent,
}: SetSubtaskModalProps) {
  const [selectedParent, setSelectedParent] = useState<string | null>(null);

  const handleSave = () => {
    if (selectedParent) {
      onSetParent(selectedParent);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir Tarefa Pai</DialogTitle>
          <DialogDescription>
            Selecione a tarefa que será a pai das tarefas selecionadas.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="parent-task">Tarefa Pai</Label>
          <Select onValueChange={setSelectedParent}>
            <SelectTrigger id="parent-task">
              <SelectValue placeholder="Selecione uma tarefa..." />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!selectedParent}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
