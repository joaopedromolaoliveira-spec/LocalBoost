import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Phone, CheckCircle, WifiOff, Loader2, AlertCircle, RefreshCw, ExternalLink, Info } from 'lucide-react';
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
}

export default function WhatsAppConnect() {
  const { user, updateUser } = useAuthStore();
  const [qrStatus, setQrStatus] = useState<QRStatus>({ status: 'idle' });
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('qr');
  const [polling, setPolling] = useState(false);

  const isConnected = user?.whatsappConnected;

  const fetchQR = useCallback(async () => {
    if (!user?.id) return;
    setQrStatus(prev => ({ ...prev, status: prev.status === 'idle' ? 'loading' : prev.status }));

    const { data, error } = await invokeFunction<QRStatus & { setupRequired?: boolean; details?: string }>('whatsapp-qr', {
      userId: user.id,
      action: 'get_qr',
    });

    if (error || (data as { error?: string })?.error) {
      const errMsg = error || (data as { error?: string })?.error || 'Erro ao conectar';
      const setupRequired = (data as { setupRequired?: boolean })?.setupRequired;
      setQrStatus({ status: 'error', error: errMsg, setupRequired });
      return false;
    }

    if (!data) return false;

    const { status, qrCode, phoneNumber, profileName } = data as QRStatus;

    if (status === 'connected') {
      setQrStatus({ status: 'connected', phoneNumber, profileName });
      if (!user.whatsappConnected) {
        updateUser({ whatsappConnected: true, whatsappNumber: phoneNumber });
        toast.success('WhatsApp conectado com sucesso!');
      }
      return true; // Stop polling
    }

    if (status === 'qr' && qrCode) {
      setQrStatus({ status: 'qr', qrCode });
      return false;
    }

    if (status === 'connecting') {
      setQrStatus({ status: 'connecting' });
      return false;
    }

    return false;
  }, [user?.id, user?.whatsappConnected]);

  // Start QR polling when tab is qr and not connected
  useEffect(() => {
    if (activeTab !== 'qr' || isConnected) return;

    let stopped = false;
    setPolling(true);

    const poll = async () => {
      if (stopped) return;
      const done = await fetchQR();
      if (!done && !stopped) {
        setTimeout(poll, 5000);
      } else {
        setPolling(false);
      }
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

  const handleRefreshQR = async () => {
    setQrStatus({ status: 'loading' });
    await fetchQR();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Conexão WhatsApp</h1>
        <p className="text-muted-foreground text-sm mt-1">Conecte seu número via QR Code. Sem configuração técnica.</p>
      </div>

      {/* Status bar */}
      <div className={cn('flex items-center justify-between p-4 rounded-xl border', isConnected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/50 border-border')}>
        <div className="flex items-center gap-3">
          {isConnected ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium text-foreground">{isConnected ? 'WhatsApp Conectado' : 'Não conectado'}</p>
            {isConnected && (
              <p className="text-xs text-muted-foreground">
                {qrStatus.profileName || user?.whatsappNumber ? `${qrStatus.profileName || ''} · ${user?.whatsappNumber || ''}` : 'Número ativo'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
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
              <TabsTrigger value="info"><Info className="w-4 h-4 mr-2" />Configuração</TabsTrigger>
            </TabsList>

            {/* QR Code tab */}
            <TabsContent value="qr">
              <div className="text-center mb-5">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-0 mb-2">Recomendado</Badge>
                <p className="text-sm text-muted-foreground">Escaneie com seu WhatsApp para conectar instantaneamente</p>
              </div>

              {/* Error state */}
              {qrStatus.status === 'error' && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {qrStatus.setupRequired ? 'Evolution API necessária' : 'Erro de conexão'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{qrStatus.error}</p>
                      {qrStatus.setupRequired && (
                        <div className="mt-3 text-xs text-muted-foreground space-y-1">
                          <p className="font-medium text-foreground">Como configurar:</p>
                          <p>1. Instale Evolution API (Railway, DigitalOcean ou VPS)</p>
                          <p>2. Adicione <code className="bg-muted px-1 rounded">EVOLUTION_API_URL</code> e <code className="bg-muted px-1 rounded">EVOLUTION_API_KEY</code> nas Secrets do painel</p>
                          <p>3. Volte aqui e escaneie o QR Code</p>
                          <a href="https://github.com/EvolutionAPI/evolution-api" target="_blank" rel="noopener" className="flex items-center gap-1 text-primary hover:underline mt-2">
                            <ExternalLink className="w-3 h-3" /> Documentação Evolution API
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleRefreshQR}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
                  </Button>
                </div>
              )}

              {/* QR Code display */}
              <div className="flex flex-col items-center">
                <div className="w-64 h-64 bg-white rounded-2xl border-4 border-primary/20 flex items-center justify-center shadow-lg overflow-hidden">
                  {qrStatus.status === 'loading' || (qrStatus.status === 'idle' && polling) ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Gerando QR Code...</p>
                    </div>
                  ) : qrStatus.status === 'qr' && qrStatus.qrCode ? (
                    <img src={qrStatus.qrCode} alt="QR Code WhatsApp" className="w-full h-full object-contain" />
                  ) : qrStatus.status === 'connecting' ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      <p className="text-xs text-emerald-600">Verificando conexão...</p>
                    </div>
                  ) : qrStatus.status !== 'error' ? (
                    <div className="flex flex-col items-center gap-3">
                      <QrCode className="w-10 h-10 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground text-center px-4">
                        {polling ? 'Inicializando...' : 'QR Code aparecerá aqui'}
                      </p>
                    </div>
                  ) : null}
                </div>

                {qrStatus.status === 'qr' && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span>QR Code válido · Atualizando automaticamente</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshQR}>
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <p className="font-semibold">Como escanear:</p>
                    <p>WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar aparelho → Escaneie o QR</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Setup info tab */}
            <TabsContent value="info">
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">Requisito: Evolution API</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Para o QR Code funcionar em produção, você precisa de uma instância da Evolution API rodando.
                    É uma solução gratuita e open-source que pode ser hospedada no Railway, DigitalOcean ou qualquer VPS.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { step: '1', title: 'Instale Evolution API', desc: 'Use o Railway (grátis) ou qualquer VPS. Siga a documentação oficial.', link: 'https://github.com/EvolutionAPI/evolution-api' },
                    { step: '2', title: 'Adicione as Secrets', desc: 'No painel LocalBoost → Cloud → Secrets, adicione EVOLUTION_API_URL e EVOLUTION_API_KEY.' },
                    { step: '3', title: 'Conecte via QR', desc: 'Volte na aba "QR Code", escaneie com seu WhatsApp e pronto!' },
                  ].map(s => (
                    <div key={s.step} className="flex gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary text-sm">{s.step}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noopener" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" /> Ver documentação
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Connected: quick stats */}
      {isConnected && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Webhook', value: 'Configurado', color: 'text-blue-500' },
            { label: 'Sincronização', value: 'Automática', color: 'text-purple-500' },
            { label: 'IA', value: 'Pronta', color: 'text-emerald-500' },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
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
