'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthRole, AuthUser } from '@/types';

type AuthState = {
  profile: AuthUser | null;
  role: AuthRole | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setRole(data.role);
      } else {
        setProfile(null);
        setRole(null);
      }
    } catch {
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      setProfile(null);
      setRole(null);
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ profile, role, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}