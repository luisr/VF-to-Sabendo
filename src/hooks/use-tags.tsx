"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tag } from '@/lib/types';
import { useToast } from './use-toast';

interface TagsContextType {
  tags: Tag[];
  loading: boolean;
  refetchTags: () => void;
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export const TagsProvider = ({ children }: { children: ReactNode }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTags = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: "Erro ao buscar tags",
        description: error.message,
        variant: "destructive",
      });
      setTags([]);
    } else {
      setTags(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const contextValue = {
    tags,
    loading,
    refetchTags: fetchTags,
  };

  return (
    <TagsContext.Provider value={contextValue}>
      {children}
    </TagsContext.Provider>
  );
};

export const useTags = () => {
  const context = useContext(TagsContext);
  if (context === undefined) {
    throw new Error('useTags must be used within a TagsProvider');
  }
  return context;
};
