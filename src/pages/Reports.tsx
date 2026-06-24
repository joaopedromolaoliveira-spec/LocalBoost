import { BarChart3, Download, FileText, TrendingUp, MessageSquare, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import EmptyState from '@/components/features/EmptyState';
import StatCard from '@/components/features/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

const emptyChartData = Array.from({ length: 7 }, (_, i) => ({
  day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i],
  messages: 0,
  leads: 0,
  revenue: 0,
}));

export default function Reports() {
  const handleExport = (format: 'pdf' | 'excel') => {
    toast.info(`Exportação em ${format.toUpperCase()} será disponível com dados reais.`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Relatórios & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Dados reais do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-2" /> Exportar Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mensagens (mês)" value={0} icon={MessageSquare} color="green" />
        <StatCard title="Leads gerados" value={0} icon={TrendingUp} color="blue" />
        <StatCard title="Novos contatos" value={0} icon={Users} color="purple" />
        <StatCard title="Receita (mês)" value={0} icon={DollarSign} color="orange" prefix="R$" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-foreground text-sm">Mensagens por dia</h3>
            <Badge variant="outline" className="text-xs">Últimos 7 dias</Badge>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={emptyChartData}>
                <defs>
                  <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="messages" stroke="#25D366" fill="url(#colorMsg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">Dados aparecerão após enviar mensagens</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-foreground text-sm">Leads por dia</h3>
            <Badge variant="outline" className="text-xs">Últimos 7 dias</Badge>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emptyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="leads" fill="#128C7E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">Dados aparecerão após gerar leads</p>
        </div>
      </div>

      {/* Campaign reports */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4">Desempenho de Campanhas</h3>
        <EmptyState
          icon={BarChart3}
          title="Nenhuma campanha ainda"
          description="Crie e execute campanhas para ver relatórios de performance, taxas de abertura e conversão."
        />
      </div>
    </div>
  );
}
