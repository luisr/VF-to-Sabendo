-- supabase/migrations/new_031_create_delete_baseline_rpc.sql

-- Função para apagar uma linha de base e todos os seus snapshots de tarefas associados.
CREATE OR REPLACE FUNCTION public.delete_project_baseline(p_baseline_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project_id uuid;
BEGIN
    -- 1. Primeiro, encontra o ID do projeto a que a linha de base pertence.
    SELECT project_id INTO v_project_id FROM public.project_baselines WHERE id = p_baseline_id;

    -- 2. Se a linha de base não for encontrada, lança um erro.
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Linha de base não encontrada.';
    END IF;
    
    -- 3. Verifica se o usuário tem permissão para apagar (é membro do projeto).
    IF NOT is_project_member(v_project_id, auth.uid()) THEN
        RAISE EXCEPTION 'Acesso não autorizado: Você não pode apagar linhas de base para este projeto.';
    END IF;

    -- 4. Apaga a linha de base. A constraint ON DELETE CASCADE nas tabelas
    --    garante que todos os snapshots de tarefas em `task_baselines`
    --    sejam apagados automaticamente.
    DELETE FROM public.project_baselines WHERE id = p_baseline_id;
END;
$$;
