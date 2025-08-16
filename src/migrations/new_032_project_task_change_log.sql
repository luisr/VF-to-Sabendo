-- supabase/migrations/new_032_project_task_change_log.sql

-- Trigger function to log project and task changes
CREATE OR REPLACE FUNCTION public.log_project_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
  v_description text;
BEGIN
  IF TG_TABLE_NAME = 'projects' THEN
    v_project_id := NEW.id;
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      v_description := format('Project name changed from %s to %s', OLD.name, NEW.name);
    ELSIF NEW.description IS DISTINCT FROM OLD.description THEN
      v_description := 'Project description updated';
    ELSIF NEW.start_date IS DISTINCT FROM OLD.start_date OR NEW.end_date IS DISTINCT FROM OLD.end_date THEN
      v_description := 'Project dates updated';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    -- TG_TABLE_NAME = 'tasks'
    v_project_id := NEW.project_id;
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      v_description := format('Task name changed from %s to %s', OLD.name, NEW.name);
    ELSIF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
      v_description := 'Task status updated';
    ELSIF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
      v_description := 'Task assignment updated';
    ELSIF NEW.start_date IS DISTINCT FROM OLD.start_date OR NEW.due_date IS DISTINCT FROM OLD.due_date THEN
      v_description := 'Task dates updated';
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.project_change_log (project_id, user_id, description, created_at, updated_at)
  VALUES (v_project_id, auth.uid(), v_description, now(), now());

  RETURN NEW;
END;
$$;

-- Trigger for changes in projects
DROP TRIGGER IF EXISTS trg_projects_change_log ON public.projects;
CREATE TRIGGER trg_projects_change_log
AFTER UPDATE OF name, description, start_date, end_date ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.log_project_change();

-- Trigger for changes in tasks
DROP TRIGGER IF EXISTS trg_tasks_change_log ON public.tasks;
CREATE TRIGGER trg_tasks_change_log
AFTER UPDATE OF name, status_id, assignee_id, start_date, due_date ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.log_project_change();
