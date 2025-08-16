
"use client";

import { Suspense } from "react";
import PageHeader from "@/components/shared/page-header";
import { useCalendarTasks } from "@/hooks/use-calendar-tasks";
import { Loader2 } from "lucide-react";
import ResponsiveCalendar from "@/components/calendar/responsive-calendar";

const AdminCalendarPageContent = () => {
  const { events, loading } = useCalendarTasks();

  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader
        title="Calendário Global"
        description="Visualize todas as tarefas de todos os projetos da organização."
      />
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveCalendar events={events} />
        )}
      </div>
    </div>
  );
}

export default function AdminCalendarPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin"/></div>}>
            <AdminCalendarPageContent />
        </Suspense>
    )
}
