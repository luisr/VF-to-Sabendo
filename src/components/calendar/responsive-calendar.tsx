
"use client";

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { CalendarEvent } from '@/hooks/use-calendar-tasks';

const getPriorityVariant = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case 'urgente': return 'destructive';
        case 'alta': return 'secondary';
        default: return 'outline';
    }
};

export default function ResponsiveCalendar({ events }: { events: CalendarEvent[] }) {
  
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dayEvents = events.filter(event => 
        date >= event.start && date <= event.end
      );
      
      if (dayEvents.length > 0) {
        return (
          <div className="flex flex-col items-center mt-1">
            {dayEvents.slice(0, 2).map(event => (
              <Badge key={event.id} variant={getPriorityVariant(event.resource.priority)} className="text-xs mb-1">
                {event.title}
              </Badge>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <Card className="p-4">
      <Calendar
        tileContent={tileContent}
        className="w-full"
        locale="pt-BR"
      />
    </Card>
  );
}
