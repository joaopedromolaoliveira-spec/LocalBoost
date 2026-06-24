import { useState } from 'react';
import { Users, Plus, Search, Filter, Phone, Mail, Tag, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import EmptyState from '@/components/features/EmptyState';
import { generateId, formatDate } from '@/lib/utils';
import type { Contact } from '@/types';

const STATUS_COLORS = {
  lead: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  customer: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  prospect: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  inactive: 'bg-gray-500/10 text-gray-500',
};

const STATUS_LABELS = { lead: 'Lead', customer: 'Cliente', prospect: 'Prospect', inactive: 'Inativo' };

export default function CRM() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', status: 'lead' as Contact['status'], notes: '' });

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.phone) { toast.error('Nome e telefone são obrigatórios'); return; }
    const newContact: Contact = {
      id: generateId(),
      userId: 'user',
      name: form.name,
      phone: form.phone,
      email: form.email,
      company: form.company,
      status: form.status,
      tags: [],
      notes: form.notes,
      createdAt: new Date().toISOString(),
      totalMessages: 0,
    };
    setContacts(prev => [newContact, ...prev]);
    setForm({ name: '', phone: '', email: '', company: '', status: 'lead', notes: '' });
    setShowAdd(false);
    toast.success('Contato adicionado!');
  };

  const handleDelete = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    toast.success('Contato removido');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">CRM / Contatos</h1>
          <p className="text-muted-foreground text-sm mt-1">{contacts.length} contato{contacts.length !== 1 ? 's' : ''} cadastrado{contacts.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-gradient-brand hover:opacity-90 text-white">
          <Plus className="w-4 h-4 mr-2" /> Novo contato
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['lead','customer','prospect','inactive'] as const).map(s => (
          <div key={s} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{contacts.filter(c => c.status === s).length}</p>
            <p className="text-xs text-muted-foreground mt-1">{STATUS_LABELS[s]}s</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone ou email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
          description={search ? 'Tente outros termos de busca.' : 'Adicione seus primeiros clientes e leads para começar a gerenciar seu relacionamento.'}
          action={{ label: 'Adicionar contato', onClick: () => setShowAdd(true) }}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map(contact => (
              <div key={contact.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>
                    {contact.email && <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex"><Mail className="w-3 h-3" />{contact.email}</span>}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {contact.company && <span className="text-xs text-muted-foreground">{contact.company}</span>}
                  <Badge className={`text-xs ${STATUS_COLORS[contact.status]} border-0`}>{STATUS_LABELS[contact.status]}</Badge>
                </div>
                <div className="text-xs text-muted-foreground hidden md:block">{formatDate(contact.createdAt)}</div>
                <button onClick={() => handleDelete(contact.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar contato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className="mt-1" /></div>
              <div><Label>Empresa</Label><Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Nome da empresa" className="mt-1" /></div>
            </div>
            <div><Label>WhatsApp *</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className="mt-1" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Contact['status'] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button className="flex-1 bg-gradient-brand text-white hover:opacity-90" onClick={handleAdd}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
