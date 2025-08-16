import { isTaskOnDate } from './interactive-calendar';
import { parseUTCDate } from '@/lib/date-utils';

describe('isTaskOnDate', () => {
  const referenceDate = parseUTCDate('2024-01-10')!;

  it('returns false when start date is invalid', () => {
    const tasks = [
      { id: 1, name: 'task1', start_date: 'invalid', end_date: '2024-01-11' },
      { id: 2, name: 'task2', start_date: '2024-01-09', end_date: '2024-01-11' },
    ];
    const filtered = tasks.filter(task => isTaskOnDate(task, referenceDate));
    expect(filtered).toEqual([tasks[1]]);
  });

  it('returns false when end date is invalid', () => {
    const tasks = [
      { id: 1, name: 'task1', start_date: '2024-01-09', end_date: 'invalid' },
      { id: 2, name: 'task2', start_date: '2024-01-09', end_date: '2024-01-11' },
    ];
    const filtered = tasks.filter(task => isTaskOnDate(task, referenceDate));
    expect(filtered).toEqual([tasks[1]]);
  });
});
