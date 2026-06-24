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

    const { userId, conversationId, message, contact, fromWebhook = false, testMode = false } = await req.json();
    if (!userId || !message) return json({ error: 'userId e message são obrigatórios' }, 400);

    console.log(`[ai-chat] userId=${userId.slice(0, 8)} convId=${conversationId?.slice(0, 8)} fromWebhook=${fromWebhook}`);

    // Load AI settings
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Load active training data
    const { data: trainingData } = await supabase
      .from('ai_training_data')
      .select('type, title, content')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(80);

    // Load recent conversation history (last 8 messages)
    let history: { role: string; content: string }[] = [];
    if (conversationId) {
      const { data: msgs } = await supabase
        .from('wa_messages')
        .select('direction, sender_type, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(8);
      if (msgs) {
        history = msgs.reverse().map((m: Record<string, string>) => ({
          role: m.direction === 'inbound' ? 'user' : 'assistant',
          content: m.content || '',
        })).filter(m => m.content);
      }
    }

    // Build knowledge base
    const knowledgeBase = (trainingData || [])
      .map((item: Record<string, string>) => `[${item.type?.toUpperCase() || 'INFO'}] ${item.title}:\n${item.content}`)
      .join('\n\n---\n\n');

    const companyName = aiSettings?.company_name || 'nossa empresa';
    const aiName = aiSettings?.ai_name || 'Assistente';
    const personality = aiSettings?.ai_personality || 'Sou um assistente simpático, profissional e prestativo.';
    const greeting = aiSettings?.greeting_message || '';
    const handoffKeywords = aiSettings?.handoff_keywords || ['atendente', 'humano', 'falar com alguém'];

    // Check if customer wants human handoff
    const wantsHandoff = handoffKeywords.some((kw: string) =>
      message.toLowerCase().includes(kw.toLowerCase())
    );

    const systemPrompt = `Você é ${aiName}, assistente virtual de atendimento ao cliente de ${companyName}.

PERSONALIDADE: ${personality}

${knowledgeBase ? `BASE DE CONHECIMENTO DA EMPRESA:\n${knowledgeBase}` : 'Nenhum treinamento configurado ainda. Responda de forma genérica e educada.'}

REGRAS OBRIGATÓRIAS:
1. Responda SEMPRE em português brasileiro (pt-BR)
2. Use apenas informações da base de conhecimento acima - NÃO invente dados
3. Seja conciso: máximo 3 parágrafos curtos
4. Se não souber a resposta, diga "Deixa eu verificar isso para você! Posso te conectar com um atendente?" 
5. Use linguagem calorosa mas profissional
6. Não use formatação markdown (sem **, # etc) - apenas texto simples
7. Evite respostas genéricas - responda especificamente o que foi perguntado
${wantsHandoff ? '8. O cliente quer falar com um atendente humano - direcione-o e encerre educadamente.' : ''}
${greeting ? `9. Se for primeira mensagem, use esta saudação: ${greeting}` : ''}`;

    const aiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const aiBaseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!aiKey || !aiBaseUrl) {
      return json({ error: 'OnSpace AI não configurado', testMode }, 503);
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    const aiRes = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[ai-chat] OnSpace AI error:', errText);
      return json({ error: `OnSpace AI: ${errText}` }, 500);
    }

    const aiData = await aiRes.json();
    const aiResponse = aiData.choices?.[0]?.message?.content?.trim()
      || 'Desculpe, não consegui processar sua mensagem. Pode reformular?';

    // If called from webhook, send the response back via WhatsApp
    if (fromWebhook && !testMode && contact && conversationId) {
      // Save AI message to DB
      await supabase.from('wa_messages').insert({
        conversation_id: conversationId,
        user_id: userId,
        direction: 'outbound',
        sender_type: 'ai',
        content: aiResponse,
        media_type: 'text',
        status: 'sent',
      });

      await supabase.from('wa_conversations').update({
        last_message: aiResponse,
        last_message_at: new Date().toISOString(),
      }).eq('id', conversationId);

      // Send via Evolution API
      const evolutionUrl = Deno.env.get('EVOLUTION_API_URL')?.replace(/\/$/, '');
      const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

      if (evolutionUrl && evolutionKey) {
        const { data: waInstance } = await supabase
          .from('whatsapp_instances')
          .select('instance_name')
          .eq('user_id', userId)
          .eq('status', 'connected')
          .maybeSingle();

        if (waInstance) {
          const delay = (aiSettings?.response_delay_seconds || 2) * 1000;
          await new Promise(r => setTimeout(r, delay));

          let phone = (contact.phone || '').replace(/\D/g, '');
          if (phone.length <= 11) phone = `55${phone}`;

          const sendRes = await fetch(`${evolutionUrl}/message/sendText/${waInstance.instance_name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
            body: JSON.stringify({ number: phone, text: aiResponse }),
          });
          if (!sendRes.ok) console.error('[ai-chat] Send error:', await sendRes.text());
        }
      }

      // If customer wants handoff, update conversation
      if (wantsHandoff) {
        await supabase.from('wa_conversations').update({
          ai_active: false,
          updated_at: new Date().toISOString(),
        }).eq('id', conversationId);
      }
    }

    return json({ response: aiResponse, handoff: wantsHandoff });
  } catch (e) {
    console.error('[ai-chat] Error:', e);
    return json({ error: e.message }, 500);
  }
});
