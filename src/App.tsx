import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuthStore } from '@/stores/authStore';
import { ThemeProvider } from '@/stores/themeStore';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import WhatsAppConnect from '@/pages/WhatsAppConnect';
import WhatsAppStatus from '@/pages/WhatsAppStatus';
import MetaChecklist from '@/pages/MetaChecklist';
import CRM from '@/pages/CRM';
import Automations from '@/pages/Automations';
import Campaigns from '@/pages/Campaigns';
import AIAssistant from '@/pages/AIAssistant';
import Team from '@/pages/Team';
import Reports from '@/pages/Reports';
import Billing from '@/pages/Billing';
import AdminPanel from '@/pages/AdminPanel';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import type { ReactNode } from 'react';

function Spinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'master_admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <Spinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DashboardPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

        {/* Protected dashboard */}
        <Route path="/dashboard" element={<DashboardPage><Dashboard /></DashboardPage>} />
        <Route path="/dashboard/whatsapp" element={<DashboardPage><WhatsAppConnect /></DashboardPage>} />
        <Route path="/dashboard/whatsapp/status" element={<DashboardPage><WhatsAppStatus /></DashboardPage>} />
        <Route path="/dashboard/whatsapp/checklist" element={<DashboardPage><MetaChecklist /></DashboardPage>} />
        <Route path="/dashboard/crm" element={<DashboardPage><CRM /></DashboardPage>} />
        <Route path="/dashboard/automations" element={<DashboardPage><Automations /></DashboardPage>} />
        <Route path="/dashboard/campaigns" element={<DashboardPage><Campaigns /></DashboardPage>} />
        <Route path="/dashboard/ai" element={<DashboardPage><AIAssistant /></DashboardPage>} />
        <Route path="/dashboard/team" element={<DashboardPage><Team /></DashboardPage>} />
        <Route path="/dashboard/reports" element={<DashboardPage><Reports /></DashboardPage>} />
        <Route path="/dashboard/billing" element={<DashboardPage><Billing /></DashboardPage>} />
        <Route path="/dashboard/settings" element={<DashboardPage><Settings /></DashboardPage>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminRoute><DashboardLayout><AdminPanel /></DashboardLayout></AdminRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </ThemeProvider>
  );
}
