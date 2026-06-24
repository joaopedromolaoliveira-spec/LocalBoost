import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const event = body.event || body.type || '';
    const instanceName = body.instance || body.instanceName || '';

    console.log(`[webhook] event=${event} instance=${instanceName}`);

    if (!instanceName) return new Response('OK', { status: 200 });

    // Find instance in DB
    const { data: instance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instanceName)
      .maybeSingle();

    if (!instance) {
      console.log('[webhook] Instance not found:', instanceName);
      return new Response('OK', { status: 200 });
    }

    const userId = instance.user_id;

    // --- CONNECTION_UPDATE ---
    if (event === 'CONNECTION_UPDATE' || event === 'connection.update') {
      const state = body.data?.state;
      console.log('[webhook] connection state:', state);

      if (state === 'open') {
        const jid = body.data?.profileJid || '';
        await supabase.from('whatsapp_instances').update({
          status: 'connected',
          phone_number: jid.replace('@s.whatsapp.net', ''),
          profile_name: body.data?.profileName || '',
          updated_at: new Date().toISOString(),
        }).eq('id', instance.id);
      } else if (state === 'close' || state === 'connecting') {
        await supabase.from('whatsapp_instances').update({
          status: state === 'close' ? 'disconnected' : 'connecting',
          updated_at: new Date().toISOString(),
        }).eq('id', instance.id);
      }
      return new Response('OK', { status: 200 });
    }

    // --- QRCODE_UPDATED ---
    if (event === 'QRCODE_UPDATED' || event === 'qrcode.updated') {
      const qr = body.data?.qrcode?.base64 || body.data?.base64;
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

    // --- MESSAGES_UPSERT ---
    if (event === 'MESSAGES_UPSERT' || event === 'messages.upsert') {
      const messages = Array.isArray(body.data?.messages) ? body.data.messages : [body.data];

      for (const message of messages) {
        if (!message || !message.key) continue;
        const isFromMe = message.key.fromMe;
        if (isFromMe) continue;

        const remoteJid = message.key.remoteJid || '';
        // Skip group messages
        if (remoteJid.includes('@g.us') || remoteJid.includes('@broadcast')) continue;

        const phone = remoteJid.replace('@s.whatsapp.net', '');
        if (!phone) continue;

        const content = message.message?.conversation
          || message.message?.extendedTextMessage?.text
          || message.message?.imageMessage?.caption
          || message.message?.videoMessage?.caption
          || '[Mídia recebida]';

        const pushName = message.pushName || phone;
        const mediaType = message.message?.imageMessage ? 'image'
          : message.message?.videoMessage ? 'video'
          : message.message?.audioMessage ? 'audio'
          : message.message?.documentMessage ? 'document'
          : 'text';

        console.log(`[webhook] Message from ${phone}: ${content.slice(0, 50)}`);

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
          continue;
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
          if (convoError) { console.error('[webhook] Convo insert error:', convoError); continue; }
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

        if (!conversation) continue;

        // Check for duplicate message
        if (message.key.id) {
          const { data: existing } = await supabase
            .from('wa_messages')
            .select('id')
            .eq('external_id', message.key.id)
            .maybeSingle();
          if (existing) continue;
        }

        // Save message
        await supabase.from('wa_messages').insert({
          conversation_id: conversation.id,
          user_id: userId,
          external_id: message.key.id,
          direction: 'inbound',
          sender_type: 'customer',
          content,
          media_type: mediaType,
          status: 'received',
        });

        // Trigger AI response if AI is active and not already assigned to agent
        if (conversation.ai_active && !conversation.assigned_agent_id) {
          // Fire and forget - don't await
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

      return new Response('OK', { status: 200 });
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    console.error('[webhook] Error:', e);
    return new Response('OK', { status: 200 }); // Always 200 to prevent retries
  }
});
