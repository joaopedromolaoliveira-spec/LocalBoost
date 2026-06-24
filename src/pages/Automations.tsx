import { useState } from 'react';
import { Zap, Plus, Play, Pause, Trash2, MessageSquare, Clock, Tag, UserCheck, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import EmptyState from '@/components/features/EmptyState';
import { generateId, formatDate } from '@/lib/utils';
import type { Automation } from '@/types';

const TEMPLATES = [
  { icon: MessageSquare, title: 'Boas-vindas', desc: 'Mensagem automática para novos contatos', trigger: 'Novo contato' },
  { icon: UserCheck, title: 'Qualificação de Lead', desc: 'Perguntas para qualificar leads automaticamente', trigger: 'Palavra-chave' },
  { icon: Clock, title: 'Lembrete de Consulta', desc: 'Lembrete 24h antes da consulta agendada', trigger: 'Agendamento' },
  { icon: ShoppingCart, title: 'Carrinho Abandonado', desc: 'Recupere vendas com mensagem automática', trigger: 'Inatividade' },
  { icon: Tag, title: 'Promoção Segmentada', desc: 'Envie ofertas baseadas no perfil do cliente', trigger: 'Tag' },
];

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: '', description: '' });

  const handleAdd = () => {
    if (!form.name || !form.trigger) { toast.error('Preencha nome e gatilho'); return; }
    const a: Automation = {
      id: generateId(),
      userId: 'user',
      name: form.name,
      description: form.description,
      trigger: form.trigger,
      status: 'inactive',
      totalRuns: 0,
      successRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAutomations(prev => [a, ...prev]);
    setForm({ name: '', trigger: '', description: '' });
    setShowAdd(false);
    toast.success('Automação criada!');
  };

  const toggleStatus = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a));
  };

  const handleDelete = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
    toast.success('Automação removida');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Automações</h1>
          <p className="text-muted-foreground text-sm mt-1">{automations.filter(a => a.status === 'active').length} ativa{automations.filter(a => a.status === 'active').length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-gradient-brand hover:opacity-90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nova automação
        </Button>
      </div>

      {/* Templates */}
      <div>
        <p className="text-sm font-medium text-foreground mb-3">Templates prontos</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => {
                setForm({ name: t.title, trigger: t.trigger, description: t.desc });
                setShowAdd(true);
              }}
              className="flex flex-col items-start gap-2 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <t.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">{t.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              <Badge variant="outline" className="text-xs">{t.trigger}</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {automations.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Nenhuma automação criada"
          description="Crie seu primeiro fluxo automatizado usando um template acima ou do zero."
          action={{ label: 'Criar automação', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-3 border-b border-border bg-muted/30">
            <p className="text-sm font-semibold text-foreground">Suas automações</p>
          </div>
          <div className="divide-y divide-border">
            {automations.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs">{a.trigger}</Badge>
                    <span className="text-xs text-muted-foreground">Criada em {formatDate(a.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground hidden sm:block">{a.totalRuns} execuções</span>
                  <Switch checked={a.status === 'active'} onCheckedChange={() => toggleStatus(a.id)} />
                  <Badge className={a.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-0 text-xs' : 'bg-muted text-muted-foreground border-0 text-xs'}>
                    {a.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Automação</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nome da automação *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Boas-vindas" className="mt-1" /></div>
            <div>
              <Label>Gatilho *</Label>
              <Select value={form.trigger} onValueChange={v => setForm(f => ({ ...f, trigger: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o gatilho" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Novo contato">Novo contato</SelectItem>
                  <SelectItem value="Palavra-chave">Palavra-chave específica</SelectItem>
                  <SelectItem value="Agendamento">Agendamento</SelectItem>
                  <SelectItem value="Inatividade">Inatividade do cliente</SelectItem>
                  <SelectItem value="Tag">Tag aplicada</SelectItem>
                  <SelectItem value="Primeiro contato">Primeiro contato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o objetivo desta automação" className="mt-1" /></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button className="flex-1 bg-gradient-brand text-white hover:opacity-90" onClick={handleAdd}>Criar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
