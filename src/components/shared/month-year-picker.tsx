"use client";
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthYearPickerProps {
  selectedMonth: string | null;
  onMonthChange: (value: string | null) => void;
}

export default function MonthYearPicker({ selectedMonth, onMonthChange }: MonthYearPickerProps) {
  const months = useMemo(() => {
    const monthOptions = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(today, i);
      const monthValue = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMMM yyyy', { locale: ptBR });
      monthOptions.push({ value: monthValue, label: monthLabel });
    }
    return monthOptions;
  }, []);

  const handleValueChange = (value: string) => {
    onMonthChange(value === 'all' ? null : value);
  };

  return (
    <Select value={selectedMonth || 'all'} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por mês..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os Meses</SelectItem>
        {months.map(month => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
