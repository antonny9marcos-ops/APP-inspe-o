// Edge Function: gemini-proxy
//
// Recebe um prompt do app e chama a API do Gemini a partir do servidor,
// usando a variável de ambiente GEMINI_API_KEY (secret do Supabase, NUNCA
// prefixada com VITE_). Isso existe pra chave da API do Gemini nunca mais
// aparecer no bundle JS público — antes disso, o app chamava o Gemini
// direto do navegador com @google/generative-ai, o que expunha a chave
// pra qualquer visitante do site (achado de uma revisão de segurança).
//
// Deploy: supabase functions deploy gemini-proxy
// Secret: supabase secrets set GEMINI_API_KEY=xxxxx

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

  // A verificação de JWT do próprio gateway do Supabase (verify_jwt, ligada
  // por padrão) já bloqueia quem não está autenticado antes de chegar aqui.
  // Esta checagem é só uma segunda camada.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
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

  let lastError = "Falha desconhecida.";

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          },
        );

        if (resp.ok) {
          const data = await resp.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          return jsonResponse({ text });
        }

        const errText = await resp.text();
        lastError = `${resp.status} - ${errText}`;

        const retryable = resp.status === 429 || resp.status === 503 || errText.includes("overloaded");
        if (retryable && attempt < 3) {
          await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
          continue;
        }
        break; // tenta o próximo modelo da lista
      } catch (e) {
        lastError = String(e);
        break;
      }
    }
  }

  return jsonResponse(
    { error: "Modelos de IA temporariamente sobrecarregados. Tente novamente em alguns instantes.", detail: lastError },
    502,
  );
});
