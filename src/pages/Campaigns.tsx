import { useState } from 'react';
import { Megaphone, Plus, Send, Clock, CheckCircle, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import EmptyState from '@/components/features/EmptyState';
import { generateId, formatDate } from '@/lib/utils';
import type { Campaign } from '@/types';

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground border-0', icon: AlertTriangle },
  scheduled: { label: 'Agendada', color: 'bg-blue-500/10 text-blue-600 border-0', icon: Clock },
  running: { label: 'Em execução', color: 'bg-amber-500/10 text-amber-600 border-0', icon: Send },
  completed: { label: 'Concluída', color: 'bg-emerald-500/10 text-emerald-600 border-0', icon: CheckCircle },
  paused: { label: 'Pausada', color: 'bg-orange-500/10 text-orange-600 border-0', icon: AlertTriangle },
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', message: '', type: 'broadcast' as Campaign['type'] });

  const handleAdd = () => {
    if (!form.name || !form.message) { toast.error('Preencha todos os campos obrigatórios'); return; }
    const c: Campaign = {
      id: generateId(),
      userId: 'user',
      name: form.name,
      message: form.message,
      type: form.type,
      status: 'draft',
      targetCount: 0,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      responseCount: 0,
      createdAt: new Date().toISOString(),
    };
    setCampaigns(prev => [c, ...prev]);
    setForm({ name: '', message: '', type: 'broadcast' });
    setShowAdd(false);
    toast.success('Campanha criada!');
  };

  const handleDelete = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success('Campanha removida');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground text-sm mt-1">{campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-gradient-brand hover:opacity-90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Nova campanha
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['draft','scheduled','running','completed'].map(s => (
          <div key={s} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{campaigns.filter(c => c.status === s).length}</p>
            <p className="text-xs text-muted-foreground mt-1">{STATUS_CONFIG[s as Campaign['status']].label}</p>
          </div>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma campanha ainda"
          description="Crie sua primeira campanha para enviar mensagens em massa para seus contatos no WhatsApp."
          action={{ label: 'Criar campanha', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {campaigns.map(c => {
              const cfg = STATUS_CONFIG[c.status];
              return (
                <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{c.type === 'broadcast' ? 'Transmissão' : c.type === 'sequence' ? 'Sequência' : 'Gatilho'}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{c.targetCount} alvo{c.targetCount !== 1 ? 's' : ''}</span>
                    <span>{c.sentCount} enviados</span>
                  </div>
                  <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-muted rounded-lg">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nome da campanha *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Promoção de Aniversário" className="mt-1" /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as Campaign['type'] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="broadcast">Transmissão em massa</SelectItem>
                  <SelectItem value="sequence">Sequência automática</SelectItem>
                  <SelectItem value="trigger">Por gatilho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mensagem *</Label>
              <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Olá {nome}! Temos uma promoção especial para você..." className="mt-1 min-h-[120px]" />
              <p className="text-xs text-muted-foreground mt-1">Use {'{nome}'} para personalizar com o nome do contato</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button className="flex-1 bg-gradient-brand text-white hover:opacity-90" onClick={handleAdd}>Criar campanha</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
