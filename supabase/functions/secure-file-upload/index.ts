import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

// O conteúdo de `_shared/cors.ts` foi movido para cá para evitar erros de importação.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Conecta ao Supabase usando a chave de SERVIÇO, que tem privilégios de admin.
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Trata a requisição OPTIONS (necessária para CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { file, fileName, projectId } = await req.json();

    if (!file || !fileName || !projectId) {
      throw new Error("Parâmetros 'file', 'fileName' ou 'projectId' faltando.");
    }
    
    const fileContent = atob(file.split(',')[1]);
    const fileBytes = new Uint8Array(fileContent.length).map((_, i) => fileContent.charCodeAt(i));
    
    const filePath = `${projectId}/imports/${Date.now()}_${fileName}`;
    const bucketName = Deno.env.get("SUPABASE_STORAGE_BUCKET");
    if (!bucketName) {
      throw new Error("Supabase storage bucket name is not defined.");
    }

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBytes, {
          contentType: 'text/csv',
          upsert: false
      });

    if (error) {
      console.error("Erro no upload do Admin:", error);
      throw error;
    }

    return new Response(JSON.stringify({ filePath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("secure-file-upload error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
