import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { School, Organization, AcademicYear } from '../types/database';
import { schoolService } from '../services/supabase';
import { useAuth } from './AuthContext';

// ─────────────────────────────────────────────────────────────
// PRÉFÉRENCE UI : école courante sélectionnée (localStorage)
// Ce n'est PAS une source de vérité — juste la préférence UI
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
  addNewSchool: (school: School) => Promise<void>;
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
  const loadSchools = useCallback(async () => {
    if (!isAuthenticated) return;
    setSchoolsLoading(true);
    setSchoolsError(null);

    try {
      const data = await schoolService.getAll();
      setSchools(data);

      if (data.length > 0) {
        // Restaurer l'école préférée si elle est toujours accessible
        const savedId = getSavedSchoolId() || primarySchoolId;
        const preferred = savedId ? data.find(s => s.id === savedId) : null;
        const selected = preferred || data[0];
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
  const setCurrentSchool = (school: School) => {
    setCurrentSchoolState(school);
    saveCurrentSchoolId(school.id);
  };

  // ── Mettre à jour l'école courante ───────────────────────
  const updateCurrentSchool = async (updated: Partial<School>) => {
    if (!currentSchool.id) return;
    try {
      const result = await schoolService.update(currentSchool.id, updated);
      const newSchool = { ...currentSchool, ...result };
      setCurrentSchoolState(newSchool);
      setSchools(prev => prev.map(s => s.id === newSchool.id ? newSchool : s));
    } catch (e) {
      console.error('[TenantContext] updateCurrentSchool error:', e);
      throw e;
    }
  };

  // ── Mettre à jour une école par ID ───────────────────────
  const updateSchool = async (id: string, updated: Partial<School>) => {
    try {
      const result = await schoolService.update(id, updated);
      setSchools(prev => prev.map(s => s.id === id ? { ...s, ...result } : s));
      if (currentSchool.id === id) {
        setCurrentSchoolState(prev => ({ ...prev, ...result }));
      }
    } catch (e) {
      console.error('[TenantContext] updateSchool error:', e);
      throw e;
    }
  };

  // ── Ajouter une école ────────────────────────────────────
  const addNewSchool = async (school: School) => {
    try {
      const created = await schoolService.create(school as any);
      setSchools(prev => [created, ...prev]);
      setCurrentSchoolState(created);
      saveCurrentSchoolId(created.id);
    } catch (e) {
      console.error('[TenantContext] addNewSchool error:', e);
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


