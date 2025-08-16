"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { addDays } from 'date-fns';
import { parseUTCDate } from '@/lib/date-utils';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    priority: string;
    projectId: string;
    projectName: string;
  };
}

export const useCalendarTasks = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCalendarTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_calendar_tasks');

      if (error) throw error;

      // Guard clause: If data is null or not an array, default to an empty array.
      const formattedEvents = data ? data.map((task: any) => ({
        id: task.id,
        title: `${task.name} (${task.project_name})`,
        // Adjust dates to be inclusive in the calendar view
        start: parseUTCDate(task.start_date)!,
        end: addDays(parseUTCDate(task.end_date)!, 1),
        resource: {
          priority: task.priority,
          projectId: task.project_id,
          projectName: task.project_name,
        },
      })) : [];

      setEvents(formattedEvents);

    } catch (error: any) {
      console.error("Error fetching calendar tasks:", error);
      toast({
        title: "Erro ao carregar o calendário",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCalendarTasks();
  }, [fetchCalendarTasks]);

  return { events, loading, refetch: fetchCalendarTasks };
};
