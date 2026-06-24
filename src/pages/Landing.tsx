import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import PlanCard from '@/components/features/PlanCard';
import { PLANS } from '@/constants/plans';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types';
import {
  MessageSquare, Zap, Users, Brain, BarChart3, Shield,
  CheckCircle, ArrowRight, ChevronDown, ChevronUp,
  Megaphone, CreditCard, Star, Smartphone,
} from 'lucide-react';
import heroImg from '@/assets/hero.jpg';

const features = [
  { icon: MessageSquare, title: 'WhatsApp Automation', desc: 'Conecte via QR Code e automatize todas as conversas sem configuração técnica.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Brain, title: 'Assistente IA', desc: 'Chatbot treinado com seu conteúdo. Qualifica leads e responde dúvidas 24/7.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Users, title: 'CRM Completo', desc: 'Gerencie contatos, acompanhe o pipeline de vendas e histórico de cada cliente.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { icon: Megaphone, title: 'Campanhas em Massa', desc: 'Envie mensagens segmentadas para centenas de clientes com um clique.', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { icon: BarChart3, title: 'Relatórios Reais', desc: 'Métricas e análises baseadas em dados reais do seu negócio.', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { icon: Shield, title: 'Segurança Total', desc: 'JWT, 2FA, criptografia e boas práticas OWASP para proteger seu negócio.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

const steps = [
  { n: '01', title: 'Crie sua conta', desc: 'Registre-se em menos de 2 minutos. Teste grátis por 7 dias sem cartão.' },
  { n: '02', title: 'Conecte o WhatsApp', desc: 'Escaneie o QR Code ou insira seu número. Pronto para usar em segundos.' },
  { n: '03', title: 'Automatize e venda', desc: 'Configure fluxos, chatbot IA e campanhas. Comece a converter clientes.' },
];

const faqs = [
  { q: 'Preciso de conta Meta/Facebook para usar?', a: 'Não! No plano básico você conecta via QR Code, igual ao WhatsApp Web. Sem configurações técnicas.' },
  { q: 'Qual é a diferença do plano mensal e anual?', a: 'O plano anual tem desconto de até 17%. Starter: R$27/mês ou R$270/ano. Pro: R$67/mês ou R$670/ano. Business: R$147/mês ou R$1.470/ano.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Você pode cancelar a qualquer momento. Sua conta fica ativa até o fim do período pago.' },
  { q: 'O chatbot IA funciona com que idioma?', a: 'O assistente IA funciona principalmente em Português (BR), mas pode ser configurado para outros idiomas.' },
  { q: 'Quantas pessoas podem usar a mesma conta?', a: 'Depende do plano: Starter (1 agente), Pro (5 agentes), Business (ilimitados).' },
  { q: 'Os dados são seguros?', a: 'Sim. Utilizamos criptografia AES-256, autenticação JWT e 2FA. Todos os dados são protegidos conforme LGPD.' },
];

const niches = ['Restaurantes', 'Lojas', 'Salões de Beleza', 'Clínicas', 'Academias', 'Delivery', 'Oficinas', 'Prestadores de Serviço'];

export default function Landing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={heroImg} alt="LocalBoost Hero" className="w-full h-full object-cover opacity-20 dark:opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70" />
        </div>
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <div className="flex flex-wrap gap-2 mb-6">
              {niches.slice(0, 4).map(n => (
                <Badge key={n} variant="outline" className="text-xs border-primary/30 text-primary">{n}</Badge>
              ))}
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">+mais</Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground leading-tight mb-6">
              Transformando{' '}
              <span className="text-gradient">conversas</span>{' '}
              em clientes.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Automatize seu WhatsApp, qualifique leads com IA, gerencie seu CRM e aumente suas vendas — tudo em uma única plataforma para negócios locais.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-brand hover:opacity-90 text-white text-base px-8 w-full sm:w-auto">
                  Começar 7 dias grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-base px-8 w-full sm:w-auto">
                  Já tenho conta
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              ✓ 7 dias grátis &nbsp;·&nbsp; ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Cancele quando quiser
            </p>
          </div>

          {/* Phone mockup */}
          <div className="hidden lg:flex justify-center animate-float">
            <div className="relative">
              <div className="w-72 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-whatsapp-700 px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">LocalBoost Bot</p>
                    <p className="text-white/70 text-xs">online</p>
                  </div>
                </div>
                <div className="p-4 space-y-3 bg-background min-h-[280px]">
                  {[
                    { from: 'bot', msg: 'Olá! Como posso ajudar hoje? 😊' },
                    { from: 'user', msg: 'Quero saber sobre os preços' },
                    { from: 'bot', msg: 'Claro! Temos planos a partir de R$27/mês. Quer conhecer?' },
                    { from: 'user', msg: 'Sim!' },
                    { from: 'bot', msg: '✅ Ótimo! Enviando o catálogo agora...' },
                  ].map((m, i) => (
                    <div key={i} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[80%] px-3 py-2 rounded-2xl text-xs',
                        m.from === 'user'
                          ? 'bg-whatsapp-500 text-white rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      )}>
                        {m.msg}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-3 -right-3 bg-primary text-white text-xs rounded-full px-2 py-1 font-medium">
                IA ativa ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Niches bar */}
      <section className="border-y border-border bg-muted/30 py-4 overflow-hidden">
        <div className="flex gap-6 animate-none px-4">
          {[...niches, ...niches].map((n, i) => (
            <span key={i} className="text-sm text-muted-foreground whitespace-nowrap flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-primary" /> {n}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-0 mb-4">Funcionalidades</Badge>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Tudo que seu negócio precisa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Uma plataforma completa para automatizar, vender e fidelizar clientes via WhatsApp.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-200 group">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', f.bg)}>
                <f.icon className={cn('w-6 h-6', f.color)} />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-0 mb-4">Como funciona</Badge>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">Simples de começar</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Sem configurações técnicas. Sem API da Meta. Conecte seu WhatsApp via QR Code em segundos.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-2/3 w-full h-px border-t-2 border-dashed border-border" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 text-white font-heading font-bold text-lg">
                  {s.n}
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-0 mb-4">Planos e Preços</Badge>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Simples, transparente e justo
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Comece grátis por 7 dias. Sem cartão de crédito. Cancele a qualquer momento.
          </p>
          <div className="inline-flex bg-muted rounded-xl p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', billing === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2', billing === 'annual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
            >
              Anual
              <Badge className="bg-emerald-500 text-white border-0 text-xs">-17%</Badge>
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-start mt-8">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingPeriod={billing}
              onSelect={() => window.location.href = '/register'}
            />
          ))}
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="bg-primary/10 text-primary border-0 mb-4">Depoimentos</Badge>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-3">O que dizem nossos clientes</h2>
          <p className="text-muted-foreground">Seja um dos primeiros a transformar seu negócio com o LocalBoost.</p>
          <div className="mt-8 flex justify-center gap-1">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Aguardando os primeiros depoimentos</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-0 mb-4">FAQ</Badge>
          <h2 className="text-3xl font-heading font-bold text-foreground mb-4">Perguntas frequentes</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-foreground text-sm">{f.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-brand">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Comece hoje. 7 dias grátis. Sem cartão de crédito.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 text-base px-10 font-semibold">
              Criar conta grátis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-brand rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-foreground">LocalBoost</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Transformando conversas em clientes para negócios locais em todo o Brasil.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Produto</h4>
            <ul className="space-y-2">
              {['Funcionalidades', 'Preços', 'Segurança', 'API'].map(l => (
                <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3 text-sm">Empresa</h4>
            <ul className="space-y-2">
              {['Sobre nós', 'Blog', 'Suporte', 'Termos de Uso', 'Privacidade'].map(l => (
                <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2025 LocalBoost. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Pagamento seguro via Stripe</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
