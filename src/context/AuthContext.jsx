import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Verifica se há sessão mock salva no localStorage para desenvolvimento
      const savedMockUser = localStorage.getItem('dotahub_mock_user');
      if (savedMockUser) {
        try {
          const parsed = JSON.parse(savedMockUser);
          setUser(parsed);
          setIsAdmin(parsed.email?.includes('admin') || parsed.role === 'admin');
        } catch (e) {}
      }
      setLoading(false);
      return;
    }

    // Escuta estado de autenticação real no Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkIfAdmin(currentUser);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkIfAdmin(currentUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  function checkIfAdmin(usr) {
    if (!usr) {
      setIsAdmin(false);
      return;
    }
    const role = usr.app_metadata?.role || usr.user_metadata?.role;
    const isAdm = role === 'admin' || usr.email?.includes('admin') || usr.email === 'admin@dotahub.com';
    setIsAdmin(isAdm);
  }

  // Login
  async function signIn(email, password) {
    if (!isSupabaseConfigured || !supabase) {
      // Mock login para testes locais
      const mockUser = {
        id: 'mock-user-123',
        email,
        role: email.includes('admin') ? 'admin' : 'user',
        user_metadata: { name: email.split('@')[0] }
      };
      setUser(mockUser);
      setIsAdmin(mockUser.role === 'admin');
      localStorage.setItem('dotahub_mock_user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    }

    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error && res.data.user) {
      checkIfAdmin(res.data.user);
    }
    return res;
  }

  // Registro
  async function signUp(email, password) {
    if (!isSupabaseConfigured || !supabase) {
      const mockUser = {
        id: 'mock-user-' + Date.now(),
        email,
        role: 'user',
        user_metadata: { name: email.split('@')[0] }
      };
      setUser(mockUser);
      setIsAdmin(false);
      localStorage.setItem('dotahub_mock_user', JSON.stringify(mockUser));
      return { data: { user: mockUser }, error: null };
    }

    return await supabase.auth.signUp({ email, password });
  }

  // Logout
  async function signOut() {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('dotahub_mock_user');
      return { error: null };
    }

    const res = await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    return res;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        isConfigured: isSupabaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
