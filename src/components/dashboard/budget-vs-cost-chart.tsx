"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BudgetVsCostChartProps {
  data: { month: string; budget: number; cost: number }[];
}

export default function BudgetVsCostChart({ data }: BudgetVsCostChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orçamento vs. Custo</CardTitle>
          <CardDescription>Comparação mensal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Sem dados para exibir.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Função para formatar números grandes (ex: 350000 -> 350k)
  const formatYAxisTick = (tick: number) => {
    return tick > 999 ? `${(tick / 1000).toFixed(0)}k` : tick;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamento vs. Custo</CardTitle>
        <CardDescription>Comparação mensal.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            {/* CORREÇÃO: Define o domínio do eixo Y explicitamente para garantir a renderização */}
            <YAxis 
              tickFormatter={formatYAxisTick}
              domain={[0, (dataMax: number) => Math.max(dataMax * 1.1, 1000)]} 
              allowDataOverflow={true}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="budget" name="Orçamento" fill="#8884d8" />
            <Bar dataKey="cost" name="Custo" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
