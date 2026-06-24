import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import type { Plan } from '@/types';

interface PlanCardProps {
  plan: Plan;
  billingPeriod: 'monthly' | 'annual';
  currentPlan?: string;
  onSelect: (plan: Plan) => void;
  loading?: boolean;
}

export default function PlanCard({ plan, billingPeriod, currentPlan, onSelect, loading }: PlanCardProps) {
  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.id === 'free';

  return (
    <div className={cn(
      'relative rounded-2xl border p-6 flex flex-col transition-all duration-200',
      plan.popular
        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]'
        : 'border-border bg-card hover:border-primary/50 hover:shadow-md',
    )}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-brand text-white border-0 px-3 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            {plan.badge}
          </Badge>
        </div>
      )}
      {plan.badge && !plan.popular && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="bg-card text-xs">
            {plan.badge}
          </Badge>
        </div>
      )}

      <div className="mb-6">
        <div className={cn(
          'w-10 h-10 rounded-xl bg-gradient-to-br mb-3 flex items-center justify-center',
          plan.gradient,
        )}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-heading font-bold text-foreground">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{plan.description}</p>
      </div>

      <div className="mb-6">
        {isFree ? (
          <div>
            <span className="text-4xl font-heading font-bold text-foreground">Grátis</span>
            <p className="text-sm text-muted-foreground mt-1">7 dias de teste</p>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1">
              <span className="text-sm text-muted-foreground">R$</span>
              <span className="text-4xl font-heading font-bold text-foreground">
                {price}
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                /{billingPeriod === 'monthly' ? 'mês' : 'ano'}
              </span>
            </div>
            {billingPeriod === 'annual' && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                Economia de {formatCurrency((plan.monthlyPrice * 12) - plan.annualPrice)} por ano
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">7 dias grátis, depois {formatCurrency(price)}</p>
          </div>
        )}
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(plan)}
        disabled={isCurrentPlan || loading}
        className={cn(
          'w-full font-semibold',
          plan.popular
            ? 'bg-gradient-brand hover:opacity-90 text-white'
            : isCurrentPlan
              ? 'bg-muted text-muted-foreground cursor-default'
              : '',
        )}
        variant={plan.popular ? 'default' : 'outline'}
      >
        {loading ? 'Processando...' : isCurrentPlan ? 'Plano atual' : isFree ? 'Começar grátis' : 'Assinar agora'}
      </Button>
    </div>
  );
}
