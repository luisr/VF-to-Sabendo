
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddColumnModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddColumn: (column: { name: string; type: string }) => void;
}

export default function AddColumnModal({
  isOpen,
  onOpenChange,
  onAddColumn,
}: AddColumnModalProps) {
  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState("texto");

  const handleSubmit = () => {
    if (columnName.trim()) {
      onAddColumn({
        name: columnName.trim(),
        type: columnType,
      });
      onOpenChange(false);
      // Reset form
      setColumnName("");
      setColumnType("texto");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Coluna</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da nova coluna personalizada.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Custo Estimado"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Tipo
            </Label>
            <Select value={columnType} onValueChange={setColumnType}>
                <SelectTrigger className="col-span-3">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="numero">Número</SelectItem>
                    <SelectItem value="progresso">Progresso</SelectItem>
                    <SelectItem value="cronograma">Cronograma</SelectItem>
                    <SelectItem value="formula">Fórmula</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={!columnName.trim()}>Adicionar Coluna</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
