import React from 'react';
import { UserRole } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { AccessStatusScreen } from './AccessStatusScreens';
import { Lock, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { accessCheck } = useSubscription();

  if (!isAuthenticated) {
    return <AccessStatusScreen accessCheck={{ allowed: false, reason: 'AUTH_REQUIRED', message: 'Veuillez vous connecter.' }} />;
  }

  if (!accessCheck.allowed) {
    return <AccessStatusScreen accessCheck={accessCheck} />;
  }

  return <>{children}</>;
};

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback }) => {
  const { role } = useAuth();

  if (role === 'super_admin' || allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-amber-900 dark:text-amber-200 space-y-2 animate-fadeIn">
      <div className="flex items-center gap-2 font-bold text-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600" />
        <span>Accès Restreint par Rôle Utilisateur</span>
      </div>
      <p className="text-xs">
        Votre rôle actuel (<span className="font-mono font-bold">{role}</span>) n'a pas les permissions requises pour consulter ou effectuer des actions sur ce composant.
      </p>
    </div>
  );
};
