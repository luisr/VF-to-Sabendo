"use client";
import { useState, FC, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, File as FileIcon, Check } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useProjects } from '@/hooks/use-projects';
import { useUsers } from '@/hooks/use-users'; // Importar useUsers
import { importFile } from '@/lib/import-service';

interface ImportProjectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (newProjectId: string) => void;
}

type ImportStep = 'upload' | 'importing' | 'done';

const ImportProjectModal: FC<ImportProjectModalProps> = ({ isOpen, onOpenChange, onImportComplete }) => {
    const { toast } = useToast();
    const { refetchProjects } = useProjects();
    const { user } = useUsers(); // Obter o usuário
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState<number>(0);
    const [supportsRealtime, setSupportsRealtime] = useState<boolean>(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setSupportsRealtime('WebSocket' in window);
        }
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!['xml', 'mpp'].includes(fileType || '')) {
            toast({ title: "Ficheiro Inválido", description: "Apenas ficheiros .xml ou .mpp são suportados.", variant: "destructive" });
            return;
        }
        setFile(selectedFile);
    };

    const handleImport = async () => {
        if (!file || !user) {
             toast({ title: 'Erro', description: 'Ficheiro ou usuário não encontrado.', variant: 'destructive' });
            return;
        }
        setStep('importing');
        setProgress(0);


        }
    };
    
    const resetAndClose = () => {
        setStep('upload');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Importar Projeto de Ficheiro</DialogTitle>
                    <DialogDescription>Selecione um ficheiro .xml ou .mpp do MS Project para importar.</DialogDescription>
                </DialogHeader>
                
                {step === 'upload' && (
                    <div className="py-4 text-center">
                        <Label htmlFor="project-upload" className="mx-auto cursor-pointer flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted">
                            <UploadCloud className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Clique para selecionar o seu ficheiro .xml ou .mpp</p>
                        </Label>
                        <Input id="project-upload" type="file" accept=".xml,.mpp" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
                        {file && (
                             <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium">
                                 <FileIcon className="h-5 w-5 text-primary" />
                                 <span>{file.name}</span>
                                 <Check className="h-5 w-5 text-green-500" />
                             </div>
                        )}
                    </div>
                )}
                 {(step === 'importing' || step === 'done') && (
                    <div className="py-12 flex flex-col items-center justify-center text-center w-full">
                        {step === 'importing' ? (
                            supportsRealtime ? (
                                <>
                                    <Progress value={progress} className="w-full" />
                                    <p className="mt-4 text-lg font-medium">A importar o seu projeto... {progress}%</p>
                                </>
                            ) : (
                                <>
                                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    <p className="mt-4 text-lg font-medium">A importar o seu projeto...</p>
                                </>
                            )
                        ) : (
                            <>
                                <Check className="h-16 w-16 text-green-500 bg-green-100 rounded-full p-2" />
                                <p className="mt-4 text-lg font-medium">Importação Concluída!</p>
                            </>
                        )}
                    </div>
                )}
                 <DialogFooter>
                    {step === 'upload' && <Button onClick={handleImport} disabled={!file}>Importar Projeto</Button>}
                    {step === 'done' && <Button onClick={resetAndClose}>Fechar</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ImportProjectModal;
