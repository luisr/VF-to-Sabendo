import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.2.5";
import mppToXml from "https://esm.sh/mpp-to-xml@1";
import { parseDate } from "../_shared/date.ts";

console.log("INFO: Function `import-project-file` (v6-xml-mpp) is initializing.");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ... (Funções de transformação de dados como parseDate, normalizePriority, etc.)

const normalizePriority = (priority: any): string => {
    const p = String(priority || "500").toLowerCase();
    if (parseInt(p) >= 700) return 'Alta';
    if (parseInt(p) < 400) return 'Baixa';
    return 'Média';
};


serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let body: any = null;
  let channel: any = null;

  try {

    const authHeader = req.headers.get('Authorization')!;
    
    const userSupabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userSupabaseClient.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (progressChannel) {
      channel = supabaseAdmin.channel(progressChannel);
      await channel.subscribe();
      await channel.send({ type: 'broadcast', event: 'progress', payload: { progress: 0 } });
    }

    // 1. Descarregar e analisar o ficheiro (XML ou MPP)
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage.from('tosabendo2').download(filePath);
    if (downloadError) throw downloadError;

    const ext = (fileType || filePath.split('.').pop() || '').toLowerCase();
    let xmlContent: string;
    if (ext === 'mpp') {
      const buffer = await fileData.arrayBuffer();
      xmlContent = mppToXml(new Uint8Array(buffer));
    } else {
      xmlContent = await fileData.text();
    }
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
    const jsonObj = parser.parse(xmlContent);
    const rawTasks = jsonObj.Project.Tasks.Task || [];

    const projectName = jsonObj.Project.Name || `Projeto Importado`;
    const projectDescription = `Projeto '${projectName}' importado em ${new Date().toLocaleDateString()}.`;

    // 2. Criar o projeto
    const { data: newProject, error: projectError } = await supabaseAdmin.from('projects').insert({ name: projectName, description: projectDescription, owner_id: user.id }).select().single();
    if (projectError) throw projectError;

    // 3. Mapeamento com IA
    const sampleTask = rawTasks[0];
    if (!sampleTask) { // Se não houver tarefas, termina aqui com sucesso
        return new Response(JSON.stringify({ message: 'Projeto criado, mas sem tarefas para importar.', newProjectId: newProject.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }

    const fieldsFromSource = Object.keys(sampleTask).join(', ');
    const fieldsFromDB = "name, description, start_date, end_date, progress, priority";
    const mappingPrompt = `Mapeie os campos de origem (XML do MS Project) para os campos da base de dados. Responda APENAS com JSON. Campos de Origem: ${fieldsFromSource}. Campos da Base de Dados: ${fieldsFromDB}.`;
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: mappingPrompt }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
    if (!geminiResponse.ok) throw new Error(`Erro na API do Gemini: ${await geminiResponse.text()}`);
    const geminiResult = await geminiResponse.json();
    const jsonString = geminiResult.candidates[0].content.parts[0].text;
    const mappings = JSON.parse(jsonString.replace(/```json\n?|\n?```/g, ''));
    
    // 4. Transformar e Inserir Tarefas
    const tasksToInsert: any[] = [];
    for (let i = 0; i < rawTasks.length; i++) {
        const rawTask = rawTasks[i];
        const newTask: { [key: string]: any } = { project_id: newProject.id };
        for (const sourceField in mappings) {
            const dbField = mappings[sourceField];
            let value = rawTask[sourceField];
            if (dbField && value !== undefined) {
                if (dbField === 'priority') newTask[dbField] = normalizePriority(value);
                else if (dbField === 'start_date' || dbField === 'end_date') newTask[dbField] = parseDate(value);
                else if (dbField === 'progress') newTask[dbField] = parseInt(String(value), 10) || 0;
                else newTask[dbField] = value;
            }
        }
        if (newTask.name) tasksToInsert.push(newTask);
        if (channel) {
            const progress = Math.round(((i + 1) / rawTasks.length) * 100);
            await channel.send({ type: 'broadcast', event: 'progress', payload: { progress } });
        }
    }

    if (tasksToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from('tasks').insert(tasksToInsert);
      if (insertError) throw insertError;
    }

    await supabaseAdmin.storage.from('tosabendo2').remove([filePath]);

    if (channel) {
      await channel.send({ type: 'broadcast', event: 'complete', payload: { progress: 100, message: 'Projeto importado com sucesso!' } });
      await channel.unsubscribe();
    }

    return new Response(
      JSON.stringify({ message: 'Projeto importado com sucesso!', newProjectId: newProject.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FATAL:", message);
    if (channel) {
      await channel.send({ type: 'broadcast', event: 'error', payload: { message } });
      await channel.unsubscribe();
    } else if (body?.progressChannel) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const tmpChannel = supabaseAdmin.channel(body.progressChannel);
      await tmpChannel.subscribe();
      await tmpChannel.send({ type: 'broadcast', event: 'error', payload: { message } });
      await tmpChannel.unsubscribe();
    }
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
