import { Bell, Sun, Moon, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { getInitials, getTrialDaysLeft } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { PLAN_NAMES } from '@/constants/plans';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export default function Header({ sidebarCollapsed }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();

  const daysLeft = getTrialDaysLeft(user?.trialEndDate);
  const isTrial = user?.subscriptionStatus === 'trial';

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-background/95 backdrop-blur border-b border-border z-30 flex items-center gap-3 px-4 md:px-6 transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-64'}`}
    >
      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 h-9">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1 min-w-0"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Trial badge */}
        {isTrial && daysLeft <= 7 && (
          <Link to={ROUTES.BILLING}>
            <Badge variant="outline" className="text-amber-500 border-amber-500/50 hidden sm:flex text-xs">
              {daysLeft}d restantes
            </Badge>
          </Link>
        )}

        {/* Plan badge */}
        {user && user.subscriptionStatus === 'active' && (
          <Badge className="bg-primary/10 text-primary border-0 hidden sm:flex text-xs">
            {PLAN_NAMES[user.plan] || user.plan}
          </Badge>
        )}

        {/* Theme */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="w-4 h-4" />
        </Button>

        {/* User */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-white text-xs font-bold">
              {user ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block leading-tight">
            <p className="text-xs font-medium text-foreground">{user?.name?.split(' ')[0]}</p>
            <p className="text-[10px] text-muted-foreground">{user?.role === 'master_admin' ? 'Admin Master' : 'Usuário'}</p>
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" />
        </div>
      </div>
    </header>
  );
}
