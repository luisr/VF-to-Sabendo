// src/lib/types.ts

// Tipos Enum para conformidade com a base de dados
export type TaskPriority = 'Baixa' | 'Média' | 'Alta';
export type CollaboratorRole = 'Gerente' | 'Membro';

// Interface para o perfil de um usuário
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

// Interface para um Projeto
export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  created_at: string;
  collaborator_ids?: string[];
}

// Interface para um Status de Tarefa (ex: A Fazer, Em Progresso)
export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  display_order: number;
}

// Interface para uma Tag (ex: Bug, Melhoria)
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// Interface para uma Tarefa
export interface Task {
  id: string;
  formatted_id: string;
  name: string;
  description?: string;
  assignee_id?: string;
  status_id?: string;
  priority: TaskPriority;
  start_date?: string;
  end_date?: string;
  progress: number;
  parent_id?: string | null;
  is_milestone: boolean;
  project_id: string;
  project_name?: string;
  assignee_name?: string;
  status_name?: string;
  status_color?: string;
  tags?: Tag[];
  dependency_ids?: string[];
  custom_fields?: Record<string, any>;
  // Novas propriedades para a Linha de Base
  baseline_start_date?: string | null;
  baseline_end_date?: string | null;
  baseline_color?: string | null;
}

// Interface para uma Coluna da Tabela (para configurações)
export interface Column {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'progress' | 'user' | 'status';
  is_custom?: boolean;
  is_visible?: boolean;
  display_order?: number;
}

// Interface para uma Observação de Tarefa
export interface Observation {
  id: string;
  task_id: string;
  author_id: string;
  content?: string;
  attachment_url?: string;
  created_at: string;
  updated_at?: string;
  author?: Partial<User>;
}

// Interface para uma Linha de Base de Projeto
export interface ProjectBaseline {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
  baseline_color: string;
}

export type SortDirection = 'asc' | 'desc';

export interface TableSettings {
  columns?: Column[];
  visibleColumns?: string[];
  sortBy?: string;
  sortDirection?: SortDirection;
}

export interface DashboardPreferences {
  consolidated: {
    kpiBudget: boolean;
    kpiCompletedTasks: boolean;
    kpiRisk: boolean;
    kpiCompletion: boolean;
    chartOverview: boolean;
    chartStatusDistribution: boolean;
    chartBudgetVsCost: boolean;
    cardRecentProjects: boolean;
    cardRecentTasks: boolean;
  };
  project: {
    kpiBudget: boolean;
    kpiCompletedTasks: boolean;
    kpiRisk: boolean;
    kpiCompletion: boolean;
    chartOverview: boolean;
    chartStatusDistribution: boolean;
    chartBudgetVsCost: boolean;
    cardRecentTasks: boolean;
    cardRecentProjects: boolean;
  };
}

export interface ProjectAnalysis {
  performance_kpis: {
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
  };
  status_distribution: { name: string; task_count: number }[];
  burndown_data: { date: string; ideal: number; real: number }[];
  baseline_kpis?: {
    average_deviation?: number | null;
    tasks_delayed?: number | null;
  } | null;
  deviation_chart?: {
    name: string;
    assignee_name?: string | null;
    status_name?: string | null;
    baseline_start_date?: string | null;
    current_start_date?: string | null;
    baseline_end_date?: string | null;
    current_end_date?: string | null;
    deviation: number;
  }[] | null;
  s_curve_data?: {
    date: string;
    planned_value: number;
    earned_value: number;
    actual_cost: number;
  }[] | null;
  heatmap_data?: {
    date: string;
    status: string;
    count: number;
  }[] | null;
}
