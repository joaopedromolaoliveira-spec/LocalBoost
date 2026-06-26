import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// ─── WAHA Helpers ──────────────────────────────────────────────────
function wahaHeaders(apiKey?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) h['X-Api-Key'] = apiKey;
  return h;
}

async function wahaGetSession(wahaUrl: string, apiKey: string | undefined, name: string) {
  const res = await fetch(`${wahaUrl}/api/sessions/${name}`, { headers: wahaHeaders(apiKey) });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

async function wahaCreateSession(wahaUrl: string, apiKey: string | undefined, name: string, webhookUrl: string) {
  const res = await fetch(`${wahaUrl}/api/sessions`, {
    method: 'POST',
    headers: wahaHeaders(apiKey),
    body: JSON.stringify({
      name,
      start: true,
      config: {
        webhooks: [{
          url: webhookUrl,
          events: ['message', 'session.status'],
          hmac: null,
          retries: null,
          customHeaders: null,
        }],
      },
    }),
  });
  const text = await res.text();
  console.log('[waha] create session:', res.status, text.slice(0, 200));
  return res.status;
}

async function wahaStartSession(wahaUrl: string, apiKey: string | undefined, name: string) {
  const res = await fetch(`${wahaUrl}/api/sessions/${name}/start`, {
    method: 'POST',
    headers: wahaHeaders(apiKey),
  });
  console.log('[waha] start session:', res.status);
}

async function wahaGetQRCode(wahaUrl: string, apiKey: string | undefined, name: string): Promise<string | null> {
  // Try JSON format first
  const headers: Record<string, string> = { ...wahaHeaders(apiKey), 'Accept': 'application/json' };
  const res = await fetch(`${wahaUrl}/api/sessions/${name}/qr`, { headers });
  if (!res.ok) {
    console.log('[waha] QR not ready, status:', res.status);
    return null;
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    // WAHA returns { value: "data:image/png;base64,..." } or just { value: "raw_base64" }
    const raw = data.value || data.qr || data.base64 || data.qrCode || null;
    if (!raw) return null;
    return raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
  }

  if (contentType.includes('image/')) {
    // Binary image → base64
    const buf = await res.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return `data:image/png;base64,${b64}`;
  }

  // Plain text / raw base64
  const text = await res.text();
  if (text && text.length > 20) {
    return text.startsWith('data:') ? text : `data:image/png;base64,${text}`;
  }
  return null;
}

async function wahaDisconnect(wahaUrl: string, apiKey: string | undefined, name: string) {
  // Try stop first, then delete
  await fetch(`${wahaUrl}/api/sessions/${name}/stop`, {
    method: 'POST',
    headers: wahaHeaders(apiKey),
  }).catch(() => {});

  await fetch(`${wahaUrl}/api/sessions/${name}`, {
    method: 'DELETE',
    headers: wahaHeaders(apiKey),
  }).catch(() => {});
}

// ─── Evolution API Helpers ─────────────────────────────────────────
async function evolutionGetQR(
  evolutionUrl: string,
  evolutionKey: string,
  instanceName: string,
  webhookUrl: string,
  userId: string,
  supabase: ReturnType<typeof createClient>,
) {
  // Try to create instance (422 = already exists, ignore)
  try {
    await fetch(`${evolutionUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: webhookUrl,
        webhookByEvents: true,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
        webhookBase64: false,
      }),
    });
  } catch (e) { console.log('[evolution] create note:', e.message); }

  const stateRes = await fetch(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
    headers: { 'apikey': evolutionKey },
  });

  if (!stateRes.ok) return json({ error: `Evolution API: ${await stateRes.text()}` }, 502);

  const stateData = await stateRes.json();
  const isConnected = stateData.instance?.state === 'open' || stateData.state === 'open';

  if (isConnected) {
    const phoneRaw = stateData.instance?.profileJid || stateData.instance?.wuid || '';
    const phoneNumber = phoneRaw.replace('@s.whatsapp.net', '');
    const profileName = stateData.instance?.profileName || '';
    const profilePicture = stateData.instance?.profilePictureUrl || '';

    await supabase.from('whatsapp_instances').upsert({
      user_id: userId, instance_name: instanceName, status: 'connected',
      phone_number: phoneNumber, profile_name: profileName,
      profile_picture_url: profilePicture, qr_code: null, provider: 'evolution',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'instance_name' });

    return json({ status: 'connected', phoneNumber, profileName, profilePicture, instanceName, provider: 'evolution' });
  }

  const connectRes = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
    headers: { 'apikey': evolutionKey },
  });
  const connectData = await connectRes.json();
  const qrCode = connectData.qrcode?.base64 || connectData.base64 || connectData.qr || connectData.qrcode;

  if (!qrCode) return json({ status: 'connecting', instanceName, message: 'Aguarde, inicializando sessão...', provider: 'evolution' });

  const qrFull = qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`;

  await supabase.from('whatsapp_instances').upsert({
    user_id: userId, instance_name: instanceName, status: 'qr',
    qr_code: qrFull, last_qr_at: new Date().toISOString(),
    provider: 'evolution', updated_at: new Date().toISOString(),
  }, { onConflict: 'instance_name' });

  return json({ status: 'qr', qrCode: qrFull, instanceName, provider: 'evolution' });
}

// ─── Main ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json();
    const { userId, action = 'get_qr' } = body;

    if (!userId) return json({ error: 'userId required' }, 400);

    // Prefer WAHA_SESSION env var so users can set a fixed session name
    const wahaSessionEnv = Deno.env.get('WAHA_SESSION') || '';
    const instanceName = wahaSessionEnv || `lb_${userId.replace(/-/g, '').slice(0, 16)}`;
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`;

    // Detect provider — WAHA takes priority if configured
    // Support both WAHA_API_URL and WAHA_URL (legacy) variable names
    const wahaUrl = (Deno.env.get('WAHA_API_URL') || Deno.env.get('WAHA_URL'))?.replace(/\/$/, '');
    // Support both WAHA_API_KEY and WAHA_KEY (legacy) variable names
    const wahaKey = Deno.env.get('WAHA_API_KEY') || Deno.env.get('WAHA_KEY') || '';
    const evolutionUrl = (Deno.env.get('EVOLUTION_API_URL') || Deno.env.get('EVOLUTION_URL'))?.replace(/\/$/, '');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY') || Deno.env.get('EVOLUTION_KEY');

    console.log(`[whatsapp-qr] wahaUrl=${wahaUrl ? wahaUrl.slice(0, 30) + '...' : 'NOT SET'} evolutionUrl=${evolutionUrl ? 'SET' : 'NOT SET'}`);

    const provider = wahaUrl ? 'waha' : evolutionUrl ? 'evolution' : null;

    if (!provider) {
      return json({
        error: 'Nenhum provedor WhatsApp configurado',
        details: 'Configure WAHA_URL (ou WAHA_API_URL) nas Secrets do painel LocalBoost. Veja a aba "Configurar provedor" para o passo a passo.',
        setupRequired: true,
        providers: ['waha', 'evolution'],
      }, 503);
    }

    console.log(`[whatsapp-qr] action=${action} provider=${provider} user=${userId.slice(0, 8)}`);

    // ── DISCONNECT ──
    if (action === 'disconnect') {
      if (provider === 'waha') {
        await wahaDisconnect(wahaUrl!, wahaKey, instanceName);
      } else {
        await fetch(`${evolutionUrl}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionKey! },
        }).catch(() => {});
      }
      await supabase.from('whatsapp_instances')
        .update({ status: 'disconnected', qr_code: null, phone_number: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      return json({ status: 'disconnected' });
    }

    // ── WAHA: GET QR ──
    if (provider === 'waha') {
      let session = await wahaGetSession(wahaUrl!, wahaKey, instanceName);

      if (session?.status === 'WORKING') {
        const phoneNumber = session.me?.id?.replace('@c.us', '') || session.me?.user || '';
        const profileName = session.me?.pushName || session.me?.name || '';

        await supabase.from('whatsapp_instances').upsert({
          user_id: userId, instance_name: instanceName, status: 'connected',
          phone_number: phoneNumber, profile_name: profileName, qr_code: null,
          provider: 'waha', updated_at: new Date().toISOString(),
        }, { onConflict: 'instance_name' });

        return json({ status: 'connected', phoneNumber, profileName, instanceName, provider: 'waha' });
      }

      // Session doesn't exist → create it
      if (!session) {
        const code = await wahaCreateSession(wahaUrl!, wahaKey, instanceName, webhookUrl);
        if (code >= 400) {
          return json({
            error: `WAHA: falha ao criar sessão (HTTP ${code}). URL: ${wahaUrl?.slice(0, 40)}`,
            details: 'Verifique se: 1) o servidor WAHA está rodando, 2) a URL está correta e acessível, 3) não há barra (/) no final da URL.',
            setupRequired: true,
          }, 502);
        }
        // Give it a moment to start
        await new Promise(r => setTimeout(r, 2500));
        session = await wahaGetSession(wahaUrl!, wahaKey, instanceName);
      }

      // Session stopped → restart
      if (session?.status === 'STOPPED' || session?.status === 'FAILED') {
        await wahaStartSession(wahaUrl!, wahaKey, instanceName);
        await new Promise(r => setTimeout(r, 2000));
      }

      // Session starting → wait
      if (session?.status === 'STARTING') {
        await new Promise(r => setTimeout(r, 3000));
      }

      // Get QR code
      const qrCode = await wahaGetQRCode(wahaUrl!, wahaKey, instanceName);

      if (qrCode) {
        await supabase.from('whatsapp_instances').upsert({
          user_id: userId, instance_name: instanceName, status: 'qr',
          qr_code: qrCode, last_qr_at: new Date().toISOString(),
          provider: 'waha', updated_at: new Date().toISOString(),
        }, { onConflict: 'instance_name' });

        return json({ status: 'qr', qrCode, instanceName, provider: 'waha' });
      }

      return json({ status: 'connecting', instanceName, message: 'WAHA iniciando sessão, aguarde...', provider: 'waha' });
    }

    // ── EVOLUTION API: GET QR ──
    if (!evolutionKey) return json({ error: 'EVOLUTION_API_KEY não configurada' }, 503);
    return await evolutionGetQR(evolutionUrl!, evolutionKey, instanceName, webhookUrl, userId, supabase);

  } catch (e) {
    console.error('[whatsapp-qr] Error:', e);
    return json({ error: `Erro: ${e.message}` }, 500);
  }
});
