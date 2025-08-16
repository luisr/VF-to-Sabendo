
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package2,
  Settings,
  Users,
  GitBranch,
  Database,
  Bell,
  KanbanSquare,
  ClipboardList,
  Calendar,
  Book,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Painel" },
    { href: "/admin/projects", icon: KanbanSquare, label: "Projetos" },
    { href: "/admin/backlog", icon: Book, label: "Backlog" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  
  const checkActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/admin"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">To Sabendo</span>
          </Link>
          {navItems.map((item) => (
             <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                <Link
                    href={item.href}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8 ${checkActive(item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8 text-muted-foreground`}>
                                <Settings className="h-5 w-5" />
                                <span className="sr-only">Configurações do Admin</span>
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">Configurações do Admin</TooltipContent>
                </Tooltip>
                <DropdownMenuContent side="right" align="start">
                    <DropdownMenuLabel>Admin</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/admin/users" className="cursor-pointer"><Users className="mr-2 h-4 w-4" />Gestão de Usuários</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/admin/version-control" className="cursor-pointer"><GitBranch className="mr-2 h-4 w-4" />Gestão de Versão</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/admin/backup" className="cursor-pointer"><Database className="mr-2 h-4 w-4" />Controle e Backup</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/admin/notifications" className="cursor-pointer"><Bell className="mr-2 h-4 w-4" />Notificações</Link></DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
