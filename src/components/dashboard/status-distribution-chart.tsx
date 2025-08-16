"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatusDistributionChartProps {
  data: { status: string; task_count: number; color?: string }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

export default function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Status</CardTitle>
          <CardDescription>Quantidade de tarefas por status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-muted-foreground">Sem dados para exibir.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map(item => ({
    name: item.status,
    value: item.task_count,
    fill: item.color 
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Status</CardTitle>
        <CardDescription>Quantidade de tarefas por status.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              dataKey="value"
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
