-- supabase/migrations/new_033_add_task_indexes.sql

-- Create B-tree index for tasks project and assignee
CREATE INDEX IF NOT EXISTS idx_tasks_project_assignee
    ON public.tasks USING btree (project_id, assignee_id);

-- Create B-tree index for task observations by task and creation time
CREATE INDEX IF NOT EXISTS idx_task_obs_task_created
    ON public.task_observations USING btree (task_id, created_at);

-- Create B-tree index for task tags by task and tag
CREATE INDEX IF NOT EXISTS idx_task_tags_task_tag
    ON public.task_tags USING btree (task_id, tag_id);
