import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

interface DiagCheck {
  id: string;
  label: string;
  status: 'ok' | 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const checks: DiagCheck[] = [];
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

    // ─── Check Secrets presence ─────────────────────────────────────
    const wahaUrl    = Deno.env.get('WAHA_API_URL') || Deno.env.get('WAHA_URL') || '';
    const wahaKey    = Deno.env.get('WAHA_API_KEY') || Deno.env.get('WAHA_KEY') || '';
    const wahaSession = Deno.env.get('WAHA_SESSION') || '';
    const evoUrl     = Deno.env.get('EVOLUTION_API_URL') || Deno.env.get('EVOLUTION_URL') || '';
    const evoKey     = Deno.env.get('EVOLUTION_API_KEY') || Deno.env.get('EVOLUTION_KEY') || '';
    const onspaceAI  = Deno.env.get('ONSPACE_AI_API_KEY') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const hasWaha      = !!wahaUrl;
    const hasEvolution = !!evoUrl && !!evoKey;
    const provider     = hasWaha ? 'waha' : hasEvolution ? 'evolution' : null;

    // Webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
    checks.push({
      id: 'webhook_url',
      label: 'URL do Webhook',
      status: 'info',
      message: webhookUrl,
    });

    // Provider detection
    checks.push({
      id: 'provider',
      label: 'Provedor detectado',
      status: provider ? 'ok' : 'error',
      message: provider === 'waha' ? 'WAHA configurado' : provider === 'evolution' ? 'Evolution API configurado' : 'Nenhum provedor configurado',
      fix: provider ? undefined : 'Adicione WAHA_URL ou EVOLUTION_API_URL nas Secrets do painel Cloud → Secrets',
    });

    // ─── WAHA Checks ────────────────────────────────────────────────
    if (hasWaha) {
      const urlClean = wahaUrl.replace(/\/$/, '');

      checks.push({
        id: 'waha_url',
        label: 'WAHA_URL / WAHA_API_URL',
        status: 'ok',
        message: `Configurada: ${urlClean.slice(0, 40)}${urlClean.length > 40 ? '...' : ''}`,
      });

      checks.push({
        id: 'waha_key',
        label: 'WAHA_KEY / WAHA_API_KEY',
        status: wahaKey ? 'ok' : 'warning',
        message: wahaKey ? 'Configurada (valor oculto)' : 'Não configurada — OK para WAHA sem autenticação',
        fix: wahaKey ? undefined : 'Opcional: adicione WAHA_KEY se seu servidor WAHA exigir autenticação',
      });

      checks.push({
        id: 'waha_session',
        label: 'WAHA_SESSION',
        status: wahaSession ? 'ok' : 'warning',
        message: wahaSession ? `Nome da sessão: "${wahaSession}"` : 'Não configurada — sistema usa ID do usuário como nome da sessão',
        fix: wahaSession ? undefined : 'Opcional: adicione WAHA_SESSION com o nome da sessão WAHA (ex: "default")',
      });

      // Test HTTP connectivity to WAHA
      try {
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (wahaKey) headers['X-Api-Key'] = wahaKey;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const pingRes = await fetch(`${urlClean}/api/server/status`, { headers, signal: controller.signal });
        clearTimeout(timeout);

        if (pingRes.ok) {
          const data = await pingRes.json().catch(() => ({}));
          checks.push({
            id: 'waha_ping',
            label: 'Conectividade WAHA',
            status: 'ok',
            message: `Servidor respondeu OK · Versão: ${data.version || 'desconhecida'} · Engine: ${data.engine || 'WEBJS'}`,
          });
        } else {
          checks.push({
            id: 'waha_ping',
            label: 'Conectividade WAHA',
            status: 'error',
            message: `Servidor retornou HTTP ${pingRes.status}`,
            fix: 'Verifique se o servidor WAHA está rodando e a URL está correta',
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        checks.push({
          id: 'waha_ping',
          label: 'Conectividade WAHA',
          status: 'error',
          message: `Falha ao conectar: ${msg.includes('abort') ? 'Timeout (8s) — servidor inacessível' : msg}`,
          fix: 'Verifique se: 1) a URL é pública (https://), 2) o servidor está rodando, 3) não há barra no final da URL',
        });
      }

      // Test session status
      const sessionName = wahaSession || 'default';
      try {
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (wahaKey) headers['X-Api-Key'] = wahaKey;

        const sessionRes = await fetch(`${urlClean}/api/sessions/${sessionName}`, { headers });

        if (sessionRes.status === 404) {
          checks.push({
            id: 'waha_session_status',
            label: `Sessão WAHA "${sessionName}"`,
            status: 'warning',
            message: 'Sessão não encontrada — será criada ao gerar QR Code',
          });
        } else if (sessionRes.ok) {
          const sData = await sessionRes.json().catch(() => ({}));
          const status = sData.status || sData.state || 'desconhecido';
          checks.push({
            id: 'waha_session_status',
            label: `Sessão WAHA "${sessionName}"`,
            status: status === 'WORKING' ? 'ok' : status === 'SCAN_QR_CODE' ? 'warning' : 'warning',
            message: status === 'WORKING'
              ? `✓ Conectada · Número: ${sData.me?.id?.replace('@c.us', '') || 'detectando...'}`
              : status === 'SCAN_QR_CODE'
              ? 'Aguardando escaneamento do QR Code'
              : `Status: ${status}`,
          });
        } else {
          checks.push({
            id: 'waha_session_status',
            label: `Sessão WAHA "${sessionName}"`,
            status: 'warning',
            message: `HTTP ${sessionRes.status} ao verificar sessão`,
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        checks.push({
          id: 'waha_session_status',
          label: `Sessão WAHA "${sessionName}"`,
          status: 'error',
          message: `Erro ao verificar sessão: ${msg}`,
        });
      }
    }

    // ─── Evolution API Checks ───────────────────────────────────────
    if (hasEvolution) {
      const urlClean = evoUrl.replace(/\/$/, '');

      checks.push({
        id: 'evolution_url',
        label: 'EVOLUTION_API_URL',
        status: 'ok',
        message: `Configurada: ${urlClean.slice(0, 40)}${urlClean.length > 40 ? '...' : ''}`,
      });

      checks.push({
        id: 'evolution_key',
        label: 'EVOLUTION_API_KEY',
        status: 'ok',
        message: 'Configurada (valor oculto)',
      });

      // Test Evolution connectivity
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const pingRes = await fetch(`${urlClean}/`, {
          headers: { 'apikey': evoKey },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        checks.push({
          id: 'evolution_ping',
          label: 'Conectividade Evolution API',
          status: pingRes.ok || pingRes.status === 404 ? 'ok' : 'error',
          message: pingRes.ok || pingRes.status === 404 ? `Servidor acessível · HTTP ${pingRes.status}` : `HTTP ${pingRes.status}`,
          fix: pingRes.ok || pingRes.status === 404 ? undefined : 'Verifique se o servidor Evolution API está rodando',
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        checks.push({
          id: 'evolution_ping',
          label: 'Conectividade Evolution API',
          status: 'error',
          message: `Falha: ${msg.includes('abort') ? 'Timeout (8s)' : msg}`,
          fix: 'Verifique a URL e se o servidor está online',
        });
      }
    }

    // ─── OnSpace AI ─────────────────────────────────────────────────
    checks.push({
      id: 'onspace_ai',
      label: 'OnSpace AI (IA automática)',
      status: onspaceAI ? 'ok' : 'warning',
      message: onspaceAI ? 'Configurada — IA responderá automaticamente' : 'Não configurada — respostas automáticas indisponíveis',
      fix: onspaceAI ? undefined : 'A IA será configurada automaticamente pelo sistema OnSpace',
    });

    // ─── Supabase Backend ───────────────────────────────────────────
    checks.push({
      id: 'supabase',
      label: 'Banco de dados (OnSpace Cloud)',
      status: serviceKey && supabaseUrl ? 'ok' : 'error',
      message: serviceKey && supabaseUrl ? `Conectado · ${supabaseUrl.slice(8, 35)}...` : 'Não configurado',
    });

    // ─── Summary ────────────────────────────────────────────────────
    const errors   = checks.filter(c => c.status === 'error').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const overall  = errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'ok';

    return json({
      overall,
      provider,
      webhookUrl,
      wahaSession: wahaSession || null,
      checks,
      timestamp: new Date().toISOString(),
    });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[diagnostics] Error:', e);
    return json({ error: msg }, 500);
  }
});
