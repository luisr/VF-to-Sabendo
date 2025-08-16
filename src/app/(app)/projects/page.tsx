"use client";
import { useState, Suspense, useMemo } from "react";
import dynamic from 'next/dynamic';
import PageHeader from "@/components/shared/page-header";
import ProjectSelector from "@/components/shared/project-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TableView from "@/components/projects/table-view";
import KanbanBoard from "@/components/projects/kanban-board";
import TableHeaderActions from "@/components/projects/table-header-actions";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";
import { useTags } from "@/hooks/use-tags";
import { useTableSettings } from "@/hooks/use-table-settings";
import { Loader2, PlusCircle, MoreHorizontal, Trash2 } from "lucide-react";
import type { Task, Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBaselines } from "@/hooks/use-baselines";

// Modais
import AddTaskModal from "@/components/projects/add-task-modal";
import EditTaskModal from "@/components/projects/edit-task-modal";
import ViewTaskModal from "@/components/projects/view-task-modal";
import TaskObservationsModal from "@/components/projects/task-observations-modal";
import SetBaselineModal from "@/components/projects/set-baseline-modal";
import TableManagerModal from "@/components/projects/table-manager-modal";
import ImportTasksModal from "@/components/projects/import-tasks-modal";
import AddProjectModal from "@/components/projects/add-project-modal";
import EditProjectModal from "@/components/projects/edit-project-modal";
import { AlertModal } from "@/components/shared/alert-modal";
import { DropResult } from "react-beautiful-dnd";

const WbsView = dynamic(() => import('@/components/projects/wbs-view'), { ssr: false, loading: () => <Loader2 className="h-8 w-8 animate-spin" /> });
const GanttChartWrapper = dynamic(() => import('@/components/projects/gantt-chart-wrapper'), { ssr: false, loading: () => <Loader2 className="h-8 w-8 animate-spin" /> });

const ProjectsPageContent = () => {
    const { projects, loading: loadingProjects, selectedProjectId, saveProject, deleteProject } = useProjects();
    const { user, users } = useUsers();
    const { tags } = useTags();
    const { statuses } = useTableSettings();
    const { tasks, rawTasks, loading: loadingTasks, refetchTasks, updateTaskStatus, deleteTask: deleteTaskHandler, saveTask } = useTasks();
    const { baselines, selectedBaselineId, setSelectedBaselineId, loading: loadingBaselines, deleteBaseline } = useBaselines();
    
    // Estados
    const [activeTab, setActiveTab] = useState("table");
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isSetBaselineModalOpen, setIsSetBaselineModalOpen] = useState(false);
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
    const [isImportTasksModalOpen, setIsImportTasksModalOpen] = useState(false);
    const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToView, setTaskToView] = useState<Task | null>(null);
    const [taskForObservations, setTaskForObservations] = useState<Task | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
    const [isDeleteBaselineModalOpen, setIsDeleteBaselineModalOpen] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [ganttViewMode, setGanttViewMode] = useState<string>('week');

    const isManager = useMemo(() => user?.role === 'Admin' || user?.role === 'Gerente', [user]);
    const currentProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [selectedProjectId, projects]);
    const isConsolidatedView = selectedProjectId === 'consolidated';
    
    const handleDragEnd = async (result: DropResult) => {
        const { destination, draggableId } = result;
        if (!destination) return;
        await updateTaskStatus(draggableId, destination.droppableId);
    };

    const handleDeleteProjectConfirm = async () => {
        if (!currentProject) return;
        await deleteProject(currentProject.id);
        setIsDeleteProjectModalOpen(false);
    };

    const handleDeleteBaselineConfirm = () => {
        if(selectedBaselineId) {
          deleteBaseline(selectedBaselineId);
        }
        setIsDeleteBaselineModalOpen(false);
    };
    
    if (loadingProjects || !user) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>;
    }
    
    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title={currentProject?.name || "Visão Consolidada"}
                actions={
                     <div className="flex items-center gap-2">
                        <ProjectSelector />
                        {isManager && (
                          <Button onClick={() => setIsAddProjectModalOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />Novo Projeto
                          </Button>
                        )}
                        {isManager && !isConsolidatedView && currentProject && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setProjectToEdit(currentProject)}>Editar Projeto</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsDeleteProjectModalOpen(true)} className="text-red-500">Excluir Projeto</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                }
            />
            
            {loadingTasks ? (
                 <div className="flex items-center justify-center flex-1"><Loader2 className="h-8 w-8 animate-spin"/></div>
            ) : selectedProjectId ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0 p-4 pt-2">
                    <TabsList>
                        <TabsTrigger value="table">Tabela</TabsTrigger>
                        <TabsTrigger value="kanban">Kanban</TabsTrigger>
                        <TabsTrigger value="gantt">Gantt</TabsTrigger>
                        <TabsTrigger value="wbs">EAP</TabsTrigger>
                    </TabsList>

                    <TabsContent value="table" className="flex-1 flex flex-col min-h-0 mt-2">
                        <TableHeaderActions isManager={isManager} onAddTask={() => setIsAddTaskModalOpen(true)} onSetBaseline={() => setIsSetBaselineModalOpen(true)} onOpenManager={() => setIsManagerModalOpen(true)} selectedTasks={selectedTasks} onImport={() => setIsImportTasksModalOpen(true)} onSetSubtask={() => {}} />
                        <TableView tasks={tasks} onEditTask={setTaskToEdit} onViewTask={setTaskToView} onOpenObservations={setTaskForObservations} deleteTask={deleteTaskHandler} isManager={isManager} selectedTasks={selectedTasks} setSelectedTasks={setSelectedTasks} />
                    </TabsContent>

                    <TabsContent value="kanban" className="flex-1 flex flex-col min-h-0 mt-2">
                        <KanbanBoard tasks={rawTasks} statuses={statuses} onDragEnd={handleDragEnd} loading={loadingTasks} onEditTask={setTaskToView} />
                    </TabsContent>
                    
                    <TabsContent value="gantt" className="flex-1 flex flex-col min-h-0 mt-2 space-y-4">
                        <div className="flex items-center justify-end gap-4">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="show-baseline-gantt"
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
                                    <Label htmlFor="show-baseline-gantt" className={(isConsolidatedView || loadingBaselines || baselines.length === 0) ? 'text-muted-foreground cursor-not-allowed' : ''}>
                                        Exibir Linha de Base
                                    </Label>
                                </div>
                                <Select
                                    value={selectedBaselineId || ''}
                                    onValueChange={(v) => setSelectedBaselineId(v || null)}
                                    disabled={!selectedBaselineId || isConsolidatedView || loadingBaselines}
                                >
                                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>{baselines.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                                </Select>
                                {selectedBaselineId && isManager && (
                                    <Button variant="ghost" size="icon" onClick={() => setIsDeleteBaselineModalOpen(true)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                )}
                            </div>
                            <Select value={ganttViewMode} onValueChange={(value) => setGanttViewMode(value as any)}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Dia</SelectItem>
                                    <SelectItem value="week">Semana</SelectItem>
                                    <SelectItem value="month">Mês</SelectItem>
                                    <SelectItem value="year">Ano</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <GanttChartWrapper tasks={rawTasks} viewMode={ganttViewMode as any} showBaselines={!!selectedBaselineId} />
                    </TabsContent>
                    
                    <TabsContent value="wbs" className="flex-1 flex flex-col min-h-0 mt-2">
                       <WbsView tasks={tasks} isConsolidated={isConsolidatedView} />
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="text-center p-8">Selecione um projeto para começar.</div>
            )}
            
            {projectToEdit && <EditProjectModal isOpen={!!projectToEdit} onOpenChange={() => setProjectToEdit(null)} onSave={(data) => saveProject(data, projectToEdit.id)} project={projectToEdit} users={users} />}
            <AddProjectModal isOpen={isAddProjectModalOpen} onOpenChange={setIsAddProjectModalOpen} onSave={saveProject} users={users} />
            <AlertModal isOpen={isDeleteProjectModalOpen} onClose={() => setIsDeleteProjectModalOpen(false)} onConfirm={handleDeleteProjectConfirm} title="Excluir Projeto" description={`Tem certeza que deseja excluir o projeto "${currentProject?.name}"?`} />
            <AlertModal isOpen={isDeleteBaselineModalOpen} onClose={() => setIsDeleteBaselineModalOpen(false)} onConfirm={handleDeleteBaselineConfirm} title="Apagar Linha de Base?" description="Esta ação é permanente. Tem a certeza que quer apagar a linha de base selecionada?" />

            {taskForObservations && <TaskObservationsModal isOpen={!!taskForObservations} onOpenChange={() => setTaskForObservations(null)} task={taskForObservations} onDataChange={refetchTasks} />}
            <SetBaselineModal isOpen={isSetBaselineModalOpen} onOpenChange={setIsSetBaselineModalOpen} />
            <TableManagerModal isOpen={isManagerModalOpen} onOpenChange={setIsManagerModalOpen} />
            <ImportTasksModal isOpen={isImportTasksModalOpen} onOpenChange={() => setIsImportTasksModalOpen(false)} projectId={selectedProjectId || ''} />
            <AddTaskModal isOpen={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen} onSave={saveTask} selectedProject={selectedProjectId || ''} statuses={statuses} users={users} tasks={rawTasks} tags={tags} />
            {taskToEdit && <EditTaskModal key={taskToEdit.id} isOpen={!!taskToEdit} onOpenChange={() => setTaskToEdit(null)} onTaskUpdate={(data) => saveTask(data, taskToEdit.id)} task={taskToEdit} statuses={statuses} users={users} tasks={rawTasks} tags={tags} />}
            {taskToView && <ViewTaskModal key={taskToView.id} isOpen={!!taskToView} onOpenChange={() => setTaskToView(null)} task={taskToView} />}
        </div>
    );
};

export default function ProjectsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <ProjectsPageContent />
        </Suspense>
    )
}
