
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
import { Download, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { parseUTCDate } from '@/lib/date-utils';

export default function BackupPage() {
  const { toast } = useToast();
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);

  const handleBackup = async () => {
    setLoadingBackup(true);
    try {
      // Fetch all necessary data from supabase
      const { data: users } = await supabase.from('users').select('*');
      const { data: projects } = await supabase.from('projects').select('*');
      const { data: tasks } = await supabase.from('tasks').select('*');
      const { data: collaborators } = await supabase.from('collaborators').select('*');
      const { data: task_statuses } = await supabase.from('task_statuses').select('*');

      const dataToBackup = {
        users,
        projects,
        collaborators,
        task_statuses,
        tasks,
        backup_date: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(dataToBackup, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tosabendo_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Criado com Sucesso",
        description: "O arquivo de backup foi baixado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Criar Backup",
        description: error.message || "Não foi possível gerar o arquivo de backup.",
        variant: "destructive",
      });
    } finally {
        setLoadingBackup(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLoadingRestore(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            throw new Error("Formato de arquivo inválido.");
        }
        const restoredData = JSON.parse(text);
        
        if (!restoredData.users || !restoredData.projects || !restoredData.tasks) {
             throw new Error("Arquivo de backup inválido ou corrompido.");
        }

        // Restore data using upsert. Order is important due to foreign keys.
        // NOTE: This will overwrite existing data.
        
        // 1. Users (if your RLS allows, otherwise users are managed by auth)
        // Note: For real scenarios, user restore is more complex due to auth.
        // We are assuming direct table upsert is fine for this tool's purpose.
        if (restoredData.users) {
            const { error } = await supabase.from('users').upsert(restoredData.users, { onConflict: 'id' });
            if (error) throw new Error(`Erro ao restaurar usuários: ${error.message}`);
        }
        
        // 2. Projects
        if (restoredData.projects) {
            const { error } = await supabase.from('projects').upsert(restoredData.projects, { onConflict: 'id' });
            if (error) throw new Error(`Erro ao restaurar projetos: ${error.message}`);
        }

        // 3. Collaborators
         if (restoredData.collaborators) {
            const { error } = await supabase.from('collaborators').upsert(restoredData.collaborators, { onConflict: 'project_id,user_id' });
            if (error) throw new Error(`Erro ao restaurar colaboradores: ${error.message}`);
        }

        // 4. Task Statuses
        if (restoredData.task_statuses) {
            const { error } = await supabase.from('task_statuses').upsert(restoredData.task_statuses, { onConflict: 'id' });
            if (error) throw new Error(`Erro ao restaurar status: ${error.message}`);
        }

        // 5. Tasks
        if (restoredData.tasks) {
            const { error } = await supabase.from('tasks').upsert(restoredData.tasks, { onConflict: 'id' });
            if (error) throw new Error(`Erro ao restaurar tarefas: ${error.message}`);
        }
        
        toast({
          title: "Restauração Concluída",
          description: `Dados do backup de ${parseUTCDate(restoredData.backup_date)?.toLocaleString('pt-BR')} foram restaurados com sucesso.`,
        });

      } catch (error: any) {
        toast({
          title: "Erro ao Restaurar",
          description: error.message || "Ocorreu um erro ao processar o arquivo de backup.",
          variant: "destructive",
        });
      } finally {
        setLoadingRestore(false);
      }
    };
    reader.readAsText(file);
    // Limpa o input para permitir o upload do mesmo arquivo novamente
    event.target.value = "";
  };


  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Controle e Backup" />
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle>Backup</CardTitle>
            <CardDescription>
                Crie um backup completo de todos os dados do sistema (usuários, projetos, tarefas, etc.) em um arquivo JSON.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Button onClick={handleBackup} disabled={loadingBackup}>
                {loadingBackup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Criar e Baixar Backup
            </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Restauração</CardTitle>
            <CardDescription>
                Restaure o sistema a partir de um arquivo de backup. Esta ação irá sobrescrever os dados existentes. Use com cuidado.
            </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="restore-file" className="flex items-center cursor-pointer sr-only">
                        Selecione um arquivo para restaurar
                    </Label>
                    <Input id="restore-file" type="file" accept=".json" onChange={handleRestore} className="hidden" disabled={loadingRestore}/>
                    <Button asChild disabled={loadingRestore}>
                         <Label htmlFor="restore-file" className="cursor-pointer">
                             {loadingRestore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                             Carregar e Restaurar Backup
                        </Label>
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
