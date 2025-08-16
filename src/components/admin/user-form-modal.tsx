
"use client";

import { useState, useEffect } from "react";
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
import type { User } from "@/lib/types";

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userData: Partial<User>) => void;
  user: User | null;
}

export default function UserFormModal({ isOpen, onOpenChange, onSave, user }: UserFormModalProps) {
    const [userData, setUserData] = useState<Partial<User>>({});
    const isEditing = !!user;

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setUserData(user);
            } else {
                // Default values for a new user
                setUserData({
                    name: '',
                    email: '',
                    password: '', // Add password field to state
                    role: 'Membro',
                    status: 'Ativo'
                });
            }
        }
    }, [isOpen, user]);

    const handleInputChange = (field: string, value: any) => {
        setUserData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        onSave(userData);
        onOpenChange(false);
    };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Usuário" : "Adicionar Novo Usuário"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do usuário abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input id="name" value={userData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={userData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className="col-span-3" disabled={isEditing} />
            </div>
             {/* FIX: Add password field only for new users */}
            {!isEditing && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">Senha</Label>
                    <Input id="password" type="password" value={userData.password || ''} onChange={(e) => handleInputChange('password', e.target.value)} className="col-span-3" />
                </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Perfil</Label>
                <Select value={userData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Gerente">Gerente</SelectItem>
                        <SelectItem value="Membro">Membro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">Status</Label>
                <Select value={userData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!userData.name || !userData.email || (!isEditing && !userData.password)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
