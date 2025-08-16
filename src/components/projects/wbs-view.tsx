"use client";
import { useMemo, useState } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/use-tasks';
import { Loader2, PlusSquare, MinusSquare, Folder, FolderOpen } from 'lucide-react';
import type { Task } from '@/lib/types';

// Tipos
type TaskNode = Task & { children: TaskNode[], subtasks: any[] };

// Componente para o nó do projeto (visão consolidada)
const ProjectNode = ({ projectName, isCollapsed, onToggle }: { projectName: string; isCollapsed: boolean; onToggle: () => void; }) => (
    <Card className="w-80 inline-flex flex-col relative shadow-md bg-secondary">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                {isCollapsed ? <Folder className="h-6 w-6 text-secondary-foreground" /> : <FolderOpen className="h-6 w-6 text-secondary-foreground" />}
                <CardTitle className="text-lg">{projectName}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
                {isCollapsed ? <PlusSquare className="h-5 w-5" /> : <MinusSquare className="h-5 w-5" />}
            </Button>
        </CardHeader>
    </Card>
);


// Componente para o nó da tarefa
const WbsNode = ({ task, isCollapsed, onToggle }: { task: TaskNode; isCollapsed: boolean; onToggle: () => void; }) => (
    <Card className="w-72 inline-flex flex-col relative shadow-sm">
        <CardHeader className="p-3">
            <CardTitle className="text-base">{task.wbs_code} {task.name}</CardTitle>
            <CardDescription>ID: {task.id.substring(0, 8)}</CardDescription>
        </CardHeader>
        <CardContent className="p-3 text-sm text-muted-foreground">
            <p>Progresso: {task.progress || 0}%</p>
            <p>Status: <span className="font-medium">{task.status_name || 'N/D'}</span></p>
        </CardContent>
        {(task.subtasks?.length > 0 || task.children?.length > 0) && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                 <Button variant="ghost" size="icon" onClick={onToggle} className="h-10 w-10 rounded-full bg-background hover:bg-muted/90 border shadow">
                    {isCollapsed ? <PlusSquare className="h-5 w-5" /> : <MinusSquare className="h-5 w-5" />}
                </Button>
            </div>
        )}
    </Card>
);

// Função recursiva para renderizar a árvore de tarefas
const renderTaskTree = (tasks: TaskNode[], collapsedNodes: Set<string>, toggleNode: (id: string) => void): React.ReactNode => {
    return tasks.map(task => {
        const isCollapsed = collapsedNodes.has(task.id);
        const children = task.subtasks || task.children;
        return (
            <TreeNode key={task.id} label={<WbsNode task={task} isCollapsed={isCollapsed} onToggle={() => toggleNode(task.id)} />}>
                {!isCollapsed && children && children.length > 0 && renderTaskTree(children, collapsedNodes, toggleNode)}
            </TreeNode>
        );
    });
};

export default function WbsView({ tasks, isConsolidated }: { tasks: TaskNode[], isConsolidated: boolean }) {
    // CORREÇÃO: Fornece um valor padrão para a desestruturação
    const { loading } = useTasks() || { loading: true };
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

    const toggleNode = (nodeId: string) => {
        setCollapsedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) newSet.delete(nodeId);
            else newSet.add(nodeId);
            return newSet;
        });
    };

    const tasksByProject = useMemo(() => {
        if (!isConsolidated) return null;
        return tasks.reduce((acc, task) => {
            const projectId = task.project_id || 'unassigned';
            if (!acc[projectId]) {
                acc[projectId] = {
                    projectName: task.project_name || 'Projeto Desconhecido',
                    tasks: []
                };
            }
            acc[projectId].tasks.push(task);
            return acc;
        }, {} as { [key: string]: { projectName: string; tasks: TaskNode[] } });
    }, [tasks, isConsolidated]);

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="w-full h-full overflow-auto p-8 border rounded-lg bg-background/50">
            {tasks.length > 0 ? (
                <Tree
                    lineWidth={'2px'}
                    lineColor={'hsl(var(--muted-foreground))'}
                    lineBorderRadius={'10px'}
                    label={<Card className="shadow-lg"><CardHeader><CardTitle>{isConsolidated ? "EAP Consolidada" : "Estrutura Analítica do Projeto"}</CardTitle></CardHeader></Card>}
                >
                   {isConsolidated && tasksByProject ? (
                       Object.entries(tasksByProject).map(([projectId, projectData]) => {
                           const isProjectCollapsed = collapsedNodes.has(projectId);
                           return (
                               <TreeNode key={projectId} label={<ProjectNode projectName={projectData.projectName} isCollapsed={isProjectCollapsed} onToggle={() => toggleNode(projectId)} />}>
                                   {!isProjectCollapsed && renderTaskTree(projectData.tasks, collapsedNodes, toggleNode)}
                               </TreeNode>
                           );
                       })
                   ) : (
                       renderTaskTree(tasks, collapsedNodes, toggleNode)
                   )}
                </Tree>
            ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhuma tarefa para exibir.
                </div>
            )}
        </div>
    );
}
