import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, body } = await req.json();
    if (!to || !body) {
      throw new Error("Parâmetros 'to' e 'body' são obrigatórios.");
    }

    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(to)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Formato de número 'to' inválido. Use o padrão E.164.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_WHATSAPP_FROM");

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Variáveis de ambiente do Twilio não configuradas.");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams({
      From: `whatsapp:${fromNumber}`,
      To: `whatsapp:${to}`,
      Body: body,
    });

    const twilioResp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: params.toString(),
    });

    const data: any = await twilioResp.json().catch(() => ({}));
    const errorInfo = {
      status: twilioResp.status,
      body: data,
      error_code: data?.code ?? data?.error_code ?? null,
    };
    const isProduction = Deno.env.get("NODE_ENV") === "production";

    if (!twilioResp.ok) {
      const message = data?.message || data?.error || twilioResp.statusText;

      console.error(
        "Twilio API error",
        isProduction ? { status: errorInfo.status, error_code: errorInfo.error_code } : errorInfo,
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: message,
          status: errorInfo.status,
          body: isProduction ? null : errorInfo.body,
          error_code: errorInfo.error_code,
        }),
        {
          status: twilioResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, sid: data.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("send-whatsapp-notification error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});

