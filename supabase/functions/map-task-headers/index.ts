import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

console.log("INFO: Function `map-task-headers` initializing.");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { headers } = await req.json();
    const systemFields = "name, description, status_id, assignee_id, priority, progress, start_date, end_date";
    const prompt = `Mapeie as colunas do CSV para os campos do sistema. Responda APENAS com JSON no formato {\"CSV Header\": \"campo\"}. Cabeçalhos: ${headers.join(", ")}. Campos do sistema: ${systemFields}.`;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );

    if (!geminiResponse.ok) {
      throw new Error(`Erro na API do Gemini: ${await geminiResponse.text()}`);
    }
    const geminiResult = await geminiResponse.json();
    const jsonText = geminiResult.candidates[0].content.parts[0].text;
    const mappings = JSON.parse(jsonText.replace(/```json\n?|\n?```/g, ""));

    return new Response(JSON.stringify({ mappings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FATAL:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});

