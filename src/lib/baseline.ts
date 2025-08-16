export function computeBaselineMetrics(
  start: Date,
  end: Date,
  baselineStart?: Date | null,
  baselineEnd?: Date | null
) {
  const result = { width: 0, offset: 0 };
  if (!baselineStart || !baselineEnd) return result;
  const taskDuration = end.getTime() - start.getTime();
  if (taskDuration <= 0) return result;
  const baselineDuration = baselineEnd.getTime() - baselineStart.getTime();
  result.width = (baselineDuration / taskDuration) * 100;
  result.offset = ((baselineStart.getTime() - start.getTime()) / taskDuration) * 100;
  return result;
}
