import { useState } from 'react';
import { Brain, Plus, Trash2, Send, Bot, User, Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import EmptyState from '@/components/features/EmptyState';
import { generateId, formatDate } from '@/lib/utils';
import type { AITrainingItem, AIConfig } from '@/types';

const DEFAULT_CONFIG: AIConfig = {
  userId: 'user',
  model: 'gpt-4o-mini',
  personality: 'Sou um assistente simpático e profissional. Ajudo clientes com dúvidas sobre produtos, serviços e agendamentos.',
  greetingMessage: 'Olá! Seja bem-vindo(a)! Como posso ajudar você hoje? 😊',
  fallbackMessage: 'Desculpe, não entendi sua pergunta. Pode reformular? Ou prefere falar com um atendente humano?',
  qualifyLeads: true,
  autoSummary: false,
  language: 'pt-BR',
  updatedAt: new Date().toISOString(),
};

interface Message { id: string; role: 'user' | 'assistant'; content: string; }

export default function AIAssistant() {
  const [items, setItems] = useState<AITrainingItem[]>([]);
  const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
  const [form, setForm] = useState({ question: '', answer: '', category: '' });
  const [testInput, setTestInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: DEFAULT_CONFIG.greetingMessage },
  ]);
  const [isTesting, setIsTesting] = useState(false);

  const handleAddTraining = () => {
    if (!form.question || !form.answer) { toast.error('Pergunta e resposta são obrigatórias'); return; }
    const item: AITrainingItem = {
      id: generateId(),
      userId: 'user',
      question: form.question,
      answer: form.answer,
      category: form.category,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setItems(prev => [item, ...prev]);
    setForm({ question: '', answer: '', category: '' });
    toast.success('Exemplo de treinamento adicionado!');
  };

  const handleDeleteTraining = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;
    const userMsg: Message = { id: generateId(), role: 'user', content: testInput };
    setMessages(prev => [...prev, userMsg]);
    setTestInput('');
    setIsTesting(true);
    await new Promise(r => setTimeout(r, 1200));

    // Find matching training item
    const match = items.find(i => i.active && i.question.toLowerCase().includes(testInput.toLowerCase().slice(0, 10)));
    const response = match
      ? match.answer
      : items.length === 0
        ? 'Nenhum dado de treinamento configurado ainda. Adicione perguntas e respostas na aba Treinamento.'
        : config.fallbackMessage;

    setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: response }]);
    setIsTesting(false);
  };

  const handleSaveConfig = () => {
    setConfig(c => ({ ...c, updatedAt: new Date().toISOString() }));
    toast.success('Configurações salvas!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Assistente IA</h1>
        <p className="text-muted-foreground text-sm mt-1">Treine seu chatbot e configure o comportamento da IA</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Tabs defaultValue="training">
            <TabsList className="mb-4">
              <TabsTrigger value="training"><Brain className="w-4 h-4 mr-2" />Treinamento</TabsTrigger>
              <TabsTrigger value="config"><Settings className="w-4 h-4 mr-2" />Configuração</TabsTrigger>
            </TabsList>

            <TabsContent value="training" className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4">Adicionar exemplo de treinamento</h3>
                <div className="space-y-3">
                  <div><Label>Pergunta do cliente *</Label><Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Ex: Qual é o horário de funcionamento?" className="mt-1" /></div>
                  <div>
                    <Label>Resposta ideal *</Label>
                    <Textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Ex: Funcionamos de segunda a sexta das 9h às 18h, e sábados das 9h às 13h." className="mt-1" />
                  </div>
                  <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Horários, Preços, Produtos" className="mt-1" /></div>
                  <Button onClick={handleAddTraining} className="bg-gradient-brand text-white hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar exemplo
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <p className="font-semibold text-foreground text-sm">Base de conhecimento ({items.length})</p>
                  {items.length > 0 && <Badge className="bg-primary/10 text-primary border-0 text-xs">{items.filter(i => i.active).length} ativos</Badge>}
                </div>
                {items.length === 0 ? (
                  <EmptyState icon={Brain} title="Nenhum dado de treinamento" description="Adicione perguntas e respostas para treinar seu assistente IA." />
                ) : (
                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {items.map(item => (
                      <div key={item.id} className="px-5 py-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-primary truncate">Q: {item.question}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">A: {item.answer}</p>
                          {item.category && <Badge variant="outline" className="text-xs mt-1">{item.category}</Badge>}
                        </div>
                        <button onClick={() => handleDeleteTraining(item.id)} className="p-1 hover:bg-red-500/10 rounded text-red-500 flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div>
                  <Label>Personalidade / Contexto do bot</Label>
                  <Textarea value={config.personality} onChange={e => setConfig(c => ({ ...c, personality: e.target.value }))} className="mt-1" rows={3} />
                </div>
                <div>
                  <Label>Mensagem de boas-vindas</Label>
                  <Textarea value={config.greetingMessage} onChange={e => setConfig(c => ({ ...c, greetingMessage: e.target.value }))} className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Mensagem de fallback (quando não souber responder)</Label>
                  <Textarea value={config.fallbackMessage} onChange={e => setConfig(c => ({ ...c, fallbackMessage: e.target.value }))} className="mt-1" rows={2} />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div><p className="text-sm font-medium text-foreground">Qualificação de leads</p><p className="text-xs text-muted-foreground">Coletar dados do cliente automaticamente</p></div>
                  <Switch checked={config.qualifyLeads} onCheckedChange={v => setConfig(c => ({ ...c, qualifyLeads: v }))} />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div><p className="text-sm font-medium text-foreground">Resumo automático</p><p className="text-xs text-muted-foreground">Gerar resumo de cada conversa</p></div>
                  <Switch checked={config.autoSummary} onCheckedChange={v => setConfig(c => ({ ...c, autoSummary: v }))} />
                </div>
                <Button onClick={handleSaveConfig} className="bg-gradient-brand text-white hover:opacity-90 w-full">Salvar configurações</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Test chat */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-[520px]">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Testar chatbot</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-xs text-muted-foreground">Simulação</p>
                </div>
              </div>
              <Badge className="ml-auto bg-primary/10 text-primary border-0 text-xs">{items.length} exemplos</Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'assistant' ? 'bg-gradient-brand' : 'bg-muted'}`}>
                    {m.role === 'assistant' ? <Bot className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${m.role === 'assistant' ? 'bg-muted text-foreground rounded-tl-sm' : 'bg-primary text-white rounded-tr-sm'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTesting && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center"><Bot className="w-3 h-3 text-white" /></div>
                  <div className="px-3 py-2 bg-muted rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1"><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-100" /><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-200" /></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTest()}
                placeholder="Digite uma mensagem de teste..."
                className="text-xs"
              />
              <Button size="icon" className="bg-gradient-brand text-white hover:opacity-90 h-9 w-9 flex-shrink-0" onClick={handleTest} disabled={isTesting}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Powered by LocalBoost AI
          </p>
        </div>
      </div>
    </div>
  );
}
