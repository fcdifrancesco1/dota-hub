import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Acesso ao Admin. O login é conferido no servidor (/api/auth) e a sessão fica
 * num cookie HttpOnly assinado: a página só sabe se o servidor reconheceu o admin,
 * e nada guardado no navegador concede acesso.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth?action=me', { credentials: 'same-origin' });
      const data = res.ok ? await res.json() : null;
      setUser(data?.admin ? { email: data.admin.email, role: 'admin' } : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sessão simulada antiga (login aceitava qualquer e-mail com "admin"): descarta
    try { localStorage.removeItem('dotahub_mock_user'); } catch { /* ignore */ }
    loadSession();
  }, [loadSession]);

  async function signIn(email, password) {
    try {
      const res = await fetch('/api/auth?action=admin-login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return { error: { message: data.error || 'Não foi possível entrar' } };
      const admin = { email: data.email, role: 'admin' };
      setUser(admin);
      return { data: { user: admin }, error: null };
    } catch {
      return { error: { message: 'Sem conexão com o servidor' } };
    }
  }

  async function signOut() {
    try {
      await fetch('/api/auth?action=logout&scope=admin', { method: 'POST', credentials: 'same-origin' });
    } catch { /* o cookie expira sozinho em 12 h */ }
    setUser(null);
    return { error: null };
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', loading, signIn, signOut }}>
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
