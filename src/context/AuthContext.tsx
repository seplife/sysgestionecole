import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/database';
import { supabaseService, getLocalCache, setLocalCache } from '../services/supabaseService';

const defaultUser: UserProfile = {
  id: 'usr-admin-01',
  first_name: 'Père Jean-Luc',
  last_name: 'KOUADIO',
  email: 'directeur@saintviateur.ci',
  phone: '+225 07 08 09 10 11',
  role: 'directeur',
  avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  is_active: true
};

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  switchUserRole: (targetRole: UserRole) => void;
  updateUser: (fields: Partial<UserProfile>) => void;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message?: string }>;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const cached = getLocalCache<UserProfile | null>('user', null);
    if (cached?.id === 'usr-admin-01') {
      localStorage.removeItem('sysgestionecole_user');
      return null;
    }
    return cached;
  });

  const [role, setRoleState] = useState<UserRole>(user?.role || 'directeur');

  useEffect(() => {
    if (user) {
      setLocalCache('user', user);
      setRoleState(user.role);
    }
  }, [user]);

  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanUsername = usernameOrEmail.trim().toLowerCase();

    // Account role mapping strategy
    let targetRole: UserRole = 'directeur';
    let firstName = 'Père Jean-Luc';
    let lastName = 'KOUADIO';

    if (cleanUsername.includes('superadmin') || cleanUsername.includes('super')) {
      targetRole = 'super_admin';
      firstName = 'Administrateur';
      lastName = 'SaaS Global';
    } else if (cleanUsername.includes('prof') || cleanUsername.includes('enseignant') || cleanUsername.includes('kouadio')) {
      targetRole = 'enseignant';
      firstName = 'Dr. Yao';
      lastName = 'KOUADIO';
    } else if (cleanUsername.includes('parent') || cleanUsername.includes('diabate')) {
      targetRole = 'parent';
      firstName = 'Ibrahim';
      lastName = 'DIABATÉ';
    } else if (cleanUsername.includes('eleve') || cleanUsername.includes('student')) {
      targetRole = 'eleve';
      firstName = 'Awa Fatima';
      lastName = 'DIABATÉ';
    }

    const authenticatedUser: UserProfile = {
      id: `usr-${Date.now()}`,
      first_name: firstName,
      last_name: lastName,
      email: usernameOrEmail,
      phone: '+225 07 08 09 10 11',
      role: targetRole,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      is_active: true
    };

    setUser(authenticatedUser);
    setRoleState(targetRole);
    setLocalCache('user', authenticatedUser);

    return { success: true };
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      setLocalCache('user', updated);
    }
  };

  const switchUserRole = (targetRole: UserRole) => {
    if (user) {
      const updated = { ...user, role: targetRole };
      setUser(updated);
      setRoleState(targetRole);
      setLocalCache('user', updated);
    }
  };

  const updateUser = (fields: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...fields };
      setUser(updated);
      setLocalCache('user', updated);
      supabaseService.saveStaff(updated);
    }
  };

  const logout = () => {
    localStorage.removeItem('sysgestionecole_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      setRole,
      switchUserRole,
      updateUser,
      login,
      isAuthenticated: !!user,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
