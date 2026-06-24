import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface CheckItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'ok' | 'error' | 'warning' | 'unchecked';
  helpUrl?: string;
}

export default function MetaChecklist() {
  const [items, setItems] = useState<CheckItem[]>([
    { id: 'live_mode', title: 'App no modo Live', description: 'Seu app Meta precisa estar em "Live" (não em Desenvolvimento) para funcionar em produção.', category: 'App Status', status: 'unchecked', helpUrl: 'https://developers.facebook.com/docs/development/release' },
    { id: 'wba_mgmt', title: 'Permissão whatsapp_business_management', description: 'Necessária para gerenciar contas do WhatsApp Business.', category: 'Permissões', status: 'unchecked', helpUrl: 'https://developers.facebook.com/docs/permissions' },
    { id: 'wba_msg', title: 'Permissão whatsapp_business_messaging', description: 'Necessária para enviar e receber mensagens via API.', category: 'Permissões', status: 'unchecked' },
    { id: 'webhook_cfg', title: 'Webhook configurado', description: 'URL do webhook deve ser configurada no painel Meta com o Verify Token correto.', category: 'Webhook', status: 'unchecked' },
    { id: 'phone_verified', title: 'Número de telefone verificado', description: 'O número WhatsApp Business deve estar verificado na conta Meta.', category: 'Número', status: 'unchecked' },
    { id: 'waba_active', title: 'WABA (WhatsApp Business Account) ativa', description: 'A conta WhatsApp Business Account deve estar aprovada pela Meta.', category: 'Conta', status: 'unchecked' },
    { id: 'business_verified', title: 'Empresa verificada na Meta', description: 'Para usar todas as funcionalidades, sua empresa deve ser verificada no Meta Business Manager.', category: 'Conta', status: 'unchecked' },
  ]);

  const toggleStatus = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const next: CheckItem['status'] = item.status === 'unchecked' ? 'ok' : item.status === 'ok' ? 'error' : 'unchecked';
      return { ...item, status: next };
    }));
  };

  const categories = [...new Set(items.map(i => i.category))];
  const okCount = items.filter(i => i.status === 'ok').length;
  const allOk = okCount === items.length;

  const getIcon = (status: CheckItem['status']) => {
    if (status === 'ok') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
    if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Checklist Meta / Facebook</h1>
          <p className="text-muted-foreground text-sm mt-1">Valide todas as configurações antes de conectar via WhatsApp Cloud API</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.info('Verificando configurações...')}>
          <RefreshCw className="w-4 h-4 mr-2" /> Verificar
        </Button>
      </div>

      {/* Progress */}
      <div className={`p-5 rounded-xl border ${allOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium text-foreground">{okCount}/{items.length} itens validados</p>
          <Badge className={allOk ? 'bg-emerald-500 text-white border-0' : 'bg-amber-500 text-white border-0'}>
            {allOk ? 'Tudo OK' : 'Incompleto'}
          </Badge>
        </div>
        <div className="w-full bg-white/30 dark:bg-black/20 rounded-full h-2">
          <div className="bg-gradient-brand h-2 rounded-full transition-all duration-500" style={{ width: `${(okCount / items.length) * 100}%` }} />
        </div>
      </div>

      {/* Items by category */}
      {categories.map(cat => (
        <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-3 border-b border-border bg-muted/30">
            <p className="text-sm font-semibold text-foreground">{cat}</p>
          </div>
          <div className="divide-y divide-border">
            {items.filter(i => i.category === cat).map(item => (
              <div key={item.id} className="flex items-start gap-4 px-6 py-4">
                <div className="mt-0.5 flex-shrink-0">{getIcon(item.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.helpUrl && (
                      <a href={item.helpUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                </div>
                <Switch
                  checked={item.status === 'ok'}
                  onCheckedChange={() => toggleStatus(item.id)}
                  className="flex-shrink-0 mt-0.5"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Nota importante</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Este checklist é para uso com a <strong>WhatsApp Cloud API (Meta)</strong>. Se você usar o método de conexão via QR Code (Z-API / Evolution API), muitos desses requisitos não se aplicam. Recomendamos o QR Code para começar sem configurações técnicas.
        </p>
      </div>
    </div>
  );
}
