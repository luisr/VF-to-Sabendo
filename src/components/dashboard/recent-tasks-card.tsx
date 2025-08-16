"use client";
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

interface RecentTask {
  id: string;
  name: string;
  status: string;
  project_name?: string;
  assignee_name?: string;
  status_color?: string;
}

interface RecentTasksCardProps {
  tasks: RecentTask[];
}

const getInitials = (name?: string | null) => {
    if (!name) return 'N/A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function RecentTasksCard({ tasks = [] }: RecentTasksCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>
          As últimas tarefas criadas nos seus projetos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarefa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Responsável</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="font-medium">{task.name}</div>
                    <div className="text-sm text-muted-foreground">{task.project_name}</div>
                  </TableCell>
                  <TableCell>
                    {task.status && (
                        <Badge
                            style={{ backgroundColor: task.status_color, color: 'white' }}
                            className="border-transparent"
                        >
                            {task.status}
                        </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right flex justify-end items-center gap-2">
                    <span className="text-sm text-muted-foreground">{task.assignee_name || 'Não atribuído'}</span>
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(task.assignee_name)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhuma atividade recente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
