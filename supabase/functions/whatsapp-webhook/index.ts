import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json();

    // ─── Detect provider format ────────────────────────────────────
    // WAHA:     { event: "message" | "session.status", session: "...", payload: {...} }
    // Evolution:{ event: "MESSAGES_UPSERT" | "CONNECTION_UPDATE", instance: "...", data: {...} }
    const isWaha = typeof body.session === 'string' && typeof body.payload === 'object';
    const isEvolution = typeof body.instance === 'string' || typeof body.instanceName === 'string';

    if (isWaha) {
      return await handleWahaWebhook(supabase, body);
    } else if (isEvolution) {
      return await handleEvolutionWebhook(supabase, body);
    }

    console.log('[webhook] Unknown format, body keys:', Object.keys(body));
    return new Response('OK', { status: 200 });

  } catch (e) {
    console.error('[webhook] Error:', e);
    return new Response('OK', { status: 200 }); // Always 200 to prevent retries
  }
});

// ─── WAHA Webhook Handler ──────────────────────────────────────────
async function handleWahaWebhook(supabase: ReturnType<typeof createClient>, body: Record<string, unknown>) {
  const event = body.event as string;
  const sessionName = body.session as string;
  const payload = body.payload as Record<string, unknown>;

  console.log(`[waha-webhook] event=${event} session=${sessionName}`);

  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('instance_name', sessionName)
    .maybeSingle();

  if (!instance) {
    console.log('[waha-webhook] Instance not found:', sessionName);
    return new Response('OK', { status: 200 });
  }

  const userId = instance.user_id;

  // ── session.status ──
  if (event === 'session.status') {
    const status = payload?.status as string;
    console.log('[waha-webhook] session status:', status);

    if (status === 'WORKING') {
      const me = payload.me as Record<string, unknown> | undefined;
      await supabase.from('whatsapp_instances').update({
        status: 'connected',
        phone_number: (me?.id as string || '').replace('@c.us', '').replace('@s.whatsapp.net', ''),
        profile_name: me?.pushName as string || me?.name as string || '',
        qr_code: null,
        updated_at: new Date().toISOString(),
      }).eq('id', instance.id);
    } else if (status === 'SCAN_QR_CODE') {
      await supabase.from('whatsapp_instances').update({
        status: 'qr',
        updated_at: new Date().toISOString(),
      }).eq('id', instance.id);
    } else if (status === 'STOPPED' || status === 'FAILED') {
      await supabase.from('whatsapp_instances').update({
        status: 'disconnected',
        updated_at: new Date().toISOString(),
      }).eq('id', instance.id);
    }
    return new Response('OK', { status: 200 });
  }

  // ── message ──
  if (event === 'message') {
    const fromMe = payload?.fromMe as boolean;
    if (fromMe) return new Response('OK', { status: 200 });

    const from = payload?.from as string || '';
    // Skip groups and broadcasts
    if (from.includes('@g.us') || from.includes('@broadcast')) {
      return new Response('OK', { status: 200 });
    }

    const phone = from.replace('@c.us', '').replace('@s.whatsapp.net', '');
    if (!phone) return new Response('OK', { status: 200 });

    const content = (payload?.body as string) || (payload?.caption as string) || '[Mídia recebida]';
    const pushName = (payload?.notifyName as string) || (payload?._data as Record<string, unknown>)?.notifyName as string || phone;

    // Detect media type from payload
    const hasMedia = payload?.hasMedia as boolean;
    const msgType = payload?.type as string || 'chat';
    const mediaType = hasMedia
      ? (msgType === 'image' ? 'image' : msgType === 'video' ? 'video' : msgType === 'audio' || msgType === 'ptt' ? 'audio' : msgType === 'document' ? 'document' : 'media')
      : 'text';

    const externalId = (payload?.id as string) || ((payload?.id as Record<string, unknown>)?._serialized as string);

    console.log(`[waha-webhook] Message from ${phone}: ${content.slice(0, 50)}`);

    await processInboundMessage(supabase, userId, instance, phone, pushName, content, mediaType, externalId);
    return new Response('OK', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}

// ─── Evolution API Webhook Handler ────────────────────────────────
async function handleEvolutionWebhook(supabase: ReturnType<typeof createClient>, body: Record<string, unknown>) {
  const event = body.event as string || body.type as string || '';
  const instanceName = body.instance as string || body.instanceName as string || '';

  console.log(`[evolution-webhook] event=${event} instance=${instanceName}`);

  if (!instanceName) return new Response('OK', { status: 200 });

  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('instance_name', instanceName)
    .maybeSingle();

  if (!instance) {
    console.log('[evolution-webhook] Instance not found:', instanceName);
    return new Response('OK', { status: 200 });
  }

  const userId = instance.user_id;
  const data = body.data as Record<string, unknown>;

  // ── CONNECTION_UPDATE ──
  if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
    const state = data?.state as string;
    console.log('[evolution-webhook] connection state:', state);

    if (state === 'open') {
      const jid = data?.profileJid as string || '';
      await supabase.from('whatsapp_instances').update({
        status: 'connected',
        phone_number: jid.replace('@s.whatsapp.net', ''),
        profile_name: data?.profileName as string || '',
        updated_at: new Date().toISOString(),
      }).eq('id', instance.id);
    } else if (state === 'close') {
      await supabase.from('whatsapp_instances').update({
        status: 'disconnected',
        updated_at: new Date().toISOString(),
      }).eq('id', instance.id);
    }
    return new Response('OK', { status: 200 });
  }

  // ── QRCODE_UPDATED ──
  if (event === 'QRCODE_UPDATED' || event === 'qrcode.updated') {
    const qrData = data?.qrcode as Record<string, unknown>;
    const qr = qrData?.base64 as string || data?.base64 as string;
    if (qr) {
      const qrFull = qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
      await supabase.from('whatsapp_instances').update({
        qr_code: qrFull,
        last_qr_at: new Date().toISOString(),
        status: 'qr',
      }).eq('id', instance.id);
    }
    return new Response('OK', { status: 200 });
  }

  // ── MESSAGES_UPSERT ──
  if (event === 'MESSAGES_UPSERT' || event === 'messages.upsert') {
    const messages = Array.isArray(data?.messages) ? data.messages as Record<string, unknown>[] : [data];

    for (const message of messages) {
      if (!message || !message.key) continue;
      if (message.key && (message.key as Record<string, unknown>).fromMe) continue;

      const key = message.key as Record<string, unknown>;
      const remoteJid = key?.remoteJid as string || '';
      if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast')) continue;

      const phone = remoteJid.replace('@s.whatsapp.net', '');
      if (!phone) continue;

      const msg = message.message as Record<string, unknown> || {};
      const content = (msg?.conversation as string)
        || ((msg?.extendedTextMessage as Record<string, unknown>)?.text as string)
        || ((msg?.imageMessage as Record<string, unknown>)?.caption as string)
        || ((msg?.videoMessage as Record<string, unknown>)?.caption as string)
        || '[Mídia recebida]';

      const pushName = message?.pushName as string || phone;
      const externalId = key?.id as string;
      const mediaType = msg?.imageMessage ? 'image'
        : msg?.videoMessage ? 'video'
        : msg?.audioMessage ? 'audio'
        : msg?.documentMessage ? 'document'
        : 'text';

      console.log(`[evolution-webhook] Message from ${phone}: ${content.slice(0, 50)}`);

      await processInboundMessage(supabase, userId, instance, phone, pushName, content, mediaType, externalId);
    }

    return new Response('OK', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}

// ─── Shared: process inbound message ──────────────────────────────
async function processInboundMessage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  instance: Record<string, unknown>,
  phone: string,
  pushName: string,
  content: string,
  mediaType: string,
  externalId?: string,
) {
  // Check for duplicate
  if (externalId) {
    const { data: existing } = await supabase
      .from('wa_messages').select('id').eq('external_id', externalId).maybeSingle();
    if (existing) {
      console.log('[webhook] Duplicate message, skipping:', externalId);
      return;
    }
  }

  // Upsert contact
  const { data: contact, error: contactError } = await supabase
    .from('wa_contacts')
    .upsert({
      user_id: userId,
      instance_id: instance.id,
      phone,
      name: pushName,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,phone' })
    .select()
    .single();

  if (contactError || !contact) {
    console.error('[webhook] Contact upsert error:', contactError);
    return;
  }

  // Get or create conversation
  let { data: conversation } = await supabase
    .from('wa_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contact.id)
    .maybeSingle();

  if (!conversation) {
    const { data: newConvo, error: convoError } = await supabase
      .from('wa_conversations')
      .insert({
        user_id: userId,
        instance_id: instance.id,
        contact_id: contact.id,
        status: 'open',
        ai_active: true,
        last_message: content,
        last_message_at: new Date().toISOString(),
        unread_count: 1,
      })
      .select()
      .single();
    if (convoError) { console.error('[webhook] Convo insert error:', convoError); return; }
    conversation = newConvo;
  } else {
    await supabase.from('wa_conversations').update({
      status: 'open',
      last_message: content,
      last_message_at: new Date().toISOString(),
      unread_count: (conversation.unread_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', conversation.id);
  }

  if (!conversation) return;

  // Save message
  await supabase.from('wa_messages').insert({
    conversation_id: conversation.id,
    user_id: userId,
    external_id: externalId,
    direction: 'inbound',
    sender_type: 'customer',
    content,
    media_type: mediaType,
    status: 'received',
  });

  // Trigger AI response if active
  if (conversation.ai_active && !conversation.assigned_agent_id) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        userId,
        conversationId: conversation.id,
        contact: { phone, name: pushName },
        message: content,
        fromWebhook: true,
      }),
    }).catch(e => console.error('[webhook] AI trigger error:', e));
  }
}
