import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../api/client';
import type { PublicUser } from '../types';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  setUserSession: (user: PublicUser, token: string) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  toasts: ToastItem[];
  notify: (message: string, type?: ToastItem['type']) => void;
  dismissToast: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: ToastItem['type'] = 'info') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.me();
      setUser(res.user);
    } catch {
      setUser(null);
      if (getStoredToken()) {
        setStoredToken(null);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const setUserSession = useCallback((nextUser: PublicUser, token: string) => {
    setStoredToken(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    notify('Signed out of REVA SWAP.', 'info');
  }, [notify]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUserSession,
        refreshUser,
        logout,
        toasts,
        notify,
        dismissToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
