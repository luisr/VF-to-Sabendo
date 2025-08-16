
"use client";

import { useState, Suspense } from "react";
import PageHeader from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import UserFormModal from "@/components/admin/user-form-modal";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from "@/hooks/use-users";

const UserManagementPageContent = () => {
    const { users, loading, refetchUsers, updateUser, deleteUser } = useUsers();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const { toast } = useToast();

    const getRoleVariant = (role: string) => {
        switch (role) {
            case "Admin": return "default";
            case "Gerente": return "secondary";
            default: return "outline";
        }
    }

    const getRoleLabel = (role: string) => {
        return role === "Gerente" ? "Gerente" : role;
    }

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleSaveUser = async (userData: Partial<User>) => {
        const { id, ...userToSave } = userData;
        let success = false;
        if (id) {
            const result = await updateUser({ id, name: userToSave.name, role: userToSave.role });
            success = result.success;
        } else {
            // A criação de usuários ainda é tratada pela edge function separadamente
            // Esta lógica pode ser movida para o hook futuramente
        }
        if (success) {
            setIsModalOpen(false);
            setEditingUser(null);
        }
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
    };

    const handleDeleteConfirm = async () => {
        if (userToDelete) {
            await deleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Gestão de Usuários"
        actions={<Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" />Novo Usuário</Button>}
      />
      <Card>
        <CardContent className="mt-4">
           <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                       <TableRow key={user.id}>
                           <TableCell>
                               <div className="flex items-center gap-3">
                                   <Avatar><AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                   <div>
                                       <p className="font-medium">{user.name}</p>
                                       <p className="text-sm text-muted-foreground">{user.email}</p>
                                   </div>
                               </div>
                           </TableCell>
                           <TableCell><Badge variant={getRoleVariant(user.role)}>{getRoleLabel(user.role)}</Badge></TableCell>
                           <TableCell className="text-right">
                               <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                       <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end">
                                       <DropdownMenuItem onClick={() => handleOpenModal(user)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                       <DropdownMenuItem onClick={() => handleDeleteClick(user)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                                   </DropdownMenuContent>
                               </DropdownMenu>
                           </TableCell>
                       </TableRow>
                    ))}
                </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
    
    <UserFormModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} onSave={handleSaveUser} user={editingUser} />
    
    <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza que deseja excluir o usuário <strong>{userToDelete?.name}</strong>? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export default function UserManagementWrapper() {
    return <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8" /></div>}><UserManagementPageContent /></Suspense>
}
