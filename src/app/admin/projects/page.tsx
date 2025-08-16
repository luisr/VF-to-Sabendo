"use client";
import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import dynamic from 'next/dynamic';
import { useReactToPrint } from 'react-to-print';
import PageHeader from "@/components/shared/page-header";
import ProjectSelector from "@/components/shared/project-selector";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TableView from "@/components/projects/table-view";
import KanbanBoard from "@/components/projects/kanban-board";
import TableHeaderActions from "@/components/projects/table-header-actions";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";
import { useTableSettings } from "@/hooks/use-table-settings";
import { Loader2 } from "lucide-react";
import AddProjectModal from "@/components/projects/add-project-modal";
import type { Task } from "@/lib/types";
import AddTaskModal from "@/components/projects/add-task-modal";
import EditTaskModal from "@/components/projects/edit-task-modal";
import ViewTaskModal from "@/components/projects/view-task-modal";
import TaskObservationsModal from "@/components/projects/task-observations-modal";
import TableManagerModal from "@/components/projects/table-manager-modal";

const GanttChartWrapper = dynamic(() => import('@/components/projects/gantt-chart-wrapper'), { ssr: false });
const WbsView = dynamic(() => import('@/components/projects/wbs-view'), { ssr: false });

const AdminProjectsPageContent = () => {
    const { projects, loading: projectsLoading, saveProject } = useProjects();
    const { tasks, loading: tasksLoading, selectedProjectId, setSelectedProjectId, addTask, updateTask, deleteTask } = useTasks();
    const { statuses } = useTableSettings();
    const { users } = useUsers();

    const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToView, setTaskToView] = useState<Task | null>(null);
    const [taskForObservations, setTaskForObservations] = useState<Task | null>(null);
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ content: () => printRef.current });

    useEffect(() => {
        setSelectedProjectId('consolidated');
    }, [setSelectedProjectId]);
    
    const handleUpdateTask = (taskData: Partial<Task> & { id: string }) => {
        updateTask(taskData.id, taskData);
        setTaskToEdit(null);
    };

    const currentProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [selectedProjectId, projects]);
    const isConsolidatedView = selectedProjectId === 'consolidated';
    const isLoading = projectsLoading || tasksLoading;
    const projectSelectorOptions = useMemo(() => [{ id: 'consolidated', name: 'Visão Consolidada' }, ...projects], [projects]);

    return (
        <div className="flex flex-col gap-4 h-full">
            <PageHeader
                title={isConsolidatedView ? "Visão Consolidada (Admin)" : (currentProject?.name || "Projetos")}
                actions={
                    <div className="flex items-center gap-2">
                        <ProjectSelector projects={projectSelectorOptions} value={selectedProjectId || 'consolidated'} onValueChange={setSelectedProjectId} showConsolidatedView={true} />
                        <Button onClick={() => setIsAddProjectModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Novo Projeto</Button>
                    </div>
                }
            />

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <Tabs defaultValue="table" className="flex flex-col flex-1">
                    <TabsList>
                        <TabsTrigger value="table">Tabela</TabsTrigger>
                        <TabsTrigger value="board">Kanban</TabsTrigger>
                        <TabsTrigger value="gantt" disabled={isConsolidatedView}>Gantt</TabsTrigger>
                        <TabsTrigger value="wbs" disabled={isConsolidatedView}>EAP</TabsTrigger>
                    </TabsList>
                    <TabsContent value="table" className="flex-1 flex flex-col">
                        <TableHeaderActions
                           isManager={true}
                           isConsolidatedView={isConsolidatedView}
                           onAddTask={() => setIsAddTaskModalOpen(true)}
                           onPrint={handlePrint}
                           onOpenManager={() => setIsManagerModalOpen(true)}
                        />
                        <TableView 
                            ref={printRef}
                            tasks={tasks} users={users}
                            onEditTask={setTaskToEdit}
                            onViewTask={setTaskToView}
                            onOpenObservations={setTaskForObservations}
                            deleteTask={deleteTask}
                            loading={tasksLoading} isManager={true}
                        />
                    </TabsContent>
                    <TabsContent value="board" className="flex-1 overflow-y-auto">
                        <KanbanBoard tasks={tasks} statuses={statuses} onDragEnd={() => {}} loading={tasksLoading} />
                    </TabsContent>
                    <TabsContent value="gantt" className="flex-1 overflow-y-auto">
                        {!isConsolidatedView && selectedProjectId && (
                          <GanttChartWrapper tasks={tasks} isConsolidated={false} viewMode="day" />
                        )}
                    </TabsContent>
                    <TabsContent value="wbs" className="flex-1 overflow-y-auto">
                        {!isConsolidatedView && <WbsView tasks={tasks} />}
                    </TabsContent>
                </Tabs>
            )}

            <AddProjectModal isOpen={isAddProjectModalOpen} onOpenChange={setIsAddProjectModalOpen} onSave={saveProject} users={users} />
            <AddTaskModal isOpen={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen} onSave={addTask} selectedProject={selectedProjectId || ''} statuses={statuses} users={users} tasks={tasks} />
            {taskToEdit && ( <EditTaskModal key={`edit-${taskToEdit.id}`} isOpen={!!taskToEdit} onOpenChange={() => setTaskToEdit(null)} onSave={handleUpdateTask} task={taskToEdit} statuses={statuses} users={users} tasks={tasks} /> )}
            {taskToView && ( <ViewTaskModal key={`view-${taskToView.id}`} isOpen={!!taskToView} onOpenChange={() => setTaskToView(null)} task={taskToView} /> )}
            {taskForObservations && ( <TaskObservationsModal key={`obs-${taskForObservations.id}`} isOpen={!!taskForObservations} onOpenChange={() => setTaskForObservations(null)} task={taskForObservations} /> )}
            <TableManagerModal isOpen={isManagerModalOpen} onOpenChange={setIsManagerModalOpen} />
        </div>
    );
}

export default function AdminProjectsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <AdminProjectsPageContent />
        </Suspense>
    );
}
