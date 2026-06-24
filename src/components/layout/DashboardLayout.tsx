import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import TrialBanner from '@/components/features/TrialBanner';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Header sidebarCollapsed={collapsed} />
      <main className={cn('pt-16 min-h-screen transition-all duration-300', collapsed ? 'ml-16' : 'ml-64')}>
        <TrialBanner />
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
