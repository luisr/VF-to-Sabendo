import { allNavItems } from '@/components/layout/nav-items';

describe('sidebar navigation roles', () => {
  const getLabels = (role: string) =>
    allNavItems
      .filter(item => !item.roles || item.roles.includes(role))
      .map(i => i.label);

  test('Admin sees all items', () => {
    expect(getLabels('Admin')).toEqual(['Painel', 'Projetos', 'Minhas Tarefas', 'BI', 'Calendário']);
  });

  test('Membro sees all items', () => {
    expect(getLabels('Membro')).toEqual(['Painel', 'Projetos', 'Minhas Tarefas', 'BI', 'Calendário']);
  });

  test('Gerente sees only unrestricted items', () => {
    expect(getLabels('Gerente')).toEqual(['Painel', 'Projetos', 'BI']);
  });
});
