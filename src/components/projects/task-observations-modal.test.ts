import { formatObservationDate } from './task-observations-modal';

describe('formatObservationDate', () => {
  it('returns empty string for invalid date strings', () => {
    expect(formatObservationDate('not-a-date')).toBe('');
    expect(formatObservationDate('2024-13-01')).toBe('');
  });
});

