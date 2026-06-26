import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, MessageSquare, Users, Zap, Megaphone,
  Brain, UserCheck, BarChart3, CreditCard, Settings,
  Shield, ChevronLeft, ChevronRight, LogOut, Wifi,
  CheckSquare, Activity, Inbox, Stethoscope,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  adminOnly?: boolean;
  children?: { label: string; icon: React.ComponentType<{ className?: string }>; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Caixa de Entrada', icon: Inbox, href: '/dashboard/inbox' },
  {
    label: 'WhatsApp',
    icon: MessageSquare,
    href: '/dashboard/whatsapp',
    children: [
      { label: 'Conectar', icon: Wifi, href: '/dashboard/whatsapp' },
      { label: 'Status', icon: Activity, href: '/dashboard/whatsapp/status' },
      { label: 'Checklist Meta', icon: CheckSquare, href: '/dashboard/whatsapp/checklist' },
      { label: 'Diagnóstico', icon: Stethoscope, href: '/dashboard/whatsapp/diagnostics' },
    ],
  },
  { label: 'CRM / Contatos', icon: Users, href: '/dashboard/crm' },
  { label: 'Automações', icon: Zap, href: '/dashboard/automations' },
  { label: 'Campanhas', icon: Megaphone, href: '/dashboard/campaigns' },
  { label: 'Assistente IA', icon: Brain, href: '/dashboard/ai' },
  { label: 'Equipe', icon: UserCheck, href: '/dashboard/team' },
  { label: 'Relatórios', icon: BarChart3, href: '/dashboard/reports' },
  { label: 'Financeiro', icon: CreditCard, href: '/dashboard/billing' },
  { label: 'Configurações', icon: Settings, href: '/dashboard/settings' },
  { label: 'Painel Admin', icon: Shield, href: '/admin', adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export default function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [expanded, setExpanded] = useState<string[]>(['/dashboard/whatsapp']);

  const isActive = (href: string) =>
    href === '/dashboard' ? location.pathname === href : location.pathname.startsWith(href);

  const toggleExpanded = (href: string) =>
    setExpanded(prev => prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]);

  const visible = navItems.filter(i => !i.adminOnly || user?.role === 'master_admin');

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 flex flex-col',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-sidebar-border gap-3', collapsed && 'justify-center')}>
        <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="font-heading font-bold text-foreground text-base leading-none">LocalBoost</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">WhatsApp Automation</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visible.map(item => (
          <div key={item.href}>
            {item.children ? (
              <>
                <button
                  onClick={() => !collapsed && toggleExpanded(item.href)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'sidebar-item w-full',
                    isActive(item.href) ? 'sidebar-item-active' : 'sidebar-item-inactive',
                    collapsed && 'justify-center'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className={cn('w-4 h-4 transition-transform', expanded.includes(item.href) && 'rotate-90')} />
                    </>
                  )}
                </button>
                {!collapsed && expanded.includes(item.href) && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={cn(
                          'sidebar-item text-xs',
                          location.pathname === child.href ? 'sidebar-item-active' : 'sidebar-item-inactive'
                        )}
                      >
                        <child.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'sidebar-item',
                  isActive(item.href) ? 'sidebar-item-active' : 'sidebar-item-inactive',
                  collapsed && 'justify-center'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Sair' : undefined}
          className={cn('sidebar-item sidebar-item-inactive w-full text-red-500 hover:text-red-500 hover:bg-red-500/10', collapsed && 'justify-center')}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={() => onCollapse(!collapsed)}
          className="sidebar-item sidebar-item-inactive w-full justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="flex-1 text-left text-xs ml-2">Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
