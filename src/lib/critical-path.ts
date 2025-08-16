import { Task } from './types';
import { parseUTCDate } from './date-utils';

// Calcula o caminho crítico de uma lista de tarefas.
// Retorna as tarefas que compõem o caminho crítico e a duração total em dias.
export function getCriticalPath(tasks: Task[]): { path: Task[]; duration: number } | null {
  if (!tasks || tasks.length === 0) return null;

  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, t));

  const memo = new Map<string, { duration: number; path: Task[] }>();
  const stack = new Set<string>();

  function dfs(taskId: string): { duration: number; path: Task[] } {
    if (memo.has(taskId)) return memo.get(taskId)!;
    if (stack.has(taskId)) throw new Error(`Circular dependency detected at ${taskId}`);
    const task = taskMap.get(taskId);
    if (!task) return { duration: 0, path: [] };

    const taskDuration = task.start_date && task.end_date
      ? Math.max(
          0,
          (parseUTCDate(task.end_date)!.getTime() - parseUTCDate(task.start_date)!.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    stack.add(taskId);
    let maxDep = { duration: 0, path: [] as Task[] };
    (task.dependency_ids || []).forEach(depId => {
      if (stack.has(depId)) throw new Error(`Circular dependency detected at ${depId}`);
      const result = dfs(depId);
      if (result.duration > maxDep.duration) maxDep = result;
    });
    stack.delete(taskId);

    const totalDuration = maxDep.duration + taskDuration;
    const path = [...maxDep.path, task];
    const res = { duration: totalDuration, path };
    memo.set(taskId, res);
    return res;
  }

  let overall = { duration: 0, path: [] as Task[] };
  tasks.forEach(t => {
    const result = dfs(t.id);
    if (result.duration > overall.duration) overall = result;
  });

  return overall.path.length ? overall : null;
}
