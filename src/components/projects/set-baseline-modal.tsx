"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBaselines } from '@/hooks/use-baselines';
import { Loader2 } from 'lucide-react';

interface SetBaselineModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SetBaselineModal({ isOpen, onOpenChange }: SetBaselineModalProps) {
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { createBaseline } = useBaselines();

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        const success = await createBaseline(name.trim());
        setIsSaving(false);
        if (success) {
            onOpenChange(false);
            setName('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Definir Nova Linha de Base</DialogTitle>
                    <DialogDescription>
                        Crie uma "fotografia" do estado atual do cronograma do projeto. 
                        Isso permitirá comparar o planeado com o real no futuro.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="baseline-name">Nome da Linha de Base</Label>
                    <Input 
                        id="baseline-name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Planeamento Inicial, Revisão Pós-Cliente"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Linha de Base
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
