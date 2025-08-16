import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse";

console.log("INFO: Function `import-tasks` (v11-brazilian-date) is initializing.");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- FUNÇÕES AUXILIARES ---

// NOVA FUNÇÃO para tratar o formato de data DD-MM-YYYY
const parseAndFormatDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    const trimmedDate = dateStr.trim();
    const parts = trimmedDate.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!parts) {
        // Se não corresponder a DD-MM-YYYY, assume que já está em YYYY-MM-DD ou é inválido.
        if (trimmedDate.match(/^\d{4}[-/]\d{2}[-/]\d{2}$/)) {
            return trimmedDate;
        }
        throw new Error(`Formato de data inválido: '${dateStr}'. Use DD-MM-YYYY.`);
    }
    // parts[0] é a string completa, parts[1] é o dia, parts[2] é o mês, parts[3] é o ano
    const day = parts[1];
    const month = parts[2];
    const year = parts[3];
    const isoDate = `${year}-${month}-${day}`;
    // Validação final para garantir que a data é real (ex: não 31/02/2023)
    const dateObj = new Date(isoDate);
    if (dateObj.toISOString().slice(0, 10) !== isoDate) {
        throw new Error(`Data inválida: '${dateStr}'.`);
    }
    return isoDate;
};


const normalizePriority = (priorityStr: string): string => {
    const p = (priorityStr || "").trim().toLowerCase();
    if (['baixa', 'low'].includes(p)) return 'Baixa';
    if (['média', 'media', 'medium'].includes(p)) return 'Média';
    if (['alta', 'high'].includes(p)) return 'Alta';
    throw new Error(`Prioridade inválida: '${priorityStr}'. Use 'Baixa', 'Média' ou 'Alta'.`);
};

const parseProgress = (progress: any): number => {
    let num = 0;
    if (typeof progress === 'number') num = progress;
    else if (typeof progress === 'string') {
        num = parseInt(progress.replace('%', '').trim(), 10);
        if (isNaN(num)) throw new Error(`Progresso inválido: '${progress}'.`);
    } else throw new Error(`Tipo de progresso inválido: '${typeof progress}'.`);
    if (num < 0 || num > 100) throw new Error(`Progresso inválido: ${num}. Deve ser entre 0 e 100.`);
    return num;
};


serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    const { filePath, projectId, mappings } = await req.json();
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ... (lógica de busca de dados permanece a mesma) ...
    const [ userResults, statusResults, priorityResults, tasksResults, downloadResults ] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, name, email'),
        supabaseAdmin.from('task_statuses').select('id, name'),
        supabaseAdmin.from('task_priorities').select('id, name'),
        supabaseAdmin.from('tasks').select('id, name').eq('project_id', projectId),
        supabaseAdmin.storage.from('tosabendo2').download(filePath)
    ]);

    if (userResults.error) throw userResults.error;
    const userMap = new Map(userResults.data.map(u => [(u.name || "").trim().toLowerCase(), u.id]));
    const userEmailMap = new Map(userResults.data.map(u => [(u.email || "").trim().toLowerCase(), u.id]));

    if (statusResults.error) throw statusResults.error;
    const statusMap = new Map(statusResults.data.map(s => [(s.name || "").trim().toLowerCase(), s.id]));

    if (priorityResults.error) throw priorityResults.error;
    const priorityMap = new Map(priorityResults.data.map(p => [(p.name || "").trim().toLowerCase(), p.id]));

    if (tasksResults.error) throw tasksResults.error;
    const existingTaskMap = new Map(tasksResults.data.map(t => [(t.name || "").trim().toLowerCase(), t.id]));
    
    if (downloadResults.error) throw downloadResults.error;
    const fileContent = await downloadResults.data.text();
    const parseResult = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
    if (parseResult.errors.length) throw new Error(`Erro de sintaxe no CSV: ${parseResult.errors[0].message}`);

    const tasksToInsert: any[] = [];
    const importErrors: any[] = [];

    for (const row of parseResult.data) {
        try {
            const task: { [key: string]: any } = { project_id: projectId };
            
            for (const csvHeader in mappings) {
                const systemField = mappings[csvHeader];
                let value = (row as any)[csvHeader];
                if (!systemField || systemField === 'ignore' || value === undefined || value === null) continue;
                value = typeof value === 'string' ? value.trim() : value;
                if(value === '') continue;

                switch(systemField) {
                    case 'name': task.name = String(value); break;
                    case 'assignee_id':
                         const assigneeId = userMap.get(String(value).toLowerCase()) || userEmailMap.get(String(value).toLowerCase());
                         if (!assigneeId) throw new Error(`Usuário '${value}' não encontrado.`);
                         task.assignee_id = assigneeId;
                         break;
                    case 'status_id':
                         const statusId = statusMap.get(String(value).toLowerCase());
                         if (!statusId) throw new Error(`Status '${value}' não encontrado.`);
                         task.status_id = statusId;
                         break;
                    case 'priority':
                         const priorityName = normalizePriority(String(value));
                         const priorityId = priorityMap.get(priorityName.toLowerCase());
                         if (!priorityId) throw new Error(`Prioridade '${value}' não encontrada.`);
                         task.priority_id = priorityId;
                         break;
                    case 'progress': task.progress = parseProgress(value); break;
                    case 'parent_id':
                         const parentId = existingTaskMap.get(String(value).toLowerCase());
                         if (!parentId) throw new Error(`Tarefa Pai '${value}' não encontrada.`);
                         task.parent_id = parentId;
                         break;
                    // LÓGICA DE DATA ATUALIZADA
                    case 'start_date':
                    case 'end_date':
                        task[systemField] = parseAndFormatDate(String(value));
                        break;
                    default:
                        task[systemField] = value;
                        break;
                }
            }
            tasksToInsert.push(task);
        } catch (e) {
            importErrors.push({ row: row, message: e.message });
        }
    }
    
    if (tasksToInsert.length > 0) {
        const { error } = await supabaseAdmin.from('tasks').insert(tasksToInsert);
        if (error) {
             importErrors.push({ row: 'GERAL', message: `Erro Crítico na Inserção: ${error.message}` });
        }
    }

    await supabaseAdmin.storage.from('tosabendo2').remove([filePath]);

    const message = `Importação concluída. ${tasksToInsert.length} tarefas importadas. ${importErrors.length} linhas com erros.`;
    
    return new Response(JSON.stringify({ message, errors: importErrors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FATAL:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});
