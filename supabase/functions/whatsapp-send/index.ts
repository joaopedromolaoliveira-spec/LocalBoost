import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

function formatPhone(phone: string): string {
  let p = phone.replace(/\D/g, '');
  if (p.length <= 11) p = `55${p}`;
  return p;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { userId, conversationId, phone, content, senderType = 'agent', mediaType = 'text' } = await req.json();

    if (!userId || !phone || !content) {
      return json({ error: 'userId, phone e content são obrigatórios' }, 400);
    }

    // Get user's connected WhatsApp instance
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'connected')
      .maybeSingle();

    if (!instance) {
      return json({ error: 'WhatsApp não conectado. Conecte seu número primeiro.' }, 400);
    }

    const phoneFormatted = formatPhone(phone);
    const provider = instance.provider || 'evolution';

    console.log(`[whatsapp-send] provider=${provider} to=${phoneFormatted} instance=${instance.instance_name}`);

    let externalId: string | undefined;

    // ─── WAHA ──────────────────────────────────────────────────────
    if (provider === 'waha') {
      const wahaUrl = Deno.env.get('WAHA_API_URL')?.replace(/\/$/, '');
      const wahaKey = Deno.env.get('WAHA_API_KEY');

      if (!wahaUrl) return json({ error: 'WAHA_API_URL não configurada' }, 503);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (wahaKey) headers['X-Api-Key'] = wahaKey;

      const sendRes = await fetch(`${wahaUrl}/api/sendText`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chatId: `${phoneFormatted}@c.us`,
          text: content,
          session: instance.instance_name,
        }),
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        console.error('[whatsapp-send] WAHA error:', errText);
        return json({ error: `WAHA: ${errText}` }, 500);
      }

      const sendData = await sendRes.json();
      externalId = sendData.id?._serialized || sendData.id || sendData.key?.id;
    }

    // ─── EVOLUTION API ──────────────────────────────────────────────
    if (provider === 'evolution') {
      const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '');
      const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

      if (!evolutionUrl || !evolutionKey) return json({ error: 'Evolution API não configurada' }, 503);

      const sendRes = await fetch(`${evolutionUrl}/message/sendText/${instance.instance_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
        body: JSON.stringify({ number: phoneFormatted, text: content }),
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        console.error('[whatsapp-send] Evolution error:', errText);
        return json({ error: `Evolution API: ${errText}` }, 500);
      }

      const sendData = await sendRes.json();
      externalId = sendData.key?.id;
    }

    // ─── Save to DB ─────────────────────────────────────────────────
    if (conversationId) {
      const { data: message } = await supabase
        .from('wa_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          external_id: externalId,
          direction: 'outbound',
          sender_type: senderType,
          content,
          media_type: mediaType,
          status: 'sent',
        })
        .select()
        .single();

      await supabase.from('wa_conversations').update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', conversationId);

      return json({ data: message });
    }

    return json({ data: { sent: true, externalId } });
  } catch (e) {
    console.error('[whatsapp-send] Error:', e);
    return json({ error: e.message }, 500);
  }
});
