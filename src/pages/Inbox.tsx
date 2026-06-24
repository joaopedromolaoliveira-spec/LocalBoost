import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User2, Search, MoreVertical, X, MessageSquare, WifiOff, Loader2, ChevronDown, Inbox as InboxIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn, getInitials, formatDate } from '@/lib/utils';
import { callLbData, invokeFunction } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import type { WaConversation, WaMessage } from '@/types';

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function MsgBubble({ msg }: { msg: WaMessage }) {
  const isInbound = msg.direction === 'inbound';
  const isAI = msg.sender_type === 'ai';

  return (
    <div className={cn('flex gap-2 items-end', isInbound ? 'justify-start' : 'justify-end')}>
      {isInbound && (
        <Avatar className="h-6 w-6 flex-shrink-0 mb-0.5">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">C</AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-[72%] px-3 py-2 rounded-2xl text-sm leading-relaxed', {
        'bg-muted text-foreground rounded-bl-sm': isInbound,
        'bg-primary text-white rounded-br-sm': !isInbound && !isAI,
        'bg-purple-600 text-white rounded-br-sm': !isInbound && isAI,
      })}>
        {!isInbound && isAI && (
          <div className="flex items-center gap-1 mb-1 opacity-80">
            <Bot className="w-3 h-3" />
            <span className="text-xs font-medium">IA</span>
          </div>
        )}
        <p>{msg.content || '[Mídia]'}</p>
        <p className={cn('text-xs mt-1 opacity-70', isInbound ? 'text-muted-foreground' : 'text-white/70')}>
          {formatTime(msg.created_at)}
        </p>
      </div>
      {!isInbound && (
        <Avatar className="h-6 w-6 flex-shrink-0 mb-0.5">
          <AvatarFallback className={cn('text-xs text-white', isAI ? 'bg-purple-600' : 'bg-primary')}>
            {isAI ? <Bot className="w-3 h-3" /> : <User2 className="w-3 h-3" />}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export default function Inbox() {
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const [conversations, setConversations] = useState<WaConversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<WaConversation | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    const { data } = await callLbData<WaConversation[]>('get_conversations', userId);
    if (data) {
      setConversations(data);
      // Update selected conversation if it exists
      if (selectedConvo) {
        const updated = data.find(c => c.id === selectedConvo.id);
        if (updated) setSelectedConvo(updated);
      }
    }
    setLoadingConvos(false);
  }, [userId, selectedConvo?.id]);

  const loadMessages = useCallback(async (conversationId: string) => {
    const { data } = await callLbData<WaMessage[]>('get_messages', userId, { conversationId });
    if (data) {
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    }
    setLoadingMsgs(false);
  }, [userId]);

  // Initial load + polling conversations
  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Poll messages when a conversation is selected
  useEffect(() => {
    if (!selectedConvo) return;
    setLoadingMsgs(true);
    loadMessages(selectedConvo.id);
    const interval = setInterval(() => loadMessages(selectedConvo.id), 3000);
    return () => clearInterval(interval);
  }, [selectedConvo?.id]);

  const handleSelectConvo = async (convo: WaConversation) => {
    setSelectedConvo(convo);
    inputRef.current?.focus();
    // Mark as read
    if (convo.unread_count > 0) {
      await callLbData('update_conversation', userId, { conversationId: convo.id, unreadCount: 0 });
      setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, unread_count: 0 } : c));
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !selectedConvo || sending) return;
    const content = inputText.trim();
    const contact = selectedConvo.wa_contacts;
    if (!contact?.phone) { toast.error('Número do contato não encontrado'); return; }

    setSending(true);
    setInputText('');

    // Optimistic update
    const tempMsg: WaMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: selectedConvo.id,
      user_id: userId,
      direction: 'outbound',
      sender_type: 'agent',
      content,
      media_type: 'text',
      status: 'sending',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    const { error } = await invokeFunction('whatsapp-send', {
      userId,
      conversationId: selectedConvo.id,
      phone: contact.phone,
      content,
      senderType: 'agent',
    });

    setSending(false);
    if (error) {
      toast.error(error);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  const handleToggleAI = async (convo: WaConversation) => {
    const newAiActive = !convo.ai_active;
    const { data } = await callLbData<WaConversation>('update_conversation', userId, {
      conversationId: convo.id,
      aiActive: newAiActive,
    });
    if (data) {
      setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, ai_active: newAiActive } : c));
      if (selectedConvo?.id === convo.id) setSelectedConvo(prev => prev ? { ...prev, ai_active: newAiActive } : null);
      toast.success(newAiActive ? 'IA ativada para esta conversa' : 'IA pausada — você assumiu o atendimento');
    }
  };

  const handleCloseConvo = async (convoId: string) => {
    await callLbData('update_conversation', userId, { conversationId: convoId, status: 'closed' });
    setConversations(prev => prev.map(c => c.id === convoId ? { ...c, status: 'closed' } : c));
    if (selectedConvo?.id === convoId) setSelectedConvo(null);
    toast.success('Atendimento encerrado');
  };

  const filteredConvos = conversations.filter(c => {
    const name = c.wa_contacts?.name || c.wa_contacts?.phone || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const isConnected = user?.whatsappConnected;

  if (!isConnected && !loadingConvos && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <WifiOff className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-heading font-bold text-foreground mb-2">WhatsApp não conectado</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">Conecte seu WhatsApp para começar a receber e enviar mensagens em tempo real.</p>
        <Link to={ROUTES.WHATSAPP}>
          <Button className="bg-gradient-brand hover:opacity-90 text-white">Conectar WhatsApp</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
      {/* Left panel: conversation list */}
      <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
              <InboxIcon className="w-5 h-5 text-primary" /> Caixa de Entrada
            </h2>
            <Badge className="bg-primary/10 text-primary border-0 text-xs">
              {conversations.filter(c => c.status === 'open').length} abertas
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conversa..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
              <p className="text-xs text-muted-foreground mt-1">As mensagens aparecerão aqui em tempo real</p>
            </div>
          ) : (
            filteredConvos.map(convo => {
              const contact = convo.wa_contacts;
              const name = contact?.name || contact?.phone || 'Desconhecido';
              const isSelected = selectedConvo?.id === convo.id;

              return (
                <button
                  key={convo.id}
                  onClick={() => handleSelectConvo(convo)}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/40 transition-colors text-left',
                    isSelected && 'bg-primary/5 border-l-2 border-l-primary'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-brand text-white text-sm font-bold">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    {convo.ai_active && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center border-2 border-card">
                        <Bot className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-foreground truncate">{name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {convo.last_message_at ? formatTime(convo.last_message_at) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {convo.last_message || 'Sem mensagens'}
                      </p>
                      <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                        {convo.status === 'closed' && (
                          <Badge className="bg-muted text-muted-foreground border-0 text-xs">fechada</Badge>
                        )}
                        {convo.unread_count > 0 && (
                          <span className="w-5 h-5 bg-primary rounded-full text-white text-xs flex items-center justify-center font-bold">
                            {convo.unread_count > 9 ? '9+' : convo.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: chat thread */}
      {!selectedConvo ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Selecione uma conversa</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em uma conversa à esquerda para começar</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-gradient-brand text-white text-sm font-bold">
                {getInitials(selectedConvo.wa_contacts?.name || selectedConvo.wa_contacts?.phone || '?')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">
                {selectedConvo.wa_contacts?.name || selectedConvo.wa_contacts?.phone || 'Desconhecido'}
              </p>
              <p className="text-xs text-muted-foreground">{selectedConvo.wa_contacts?.phone}</p>
            </div>

            {/* AI Toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted">
                <Bot className={cn('w-4 h-4', selectedConvo.ai_active ? 'text-purple-600' : 'text-muted-foreground')} />
                <span className="text-xs font-medium text-foreground hidden sm:block">IA</span>
                <Switch
                  checked={selectedConvo.ai_active}
                  onCheckedChange={() => handleToggleAI(selectedConvo)}
                  className="scale-75"
                />
              </div>
              {selectedConvo.status === 'open' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => handleCloseConvo(selectedConvo.id)}
                >
                  <X className="w-3 h-3 mr-1" /> Encerrar
                </Button>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMsgs && messages.length === 0 ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Envie a primeira mensagem abaixo</p>
              </div>
            ) : (
              messages.map(msg => <MsgBubble key={msg.id} msg={msg} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* AI badge when active */}
          {selectedConvo.ai_active && (
            <div className="px-4 py-2 border-t border-border bg-purple-50 dark:bg-purple-950/20 flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-purple-700 dark:text-purple-400">
                IA respondendo automaticamente. Desative para assumir o atendimento.
              </p>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-border">
            {selectedConvo.status === 'closed' ? (
              <div className="flex items-center justify-center py-2">
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Atendimento encerrado
                </Badge>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 text-sm"
                  disabled={sending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim() || sending}
                  className="bg-gradient-brand hover:opacity-90 text-white h-10 w-10 p-0 flex-shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
