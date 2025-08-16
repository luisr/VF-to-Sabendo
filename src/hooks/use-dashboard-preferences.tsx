
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
import { useUsers } from './use-users'; // Dependemos do usuário autenticado

// Define os widgets padrão para cada visão do painel
const defaultPreferences = {
  consolidated: {
    kpiBudget: true,
    kpiCompletedTasks: true,
    kpiRisk: true,
    kpiCompletion: true,
    chartOverview: true,
    chartStatusDistribution: true,
    chartBudgetVsCost: true,
    cardRecentProjects: true,
    cardRecentTasks: true,
  },
  project: {
    kpiBudget: true,
    kpiCompletedTasks: true,
    kpiRisk: true,
    kpiCompletion: true,
    chartOverview: true,
    chartStatusDistribution: true,
    chartBudgetVsCost: true,
    cardRecentTasks: true,
    cardRecentProjects: true,
  },
};

type Preferences = typeof defaultPreferences;

interface DashboardPreferencesContextType {
  preferences: Preferences;
  loading: boolean;
  setPreference: (
    view: keyof Preferences,
    widgetId: string,
    isVisible: boolean
  ) => void;
  savePreferences: () => void;
}

const DashboardPreferencesContext = createContext<DashboardPreferencesContextType | undefined>(undefined);

export const DashboardPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const { user, refetchUsers } = useUsers(); // Usamos o hook de usuários para obter o perfil atual
  const { toast } = useToast();

  // Carrega as preferências do perfil do usuário quando ele é carregado
  useEffect(() => {
    setLoading(true);
    if (user?.dashboard_preferences) {
      const loaded = user.dashboard_preferences as any;
      // Suporte a estrutura antiga (flat) e nova (aninhada)
      setPreferences(prev => ({
        consolidated: {
          ...prev.consolidated,
          ...(loaded.consolidated ?? loaded),
        },
        project: {
          ...prev.project,
          ...(loaded.project ?? {}),
        },
      }));
    }
    setLoading(false);
  }, [user]);

  // Atualiza o estado de uma preferência específica na UI
  const setPreference = (
    view: keyof Preferences,
    widgetId: string,
    isVisible: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      [view]: { ...prev[view], [widgetId]: isVisible },
    }));
  };

  // Salva o conjunto atual de preferências na coluna JSONB da tabela 'profiles'
  const savePreferences = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não encontrado para salvar as preferências.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ dashboard_preferences: preferences })
      .eq('id', user.id);
    
    if (error) {
      toast({ title: "Erro ao salvar preferências", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preferências salvas com sucesso!" });
      // Refaz o fetch do usuário para garantir que o hook 'useUsers' tenha os dados mais recentes
      await refetchUsers();
    }
  };

  return (
    <DashboardPreferencesContext.Provider value={{ preferences, loading, setPreference, savePreferences }}>
      {children}
    </DashboardPreferencesContext.Provider>
  );
};

export const useDashboardPreferences = () => {
  const context = useContext(DashboardPreferencesContext);
  if (context === undefined) {
    throw new Error('useDashboardPreferences must be used within a DashboardPreferencesProvider');
  }
  return context;
};
