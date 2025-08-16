import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const providerUrl = Deno.env.get("TASK_NOTIFICATION_URL") ?? "";
const providerKey = Deno.env.get("TASK_NOTIFICATION_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, body } = await req.json();
    if (!to || !body) {
      throw new Error("Parâmetros 'to' e 'body' são obrigatórios.");
    }
    if (!providerUrl) {
      throw new Error("URL do provedor não configurada.");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (providerKey) headers["Authorization"] = `Bearer ${providerKey}`;

    const providerResp = await fetch(providerUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ to, body }),
    });

    const providerData = await providerResp.json().catch(() => ({}));

    if (!providerResp.ok) {
      const message = providerData?.error || providerResp.statusText;
      return new Response(
        JSON.stringify({ success: false, error: message }),
        {
          status: providerResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: providerData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("send-task-notification error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});

