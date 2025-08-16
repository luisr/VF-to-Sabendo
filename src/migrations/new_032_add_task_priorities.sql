-- supabase/migrations/new_032_add_task_priorities.sql

-- Create support tables for task statuses and priorities
CREATE TABLE IF NOT EXISTS public.task_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text,
  display_order integer
);

CREATE TABLE IF NOT EXISTS public.task_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  rank integer
);

-- Seed default data
INSERT INTO public.task_statuses (name, color, display_order) VALUES
  ('Pendente', '#6b7280', 1),
  ('Em Progresso', '#3b82f6', 2),
  ('Concluído', '#10b981', 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.task_priorities (name, rank) VALUES
  ('Alta', 1),
  ('Média', 2),
  ('Baixa', 3)
ON CONFLICT (name) DO NOTHING;

-- Replace text columns in tasks with foreign keys
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status_id uuid REFERENCES public.task_statuses(id);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'status') THEN
    UPDATE public.tasks t SET status_id = ts.id FROM public.task_statuses ts WHERE t.status = ts.name;
    ALTER TABLE public.tasks DROP COLUMN status;
  END IF;
END $$;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority_id uuid REFERENCES public.task_priorities(id);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') THEN
    UPDATE public.tasks t SET priority_id = tp.id FROM public.task_priorities tp WHERE t.priority::text = tp.name;
    ALTER TABLE public.tasks DROP COLUMN priority;
    DROP TYPE IF EXISTS public.task_priority;
  END IF;
END $$;

-- Function to manage tasks
CREATE OR REPLACE FUNCTION public.manage_task(
    p_task_id uuid DEFAULT NULL,
    p_project_id uuid,
    p_name text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_assignee_id uuid DEFAULT NULL,
    p_status_id uuid DEFAULT NULL,
    p_priority text DEFAULT NULL,
    p_progress integer DEFAULT 0,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_parent_id uuid DEFAULT NULL,
    p_is_milestone boolean DEFAULT false,
    p_custom_fields jsonb DEFAULT '{}'::jsonb,
    p_tag_ids uuid[] DEFAULT '{}',
    p_dependency_ids uuid[] DEFAULT '{}',
    p_justification text DEFAULT NULL,
    p_propagate_dates boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task_id uuid;
    v_priority_id uuid;
BEGIN
    IF p_priority IS NOT NULL THEN
        SELECT id INTO v_priority_id FROM public.task_priorities WHERE name = p_priority;
    END IF;

    IF p_task_id IS NULL THEN
        INSERT INTO public.tasks (project_id, name, description, assignee_id, status_id, priority_id, progress, start_date, end_date, parent_id, is_milestone, custom_fields)
        VALUES (p_project_id, p_name, p_description, p_assignee_id, p_status_id, v_priority_id, p_progress, p_start_date, p_end_date, p_parent_id, p_is_milestone, p_custom_fields)
        RETURNING id INTO v_task_id;
    ELSE
        UPDATE public.tasks
        SET name = p_name,
            description = p_description,
            assignee_id = p_assignee_id,
            status_id = p_status_id,
            priority_id = v_priority_id,
            progress = p_progress,
            start_date = p_start_date,
            end_date = p_end_date,
            parent_id = p_parent_id,
            is_milestone = p_is_milestone,
            custom_fields = p_custom_fields,
            updated_at = now()
        WHERE id = p_task_id
        RETURNING id INTO v_task_id;
    END IF;

    DELETE FROM public.task_tags WHERE task_id = v_task_id;
    IF array_length(p_tag_ids, 1) > 0 THEN
        INSERT INTO public.task_tags (task_id, tag_id)
        SELECT v_task_id, unnest(p_tag_ids);
    END IF;

    DELETE FROM public.task_dependencies WHERE task_id = v_task_id;
    IF array_length(p_dependency_ids, 1) > 0 THEN
        INSERT INTO public.task_dependencies (task_id, dependency_id)
        SELECT v_task_id, unnest(p_dependency_ids);
    END IF;

    RETURN v_task_id;
END;
$$;

-- Function to get all user tasks
CREATE OR REPLACE FUNCTION public.get_all_user_tasks()
RETURNS TABLE(
    id uuid,
    formatted_id text,
    name text,
    description text,
    assignee_id uuid,
    status_id uuid,
    priority text,
    priority_id uuid,
    start_date date,
    end_date date,
    progress integer,
    parent_id uuid,
    is_milestone boolean,
    created_at timestamptz,
    project_id uuid,
    project_name text,
    assignee_name text,
    status_name text,
    status_color text,
    tags json,
    custom_fields jsonb,
    dependency_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        'TSK-' || lpad(t.task_serial_id::text, 4, '0'),
        t.name,
        t.description,
        t.assignee_id,
        t.status_id,
        tp.name AS priority,
        t.priority_id,
        t.start_date,
        t.end_date,
        t.progress,
        t.parent_id,
        t.is_milestone,
        t.created_at,
        t.project_id,
        p.name AS project_name,
        COALESCE(prof.name, prof.email) AS assignee_name,
        ts.name AS status_name,
        ts.color AS status_color,
        (SELECT json_agg(json_build_object('id', tg.id, 'name', tg.name, 'color', tg.color)) FROM public.task_tags tt JOIN public.tags tg ON tt.tag_id = tg.id WHERE tt.task_id = t.id) AS tags,
        t.custom_fields,
        ARRAY(SELECT td.dependency_id FROM public.task_dependencies td WHERE td.task_id = t.id) AS dependency_ids
    FROM public.tasks t
    LEFT JOIN public.projects p ON t.project_id = p.id
    LEFT JOIN public.profiles prof ON t.assignee_id = prof.id
    LEFT JOIN public.task_statuses ts ON t.status_id = ts.id
    LEFT JOIN public.task_priorities tp ON t.priority_id = tp.id
    WHERE is_project_member(t.project_id, auth.uid());
END;
$$;

-- Function to get tasks for a project
CREATE OR REPLACE FUNCTION public.get_tasks_for_project(
    p_project_id uuid,
    p_baseline_id uuid DEFAULT NULL
) RETURNS TABLE(
    id uuid,
    formatted_id text,
    name text,
    description text,
    assignee_id uuid,
    status_id uuid,
    priority text,
    priority_id uuid,
    start_date date,
    end_date date,
    progress integer,
    parent_id uuid,
    is_milestone boolean,
    created_at timestamptz,
    project_id uuid,
    project_name text,
    assignee_name text,
    status_name text,
    status_color text,
    tags json,
    custom_fields jsonb,
    dependency_ids uuid[],
    baseline_start_date date,
    baseline_end_date date,
    baseline_color text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        'TSK-' || lpad(t.task_serial_id::text, 4, '0'),
        t.name,
        t.description,
        t.assignee_id,
        t.status_id,
        tp.name AS priority,
        t.priority_id,
        t.start_date,
        t.end_date,
        t.progress,
        t.parent_id,
        t.is_milestone,
        t.created_at,
        t.project_id,
        p.name AS project_name,
        COALESCE(prof.name, prof.email) AS assignee_name,
        ts.name AS status_name,
        ts.color AS status_color,
        (SELECT json_agg(json_build_object('id', tg.id, 'name', tg.name, 'color', tg.color)) FROM public.task_tags tt JOIN public.tags tg ON tt.tag_id = tg.id WHERE tt.task_id = t.id) AS tags,
        t.custom_fields,
        ARRAY(SELECT td.dependency_id FROM public.task_dependencies td WHERE td.task_id = t.id) AS dependency_ids,
        tb.start_date AS baseline_start_date,
        tb.end_date AS baseline_end_date,
        pb.baseline_color
    FROM public.tasks t
    LEFT JOIN public.projects p ON t.project_id = p.id
    LEFT JOIN public.profiles prof ON t.assignee_id = prof.id
    LEFT JOIN public.task_statuses ts ON t.status_id = ts.id
    LEFT JOIN public.task_priorities tp ON t.priority_id = tp.id
    LEFT JOIN public.task_baselines tb ON (tb.task_id = t.id AND tb.baseline_id = p_baseline_id)
    LEFT JOIN public.project_baselines pb ON (pb.id = tb.baseline_id)
    WHERE t.project_id = p_project_id AND is_project_member(t.project_id, auth.uid());
END;
$$;
