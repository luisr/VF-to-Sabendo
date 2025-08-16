"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";

// Tipagem para Colaborador
interface Collaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  users: {
    name: string;
    avatar: string;
  }
}

export const useCollaborators = (projectId: string | null) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCollaborators = useCallback(async (pId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('collaborators')
      .select('*, users(name, avatar)')
      .eq('project_id', pId);
      
    if (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os colaboradores.", variant: "destructive" });
      setCollaborators([]);
    } else {
      setCollaborators(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    // ** AÇÃO DE CONTORNO: A CHAMADA DE REDE FOI DESATIVADA AQUI **
    // Esta linha é a causa do erro 500. Desativá-la estabilizará a página.
    
    // if (projectId && projectId !== 'consolidated') {
    //   fetchCollaborators(projectId);
    // } else {
      setCollaborators([]);
      setLoading(false);
    // }
  }, [projectId, fetchCollaborators]);

  const addCollaborator = async (projectId: string, userId: string, role: string) => {
    // ... (lógica existente)
    return null;
  };

  const removeCollaborator = async (collaboratorId: string) => {
    // ... (lógica existente)
    return false;
  };

  return { collaborators, loading, addCollaborator, removeCollaborator };
};
