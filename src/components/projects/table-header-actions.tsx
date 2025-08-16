"use client";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Settings, Network, ChevronsUpDown, Upload, Download, Milestone, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTableSettings } from '@/hooks/use-table-settings';
import { useTasks } from '@/hooks/use-tasks';
import { useUsers } from '@/hooks/use-users';
import { useProjects } from '@/hooks/use-projects';
import { useBaselines } from '@/hooks/use-baselines';
import { useState } from 'react';
import { AlertModal } from '@/components/shared/alert-modal';

interface TableHeaderActionsProps {
  isManager: boolean;
  onAddTask: () => void;
  onOpenManager: () => void;
  onSetSubtask: () => void;
  onSetBaseline: () => void;
  selectedTasks: Set<string>;
  onImport: () => void;
}

export default function TableHeaderActions({
  isManager, onAddTask, onOpenManager, onSetSubtask, onSetBaseline,
  selectedTasks, onImport
}: TableHeaderActionsProps) {
  const { statuses, isSettingsReady } = useTableSettings();
  const { loading, filterByAssignee, setFilterByAssignee, filterByStatus, setFilterByStatus, exportTasks } = useTasks();
  const { users, user: currentUser } = useUsers();
  const { selectedProjectId } = useProjects();
  const { baselines, selectedBaselineId, setSelectedBaselineId, loading: loadingBaselines, deleteBaseline } = useBaselines();
  const [isDeleteBaselineModalOpen, setIsDeleteBaselineModalOpen] = useState(false);

  const isConsolidatedView = selectedProjectId === 'consolidated';

  const handleDeleteConfirm = () => {
    if(selectedBaselineId) {
      deleteBaseline(selectedBaselineId);
    }
    setIsDeleteBaselineModalOpen(false);
  };
  
  if (!isSettingsReady) { return <div className="h-10 animate-pulse bg-muted rounded-md w-full" />; }

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* ... Filtros ... */}
          <Select value={filterByStatus || 'all'} onValueChange={(v) => setFilterByStatus(v === 'all' ? null : v)} disabled={isConsolidatedView}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por status..." /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="backlog">Backlog</SelectItem><SelectSeparator/>{statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterByAssignee || 'all'} onValueChange={(v) => setFilterByAssignee(v === 'all' ? null : v)} disabled={isConsolidatedView}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por responsável..." /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem>{users?.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
          </Select>
           <div className="flex items-center space-x-2"><Switch id="my-tasks" checked={filterByAssignee === currentUser?.id} onCheckedChange={(checked) => setFilterByAssignee(checked ? currentUser?.id : null)} disabled={isConsolidatedView} /><Label htmlFor="my-tasks" className={isConsolidatedView ? 'text-muted-foreground' : ''}>Apenas minhas tarefas</Label></div>
          
          {/* CONTROLES DA LINHA DE BASE ATUALIZADOS */}
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
                <Switch
                    id="show-baseline"
                    checked={!!selectedBaselineId}
                    onCheckedChange={(checked) => {
                        if (checked && baselines.length > 0) {
                            setSelectedBaselineId(baselines[0].id);
                        } else {
                            setSelectedBaselineId(null);
                        }
                    }}
                    disabled={isConsolidatedView || loadingBaselines || baselines.length === 0}
                />
                <Label
                    htmlFor="show-baseline"
                    className={(isConsolidatedView || loadingBaselines || baselines.length === 0) ? 'text-muted-foreground cursor-not-allowed' : ''}
                >
                    Exibir Linha de Base
                </Label>
            </div>
            <Select
                value={selectedBaselineId || ''}
                onValueChange={(v) => setSelectedBaselineId(v || null)}
                disabled={!selectedBaselineId || isConsolidatedView || loadingBaselines}
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                    {baselines.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
            </Select>
            {selectedBaselineId && isManager && (
                <Button variant="ghost" size="icon" onClick={() => setIsDeleteBaselineModalOpen(true)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isConsolidatedView && isManager && (<Button variant="outline" size="sm" onClick={onAddTask} disabled={loading}><PlusCircle className="h-4 w-4 mr-2" /> Adicionar Tarefa</Button>)}
          <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm" disabled={loading}>Ações <ChevronsUpDown className="h-4 w-4 ml-2" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                  {!isConsolidatedView && isManager && (<DropdownMenuItem onClick={onSetBaseline}><Milestone className="h-4 w-4 mr-2" /> Definir Linha de Base</DropdownMenuItem>)}
                  {isManager && selectedTasks.size > 0 && (<DropdownMenuItem onClick={onSetSubtask} disabled={isConsolidatedView}><Network className="h-4 w-4 mr-2" /> Definir como Subtarefa</DropdownMenuItem>)}
                  {isManager && selectedProjectId && !isConsolidatedView && (<DropdownMenuItem onClick={onImport}><Upload className="h-4 w-4 mr-2" /> Importar de CSV</DropdownMenuItem>)}
                  <DropdownMenuItem onClick={exportTasks} disabled={!selectedProjectId}><Download className="h-4 w-4 mr-2" /> Exportar para CSV</DropdownMenuItem>
                  {isManager && (<DropdownMenuItem onClick={onOpenManager} disabled={isConsolidatedView}><Settings className="h-4 w-4 mr-2" /> Gerenciar Tabela</DropdownMenuItem>)}
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <AlertModal 
        isOpen={isDeleteBaselineModalOpen}
        onClose={() => setIsDeleteBaselineModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Apagar Linha de Base?"
        description="Esta ação é permanente. Tem a certeza que quer apagar a linha de base selecionada?"
      />
    </>
  );
}
