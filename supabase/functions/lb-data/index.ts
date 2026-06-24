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
    const { action, userId, ...params } = body;

    if (!userId) return json({ error: 'userId required' }, 400);
    if (!action) return json({ error: 'action required' }, 400);

    console.log(`[lb-data] action=${action} userId=${userId.slice(0, 8)}...`);

    switch (action) {
      case 'get_conversations': {
        const { data, error } = await supabase
          .from('wa_conversations')
          .select('*, wa_contacts:contact_id(id, name, phone, profile_picture_url)')
          .eq('user_id', userId)
          .order('last_message_at', { ascending: false })
          .limit(100);
        return json({ data, error: error?.message });
      }

      case 'get_messages': {
        const { conversationId, limit = 60, offset = 0 } = params;
        const { data, error } = await supabase
          .from('wa_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .range(offset, offset + limit - 1);
        return json({ data, error: error?.message });
      }

      case 'get_contacts': {
        const { search } = params;
        let query = supabase.from('wa_contacts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
        const { data, error } = await query;
        return json({ data, error: error?.message });
      }

      case 'get_training_data': {
        const { data, error } = await supabase
          .from('ai_training_data')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        return json({ data, error: error?.message });
      }

      case 'save_training': {
        const { id, type, title, content, active } = params;
        if (id) {
          const { data, error } = await supabase
            .from('ai_training_data')
            .update({ type, title, content, active, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
          return json({ data, error: error?.message });
        }
        const { data, error } = await supabase
          .from('ai_training_data')
          .insert({ user_id: userId, type: type || 'faq', title, content, active: active !== false })
          .select()
          .single();
        return json({ data, error: error?.message });
      }

      case 'delete_training': {
        const { id } = params;
        const { error } = await supabase
          .from('ai_training_data')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
        return json({ data: { deleted: !error }, error: error?.message });
      }

      case 'toggle_training': {
        const { id, active } = params;
        const { data, error } = await supabase
          .from('ai_training_data')
          .update({ active, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();
        return json({ data, error: error?.message });
      }

      case 'get_ai_settings': {
        const { data, error } = await supabase
          .from('ai_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        return json({ data, error: error?.message });
      }

      case 'save_ai_settings': {
        const { data, error } = await supabase
          .from('ai_settings')
          .upsert({ user_id: userId, ...params, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          .select()
          .single();
        return json({ data, error: error?.message });
      }

      case 'update_conversation': {
        const { conversationId, status, aiActive, assignedAgentId, unreadCount } = params;
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (status !== undefined) updates.status = status;
        if (aiActive !== undefined) updates.ai_active = aiActive;
        if (assignedAgentId !== undefined) updates.assigned_agent_id = assignedAgentId;
        if (unreadCount !== undefined) updates.unread_count = unreadCount;
        const { data, error } = await supabase
          .from('wa_conversations')
          .update(updates)
          .eq('id', conversationId)
          .eq('user_id', userId)
          .select('*, wa_contacts:contact_id(id, name, phone)')
          .single();
        return json({ data, error: error?.message });
      }

      case 'get_whatsapp_instance': {
        const { data, error } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return json({ data, error: error?.message });
      }

      case 'get_dashboard_stats': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [
          { count: totalConversations },
          { count: openConversations },
          { count: todayMessages },
          { count: totalContacts },
          { count: aiMessages },
        ] = await Promise.all([
          supabase.from('wa_conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('wa_conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'open'),
          supabase.from('wa_messages').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', today.toISOString()),
          supabase.from('wa_contacts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('wa_messages').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('sender_type', 'ai'),
        ]);
        return json({ data: { totalConversations: totalConversations || 0, openConversations: openConversations || 0, todayMessages: todayMessages || 0, totalContacts: totalContacts || 0, aiMessages: aiMessages || 0 }, error: null });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    console.error('[lb-data] Error:', e);
    return json({ error: e.message }, 500);
  }
});
