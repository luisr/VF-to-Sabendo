import { parseUTCDate, formatToISODate } from './date-utils';

describe('date utils timezone handling', () => {
  it('keeps ISO string dates without timezone offsets', () => {
    const iso = '2024-05-10';
    const parsed = parseUTCDate(iso);
    expect(parsed).toBeInstanceOf(Date);
    expect(formatToISODate(parsed!)).toBe(iso);
  });

  it('accepts Date objects directly', () => {
    const dateObj = new Date('2024-05-10T00:00:00');
    const formatted = formatToISODate(dateObj);
    expect(formatted).toBe('2024-05-10');
  });
});

