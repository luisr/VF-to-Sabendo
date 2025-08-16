import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse@5.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();
    if (!projectId) {
      throw new Error("ID do projeto ou 'consolidated' é obrigatório.");
    }

    const isConsolidated = projectId === 'consolidated';

    // Cria um cliente com o JWT do usuário para chamar as funções RPC
    // com as permissões corretas do usuário que fez a requisição.
    const userSupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    
    let tasks: any[] | null = [];
    let error: any = null;

    // A lógica agora é muito mais simples: chama a mesma função que a UI usa.
    if (isConsolidated) {
      const { data, error: rpcError } = await userSupabaseClient.rpc('get_all_user_tasks');
      tasks = data;
      error = rpcError;
    } else {
      // Verifica se o usuário é membro do projeto antes de exportar.
      const { data: isMember } = await userSupabaseClient.rpc('is_project_member', { p_project_id: projectId });
      if (!isMember) {
        throw new Error("Acesso não autorizado a este projeto.");
      }
      const { data, error: rpcError } = await userSupabaseClient.rpc('get_tasks_for_project', { p_project_id: projectId });
      tasks = data;
      error = rpcError;
    }

    if (error) {
      throw new Error(`Erro ao buscar tarefas: ${error.message}`);
    }

    if (!tasks || tasks.length === 0) {
      // Retorna um CSV vazio se não houver tarefas
      const emptyCsv = Papa.unparse([]);
      return new Response(emptyCsv, {
          headers: { ...corsHeaders, "Content-Type": "text/csv;charset=utf-8;" },
      });
    }

    // Mapeia os dados para um formato mais legível
    const tasksToExport = tasks.map(task => {
        const exportTask: { [key: string]: any } = {
            'ID': task.formatted_id || 'N/A',
            'Nome': task.name,
            'Descrição': task.description,
            'Status': task.status_name || 'N/A',
            'Responsável': task.assignee_name || 'N/A',
            'Prioridade': task.priority,
            'Progresso (%)': task.progress,
            'Data de Início': task.start_date,
            'Data de Fim': task.end_date,
            'Tarefa Pai': task.parent_id || 'N/A',
            'Dependências': (task.dependency_ids || []).join(', ') || 'Nenhuma',
        };
        // Adiciona a coluna de projeto apenas na visão consolidada
        if (isConsolidated) {
            exportTask['Projeto'] = task.project_name || 'N/A';
        }
        return exportTask;
    });

    const columns = ['ID', 'Nome', 'Descrição', 'Status', 'Responsável', 'Prioridade', 'Progresso (%)', 'Data de Início', 'Data de Fim', 'Tarefa Pai', 'Dependências'];
    if (isConsolidated) {
        // Garante que a coluna 'Projeto' seja a primeira.
        columns.unshift('Projeto');
    }

    const csv = Papa.unparse(tasksToExport, { columns });
    const filename = `export_${projectId}_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      headers: { ...corsHeaders, "Content-Type": "text/csv;charset=utf-8;", "Content-Disposition": `attachment; filename="${filename}"` },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Erro fatal na função export-tasks:", message);
    return new Response(
      JSON.stringify({ error: `Erro interno no servidor: ${message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
