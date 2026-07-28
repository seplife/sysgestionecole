// ============================================================
// SERVICE D'AUTHENTIFICATION CENTRALISÉ — IVOIREÉCOLE+
// Source de vérité : Supabase Auth + user_profiles + school_members
// ============================================================

import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types/database';

export interface SchoolMembership {
  school_id: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthSession {
  userId: string;
  email: string;
  profile: UserProfile | null;
  memberships: SchoolMembership[];
  isSuperAdmin: boolean;
  primarySchoolId: string | null;
  primaryRole: UserRole;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  session?: AuthSession;
}

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
export async function loginWithSupabase(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error('[AuthService] Login error:', error);
      return {
        success: false,
        message: translateAuthError(error.message),
      };
    }

    if (!data.user) {
      return { success: false, message: 'Connexion échouée. Veuillez réessayer.' };
    }

    const session = await buildAuthSession(data.user.id, data.user.email || '');
    return { success: true, session };
  } catch (e: any) {
    console.error('[AuthService] Unexpected login error:', e);
    return {
      success: false,
      message: 'Erreur de connexion à Supabase. Vérifiez votre connexion réseau.',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────
export async function logoutFromSupabase(): Promise<void> {
  await supabase.auth.signOut();
  // Nettoyer uniquement les préférences liées à l'utilisateur
  // (pas les préférences UI comme le thème)
  localStorage.removeItem('sysgestionecole_user');
  localStorage.removeItem('sysgestionecole_current_school');
}

// ─────────────────────────────────────────────────────────────
// SESSION COURANTE
// ─────────────────────────────────────────────────────────────
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) return null;

    return await buildAuthSession(session.user.id, session.user.email || '');
  } catch (e) {
    console.error('[AuthService] getSession error:', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// CONSTRUCTION DE LA SESSION COMPLÈTE
// Récupère profil + memberships depuis Supabase (RLS appliqué)
// ─────────────────────────────────────────────────────────────
async function buildAuthSession(
  userId: string,
  email: string
): Promise<AuthSession> {
  // 1. Récupérer le profil depuis user_profiles
  let profile: UserProfile | null = null;
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      profile = data as UserProfile;
    }
  } catch (e) {
    console.warn('[AuthService] Could not fetch user_profiles:', e);
  }

  // 2. Récupérer les appartenances depuis school_members
  let memberships: SchoolMembership[] = [];
  try {
    const { data, error } = await supabase
      .from('school_members')
      .select('school_id, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!error && data) {
      memberships = data as SchoolMembership[];
    }
  } catch (e) {
    console.warn('[AuthService] Could not fetch school_members:', e);
  }

  // 3. Déterminer si super_admin (depuis user_profiles.is_super_admin)
  const isSuperAdmin = Boolean((profile as any)?.is_super_admin);

  // 4. École principale + rôle principal
  const primaryMembership = memberships[0] || null;
  const primarySchoolId = primaryMembership?.school_id || null;
  const primaryRole: UserRole = isSuperAdmin
    ? 'super_admin'
    : ((primaryMembership?.role as UserRole) || 'directeur');

  return {
    userId,
    email,
    profile,
    memberships,
    isSuperAdmin,
    primarySchoolId,
    primaryRole,
  };
}

// ─────────────────────────────────────────────────────────────
// CRÉER / METTRE À JOUR UN PROFIL UTILISATEUR
// Appelé automatiquement par le trigger SQL, mais disponible
// comme fallback si le profil n'existe pas encore
// ─────────────────────────────────────────────────────────────
export async function ensureUserProfile(
  userId: string,
  email: string,
  firstName: string = '',
  lastName: string = ''
): Promise<UserProfile | null> {
  try {
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) return existing as UserProfile;

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        first_name: firstName || email.split('@')[0],
        last_name: lastName || '',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[AuthService] ensureUserProfile error:', error);
      return null;
    }
    return data as UserProfile;
  } catch (e) {
    console.error('[AuthService] ensureUserProfile exception:', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// TRADUCTION DES ERREURS SUPABASE AUTH EN FRANÇAIS
// ─────────────────────────────────────────────────────────────
function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Identifiant ou mot de passe incorrect. Veuillez vérifier vos informations.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Votre adresse e-mail n\'a pas encore été confirmée. Vérifiez votre boîte mail.';
  }
  if (message.includes('User not found')) {
    return 'Aucun compte trouvé avec cet e-mail.';
  }
  if (message.includes('Too many requests')) {
    return 'Trop de tentatives de connexion. Veuillez patienter quelques minutes.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Erreur réseau. Vérifiez votre connexion Internet.';
  }
  if (message.includes('JWT')) {
    return 'Session expirée. Veuillez vous reconnecter.';
  }
  return `Erreur de connexion : ${message}`;
}
