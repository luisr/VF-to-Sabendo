import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Headers CORS para permitir requisições do frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Trata a requisição pre-flight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extrai os dados do corpo da requisição
    const { file, fileName, projectId, taskId } = await req.json();

    if (!file || !fileName || !projectId || !taskId) {
      throw new Error("Parâmetros essenciais (file, fileName, projectId, taskId) faltando.");
    }

    // Decodifica o arquivo de Base64 para binário
    const fileContent = atob(file.split(",")[1]);
    const fileBytes = new Uint8Array(fileContent.length).map((_, i) => fileContent.charCodeAt(i));

    // Define o caminho do arquivo no Storage para organização
    const filePath = `project-attachments/${projectId}/${taskId}/${Date.now()}_${fileName}`;
    const bucketName = "tosabendo2";

    // Faz o upload seguro usando a chave de serviço (privilégios de admin)
    const { data: uploadData, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBytes, {
        contentType: "application/octet-stream", // Tipo genérico para qualquer arquivo
        upsert: false,
      });

    if (error) {
      console.error("Erro no upload do anexo:", error);
      throw error;
    }
    
    // Obtém a URL pública do arquivo recém-enviado
    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);

    // Retorna a URL pública para o frontend
    return new Response(JSON.stringify({ attachmentUrl: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("secure-attachment-upload error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
