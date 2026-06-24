import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageSquare, Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations';
import { ROUTES } from '@/constants/routes';

export default function ForgotPassword() {
  const { forgotPassword } = useAuthStore();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    await forgotPassword(data.email);
    setSentEmail(data.email);
    setSent(true);
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
          {!sent ? (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-heading font-bold text-foreground mb-1">Esqueci minha senha</h1>
                <p className="text-muted-foreground text-sm">
                  Informe seu email e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email cadastrado</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90 text-white font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : 'Enviar link de redefinição'}
                </Button>
              </form>

              <Link to={ROUTES.LOGIN} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Voltar para login
              </Link>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">Email enviado!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                Se o email <strong className="text-foreground">{sentEmail}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
              </p>
              <p className="text-xs text-muted-foreground mb-6">Verifique também a pasta de spam.</p>
              <Link to={ROUTES.LOGIN}>
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
