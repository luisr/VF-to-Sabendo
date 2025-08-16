"use client";
import React from 'react';
import { ResponsiveContainer, ScatterChart, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Scatter, Cell } from 'recharts'; // CORREÇÃO: Adicionado 'Cell'
import { scaleLinear } from 'd3-scale';

interface HeatmapChartProps {
  data: { date: string; status: string; count: number }[];
}

// Componente para o conteúdo do Tooltip customizado
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-background border rounded-md shadow-lg text-sm">
        <p className="font-bold">{`Data: ${data.date}`}</p>
        <p>{`Status: ${data.status}`}</p>
        <p>{`Tarefas: ${data.count}`}</p>
      </div>
    );
  }
  return null;
};

export default function HeatmapChart({ data }: HeatmapChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <p className="text-muted-foreground">Dados de mapa de calor indisponíveis.</p>
      </div>
    );
  }

  // Extrai os domínios para os eixos e a escala de cores
  const xDomain = Array.from(new Set(data.map(d => d.date)));
  const yDomain = Array.from(new Set(data.map(d => d.status)));
  const maxCount = Math.max(...data.map(d => d.count), 0);
  
  // Cria uma escala de cores que vai de um azul claro a um azul escuro
  const colorScale = scaleLinear<string>()
    .domain([0, maxCount / 2, maxCount])
    .range(['#cfe2f3', '#6fa8dc', '#3d85c6']);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 80 }}>
        <CartesianGrid />
        <XAxis 
          dataKey="date" 
          type="category" 
          domain={xDomain} 
          name="Data" 
          angle={-45} 
          textAnchor="end"
          height={80}
        />
        <YAxis 
          dataKey="status" 
          type="category" 
          domain={yDomain} 
          name="Status" 
          width={100}
        />
        <ZAxis dataKey="count" range={[100, 1000]} />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} shape="square">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.count > 0 ? colorScale(entry.count) : 'transparent'} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
