import React from 'react';
import { renderToString } from 'react-dom/server';

jest.mock('@nivo/bar', () => ({
  ResponsiveBar: () => React.createElement('svg'),
}));

import GanttChartWrapper from './gantt-chart-wrapper';

describe('GanttChartWrapper', () => {
  const baseTask: any = {
    id: '1',
    name: 'Task 1',
    start_date: '2024-01-01',
    end_date: '2024-01-05',
    progress: 50,
    is_milestone: false,
  };

  it('renders fallback when there are no tasks', () => {
    const html = renderToString(
      React.createElement(GanttChartWrapper, {
        tasks: [],
        isConsolidated: false,
        viewMode: 'day',
      })
    );
    expect(html).toContain('Nenhuma tarefa para exibir');
  });

  it('renders chart when tasks are provided', () => {
    const html = renderToString(
      React.createElement(GanttChartWrapper, {
        tasks: [baseTask],
        isConsolidated: false,
        viewMode: 'day',
      })
    );
    expect(html).toContain('<svg');
  });
});

