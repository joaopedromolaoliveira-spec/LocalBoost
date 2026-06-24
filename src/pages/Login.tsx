import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { ROUTES } from '@/constants/routes';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success('Bem-vindo de volta!');
      navigate(ROUTES.DASHBOARD);
    } else {
      toast.error(result.error || 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">LocalBoost</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-heading font-bold text-foreground mb-1">Bem-vindo de volta</h1>
            <p className="text-muted-foreground text-sm">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-brand hover:opacity-90 text-white font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</> : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link to={ROUTES.REGISTER} className="text-primary font-medium hover:underline">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right - branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-brand items-center justify-center p-12">
        <div className="text-center text-white max-w-sm">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-heading font-bold mb-4">LocalBoost</h2>
          <p className="text-white/80 text-lg leading-relaxed">
            "Transformando conversas em clientes."
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Planos', value: 'a partir de R$27' },
              { label: 'Trial', value: '7 dias grátis' },
              { label: 'Suporte', value: 'Prioritário' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3">
                <p className="text-white font-semibold text-sm">{s.value}</p>
                <p className="text-white/70 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
