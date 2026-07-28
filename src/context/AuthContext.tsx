import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types/database';
import {
  loginWithSupabase,
  logoutFromSupabase,
  getCurrentSession,
  AuthSession,
} from '../services/authService';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// TYPES DU CONTEXTE AUTH
// ─────────────────────────────────────────────────────────────
interface AuthContextType {
  // État
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isSuperAdmin: boolean;
  primarySchoolId: string | null;
  memberships: AuthSession['memberships'];

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (fields: Partial<UserProfile>) => void;
  setRole: (role: UserRole) => void;          // Conservé pour compatibilité UI
  switchUserRole: (role: UserRole) => void;   // Conservé pour compatibilité UI
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// PROVIDER AUTH — SUPABASE AUTH RÉEL
// ─────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRoleState] = useState<UserRole>('directeur');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [primarySchoolId, setPrimarySchoolId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<AuthSession['memberships']>([]);
  const [isLoading, setIsLoading] = useState(true); // true au démarrage pendant vérification session
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Appliquer une session complète dans le state ──────────
  const applySession = useCallback((session: AuthSession | null) => {
    if (!session) {
      setUser(null);
      setRoleState('directeur');
      setIsSuperAdmin(false);
      setPrimarySchoolId(null);
      setMemberships([]);
      return;
    }

    setUser(session.profile);
    setRoleState(session.primaryRole);
    setIsSuperAdmin(session.isSuperAdmin);
    setPrimarySchoolId(session.primarySchoolId);
    setMemberships(session.memberships);
  }, []);

  // ── Restaurer la session au démarrage de l'application ───
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      setIsLoading(true);
      const session = await getCurrentSession();
      if (mounted) {
        applySession(session);
        setIsLoading(false);
      }
    };

    initSession();

    // Écouter les changements de session Supabase Auth (refresh, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !supabaseSession) {
          applySession(null);
          setIsLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setIsLoading(true);
          const session = await getCurrentSession();
          if (mounted) {
            applySession(session);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  // ── LOGIN ─────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const result = await loginWithSupabase(email, password);

      if (!result.success) {
        setAuthError(result.message || 'Connexion échouée.');
        setIsLoading(false);
        return { success: false, message: result.message };
      }

      if (result.session) {
        applySession(result.session);
      }
      setIsLoading(false);
      return { success: true };
    } catch (e: any) {
      const msg = 'Erreur inattendue lors de la connexion.';
      setAuthError(msg);
      setIsLoading(false);
      return { success: false, message: msg };
    }
  };

  // ── LOGOUT ────────────────────────────────────────────────
  const logout = async () => {
    setIsLoading(true);
    await logoutFromSupabase();
    applySession(null);
    setIsLoading(false);
  };

  // ── MISE À JOUR DU PROFIL (locale + Supabase) ─────────────
  const updateUser = (fields: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...fields };
      setUser(updated);
      // Sync vers Supabase (best-effort, sans bloquer l'UI)
      supabase
        .from('user_profiles')
        .update(fields)
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.warn('[AuthContext] Profile update error:', error);
        });
    }
  };

  // ── COMPATIBILITÉ UI (changement de rôle d'affichage) ────
  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) setUser({ ...user, role: newRole });
  };

  const switchUserRole = (targetRole: UserRole) => {
    setRoleState(targetRole);
    if (user) setUser({ ...user, role: targetRole });
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user && !isLoading,
        isLoading,
        authError,
        isSuperAdmin,
        primarySchoolId,
        memberships,
        login,
        logout,
        updateUser,
        setRole,
        switchUserRole,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// HOOK useAuth
// ─────────────────────────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



