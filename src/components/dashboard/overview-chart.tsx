"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OverviewChartProps {
  chartData: {
    month_start: string;
    completed_count: number;
    pending_count: number;
  }[];
}

export default function OverviewChart({ chartData }: OverviewChartProps) {
  const formattedData = React.useMemo(() => {
    if (!Array.isArray(chartData)) return [];
    return chartData
      .filter(item => !!item.month_start)
      .map(item => ({
        name: format(parseISO(`${item.month_start}T00:00:00`), 'MMM/yy', { locale: ptBR }),
        Concluídas: item.completed_count,
        Pendentes: item.pending_count,
      }));
  }, [chartData]);

  if (formattedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral de Tarefas</CardTitle>
          <CardDescription>Contagem de tarefas concluídas vs. pendentes por mês.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">Sem dados para exibir.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral de Tarefas</CardTitle>
        <CardDescription>
          Contagem de tarefas concluídas vs. pendentes por mês de previsão.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar dataKey="Concluídas" fill="hsl(var(--chart-1))" />
                <Bar dataKey="Pendentes" fill="hsl(var(--chart-2))" />
            </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
