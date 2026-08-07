import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { School, Organization, AcademicYear } from '../types/database';
import { schoolService } from '../services/supabase';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ─────────────────────────────────────────────────────────────
// PRÉFÉRENCE UI : école courante sélectionnée (localStorage)
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
// ORGANISATION PAR DÉFAUT
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
  const { user, isAuthenticated, isSuperAdmin, primarySchoolId } = useAuth();

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
  const loadSchools = useCallback(async () => {
    // ✅ Vérification plus robuste
    if (!isAuthenticated || !user) {
      setSchools([]);
      setCurrentSchoolState(EMPTY_SCHOOL);
      return;
    }

    setSchoolsLoading(true);
    setSchoolsError(null);

    try {
      const data = await schoolService.getAll();
      
      // ✅ Filtrage côté client par sécurité
      let filteredData = data;
      if (!isSuperAdmin) {
        filteredData = data.filter(s => s.id === primarySchoolId);
      }
      
      setSchools(filteredData);

      if (filteredData.length > 0) {
        const savedId = getSavedSchoolId();
        const savedSchool = savedId ? filteredData.find(s => s.id === savedId) : null;

        const selected =
          savedSchool ||
          filteredData.find(s => s.id === primarySchoolId) ||
          filteredData[0];

        setCurrentSchoolState(selected);
        saveCurrentSchoolId(selected.id);
      } else {
        setCurrentSchoolState(EMPTY_SCHOOL);
        if (!isSuperAdmin) {
          setSchoolsError('Aucune école trouvée pour votre compte.');
        }
      }
    } catch (e: any) {
      console.error('[TenantContext] loadSchools error:', e);

      // ── Fallback mode local : lire l'école depuis localStorage ──
      try {
        const rawLocalSchool = localStorage.getItem('ivoireecole_local_school');
        if (rawLocalSchool) {
          const localSchool = JSON.parse(rawLocalSchool) as School;
          if (localSchool?.id && (localSchool as any)._localMode) {
            console.info('[TenantContext] 🔌 École locale chargée (mode hors-ligne)');
            setSchools([localSchool]);
            setCurrentSchoolState(localSchool);
            saveCurrentSchoolId(localSchool.id);
            setSchoolsError(null);
            return;
          }
        }
      } catch (localErr) {
        console.warn('[TenantContext] Erreur lecture école locale:', localErr);
      }

      setSchoolsError(
        isSuperAdmin
          ? 'Impossible de charger les écoles. Vérifiez la connexion Supabase.'
          : 'Votre école n\'est pas accessible. Contactez l\'administrateur.'
      );
    } finally {
      setSchoolsLoading(false);
    }
  }, [isAuthenticated, user, primarySchoolId, isSuperAdmin]);

  // Charger les écoles à l'authentification
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSchools();
    } else if (!isAuthenticated) {
      // ✅ Nettoyage explicite à la déconnexion
      setSchools([]);
      setCurrentSchoolState(EMPTY_SCHOOL);
      setSchoolsError(null);
    }
  }, [isAuthenticated, user, loadSchools]);

  // ── Changer l'école courante (préférence UI) ─────────────
  const setCurrentSchool = (school: School) => {
    // ✅ Garde-fou avec message explicite
    if (!school?.id) {
      console.warn('[TenantContext] Tentative de sélection d\'une école invalide.');
      return;
    }

    const isAllowed = isSuperAdmin || school.id === primarySchoolId;

    if (!isAllowed) {
      console.warn(
        `[TenantContext] Accès refusé : l'utilisateur ${user?.id} tente d'accéder à l'école ${school.id} alors qu'il appartient à ${primarySchoolId}`
      );
      return;
    }

    setCurrentSchoolState(school);
    saveCurrentSchoolId(school.id);
  };

  // ── Mettre à jour l'école courante ───────────────────────
  const updateCurrentSchool = async (updated: Partial<School>) => {
    if (!currentSchool.id) return;

    try {
      // 1. Mise à jour optimiste
      const newSchool = { ...currentSchool, ...updated };
      setCurrentSchoolState(newSchool);
      setSchools(prev => prev.map(s => s.id === newSchool.id ? newSchool : s));

      // 2. Mettre à jour le cache local
      await supabaseService.updateSchoolConfig(currentSchool.id, updated);

      // 3. Synchronisation Supabase
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
      console.error('[TenantContext] updateCurrentSchool error:', e);
      // ✅ Relancer l'erreur pour que l'UI puisse afficher un message
      throw e;
    }
  };

  // ── Mettre à jour une école par ID ───────────────────────
  const updateSchool = async (id: string, updated: Partial<School>) => {
    try {
      // 1. Mise à jour optimiste
      setSchools(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      if (currentSchool.id === id) {
        setCurrentSchoolState(prev => ({ ...prev, ...updated }));
      }

      // 2. Cache local
      await supabaseService.updateSchoolConfig(id, updated);

      // 3. Synchronisation Supabase
      const { id: _id, created_at: _ca, ...cleanUpdates } = updated as any;
      if (Object.keys(cleanUpdates).length > 0) {
        const result = await schoolService.update(id, cleanUpdates);
        if (result) {
          setSchools(prev => prev.map(s => s.id === id ? { ...s, ...result } : s));
          if (currentSchool.id === id) {
            setCurrentSchoolState(prev => ({ ...prev, ...result }));
          }
        }
      }
    } catch (e) {
      console.error('[TenantContext] updateSchool error:', e);
      throw e;
    }
  };

  // ── Ajouter une école ────────────────────────────────────
  const addNewSchool = async (school: School): Promise<School> => {
    // ✅ Vérification explicite de l'authentification
    if (!isAuthenticated || !user) {
      throw new Error('Vous devez être connecté pour créer une école');
    }

    try {
      // ✅ Vérifier la session Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session?.user) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      // ✅ Créer l'école dans Supabase
      const created = await schoolService.create(school as any);
      
      // ✅ Mettre à jour le state local
      setSchools(prev => {
        const exists = prev.some(s => s.id === created.id);
        if (exists) {
          return prev.map(s => s.id === created.id ? created : s);
        }
        return [created, ...prev];
      });
      
      setCurrentSchoolState(created);
      saveCurrentSchoolId(created.id);
      
      // ✅ Recharger pour synchroniser
      await loadSchools();
      
      return created;
    } catch (e) {
      console.error('[TenantContext] addNewSchool error:', e);
      throw e; // ✅ Relancer pour gestion par le composant
    }
  };

  // ── Supprimer une école ──────────────────────────────────
  const deleteSchool = async (id: string) => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour supprimer une école');
    }

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