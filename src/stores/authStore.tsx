import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, PlanId, SubscriptionStatus } from '@/types';
import { MASTER_ADMIN_EMAIL, TRIAL_DAYS } from '@/constants/plans';
import { generateId } from '@/lib/utils';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
  phone?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<AuthResult>;
  updateUser: (data: Partial<User>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  getAllUsers: () => User[];
  updateUserByAdmin: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  enableTwoFactor: () => Promise<{ secret: string; qrCode: string }>;
  verifyTwoFactor: (code: string) => Promise<AuthResult>;
  disableTwoFactor: (code: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SK = {
  CURRENT_USER: 'lb_current_user',
  ALL_USERS: 'lb_all_users',
  SESSION: 'lb_session_token',
} as const;

function getStoredUsers(): User[] {
  try {
    const stored = localStorage.getItem(SK.ALL_USERS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(SK.ALL_USERS, JSON.stringify(users));
}

function getTrialEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + TRIAL_DAYS);
  return date.toISOString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(SK.SESSION);
    const storedUser = localStorage.getItem(SK.CURRENT_USER);
    if (token && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // Refresh user data from users array (admin might have updated)
        const users = getStoredUsers();
        const freshUser = users.find(u => u.id === parsedUser.id);
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem(SK.CURRENT_USER, JSON.stringify(freshUser));
        } else {
          setUser(parsedUser);
        }
      } catch {
        localStorage.removeItem(SK.CURRENT_USER);
        localStorage.removeItem(SK.SESSION);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    await new Promise(r => setTimeout(r, 700));
    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { success: false, error: 'Usuário não encontrado' };
    const stored = localStorage.getItem(`lb_pwd_${found.id}`);
    if (stored !== password) return { success: false, error: 'Senha incorreta' };
    if (found.suspended) return { success: false, error: 'Conta suspensa. Entre em contato com o suporte.' };
    const updatedUser = { ...found, lastLoginAt: new Date().toISOString() };
    saveUsers(users.map(u => u.id === found.id ? updatedUser : u));
    localStorage.setItem(SK.SESSION, `lb_token_${generateId()}`);
    localStorage.setItem(SK.CURRENT_USER, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return { success: true };
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    await new Promise(r => setTimeout(r, 700));
    const users = getStoredUsers();
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'Email já cadastrado' };
    }
    const isMasterAdmin = data.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    const newUser: User = {
      id: generateId(),
      name: data.name,
      email: data.email,
      role: isMasterAdmin ? 'master_admin' : 'user',
      plan: 'free',
      company: data.company || '',
      phone: data.phone || '',
      trialStartDate: new Date().toISOString(),
      trialEndDate: getTrialEndDate(),
      subscriptionStatus: 'trial',
      createdAt: new Date().toISOString(),
      emailVerified: false,
      twoFactorEnabled: false,
      whatsappConnected: false,
      suspended: false,
    };
    users.push(newUser);
    saveUsers(users);
    localStorage.setItem(`lb_pwd_${newUser.id}`, data.password);
    localStorage.setItem(SK.SESSION, `lb_token_${generateId()}`);
    localStorage.setItem(SK.CURRENT_USER, JSON.stringify(newUser));
    setUser(newUser);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(SK.SESSION);
    localStorage.removeItem(SK.CURRENT_USER);
    setUser(null);
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    await new Promise(r => setTimeout(r, 1000));
    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    // Always return success for security (don't reveal if email exists)
    if (found) {
      const token = generateId();
      localStorage.setItem(`lb_reset_${token}`, JSON.stringify({
        userId: found.id,
        email: found.email,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      }));
      console.log(`[LocalBoost] Reset token for ${email}: ${token}`);
    }
    return { success: true };
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    await new Promise(r => setTimeout(r, 500));
    if (!user) return { success: false, error: 'Não autenticado' };
    const stored = localStorage.getItem(`lb_pwd_${user.id}`);
    if (stored !== currentPassword) return { success: false, error: 'Senha atual incorreta' };
    localStorage.setItem(`lb_pwd_${user.id}`, newPassword);
    return { success: true };
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    const users = getStoredUsers();
    saveUsers(users.map(u => u.id === user.id ? updatedUser : u));
    localStorage.setItem(SK.CURRENT_USER, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const getAllUsers = (): User[] => getStoredUsers();

  const updateUserByAdmin = (userId: string, data: Partial<User>) => {
    const users = getStoredUsers();
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...data } : u);
    saveUsers(updatedUsers);
    if (user && user.id === userId) {
      const updatedUser = { ...user, ...data };
      localStorage.setItem(SK.CURRENT_USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const deleteUser = (userId: string) => {
    const users = getStoredUsers().filter(u => u.id !== userId);
    saveUsers(users);
  };

  const enableTwoFactor = async () => {
    await new Promise(r => setTimeout(r, 500));
    const secret = generateId().toUpperCase();
    const qrCode = `otpauth://totp/LocalBoost:${user?.email}?secret=${secret}&issuer=LocalBoost`;
    return { secret, qrCode };
  };

  const verifyTwoFactor = async (code: string): Promise<AuthResult> => {
    await new Promise(r => setTimeout(r, 500));
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return { success: false, error: 'Código inválido. Use um código de 6 dígitos.' };
    }
    updateUser({ twoFactorEnabled: true });
    return { success: true };
  };

  const disableTwoFactor = async (code: string): Promise<AuthResult> => {
    await new Promise(r => setTimeout(r, 500));
    if (code.length !== 6) return { success: false, error: 'Código inválido' };
    updateUser({ twoFactorEnabled: false });
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      forgotPassword,
      updateUser,
      changePassword,
      getAllUsers,
      updateUserByAdmin,
      deleteUser,
      enableTwoFactor,
      verifyTwoFactor,
      disableTwoFactor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStore() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used within AuthProvider');
  return ctx;
}
