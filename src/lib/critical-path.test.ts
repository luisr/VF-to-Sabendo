import { getCriticalPath } from './critical-path';
import { Task } from './types';

describe('getCriticalPath', () => {
  const baseTask: Omit<Task, 'id' | 'dependency_ids' | 'start_date' | 'end_date'> = {
    formatted_id: '',
    name: '',
    priority: 'Média',
    progress: 0,
    is_milestone: false,
    project_id: 'p1'
  };

  it('throws on cyclic dependencies', () => {
    const tasks: Task[] = [
      { ...baseTask, id: '1', start_date: '2023-01-01', end_date: '2023-01-02', dependency_ids: ['2'] },
      { ...baseTask, id: '2', start_date: '2023-01-02', end_date: '2023-01-03', dependency_ids: ['1'] },
    ];

    expect(() => getCriticalPath(tasks)).toThrow('Circular dependency');
  });

  it('calculates duration and path for a linear chain', () => {
    const tasks: Task[] = [
      { ...baseTask, id: '1', start_date: '2023-01-01', end_date: '2023-01-03', dependency_ids: [] },
      { ...baseTask, id: '2', start_date: '2023-01-03', end_date: '2023-01-04', dependency_ids: ['1'] },
      { ...baseTask, id: '3', start_date: '2023-01-04', end_date: '2023-01-07', dependency_ids: ['2'] },
    ];

    const result = getCriticalPath(tasks);
    expect(result).not.toBeNull();
    expect(result!.duration).toBe(6);
    expect(result!.path.map(t => t.id)).toEqual(['1', '2', '3']);
  });

  it('chooses the longest path among branches', () => {
    const tasks: Task[] = [
      { ...baseTask, id: '1', start_date: '2023-01-01', end_date: '2023-01-02', dependency_ids: [] },
      { ...baseTask, id: '2', start_date: '2023-01-02', end_date: '2023-01-03', dependency_ids: ['1'] },
      { ...baseTask, id: '3', start_date: '2023-01-03', end_date: '2023-01-04', dependency_ids: ['2'] },
      { ...baseTask, id: '4', start_date: '2023-01-02', end_date: '2023-01-05', dependency_ids: ['1'] },
      { ...baseTask, id: '5', start_date: '2023-01-05', end_date: '2023-01-06', dependency_ids: ['4'] },
    ];

    const result = getCriticalPath(tasks);
    expect(result).not.toBeNull();
    expect(result!.duration).toBe(5);
    expect(result!.path.map(t => t.id)).toEqual(['1', '4', '5']);
  });

  it('treats tasks without dates as zero-duration', () => {
    const tasks: Task[] = [
      { ...baseTask, id: '1', dependency_ids: [] },
      { ...baseTask, id: '2', start_date: '2023-01-01', end_date: '2023-01-02', dependency_ids: ['1'] },
    ];

    const result = getCriticalPath(tasks);
    expect(result).not.toBeNull();
    expect(result!.duration).toBe(1);
    expect(result!.path.map(t => t.id)).toEqual(['1', '2']);
  });
});
