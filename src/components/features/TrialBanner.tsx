import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getTrialDaysLeft, isTrialExpired } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

export default function TrialBanner() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.subscriptionStatus !== 'trial' || dismissed) return null;

  const daysLeft = getTrialDaysLeft(user.trialEndDate);
  const expired = isTrialExpired(user.trialEndDate);

  return (
    <div className={`
      flex items-center justify-between px-4 md:px-6 py-3 text-sm border-b
      ${expired
        ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        : daysLeft <= 3
          ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      }
    `}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {expired ? (
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Clock className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="truncate">
          {expired
            ? 'Seu período de teste encerrou. Assine um plano para continuar.'
            : daysLeft === 1
              ? 'Último dia do seu teste grátis!'
              : `Teste grátis: ${daysLeft} dias restantes.`
          }
        </span>
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        <Link
          to={ROUTES.BILLING}
          className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity text-sm whitespace-nowrap"
        >
          Assinar agora
        </Link>
        {!expired && (
          <button
            onClick={() => setDismissed(true)}
            className="opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dispensar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
