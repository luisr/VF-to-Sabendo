-- supabase/migrations/new_032_set_timestamp_trigger.sql

CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Attach trigger to projects
DROP TRIGGER IF EXISTS set_timestamp ON public.projects;
CREATE TRIGGER set_timestamp
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- Attach trigger to tasks
DROP TRIGGER IF EXISTS set_timestamp ON public.tasks;
CREATE TRIGGER set_timestamp
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();

-- Attach trigger to task_observations
DROP TRIGGER IF EXISTS set_timestamp ON public.task_observations;
CREATE TRIGGER set_timestamp
BEFORE INSERT OR UPDATE ON public.task_observations
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
