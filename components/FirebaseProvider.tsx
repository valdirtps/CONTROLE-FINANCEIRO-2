'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  login: () => Promise<void>;
  loginGuest: () => Promise<void>;
  loginDemo: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authError: null,
  login: async () => {},
  loginGuest: async () => {},
  loginDemo: () => {},
  clearAuthError: () => {},
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const loginDemo = () => {
    setAuthError(null);
    const demoUser = {
      uid: 'demo-local-user',
      displayName: 'Convidado (Modo de Demonstração)',
      email: 'demo@financepro.local',
      isAnonymous: true,
      emailVerified: true,
    } as unknown as User;
    setUser(demoUser);
    setLoading(false);
  };

  const login = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.warn('Aviso ao tentar login com Google:', error);
      const errorCode = error?.code || '';
      const errorMessage = error?.message || '';
      if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('unauthorized-domain')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : '';
        setAuthError(`DOMINIO_NAO_AUTORIZADO:${domain}`);
      } else if (errorCode === 'auth/popup-closed-by-user') {
        setAuthError('O pop-up de login foi fechado antes de concluir. Tente novamente ou entre no Modo Demonstração.');
      } else if (errorCode === 'auth/popup-blocked') {
        setAuthError('O pop-up foi bloqueado pelo navegador. Libere pop-ups no seu navegador ou entre no Modo Demonstração.');
      } else {
        setAuthError(`Erro ao autenticar: ${errorMessage || errorCode}`);
      }
    }
  };

  const loginGuest = async () => {
    setAuthError(null);
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.warn('Aviso ao tentar entrar como convidado:', error);
      const errorCode = error?.code || '';
      if (errorCode === 'auth/operation-not-allowed' || errorCode === 'auth/admin-restricted-operation') {
        // Automatically switch to local demo mode if anonymous auth is disabled in console
        loginDemo();
      } else {
        setAuthError(`Erro ao entrar como convidado: ${error?.message || errorCode}`);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, loginGuest, loginDemo, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
