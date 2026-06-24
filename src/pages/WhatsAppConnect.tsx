import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Phone, CheckCircle, WifiOff, Loader2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import QRCodeConnect from '@/components/features/QRCodeConnect';
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function WhatsAppConnect() {
  const { user, updateUser } = useAuthStore();
  const [phoneInput, setPhoneInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const isConnected = user?.whatsappConnected;

  const handleQRConnected = (phone: string) => {
    updateUser({ whatsappConnected: true, whatsappNumber: phone });
    toast.success('WhatsApp conectado com sucesso!');
  };

  const handleDisconnect = () => {
    updateUser({ whatsappConnected: false, whatsappNumber: undefined });
    toast.info('WhatsApp desconectado.');
  };

  const handleSendOTP = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      toast.error('Informe um número válido');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setOtpSent(true);
    toast.success('Código enviado para ' + phoneInput);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { toast.error('Código deve ter 6 dígitos'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    updateUser({ whatsappConnected: true, whatsappNumber: phoneInput });
    toast.success('WhatsApp conectado!');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Conexão WhatsApp</h1>
        <p className="text-muted-foreground text-sm mt-1">Conecte seu número para iniciar a automação. Sem configuração técnica.</p>
      </div>

      {/* Status */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/50 border-border'}`}>
        <div className="flex items-center gap-3">
          {isConnected ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium text-foreground">{isConnected ? 'WhatsApp Conectado' : 'Não conectado'}</p>
            {isConnected && user?.whatsappNumber && (
              <p className="text-xs text-muted-foreground">{user.whatsappNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={isConnected ? 'bg-emerald-500 text-white border-0' : 'bg-muted text-muted-foreground border-0'}>
            {isConnected ? 'Online' : 'Offline'}
          </Badge>
          {isConnected && (
            <Button size="sm" variant="outline" onClick={handleDisconnect} className="text-red-500 border-red-500/30 hover:bg-red-500/10">
              Desconectar
            </Button>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="bg-card border border-border rounded-xl p-6">
          <Tabs defaultValue="qr">
            <TabsList className="mb-6">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" /> QR Code
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Número
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr">
              <div className="text-center mb-4">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-0 mb-2">Recomendado</Badge>
                <p className="text-sm text-muted-foreground">Escaneie o QR Code com seu WhatsApp para conectar instantaneamente</p>
              </div>
              <div className="flex justify-center">
                <QRCodeConnect onConnected={handleQRConnected} />
              </div>
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Abra o WhatsApp → Toque em ⋮ (3 pontos) → Aparelhos conectados → Conectar aparelho → Escaneie o QR Code
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="phone">
              <div className="max-w-sm mx-auto space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Número do WhatsApp</p>
                  <p className="text-xs text-muted-foreground mb-3">Informe o número com DDD e código do país</p>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted border border-border rounded-lg text-sm font-medium text-foreground">+55</div>
                    <Input
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="(11) 99999-9999"
                      maxLength={11}
                      disabled={otpSent}
                    />
                  </div>
                </div>
                {!otpSent ? (
                  <Button onClick={handleSendOTP} disabled={loading} className="w-full bg-gradient-brand text-white hover:opacity-90">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : 'Enviar código de verificação'}
                  </Button>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Código de verificação</p>
                      <Input
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="text-center text-2xl tracking-widest font-mono"
                      />
                    </div>
                    <Button onClick={handleVerifyOTP} disabled={loading} className="w-full bg-gradient-brand text-white hover:opacity-90">
                      {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</> : 'Verificar e conectar'}
                    </Button>
                    <button onClick={() => setOtpSent(false)} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">
                      Usar outro número
                    </button>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {isConnected && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Status', value: 'Conectado', color: 'text-emerald-500' },
            { label: 'Webhook', value: 'Ativo', color: 'text-blue-500' },
            { label: 'Sincronização', value: 'Automática', color: 'text-purple-500' },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Link to={ROUTES.WHATSAPP_STATUS}>
          <Button variant="outline" size="sm">
            <LinkIcon className="w-4 h-4 mr-2" /> Ver status detalhado
          </Button>
        </Link>
        <Link to={ROUTES.WHATSAPP_CHECKLIST}>
          <Button variant="outline" size="sm">Checklist Meta</Button>
        </Link>
      </div>
    </div>
  );
}
