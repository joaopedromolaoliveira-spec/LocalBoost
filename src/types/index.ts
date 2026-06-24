export type UserRole = 'master_admin' | 'admin' | 'manager' | 'agent' | 'user';
export type PlanId = 'free' | 'starter' | 'pro' | 'business';
export type SubscriptionStatus = 'trial' | 'active' | 'canceled' | 'suspended' | 'expired';
export type ContactStatus = 'lead' | 'customer' | 'prospect' | 'inactive';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
export type AutomationStatus = 'active' | 'inactive' | 'draft';
export type TeamRole = 'admin' | 'manager' | 'agent';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type ConnectionMethod = 'qr' | 'phone';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: PlanId;
  avatar?: string;
  phone?: string;
  company?: string;
  trialStartDate?: string;
  trialEndDate?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan?: PlanId;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  createdAt: string;
  lastLoginAt?: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  whatsappConnected: boolean;
  whatsappNumber?: string;
  premiumGrantedBy?: string;
  premiumGrantedAt?: string;
  suspended?: boolean;
}

export interface WhatsAppConnection {
  userId: string;
  status: ConnectionStatus;
  phoneNumber?: string;
  qrCode?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  method: ConnectionMethod;
  sessionToken?: string;
  webhookVerified?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'failed';
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  tags: string[];
  status: ContactStatus;
  notes?: string;
  source?: string;
  createdAt: string;
  lastContactAt?: string;
  totalMessages: number;
  stage?: string;
  value?: number;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  message: string;
  type: 'broadcast' | 'sequence' | 'trigger';
  status: CampaignStatus;
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  responseCount: number;
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
  tags?: string[];
}

export interface Automation {
  id: string;
  userId: string;
  name: string;
  description?: string;
  trigger: string;
  triggerKeyword?: string;
  status: AutomationStatus;
  totalRuns: number;
  successRate: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
  nodes?: AutomationNode[];
}

export interface AutomationNode {
  id: string;
  type: 'trigger' | 'message' | 'condition' | 'delay' | 'action' | 'end';
  label: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
  connections: string[];
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'active' | 'inactive' | 'pending';
  assignedContacts: number;
  messagesHandled: number;
  avatar?: string;
  invitedAt: string;
  joinedAt?: string;
}

export interface AITrainingItem {
  id: string;
  userId: string;
  question: string;
  answer: string;
  category?: string;
  active: boolean;
  createdAt: string;
}

export interface AIConfig {
  userId: string;
  model: string;
  personality: string;
  greetingMessage: string;
  fallbackMessage: string;
  qualifyLeads: boolean;
  autoSummary: boolean;
  language: string;
  updatedAt: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    whatsappNumbers: number | 'unlimited';
    messagesPerMonth: number | 'unlimited';
    contacts: number | 'unlimited';
    automations: number | 'unlimited';
    teamMembers: number | 'unlimited';
    campaigns: number | 'unlimited';
  };
  popular?: boolean;
  gradient: string;
  badge?: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'message' | 'lead' | 'sale' | 'automation' | 'campaign' | 'connection' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  plan: PlanId;
  period: 'monthly' | 'annual';
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  invoiceUrl?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface WaContact {
  id: string;
  user_id: string;
  instance_id?: string;
  phone: string;
  name?: string;
  profile_picture_url?: string;
  tags?: string[];
  notes?: string;
  lead_status: 'new' | 'qualified' | 'converted';
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface WaConversation {
  id: string;
  user_id: string;
  instance_id?: string;
  contact_id: string;
  status: 'open' | 'closed' | 'pending';
  assigned_agent_id?: string;
  ai_active: boolean;
  last_message?: string;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
  wa_contacts?: WaContact;
}

export interface WaMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  external_id?: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'customer' | 'ai' | 'agent' | 'system';
  content?: string;
  media_type: string;
  media_url?: string;
  status: string;
  created_at: string;
}

export interface AiTrainingData {
  id: string;
  user_id: string;
  type: 'faq' | 'product' | 'service' | 'policy' | 'script' | 'info' | 'document';
  title: string;
  content: string;
  file_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiSettings {
  id: string;
  user_id: string;
  company_name?: string;
  company_description?: string;
  ai_name: string;
  ai_personality: string;
  greeting_message?: string;
  handoff_keywords?: string[];
  auto_respond: boolean;
  response_delay_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppInstance {
  id: string;
  user_id: string;
  instance_name: string;
  phone_number?: string;
  profile_name?: string;
  profile_picture_url?: string;
  status: 'disconnected' | 'connecting' | 'qr' | 'connected';
  qr_code?: string;
  last_qr_at?: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalMessages: number;
  leadsGenerated: number;
  salesConversions: number;
  revenue: number;
  activeContacts: number;
  automationsRunning: number;
  messagesThisMonth: number;
  conversionRate: number;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  canceledSubscriptions: number;
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  mrr: number;
  arr: number;
  churnRate: number;
  premiumUsers: number;
  ltv: number;
  newSubscribersThisMonth: number;
}
