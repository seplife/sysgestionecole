import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getCurrentTenantContext, DEFAULT_ORGANIZATION_ID, DEFAULT_SCHOOL_ID } from '../tenantService';
import {
  TimetableSettings,
  TimetablePeriod,
  TimetableSubjectHours,
  TimetableTeacherAvailability,
  TimetableRoomAvailability,
  TimetableConstraintRule,
  TimetableVersion,
  TimetableEntry,
  TimetableAssessment,
  TimetableSpecialActivity,
  TimetableConflict,
  TimetableSubstitution,
  QualityScoreBreakdown,
  GenerationStatistics,
  ClassCategory
} from '../../types/timetable';

const STORAGE_KEY_PREFIX = 'ivoire_timetable_';

const defaultPeriods: TimetablePeriod[] = [
  { id: 'p-s1', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'S1', name: '07h15 - 08h10', start_time: '07:15', end_time: '08:10', period_type: 'REGULAR', sort_order: 1 },
  { id: 'p-s2', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'S2', name: '08h10 - 09h05', start_time: '08:10', end_time: '09:05', period_type: 'REGULAR', sort_order: 2 },
  { id: 'p-s3', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'S3', name: '09h05 - 10h00', start_time: '09:05', end_time: '10:00', period_type: 'REGULAR', sort_order: 3 },
  { id: 'p-rec', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'RECESS', name: '10h00 - 10h20 (Récréation)', start_time: '10:00', end_time: '10:20', period_type: 'RECESS', sort_order: 4 },
  { id: 'p-s4', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'S4', name: '10h20 - 11h15', start_time: '10:20', end_time: '11:15', period_type: 'REGULAR', sort_order: 5 },
  { id: 'p-s5', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'S5', name: '11h15 - 12h10', start_time: '11:15', end_time: '12:10', period_type: 'REGULAR', sort_order: 6 },
  { id: 'p-s6', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'S6', name: '14h00 - 15h00', start_time: '14:00', end_time: '15:00', period_type: 'AFTERNOON', sort_order: 7 },
  { id: 'p-s7', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'S7', name: '15h00 - 16h00', start_time: '15:00', end_time: '16:00', period_type: 'AFTERNOON', sort_order: 8 },
  { id: 'p-s8', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'S8', name: '16h00 - 17h00', start_time: '16:00', end_time: '17:00', period_type: 'AFTERNOON', sort_order: 9 },
  { id: 'p-s9', organization_id: DEFAULT_ORGANIZATION_ID, school_id: DEFAULT_SCHOOL_ID, code: 'S9', name: '17h00 - 18h00', start_time: '17:00', end_time: '18:00', period_type: 'AFTERNOON', sort_order: 10 }
];

export const getClassCategory = (className: string): ClassCategory => {
  const normalized = className.trim().toUpperCase();
  if (
    normalized.includes('3') ||
    normalized.startsWith('TLE') ||
    normalized.startsWith('TERMINALE')
  ) {
    return 'EXAM';
  }
  return 'INTERMEDIATE';
};

class TimetableService {
  private async getContext() {
    try {
      const ctx = await getCurrentTenantContext();
      return {
        organizationId: ctx.organizationId || DEFAULT_ORGANIZATION_ID,
        schoolId: ctx.schoolId || DEFAULT_SCHOOL_ID,
        academicYearId: 'ay-2025-2026'
      };
    } catch {
      return {
        organizationId: DEFAULT_ORGANIZATION_ID,
        schoolId: DEFAULT_SCHOOL_ID,
        academicYearId: 'ay-2025-2026'
      };
    }
  }

  // 1. Settings
  async getSettings(): Promise<TimetableSettings> {
    const tenant = await this.getContext();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('timetable_settings')
          .select('*')
          .eq('school_id', tenant.schoolId)
          .maybeSingle();

        if (data && !error) return data;
      } catch (err) {
        console.warn('Failed to fetch settings from Supabase:', err);
      }
    }

    // Fallback local storage
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}settings_${tenant.schoolId}`);
    if (raw) return JSON.parse(raw);

    const defaultSettings: TimetableSettings = {
      id: `set-${Date.now()}`,
      organization_id: tenant.organizationId,
      school_id: tenant.schoolId,
      academic_year_id: tenant.academicYearId,
      exam_curfew_time: '12:10:00',
      monday_pm_exam_assessments: true,
      thursday_pm_intermediate_assessments: true,
      default_recess_start: '10:00:00',
      default_recess_end: '10:20:00',
      working_days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
      is_active: true
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}settings_${tenant.schoolId}`, JSON.stringify(defaultSettings));
    return defaultSettings;
  }

  async saveSettings(settings: Partial<TimetableSettings>): Promise<TimetableSettings> {
    const tenant = await this.getContext();
    const current = await this.getSettings();
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('timetable_settings').upsert(updated);
      } catch (err) {
        console.warn('Failed to save settings to Supabase:', err);
      }
    }
    localStorage.setItem(`${STORAGE_KEY_PREFIX}settings_${tenant.schoolId}`, JSON.stringify(updated));
    return updated;
  }

  // 2. Periods
  async getPeriods(): Promise<TimetablePeriod[]> {
    return defaultPeriods;
  }

  // 3. Timetable Entries
  async getEntries(versionId?: string): Promise<TimetableEntry[]> {
    const tenant = await this.getContext();
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('timetable_entries').select('*').eq('school_id', tenant.schoolId);
        if (versionId) query = query.eq('version_id', versionId);
        const { data, error } = await query;
        if (data && !error && data.length > 0) return data;
      } catch (err) {
        console.warn('Failed to fetch timetable entries from Supabase:', err);
      }
    }

    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}entries_${tenant.schoolId}`);
    if (raw) return JSON.parse(raw);

    // Initial mock data adhering strictly to exam class rules & weekly timetable grid
    const mockEntries: TimetableEntry[] = [
      // 3e 1 (Exam Class) - Mornings only (S1-S5)
      { id: 'ent-01', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-3e1', class_name: '3ème 1', class_category: 'EXAM', subject_id: 'sbj-math', subject_name: 'Mathématiques', teacher_id: 'tch-01', teacher_name: 'Dr. Yao KOUADIO', room_name: 'Salle 12', day_of_week: 'Lundi', period_code: 'S1', start_time: '07:15', end_time: '08:10', activity_type: 'REGULAR_CLASS' },
      { id: 'ent-02', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-3e1', class_name: '3ème 1', class_category: 'EXAM', subject_id: 'sbj-math', subject_name: 'Mathématiques', teacher_id: 'tch-01', teacher_name: 'Dr. Yao KOUADIO', room_name: 'Salle 12', day_of_week: 'Lundi', period_code: 'S2', start_time: '08:10', end_time: '09:05', activity_type: 'REGULAR_CLASS' },
      { id: 'ent-03', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-3e1', class_name: '3ème 1', class_category: 'EXAM', subject_id: 'sbj-fr', subject_name: 'Français', teacher_id: 'tch-02', teacher_name: 'Mme BINTA SY', room_name: 'Salle 12', day_of_week: 'Lundi', period_code: 'S3', start_time: '09:05', end_time: '10:00', activity_type: 'REGULAR_CLASS' },
      { id: 'ent-04', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-3e1', class_name: '3ème 1', class_category: 'EXAM', subject_id: 'sbj-pc', subject_name: 'Physique-Chimie', teacher_id: 'tch-03', teacher_name: 'M. KOUAMÉ Pierre', room_name: 'Labo Physique', day_of_week: 'Lundi', period_code: 'S4', start_time: '10:20', end_time: '11:15', activity_type: 'REGULAR_CLASS' },
      { id: 'ent-05', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-3e1', class_name: '3ème 1', class_category: 'EXAM', subject_id: 'sbj-pc', subject_name: 'Physique-Chimie', teacher_id: 'tch-03', teacher_name: 'M. KOUAMÉ Pierre', room_name: 'Labo Physique', day_of_week: 'Lundi', period_code: 'S5', start_time: '11:15', end_time: '12:10', activity_type: 'REGULAR_CLASS' },

      // Monday Afternoon 3e 1 Assessment (Devoir de Niveau)
      { id: 'ent-06', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-3e1', class_name: '3ème 1', class_category: 'EXAM', subject_id: 'sbj-math', subject_name: 'Mathématiques', teacher_id: 'tch-01', teacher_name: 'Dr. Yao KOUADIO', room_name: 'Salle 12', day_of_week: 'Lundi', period_code: 'S6', start_time: '14:00', end_time: '15:00', activity_type: 'LEVEL_ASSESSMENT' },
      { id: 'ent-07', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-3e1', class_name: '3ème 1', class_category: 'EXAM', subject_id: 'sbj-math', subject_name: 'Mathématiques', teacher_id: 'tch-01', teacher_name: 'Dr. Yao KOUADIO', room_name: 'Salle 12', day_of_week: 'Lundi', period_code: 'S7', start_time: '15:00', end_time: '16:00', activity_type: 'LEVEL_ASSESSMENT' },

      // Tuesday Afternoon 3e 1 Reinforcement
      { id: 'ent-08', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-3e1', class_name: '3ème 1', class_category: 'EXAM', subject_id: 'sbj-math', subject_name: 'Préparation BEPC - Math', teacher_id: 'tch-01', teacher_name: 'Dr. Yao KOUADIO', room_name: 'Salle 12', day_of_week: 'Mardi', period_code: 'S6', start_time: '14:00', end_time: '15:00', activity_type: 'REINFORCEMENT' },

      // 6ème 1 (Intermediate Class) - Thursday Afternoon Assessment
      { id: 'ent-09', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-6e1', class_name: '6ème 1', class_category: 'INTERMEDIATE', subject_id: 'sbj-fr', subject_name: 'Français', teacher_id: 'tch-02', teacher_name: 'Mme BINTA SY', room_name: 'Salle 01', day_of_week: 'Jeudi', period_code: 'S6', start_time: '14:00', end_time: '15:00', activity_type: 'LEVEL_ASSESSMENT' },
      { id: 'ent-10', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-6e1', class_name: '6ème 1', class_category: 'INTERMEDIATE', subject_id: 'sbj-fr', subject_name: 'Français', teacher_id: 'tch-02', teacher_name: 'Mme BINTA SY', room_name: 'Salle 01', day_of_week: 'Jeudi', period_code: 'S7', start_time: '15:00', end_time: '16:00', activity_type: 'LEVEL_ASSESSMENT' },

      // Terminale D (Exam Class)
      { id: 'ent-11', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-tled', class_name: 'Terminale D', class_category: 'EXAM', subject_id: 'sbj-pc', subject_name: 'Physique-Chimie', teacher_id: 'tch-03', teacher_name: 'M. KOUAMÉ Pierre', room_name: 'Labo Physique', day_of_week: 'Mardi', period_code: 'S1', start_time: '07:15', end_time: '08:10', activity_type: 'REGULAR_CLASS' },
      { id: 'ent-12', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_id: 'v-1', class_id: 'cls-tled', class_name: 'Terminale D', class_category: 'EXAM', subject_id: 'sbj-svt', subject_name: 'SVT', teacher_id: 'tch-04', teacher_name: 'Mme KOFFI Christine', room_name: 'Labo SVT', day_of_week: 'Mardi', period_code: 'S2', start_time: '08:10', end_time: '09:05', activity_type: 'REGULAR_CLASS' }
    ];

    localStorage.setItem(`${STORAGE_KEY_PREFIX}entries_${tenant.schoolId}`, JSON.stringify(mockEntries));
    return mockEntries;
  }

  async saveEntries(entries: TimetableEntry[]): Promise<void> {
    const tenant = await this.getContext();
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('timetable_entries').upsert(entries);
      } catch (err) {
        console.warn('Failed to save entries to Supabase:', err);
      }
    }
    localStorage.setItem(`${STORAGE_KEY_PREFIX}entries_${tenant.schoolId}`, JSON.stringify(entries));
  }

  async saveEntry(entry: TimetableEntry): Promise<TimetableEntry> {
    const entries = await this.getEntries();
    const idx = entries.findIndex(e => e.id === entry.id);
    let updated: TimetableEntry[];
    if (idx >= 0) {
      updated = [...entries];
      updated[idx] = entry;
    } else {
      updated = [...entries, entry];
    }
    await this.saveEntries(updated);
    return entry;
  }

  async deleteEntry(entryId: string): Promise<void> {
    const entries = await this.getEntries();
    const filtered = entries.filter(e => e.id !== entryId);
    await this.saveEntries(filtered);
  }

  // 4. Versions
  async getVersions(): Promise<TimetableVersion[]> {
    const tenant = await this.getContext();
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}versions_${tenant.schoolId}`);
    if (raw) return JSON.parse(raw);

    const defaultVersions: TimetableVersion[] = [
      { id: 'v-1', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_number: 1, title: 'Version Officielle Trimestre 1', status: 'PUBLISHED', quality_score: 94, notes: 'Validée par le Directeur des Études', published_at: '2026-09-01T08:00:00Z', created_at: '2026-08-25T10:00:00Z' },
      { id: 'v-2', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, version_number: 2, title: 'Projet d\'optimisation T2', status: 'BROUILLON', quality_score: 88, notes: 'En cours de réajustement des créneaux EPS', created_at: '2026-12-15T14:00:00Z' }
    ];
    localStorage.setItem(`${STORAGE_KEY_PREFIX}versions_${tenant.schoolId}`, JSON.stringify(defaultVersions));
    return defaultVersions;
  }

  async createVersion(title: string, notes?: string): Promise<TimetableVersion> {
    const tenant = await this.getContext();
    const versions = await this.getVersions();
    const newVersion: TimetableVersion = {
      id: `v-${Date.now()}`,
      organization_id: tenant.organizationId,
      school_id: tenant.schoolId,
      academic_year_id: tenant.academicYearId,
      version_number: versions.length + 1,
      title,
      status: 'BROUILLON',
      quality_score: 0,
      notes,
      created_at: new Date().toISOString()
    };
    const updated = [...versions, newVersion];
    localStorage.setItem(`${STORAGE_KEY_PREFIX}versions_${tenant.schoolId}`, JSON.stringify(updated));
    return newVersion;
  }

  // 5. Substitutions & Daily Changes
  async getSubstitutions(): Promise<TimetableSubstitution[]> {
    const tenant = await this.getContext();
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}substitutions_${tenant.schoolId}`);
    if (raw) return JSON.parse(raw);

    const defaultSubs: TimetableSubstitution[] = [
      { id: 'sub-01', organization_id: tenant.organizationId, school_id: tenant.schoolId, academic_year_id: tenant.academicYearId, date: '2026-09-10', original_teacher_name: 'Dr. Yao KOUADIO', substitute_teacher_id: 'tch-03', substitute_teacher_name: 'M. KOUAMÉ Pierre', original_room_name: 'Salle 12', new_room_name: 'Labo Physique', change_type: 'REPLACEMENT', status: 'CONFIRMED', reason: 'Congé formation' }
    ];
    localStorage.setItem(`${STORAGE_KEY_PREFIX}substitutions_${tenant.schoolId}`, JSON.stringify(defaultSubs));
    return defaultSubs;
  }

  async addSubstitution(sub: Omit<TimetableSubstitution, 'id' | 'organization_id' | 'school_id' | 'academic_year_id' | 'created_at'>): Promise<TimetableSubstitution> {
    const tenant = await this.getContext();
    const subs = await this.getSubstitutions();
    const newSub: TimetableSubstitution = {
      ...sub,
      id: `sub-${Date.now()}`,
      organization_id: tenant.organizationId,
      school_id: tenant.schoolId,
      academic_year_id: tenant.academicYearId,
      created_at: new Date().toISOString()
    };
    const updated = [newSub, ...subs];
    localStorage.setItem(`${STORAGE_KEY_PREFIX}substitutions_${tenant.schoolId}`, JSON.stringify(updated));
    return newSub;
  }
}

export const timetableService = new TimetableService();
