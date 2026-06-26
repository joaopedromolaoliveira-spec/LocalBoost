import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  QrCode, CheckCircle, WifiOff, Loader2, AlertCircle,
  RefreshCw, ExternalLink, Info, Zap, Server, ChevronDown, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { invokeFunction } from '@/lib/api';
import { cn } from '@/lib/utils';

interface QRStatus {
  status: 'idle' | 'loading' | 'qr' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  phoneNumber?: string;
  profileName?: string;
  error?: string;
  setupRequired?: boolean;
  provider?: 'waha' | 'evolution';
}

type ProviderGuide = 'waha' | 'evolution';

const WAHA_STEPS = [
  {
    title: 'Deploy WAHA no Railway (grátis)',
    desc: 'Clique em "Deploy on Railway", crie uma conta gratuita e faça o deploy com 1 clique.',
    link: 'https://railway.app/template/waha',
    linkLabel: 'Deploy WAHA no Railway →',
  },
  {
    title: 'Copie a URL do serviço',
    desc: 'Após o deploy, copie a URL pública gerada (ex: https://waha-xxx.railway.app).',
  },
  {
    title: 'Adicione WAHA_API_URL nas Secrets',
    desc: 'No LocalBoost → Cloud (painel direito) → Secrets, adicione a variável WAHA_API_URL com a URL copiada.',
  },
  {
    title: 'Escaneie o QR Code',
    desc: 'Volte na aba "QR Code" e escaneie com seu WhatsApp. Pronto!',
  },
];

const EVOLUTION_STEPS = [
  {
    title: 'Instale a Evolution API',
    desc: 'Use o Railway, DigitalOcean ou qualquer VPS com Docker. Siga a documentação oficial.',
    link: 'https://github.com/EvolutionAPI/evolution-api',
    linkLabel: 'Ver documentação →',
  },
  {
    title: 'Obtenha a API Key',
    desc: 'Configure AUTHENTICATION_API_KEY no servidor Evolution API. Esse valor será a sua chave.',
  },
  {
    title: 'Adicione as Secrets no LocalBoost',
    desc: 'Adicione EVOLUTION_API_URL (URL do servidor) e EVOLUTION_API_KEY (sua chave) nas Secrets do painel.',
  },
  {
    title: 'Conecte via QR Code',
    desc: 'Volte na aba "QR Code" e escaneie com seu WhatsApp para conectar.',
  },
];

export default function WhatsAppConnect() {
  const { user, updateUser } = useAuthStore();
  const [qrStatus, setQrStatus] = useState<QRStatus>({ status: 'idle' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('qr');
  const [polling, setPolling] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<ProviderGuide>('waha');

  const isConnected = user?.whatsappConnected;

  const fetchQR = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    setQrStatus(prev => ({ ...prev, status: prev.status === 'idle' ? 'loading' : prev.status }));

    type QRResponse = QRStatus & { setupRequired?: boolean; details?: string; providers?: string[] };
    const { data, error } = await invokeFunction<QRResponse>('whatsapp-qr', {
      userId: user.id,
      action: 'get_qr',
    });

    const errMsg = error || (data as { error?: string })?.error;
    if (errMsg) {
      const setupRequired = (data as { setupRequired?: boolean })?.setupRequired ?? false;
      setQrStatus({ status: 'error', error: errMsg, setupRequired });
      return false;
    }

    if (!data) return false;
    const { status, qrCode, phoneNumber, profileName, provider } = data;

    if (status === 'connected') {
      setQrStatus({ status: 'connected', phoneNumber, profileName, provider });
      if (!user.whatsappConnected) {
        updateUser({ whatsappConnected: true, whatsappNumber: phoneNumber });
        toast.success(`WhatsApp conectado via ${provider === 'waha' ? 'WAHA' : 'Evolution API'}!`);
      }
      return true;
    }

    if (status === 'qr' && qrCode) {
      setQrStatus({ status: 'qr', qrCode, provider });
      return false;
    }

    if (status === 'connecting') {
      setQrStatus({ status: 'connecting', provider });
      return false;
    }

    return false;
  }, [user?.id, user?.whatsappConnected]);

  // Auto-poll when on QR tab and not connected
  useEffect(() => {
    if (activeTab !== 'qr' || isConnected) return;
    let stopped = false;
    setPolling(true);

    const poll = async () => {
      if (stopped) return;
      const done = await fetchQR();
      if (!done && !stopped) setTimeout(poll, 5000);
      else setPolling(false);
    };

    poll();
    return () => { stopped = true; setPolling(false); };
  }, [activeTab, isConnected, fetchQR]);

  const handleDisconnect = async () => {
    if (!user?.id) return;
    setLoading(true);
    await invokeFunction('whatsapp-qr', { userId: user.id, action: 'disconnect' });
    updateUser({ whatsappConnected: false, whatsappNumber: undefined });
    setQrStatus({ status: 'idle' });
    setLoading(false);
    toast.info('WhatsApp desconectado.');
  };

  const handleRefreshQR = () => {
    setQrStatus({ status: 'loading' });
    fetchQR();
  };

  const ProviderBadge = ({ prov }: { prov?: string }) => {
    if (!prov) return null;
    return (
      <Badge className={cn('text-xs border-0', prov === 'waha' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600')}>
        {prov === 'waha' ? 'WAHA' : 'Evolution API'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Conexão WhatsApp</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Conecte seu WhatsApp via QR Code em segundos. Suporte a WAHA (grátis) e Evolution API.
        </p>
      </div>

      {/* Status bar */}
      <div className={cn('flex items-center justify-between p-4 rounded-xl border transition-colors', isConnected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/50 border-border')}>
        <div className="flex items-center gap-3">
          {isConnected ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium text-foreground">{isConnected ? 'WhatsApp Conectado' : 'Não conectado'}</p>
            {isConnected && (
              <p className="text-xs text-muted-foreground">
                {qrStatus.profileName || user?.whatsappNumber
                  ? `${qrStatus.profileName || ''} · ${user?.whatsappNumber || ''}`
                  : 'Número ativo'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && qrStatus.provider && <ProviderBadge prov={qrStatus.provider} />}
          <Badge className={isConnected ? 'bg-emerald-500 text-white border-0' : 'bg-muted text-muted-foreground border-0'}>
            {isConnected ? '● Online' : '○ Offline'}
          </Badge>
          {isConnected && (
            <Button size="sm" variant="outline" onClick={handleDisconnect} disabled={loading} className="text-red-500 border-red-500/30 hover:bg-red-500/10">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Desconectar'}
            </Button>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="bg-card border border-border rounded-xl p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="qr"><QrCode className="w-4 h-4 mr-2" />QR Code</TabsTrigger>
              <TabsTrigger value="setup"><Info className="w-4 h-4 mr-2" />Configurar provedor</TabsTrigger>
            </TabsList>

            {/* ── QR Code tab ── */}
            <TabsContent value="qr">
              {/* Error state */}
              {qrStatus.status === 'error' && (
                <div className="mb-5 space-y-3">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {qrStatus.setupRequired ? 'Servidor WAHA inacessível' : 'Erro de conexão'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{qrStatus.error}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={handleRefreshQR}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('setup')}>
                        Ver passo a passo
                      </Button>
                    </div>
                  </div>
                  {/* Diagnostic checklist */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs">
                    <p className="font-semibold text-amber-700 dark:text-amber-300 mb-2">✦ Diagnóstico — verifique cada item:</p>
                    <ol className="space-y-1.5 text-muted-foreground list-decimal list-inside">
                      <li>O servidor WAHA está <strong>rodando</strong>? (acesse a URL no navegador e veja se responde)</li>
                      <li>A Secret <code className="bg-muted px-1 rounded">WAHA_URL</code> está salva no painel <strong>Cloud → Secrets</strong>?</li>
                      <li>A URL <strong>não tem barra</strong> no final? (ex: <code className="bg-muted px-1 rounded">https://waha-xxx.railway.app</code>)</li>
                      <li>O Railway/Render está no plano <strong>ativo</strong> (não suspenso por inatividade)?</li>
                      <li>A URL é <strong>pública</strong> (https://)? URLs locais (localhost) não funcionam.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* QR display */}
              <div className="flex flex-col items-center mb-5">
                <div className="w-64 h-64 bg-white rounded-2xl border-4 border-primary/20 flex items-center justify-center shadow-lg overflow-hidden">
                  {(qrStatus.status === 'loading' || (qrStatus.status === 'idle' && polling)) ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Gerando QR Code...</p>
                    </div>
                  ) : qrStatus.status === 'qr' && qrStatus.qrCode ? (
                    <img src={qrStatus.qrCode} alt="QR Code WhatsApp" className="w-full h-full object-contain p-2" />
                  ) : qrStatus.status === 'connecting' ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <p className="text-xs text-emerald-600 text-center px-4">
                        {qrStatus.provider === 'waha' ? 'WAHA: sessão iniciando...' : 'Verificando conexão...'}
                      </p>
                    </div>
                  ) : qrStatus.status !== 'error' ? (
                    <div className="flex flex-col items-center gap-3 px-4 text-center">
                      <QrCode className="w-10 h-10 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {polling ? 'Inicializando provedor...' : 'QR Code aparecerá aqui'}
                      </p>
                    </div>
                  ) : null}
                </div>

                {qrStatus.status === 'qr' && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      QR Code válido · Atualiza em 30s
                    </div>
                    <ProviderBadge prov={qrStatus.provider} />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshQR} title="Atualizar QR">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* How to scan */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Como escanear o QR Code:</p>
                    <p>WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar aparelho → Aponte a câmera para o QR Code acima</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Setup tab ── */}
            <TabsContent value="setup" className="space-y-5">
              {/* Provider selector */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Escolha seu provedor WhatsApp:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* WAHA Card */}
                  <button
                    onClick={() => setSelectedGuide('waha')}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-all',
                      selectedGuide === 'waha'
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-border hover:border-blue-500/50 bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="font-semibold text-foreground text-sm">WAHA</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">✓ Grátis</Badge>
                        <Badge className="bg-blue-500/10 text-blue-600 border-0 text-xs">Recomendado</Badge>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {['Open source (MIT)', 'Sem chave de API', 'Deploy com 1 clique', 'Mais simples de usar'].map(f => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="text-emerald-500">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    {selectedGuide === 'waha' && (
                      <div className="mt-2 pt-2 border-t border-blue-500/20">
                        <p className="text-xs font-medium text-blue-600">Secret necessária:</p>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">WAHA_API_URL</code>
                        <span className="text-xs text-muted-foreground ml-1">(WAHA_API_KEY é opcional)</span>
                      </div>
                    )}
                  </button>

                  {/* Evolution API Card */}
                  <button
                    onClick={() => setSelectedGuide('evolution')}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 transition-all',
                      selectedGuide === 'evolution'
                        ? 'border-purple-500 bg-purple-500/5'
                        : 'border-border hover:border-purple-500/50 bg-card'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Server className="w-4 h-4 text-purple-500" />
                        </div>
                        <span className="font-semibold text-foreground text-sm">Evolution API</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">✓ Open Source</Badge>
                    </div>
                    <ul className="space-y-1">
                      {['Múltiplas instâncias', 'Mais recursos avançados', 'API REST completa', 'Grande comunidade'].map(f => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="text-emerald-500">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    {selectedGuide === 'evolution' && (
                      <div className="mt-2 pt-2 border-t border-purple-500/20">
                        <p className="text-xs font-medium text-purple-600">Secrets necessárias:</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">EVOLUTION_API_URL</code>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">EVOLUTION_API_KEY</code>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Step-by-step guide */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {selectedGuide === 'waha' ? (
                    <><Zap className="w-4 h-4 text-blue-500" /> Configuração WAHA — passo a passo</>
                  ) : (
                    <><Server className="w-4 h-4 text-purple-500" /> Configuração Evolution API — passo a passo</>
                  )}
                </p>
                {(selectedGuide === 'waha' ? WAHA_STEPS : EVOLUTION_STEPS).map((step, i) => (
                  <div key={i} className="flex gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white',
                      selectedGuide === 'waha' ? 'bg-blue-500' : 'bg-purple-500'
                    )}>{i + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      {step.link && (
                        <a href={step.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                          <ExternalLink className="w-3 h-3" /> {step.linkLabel}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Where to add secrets */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-semibold mb-1">Como adicionar as Secrets:</p>
                    <p>No painel do LocalBoost → clique em <strong>"Cloud"</strong> (ícone topo direito) → <strong>"Secrets"</strong> → adicione as variáveis de ambiente.</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setActiveTab('qr')}
                className="bg-gradient-brand hover:opacity-90 text-white w-full"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Ir para QR Code e conectar
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Connected stats */}
      {isConnected && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Webhook', value: 'Ativo', color: 'text-blue-500' },
            { label: 'Sincronização', value: 'Tempo Real', color: 'text-purple-500' },
            { label: 'IA', value: 'Respondendo', color: 'text-emerald-500' },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to={ROUTES.WHATSAPP_STATUS}>
          <Button variant="outline" size="sm">Ver status detalhado</Button>
        </Link>
        {isConnected && (
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
