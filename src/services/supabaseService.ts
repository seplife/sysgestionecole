import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Student, Parent, SchoolClass, Subject, UserProfile, PaymentTransaction, School, Organization, AcademicYear, AttendanceRecord } from '../types/database';

export const toValidUuid = (str: string | undefined): string => {
  if (!str) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) return str;
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  const strHex = Array.from(str).map(c => c.charCodeAt(0).toString(16)).join('').slice(0, 12).padStart(12, '0');
  return `${hexHash}-0000-4000-8000-${strHex}`;
};

// Initial default seeds used ONLY on first setup if Supabase & LocalStorage are completely empty
const initialSchools: School[] = [
  {
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
  }
];

const initialStudents: Student[] = [
  {
    id: 'std-001',
    organization_id: 'org-saint-viateur-01',
    school_id: 'school-palmeraie-01',
    registration_number: '24180492A',
    first_name: 'Awa Fatima',
    last_name: 'DIABATÉ',
    date_of_birth: '2011-04-12',
    place_of_birth: 'Abidjan Cocody',
    gender: 'F',
    nationality: 'Ivoirienne',
    blood_group: 'O+',
    status: 'Inscrit',
    current_class_name: '3ème 2',
    address: 'Riviera Palmeraie, Cité Lauriers',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'
  },
  {
    id: 'std-002',
    organization_id: 'org-saint-viateur-01',
    school_id: 'school-palmeraie-01',
    registration_number: '24180493B',
    first_name: 'Marc-Aurèle',
    last_name: 'KOFFI',
    date_of_birth: '2011-08-25',
    place_of_birth: 'Yamoussoukro',
    gender: 'M',
    nationality: 'Ivoirienne',
    blood_group: 'A+',
    status: 'Reinscrit',
    current_class_name: '3ème 2',
    address: 'Angré 8ème Tranche',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300'
  },
  {
    id: 'std-003',
    organization_id: 'org-saint-viateur-01',
    school_id: 'school-palmeraie-01',
    registration_number: '24180494C',
    first_name: 'Grace Emmanuelle',
    last_name: 'TANO',
    date_of_birth: '2011-11-05',
    place_of_birth: 'Bouaké',
    gender: 'F',
    nationality: 'Ivoirienne',
    blood_group: 'B+',
    status: 'Inscrit',
    current_class_name: '3ème 2',
    address: 'Riviera Bonoumin',
    photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300'
  },
  {
    id: 'std-004',
    organization_id: 'org-saint-viateur-01',
    school_id: 'school-palmeraie-01',
    registration_number: '24180495D',
    first_name: 'Mohamed Lamine',
    last_name: 'TRAORÉ',
    date_of_birth: '2011-02-18',
    place_of_birth: 'Korhogo',
    gender: 'M',
    nationality: 'Ivoirienne',
    blood_group: 'O+',
    status: 'Inscrit',
    current_class_name: '3ème 2',
    address: 'Abobo BC',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300'
  },
  {
    id: 'std-005',
    organization_id: 'org-saint-viateur-01',
    school_id: 'school-palmeraie-01',
    registration_number: '24180496E',
    first_name: 'Débora',
    last_name: 'YAO SERI WETIA',
    date_of_birth: '2012-05-14',
    place_of_birth: 'Daloa',
    gender: 'F',
    nationality: 'Ivoirienne',
    blood_group: 'A+',
    status: 'Inscrit',
    current_class_name: '6ème 1',
    address: 'Palmeraie Triangle',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300'
  }
];

const initialClasses: SchoolClass[] = [
  { id: 'cls-6e1', school_id: 'school-palmeraie-01', academic_year_id: 'ay-2025-2026', level_id: 'lvl-6e', level_name: '6ème', name: '6ème 1', room_number: 'A-101', capacity: 45, student_count: 42, main_teacher_name: 'Mme Binta SY' },
  { id: 'cls-3e2', school_id: 'school-palmeraie-01', academic_year_id: 'ay-2025-2026', level_id: 'lvl-3e', level_name: '3ème', name: '3ème 2', room_number: 'B-204', capacity: 45, student_count: 40, main_teacher_name: 'Dr. Yao KOUADIO' },
  { id: 'cls-tles1', school_id: 'school-palmeraie-01', academic_year_id: 'ay-2025-2026', level_id: 'lvl-tle', level_name: 'Terminale', name: 'Tle D1', room_number: 'C-302', capacity: 40, student_count: 38, main_teacher_name: 'M. Emmanuel BLA' }
];

const initialSubjects: Subject[] = [
  // 1er Cycle (6ème / 5ème)
  { id: 'sbj-fr-1er', school_id: 'school-palmeraie-01', code: 'FRAN', name: 'Français (Oral, Orth, Rédaction)', category: 'Littéraire', coefficient: 3, level_name: '6ème / 5ème' },
  { id: 'sbj-math-1er', school_id: 'school-palmeraie-01', code: 'MATH', name: 'Mathématiques', category: 'Scientifique', coefficient: 3, level_name: '6ème / 5ème' },
  { id: 'sbj-ang-1er', school_id: 'school-palmeraie-01', code: 'ANG', name: 'Anglais', category: 'Langue', coefficient: 2, level_name: '6ème / 5ème' },
  { id: 'sbj-hg-1er', school_id: 'school-palmeraie-01', code: 'HG', name: 'Histoire-Géographie', category: 'Littéraire', coefficient: 2, level_name: '6ème / 5ème' },
  { id: 'sbj-pc-1er', school_id: 'school-palmeraie-01', code: 'PHYS', name: 'Physique-Chimie', category: 'Scientifique', coefficient: 2, level_name: '6ème / 5ème' },
  { id: 'sbj-svt-1er', school_id: 'school-palmeraie-01', code: 'SVT', name: 'Sciences de la Vie et de la Terre', category: 'Scientifique', coefficient: 2, level_name: '6ème / 5ème' },
  { id: 'sbj-art-1er', school_id: 'school-palmeraie-01', code: 'ART', name: 'Arts Plastiques / Éd. Musicale', category: 'Artistique', coefficient: 1, level_name: '6ème / 5ème' },
  { id: 'sbj-edhc-1er', school_id: 'school-palmeraie-01', code: 'EDHC', name: 'E.D.H.C.', category: 'Civique', coefficient: 1, level_name: '6ème / 5ème' },
  { id: 'sbj-eps-1er', school_id: 'school-palmeraie-01', code: 'EPS', name: 'E.P.S.', category: 'Sport', coefficient: 1, level_name: '6ème / 5ème' },

  // 1er Cycle (4ème / 3ème BEPC)
  { id: 'sbj-fr-3e', school_id: 'school-palmeraie-01', code: 'FRAN', name: 'Français (Oral/Gram, Rédaction)', category: 'Littéraire', coefficient: 4, level_name: '4ème / 3ème' },
  { id: 'sbj-math-3e', school_id: 'school-palmeraie-01', code: 'MATH', name: 'Mathématiques', category: 'Scientifique', coefficient: 3, level_name: '4ème / 3ème' },
  { id: 'sbj-ang-3e', school_id: 'school-palmeraie-01', code: 'ANG', name: 'Anglais', category: 'Langue', coefficient: 2, level_name: '4ème / 3ème' },
  { id: 'sbj-lv2-3e', school_id: 'school-palmeraie-01', code: 'LV2', name: 'L.V.2 (Allemand / Espagnol)', category: 'Langue', coefficient: 1, level_name: '4ème / 3ème' },
  { id: 'sbj-hg-3e', school_id: 'school-palmeraie-01', code: 'HG', name: 'Histoire-Géographie', category: 'Littéraire', coefficient: 2, level_name: '4ème / 3ème' },
  { id: 'sbj-pc-3e', school_id: 'school-palmeraie-01', code: 'PHYS', name: 'Physique-Chimie', category: 'Scientifique', coefficient: 2, level_name: '4ème / 3ème' },
  { id: 'sbj-svt-3e', school_id: 'school-palmeraie-01', code: 'SVT', name: 'Sciences de la Vie et de la Terre', category: 'Scientifique', coefficient: 2, level_name: '4ème / 3ème' },
  { id: 'sbj-art-3e', school_id: 'school-palmeraie-01', code: 'ART', name: 'Arts Plastiques / Éd. Musicale', category: 'Artistique', coefficient: 1, level_name: '4ème / 3ème' },
  { id: 'sbj-edhc-3e', school_id: 'school-palmeraie-01', code: 'EDHC', name: 'E.D.H.C.', category: 'Civique', coefficient: 1, level_name: '4ème / 3ème' },
  { id: 'sbj-eps-3e', school_id: 'school-palmeraie-01', code: 'EPS', name: 'E.P.S.', category: 'Sport', coefficient: 1, level_name: '4ème / 3ème' },

  // 2nd Cycle (Tle D)
  { id: 'sbj-math-td', school_id: 'school-palmeraie-01', code: 'MATH', name: 'Mathématiques (Tle D)', category: 'Scientifique', coefficient: 4, level_name: 'Tle D' },
  { id: 'sbj-pc-td', school_id: 'school-palmeraie-01', code: 'PHYS', name: 'Physique-Chimie (Tle D)', category: 'Scientifique', coefficient: 4, level_name: 'Tle D' },
  { id: 'sbj-svt-td', school_id: 'school-palmeraie-01', code: 'SVT', name: 'SVT (Tle D)', category: 'Scientifique', coefficient: 4, level_name: 'Tle D' },
  { id: 'sbj-fr-td', school_id: 'school-palmeraie-01', code: 'FRAN', name: 'Français (Tle D)', category: 'Littéraire', coefficient: 3, level_name: 'Tle D' },
  { id: 'sbj-philo-td', school_id: 'school-palmeraie-01', code: 'PHILO', name: 'Philosophie (Tle D)', category: 'Littéraire', coefficient: 2, level_name: 'Tle D' },
  { id: 'sbj-hg-td', school_id: 'school-palmeraie-01', code: 'HG', name: 'Histoire-Géographie (Tle D)', category: 'Littéraire', coefficient: 2, level_name: 'Tle D' },
  { id: 'sbj-ang-td', school_id: 'school-palmeraie-01', code: 'ANG', name: 'Anglais (Tle D)', category: 'Langue', coefficient: 1, level_name: 'Tle D' },
  { id: 'sbj-eps-td', school_id: 'school-palmeraie-01', code: 'EPS', name: 'E.P.S. (Tle D)', category: 'Sport', coefficient: 2, level_name: 'Tle D' },

  // 2nd Cycle (Tle A1 / A2)
  { id: 'sbj-philo-ta', school_id: 'school-palmeraie-01', code: 'PHILO', name: 'Philosophie (Tle A)', category: 'Littéraire', coefficient: 5, level_name: 'Tle A' },
  { id: 'sbj-fr-ta', school_id: 'school-palmeraie-01', code: 'FRAN', name: 'Français (Tle A)', category: 'Littéraire', coefficient: 4, level_name: 'Tle A' },
  { id: 'sbj-ang-ta', school_id: 'school-palmeraie-01', code: 'ANG', name: 'Anglais (Tle A)', category: 'Langue', coefficient: 4, level_name: 'Tle A' },
  { id: 'sbj-lv2-ta', school_id: 'school-palmeraie-01', code: 'LV2', name: 'LV2 (All / Esp - Tle A)', category: 'Langue', coefficient: 3, level_name: 'Tle A' },
  { id: 'sbj-hg-ta', school_id: 'school-palmeraie-01', code: 'HG', name: 'Histoire-Géographie (Tle A)', category: 'Littéraire', coefficient: 3, level_name: 'Tle A' },
  { id: 'sbj-math-ta1', school_id: 'school-palmeraie-01', code: 'MATH', name: 'Mathématiques (Tle A1)', category: 'Scientifique', coefficient: 4, level_name: 'Tle A' },
  { id: 'sbj-svt-ta', school_id: 'school-palmeraie-01', code: 'SVT', name: 'SVT (Tle A)', category: 'Scientifique', coefficient: 2, level_name: 'Tle A' },
  { id: 'sbj-eps-ta', school_id: 'school-palmeraie-01', code: 'EPS', name: 'E.P.S. (Tle A)', category: 'Sport', coefficient: 2, level_name: 'Tle A' },
  { id: 'sbj-cond-gen', school_id: 'school-palmeraie-01', code: 'CONDUITE', name: 'Conduite / Discipline', category: 'Discipline', coefficient: 1, level_name: 'Tous les niveaux' }
];

const initialStaff: UserProfile[] = [
  { id: 'tch-01', first_name: 'Dr. Yao', last_name: 'KOUADIO', email: 'y.kouadio@saintviateur.ci', phone: '+225 05 05 44 55 66', role: 'enseignant', subject_name: 'Mathématiques', is_active: true, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { id: 'tch-02', first_name: 'Mme Binta', last_name: 'SY', email: 'b.sy@saintviateur.ci', phone: '+225 07 47 12 34 56', role: 'prof_principal', subject_name: 'Français (Oral/Gram, Rédaction)', is_active: true, avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200' },
  { id: 'adm-01', first_name: 'Honoré', last_name: 'BAMBA', email: 'h.bamba@saintviateur.ci', phone: '+225 05 01 22 33 44', role: 'educateur', subject_name: 'Éducateur de Niveau Collège', is_active: true, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
  { id: 'adm-03', first_name: 'Brou', last_name: 'KOUAMÉ', email: 'b.kouame@saintviateur.ci', phone: '+225 05 02 33 44 55', role: 'educateur', subject_name: 'Éducateur de Niveau Lycée', is_active: true, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  { id: 'adm-02', first_name: 'Marc-Antoine', last_name: 'KOFFI', email: 'm.koffi@saintviateur.ci', phone: '+225 05 04 33 22 11', role: 'censeur', subject_name: 'Philosophie', is_active: true, avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' }
];

const initialPayments: PaymentTransaction[] = [
  { id: 'tx-1001', school_id: 'school-palmeraie-01', receipt_number: 'REC-2026-0089', student_name: 'Awa Fatima DIABATÉ', amount: 150000, payment_method: 'Wave', transaction_id: 'WAVE-CI-8921039', payer_phone: '+225 07 09 88 77 66', payer_name: 'Ibrahim DIABATÉ', status: 'Succès', created_at: new Date().toISOString() },
  { id: 'tx-1002', school_id: 'school-palmeraie-01', receipt_number: 'REC-2026-0090', student_name: 'Marc-Aurèle KOFFI', amount: 100000, payment_method: 'Orange Money', transaction_id: 'OM-CI-7738291', payer_phone: '+225 07 47 11 22 33', payer_name: 'Sylvie KOFFI', status: 'Succès', created_at: new Date().toISOString() }
];

// Local Storage Helper Functions for Guaranteeing Permanent Persistence
export const getLocalCache = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(`sysgestionecole_${key}`);
    if (!item) {
      localStorage.setItem(`sysgestionecole_${key}`, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch {
    return fallback;
  }
};

export const setLocalCache = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(`sysgestionecole_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('[LocalStorage Error]:', e);
  }
};

export const checkConnectionDetailed = async (): Promise<{ connected: boolean; configured: boolean; message: string; error?: any }> => {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return {
      connected: false,
      configured: false,
      message: 'Supabase n\'est pas encore configuré. Veuillez renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env.'
    };
  }
  try {
    const { error } = await supabase.from('schools').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        configured: true,
        message: `Erreur Supabase (${error.code || 'API'}): ${error.message}`,
        error
      };
    }
    return {
      connected: true,
      configured: true,
      message: 'Connecté et synchronisé avec la base de données Supabase.'
    };
  } catch (e: any) {
    return {
      connected: false,
      configured: true,
      message: `Exception de connexion: ${e?.message || 'Erreur réseau'}`,
      error: e
    };
  }
};

export const supabaseService = {
  // Check Connection Status
  async checkConnection() {
    try {
      const { error } = await supabase.from('schools').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  checkConnectionDetailed,

  // 1. Schools Configuration
  async fetchSchools(): Promise<School[]> {
    const cached = getLocalCache<School[]>('schools', initialSchools);
    try {
      const { data, error } = await supabase.from('schools').select('*');
      if (!error && data && data.length > 0) {
        const isDefaultInitial = data.length === 1 && data[0].name === initialSchools[0].name;
        const isCacheCustomized = cached.some(s => s.name !== initialSchools[0].name || s.registration_number !== initialSchools[0].registration_number);
        
        if (isCacheCustomized && isDefaultInitial) {
          return cached;
        }
        setLocalCache('schools', data);
        return data as School[];
      }
    } catch (e) {
      console.warn('[Supabase Fetch Schools Error]:', e);
    }
    return cached;
  },

  async updateSchoolConfig(schoolId: string, updates: Partial<School>) {
    const current = getLocalCache<School[]>('schools', initialSchools);
    const updated = current.map(s => s.id === schoolId ? { ...s, ...updates } : s);
    setLocalCache('schools', updated);

    const currentSchool = getLocalCache<School>('current_school', updated[0]);
    if (currentSchool && currentSchool.id === schoolId) {
      setLocalCache('current_school', { ...currentSchool, ...updates });
    }

    try {
      const { error } = await supabase.from('schools').upsert({ id: schoolId, ...updates });
      if (error) console.warn('[Supabase Update School Error]:', error);
    } catch (e) {
      console.warn('[Supabase Sync Error]:', e);
    }
    return updated;
  },

  async addSchool(newSchool: School) {
    const current = getLocalCache<School[]>('schools', initialSchools);
    const updated = [newSchool, ...current];
    setLocalCache('schools', updated);
    setLocalCache('current_school', newSchool);

    try {
      const { error } = await supabase.from('schools').insert(newSchool);
      if (error) console.warn('[Supabase Add School Error]:', error);
    } catch (e) {
      console.warn('[Supabase Add School Exception]:', e);
    }
    return updated;
  },

  async deleteSchool(schoolId: string) {
    const current = getLocalCache<School[]>('schools', initialSchools);
    const updated = current.filter(s => s.id !== schoolId);
    setLocalCache('schools', updated);

    const currentSchool = getLocalCache<School>('current_school', current[0]);
    if (currentSchool && currentSchool.id === schoolId) {
      if (updated.length > 0) {
        setLocalCache('current_school', updated[0]);
      } else {
        setLocalCache('current_school', initialSchools[0]);
      }
    }

    // Cascade delete linked data from local storage
    const cachedStudents = getLocalCache<Student[]>('students', []).filter(s => s.school_id !== schoolId);
    setLocalCache('students', cachedStudents);

    const cachedClasses = getLocalCache<SchoolClass[]>('classes', []).filter(c => c.school_id !== schoolId);
    setLocalCache('classes', cachedClasses);

    try {
      await supabase.from('schools').delete().eq('id', schoolId);
      await supabase.from('students').delete().eq('school_id', schoolId);
      await supabase.from('classes').delete().eq('school_id', schoolId);
      await supabase.from('subscriptions').delete().eq('school_id', schoolId);
    } catch (e) {
      console.warn('[Supabase Delete School Exception]:', e);
    }
    return updated;
  },

  // 2. Students
  async fetchStudents(): Promise<Student[]> {
    try {
      const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocalCache('students', data);
        return data as Student[];
      }
    } catch (e) {
      console.warn('[Supabase Fetch Students Error]:', e);
    }
    return getLocalCache('students', initialStudents);
  },

  async saveStudent(student: Partial<Student>) {
    const current = await this.fetchStudents();
    const existingIndex = current.findIndex(s => s.id === student.id);
    let updated: Student[];
    if (existingIndex >= 0) {
      updated = current.map(s => s.id === student.id ? { ...s, ...student } as Student : s);
    } else {
      updated = [student as Student, ...current];
    }
    setLocalCache('students', updated);

    // Sync student_count on classes cache
    const cachedClasses = getLocalCache<SchoolClass[]>('classes', initialClasses);
    if (cachedClasses && cachedClasses.length > 0) {
      const updatedClasses = cachedClasses.map(cls => {
        const count = updated.filter(s => s.current_class_name === cls.name).length;
        return { ...cls, student_count: count };
      });
      setLocalCache('classes', updatedClasses);
    }

    try {
      const dbPayload = {
        ...student,
        id: toValidUuid(student.id),
        school_id: student.school_id ? toValidUuid(student.school_id) : undefined,
      };
      const { error } = await supabase.from('students').upsert(dbPayload);
      if (error) console.error('[Supabase Student Sync Error]:', error);
    } catch (e) {
      console.error('[Supabase Student Sync Exception]:', e);
    }
    return updated;
  },

  async deleteStudent(id: string) {
    const current = await this.fetchStudents();
    const updated = current.filter(s => s.id !== id);
    setLocalCache('students', updated);

    // Sync student_count on classes cache
    const cachedClasses = getLocalCache<SchoolClass[]>('classes', initialClasses);
    if (cachedClasses && cachedClasses.length > 0) {
      const updatedClasses = cachedClasses.map(cls => {
        const count = updated.filter(s => s.current_class_name === cls.name).length;
        return { ...cls, student_count: count };
      });
      setLocalCache('classes', updatedClasses);
    }

    try {
      const targetId = toValidUuid(id);
      const { error } = await supabase.from('students').delete().eq('id', targetId);
      if (error) console.error('[Supabase Delete Student Error]:', error);
    } catch (e) {
      console.error('[Supabase Delete Student Exception]:', e);
    }
    return updated;
  },

  // 3. Parents
  async fetchParents(): Promise<Parent[]> {
    try {
      const { data, error } = await supabase.from('parents').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocalCache('parents', data);
        return data as Parent[];
      }
    } catch (e) {
      console.warn('[Supabase Fetch Parents Error]:', e);
    }
    return getLocalCache('parents', [
      {
        id: 'prt-01',
        organization_id: 'org-saint-viateur-01',
        school_id: 'school-palmeraie-01',
        first_name: 'Ibrahim',
        last_name: 'DIABATÉ',
        phone: '+225 07 09 88 77 66',
        whatsapp: '+225 07 09 88 77 66',
        email: 'i.diabate@gmail.com',
        profession: 'Ingénieur Télécom (Orange CI)',
        address: 'Riviera Palmeraie, Abidjan',
        children: [initialStudents[0]]
      }
    ]);
  },

  async saveParent(parent: Partial<Parent>) {
    const current = await this.fetchParents();
    const existingIndex = current.findIndex(p => p.id === parent.id);
    let updated: Parent[];
    if (existingIndex >= 0) {
      updated = current.map(p => p.id === parent.id ? { ...p, ...parent } as Parent : p);
    } else {
      updated = [parent as Parent, ...current];
    }
    setLocalCache('parents', updated);

    try {
      await supabase.from('parents').upsert(parent);
    } catch (e) {
      console.warn('[Supabase Parent Sync Error]:', e);
    }
    return updated;
  },

  async deleteParent(id: string) {
    const current = await this.fetchParents();
    const updated = current.filter(p => p.id !== id);
    setLocalCache('parents', updated);

    try {
      await supabase.from('parents').delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase Delete Parent Error]:', e);
    }
    return updated;
  },

  // 4. Staff & Teachers
  async fetchStaff(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocalCache('staff', data);
        return data as UserProfile[];
      }
    } catch (e) {
      console.warn('[Supabase Fetch Staff Error]:', e);
    }
    return getLocalCache('staff', initialStaff);
  },

  async saveStaff(staff: Partial<UserProfile>) {
    const current = await this.fetchStaff();
    const existingIndex = current.findIndex(s => s.id === staff.id);
    let updated: UserProfile[];
    if (existingIndex >= 0) {
      updated = current.map(s => s.id === staff.id ? { ...s, ...staff } as UserProfile : s);
    } else {
      updated = [staff as UserProfile, ...current];
    }
    setLocalCache('staff', updated);

    try {
      await supabase.from('user_profiles').upsert(staff);
    } catch (e) {
      console.warn('[Supabase Staff Sync Error]:', e);
    }
    return updated;
  },

  async deleteStaff(id: string) {
    const current = await this.fetchStaff();
    const updated = current.filter(s => s.id !== id);
    setLocalCache('staff', updated);

    try {
      await supabase.from('user_profiles').delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase Delete Staff Error]:', e);
    }
    return updated;
  },

  async fetchClasses(): Promise<SchoolClass[]> {
    let classes: SchoolClass[] = [];
    try {
      const { data, error } = await supabase.from('classes').select('*').order('name');
      if (!error && data && data.length > 0) {
        classes = data as SchoolClass[];
      }
    } catch (e) {
      console.warn('[Supabase Fetch Classes Error]:', e);
    }

    if (classes.length === 0) {
      classes = getLocalCache('classes', initialClasses);
    }

    const students = getLocalCache<Student[]>('students', initialStudents);
    const updatedClasses = classes.map(cls => {
      const realCount = students.filter(s => s.current_class_name === cls.name).length;
      return { ...cls, student_count: realCount };
    });

    setLocalCache('classes', updatedClasses);
    return updatedClasses;
  },

  async saveClass(cls: Partial<SchoolClass>) {
    const current = await this.fetchClasses();
    const existingIndex = current.findIndex(c => c.id === cls.id);
    let updated: SchoolClass[];
    if (existingIndex >= 0) {
      updated = current.map(c => c.id === cls.id ? { ...c, ...cls } as SchoolClass : c);
    } else {
      updated = [...current, cls as SchoolClass];
    }
    setLocalCache('classes', updated);

    try {
      await supabase.from('classes').upsert(cls);
    } catch (e) {
      console.warn('[Supabase Class Sync Error]:', e);
    }
    return updated;
  },

  async deleteClass(id: string) {
    const current = await this.fetchClasses();
    const updated = current.filter(c => c.id !== id);
    setLocalCache('classes', updated);

    try {
      await supabase.from('classes').delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase Delete Class Error]:', e);
    }
    return updated;
  },

  // 6. Subjects
  async fetchSubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await supabase.from('subjects').select('*').order('code');
      if (!error && data && data.length > 0) {
        setLocalCache('subjects', data);
        return data as Subject[];
      }
    } catch (e) {
      console.warn('[Supabase Fetch Subjects Error]:', e);
    }
    return getLocalCache('subjects', initialSubjects);
  },

  async saveSubject(sbj: Partial<Subject>) {
    const current = await this.fetchSubjects();
    const existingIndex = current.findIndex(s => s.id === sbj.id);
    let updated: Subject[];
    if (existingIndex >= 0) {
      updated = current.map(s => s.id === sbj.id ? { ...s, ...sbj } as Subject : s);
    } else {
      updated = [...current, sbj as Subject];
    }
    setLocalCache('subjects', updated);

    try {
      await supabase.from('subjects').upsert(sbj);
    } catch (e) {
      console.warn('[Supabase Subject Sync Error]:', e);
    }
    return updated;
  },

  async deleteSubject(id: string) {
    const current = await this.fetchSubjects();
    const updated = current.filter(s => s.id !== id);
    setLocalCache('subjects', updated);

    try {
      await supabase.from('subjects').delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase Delete Subject Error]:', e);
    }
    return updated;
  },

  // 7. Grades
  async fetchGrades(): Promise<any[]> {
    try {
      const { data, error } = await supabase.from('grades').select('*');
      if (!error && data && data.length > 0) {
        setLocalCache('grades', data);
        return data;
      }
    } catch (e) {
      console.warn('[Supabase Fetch Grades Error]:', e);
    }
    return getLocalCache('grades', []);
  },

  async fetchGradesKeyed(className: string, subjectName: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.from('grades').select('*').eq('class_name', className).eq('subject_name', subjectName);
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('[Supabase Fetch Keyed Grades Error]:', e);
    }
    const allGradesMap = getLocalCache<Record<string, any[]>>('grades_by_class_subject', {});
    const key = `${className}__${subjectName}`;
    return allGradesMap[key] || [];
  },

  async fetchAllClassGrades(className: string): Promise<Record<string, any[]>> {
    const allGradesMap = getLocalCache<Record<string, any[]>>('grades_by_class_subject', {});
    const result: Record<string, any[]> = {};
    const prefix = `${className}__`;
    Object.keys(allGradesMap).forEach(key => {
      if (key.startsWith(prefix)) {
        const subjectName = key.substring(prefix.length);
        result[subjectName] = allGradesMap[key];
        // Also store simplified key (e.g. "Français" for "Français (Oral/Gram, Rédaction)")
        const simpleName = subjectName.split('(')[0].trim();
        if (simpleName && !result[simpleName]) {
          result[simpleName] = allGradesMap[key];
        }
      }
    });
    return result;
  },

  async saveGradesBatch(gradesData: any[], className?: string, subjectName?: string) {
    setLocalCache('grades', gradesData);
    if (className && subjectName) {
      const allGradesMap = getLocalCache<Record<string, any[]>>('grades_by_class_subject', {});
      const key = `${className}__${subjectName}`;
      allGradesMap[key] = gradesData;
      setLocalCache('grades_by_class_subject', allGradesMap);
    }
    try {
      await supabase.from('grades').upsert(gradesData);
    } catch (e) {
      console.warn('[Supabase Grades Sync Error]:', e);
    }
    return gradesData;
  },

  // 7.5. Attendance
  async fetchAttendance(date?: string, className?: string): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase.from('attendance_records').select('*');
      if (!error && data && data.length > 0) {
        setLocalCache('attendance', data);
        let records = data as AttendanceRecord[];
        if (date) records = records.filter(r => r.date === date);
        if (className) records = records.filter(r => r.class_name === className || r.class_id === className);
        return records;
      }
    } catch (e) {
      console.warn('[Supabase Fetch Attendance Error]:', e);
    }
    const cached = getLocalCache<AttendanceRecord[]>('attendance', []);
    let records = cached;
    if (date) records = records.filter(r => r.date === date);
    if (className) records = records.filter(r => r.class_name === className || r.class_id === className);
    return records;
  },

  async saveAttendanceBatch(records: AttendanceRecord[]) {
    const current = getLocalCache<AttendanceRecord[]>('attendance', []);
    const map = new Map<string, AttendanceRecord>();
    current.forEach(r => map.set(`${r.student_id}_${r.date}`, r));
    records.forEach(r => map.set(`${r.student_id}_${r.date}`, r));
    const updated = Array.from(map.values());

    setLocalCache('attendance', updated);
    try {
      await supabase.from('attendance_records').upsert(records);
    } catch (e) {
      console.warn('[Supabase Attendance Sync Error]:', e);
    }
    return updated;
  },

  // 8. Payment Transactions
  async fetchPayments(): Promise<PaymentTransaction[]> {
    try {
      const { data, error } = await supabase.from('payment_transactions').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setLocalCache('payments', data);
        return data as PaymentTransaction[];
      }
    } catch (e) {
      console.warn('[Supabase Fetch Payments Error]:', e);
    }
    return getLocalCache('payments', initialPayments);
  },

  async savePayment(payment: Partial<PaymentTransaction>) {
    const current = await this.fetchPayments();
    const updated = [payment as PaymentTransaction, ...current];
    setLocalCache('payments', updated);

    try {
      await supabase.from('payment_transactions').insert(payment);
    } catch (e) {
      console.warn('[Supabase Payment Sync Error]:', e);
    }
    return updated;
  },

  // 9. Notifications Log
  async saveNotificationLog(notif: any) {
    const current = getLocalCache('notifs', []);
    const updated = [notif, ...current];
    setLocalCache('notifs', updated);

    try {
      await supabase.from('communication_logs').insert(notif);
    } catch (e) {
      console.warn('[Supabase Notif Sync Error]:', e);
    }
    return updated;
  },

  // 10. Timetable Slots
  async fetchTimetableSlots(): Promise<any[]> {
    try {
      const { data, error } = await supabase.from('timetable_slots').select('*');
      if (!error && data && data.length > 0) {
        setLocalCache('timetable', data);
        return data;
      }
    } catch (e) {
      console.warn('[Supabase Fetch Timetable Error]:', e);
    }
    return getLocalCache('timetable', []);
  },

  async saveTimetableSlot(slot: any) {
    const current = await this.fetchTimetableSlots();
    const existingIndex = current.findIndex(s => s.id === slot.id);
    let updated: any[];
    if (existingIndex >= 0) {
      updated = current.map(s => s.id === slot.id ? { ...s, ...slot } : s);
    } else {
      updated = [...current, slot];
    }
    setLocalCache('timetable', updated);

    try {
      await supabase.from('timetable_slots').upsert(slot);
    } catch (e) {
      console.warn('[Supabase Timetable Sync Error]:', e);
    }
    return updated;
  },

  async deleteTimetableSlot(id: string) {
    const current = await this.fetchTimetableSlots();
    const updated = current.filter(s => s.id !== id);
    setLocalCache('timetable', updated);

    try {
      await supabase.from('timetable_slots').delete().eq('id', id);
    } catch (e) {
      console.warn('[Supabase Timetable Delete Error]:', e);
    }
    return updated;
  },

  // 10. Sync All Data to Supabase
  async syncAllDataToSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const health = await this.checkConnectionDetailed();
      if (!health.connected) {
        return { success: false, message: health.message };
      }

      const schools = (await this.fetchSchools()).map(s => ({ ...s, id: toValidUuid(s.id) }));
      const students = (await this.fetchStudents()).map(s => ({
        ...s,
        id: toValidUuid(s.id),
        school_id: s.school_id ? toValidUuid(s.school_id) : undefined
      }));
      const classes = (await this.fetchClasses()).map(c => ({
        ...c,
        id: toValidUuid(c.id),
        school_id: c.school_id ? toValidUuid(c.school_id) : undefined
      }));
      const subjects = (await this.fetchSubjects()).map(sbj => ({
        ...sbj,
        id: toValidUuid(sbj.id),
        school_id: sbj.school_id ? toValidUuid(sbj.school_id) : undefined
      }));
      const payments = (await this.fetchPayments()).map(p => ({
        ...p,
        id: toValidUuid(p.id),
        school_id: p.school_id ? toValidUuid(p.school_id) : undefined
      }));

      const resSchools = await supabase.from('schools').upsert(schools);
      if (resSchools.error) return { success: false, message: `Erreur Écoles (${resSchools.error.code}): ${resSchools.error.message}` };

      const resClasses = await supabase.from('classes').upsert(classes);
      if (resClasses.error) console.warn('[Sync Classes Warning]:', resClasses.error);

      const resStudents = await supabase.from('students').upsert(students);
      if (resStudents.error) console.warn('[Sync Students Warning]:', resStudents.error);

      const resSubjects = await supabase.from('subjects').upsert(subjects);
      if (resSubjects.error) console.warn('[Sync Subjects Warning]:', resSubjects.error);

      const resPayments = await supabase.from('payment_transactions').upsert(payments);
      if (resPayments.error) console.warn('[Sync Payments Warning]:', resPayments.error);

      return { success: true, message: 'Toutes les données ont été synchronisées avec succès dans la base de données Supabase !' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Erreur lors de la synchronisation Supabase.' };
    }
  }
};
