import { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, Send, Bot, User, Sparkles, Settings, Upload, Loader2, ToggleLeft, ToggleRight, FileText, HelpCircle, Package, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import EmptyState from '@/components/features/EmptyState';
import { callLbData, invokeFunction } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import type { AiTrainingData, AiSettings } from '@/types';

const TYPE_LABELS: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  faq: { label: 'FAQ', icon: HelpCircle, color: 'text-blue-500' },
  product: { label: 'Produto', icon: Package, color: 'text-emerald-500' },
  service: { label: 'Serviço', icon: Sparkles, color: 'text-purple-500' },
  policy: { label: 'Política', icon: FileText, color: 'text-orange-500' },
  script: { label: 'Script', icon: BookOpen, color: 'text-pink-500' },
  info: { label: 'Info', icon: Brain, color: 'text-primary' },
  document: { label: 'Documento', icon: FileText, color: 'text-gray-500' },
};

const DEFAULT_SETTINGS: Partial<AiSettings> = {
  company_name: '',
  company_description: '',
  ai_name: 'Assistente',
  ai_personality: 'Sou um assistente simpático, profissional e prestativo. Estou aqui para ajudar nossos clientes com informações sobre nossos produtos e serviços.',
  greeting_message: 'Olá! Seja bem-vindo(a)! 😊 Como posso te ajudar hoje?',
  auto_respond: true,
  response_delay_seconds: 2,
};

interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; loading?: boolean }

export default function AIAssistant() {
  const { user } = useAuthStore();
  const userId = user?.id || '';

  const [trainingData, setTrainingData] = useState<AiTrainingData[]>([]);
  const [aiSettings, setAiSettings] = useState<Partial<AiSettings>>(DEFAULT_SETTINGS);
  const [form, setForm] = useState({ type: 'faq', title: '', content: '' });
  const [loadingData, setLoadingData] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // Chat test state
  const [testMessages, setTestMessages] = useState<ChatMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, [userId]);

  const loadAll = async () => {
    setLoadingData(true);
    const [{ data: training }, { data: settings }] = await Promise.all([
      callLbData<AiTrainingData[]>('get_training_data', userId),
      callLbData<AiSettings>('get_ai_settings', userId),
    ]);
    if (training) setTrainingData(training);
    if (settings) setAiSettings({ ...DEFAULT_SETTINGS, ...settings });
    setLoadingData(false);
  };

  const handleAddTraining = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Título e conteúdo são obrigatórios');
      return;
    }
    setAddingItem(true);
    const { data, error } = await callLbData<AiTrainingData>('save_training', userId, {
      type: form.type,
      title: form.title.trim(),
      content: form.content.trim(),
      active: true,
    });
    setAddingItem(false);
    if (error) { toast.error(error); return; }
    if (data) setTrainingData(prev => [data, ...prev]);
    setForm({ type: 'faq', title: '', content: '' });
    toast.success('Treinamento adicionado!');
  };

  const handleDeleteTraining = async (id: string) => {
    const { error } = await callLbData('delete_training', userId, { id });
    if (error) { toast.error(error); return; }
    setTrainingData(prev => prev.filter(i => i.id !== id));
    toast.success('Item removido');
  };

  const handleToggleTraining = async (id: string, active: boolean) => {
    const { data, error } = await callLbData<AiTrainingData>('toggle_training', userId, { id, active });
    if (error) { toast.error(error); return; }
    if (data) setTrainingData(prev => prev.map(i => i.id === id ? data : i));
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const { error } = await callLbData('save_ai_settings', userId, {
      company_name: aiSettings.company_name,
      company_description: aiSettings.company_description,
      ai_name: aiSettings.ai_name,
      ai_personality: aiSettings.ai_personality,
      greeting_message: aiSettings.greeting_message,
      auto_respond: aiSettings.auto_respond,
      response_delay_seconds: aiSettings.response_delay_seconds,
    });
    setSavingSettings(false);
    if (error) { toast.error(error); return; }
    toast.success('Configurações salvas!');
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;
    const userMsg = testInput.trim();
    setTestInput('');
    const userMsgObj: ChatMessage = { id: `u${Date.now()}`, role: 'user', content: userMsg };
    const loadingMsg: ChatMessage = { id: `l${Date.now()}`, role: 'assistant', content: '...', loading: true };
    setTestMessages(prev => [...prev, userMsgObj, loadingMsg]);
    setTestLoading(true);

    const { data, error } = await invokeFunction<{ response: string }>('ai-chat', {
      userId,
      message: userMsg,
      testMode: true,
      fromWebhook: false,
    });

    setTestLoading(false);
    const response = error ? `Erro: ${error}` : (data?.response || 'Sem resposta');
    setTestMessages(prev => prev.map(m => m.loading ? { ...m, content: response, loading: false } : m));
  };

  const activeCount = trainingData.filter(i => i.active).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Assistente IA</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Treine seu chatbot com dados reais. {trainingData.length > 0 && `${activeCount} itens ativos na base de conhecimento.`}
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Training & Settings */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="training">
            <TabsList className="mb-4">
              <TabsTrigger value="training">
                <Brain className="w-4 h-4 mr-2" />Treinamento
                {trainingData.length > 0 && <Badge className="ml-2 bg-primary/10 text-primary border-0 text-xs">{trainingData.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Configuração</TabsTrigger>
            </TabsList>

            {/* Training tab */}
            <TabsContent value="training" className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4">Adicionar à base de conhecimento</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Título *</Label>
                    <Input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder={form.type === 'faq' ? 'Ex: Horário de funcionamento' : 'Ex: Produto Premium'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Conteúdo *</Label>
                    <Textarea
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      placeholder={form.type === 'faq'
                        ? 'Ex: Funcionamos de segunda a sexta das 9h às 18h, sábados das 9h às 13h.'
                        : 'Descreva detalhadamente para a IA usar nas respostas...'
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleAddTraining}
                    disabled={addingItem}
                    className="bg-gradient-brand text-white hover:opacity-90"
                  >
                    {addingItem ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Adicionar à base
                  </Button>
                </div>
              </div>

              {/* Training list */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <p className="font-semibold text-foreground text-sm">Base de conhecimento ({trainingData.length})</p>
                  {activeCount > 0 && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">{activeCount} ativos</Badge>
                  )}
                </div>
                {loadingData ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : trainingData.length === 0 ? (
                  <EmptyState icon={Brain} title="Base de conhecimento vazia" description="Adicione informações sobre sua empresa para a IA responder corretamente." />
                ) : (
                  <div className="divide-y divide-border max-h-96 overflow-y-auto">
                    {trainingData.map(item => {
                      const TypeInfo = TYPE_LABELS[item.type] || TYPE_LABELS.info;
                      return (
                        <div key={item.id} className={cn('px-5 py-3 flex items-start gap-3', !item.active && 'opacity-50')}>
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-muted')}>
                            <TypeInfo.icon className={cn('w-3.5 h-3.5', TypeInfo.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                              <Badge variant="outline" className="text-xs flex-shrink-0">{TypeInfo.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.content}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleToggleTraining(item.id, !item.active)}
                              className="p-1 hover:bg-muted rounded text-muted-foreground"
                              title={item.active ? 'Desativar' : 'Ativar'}
                            >
                              {item.active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDeleteTraining(item.id)} className="p-1 hover:bg-red-500/10 rounded text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings tab */}
            <TabsContent value="settings" className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nome da empresa *</Label>
                    <Input value={aiSettings.company_name || ''} onChange={e => setAiSettings(s => ({ ...s, company_name: e.target.value }))} placeholder="Ex: Salão da Maria" className="mt-1" />
                  </div>
                  <div>
                    <Label>Nome do assistente</Label>
                    <Input value={aiSettings.ai_name || ''} onChange={e => setAiSettings(s => ({ ...s, ai_name: e.target.value }))} placeholder="Ex: Mari" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Descrição da empresa</Label>
                  <Textarea value={aiSettings.company_description || ''} onChange={e => setAiSettings(s => ({ ...s, company_description: e.target.value }))} placeholder="O que sua empresa faz, para quem atende, diferenciais..." className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Personalidade e comportamento</Label>
                  <Textarea value={aiSettings.ai_personality || ''} onChange={e => setAiSettings(s => ({ ...s, ai_personality: e.target.value }))} className="mt-1" rows={2} />
                </div>
                <div>
                  <Label>Mensagem de boas-vindas</Label>
                  <Textarea value={aiSettings.greeting_message || ''} onChange={e => setAiSettings(s => ({ ...s, greeting_message: e.target.value }))} className="mt-1" rows={2} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-foreground">Resposta automática</p>
                      <p className="text-xs text-muted-foreground">IA responde os clientes</p>
                    </div>
                    <Switch checked={aiSettings.auto_respond ?? true} onCheckedChange={v => setAiSettings(s => ({ ...s, auto_respond: v }))} />
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-sm font-medium text-foreground mb-1">Delay (segundos)</p>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={aiSettings.response_delay_seconds || 2}
                      onChange={e => setAiSettings(s => ({ ...s, response_delay_seconds: Number(e.target.value) }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-gradient-brand text-white hover:opacity-90 w-full">
                  {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Salvar configurações
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Test chat */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-[520px]">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Testar IA (Real)</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-xs text-muted-foreground">Resposta via OnSpace AI</p>
                </div>
              </div>
              <Badge className="ml-auto bg-primary/10 text-primary border-0 text-xs">{activeCount} itens</Badge>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {testMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                  <Sparkles className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Teste como a IA responderá seus clientes usando a base de conhecimento configurada</p>
                </div>
              )}
              {testMessages.map(m => (
                <div key={m.id} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', m.role === 'assistant' ? 'bg-gradient-brand' : 'bg-muted')}>
                    {m.role === 'assistant' ? <Bot className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className={cn('max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed', m.role === 'assistant' ? 'bg-muted text-foreground rounded-tl-sm' : 'bg-primary text-white rounded-tr-sm')}>
                    {m.loading ? (
                      <div className="flex gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : m.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTest()}
                placeholder="Digite uma mensagem de teste..."
                className="text-xs"
                disabled={testLoading}
              />
              <Button
                size="icon"
                className="bg-gradient-brand text-white hover:opacity-90 h-9 w-9 flex-shrink-0"
                onClick={handleTest}
                disabled={testLoading || !testInput.trim()}
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Powered by OnSpace AI (Gemini Flash)
          </p>
        </div>
      </div>
    </div>
  );
}
