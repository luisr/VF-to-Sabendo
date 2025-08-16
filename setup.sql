-- ================================================================
-- Extensions
-- ================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ================================================================
-- Roles
-- ================================================================
DO $$ BEGIN CREATE ROLE member;          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE project_manager; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE admin;           EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER ROLE admin WITH BYPASSRLS;
GRANT USAGE ON SCHEMA public TO member, project_manager, admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- ================================================================
-- Types
-- ================================================================
DO $$ BEGIN
  CREATE TYPE collaborator_role AS ENUM ('Gerente','Membro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- Tables
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collaborators (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       collaborator_role NOT NULL DEFAULT 'Membro',
  added_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.task_statuses (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL UNIQUE,
  color text
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  assignee_id uuid REFERENCES public.profiles(id),
  status_id   uuid REFERENCES public.task_statuses(id),
  start_date  date,
  end_date    date,
  due_date    date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_observations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content        text NOT NULL,
  attachment_url text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz
);

CREATE TABLE IF NOT EXISTS public.tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS public.task_tags (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id  uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.project_baselines (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_baselines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_id uuid NOT NULL REFERENCES public.project_baselines(id) ON DELETE CASCADE,
  task_id     uuid NOT NULL,
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_change_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES public.profiles(id),
  description text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- Indexes
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_project_assignee ON public.tasks(project_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_obs_task_created ON public.task_observations(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_tags_task_tag ON public.task_tags(task_id, tag_id);

-- ================================================================
-- Utility & Security Functions
-- ================================================================
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.projects WHERE id=p_project_id AND owner_id=p_user_id)
      OR EXISTS (SELECT 1 FROM public.collaborators WHERE project_id=p_project_id AND user_id=p_user_id);
END $$;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_project_member(p_project_id, auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_project_manager(p_project_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.projects WHERE id=p_project_id AND owner_id=p_user_id)
      OR EXISTS (SELECT 1 FROM public.collaborators WHERE project_id=p_project_id AND user_id=p_user_id AND role='Gerente');
END $$;

CREATE OR REPLACE FUNCTION public.can_access_task_data(p_task_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_project uuid;
BEGIN
  SELECT project_id INTO v_project FROM public.tasks WHERE id=p_task_id;
  RETURN public.is_project_member(v_project, auth.uid());
END $$;

CREATE OR REPLACE FUNCTION public.add_task_observation(p_task_id uuid, p_content text, p_attachment_url text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_project uuid; v_id uuid;
BEGIN
  SELECT project_id INTO v_project FROM public.tasks WHERE id=p_task_id;
  IF NOT is_project_member(v_project, auth.uid()) THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  INSERT INTO public.task_observations(task_id, author_id, content, attachment_url)
  VALUES(p_task_id, auth.uid(), p_content, p_attachment_url)
  RETURNING id INTO v_id;

  RETURN (SELECT jsonb_build_object(
    'id', o.id,
    'task_id', o.task_id,
    'author_id', o.author_id,
    'content', o.content,
    'attachment_url', o.attachment_url,
    'created_at', o.created_at
  ) FROM public.task_observations o WHERE o.id=v_id);
END $$;

CREATE OR REPLACE FUNCTION public.get_task_observations(p_task_id uuid)
RETURNS SETOF public.task_observations LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_project uuid;
BEGIN
  SELECT project_id INTO v_project FROM public.tasks WHERE id=p_task_id;
  IF NOT is_project_member(v_project, auth.uid()) THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;
  RETURN QUERY SELECT * FROM public.task_observations WHERE task_id=p_task_id ORDER BY created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.update_task_observation(p_observation_id uuid, p_new_content text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.task_observations
     SET content=p_new_content, updated_at=now()
   WHERE id=p_observation_id AND author_id=auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Acesso não autorizado ou observação não encontrada.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.delete_task_observation(p_observation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_project uuid; v_author uuid;
BEGIN
  SELECT (SELECT project_id FROM public.tasks WHERE id=o.task_id), o.author_id
    INTO v_project, v_author
    FROM public.task_observations o WHERE o.id=p_observation_id;

  IF v_project IS NULL THEN
    RAISE EXCEPTION 'Observação não encontrada.';
  END IF;

  IF v_author=auth.uid() OR is_project_member(v_project, auth.uid()) THEN
    DELETE FROM public.task_observations WHERE id=p_observation_id;
  ELSE
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.create_project_baseline(p_project_id uuid, p_baseline_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_baseline uuid;
BEGIN
  IF NOT is_project_member(p_project_id, auth.uid()) THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;

  INSERT INTO public.project_baselines(project_id, name)
  VALUES(p_project_id, p_baseline_name) RETURNING id INTO v_baseline;

  INSERT INTO public.task_baselines(baseline_id, task_id, start_date, end_date)
    SELECT v_baseline, t.id,
           COALESCE(t.start_date,current_date),
           COALESCE(t.end_date,current_date)
    FROM public.tasks t WHERE t.project_id=p_project_id;

  RETURN v_baseline;
END $$;

CREATE OR REPLACE FUNCTION public.delete_project_baseline(p_baseline_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_project uuid;
BEGIN
  SELECT project_id INTO v_project FROM public.project_baselines WHERE id=p_baseline_id;
  IF v_project IS NULL THEN
    RAISE EXCEPTION 'Linha de base não encontrada.';
  END IF;
  IF NOT is_project_member(v_project, auth.uid()) THEN
    RAISE EXCEPTION 'Acesso não autorizado.';
  END IF;
  DELETE FROM public.project_baselines WHERE id=p_baseline_id;
END $$;

-- ================================================================
-- Triggers
-- ================================================================
DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_projects ON public.projects;
CREATE TRIGGER set_timestamp_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_tasks ON public.tasks;
CREATE TRIGGER set_timestamp_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_task_obs ON public.task_observations;
CREATE TRIGGER set_timestamp_task_obs
  BEFORE UPDATE ON public.task_observations
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- Trigger function to log project and task changes
DROP FUNCTION IF EXISTS public.log_project_change() CASCADE;
CREATE OR REPLACE FUNCTION public.log_project_change(description text)
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'projects' THEN
    v_project_id := COALESCE(NEW.id, OLD.id);
  ELSE
    v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  END IF;

  INSERT INTO public.project_change_log (project_id, author_id, description)
  VALUES (v_project_id, auth.uid(), description || ' ' || TG_OP);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Triggers to log changes in projects and tasks
DROP TRIGGER IF EXISTS trg_projects_change_log ON public.projects;
CREATE TRIGGER trg_projects_change_log
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_project_change('Project');

DROP TRIGGER IF EXISTS trg_tasks_change_log ON public.tasks;
CREATE TRIGGER trg_tasks_change_log
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_project_change('Task');

-- ================================================================
-- RLS Policies
-- ================================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_baselines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_change_log ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS profiles_self ON public.profiles;
CREATE POLICY profiles_self ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- projects
DROP POLICY IF EXISTS projects_read ON public.projects;
DROP POLICY IF EXISTS projects_insert ON public.projects;
DROP POLICY IF EXISTS projects_update ON public.projects;
DROP POLICY IF EXISTS projects_delete ON public.projects;
CREATE POLICY projects_read ON public.projects
  FOR SELECT USING (is_project_member(id, auth.uid()));
CREATE POLICY projects_insert ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY projects_update ON public.projects
  FOR UPDATE USING (is_project_manager(id, auth.uid()))
  WITH CHECK (is_project_manager(id, auth.uid()));
CREATE POLICY projects_delete ON public.projects
  FOR DELETE USING (is_project_manager(id, auth.uid()));

-- collaborators
DROP POLICY IF EXISTS collaborators_read ON public.collaborators;
DROP POLICY IF EXISTS collaborators_manage ON public.collaborators;
CREATE POLICY collaborators_read ON public.collaborators
  FOR SELECT USING (is_project_member(project_id, auth.uid()));
CREATE POLICY collaborators_manage ON public.collaborators
  FOR ALL USING (is_project_manager(project_id, auth.uid()))
  WITH CHECK (is_project_manager(project_id, auth.uid()));

-- tasks
DROP POLICY IF EXISTS tasks_read ON public.tasks;
DROP POLICY IF EXISTS tasks_insert ON public.tasks;
DROP POLICY IF EXISTS tasks_update ON public.tasks;
DROP POLICY IF EXISTS tasks_delete ON public.tasks;
CREATE POLICY tasks_read ON public.tasks
  FOR SELECT USING (is_project_member(project_id, auth.uid()));
CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT WITH CHECK (is_project_member(project_id, auth.uid()));
CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE USING (auth.uid() = assignee_id OR is_project_manager(project_id, auth.uid()))
  WITH CHECK (auth.uid() = assignee_id OR is_project_manager(project_id, auth.uid()));
CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE USING (auth.uid() = assignee_id OR is_project_manager(project_id, auth.uid()));

-- task_observations
DROP POLICY IF EXISTS task_obs_read ON public.task_observations;
DROP POLICY IF EXISTS task_obs_insert ON public.task_observations;
DROP POLICY IF EXISTS task_obs_update ON public.task_observations;
DROP POLICY IF EXISTS task_obs_delete ON public.task_observations;
CREATE POLICY task_obs_read ON public.task_observations
  FOR SELECT USING (can_access_task_data(task_id));
CREATE POLICY task_obs_insert ON public.task_observations
  FOR INSERT WITH CHECK (can_access_task_data(task_id) AND author_id = auth.uid());
CREATE POLICY task_obs_update ON public.task_observations
  FOR UPDATE USING (
    can_access_task_data(task_id)
    AND (author_id = auth.uid() OR is_project_manager((SELECT project_id FROM public.tasks WHERE id = task_id), auth.uid()))
  )
  WITH CHECK (
    can_access_task_data(task_id)
    AND (author_id = auth.uid() OR is_project_manager((SELECT project_id FROM public.tasks WHERE id = task_id), auth.uid()))
  );
CREATE POLICY task_obs_delete ON public.task_observations
  FOR DELETE USING (
    can_access_task_data(task_id)
    AND (author_id = auth.uid() OR is_project_manager((SELECT project_id FROM public.tasks WHERE id = task_id), auth.uid()))
  );

-- tags
DROP POLICY IF EXISTS tags_access ON public.tags;
CREATE POLICY tags_access ON public.tags
  FOR ALL USING (is_project_member(project_id, auth.uid()))
  WITH CHECK (is_project_member(project_id, auth.uid()));

-- task_tags
DROP POLICY IF EXISTS task_tags_access ON public.task_tags;
CREATE POLICY task_tags_access ON public.task_tags
  FOR ALL USING (is_project_member((SELECT project_id FROM public.tasks WHERE id = task_id), auth.uid()))
  WITH CHECK (is_project_member((SELECT project_id FROM public.tasks WHERE id = task_id), auth.uid()));

-- project_baselines
DROP POLICY IF EXISTS baselines_read ON public.project_baselines;
DROP POLICY IF EXISTS baselines_manage ON public.project_baselines;
CREATE POLICY baselines_read ON public.project_baselines
  FOR SELECT USING (is_project_member(project_id, auth.uid()));
CREATE POLICY baselines_manage ON public.project_baselines
  FOR ALL USING (is_project_manager(project_id, auth.uid()))
  WITH CHECK (is_project_manager(project_id, auth.uid()));

-- task_baselines
DROP POLICY IF EXISTS task_baselines_read ON public.task_baselines;
CREATE POLICY task_baselines_read ON public.task_baselines
  FOR SELECT USING (is_project_member((SELECT project_id FROM public.project_baselines WHERE id = baseline_id), auth.uid()));

-- project_change_log
DROP POLICY IF EXISTS project_log_read ON public.project_change_log;
DROP POLICY IF EXISTS project_log_insert ON public.project_change_log;
CREATE POLICY project_log_read ON public.project_change_log
  FOR SELECT USING (is_project_member(project_id, auth.uid()));
CREATE POLICY project_log_insert ON public.project_change_log
  FOR INSERT WITH CHECK (is_project_member(project_id, auth.uid()));

-- ================================================================
-- Storage (optional)
-- ================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    BEGIN
      -- Replace existing policy with permissive rule for tosabendo2 bucket
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS bucket_tosabendo2_auth ON storage.objects;
      CREATE POLICY bucket_tosabendo2_auth ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'tosabendo2') WITH CHECK (bucket_id = 'tosabendo2');
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Permissão insuficiente para alterar storage.objects.';
    END;
  END IF;
END;
$$;
