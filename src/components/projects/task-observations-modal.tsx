"use client";
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from '@/components/ui/input';
import { useUsers } from '@/hooks/use-users';
import { supabase } from '@/lib/supabase';
import type { Task, Observation } from '@/lib/types';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Paperclip, X, Edit, Trash2, Save } from 'lucide-react';
import { AlertModal } from '@/components/shared/alert-modal';

interface TaskObservationsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onDataChange: () => void; // Prop para notificar mudança de dados
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const formatObservationDate = (dateString?: string) => {
  if (!dateString) return "";
  const parsed = parseISO(dateString);
  return !isValid(parsed) ? "" : format(parsed, "dd MMM, HH:mm", { locale: ptBR });
};

export default function TaskObservationsModal({ isOpen, onOpenChange, task, onDataChange }: TaskObservationsModalProps) {
  const { user } = useUsers();
  const { toast } = useToast();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [newObservation, setNewObservation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [deletingObservationId, setDeletingObservationId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchObservations = async () => {
    if (isOpen && task.id) {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_task_observations', { p_task_id: task.id });
        if (error) {
            toast({ title: 'Erro ao buscar observações', description: error.message, variant: 'destructive' });
            setObservations([]);
        } else {
            setObservations(data as Observation[]);
        }
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchObservations();
  }, [isOpen, task.id]);

  const handleAddObservation = async () => {
    if ((!newObservation.trim() && !file) || !user) return;
    setIsUploading(true);
    let attachmentUrl: string | null = null;
    try {
      if (file) {
        const fileAsBase64 = await fileToBase64(file);
        const { data, error: uploadError } = await supabase.functions.invoke('secure-attachment-upload', {
          body: { file: fileAsBase64, fileName: file.name, projectId: task.project_id, taskId: task.id },
        });
        if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`);
        attachmentUrl = data.attachmentUrl;
      }
      
      const { data: newObsData, error: insertError } = await supabase.rpc('add_task_observation', {
          p_task_id: task.id,
          p_content: newObservation.trim() || null,
          p_attachment_url: attachmentUrl
      });

      if (insertError) throw new Error(`Falha ao salvar: ${insertError.message}`);
      
      // Limpa os campos e atualiza a lista
      setNewObservation(''); setFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: 'Sucesso', description: 'Observação adicionada.' });
      
      // Atualiza a lista local e notifica o componente pai
      await fetchObservations(); 
      onDataChange();

    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateObservation = async () => {
    if (!editingObservationId || !editingContent.trim()) return;
    const { error } = await supabase.rpc('update_task_observation', {
      p_observation_id: editingObservationId,
      p_new_content: editingContent.trim()
    });
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: 'destructive' });
    } else {
      await fetchObservations();
      onDataChange();
      toast({ title: "Observação atualizada!" });
    }
    setEditingObservationId(null);
    setEditingContent('');
  };

  const handleDeleteObservation = async () => {
    if (!deletingObservationId) return;
    const { error } = await supabase.rpc('delete_task_observation', { p_observation_id: deletingObservationId });
    if (error) {
      toast({ title: "Erro ao apagar", description: error.message, variant: 'destructive' });
    } else {
      await fetchObservations();
      onDataChange();
      toast({ title: "Observação apagada!" });
    }
    setDeletingObservationId(null);
  };
  
  const getInitials = (name: string | undefined) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Observações: {task.name}</DialogTitle><DialogDescription>Adicione e visualize o histórico de observações.</DialogDescription></DialogHeader>
          <div className="py-4 space-y-4">
              <div className="space-y-2">
                  <Textarea placeholder="Adicionar uma nova observação..." value={newObservation} onChange={(e) => setNewObservation(e.target.value)} rows={3}/>
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                           <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-4 w-4 mr-2" /> Anexar</Button>
                          <Input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                          {file && (
                             <div className="text-sm text-muted-foreground flex items-center gap-2">
                                 <span>{file.name}</span>
                                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}><X className="h-4 w-4"/></Button>
                             </div>
                          )}
                      </div>
                      <Button onClick={handleAddObservation} disabled={isUploading || (!newObservation.trim() && !file)}>
                          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Adicionar
                      </Button>
                  </div>
              </div>
              <Separator />
              <ScrollArea className="h-64 pr-4">
                  <div className="space-y-4">
                      {loading && <p className="text-center">Carregando...</p>}
                      {observations.map((obs) => (
                          <div key={obs.id} className="flex items-start space-x-3">
                              <Avatar><AvatarImage src={obs.author?.avatar_url} /><AvatarFallback>{getInitials(obs.author?.name)}</AvatarFallback></Avatar>
                              <div className="flex-1">
                                 <div className="flex items-center justify-between">
                                      <p className="text-sm font-semibold">{obs.author?.name}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-muted-foreground">{formatObservationDate(obs.created_at)}</p>
                                        {user?.id === obs.author_id && (
                                            <>
                                                {editingObservationId === obs.id ? (
                                                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleUpdateObservation}><Save className="h-4 w-4 text-green-500"/></Button>
                                                ) : (
                                                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingObservationId(obs.id); setEditingContent(obs.content || ''); } }><Edit className="h-4 w-4"/></Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeletingObservationId(obs.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                            </>
                                        )}
                                      </div>
                                 </div>
                                 {editingObservationId === obs.id ? (
                                    <Textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="mt-1" />
                                 ) : (
                                    <>
                                        {obs.content && <p className="text-sm mt-1 whitespace-pre-wrap">{obs.content}</p>}
                                        {obs.attachment_url && <a href={obs.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-2 mt-1"><Paperclip className="h-4 w-4" /> Ver Anexo</a>}
                                    </>
                                 )}
                              </div>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertModal isOpen={!!deletingObservationId} onClose={() => setDeletingObservationId(null)} onConfirm={handleDeleteObservation} title="Apagar Observação?" description="Esta ação é permanente." />
    </>
  );
}
