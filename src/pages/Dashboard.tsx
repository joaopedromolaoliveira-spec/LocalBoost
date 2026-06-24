import { Link } from 'react-router-dom';
import { MessageSquare, Users, Zap, DollarSign, TrendingUp, ArrowRight, CheckCircle, Circle, Wifi, Brain, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/features/StatCard';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';

const quickActions = [
  { icon: Wifi, label: 'Conectar WhatsApp', href: ROUTES.WHATSAPP, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Users, label: 'Adicionar Contato', href: ROUTES.CRM, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Megaphone, label: 'Nova Campanha', href: ROUTES.CAMPAIGNS, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { icon: Brain, label: 'Treinar IA', href: ROUTES.AI, color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

export default function Dashboard() {
  const { user } = useAuthStore();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const checklist = [
    { label: 'Conta criada', done: true, href: ROUTES.SETTINGS },
    { label: 'WhatsApp conectado', done: user?.whatsappConnected || false, href: ROUTES.WHATSAPP },
    { label: 'Primeiro contato adicionado', done: false, href: ROUTES.CRM },
    { label: 'Automação configurada', done: false, href: ROUTES.AUTOMATIONS },
    { label: 'IA treinada', done: false, href: ROUTES.AI },
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
            {formatDateTime(now)} — Painel LocalBoost
          </p>
        </div>
        {user?.subscriptionStatus === 'trial' && (
          <Link to={ROUTES.BILLING}>
            <Button className="bg-gradient-brand hover:opacity-90 text-white text-sm">
              Assinar plano
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div>
        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Métricas em tempo real</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Mensagens enviadas" value={0} icon={MessageSquare} color="green" description="Dados reais aparecerão após conectar o WhatsApp" />
          <StatCard title="Leads gerados" value={0} icon={TrendingUp} color="blue" description="Adicione contatos para começar" />
          <StatCard title="Conversões" value={0} icon={Zap} color="purple" description="Configure automações para rastrear" />
          <StatCard title="Receita" value={0} icon={DollarSign} color="orange" prefix="R$" description="Integre pagamentos para monitorar" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Getting Started */}
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
          <div className="space-y-3">
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

          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-xs font-semibold text-primary mb-1">Dica do dia</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Conecte seu WhatsApp via QR Code para começar a receber e enviar mensagens automaticamente.
            </p>
            <Link to={ROUTES.WHATSAPP}>
              <Button size="sm" className="mt-3 bg-gradient-brand hover:opacity-90 text-white w-full text-xs h-8">
                Conectar agora
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Activity empty */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold text-foreground mb-4">Atividade recente</h2>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-3">
            <MessageSquare className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
          <p className="text-xs text-muted-foreground mt-1">As atividades aparecerão aqui conforme você usa a plataforma.</p>
        </div>
      </div>
    </div>
  );
}
