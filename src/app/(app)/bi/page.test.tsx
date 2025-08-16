import React from 'react';
import { renderToString } from 'react-dom/server';
import { StatusChart, DeviationChart, SCurveChart, BurndownChart } from './page';

describe('BI charts fallbacks', () => {
  it('renders BurndownChart fallback for malformed data', () => {
    const malformed = [{ date: '2024-01-01', ideal: 'x' as any, real: 5 }];
    const html = renderToString(React.createElement(BurndownChart, { data: malformed }));
    expect(html).toContain('Não há dados de progresso para exibir o burndown.');
  });

  it('renders StatusChart fallback for malformed data', () => {
    const html = renderToString(React.createElement(StatusChart, { data: null as any }));
    expect(html).toContain('Sem dados de status.');
  });

  it('renders DeviationChart fallback for malformed data', () => {
    const html = renderToString(React.createElement(DeviationChart, { data: null as any }));
    expect(html).toContain('Sem dados de desvio.');
  });

  it('renders SCurveChart fallback for malformed data', () => {
    const html = renderToString(React.createElement(SCurveChart, { data: null as any }));
    expect(html).toContain('Não há dados para exibir a Curva S.');
  });
});
