import { useState } from 'react';
import { UserCheck, Plus, Mail, Shield, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import EmptyState from '@/components/features/EmptyState';
import { generateId, getInitials, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { TeamMember } from '@/types';

const ROLE_LABELS = { admin: 'Administrador', manager: 'Gerente', agent: 'Agente' };
const ROLE_COLORS = {
  admin: 'bg-purple-500/10 text-purple-600 border-0',
  manager: 'bg-blue-500/10 text-blue-600 border-0',
  agent: 'bg-emerald-500/10 text-emerald-600 border-0',
};

export default function Team() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'agent' as TeamMember['role'] });

  const handleInvite = () => {
    if (!form.name || !form.email) { toast.error('Nome e email são obrigatórios'); return; }
    const member: TeamMember = {
      id: generateId(),
      userId: 'user',
      name: form.name,
      email: form.email,
      role: form.role,
      status: 'pending',
      assignedContacts: 0,
      messagesHandled: 0,
      invitedAt: new Date().toISOString(),
    };
    setMembers(prev => [member, ...prev]);
    setForm({ name: '', email: '', role: 'agent' });
    setShowInvite(false);
    toast.success(`Convite enviado para ${form.email}`);
  };

  const handleRemove = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    toast.success('Membro removido da equipe');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground text-sm mt-1">{members.length + 1} membro{members.length + 1 !== 1 ? 's' : ''} (incluindo você)</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="bg-gradient-brand hover:opacity-90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Convidar membro
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total de membros', value: members.length + 1 },
          { label: 'Convites pendentes', value: members.filter(m => m.status === 'pending').length },
          { label: 'Agentes ativos', value: members.filter(m => m.status === 'active').length + 1 },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-semibold text-foreground">Membros da equipe</p>
        </div>
        <div className="divide-y divide-border">
          {/* Owner (current user) */}
          {user && (
            <div className="flex items-center gap-4 px-6 py-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-brand text-white font-bold text-sm">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs">Você</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              </div>
              <Badge className="bg-purple-500/10 text-purple-600 border-0 text-xs">Proprietário</Badge>
              <span className="text-xs text-muted-foreground hidden sm:block">Ativo</span>
            </div>
          )}
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-muted-foreground font-bold text-sm">{getInitials(m.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</p>
              </div>
              <Badge className={`text-xs ${ROLE_COLORS[m.role]}`}>{ROLE_LABELS[m.role]}</Badge>
              <Badge variant="outline" className="text-xs">
                {m.status === 'pending' ? 'Pendente' : 'Ativo'}
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(m.invitedAt)}</span>
              <button onClick={() => handleRemove(m.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {members.length === 0 && (
          <EmptyState
            icon={UserCheck}
            title="Nenhum membro convidado"
            description="Convide agentes para atender clientes e gerenciar conversas junto com você."
            action={{ label: 'Convidar membro', onClick: () => setShowInvite(true) }}
          />
        )}
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Convidar membro da equipe</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nome completo *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do colaborador" className="mt-1" /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@colaborador.com" className="mt-1" /></div>
            <div>
              <Label>Função</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as TeamMember['role'] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador – Acesso total</SelectItem>
                  <SelectItem value="manager">Gerente – Gerencia agentes</SelectItem>
                  <SelectItem value="agent">Agente – Atende clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowInvite(false)}>Cancelar</Button>
              <Button className="flex-1 bg-gradient-brand text-white hover:opacity-90" onClick={handleInvite}>Enviar convite</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
