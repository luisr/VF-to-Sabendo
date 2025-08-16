import { computeBaselineMetrics } from './baseline';

describe('computeBaselineMetrics', () => {
  const start = new Date('2024-01-01');
  const end = new Date('2024-01-11'); // 10 days
  const baselineStart = new Date('2024-01-02');
  const baselineEnd = new Date('2024-01-05');

  test('calculates width and offset correctly', () => {
    const { width, offset } = computeBaselineMetrics(start, end, baselineStart, baselineEnd);
    expect(width).toBeCloseTo(30);
    expect(offset).toBeCloseTo(10);
  });

  test('returns zeros when baseline dates are missing', () => {
    expect(computeBaselineMetrics(start, end, null, baselineEnd)).toEqual({ width: 0, offset: 0 });
    expect(computeBaselineMetrics(start, end, baselineStart, null)).toEqual({ width: 0, offset: 0 });
  });

  test('returns zeros when task duration is not positive', () => {
    const same = new Date('2024-01-01');
    expect(computeBaselineMetrics(same, same, baselineStart, baselineEnd)).toEqual({ width: 0, offset: 0 });
  });

  test('baseline covering entire task returns 100% width and 0 offset', () => {
    const { width, offset } = computeBaselineMetrics(start, end, start, end);
    expect(width).toBeCloseTo(100);
    expect(offset).toBeCloseTo(0);
  });
});
