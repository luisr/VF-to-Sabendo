import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const suggestionSchema = z.object({
  taskName: z.string(),
  action: z.enum(['create', 'update', 'delete', 'no_change']),
  justification: z.string().optional(),
  changes: z
    .object({
      old_start_date: z.string().optional(),
      new_start_date: z.string().optional(),
      old_end_date: z.string().optional(),
      new_end_date: z.string().optional(),
    })
    .optional(),
});

const replanApplySchema = z.object({
  projectId: z.string(),
  suggestions: z.array(suggestionSchema),
  observation: z.string().optional(),
});

type Suggestion = z.infer<typeof suggestionSchema>;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = replanApplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { projectId, suggestions, observation } = parsed.data;
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') || '';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: token ? `Bearer ${token}` : '' } },
        auth: { persistSession: false }
      }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userData.user.id;

    const affectedTasks: string[] = [];

    for (const suggestion of suggestions) {
      let taskId: string | null = null;

      if (suggestion.action === 'update') {
        const { data: existing } = await supabase
          .from('tasks')
          .select('id, name, description, assignee_id, status_id, priority, progress, start_date, end_date, parent_id, is_milestone, custom_fields, task_tags(tag_id), task_dependencies(dependency_id)')
          .eq('project_id', projectId)
          .ilike('name', suggestion.taskName)
          .single();
        if (!existing) continue;
        const { data, error } = await supabase.rpc('manage_task', {
          p_task_id: existing.id,
          p_project_id: projectId,
          p_name: existing.name,
          p_description: existing.description,
          p_assignee_id: existing.assignee_id,
          p_status_id: existing.status_id,
          p_priority: existing.priority,
          p_progress: existing.progress,
          p_start_date: suggestion.changes?.new_start_date || existing.start_date,
          p_end_date: suggestion.changes?.new_end_date || existing.end_date,
          p_parent_id: existing.parent_id,
          p_is_milestone: existing.is_milestone,
          p_tag_ids: (existing.task_tags ?? []).map((t: any) => t.tag_id),
          p_dependency_ids: (existing.task_dependencies ?? []).map((d: any) => d.dependency_id),
          p_custom_fields: existing.custom_fields || {},
          p_justification: suggestion.justification || null,
          p_propagate_dates: false,
        });
        if (error) throw error;
        taskId = data as string;
      } else if (suggestion.action === 'create') {
        const { data, error } = await supabase.rpc('manage_task', {
          p_task_id: null,
          p_project_id: projectId,
          p_name: suggestion.taskName,
          p_description: null,
          p_assignee_id: null,
          p_status_id: null,
          p_priority: 'Média',
          p_progress: 0,
          p_start_date: suggestion.changes?.new_start_date || null,
          p_end_date: suggestion.changes?.new_end_date || null,
          p_parent_id: null,
          p_is_milestone: false,
          p_tag_ids: [],
          p_dependency_ids: [],
          p_custom_fields: {},
          p_justification: suggestion.justification || null,
          p_propagate_dates: false,
        });
        if (error) throw error;
        taskId = data as string;
      } else {
        continue;
      }

      if (taskId) {
        affectedTasks.push(taskId);
        if (suggestion.justification) {
          const { error: obsError } = await supabase.from('task_observations').insert({
            task_id: taskId,
            author_id: userId,
            content: suggestion.justification,
          });
          if (obsError) throw obsError;
        }
      }
    }

    const { error: replanningError } = await supabase.from('replannings').insert({
      project_id: projectId,
      user_id: userId,
      observation,
      changes: suggestions,
    });
    if (replanningError) throw replanningError;

    return NextResponse.json({ success: true, tasks: affectedTasks });
  } catch (err: any) {
    console.error('Failed to apply replan', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
