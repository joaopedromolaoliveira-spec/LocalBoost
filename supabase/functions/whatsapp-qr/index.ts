import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { userId, action = 'get_qr' } = body;

    if (!userId) return json({ error: 'userId required' }, 400);

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionUrl || !evolutionKey) {
      return json({
        error: 'Evolution API não configurada',
        details: 'Adicione EVOLUTION_API_URL e EVOLUTION_API_KEY nas Secrets do painel LocalBoost. Você precisa de uma instância Evolution API rodando (Railway, DigitalOcean, etc.).',
        setupRequired: true,
      }, 503);
    }

    const instanceName = `lb_${userId.replace(/-/g, '').slice(0, 16)}`;
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook`;

    // Action: disconnect
    if (action === 'disconnect') {
      try {
        await fetch(`${evolutionUrl}/instance/logout/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': evolutionKey },
        });
      } catch {}
      await supabase.from('whatsapp_instances')
        .update({ status: 'disconnected', qr_code: null, phone_number: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      return json({ status: 'disconnected' });
    }

    // Try to create instance (returns 422 if already exists - that's OK)
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
    } catch (e) {
      console.log('Create instance note:', e.message);
    }

    // Check connection state
    const stateRes = await fetch(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': evolutionKey },
    });

    if (!stateRes.ok) {
      return json({ error: `Evolution API: ${await stateRes.text()}` }, 502);
    }

    const stateData = await stateRes.json();
    console.log('[whatsapp-qr] state:', JSON.stringify(stateData).slice(0, 200));

    const isConnected = stateData.instance?.state === 'open' || stateData.state === 'open';

    if (isConnected) {
      const phoneRaw = stateData.instance?.profileJid || stateData.instance?.wuid || '';
      const phoneNumber = phoneRaw.replace('@s.whatsapp.net', '');
      const profileName = stateData.instance?.profileName || '';
      const profilePicture = stateData.instance?.profilePictureUrl || '';

      await supabase.from('whatsapp_instances').upsert({
        user_id: userId,
        instance_name: instanceName,
        status: 'connected',
        phone_number: phoneNumber,
        profile_name: profileName,
        profile_picture_url: profilePicture,
        qr_code: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'instance_name' });

      return json({ status: 'connected', phoneNumber, profileName, profilePicture, instanceName });
    }

    // Get QR code
    const connectRes = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
      headers: { 'apikey': evolutionKey },
    });

    const connectData = await connectRes.json();
    console.log('[whatsapp-qr] connect response keys:', Object.keys(connectData));

    // Evolution API v2 returns qrcode.base64
    const qrCode = connectData.qrcode?.base64 
      || connectData.base64 
      || connectData.qr 
      || connectData.qrcode;

    if (!qrCode) {
      // Might already be connecting
      return json({ status: 'connecting', instanceName, message: 'Aguarde, inicializando sessão...' });
    }

    // Ensure it starts with data: prefix
    const qrCodeFull = qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`;

    await supabase.from('whatsapp_instances').upsert({
      user_id: userId,
      instance_name: instanceName,
      status: 'qr',
      qr_code: qrCodeFull,
      last_qr_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'instance_name' });

    return json({ status: 'qr', qrCode: qrCodeFull, instanceName });

  } catch (e) {
    console.error('[whatsapp-qr] Error:', e);
    return json({ error: `Evolution API: ${e.message}` }, 500);
  }
});
