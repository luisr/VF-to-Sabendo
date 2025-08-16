
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useCollaborators } from '@/hooks/use-collaborators';
import { useUsers } from '@/hooks/use-users';
import { Button } from '@/components/ui/button';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ManageCollaboratorsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectId: string;
}

export default function ManageCollaboratorsModal({ isOpen, onOpenChange, projectId }: ManageCollaboratorsModalProps) {
  const { collaborators, loading, addCollaborator, removeCollaborator } = useCollaborators();
  const { users } = useUsers(); // All users in the system
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const nonCollaboratorUsers = (users || []).filter(user => 
    !collaborators.some(c => c.user_id === user.id)
  );

  const handleAddCollaborator = () => {
    if (!selectedUserId) {
      toast({ title: "Nenhum usuário selecionado", description: "Por favor, selecione um usuário para adicionar.", variant: "destructive" });
      return;
    }
    addCollaborator(projectId, selectedUserId, 'Membro');
    setSelectedUserId(null); // Reset selection
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Equipe do Projeto</DialogTitle>
          <DialogDescription>
            Adicione ou remova membros da equipe deste projeto.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Adicionar Novo Membro</h3>
          <div className="flex items-center gap-2">
            <Select onValueChange={setSelectedUserId} value={selectedUserId || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {nonCollaboratorUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddCollaborator} size="icon">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Membros Atuais</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {loading ? <p>Carregando...</p> : collaborators.map(c => {
              // Add a defensive check to ensure c.users is not null
              if (!c.users) {
                return (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-md border border-destructive/50">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>?</AvatarFallback></Avatar>
                      <div>
                        <p className="font-semibold text-destructive">Usuário Inválido</p>
                        <p className="text-sm text-muted-foreground">Este usuário não foi encontrado.</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeCollaborator(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              }
              // Original render logic
              return (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-md border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{c.users.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{c.users.name}</p>
                      <p className="text-sm text-muted-foreground">{c.role}</p>
                    </div>
                  </div>
                  {c.role !== 'Gerente' && (
                    <Button variant="ghost" size="icon" onClick={() => removeCollaborator(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
