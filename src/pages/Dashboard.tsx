import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, Zap, Bot, TrendingUp, ArrowRight, CheckCircle, Circle, Wifi, Brain, Megaphone, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/features/StatCard';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';
import { callLbData } from '@/lib/api';

interface DashboardStats {
  totalConversations: number;
  openConversations: number;
  todayMessages: number;
  totalContacts: number;
  aiMessages: number;
}

const quickActions = [
  { icon: Wifi, label: 'Conectar WhatsApp', href: ROUTES.WHATSAPP, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Inbox, label: 'Caixa de Entrada', href: '/dashboard/inbox', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Megaphone, label: 'Nova Campanha', href: ROUTES.CAMPAIGNS, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { icon: Brain, label: 'Treinar IA', href: ROUTES.AI, color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    if (!user?.id) return;
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    const { data } = await callLbData<DashboardStats>('get_dashboard_stats', user.id);
    if (data) setStats(data);
    setLoadingStats(false);
  };

  const checklist = [
    { label: 'Conta criada', done: true, href: ROUTES.SETTINGS },
    { label: 'WhatsApp conectado', done: user?.whatsappConnected || false, href: ROUTES.WHATSAPP },
    { label: 'Base de conhecimento IA', done: (stats?.aiMessages ?? 0) > 0, href: ROUTES.AI },
    { label: 'Primeiro atendimento', done: (stats?.totalConversations ?? 0) > 0, href: '/dashboard/inbox' },
    { label: 'Automação configurada', done: false, href: ROUTES.AUTOMATIONS },
    { label: 'Plano assinado', done: user?.subscriptionStatus === 'active', href: ROUTES.BILLING },
  ];

  const completed = checklist.filter(c => c.done).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {greeting}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {formatDateTime(now)} · LocalBoost
          </p>
        </div>
        {user?.subscriptionStatus === 'trial' && (
          <Link to={ROUTES.BILLING}>
            <Button className="bg-gradient-brand hover:opacity-90 text-white text-sm">
              Assinar plano <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>

      {/* Real-time stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Métricas em tempo real</p>
          {loadingStats ? (
            <Badge variant="outline" className="text-xs animate-pulse">Carregando...</Badge>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">● Ao vivo</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Conversas abertas"
            value={loadingStats ? '—' : (stats?.openConversations ?? 0)}
            icon={MessageSquare}
            color="green"
            description={stats?.totalConversations ? `${stats.totalConversations} total` : 'Conecte o WhatsApp para começar'}
          />
          <StatCard
            title="Contatos"
            value={loadingStats ? '—' : (stats?.totalContacts ?? 0)}
            icon={Users}
            color="blue"
            description="Clientes que já enviaram mensagens"
          />
          <StatCard
            title="Mensagens hoje"
            value={loadingStats ? '—' : (stats?.todayMessages ?? 0)}
            icon={TrendingUp}
            color="purple"
            description="Enviadas e recebidas hoje"
          />
          <StatCard
            title="Respostas da IA"
            value={loadingStats ? '—' : (stats?.aiMessages ?? 0)}
            icon={Bot}
            color="orange"
            description="Total de respostas automáticas"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Getting Started checklist */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading font-semibold text-foreground">Primeiros passos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{completed}/{checklist.length} concluídos</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-0">{Math.round((completed / checklist.length) * 100)}%</Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mb-5">
            <div className="bg-gradient-brand h-1.5 rounded-full transition-all duration-500" style={{ width: `${(completed / checklist.length) * 100}%` }} />
          </div>
          <div className="space-y-2">
            {checklist.map((item, i) => (
              <Link key={i} to={item.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group">
                {item.done ? (
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className={`text-sm flex-1 ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {item.label}
                </span>
                {!item.done && <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading font-semibold text-foreground mb-5">Ações rápidas</h2>
          <div className="space-y-3">
            {quickActions.map((a, i) => (
              <Link
                key={i}
                to={a.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.bg}`}>
                  <a.icon className={`w-4 h-4 ${a.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">{a.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          <div className="mt-5 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-xs font-semibold text-primary mb-1">Status da IA</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${(stats?.aiMessages ?? 0) > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {(stats?.aiMessages ?? 0) > 0
                  ? `IA respondeu ${stats?.aiMessages} mensagens automaticamente`
                  : 'Configure a IA para responder clientes 24/7'
                }
              </p>
            </div>
            {(stats?.aiMessages ?? 0) === 0 && (
              <Link to={ROUTES.AI}>
                <Button size="sm" className="mt-3 bg-gradient-brand hover:opacity-90 text-white w-full text-xs h-8">
                  Configurar IA
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity based on real data */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold text-foreground mb-4">Resumo do sistema</h2>
        {!stats || (stats.totalConversations === 0 && stats.totalContacts === 0) ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conecte seu WhatsApp e configure a IA para começar a receber mensagens.
            </p>
            <Link to={ROUTES.WHATSAPP} className="mt-4">
              <Button size="sm" className="bg-gradient-brand hover:opacity-90 text-white">
                Conectar WhatsApp
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total de conversas', value: stats.totalConversations, icon: MessageSquare, color: 'text-emerald-500' },
              { label: 'Conversas abertas', value: stats.openConversations, icon: Zap, color: 'text-blue-500' },
              { label: 'Clientes cadastrados', value: stats.totalContacts, icon: Users, color: 'text-purple-500' },
              { label: 'Respostas da IA', value: stats.aiMessages, icon: Bot, color: 'text-orange-500' },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 bg-muted/30 rounded-xl">
                <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
