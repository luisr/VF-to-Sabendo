
"use client";

import { useState } from 'react';
import PageHeader from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, BellRing } from "lucide-react";
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/use-users';

const notificationTypes = [
    { id: 'deadline-approaching', title: 'Tarefa Próxima do Prazo', description: 'Notificar quando uma tarefa estiver a 3 dias de seu prazo final.' },
    { id: 'task-overdue', title: 'Tarefa Atrasada', description: 'Notificar quando o prazo de uma tarefa expirar.' },
    { id: 'budget-limit', title: 'Orçamento Próximo do Limite', description: 'Notificar quando um projeto atingir 80% do seu orçamento.' },
    { id: 'new-task-assigned', title: 'Nova Tarefa Designada', description: 'Notificar um usuário quando uma nova tarefa for designada a ele.' },
    { id: 'dependency-completed', title: 'Dependência de Tarefa Concluída', description: 'Notificar um usuário quando uma tarefa da qual ele depende for concluída.' },
    { id: 'project-status-change', title: 'Mudança de Status do Projeto', description: 'Notificar stakeholders quando o status de um projeto for alterado (ex: Em Risco).' },
    { id: 'new-comment', title: 'Novo Comentário em Tarefa', description: 'Notificar participantes de uma tarefa quando um novo comentário for adicionado.' },
];

export default function NotificationsPage() {
    const { toast } = useToast();
    const { users } = useUsers();
    const [notificationSwitches, setNotificationSwitches] = useState({
        'deadline-approaching': true,
        'task-overdue': true,
        'budget-limit': true,
        'new-task-assigned': false,
        'dependency-completed': true,
        'project-status-change': true,
        'new-comment': false,
    });

    const handleSwitchChange = (id: string, checked: boolean) => {
        setNotificationSwitches(prev => ({ ...prev, [id]: checked }));
        toast({
            title: `Notificação ${checked ? 'ativada' : 'desativada'}`,
            description: `As notificações para "${notificationTypes.find(n => n.id === id)?.title}" foram ${checked ? 'ativadas' : 'desativadas'}.`
        });
    }
    
    const handleSendGlobal = () => {
        const recipients = users.filter(u => u.notifications_whatsapp);
        if (recipients.length === 0) {
            toast({
                title: "Nenhum usuário inscrito",
                description: "Nenhum usuário optou por receber notificações.",
            });
            return;
        }
        // Aqui seria enviada a notificação apenas para 'recipients'
        toast({
            title: "Notificação Global Enviada",
            description: `A sua mensagem foi enviada para ${recipients.length} usuário${recipients.length > 1 ? 's' : ''}.`,
        });
    }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Gerenciamento de Notificações" />
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card>
            <CardHeader>
                <CardTitle>Notificações Automatizadas</CardTitle>
                <CardDescription>
                    Ative ou desative os alertas automáticos do sistema. As alterações são salvas instantaneamente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {notificationTypes.map(notification => (
                    <div key={notification.id} className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">{notification.title}</Label>
                            <p className="text-sm text-muted-foreground">
                                {notification.description}
                            </p>
                        </div>
                        <Switch
                            checked={notificationSwitches[notification.id as keyof typeof notificationSwitches]}
                            onCheckedChange={(checked) => handleSwitchChange(notification.id, checked)}
                        />
                    </div>
               ))}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Enviar Notificação Global</CardTitle>
            <CardDescription>
                Envie uma mensagem de notificação para todos os usuários do sistema.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="notification-message">Mensagem</Label>
                <Textarea id="notification-message" placeholder="Digite sua mensagem aqui..."/>
            </div>
            <Button onClick={handleSendGlobal}>
                <Send className="mr-2 h-4 w-4" />
                Enviar Notificação
            </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
