
'use server';

import Papa from 'papaparse';
import { replanAssistantFlow } from '@/ai/flows/replan-assistant';
import { Project, Task } from '@/lib/types';

interface Suggestion {
    taskName: string;
    action: 'create' | 'update' | 'delete' | 'no_change';
    justification: string;
    changes?: {
        old_start_date?: string;
        new_start_date?: string;
        old_end_date?: string;
        new_end_date?: string;
    };
    approved: boolean;
}

export async function getReplanSuggestions(
  _project: Project,
  tasks: Task[],
  baseline: string
): Promise<Suggestion[]> {
  const currentProjectTasks = tasks.map((t) => ({
    name: t.name,
    start_date: t.start_date ?? '',
    end_date: t.end_date ?? '',
    baseline_start_date: t.baseline_start_date ?? undefined,
    baseline_end_date: t.baseline_end_date ?? undefined,
  }));

  const parsed = Papa.parse(baseline, { header: true });
  if (parsed.errors.length) {
    const message = parsed.errors.map((e) => e.message).join('; ');
    throw new Error(`Erro ao processar CSV: ${message}`);
  }
  const newPlanCSV = Papa.unparse(parsed.data);

  try {
    const result = await replanAssistantFlow({
      currentProjectTasks,
      newPlanCSV,
    });

  } catch (error) {
    console.error(error);
    throw new Error('Erro ao obter sugestões de replanejamento.');
  }
}
