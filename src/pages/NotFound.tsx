import { Link } from 'react-router-dom';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-7xl font-heading font-bold text-foreground mb-2">404</h1>
        <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">Página não encontrada</h2>
        <p className="text-muted-foreground mb-8">A página que você está procurando não existe ou foi movida.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Ir para Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button className="bg-gradient-brand hover:opacity-90 text-white">
              Ir para Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
