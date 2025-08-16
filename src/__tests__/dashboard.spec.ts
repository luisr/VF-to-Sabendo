import { createClient } from '@supabase/supabase-js';

describe('get_dashboard_page_data', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key';
  const supabase = createClient(supabaseUrl, supabaseKey);

  it('returns different KPI data for distinct projects', async () => {
    const project1Id = '00000000-0000-0000-0000-000000000001';
    const project2Id = '00000000-0000-0000-0000-000000000002';

    // create two projects
    await supabase.from('projects').insert([
      { id: project1Id, name: 'Project One' },
      { id: project2Id, name: 'Project Two' }
    ]);

    // different task distributions to affect KPIs
    await supabase.from('tasks').insert([
      { id: 't1', project_id: project1Id, progress: 0 },
      { id: 't2', project_id: project1Id, progress: 0 },
      { id: 't3', project_id: project2Id, progress: 100 }
    ]);

    const { data: kpi1, error: err1 } = await supabase.rpc('get_dashboard_page_data', { p_project_id: project1Id });
    if (err1) throw err1;
    const { data: kpi2, error: err2 } = await supabase.rpc('get_dashboard_page_data', { p_project_id: project2Id });
    if (err2) throw err2;

    expect(kpi1).not.toEqual(kpi2);
    expect(Array.isArray(kpi1.status_distribution)).toBe(true);
    expect(Array.isArray(kpi1.budget_vs_cost)).toBe(true);
  });
});
