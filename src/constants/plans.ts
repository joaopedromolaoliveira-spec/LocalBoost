import type { Plan } from '@/types';

export const MASTER_ADMIN_EMAIL = 'joaopedromoladeoliveira@gmail.com';
export const TRIAL_DAYS = 7;
export const WEBHOOK_BASE_URL = 'https://api.localboost.app/webhook/whatsapp';

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfeito para começar sua automação no WhatsApp',
    monthlyPrice: 27,
    annualPrice: 270,
    features: [
      '1 número WhatsApp',
      '1.000 mensagens/mês',
      'Automações básicas (5 fluxos)',
      'Chatbot de respostas automáticas',
      'CRM básico (500 contatos)',
      'Relatórios básicos',
      'Suporte por email',
      '7 dias de teste grátis',
    ],
    limits: {
      whatsappNumbers: 1,
      messagesPerMonth: 1000,
      contacts: 500,
      automations: 5,
      teamMembers: 1,
      campaigns: 3,
    },
    gradient: 'from-emerald-500 to-green-600',
    badge: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para negócios que querem crescer com IA e CRM completo',
    monthlyPrice: 67,
    annualPrice: 670,
    features: [
      '5 números WhatsApp',
      'Mensagens ilimitadas',
      'Chatbot com IA (OpenAI)',
      'CRM completo (5.000 contatos)',
      'Automações ilimitadas',
      'Campanhas avançadas',
      'Relatórios detalhados + exportação',
      'Equipe até 5 agentes',
      'Suporte prioritário',
      '7 dias de teste grátis',
    ],
    limits: {
      whatsappNumbers: 5,
      messagesPerMonth: 'unlimited',
      contacts: 5000,
      automations: 'unlimited',
      teamMembers: 5,
      campaigns: 'unlimited',
    },
    popular: true,
    gradient: 'from-blue-500 to-indigo-600',
    badge: 'Mais popular',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Solução enterprise para agências e grandes negócios',
    monthlyPrice: 147,
    annualPrice: 1470,
    features: [
      'Números WhatsApp ilimitados',
      'Automações ilimitadas',
      'Suite de IA completa',
      'CRM ilimitado',
      'Equipe ilimitada',
      'API de integração completa',
      'White-label disponível',
      'Domínio personalizado',
      'Relatórios avançados + BI',
      'Suporte premium 24/7',
      'Gerente de conta dedicado',
      '7 dias de teste grátis',
    ],
    limits: {
      whatsappNumbers: 'unlimited',
      messagesPerMonth: 'unlimited',
      contacts: 'unlimited',
      automations: 'unlimited',
      teamMembers: 'unlimited',
      campaigns: 'unlimited',
    },
    gradient: 'from-purple-500 to-pink-600',
    badge: 'Enterprise',
  },
];

export const PLAN_NAMES: Record<string, string> = {
  free: 'Gratuito',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
};

export const STATUS_LABELS: Record<string, string> = {
  trial: 'Teste Grátis',
  active: 'Ativo',
  canceled: 'Cancelado',
  suspended: 'Suspenso',
  expired: 'Expirado',
};

export const ROLE_LABELS: Record<string, string> = {
  master_admin: 'Admin Master',
  admin: 'Administrador',
  manager: 'Gerente',
  agent: 'Agente',
  user: 'Usuário',
};
