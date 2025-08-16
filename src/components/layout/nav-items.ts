import {
  AreaChart,
  Calendar,
  ClipboardList,
  KanbanSquare,
  LayoutDashboard,
} from "lucide-react";

export interface NavItem {
  href: string;
  icon: any;
  label: string;
  roles?: string[];
}

export const allNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Painel" },
  { href: "/projects", icon: KanbanSquare, label: "Projetos" },
  { href: "/projects?filter=my_tasks", icon: ClipboardList, label: "Minhas Tarefas", roles: ["Admin", "Membro"] },
  { href: "/bi", icon: AreaChart, label: "BI" },
  { href: "/calendar", icon: Calendar, label: "Calendário", roles: ["Admin", "Membro"] },
];
