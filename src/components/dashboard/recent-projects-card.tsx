
"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useTasks } from "@/hooks/use-tasks";
import type { Project } from "@/lib/types";

interface RecentProjectsCardProps {
  projects: Project[]; // Expects projects to be passed as a prop
}

export default function RecentProjectsCard({ projects }: RecentProjectsCardProps) {
  const { tasks, userId } = useTasks();

  const processedProjects = useMemo(() => {
    // The component now works with the projects list it receives.
    const relevantProjects = projects || [];

    return relevantProjects.map(project => {
        const projectTasks = tasks.filter(t => t.project_id === project.id);

        if (projectTasks.length === 0) {
            return {
                name: project.name,
                progress: 0,
                status: "Em Dia",
                team: [] 
            }
        }
        
        const totalProgress = projectTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
        const progress = Math.round(totalProgress / projectTasks.length);
        
        const isOverdue = projectTasks.some(t => t.status === 'Atrasado'); 
        const status = isOverdue ? 'Atrasado' : progress > 80 ? 'Em Dia' : 'Em Risco';
        
        const team = [...new Set(
            projectTasks
                .map(t => t.assignee_id)
                .filter(Boolean)
                .map(id => id!.substring(0, 2).toUpperCase())
        )];

        return { name: project.name, progress, status, team };
    }).slice(0, 4);
  
  }, [projects, tasks, userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projetos Recentes</CardTitle>
        <CardDescription>
          Uma visão geral rápida dos projetos em andamento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Equipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Progresso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(processedProjects || []).map((project) => (
              <TableRow key={project.name}>
                <TableCell>
                  <div className="font-medium">{project.name}</div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {project.team.map((initials, index) => (
                      <Avatar key={index} className="border-2 border-background">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="text-xs" variant={project.status === 'Atrasado' ? 'destructive' : 'secondary'}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <span>{project.progress}%</span>
                        <Progress value={project.progress} className="w-20 h-2" />
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
