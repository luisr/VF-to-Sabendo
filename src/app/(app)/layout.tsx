"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { ProjectsProvider } from '@/hooks/use-projects';
import { TasksProvider } from '@/hooks/use-tasks';
import { UsersProvider } from '@/hooks/use-users';
import { TableSettingsProvider } from '@/hooks/use-table-settings';
import { DashboardProvider } from '@/hooks/use-dashboard'; // Importar DashboardProvider
import { DashboardPreferencesProvider } from '@/hooks/use-dashboard-preferences';
import { TagsProvider } from '@/hooks/use-tags';
import { BaselinesProvider } from "@/hooks/use-baselines";
import { supabase } from '@/lib/supabase';
import { Toaster } from "@/components/ui/toaster";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkSession();
  }, [router]);

  // CORREÇÃO FINAL: DashboardProvider foi adicionado na hierarquia correta.
  return (
    <UsersProvider>
      <ProjectsProvider>
        <DashboardProvider> {/* Adicionado aqui */}
          <TableSettingsProvider>
            <TagsProvider>
              <BaselinesProvider> 
                <TasksProvider>
                  <DashboardPreferencesProvider>
                      <div className="flex min-h-screen w-full flex-col bg-muted/40">
                        <Suspense fallback={<div>Carregando…</div>}>
                          <Sidebar />
                        </Suspense>
                        <div className="flex flex-col sm:pl-14 flex-1">
                          <Header />
                          <main className="flex flex-1 flex-col overflow-hidden">
                            {children}
                          </main>
                        </div>
                      </div>
                      <Toaster />
                  </DashboardPreferencesProvider>
                </TasksProvider>
              </BaselinesProvider>
            </TagsProvider>
          </TableSettingsProvider>
        </DashboardProvider>
      </ProjectsProvider>
    </UsersProvider>
  );
}
