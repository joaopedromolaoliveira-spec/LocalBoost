import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, MessageSquare, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { ROUTES } from '@/constants/routes';

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const password = watch('password', '');
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  const onSubmit = async (data: RegisterInput) => {
    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      company: data.company,
      phone: data.phone,
    });
    if (result.success) {
      toast.success('Conta criada! Seu teste grátis de 7 dias começou.');
      navigate(ROUTES.DASHBOARD);
    } else {
      toast.error(result.error || 'Erro ao criar conta');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-lg text-foreground">LocalBoost</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-1">Criar conta grátis</h1>
            <p className="text-muted-foreground text-sm">7 dias de teste. Sem cartão de crédito.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name">Nome completo *</Label>
                <Input id="name" placeholder="Seu nome" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" placeholder="Nome do negócio" {...register('company')} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" placeholder="(11) 99999-9999" {...register('phone')} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="flex gap-1 mt-1">
                  {[1,2,3].map(s => (
                    <div key={s} className={`h-1 flex-1 rounded-full ${strength >= s ? s === 1 ? 'bg-red-500' : s === 2 ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-muted'}`} />
                  ))}
                </div>
              )}
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirmar senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="acceptTerms"
                type="checkbox"
                {...register('acceptTerms')}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <Label htmlFor="acceptTerms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                Li e aceito os <a href="#" className="text-primary underline">Termos de Uso</a> e a{' '}
                <a href="#" className="text-primary underline">Política de Privacidade</a>
              </Label>
            </div>
            {errors.acceptTerms && <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>}

            <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90 text-white font-semibold" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando conta...</> : 'Criar conta grátis'}
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-2">
            {['7 dias grátis', 'Sem cartão', 'Cancele quando quiser'].map((b, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-primary" />{b}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Já tem conta?{' '}
            <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
