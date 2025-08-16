"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useUsers } from './use-users';

// --- Tipos ---
export interface TaskStatus { id: string; name: string; color: string; display_order?: number; }
export interface Tag { id: string; name: string; color?: string; }
export interface Column { id: string; name: string; type: 'text' | 'number' | 'date' | 'progress'; is_custom?: boolean; }
export type SortDirection = 'asc' | 'desc';

interface TableSettings {
  columns?: Column[];
  visibleColumns?: string[];
  sortBy?: string;
  sortDirection?: SortDirection;
}

interface TableSettingsContextType {
  statuses: TaskStatus[];
  tags: Tag[];
  loading: boolean;
  columns: Column[];
  visibleColumns: string[];
  isSettingsReady: boolean;
  sortBy: string | null;
  sortDirection: SortDirection;
  setSort: (columnId: string) => void;
  setVisibleColumns: (columns: string[]) => void;
  addColumn: (columnName: string, columnType: Column['type']) => Promise<Column | null>;
  updateColumn: (columnId: string, newName: string, newType: Column['type']) => void;
  deleteColumn: (columnId: string) => void;
  addStatus: (status: Omit<TaskStatus, 'id'>) => Promise<TaskStatus | null>;
  updateStatus: (id: string, updates: Partial<TaskStatus>) => Promise<boolean>;
  deleteStatus: (id: string) => Promise<boolean>;
  addTag: (tag: Omit<Tag, 'id' | 'color'> & { color?: string }) => Promise<Tag | null>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<boolean>;
  deleteTag: (id: string) => Promise<boolean>;
}

const TableSettingsContext = createContext<TableSettingsContextType | undefined>(undefined);

const defaultColumns: Column[] = [
    { id: 'wbs_code', name: 'EAP', type: 'text' },
    { id: 'project_name', name: 'Projeto', type: 'text' },
    { id: 'assignee_name', name: 'Responsável', type: 'text' },
    { id: 'status_name', name: 'Status', type: 'text' },
    { id: 'priority', name: 'Prioridade', type: 'text' },
    { id: 'progress', name: 'Progresso', type: 'progress' },
    { id: 'start_date', name: 'Início', type: 'date' },
    { id: 'end_date', name: 'Fim', type: 'date' },
];

export const TableSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(c => c.id));
  const [isSettingsReady, setIsSettingsReady] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>('wbs_code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { user, refetchUsers } = useUsers();
  const { toast } = useToast();

  const fetchSettingsData = useCallback(async () => {
    try {
        if (!user) {
            setLoading(false);
            setIsSettingsReady(true);
            return;
        }
        setLoading(true);
        const [statusRes, tagsRes] = await Promise.all([
            supabase.from('task_statuses').select('*').order('display_order'),
            supabase.from('tags').select('*'),
        ]);
        if (statusRes.error) throw statusRes.error;
        if (tagsRes.error) throw tagsRes.error;
        setStatuses(statusRes.data || []);
        setTags(tagsRes.data || []);
        const userSettings: TableSettings | null = user.table_settings as TableSettings | null;
        if (userSettings) {
            setColumns(userSettings.columns || defaultColumns);
            setVisibleColumns(userSettings.visibleColumns || (userSettings.columns || defaultColumns).map(c => c.id));
            setSortBy(userSettings.sortBy || 'wbs_code');
            setSortDirection(userSettings.sortDirection || 'asc');
        }
    } catch (error: any) {
        toast({ title: "Erro ao carregar configurações", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
        setIsSettingsReady(true);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchSettingsData();
  }, [fetchSettingsData]);

  const persistSettings = async (settings: Partial<TableSettings>) => {
    if (!user) return;
    const finalSettings = { columns, visibleColumns, sortBy, sortDirection, ...settings };
    const { error } = await supabase.from('profiles').update({ table_settings: finalSettings }).eq('id', user.id);
    if (error) toast({ title: "Erro ao salvar configurações", description: error.message, variant: "destructive" });
    else await refetchUsers();
  };

  const setSort = (columnId: string) => {
    const newDirection = sortBy === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortDirection(newDirection);
    persistSettings({ sortBy: columnId, sortDirection: newDirection });
  };
  
  const handleSetVisibleColumns = (newVisible: string[]) => {
    setVisibleColumns(newVisible);
    persistSettings({ visibleColumns: newVisible });
  };
  
  const addColumn = async (name: string, type: Column['type']) => {
    const newColumn: Column = { id: `custom_${Date.now()}`, name, type, is_custom: true };
    const newColumns = [...columns, newColumn];
    setColumns(newColumns);
    await persistSettings({ columns: newColumns });
    return newColumn;
  };
  
  const updateColumn = async (id: string, name: string, type: Column['type']) => {
    const newColumns = columns.map(c => c.id === id ? { ...c, name, type } : c);
    setColumns(newColumns);
    await persistSettings({ columns: newColumns });
  };

  const deleteColumn = async (id: string) => {
    const newColumns = columns.filter(c => c.id !== id);
    setColumns(newColumns);
    await persistSettings({ columns: newColumns });
  };

  const addStatus = async (status: Omit<TaskStatus, 'id'>) => {
    const { data, error } = await supabase.from('task_statuses').insert(status).select().single();
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return null; }
    await fetchSettingsData(); // Re-fetch to get correct order
    return data;
  };
  const updateStatus = async (id: string, updates: Partial<TaskStatus>) => {
    const { error } = await supabase.from('task_statuses').update(updates).eq('id', id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetchSettingsData();
    return true;
  };
  const deleteStatus = async (id: string) => {
    const { error } = await supabase.from('task_statuses').delete().eq('id', id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetchSettingsData();
    return true;
  };

  const addTag = async (tag: Omit<Tag, 'id'>) => {
    const { data, error } = await supabase.from('tags').insert(tag).select().single();
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return null; }
    await fetchSettingsData();
    return data;
  };
  const updateTag = async (id: string, updates: Partial<Tag>) => {
    const { error } = await supabase.from('tags').update(updates).eq('id', id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetchSettingsData();
    return true;
  };
  const deleteTag = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return false; }
    await fetchSettingsData();
    return true;
  };

  const contextValue = {
    statuses, tags, loading, columns, visibleColumns, isSettingsReady,
    sortBy, sortDirection, setSort, setVisibleColumns: handleSetVisibleColumns,
    addColumn, updateColumn, deleteColumn,
    addStatus, updateStatus, deleteStatus, addTag, updateTag, deleteTag
  };

  return (
    <TableSettingsContext.Provider value={contextValue}>
      {children}
    </TableSettingsContext.Provider>
  );
};

export const useTableSettings = () => {
  const context = useContext(TableSettingsContext);
  if (context === undefined) throw new Error('useTableSettings must be used within a TableSettingsProvider');
  return context;
};
