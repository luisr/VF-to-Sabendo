"use client";
import { FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp, Bot, PlusSquare } from 'lucide-react';

interface ProjectCreationChoiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectManual: () => void;
  onSelectImport: () => void;
  onSelectAI: () => void;
}

const ProjectCreationChoiceModal: FC<ProjectCreationChoiceModalProps> = ({ 
    isOpen, 
    onOpenChange, 
    onSelectManual, 
    onSelectImport, 
    onSelectAI 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto</DialogTitle>
          <DialogDescription>Como você gostaria de criar o seu novo projeto?</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Button variant="outline" size="lg" onClick={onSelectManual} className="justify-start">
                <PlusSquare className="mr-4 h-6 w-6" />
                <div>
                    <p className="text-base font-semibold">Criar Manualmente</p>
                    <p className="text-sm text-muted-foreground font-normal">Preencha os detalhes do projeto do zero.</p>
                </div>
            </Button>
            <Button variant="outline" size="lg" onClick={onSelectImport} className="justify-start">
                <FileUp className="mr-4 h-6 w-6" />
                <div>
                    <p className="text-base font-semibold">Importar de Ficheiro</p>
                    <p className="text-sm text-muted-foreground font-normal">Importe de um ficheiro MS Project (.xml).</p>
                </div>
            </Button>
            <Button variant="outline" size="lg" onClick={onSelectAI} className="justify-start">
                <Bot className="mr-4 h-6 w-6" />
                <div>
                    <p className="text-base font-semibold">Usar Assistente de IA</p>
                    <p className="text-sm text-muted-foreground font-normal">Gere tarefas a partir de um objetivo.</p>
                </div>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreationChoiceModal;
