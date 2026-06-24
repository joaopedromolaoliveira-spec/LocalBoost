import { useState } from 'react';
import { CreditCard, CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PlanCard from '@/components/features/PlanCard';
import { PLANS, PLAN_NAMES, STATUS_LABELS } from '@/constants/plans';
import { useAuthStore } from '@/stores/authStore';
import { getTrialDaysLeft, formatDate, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Plan } from '@/types';
import { cn } from '@/lib/utils';

export default function Billing() {
  const { user, updateUser } = useAuthStore();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const daysLeft = getTrialDaysLeft(user?.trialEndDate);
  const isTrial = user?.subscriptionStatus === 'trial';
  const isActive = user?.subscriptionStatus === 'active';

  const handleSelectPlan = async (plan: Plan) => {
    setLoading(plan.id);
    await new Promise(r => setTimeout(r, 1500));

    // Mock Stripe checkout
    toast.info('Redirecionando para o checkout seguro do Stripe...', { duration: 2000 });
    await new Promise(r => setTimeout(r, 2000));
    
    updateUser({
      plan: plan.id,
      subscriptionStatus: 'active',
      subscriptionPlan: plan.id,
      subscriptionStartDate: new Date().toISOString(),
    });

    setLoading(null);
    toast.success(`Plano ${plan.name} ativado com sucesso!`);
  };

  const handleCancel = () => {
    toast.error('Para cancelar sua assinatura, entre em contato com o suporte: suporte@localboost.app');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Financeiro e Assinatura</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie seu plano e pagamentos</p>
      </div>

      {/* Current status */}
      <div className={cn(
        'rounded-xl border p-5',
        isTrial ? 'bg-amber-500/10 border-amber-500/30' : isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            {isTrial ? <Clock className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" /> : isActive ? <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-foreground">
                {isTrial ? `Teste grátis – ${daysLeft} dias restantes` : isActive ? `Plano ${PLAN_NAMES[user?.plan || '']} ativo` : 'Assinatura inativa'}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isTrial ? `Seu teste encerra em ${formatDate(user?.trialEndDate || '')}. Assine para continuar.` : isActive ? `Renovação automática. Plano ${billing === 'monthly' ? 'mensal' : 'anual'}.` : 'Escolha um plano para retomar o acesso.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Badge className={cn('border-0 text-sm px-3 py-1', isTrial ? 'bg-amber-500 text-white' : isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>
              {STATUS_LABELS[user?.subscriptionStatus || 'trial']}
            </Badge>
            {isActive && (
              <Button variant="outline" size="sm" onClick={handleCancel}>Cancelar</Button>
            )}
          </div>
        </div>
      </div>

      {/* Billing toggle */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            {isActive ? 'Mudar de plano' : 'Escolha seu plano'}
          </h2>
          <div className="inline-flex bg-muted rounded-xl p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', billing === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5', billing === 'annual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              Anual <Badge className="bg-emerald-500 text-white border-0 text-xs">-17%</Badge>
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingPeriod={billing}
              currentPlan={isActive ? user?.plan : undefined}
              onSelect={handleSelectPlan}
              loading={loading === plan.id}
            />
          ))}
        </div>
      </div>

      {/* Payment info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" /> Pagamento seguro
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Via Stripe', desc: 'Cartão de crédito, débito e Pix' },
            { label: 'Dados protegidos', desc: 'Criptografia SSL 256-bit' },
            { label: 'Cancele a qualquer momento', desc: 'Sem multa ou fidelidade' },
          ].map((i, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{i.label}</p>
                <p className="text-xs text-muted-foreground">{i.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Processado com segurança por Stripe. LocalBoost nunca armazena dados de cartão.
        </p>
      </div>

      {/* Payment history */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-heading font-semibold text-foreground">Histórico de pagamentos</h3>
        </div>
        <div className="p-8 text-center">
          <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum pagamento realizado ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">Os pagamentos aparecerão aqui após a assinatura.</p>
        </div>
      </div>
    </div>
  );
}
