import { useState, useCallback } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, Info,
  RefreshCw, Copy, ExternalLink, Loader2,
  Wifi, WifiOff, Zap, Bot, Database, Key,
  ChevronDown, ChevronRight, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { invokeFunction } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';

interface DiagCheck {
  id: string;
  label: string;
  status: 'ok' | 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
}

interface DiagResult {
  overall: 'ok' | 'error' | 'warning';
  provider: 'waha' | 'evolution' | null;
  webhookUrl: string;
  wahaSession: string | null;
  checks: DiagCheck[];
  timestamp: string;
}

const STATUS_CONFIG = {
  ok:      { icon: CheckCircle,   color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'OK' },
  error:   { icon: XCircle,       color: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     label: 'Erro' },
  warning: { icon: AlertTriangle, color: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   label: 'Atenção' },
  info:    { icon: Info,          color: 'text-blue-500',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    label: 'Info' },
};

const CHECK_ICONS: Record<string, React.ElementType> = {
  webhook_url:          Wifi,
  provider:             Zap,
  waha_url:             Key,
  waha_key:             Shield,
  waha_session:         Key,
  waha_ping:            Wifi,
  waha_session_status:  Wifi,
  evolution_url:        Key,
  evolution_key:        Shield,
  evolution_ping:       Wifi,
  onspace_ai:           Bot,
  supabase:             Database,
};

function CheckRow({ check, expanded, onToggle }: { check: DiagCheck; expanded: boolean; onToggle: () => void }) {
  const cfg = STATUS_CONFIG[check.status];
  const Icon = CHECK_ICONS[check.id] || Info;
  const StatusIcon = cfg.icon;

  return (
    <div className={cn('rounded-xl border transition-all', cfg.border, cfg.bg)}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
          <Icon className={cn('w-4 h-4', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{check.label}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{check.message}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusIcon className={cn('w-4 h-4', cfg.color)} />
          {check.fix && (
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
          )}
        </div>
      </button>
      {check.fix && expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="p-3 bg-background/60 rounded-lg border border-border">
            <p className="text-xs font-semibold text-foreground mb-1">Como corrigir:</p>
            <p className="text-xs text-muted-foreground">{check.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WhatsAppDiagnostics() {
  const { user } = useAuthStore();
  const [result, setResult]     = useState<DiagResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const runDiag = useCallback(async () => {
    setLoading(true);
    const { data, error } = await invokeFunction<DiagResult>('whatsapp-diagnostics', { userId: user?.id });
    if (error) {
      toast.error(`Erro ao executar diagnóstico: ${error}`);
    } else if (data) {
      setResult(data);
      if (data.overall === 'ok') toast.success('Tudo certo! Sistema pronto para conectar.');
      else if (data.overall === 'error') toast.error('Erros encontrados. Veja o diagnóstico abaixo.');
      else toast.warning('Atenção: alguns itens precisam de revisão.');
    }
    setLoading(false);
  }, [user?.id]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const copyWebhook = () => {
    if (result?.webhookUrl) {
      navigator.clipboard.writeText(result.webhookUrl);
      toast.success('URL do webhook copiada!');
    }
  };

  const overallCfg = result ? STATUS_CONFIG[result.overall] : null;

  const errors   = result?.checks.filter(c => c.status === 'error').length  ?? 0;
  const warnings = result?.checks.filter(c => c.status === 'warning').length ?? 0;
  const oks      = result?.checks.filter(c => c.status === 'ok').length      ?? 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-500" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Diagnóstico do Sistema</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-12">
          Verifica a configuração do provedor WhatsApp e o status das Secrets — sem expor valores sensíveis.
        </p>
      </div>

      {/* Run button */}
      <Button
        onClick={runDiag}
        disabled={loading}
        className="bg-gradient-brand hover:opacity-90 text-white w-full sm:w-auto"
        size="lg"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Executando diagnóstico...</>
          : <><RefreshCw className="w-4 h-4 mr-2" /> {result ? 'Executar novamente' : 'Executar diagnóstico'}</>
        }
      </Button>

      {/* Overall result banner */}
      {result && overallCfg && (
        <div className={cn('p-5 rounded-2xl border-2 flex items-start gap-4', overallCfg.bg, overallCfg.border)}>
          <overallCfg.icon className={cn('w-7 h-7 flex-shrink-0 mt-0.5', overallCfg.color)} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn('font-heading font-bold text-lg', overallCfg.color)}>
                {result.overall === 'ok' ? 'Sistema pronto!' : result.overall === 'error' ? 'Ação necessária' : 'Atenção necessária'}
              </p>
              <Badge className={cn('border-0', overallCfg.bg, overallCfg.color)}>
                {result.provider === 'waha' ? 'WAHA' : result.provider === 'evolution' ? 'Evolution API' : 'Sem provedor'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {oks} verificação{oks !== 1 ? 'ões' : ''} OK
              {errors > 0 ? ` · ${errors} erro${errors !== 1 ? 's' : ''}` : ''}
              {warnings > 0 ? ` · ${warnings} aviso${warnings !== 1 ? 's' : ''}` : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-1 opacity-70">
              {new Date(result.timestamp).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {result.overall === 'ok' && (
              <Link to={ROUTES.WHATSAPP}>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs">
                  <Wifi className="w-3 h-3 mr-1" /> Conectar WhatsApp
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Webhook URL card */}
      {result?.webhookUrl && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-500" /> URL do Webhook
            </p>
            <Badge className="bg-blue-500/10 text-blue-600 border-0 text-xs">Configure no seu provedor</Badge>
          </div>
          <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-3">
            <code className="text-xs text-foreground flex-1 break-all font-mono">{result.webhookUrl}</code>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={copyWebhook}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Configure esta URL como webhook no painel do WAHA ou Evolution API para receber mensagens em tempo real.
          </p>
        </div>
      )}

      {/* Checks list */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Resultado das verificações</p>
            <button
              onClick={() => {
                const allIds = result.checks.filter(c => c.fix).map(c => c.id);
                const allExpanded = allIds.every(id => expanded.has(id));
                if (allExpanded) setExpanded(new Set());
                else setExpanded(new Set(allIds));
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ChevronDown className="w-3 h-3" /> Expandir tudo
            </button>
          </div>

          {result.checks.map(check => (
            <CheckRow
              key={check.id}
              check={check}
              expanded={expanded.has(check.id)}
              onToggle={() => toggleExpand(check.id)}
            />
          ))}
        </div>
      )}

      {/* Guides */}
      {result && result.overall !== 'ok' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Recursos de ajuda</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Deploy WAHA no Railway',
                desc: 'Grátis, 1 clique, sem cartão de crédito',
                href: 'https://railway.app/template/waha',
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
              {
                title: 'WAHA — Documentação',
                desc: 'API reference e configuração avançada',
                href: 'https://waha.devlike.pro/docs/overview/quick-start/',
                color: 'text-purple-500',
                bg: 'bg-purple-500/10',
              },
              {
                title: 'Evolution API no GitHub',
                desc: 'Repositório e guia de instalação',
                href: 'https://github.com/EvolutionAPI/evolution-api',
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
              },
              {
                title: 'Onde adicionar as Secrets',
                desc: 'Painel Cloud → aba Secrets → adicionar variável',
                href: '#',
                color: 'text-orange-500',
                bg: 'bg-orange-500/10',
              },
            ].map((r, i) => (
              <a
                key={i}
                href={r.href}
                target={r.href !== '#' ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/40 transition-all group"
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', r.bg)}>
                  <ExternalLink className={cn('w-4 h-4', r.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to={ROUTES.WHATSAPP}>
          <Button variant="outline" size="sm">
            <Wifi className="w-4 h-4 mr-2" /> Página de conexão
          </Button>
        </Link>
        {result?.overall === 'ok' && (
          <Link to="/dashboard/inbox">
            <Button size="sm" className="bg-gradient-brand hover:opacity-90 text-white">
              Abrir caixa de entrada →
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
