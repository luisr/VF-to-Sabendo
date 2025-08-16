
"use client";

import type { ReactNode } from "react";
import AppHeader from "@/components/layout/header";
import { UsersProvider } from "@/hooks/use-users";
import { ProjectsProvider } from "@/hooks/use-projects";
import MemberSidebar from "@/components/layout/member-sidebar";
import { TableSettingsProvider } from "@/hooks/use-table-settings";
import { BaselinesProvider } from "@/hooks/use-baselines";
import { TasksProvider } from "@/hooks/use-tasks";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <UsersProvider>
      <ProjectsProvider>
        <TableSettingsProvider>
          <BaselinesProvider>
            <TasksProvider>
              <div className="flex min-h-screen w-full bg-muted/40">
                <MemberSidebar />
                <div className="flex flex-col flex-1 sm:py-4 sm:pl-14">
                  <AppHeader />
                  <main className="flex-1 flex flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                  </main>
                </div>
              </div>
            </TasksProvider>
          </BaselinesProvider>
        </TableSettingsProvider>
      </ProjectsProvider>
    </UsersProvider>
  );
}
