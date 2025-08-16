
"use client";

import type { ReactNode } from "react";
import AdminSidebar from "@/components/layout/admin-sidebar";
import AppHeader from "@/components/layout/header";
import { UsersProvider } from "@/hooks/use-users";
import { ProjectsProvider } from "@/hooks/use-projects";
import { BaselinesProvider } from "@/hooks/use-baselines";
import { TasksProvider } from "@/hooks/use-tasks";
import { TableSettingsProvider } from "@/hooks/use-table-settings";
import { DashboardPreferencesProvider } from "@/hooks/use-dashboard-preferences"; // Importar

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <UsersProvider>
      <ProjectsProvider>
        <TableSettingsProvider>
          <BaselinesProvider>

                <div className="flex min-h-screen w-full bg-muted/40">
                  <AdminSidebar />
                  <div className="flex flex-col flex-1 sm:py-4 sm:pl-14">
                    <AppHeader />
                    <main className="flex-1 flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                      {children}
                    </main>
                  </div>
                </div>

          </BaselinesProvider>
        </TableSettingsProvider>
      </ProjectsProvider>
    </UsersProvider>
  );
}
