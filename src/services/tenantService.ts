// ============================================================
// SERVICE TENANT CENTRALISÉ — IVOIREÉCOLE+ SAAS
// Récupère le contexte d'organisation et d'école de l'utilisateur authentifié
// ============================================================

import { supabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/supabase';

export interface TenantContext {
  userId: string;
  organizationId: string;
  schoolId: string;
  role: string;
  isSuperAdmin: boolean;
}

// UUIDs par défaut pour le mode démonstration / déconnecté (valides PostgreSQL)
export const DEFAULT_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000000';
export const DEFAULT_SCHOOL_ID = '00000000-0000-4000-8000-000000000001';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Génère un UUID v4 valide même dans un contexte HTTP non sécurisé (IP locale)
 */
export function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    try {
      return window.crypto.randomUUID();
    } catch {
      // Ignorer et passer au fallback RFC4122
    }
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Récupère le contexte d'organisation et d'école de l'utilisateur actuellement connecté
 */
export async function getCurrentTenantContext(): Promise<TenantContext> {
  if (!isSupabaseConfigured()) {
    return {
      userId: 'local-demo-user',
      organizationId: DEFAULT_ORGANIZATION_ID,
      schoolId: DEFAULT_SCHOOL_ID,
      role: 'directeur',
      isSuperAdmin: true,
    };
  }

  try {
    // 1. Récupérer l'utilisateur Auth Supabase
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return {
        userId: 'anonymous-user',
        organizationId: DEFAULT_ORGANIZATION_ID,
        schoolId: DEFAULT_SCHOOL_ID,
        role: 'guest',
        isSuperAdmin: false,
      };
    }

    const userId = authData.user.id;

    // 2. Récupérer le profil utilisateur depuis user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id, school_id, role, is_super_admin')
      .eq('id', userId)
      .maybeSingle();

    let organizationId = (profile?.organization_id && uuidRegex.test(profile.organization_id)) ? profile.organization_id : '';
    let schoolId = (profile?.school_id && uuidRegex.test(profile.school_id)) ? profile.school_id : '';
    let role = profile?.role || 'directeur';
    let isSuperAdmin = Boolean(profile?.is_super_admin);

    // 3. Si l'organisation est manquante, tenter de trouver la première organisation disponible
    if (!organizationId) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (orgs && orgs.length > 0 && uuidRegex.test(orgs[0].id)) {
        organizationId = orgs[0].id;
      } else {
        organizationId = DEFAULT_ORGANIZATION_ID;
      }
    }

    // 4. Si l'école est manquante, consulter school_members
    if (!schoolId) {
      const { data: member } = await supabase
        .from('school_members')
        .select('school_id, role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (member?.school_id && uuidRegex.test(member.school_id)) {
        schoolId = member.school_id;
        if (member.role) role = member.role;
      } else {
        const { data: schs } = await supabase
          .from('schools')
          .select('id')
          .limit(1);

        if (schs && schs.length > 0 && uuidRegex.test(schs[0].id)) {
          schoolId = schs[0].id;
        } else {
          schoolId = DEFAULT_SCHOOL_ID;
        }
      }
    }

    return {
      userId,
      organizationId,
      schoolId,
      role,
      isSuperAdmin,
    };
  } catch (e: any) {
    console.error('[TenantService] Erreur lors de la récupération du contexte tenant:', e);
    return {
      userId: 'error-user',
      organizationId: DEFAULT_ORGANIZATION_ID,
      schoolId: DEFAULT_SCHOOL_ID,
      role: 'directeur',
      isSuperAdmin: false,
    };
  }
}
