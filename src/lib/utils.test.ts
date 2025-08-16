import { cn } from "./utils";

describe('cn', () => {
  it('should merge tailwind classes correctly', () => {
    expect(cn('text-red-500', 'bg-blue-200')).toBe('text-red-500 bg-blue-200');
    expect(cn('p-4', 'p-6')).toBe('p-6'); // tailwind-merge should handle conflicts
    
    // Sort the output to make the test order-independent
    const result = cn('text-lg', 'font-bold', 'text-lg').split(' ').sort().join(' ');
    const expected = 'text-lg font-bold'.split(' ').sort().join(' ');
    expect(result).toBe(expected);
  });

  it('should handle conditional classes', () => {
    expect(cn('text-red-500', false && 'bg-blue-200')).toBe('text-red-500');
    expect(cn('text-red-500', true && 'bg-blue-200')).toBe('text-red-500 bg-blue-200');
  });

  it('should handle different types of inputs', () => {
    expect(cn('text-red-500', null, undefined, 'bg-blue-200')).toBe('text-red-500 bg-blue-200');
    expect(cn({ 'text-red-500': true }, { 'bg-blue-200': false })).toBe('text-red-500');
  });
});