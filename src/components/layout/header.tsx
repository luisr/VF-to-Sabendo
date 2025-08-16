
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import React from 'react';
import {
  Bell,
  PanelLeft,
  Search,
  Package2,
  LayoutDashboard,
  KanbanSquare,
  ClipboardList,
  Calendar,
  Settings
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function AppHeader() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    let name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    if (name === 'My tasks') name = 'Minhas Tarefas';
    return { href, name, isLast: index === segments.length - 1 };
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Abrir Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">To Sabendo</span>
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-4 px-2.5 ${pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground'} hover:text-foreground`}
            >
              <LayoutDashboard className="h-5 w-5" />
              Painel
            </Link>
            <Link
              href="/projects"
              className={`flex items-center gap-4 px-2.5 ${pathname.startsWith('/projects') ? 'text-foreground' : 'text-muted-foreground'} hover:text-foreground`}
            >
              <KanbanSquare className="h-5 w-5" />
              Projetos
            </Link>
             <Link
              href="/my-tasks"
              className={`flex items-center gap-4 px-2.5 ${pathname.startsWith('/my-tasks') ? 'text-foreground' : 'text-muted-foreground'} hover:text-foreground`}
            >
              <ClipboardList className="h-5 w-5" />
              Minhas Tarefas
            </Link>
             <Link
              href="/calendar"
              className={`flex items-center gap-4 px-2.5 ${pathname.startsWith('/calendar') ? 'text-foreground' : 'text-muted-foreground'} hover:text-foreground`}
            >
              <Calendar className="h-5 w-5" />
              Calendário
            </Link>
            <Link
              href="/settings"
              className={`flex items-center gap-4 px-2.5 ${pathname.startsWith('/settings') ? 'text-foreground' : 'text-muted-foreground'} hover:text-foreground`}
            >
              <Settings className="h-5 w-5" />
              Configurações
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {crumb.isLast ? (
                   <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar projetos, tarefas..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
       <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Alternar notificações</span>
        </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <Button
            variant="ghost"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Avatar className="h-8 w-8 border">
              <AvatarImage src="https://placehold.co/32x32" alt="Avatar do usuário" data-ai-hint="profile picture" />
              <AvatarFallback>GP</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/settings" className="w-full cursor-pointer">Configurações</Link></DropdownMenuItem>
          <DropdownMenuItem>Suporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/login" className="w-full cursor-pointer">Sair</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
