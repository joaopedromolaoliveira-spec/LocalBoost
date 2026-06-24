import { useState } from 'react';
import { Users, DollarSign, TrendingUp, Shield, Search, CheckCircle, XCircle, Crown, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import StatCard from '@/components/features/StatCard';
import { useAuthStore } from '@/stores/authStore';
import { getInitials, formatDate, formatDateTime } from '@/lib/utils';
import { PLAN_NAMES, ROLE_LABELS, STATUS_LABELS, MASTER_ADMIN_EMAIL } from '@/constants/plans';
import type { User } from '@/types';

export default function AdminPanel() {
  const { user: currentUser, getAllUsers, updateUserByAdmin, deleteUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'users' | 'revenue' | 'settings'>('users');

  if (currentUser?.role !== 'master_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-semibold">Acesso restrito</p>
          <p className="text-muted-foreground text-sm">Apenas o administrador master pode acessar este painel.</p>
        </div>
      </div>
    );
  }

  const allUsers = getAllUsers();
  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: allUsers.length,
    trial: allUsers.filter(u => u.subscriptionStatus === 'trial').length,
    active: allUsers.filter(u => u.subscriptionStatus === 'active').length,
    premium: allUsers.filter(u => u.plan !== 'free').length,
  };

  const handleGrantPremium = (u: User) => {
    updateUserByAdmin(u.id, {
      plan: 'pro',
      subscriptionStatus: 'active',
      premiumGrantedBy: currentUser?.email,
      premiumGrantedAt: new Date().toISOString(),
    });
    toast.success(`Acesso Premium concedido para ${u.name}`);
  };

  const handleRevokePremium = (u: User) => {
    updateUserByAdmin(u.id, { plan: 'free', subscriptionStatus: 'expired' });
    toast.success(`Acesso Premium removido de ${u.name}`);
  };

  const handleSuspend = (u: User) => {
    updateUserByAdmin(u.id, { suspended: !u.suspended });
    toast.success(u.suspended ? `${u.name} reativado` : `${u.name} suspenso`);
  };

  const handleDelete = (u: User) => {
    if (u.email === MASTER_ADMIN_EMAIL) { toast.error('Não é possível excluir o Admin Master'); return; }
    deleteUser(u.id);
    toast.success(`Usuário ${u.name} removido`);
  };

  const tabs = [
    { key: 'users', label: 'Usuários' },
    { key: 'revenue', label: 'Receita' },
    { key: 'settings', label: 'Configurações' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Painel Admin Master</h1>
          <p className="text-muted-foreground text-sm">{MASTER_ADMIN_EMAIL}</p>
        </div>
        <Badge className="ml-auto bg-purple-500 text-white border-0">Admin Master</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de usuários" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Em teste grátis" value={stats.trial} icon={TrendingUp} color="orange" />
        <StatCard title="Assinaturas ativas" value={stats.active} icon={CheckCircle} color="green" />
        <StatCard title="Receita total" value={0} icon={DollarSign} color="purple" prefix="R$" description="Dados reais de pagamentos" />
      </div>

      {/* Revenue details */}
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Hoje', value: 'R$0' },
          { label: 'Esta semana', value: 'R$0' },
          { label: 'Este mês', value: 'R$0' },
          { label: 'MRR', value: 'R$0' },
          { label: 'ARR', value: 'R$0' },
          { label: 'Churn', value: '0%' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar usuário por nome ou email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Usuários ({filteredUsers.length})</p>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-x-auto">
                {filteredUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-6 py-4 min-w-[700px]">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-brand text-white text-xs font-bold">{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                        {u.role === 'master_admin' && <Crown className="w-3 h-3 text-amber-500" />}
                        {u.suspended && <Ban className="w-3 h-3 text-red-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">{PLAN_NAMES[u.plan] || u.plan}</Badge>
                    <Badge className={`text-xs flex-shrink-0 border-0 ${u.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-600' : u.subscriptionStatus === 'trial' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>
                      {STATUS_LABELS[u.subscriptionStatus] || u.subscriptionStatus}
                    </Badge>
                    <p className="text-xs text-muted-foreground flex-shrink-0 hidden lg:block">{formatDate(u.createdAt)}</p>
                    {u.email !== MASTER_ADMIN_EMAIL && (
                      <div className="flex gap-1 flex-shrink-0">
                        {u.plan === 'free' ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleGrantPremium(u)}>
                            <Crown className="w-3 h-3 mr-1" /> Premium
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRevokePremium(u)}>Revogar</Button>
                        )}
                        <Button size="sm" variant="outline" className={`h-7 text-xs ${u.suspended ? 'text-emerald-600' : 'text-orange-500'}`} onClick={() => handleSuspend(u)}>
                          {u.suspended ? 'Ativar' : 'Suspender'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => handleDelete(u)}>
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'revenue' && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">Sem receita registrada</p>
          <p className="text-sm text-muted-foreground">A receita será calculada automaticamente a partir de pagamentos reais via Stripe.</p>
          <p className="text-xs text-muted-foreground mt-2">MRR, ARR, LTV e Churn Rate aparecerão aqui com dados reais.</p>
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {['Modo de manutenção', 'Novos cadastros', 'Trials automáticos', 'Webhooks globais', 'Logs de auditoria', 'Backups automáticos'].map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
              <p className="text-sm font-medium text-foreground">{s}</p>
              <Button variant="outline" size="sm" onClick={() => toast.info('Configure via painel do servidor.')}>Configurar</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
