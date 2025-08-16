
"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import type { Task, User } from '@/lib/types';
import { useUsers } from './use-users';

// We need to join project info to the tasks for context
type MyTask = Task & { projects: { name: string } | null };

export const useMyTasks = () => {
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUsers(); // Get the current user to know who to fetch tasks for
  const { toast } = useToast();

  const fetchMyTasks = useCallback(async (currentUser: User) => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects ( name )
        `)
        .eq('assignee_id', currentUser.id);

      if (error) {
        throw error;
      }
      
      setMyTasks(data as MyTask[]);
    } catch (error: any) {
      console.error("Error fetching 'My Tasks':", error);
      toast({
        title: "Erro ao buscar suas tarefas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchMyTasks(user);
    }
  }, [user, fetchMyTasks]);

  // Function to allow updating a task directly from the "My Tasks" page
  const updateMyTask = (taskId: string, updates: Partial<Task>) => {
    setMyTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  return { myTasks, loading, refetch: () => user && fetchMyTasks(user), updateMyTask };
};
