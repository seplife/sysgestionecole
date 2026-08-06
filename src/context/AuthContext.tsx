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
  isInitializing: boolean; // ✅ RENOMMÉ pour plus de clarté
  isLoading: boolean;       // ✅ Pour les opérations (login/logout)
  authError: string | null;
  isSuperAdmin: boolean;
  primarySchoolId: string | null;
  memberships: AuthSession['memberships'];

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (fields: Partial<UserProfile>) => void;
  setRole: (role: UserRole) => void;
  switchUserRole: (role: UserRole) => void;
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
  const [isInitializing, setIsInitializing] = useState(true); // ✅ Session initiale
  const [isLoading, setIsLoading] = useState(false);           // ✅ Opérations
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
      try {
        const session = await getCurrentSession();
        if (mounted) {
          applySession(session);
        }
      } catch (error) {
        console.error('[AuthContext] Session initialization error:', error);
        if (mounted) {
          applySession(null);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false); // ✅ Initialisation terminée
        }
      }
    };

    initSession();

    // Écouter les changements de session Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !supabaseSession) {
          applySession(null);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const session = await getCurrentSession();
          if (mounted) {
            applySession(session);
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
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const result = await loginWithSupabase(email, password);

      if (!result.success) {
        const errorMessage = result.message || 'Connexion échouée.';
        setAuthError(errorMessage);
        return { success: false, message: errorMessage };
      }

      if (result.session) {
        applySession(result.session);
      }
      
      return { success: true };
    } catch (e: any) {
      const msg = e?.message || 'Erreur inattendue lors de la connexion.';
      setAuthError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // ── LOGOUT ────────────────────────────────────────────────
  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutFromSupabase();
      applySession(null);
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Même en cas d'erreur, on nettoie le state local
      applySession(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ── MISE À JOUR DU PROFIL (locale + Supabase) ─────────────
  const updateUser = async (fields: Partial<UserProfile>) => {
    if (!user) return;

    // ✅ Mise à jour optimiste
    const updated = { ...user, ...fields };
    setUser(updated);

    // Sync vers Supabase (best-effort)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(fields)
        .eq('id', user.id);
      
      if (error) {
        console.warn('[AuthContext] Profile update error:', error);
        // Revert sur erreur ?
      }
    } catch (error) {
      console.warn('[AuthContext] Profile update network error:', error);
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

  // ✅ isAuthenticated : indépendant de isInitializing
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isInitializing,
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