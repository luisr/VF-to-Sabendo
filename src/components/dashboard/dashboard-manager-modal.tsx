"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ListTodo, User, Users } from "lucide-react";
import type { DashboardPreferences } from "@/lib/types";
import { useUsers } from "@/hooks/use-users";
import { useDashboard } from "@/hooks/use-dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardManagerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: DashboardPreferences;
  setPreference: (view: keyof DashboardPreferences, key: string, value: boolean) => void;
  onSave: () => void;
}

const consolidatedItems = [
    { id: 'kpiBudget', name: 'KPI: Orçamento Utilizado' },
    { id: 'kpiCompletedTasks', name: 'KPI: Tarefas Concluídas' },
    { id: 'kpiRisk', name: 'KPI: Tarefas em Risco' },
    { id: 'kpiCompletion', name: 'KPI: Progresso Geral' },
    { id: 'chartOverview', name: 'Gráfico: Visão Geral das Tarefas' },
    { id: 'chartStatusDistribution', name: 'Gráfico: Distribuição de Status' },
    { id: 'chartBudgetVsCost', name: 'Gráfico: Orçamento vs Custo' },
    { id: 'cardRecentProjects', name: 'Card: Projetos Recentes' },
    { id: 'cardRecentTasks', name: 'Card: Tarefas Recentes' },
];

const projectItems = [
    { id: 'kpiBudget', name: 'KPI: Orçamento Utilizado' },
    { id: 'kpiCompletedTasks', name: 'KPI: Tarefas Concluídas' },
    { id: 'kpiRisk', name: 'KPI: Tarefas em Risco' },
    { id: 'kpiCompletion', name: 'KPI: Progresso do Projeto' },
    { id: 'chartOverview', name: 'Gráfico: Visão Geral das Tarefas' },
    { id: 'chartStatusDistribution', name: 'Gráfico: Distribuição de Status' },
    { id: 'chartBudgetVsCost', name: 'Gráfico: Orçamento vs Custo' },
    { id: 'cardRecentTasks', name: 'Card: Tarefas Recentes' },
];

export default function DashboardManagerModal({
  isOpen,
  onOpenChange,
  preferences,
  setPreference,
  onSave
}: DashboardManagerModalProps) {
  const { users } = useUsers();
  const { selectedManagerId, setSelectedManagerId } = useDashboard();

  const managers = users.filter(u => u.role === 'Gerente' || u.role === 'Admin');

  const handleSave = () => {
    onSave();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Painel</DialogTitle>
          <DialogDescription>
            Personalize os KPIs, gráficos e a visão do gerente.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Seletor de Gerente */}
            <div className="p-2 rounded-lg border border-border">
                <Label className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Filtrar por Gerente
                </Label>
                <Select value={selectedManagerId ?? 'all'} onValueChange={value => setSelectedManagerId(value === 'all' ? null : value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um gerente..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" /> Ver todos
                            </div>
                        </SelectItem>
                        {managers.map(manager => (
                            <SelectItem key={manager.id} value={manager.id}>
                                {manager.full_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <h4 className="font-semibold text-sm px-1 pt-4">Visão Consolidada</h4>
            {consolidatedItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <Label htmlFor={`cons-${item.id}`} className="flex items-center gap-2 cursor-pointer">
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                  {item.name}
                </Label>
                <Switch
                  id={`cons-${item.id}`}
                  checked={preferences.consolidated[item.id as keyof typeof preferences.consolidated] ?? false}
                  onCheckedChange={checked => setPreference('consolidated', item.id, checked)}
                />
              </div>
            ))}

            <h4 className="font-semibold text-sm px-1 pt-4">Visão do Projeto</h4>
            {projectItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <Label htmlFor={`proj-${item.id}`} className="flex items-center gap-2 cursor-pointer">
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                  {item.name}
                </Label>
                <Switch
                  id={`proj-${item.id}`}
                  checked={preferences.project[item.id as keyof typeof preferences.project] ?? false}
                  onCheckedChange={checked => setPreference('project', item.id, checked)}
                />
              </div>
            ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Preferências</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
