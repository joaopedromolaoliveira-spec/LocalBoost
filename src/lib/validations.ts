import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(80, 'Nome muito longo'),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  company: z.string().min(2, 'Nome da empresa muito curto').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone inválido').optional().or(z.literal('')),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  company: z.string().optional(),
  phone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  company: z.string().optional(),
  status: z.enum(['lead', 'customer', 'prospect', 'inactive']),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  message: z.string().min(10, 'Mensagem muito curta').max(4096, 'Mensagem muito longa'),
  type: z.enum(['broadcast', 'sequence', 'trigger']),
  scheduledAt: z.string().optional(),
  tags: z.string().optional(),
});

export const automationSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  description: z.string().optional(),
  trigger: z.string().min(1, 'Gatilho é obrigatório'),
  triggerKeyword: z.string().optional(),
});

export const aiTrainingSchema = z.object({
  question: z.string().min(3, 'Pergunta muito curta').max(500, 'Pergunta muito longa'),
  answer: z.string().min(3, 'Resposta muito curta').max(2000, 'Resposta muito longa'),
  category: z.string().optional(),
});

export const inviteTeamSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'manager', 'agent']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type AutomationInput = z.infer<typeof automationSchema>;
export type AITrainingInput = z.infer<typeof aiTrainingSchema>;
export type InviteTeamInput = z.infer<typeof inviteTeamSchema>;
