import React, { createContext, useContext, useState, useEffect } from 'react';
import { School, Organization, AcademicYear } from '../types/database';
import { supabaseService, getLocalCache, setLocalCache } from '../services/supabaseService';

const defaultOrg: Organization = {
  id: 'org-saint-viateur-01',
  name: 'GROUPE ÉDUCATION SAINT-VIATEUR',
  code: 'ORG-ST-VIATEUR',
  country: 'Côte d\'Ivoire',
  city: 'Abidjan',
  plan_type: 'Enterprise',
  is_active: true,
  created_at: new Date().toISOString()
};

const defaultSchool: School = {
  id: 'school-palmeraie-01',
  organization_id: 'org-saint-viateur-01',
  name: 'COLLÈGE CATHOLIQUE SAINT-VIATEUR',
  slug: 'saint-viateur-palmeraie',
  status: 'active',
  registration_number: '000730/MENA',
  motto: 'Foi, Discipline, Excellence',
  address: 'Riviera Palmeraie, Rue de la Paix',
  city: 'Abidjan (Cocody)',
  phone: '+225 27 22 49 88 00',
  whatsapp: '+225 07 08 09 10 11',
  email: 'contact@saintviateur-palmeraie.ci',
  director_name: 'Père Jean-Luc KOUADIO',
  school_type: 'Prive',
  logo_url: '/images/logoecole.png',
  education_levels: ['Secondaire'],
  created_at: new Date().toISOString()
};

export const availableAcademicYears: AcademicYear[] = [
  {
    id: 'ay-2026-2027',
    school_id: 'school-palmeraie-01',
    organization_id: 'org-saint-viateur-01',
    name: '2026 - 2027',
    start_date: '2026-09-07',
    end_date: '2027-07-16',
    is_current: true,
    is_archived: false
  },
  {
    id: 'ay-2025-2026',
    school_id: 'school-palmeraie-01',
    organization_id: 'org-saint-viateur-01',
    name: '2025 - 2026',
    start_date: '2025-09-08',
    end_date: '2026-07-15',
    is_current: false,
    is_archived: false
  },
  {
    id: 'ay-2024-2025',
    school_id: 'school-palmeraie-01',
    organization_id: 'org-saint-viateur-01',
    name: '2024 - 2025',
    start_date: '2024-09-09',
    end_date: '2025-07-11',
    is_current: false,
    is_archived: true
  }
];

const defaultAcademicYear = availableAcademicYears[0]; // 2026 - 2027

interface TenantContextType {
  organization: Organization;
  currentSchool: School;
  schools: School[];
  setCurrentSchool: (school: School) => void;
  updateCurrentSchool: (updated: Partial<School>) => void;
  updateSchool: (id: string, updated: Partial<School>) => void;
  addNewSchool: (school: School) => void;
  deleteSchool: (id: string) => void;
  academicYear: AcademicYear;
  academicYears: AcademicYear[];
  setAcademicYear: (ay: AcademicYear) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization] = useState<Organization>(() => getLocalCache('organization', defaultOrg));
  const [schools, setSchools] = useState<School[]>(() => getLocalCache('schools', [defaultSchool]));
  const [currentSchool, setCurrentSchoolState] = useState<School>(() => {
    const list = getLocalCache<School[]>('schools', [defaultSchool]);
    return getLocalCache<School>('current_school', list[0] || defaultSchool);
  });
  const [academicYear, setAcademicYearState] = useState<AcademicYear>(() => getLocalCache('academic_year', defaultAcademicYear));

  useEffect(() => {
    supabaseService.fetchSchools().then((data) => {
      if (data && data.length > 0) {
        setSchools(data);
        const currentSaved = getLocalCache<School>('current_school', data[0]);
        const matched = data.find(s => s.id === currentSaved.id) || data[0];
        setCurrentSchoolState(matched);
        setLocalCache('current_school', matched);
      }
    });
  }, []);

  const setCurrentSchool = (school: School) => {
    setCurrentSchoolState(school);
    setLocalCache('current_school', school);
  };

  const updateCurrentSchool = (updated: Partial<School>) => {
    const newSchool = { ...currentSchool, ...updated };
    setCurrentSchoolState(newSchool);
    let updatedSchools = schools.map(s => s.id === newSchool.id ? newSchool : s);
    if (!updatedSchools.some(s => s.id === newSchool.id)) {
      updatedSchools = [newSchool, ...updatedSchools];
    }
    setSchools(updatedSchools);
    setLocalCache('schools', updatedSchools);
    setLocalCache('current_school', newSchool);
    supabaseService.updateSchoolConfig(newSchool.id, newSchool);
  };

  const updateSchool = (id: string, updated: Partial<School>) => {
    const updatedSchools = schools.map(s => s.id === id ? { ...s, ...updated } : s);
    setSchools(updatedSchools);
    setLocalCache('schools', updatedSchools);
    if (currentSchool.id === id) {
      const updatedCurrent = { ...currentSchool, ...updated };
      setCurrentSchoolState(updatedCurrent);
      setLocalCache('current_school', updatedCurrent);
    }
    supabaseService.updateSchoolConfig(id, updated);
  };

  const addNewSchool = (newSchool: School) => {
    const updated = [newSchool, ...schools];
    setSchools(updated);
    setCurrentSchoolState(newSchool);
    setLocalCache('schools', updated);
    setLocalCache('current_school', newSchool);
    supabaseService.addSchool(newSchool);
  };

  const deleteSchool = (id: string) => {
    const updatedSchools = schools.filter(s => s.id !== id);
    const finalSchools = updatedSchools.length > 0 ? updatedSchools : [defaultSchool];
    setSchools(finalSchools);
    setLocalCache('schools', finalSchools);

    if (currentSchool.id === id) {
      const fallback = finalSchools[0];
      setCurrentSchoolState(fallback);
      setLocalCache('current_school', fallback);
    }
    supabaseService.deleteSchool(id);
  };

  const setAcademicYear = (ay: AcademicYear) => {
    setAcademicYearState(ay);
    setLocalCache('academic_year', ay);
  };

  return (
    <TenantContext.Provider value={{
      organization,
      currentSchool,
      schools,
      setCurrentSchool,
      updateCurrentSchool,
      updateSchool,
      addNewSchool,
      deleteSchool,
      academicYear,
      academicYears: availableAcademicYears,
      setAcademicYear,
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
