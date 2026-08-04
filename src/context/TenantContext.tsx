import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { School, Organization, AcademicYear } from '../types/database';
import { schoolService } from '../services/supabase';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ─────────────────────────────────────────────────────────────
// PRÉFÉRENCE UI : école courante sélectionnée (localStorage)
// Ce n'est PAS une source de vérité pour un utilisateur standard —
// uniquement une préférence UI valable pour le Super Admin, qui a
// accès à plusieurs écoles et a besoin de mémoriser son choix.
// Pour un utilisateur standard, la source de vérité est toujours
// `primarySchoolId` (dérivé de la session / school_members côté serveur).
// ─────────────────────────────────────────────────────────────
const UI_CURRENT_SCHOOL_KEY = 'sysgestionecole_ui_current_school_id';

function getSavedSchoolId(): string | null {
  try { return localStorage.getItem(UI_CURRENT_SCHOOL_KEY); }
  catch { return null; }
}

function saveCurrentSchoolId(id: string) {
  try { localStorage.setItem(UI_CURRENT_SCHOOL_KEY, id); }
  catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────
// ANNÉES ACADÉMIQUES (données statiques configurables)
// ─────────────────────────────────────────────────────────────
export const availableAcademicYears: AcademicYear[] = [
  {
    id: 'ay-2026-2027',
    school_id: '',
    organization_id: '',
    name: '2026 - 2027',
    start_date: '2026-09-07',
    end_date: '2027-07-16',
    is_current: true,
    is_archived: false
  },
  {
    id: 'ay-2025-2026',
    school_id: '',
    organization_id: '',
    name: '2025 - 2026',
    start_date: '2025-09-08',
    end_date: '2026-07-15',
    is_current: false,
    is_archived: false
  },
  {
    id: 'ay-2024-2025',
    school_id: '',
    organization_id: '',
    name: '2024 - 2025',
    start_date: '2024-09-09',
    end_date: '2025-07-11',
    is_current: false,
    is_archived: true
  }
];

// ─────────────────────────────────────────────────────────────
// ÉCOLE VIDE (placeholder avant chargement Supabase)
// ─────────────────────────────────────────────────────────────
const EMPTY_SCHOOL: School = {
  id: '',
  organization_id: '',
  name: 'Chargement...',
  slug: '',
  status: 'active',
  school_type: 'Prive',
  city: '',
  country: 'Côte d\'Ivoire',
  created_at: new Date().toISOString()
};

// ─────────────────────────────────────────────────────────────
// ORGANISATION PAR DÉFAUT (structure SaaS — chargeable depuis Supabase ultérieurement)
// ─────────────────────────────────────────────────────────────
const DEFAULT_ORG: Organization = {
  id: '',
  name: 'IvoireÉcole+ SaaS',
  code: 'IVOIREECOLE',
  country: 'Côte d\'Ivoire',
  city: 'Abidjan',
  plan_type: 'Enterprise',
  is_active: true,
  created_at: new Date().toISOString()
};

// ─────────────────────────────────────────────────────────────
// INTERFACE DU CONTEXTE
// ─────────────────────────────────────────────────────────────
interface TenantContextType {
  organization: Organization;
  currentSchool: School;
  schools: School[];
  schoolsLoading: boolean;
  schoolsError: string | null;
  setCurrentSchool: (school: School) => void;
  updateCurrentSchool: (updated: Partial<School>) => Promise<void>;
  updateSchool: (id: string, updated: Partial<School>) => Promise<void>;
  addNewSchool: (school: School) => Promise<School>;
  deleteSchool: (id: string) => Promise<void>;
  reloadSchools: () => Promise<void>;
  academicYear: AcademicYear;
  academicYears: AcademicYear[];
  setAcademicYear: (ay: AcademicYear) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// PROVIDER TENANT — SUPABASE RÉEL
// ─────────────────────────────────────────────────────────────
export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isSuperAdmin, primarySchoolId } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [currentSchool, setCurrentSchoolState] = useState<School>(EMPTY_SCHOOL);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);

  // Année académique : préférence UI uniquement
  const [academicYear, setAcademicYearState] = useState<AcademicYear>(() => {
    try {
      const saved = localStorage.getItem('sysgestionecole_ui_academic_year');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return availableAcademicYears[0];
  });

  // ── Charger les écoles depuis Supabase ───────────────────
  // NOTE SÉCURITÉ : schoolService.getAll() doit impérativement utiliser
  // le client Supabase "anon/authenticated" (jamais service_role) afin que
  // les policies RLS de la table `schools` filtrent déjà le résultat :
  //   - utilisateur standard  -> uniquement les écoles où il est membre actif
  //   - super admin           -> toutes les écoles
  // Le code ci-dessous suppose ce filtrage déjà appliqué côté serveur et
  // ajoute une seconde barrière côté client par prudence (défense en profondeur).
  const loadSchools = useCallback(async () => {
    if (!isAuthenticated) return;
    setSchoolsLoading(true);
    setSchoolsError(null);

    try {
      const data = await schoolService.getAll();
      setSchools(data);

      if (data.length > 0) {
        const savedId = getSavedSchoolId();
        const savedSchool = savedId ? data.find(s => s.id === savedId) : null;

        const selected =
          savedSchool ||
          data.find(s => s.id === primarySchoolId) ||
          data[0];

        setCurrentSchoolState(selected);
        saveCurrentSchoolId(selected.id);
      } else {
        setCurrentSchoolState(EMPTY_SCHOOL);
      }
    } catch (e: any) {
      console.error('[TenantContext] loadSchools error:', e);
      setSchoolsError(
        isSuperAdmin
          ? 'Impossible de charger les écoles. Vérifiez la connexion Supabase.'
          : 'Votre école n\'est pas accessible. Contactez l\'administrateur.'
      );
    } finally {
      setSchoolsLoading(false);
    }
  }, [isAuthenticated, primarySchoolId, isSuperAdmin]);

  // Charger les écoles à l'authentification
  useEffect(() => {
    if (isAuthenticated) {
      loadSchools();
    } else {
      // Réinitialiser à la déconnexion
      setSchools([]);
      setCurrentSchoolState(EMPTY_SCHOOL);
      setSchoolsError(null);
    }
  }, [isAuthenticated, loadSchools]);

  // ── Changer l'école courante (préférence UI) ─────────────
  // Garde-fou : un utilisateur standard ne peut sélectionner que
  // son école d'appartenance (primarySchoolId), même si un composant
  // UI mal protégé tentait de lui proposer une autre école.
  const setCurrentSchool = (school: School) => {
    const isAllowed = isSuperAdmin || school.id === primarySchoolId;

    if (!isAllowed) {
      console.warn(
        '[TenantContext] Tentative de sélection d\'une école non autorisée pour cet utilisateur.'
      );
      return;
    }

    setCurrentSchoolState(school);
    saveCurrentSchoolId(school.id);
  };

  // ── Mettre à jour l'école courante ───────────────────────
  const updateCurrentSchool = async (updated: Partial<School>) => {
    if (!currentSchool.id) return;

    // 1. Mise à jour optimiste du state React immédiat pour le Navbar et le reste de l'UI
    const newSchool = { ...currentSchool, ...updated };
    setCurrentSchoolState(newSchool);
    setSchools(prev => prev.map(s => s.id === newSchool.id ? newSchool : s));

    // 2. Mettre à jour le cache local / localStorage
    try {
      await supabaseService.updateSchoolConfig(currentSchool.id, updated);
    } catch (err) {
      console.warn('[TenantContext] updateSchoolConfig cache warning:', err);
    }

    // 3. Tenter la synchronisation Supabase
    try {
      const { id: _id, created_at: _ca, ...cleanUpdates } = updated as any;
      if (Object.keys(cleanUpdates).length > 0) {
        const result = await schoolService.update(currentSchool.id, cleanUpdates);
        if (result) {
          const syncedSchool = { ...newSchool, ...result };
          setCurrentSchoolState(syncedSchool);
          setSchools(prev => prev.map(s => s.id === syncedSchool.id ? syncedSchool : s));
        }
      }
    } catch (e) {
      console.warn('[TenantContext] Supabase update warning (state local conservé):', e);
    }
  };

  // ── Mettre à jour une école par ID ───────────────────────
  const updateSchool = async (id: string, updated: Partial<School>) => {
    // 1. Mise à jour optimiste
    setSchools(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    if (currentSchool.id === id) {
      setCurrentSchoolState(prev => ({ ...prev, ...updated }));
    }

    // 2. Cache local
    try {
      await supabaseService.updateSchoolConfig(id, updated);
    } catch (err) {
      console.warn('[TenantContext] updateSchoolConfig cache warning:', err);
    }

    // 3. Synchronisation Supabase
    try {
      const { id: _id, created_at: _ca, ...cleanUpdates } = updated as any;
      const result = await schoolService.update(id, cleanUpdates);
      if (result) {
        setSchools(prev => prev.map(s => s.id === id ? { ...s, ...result } : s));
        if (currentSchool.id === id) {
          setCurrentSchoolState(prev => ({ ...prev, ...result }));
        }
      }
    } catch (e) {
      console.warn('[TenantContext] Supabase update school warning:', e);
    }
  };

  // ── Ajouter une école ────────────────────────────────────
  // ✅ CORRECTION : l'ancienne vérification s'appuyait sur
  // `(supabaseService as any).getUser` / `(supabaseService as any).client`,
  // qui n'existent ni l'un ni l'autre sur `supabaseService` (voir
  // services/supabaseService.ts — il utilise `supabase` en interne, sans
  // exposer ni méthode `getUser`, ni propriété `client`). Le ternaire
  // renvoyait donc systématiquement `undefined`, et l'erreur
  // « Vous devez être connecté » était levée à chaque appel, même pour un
  // utilisateur bel et bien authentifié.
  //
  // On utilise maintenant le client Supabase importé directement
  // (le même que celui utilisé par AuthContext.tsx), avec `getSession()`
  // plutôt que `getUser()` : `getSession()` lit la session depuis le
  // storage local (rapide, pas d'aller-retour réseau), alors que
  // `getUser()` revalide le token auprès du serveur à chaque appel, ce qui
  // peut échouer/timeout inutilement sur un réseau lent (ex. dev local).
  //
  // On s'appuie aussi sur `isAuthenticated` (déjà résolu par AuthContext)
  // comme première ligne de défense, avant même de solliciter Supabase.
  const addNewSchool = async (school: School) => {
    try {
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour créer une école');
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session?.user) {
        throw new Error('Vous devez être connecté pour créer une école');
      }

      const created = await schoolService.create(school as any);
      setSchools(prev => [created, ...prev.filter(s => s.id !== created.id)]);
      setCurrentSchoolState(created);
      saveCurrentSchoolId(created.id);
      await loadSchools();
      return created;
    } catch (e) {
      console.error('[TenantContext] addNewSchool error:', e);
      // Relancer l'erreur pour que le composant appelant puisse la gérer
      throw e;
    }
  };

  // ── Supprimer une école ──────────────────────────────────
  const deleteSchool = async (id: string) => {
    try {
      await schoolService.delete(id);
      const remaining = schools.filter(s => s.id !== id);
      setSchools(remaining);

      if (currentSchool.id === id) {
        const fallback = remaining[0] || EMPTY_SCHOOL;
        setCurrentSchoolState(fallback);
        if (fallback.id) saveCurrentSchoolId(fallback.id);
      }
    } catch (e) {
      console.error('[TenantContext] deleteSchool error:', e);
      throw e;
    }
  };

  // ── Année académique (préférence UI) ─────────────────────
  const setAcademicYear = (ay: AcademicYear) => {
    setAcademicYearState(ay);
    try { localStorage.setItem('sysgestionecole_ui_academic_year', JSON.stringify(ay)); }
    catch { /* ignore */ }
  };

  return (
    <TenantContext.Provider
      value={{
        organization: DEFAULT_ORG,
        currentSchool,
        schools,
        schoolsLoading,
        schoolsError,
        setCurrentSchool,
        updateCurrentSchool,
        updateSchool,
        addNewSchool,
        deleteSchool,
        reloadSchools: loadSchools,
        academicYear,
        academicYears: availableAcademicYears,
        setAcademicYear,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// HOOK useTenant
// ─────────────────────────────────────────────────────────────
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};