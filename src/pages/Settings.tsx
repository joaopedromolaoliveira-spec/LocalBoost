import { useState } from 'react';
import { User, Lock, Bell, Shield, Key, Eye, EyeOff, Loader2, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Settings() {
  const { user, updateUser, changePassword, enableTwoFactor, verifyTwoFactor, disableTwoFactor } = useAuthStore();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', company: user?.company || '', phone: user?.phone || '' });
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false });
  const [loading, setLoading] = useState('');
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'setup' | 'verify' | 'done'>('idle');
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [notifications, setNotifications] = useState({ email: true, whatsapp: false, browser: true });

  const handleSaveProfile = async () => {
    if (!profile.name || !profile.email) { toast.error('Nome e email são obrigatórios'); return; }
    setLoading('profile');
    await new Promise(r => setTimeout(r, 600));
    updateUser({ name: profile.name, email: profile.email, company: profile.company, phone: profile.phone });
    setLoading('');
    toast.success('Perfil atualizado!');
  };

  const handleChangePassword = async () => {
    if (!pwdForm.current || !pwdForm.new || !pwdForm.confirm) { toast.error('Preencha todos os campos'); return; }
    if (pwdForm.new !== pwdForm.confirm) { toast.error('Senhas não conferem'); return; }
    if (pwdForm.new.length < 8) { toast.error('Nova senha deve ter no mínimo 8 caracteres'); return; }
    setLoading('password');
    const result = await changePassword(pwdForm.current, pwdForm.new);
    setLoading('');
    if (result.success) {
      setPwdForm({ current: '', new: '', confirm: '' });
      toast.success('Senha alterada com sucesso!');
    } else {
      toast.error(result.error || 'Erro ao alterar senha');
    }
  };

  const handleEnable2FA = async () => {
    setLoading('2fa');
    const result = await enableTwoFactor();
    setTwoFASecret(result.secret);
    setLoading('');
    setTwoFAStep('setup');
  };

  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) { toast.error('Código deve ter 6 dígitos'); return; }
    setLoading('2fa-verify');
    const result = await verifyTwoFactor(twoFACode);
    setLoading('');
    if (result.success) {
      setTwoFAStep('done');
      toast.success('2FA ativado com sucesso!');
    } else {
      toast.error(result.error);
    }
  };

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) { toast.error('Código inválido'); return; }
    setLoading('2fa-disable');
    const result = await disableTwoFactor(disableCode);
    setLoading('');
    if (result.success) {
      setTwoFAStep('idle');
      setDisableCode('');
      toast.success('2FA desativado.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie sua conta e preferências</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-1.5" />Perfil</TabsTrigger>
          <TabsTrigger value="security"><Lock className="w-4 h-4 mr-1.5" />Segurança</TabsTrigger>
          <TabsTrigger value="2fa"><Shield className="w-4 h-4 mr-1.5" />2FA</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1.5" />Notificações</TabsTrigger>
          <TabsTrigger value="api"><Key className="w-4 h-4 mr-1.5" />API</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-brand text-white text-xl font-bold">{getInitials(user?.name || 'U')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {user?.emailVerified ? (
                  <Badge className="mt-1 bg-emerald-500/10 text-emerald-600 border-0 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Email verificado</Badge>
                ) : (
                  <Badge className="mt-1 bg-amber-500/10 text-amber-600 border-0 text-xs">Email não verificado</Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Empresa</Label><Input value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} className="mt-1" /></div>
              <div><Label>Email *</Label><Input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
              <div><Label>WhatsApp</Label><Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
            </div>
            <Button onClick={handleSaveProfile} disabled={loading === 'profile'} className="bg-gradient-brand text-white hover:opacity-90">
              {loading === 'profile' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar perfil'}
            </Button>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Alterar senha</h3>
            <div>
              <Label>Senha atual</Label>
              <div className="relative mt-1">
                <Input type={showPwd.current ? 'text' : 'password'} value={pwdForm.current} onChange={e => setPwdForm(p => ({ ...p, current: e.target.value }))} className="pr-10" />
                <button type="button" onClick={() => setShowPwd(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Nova senha</Label>
              <div className="relative mt-1">
                <Input type={showPwd.new ? 'text' : 'password'} value={pwdForm.new} onChange={e => setPwdForm(p => ({ ...p, new: e.target.value }))} className="pr-10" placeholder="Mínimo 8 caracteres" />
                <button type="button" onClick={() => setShowPwd(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div><Label>Confirmar nova senha</Label><Input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} className="mt-1" /></div>
            <Button onClick={handleChangePassword} disabled={loading === 'password'} className="bg-gradient-brand text-white hover:opacity-90">
              {loading === 'password' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Alterando...</> : 'Alterar senha'}
            </Button>
          </div>
        </TabsContent>

        {/* 2FA */}
        <TabsContent value="2fa">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Verificação em duas etapas (2FA)</h3>
                <p className="text-sm text-muted-foreground mt-1">Adicione uma camada extra de segurança à sua conta usando um app autenticador (Google Authenticator, Authy).</p>
              </div>
            </div>

            {!user?.twoFactorEnabled && twoFAStep === 'idle' && (
              <Button onClick={handleEnable2FA} disabled={loading === '2fa'} className="bg-gradient-brand text-white hover:opacity-90">
                {loading === '2fa' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Configurando...</> : 'Ativar 2FA'}
              </Button>
            )}

            {twoFAStep === 'setup' && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm font-medium text-foreground mb-2">1. Copie o código secreto</p>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-2">
                    <code className="text-xs font-mono text-foreground flex-1">{twoFASecret}</code>
                    <button onClick={() => { navigator.clipboard.writeText(twoFASecret); toast.success('Código copiado!'); }}>
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">2. Abra seu app autenticador e adicione manualmente com este código.</p>
                </div>
                <div>
                  <Label>3. Insira o código de 6 dígitos gerado</Label>
                  <Input value={twoFACode} onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} className="mt-1 text-center text-2xl tracking-widest font-mono" />
                </div>
                <Button onClick={handleVerify2FA} disabled={loading === '2fa-verify'} className="bg-gradient-brand text-white hover:opacity-90">
                  {loading === '2fa-verify' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</> : 'Confirmar e ativar'}
                </Button>
              </div>
            )}

            {(user?.twoFactorEnabled || twoFAStep === 'done') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-sm font-medium">2FA está ativo na sua conta</p>
                </div>
                <div>
                  <Label>Código para desativar 2FA</Label>
                  <Input value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} className="mt-1 text-center text-xl tracking-widest font-mono" />
                </div>
                <Button variant="outline" onClick={handleDisable2FA} disabled={loading === '2fa-disable'} className="text-red-500 border-red-500/30 hover:bg-red-500/10">
                  {loading === '2fa-disable' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Desativando...</> : 'Desativar 2FA'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Preferências de notificação</h3>
            {[
              { key: 'email', label: 'Notificações por email', desc: 'Receba atualizações sobre campanhas e leads' },
              { key: 'whatsapp', label: 'Alertas via WhatsApp', desc: 'Notificações sobre novas mensagens e leads' },
              { key: 'browser', label: 'Notificações do navegador', desc: 'Alertas em tempo real no navegador' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch checked={notifications[n.key as keyof typeof notifications]} onCheckedChange={v => setNotifications(p => ({ ...p, [n.key]: v }))} />
              </div>
            ))}
            <Button onClick={() => toast.success('Preferências salvas!')} className="bg-gradient-brand text-white hover:opacity-90">Salvar preferências</Button>
          </div>
        </TabsContent>

        {/* API */}
        <TabsContent value="api">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Chaves de API</h3>
              <Badge variant="outline" className="text-xs">Plano Business necessário</Badge>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl text-center">
              <Key className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Acesso à API disponível no plano Business.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => toast.info('Faça upgrade para o plano Business')}>Ver planos</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
