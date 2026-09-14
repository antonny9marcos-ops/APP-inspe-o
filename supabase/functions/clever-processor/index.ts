// Edge Function: clever-processor (nome do slug real no Supabase — ficou
// com esse nome porque foi o placeholder sugerido no primeiro deploy e o
// slug não pôde ser renomeado depois; a pasta local se chama igual só
// pra não confundir qual código corresponde a qual função publicada).
//
// Recebe um prompt do app e chama a API do Gemini a partir do servidor,
// usando a variável de ambiente GEMINI_API_KEY (secret do Supabase, NUNCA
// prefixada com VITE_). Isso existe pra chave da API do Gemini nunca mais
// aparecer no bundle JS público — antes disso, o app chamava o Gemini
// direto do navegador com @google/generative-ai, o que expunha a chave
// pra qualquer visitante do site (achado de uma revisão de segurança).
//
// Deploy: supabase functions deploy clever-processor
// Secret: supabase secrets set GEMINI_API_KEY=xxxxx

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // O "Verify JWT" do painel do Supabase só garante que o token é um JWT
  // válido do projeto — a própria chave `anon` pública satisfaz isso, então
  // sozinho ele NÃO garante que quem chamou fez login de verdade. Aqui
  // validamos o token contra o Supabase Auth: só passa se for uma sessão
  // de usuário autenticado de fato (SUPABASE_URL/SUPABASE_ANON_KEY são
  // injetadas automaticamente em toda Edge Function, não precisa configurar).
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Não autenticado." }, 401);
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: "Não autenticado." }, 401);
  }

  let prompt: unknown;
  try {
    const body = await req.json();
    prompt = body?.prompt;
  } catch {
    return jsonResponse({ error: 'Corpo inválido: envie {"prompt": "..."}.' }, 400);
  }

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return jsonResponse({ error: 'Campo "prompt" é obrigatório e deve ser texto.' }, 400);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "Servidor mal configurado: GEMINI_API_KEY ausente." }, 500);
  }

  // Uma tentativa por modelo, com teto de tempo por chamada. Sem isso, uma
  // única chamada travada podia deixar a função inteira presa até o limite
  // de execução da plataforma (150s) e ser derrubada à força — foi
  // exatamente o que aconteceu com o retry antigo (3 modelos x 3 tentativas,
  // sem timeout nenhum).
  const REQUEST_TIMEOUT_MS = 20_000;
  let lastError = "Falha desconhecida.";

  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          signal: controller.signal,
        },
      );

      if (resp.ok) {
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        return jsonResponse({ text });
      }

      lastError = `${model}: ${resp.status} - ${await resp.text()}`;
    } catch (e) {
      lastError = e instanceof Error && e.name === "AbortError"
        ? `${model}: tempo limite de ${REQUEST_TIMEOUT_MS / 1000}s excedido`
        : `${model}: ${String(e)}`;
    } finally {
      clearTimeout(timer);
    }
  }

  return jsonResponse(
    { error: "Modelos de IA temporariamente sobrecarregados. Tente novamente em alguns instantes.", detail: lastError },
    502,
  );
});
