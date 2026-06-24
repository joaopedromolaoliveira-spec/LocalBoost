import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { WEBHOOK_BASE_URL } from '@/constants/plans';

const troubleshootingSteps = [
  { title: 'QR Code não aparece', solution: 'Verifique sua conexão com a internet e recarregue a página. O QR Code expira em 60 segundos.' },
  { title: 'Número não verificado', solution: 'Certifique-se de que o número está ativo no WhatsApp ou WhatsApp Business.' },
  { title: 'WhatsApp desconectou', solution: 'Reconecte via QR Code. Isso pode acontecer se o celular ficar sem internet por muito tempo.' },
  { title: 'Mensagens não chegam', solution: 'Verifique o status do webhook e se o número está conectado corretamente.' },
  { title: 'Erro de sessão expirada', solution: 'Faça logout no WhatsApp Web em todos os dispositivos e reconecte pelo LocalBoost.' },
];

export default function WhatsAppStatus() {
  const { user } = useAuthStore();
  const webhookUrl = `${WEBHOOK_BASE_URL}/${user?.id || 'SEU_ID'}`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL copiada!');
  };

  const isConnected = user?.whatsappConnected;

  const statusItems = [
    { label: 'Conexão WhatsApp', status: isConnected ? 'ok' : 'error', value: isConnected ? 'Conectado' : 'Desconectado' },
    { label: 'Número verificado', status: isConnected ? 'ok' : 'warning', value: isConnected ? user?.whatsappNumber || 'Ativo' : 'Pendente' },
    { label: 'Webhook URL', status: 'ok', value: 'Configurado' },
    { label: 'Sincronização de mensagens', status: isConnected ? 'ok' : 'error', value: isConnected ? 'Automática' : 'Inativa' },
    { label: 'Reconexão automática', status: 'ok', value: 'Ativa' },
    { label: 'Sessão de autenticação', status: isConnected ? 'ok' : 'error', value: isConnected ? 'Válida' : 'Expirada' },
  ];

  const getIcon = (status: string) => {
    if (status === 'ok') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Status da Conexão</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitore o estado da sua integração WhatsApp</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info('Verificando status...')}>
          <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
        </Button>
      </div>

      {/* Overall status */}
      <div className={`p-5 rounded-xl border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex items-center gap-3">
          {isConnected ? <CheckCircle className="w-7 h-7 text-emerald-500" /> : <XCircle className="w-7 h-7 text-red-500" />}
          <div>
            <p className="font-semibold text-foreground">{isConnected ? 'Tudo funcionando' : 'WhatsApp desconectado'}</p>
            <p className="text-sm text-muted-foreground">{isConnected ? `Número: ${user?.whatsappNumber}` : 'Conecte seu WhatsApp para começar'}</p>
          </div>
          <Badge className={`ml-auto ${isConnected ? 'bg-emerald-500 text-white border-0' : 'bg-red-500 text-white border-0'}`}>
            {isConnected ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Status items */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-heading font-semibold text-foreground">Detalhes do Status</h2>
        </div>
        <div className="divide-y divide-border">
          {statusItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {getIcon(item.status)}
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold text-foreground mb-2">URL do Webhook</h2>
        <p className="text-xs text-muted-foreground mb-3">Use esta URL nas configurações avançadas de integração</p>
        <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
          <code className="text-xs text-foreground flex-1 break-all font-mono">{webhookUrl}</code>
          <Button size="sm" variant="ghost" onClick={copyWebhook} className="flex-shrink-0">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold text-foreground mb-4">Solução de Problemas</h2>
        <div className="space-y-4">
          {troubleshootingSteps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-amber-600 font-bold">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.solution}</p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.open('https://faq.whatsapp.com', '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" /> Central de Ajuda WhatsApp
        </Button>
      </div>
    </div>
  );
}
