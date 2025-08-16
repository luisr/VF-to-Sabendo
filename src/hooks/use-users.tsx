"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { TableSettings, DashboardPreferences } from "@/lib/types";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone_number: string | null;
  role: string | null;
  avatar_url: string | null;
  notifications_whatsapp: boolean;
  table_settings: TableSettings | null;
  dashboard_preferences: DashboardPreferences | null;
}
interface UsersContextType {
  user: UserProfile | null;
  users: UserProfile[];
  loading: boolean;
  refetchUsers: () => void;
  updateUser: (
    data: Partial<UserProfile> & { id: string }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
}
const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchCurrentUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) setUser(null); else setUser(data);
  }, []);

  const fetchAllUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_all_users");
    if (error) {
      setUsers([]);
      toast({ title: 'Erro ao carregar usuários', description: error.message, variant: 'destructive' });
    } else {
      setUsers(data || []);
    }
  }, [toast]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await Promise.all([fetchCurrentUserProfile(session.user.id), fetchAllUsers()]);
      }
      setLoading(false);
    };
    initialize();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) setUser(null);
    });
    return () => { authListener?.subscription.unsubscribe(); };
  }, [fetchCurrentUserProfile, fetchAllUsers]);

  const updateUser = async (
    data: Partial<UserProfile> & { id: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const { id, ...update } = data;
    const { error } = await supabase.from('profiles').update(update).eq('id', id);
    if (error) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
    if (user && user.id === id) setUser({ ...user, ...update });
    await fetchAllUsers();
    return { success: true };
  };

  const deleteUser = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      toast({
        title: 'Erro ao excluir usuário',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
    if (user && user.id === id) setUser(null);
    await fetchAllUsers();
    return { success: true };
  };

  const contextValue = { user, users, loading, refetchUsers: fetchAllUsers, updateUser, deleteUser };
  return (<UsersContext.Provider value={contextValue}>{children}</UsersContext.Provider>);
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) throw new Error("useUsers must be used within a UsersProvider");
  return context;
};
