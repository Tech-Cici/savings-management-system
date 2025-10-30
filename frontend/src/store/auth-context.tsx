'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authService } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, otp?: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; confirmPassword: string; deviceId: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        const hasToken = authService.isAuthenticated();

        if (hasToken) {
          const current = await authService.getCurrentUser();
          if (current) {
            // Prefer backend truth; fall back to stored name if missing
            setUser({ ...(storedUser || {} as any), ...current });
          } else {
            await authService.logout();
            setUser(null);
          }
        } else if (storedUser) {
          // No token means not authenticated, ignore stale stored user
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, otp?: string) => {
    try {
      const { user: loggedInUser, token } = await authService.login({ email, password, otp });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: { name: string; email: string; password: string; confirmPassword: string; deviceId: string }) => {
    // Do NOT auto-login on register. Backend sends OTP email and account awaits admin verification.
    await authService.register(data);
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

