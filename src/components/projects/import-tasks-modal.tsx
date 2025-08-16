"use client";
import { useState, useMemo, FC, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTableSettings } from '@/hooks/use-table-settings';
import { useTasks } from '@/hooks/use-tasks';
import Papa from 'papaparse';
import { Loader2, UploadCloud, File as FileIcon, Check, ChevronsRight } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/lib/supabase';

// Função para converter o ficheiro para Base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


interface ImportTasksModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

type ImportStep = 'upload' | 'mapping' | 'importing' | 'done';

const BUCKET_NAME = 'tosabendo2';

const ImportTasksModal: FC<ImportTasksModalProps> = ({ isOpen, onOpenChange, projectId }) => {
    const { toast } = useToast();
    const { columns, addColumn } = useTableSettings();
    const { refetchTasks } = useTasks();
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [progress, setProgress] = useState<number>(0);
    const [autoLoading, setAutoLoading] = useState(false);
    const [errors, setErrors] = useState<any[]>([]);

    const systemFields = useMemo(() => [
        { id: 'name', name: 'Nome da Tarefa' },
        { id: 'description', name: 'Descrição' },
        { id: 'status_id', name: 'Status (por nome)' },
        { id: 'assignee_id', name: 'Responsável (por nome)' },
        { id: 'priority', name: 'Prioridade' },
        { id: 'progress', name: 'Progresso' },
        { id: 'parent_id', name: 'Tarefa Pai (ID ou Nome)' },
        { id: 'dependency_ids', name: 'Dependências (nomes, sep. por vírgula)' },
        { id: 'start_date', name: 'Data de Início (DD-MM-YYYY)' },
        { id: 'end_date', name: 'Data de Fim (DD-MM-YYYY)' },
        ...columns.filter(c => c.is_custom).map(c => ({ id: c.id, name: c.name })),
    ], [columns]);
    
    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        Papa.parse(selectedFile, {
            header: true,
            preview: 1,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.meta.fields) {
                    setCsvHeaders(results.meta.fields);
                    const initialMappings: Record<string, string> = {};
                    results.meta.fields.forEach(header => {
                        const lowerHeader = header.toLowerCase().replace(/ /g, '_');
                        const found = systemFields.find(f => 
                            f.id.toLowerCase().includes(lowerHeader) || 
                            f.name.toLowerCase().includes(lowerHeader)
                        );
                        initialMappings[header] = found ? found.id : 'ignore';
                    });
                    setMappings(initialMappings);
                }
            }
        });
    };

    const handleProceedToMapping = () => {
        if (!file) {
            toast({ title: 'Erro', description: 'Selecione um ficheiro antes de prosseguir.', variant: 'destructive' });
            return;
        }
        setStep('mapping');
    };

    const handleMappingChange = (header: string, systemField: string) => {
        setMappings(prev => ({ ...prev, [header]: systemField }));
    };

    const handleAutoMap = async () => {
        if (!file) return;
        setAutoLoading(true);
        try {
            const fileBase64 = await toBase64(file);
            
            const { data: uploadData, error: uploadError } = await supabase.functions.invoke('secure-file-upload', {
                body: { 
                    file: fileBase64,
                    fileName: file.name,
                    projectId: projectId 
                }
            });

            if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);
            const { filePath } = uploadData;

            const { data, error: functionError } = await supabase.functions.invoke('map-task-headers', {
                body: { filePath }
            });

            if (functionError) throw new Error(`Erro na IA: ${functionError.message}`);

            const suggestions: Record<string, string> = data.mappings || {};
            setMappings(prev => {
                const updated = { ...prev };
                csvHeaders.forEach(h => {
                    updated[h] = suggestions[h] || prev[h] || 'ignore';
                });
                return updated;
            });

            toast({ title: "Sucesso", description: "Mapeamento automático aplicado." });

        } catch (error: any) {
            const errorMessage = error.message || "Ocorreu um erro desconhecido.";
            toast({ title: 'Erro', description: `Não foi possível mapear automaticamente. Detalhes: ${errorMessage}`, variant: 'destructive' });
        } finally {
            setAutoLoading(false);
        }
    };
    
    const handleImport = async () => {
        if (!file) return;
        if (!projectId) {
            toast({ title: 'Erro', description: 'Selecione um projeto antes de importar.', variant: 'destructive' });
            return;
        }
        setStep('importing');
        setProgress(0);
        setErrors([]);

        const finalMappings = { ...mappings };
        for (const header in finalMappings) {
            if (finalMappings[header] === 'create_new') {
                const newColumn = await addColumn(header, 'text');
                if (newColumn) {
                    finalMappings[header] = newColumn.id;
                } else {
                    toast({ title: 'Erro', description: `Não foi possível criar a coluna ${header}`, variant: 'destructive' });
                    setStep('mapping');
                    return;
                }
            }
        }

        try {
            const fileBase64 = await toBase64(file);

            const { data: uploadData, error: uploadError } = await supabase.functions.invoke('secure-file-upload', {
                body: {
                    file: fileBase64,
                    fileName: file.name,
                    projectId: projectId
                }
            });

            if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);
            const { filePath } = uploadData;

            const { error: importError } = await supabase.functions.invoke('import-tasks', {
                body: { projectId, filePath, mappings: finalMappings },
            });
            
            if (importError) {
                 throw new Error(importError.message)
            }
            
            setProgress(100);
            await refetchTasks();
            setStep('done');

        } catch (error: any) {
            toast({ title: 'Erro na Importação', description: error.message, variant: 'destructive' });
            setStep('mapping');
        }
    };

    const exportErrors = (format: 'csv' | 'json') => {
        if (errors.length === 0) return;
        let dataStr = '';
        let mimeType = '';
        let extension = '';
        if (format === 'json') {
            dataStr = JSON.stringify(errors, null, 2);
            mimeType = 'application/json';
            extension = 'json';
        } else {
            dataStr = Papa.unparse(errors);
            mimeType = 'text/csv';
            extension = 'csv';
        }
        const blob = new Blob([dataStr], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `import-errors.${extension}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    
    const reset = () => {
        setStep('upload');
        setFile(null);
        setCsvHeaders([]);
        setMappings({});
        setErrors([]);
    };

    const handleClose = (open: boolean) => {
        if (!open) reset();
        onOpenChange(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Importar Tarefas de Ficheiro CSV</DialogTitle>
                    <DialogDescription>Siga os passos para enviar e mapear as suas tarefas.</DialogDescription>
                </DialogHeader>
                
                {step === 'upload' && (
                    <div className="py-4 text-center">
                        <Label htmlFor="csv-upload" className="mx-auto cursor-pointer flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:bg-muted">
                            <UploadCloud className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Arraste e solte o ficheiro, ou clique para selecionar.</p>
                        </Label>
                        <Input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
                        {file && (
                             <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium">
                                 <FileIcon className="h-5 w-5 text-primary" />
                                 <span>{file.name}</span>
                                 <Check className="h-5 w-5 text-green-500" />
                             </div>
                        )}
                    </div>
                )}
                
                {step === 'mapping' && (
                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Mapeie as colunas do seu ficheiro para os campos do sistema.</p>
                            <Button variant="secondary" size="sm" onClick={handleAutoMap} disabled={autoLoading}>
                                {autoLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Mapear automaticamente
                            </Button>
                        </div>
                        {csvHeaders.map(header => (
                            <div key={header} className="grid grid-cols-3 items-center gap-4">
                                <Label className="truncate text-right">{header}</Label>
                                <ChevronsRight className="mx-auto text-muted-foreground" />
                                <Select value={mappings[header] || 'ignore'} onValueChange={(value) => handleMappingChange(header, value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ignore">Ignorar esta coluna</SelectItem>
                                        <SelectItem value="create_new">Criar Novo Campo Personalizado</SelectItem>
                                        <SelectSeparator />
                                        {systemFields.map(field => <SelectItem key={field.id} value={field.id}>{field.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                )}
                
                {step === 'importing' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-lg font-medium">A importar as suas tarefas...</p>
                        <p className="text-sm text-muted-foreground">Isto pode demorar um pouco. Por favor, não feche esta janela.</p>
                    </div>
                )}
                
                {step === 'done' && (
                    <div className="py-12 flex flex-col items-center text-center space-y-4">
                         <Check className="h-16 w-16 text-green-500 bg-green-100 rounded-full p-2" />
                         <div>
                            <p className="text-lg font-medium">Importação Concluída!</p>
                            <p className="text-sm text-muted-foreground">As suas tarefas foram adicionadas ao projeto.</p>
                         </div>
                         {errors.length > 0 && (
                            <div className="w-full space-y-2">
                                <p className="text-sm font-semibold">Linhas com problemas:</p>
                                <div className="max-h-40 overflow-y-auto border rounded p-2 text-sm text-left">
                                    <ul className="space-y-1">
                                        {errors.map((err, idx) => (
                                            <li key={idx}>{`Linha ${err.line}: ${err.message}`}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex gap-2 justify-center pt-2">
                                    <Button size="sm" variant="outline" onClick={() => exportErrors('csv')}>Exportar CSV</Button>
                                    <Button size="sm" variant="outline" onClick={() => exportErrors('json')}>Exportar JSON</Button>
                                </div>
                            </div>
                         )}
                    </div>
                )}

                <DialogFooter>
                    {step === 'upload' && <Button onClick={handleProceedToMapping} disabled={!file}>Avançar para Mapeamento</Button>}
                    {step === 'mapping' && <Button onClick={handleImport}>Confirmar e Importar</Button>}
                    {step === 'done' && <Button onClick={() => handleClose(false)}>Fechar</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ImportTasksModal;
