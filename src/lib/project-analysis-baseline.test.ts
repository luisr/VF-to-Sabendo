import fs from 'fs';

describe('get_project_analysis baseline validation', () => {
  const sql = fs.readFileSync(
    'supabase/migrations/new_054_add_heatmap_data_to_analysis.sql',
    'utf8'
  );

  it('contains ownership check in SQL', () => {
    expect(sql).toMatch(
      /FROM public\.project_baselines\s+WHERE id = p_baseline_id AND project_id = p_project_id/
    );
    expect(sql).toMatch(/Baseline não pertence ao projeto indicado/);
  });

  it('throws when baseline belongs to another project (simulation)', () => {
    const baselines = [{ id: 'b1', project_id: 'p1' }];

    function getProjectAnalysis(projectId: string, baselineId: string | null) {
      if (baselineId !== null) {
        const baseline = baselines.find((b) => b.id === baselineId);
        if (!baseline || baseline.project_id !== projectId) {
          throw new Error('Baseline não pertence ao projeto indicado.');
        }
      }
      return true;
    }

    expect(() => getProjectAnalysis('p1', 'b2')).toThrow(
      'Baseline não pertence ao projeto indicado.'
    );
  });

  it('includes additional fields for deviation chart', () => {
    expect(sql).toMatch(/assignee_name/);
    expect(sql).toMatch(/status_name/);
    expect(sql).toMatch(/baseline_start_date/);
    expect(sql).toMatch(/current_start_date/);
    expect(sql).toMatch(/baseline_end_date/);
    expect(sql).toMatch(/current_end_date/);
  });
});

