// ============================================================
// HOOK useCurrentUser - Profil utilisateur connecte
// ============================================================
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/database';

export function useCurrentUser() {
  const { user, role, isSuperAdmin, primarySchoolId, memberships, isAuthenticated, isLoading } = useAuth();

  const hasRole = (targetRole: UserRole): boolean => role === targetRole;

  const hasAnyRole = (...roles: UserRole[]): boolean => roles.includes(role);

  const canManageSchool = (): boolean =>
    isSuperAdmin || hasAnyRole('super_admin', 'school_admin', 'directeur');

  const canManageStudents = (): boolean =>
    isSuperAdmin || hasAnyRole('super_admin', 'school_admin', 'directeur', 'secretaire', 'directeur_etudes');

  const canViewGrades = (): boolean =>
    isSuperAdmin || hasAnyRole('super_admin', 'school_admin', 'directeur', 'directeur_etudes', 'enseignant', 'parent', 'eleve');

  const canManageFinance = (): boolean =>
    isSuperAdmin || hasAnyRole('super_admin', 'school_admin', 'directeur', 'comptable', 'secretaire');

  const fullName = user
    ? (user.first_name + ' ' + user.last_name).trim()
    : '';

  return {
    user,
    role,
    fullName,
    isSuperAdmin,
    primarySchoolId,
    memberships,
    isAuthenticated,
    isLoading,
    hasRole,
    hasAnyRole,
    canManageSchool,
    canManageStudents,
    canViewGrades,
    canManageFinance,
  };
}