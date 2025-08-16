-- supabase/migrations/new_032_project_task_change_log.sql

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

-- Trigger for changes in projects
DROP TRIGGER IF EXISTS trg_projects_change_log ON public.projects;
CREATE TRIGGER trg_projects_change_log
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.log_project_change('Project');

-- Trigger for changes in tasks
DROP TRIGGER IF EXISTS trg_tasks_change_log ON public.tasks;
CREATE TRIGGER trg_tasks_change_log

FOR EACH ROW
EXECUTE FUNCTION public.log_project_change('Task');
