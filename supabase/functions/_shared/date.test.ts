import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { parseAndFormatDate, parseDate } from './date.ts';

Deno.test('parseAndFormatDate preserves date', () => {
  const input = '2024-05-01';
  const result = parseAndFormatDate(input, 'start_date', 1);
  assertEquals(result, '2024-05-01');
});

Deno.test('parseDate preserves date', () => {
  const input = '2024-05-01';
  const result = parseDate(input);
  assertEquals(result, '2024-05-01');
});
