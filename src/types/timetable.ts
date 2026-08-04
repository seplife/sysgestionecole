// ============================================================
// TYPAGE MODULE EMPLOI DU TEMPS+ (TIMETABLE MANAGEMENT)
// Multi-tenant: organization_id, school_id, academic_year_id
// ============================================================

export type ActivityType =
  | 'REGULAR_CLASS'
  | 'LEVEL_ASSESSMENT'
  | 'REINFORCEMENT'
  | 'REMEDIATION'
  | 'EXAM_PREPARATION'
  | 'REVISION'
  | 'SUPPORT'
  | 'FREE_SLOT';

export type ClassCategory = 'EXAM' | 'INTERMEDIATE';

export type PeriodType = 'REGULAR' | 'RECESS' | 'AFTERNOON' | 'ASSESSMENT';

export type ConflictSeverity = 'HARD' | 'SOFT';

export type TimetableVersionStatus =
  | 'BROUILLON'
  | 'GENERATION'
  | 'OPTIMISATION'
  | 'VALIDATION'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type ChangeType =
  | 'ABSENCE'
  | 'REPLACEMENT'
  | 'ROOM_SWAP'
  | 'CANCELLED'
  | 'RESCHEDULED';

export interface TimetableSettings {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  exam_curfew_time: string; // "12:10:00"
  monday_pm_exam_assessments: boolean;
  thursday_pm_intermediate_assessments: boolean;
  default_recess_start: string; // "10:00:00"
  default_recess_end: string; // "10:20:00"
  working_days: string[]; // ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TimetablePeriod {
  id: string;
  organization_id: string;
  school_id: string;
  code: string; // 'S1', 'S2', 'S3', 'RECESS', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'
  name: string;
  start_time: string; // "07:15"
  end_time: string; // "08:10"
  period_type: PeriodType;
  sort_order: number;
}

export interface TimetableSubjectHours {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  level_id?: string | null;
  level_name?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  subject_id: string;
  subject_name: string;
  weekly_sessions: number;
  session_duration_minutes: number;
  min_weekly_sessions: number;
  max_weekly_sessions: number;
  allow_consecutive: boolean;
  max_consecutive_sessions: number;
  requires_special_room: boolean;
  special_room_type?: string | null;
  priority: number; // 1-10
}

export interface TimetableTeacherAvailability {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  teacher_id: string;
  teacher_name?: string;
  day_of_week: string;
  period_code: string;
  is_available: boolean;
  reason?: string | null;
}

export interface TimetableRoomAvailability {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  room_name: string;
  room_type: 'STANDARD' | 'LABO_PC' | 'LABO_SVT' | 'INFORMATIQUE' | 'SPORT' | string;
  capacity: number;
  is_available: boolean;
  notes?: string | null;
}

export interface TimetableConstraintRule {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  code: string;
  name: string;
  constraint_type: ConflictSeverity;
  weight: number; // 1-100
  is_enabled: boolean;
  description: string;
}

export interface TimetableVersion {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  version_number: number;
  title: string;
  status: TimetableVersionStatus;
  quality_score: number;
  created_by?: string | null;
  notes?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TimetableEntry {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  version_id: string;
  class_id: string;
  class_name: string;
  class_category?: ClassCategory;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  room_name: string;
  day_of_week: string; // 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'
  period_code: string; // 'S1' .. 'S9'
  start_time: string; // "07:15"
  end_time: string; // "08:10"
  activity_type: ActivityType;
  is_locked?: boolean;
  has_conflict?: boolean;
  conflict_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TimetableAssessment {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  level_name: string;
  class_id?: string | null;
  subject_id: string;
  subject_name: string;
  supervisor_teacher_id?: string | null;
  supervisor_teacher_name?: string | null;
  room_name: string;
  assessment_date: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  assessment_type: string; // 'DEVOIR_DE_NIVEAU', 'EXAMEN_BLANC', 'COMPOSITION'
  status: string;
  instructions?: string | null;
}

export interface TimetableSpecialActivity {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  class_id: string;
  class_name: string;
  subject_name: string;
  teacher_name: string;
  room_name: string;
  activity_type: ActivityType;
  day_of_week: string;
  start_time: string;
  end_time: string;
  description?: string | null;
}

export interface TimetableConflict {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  version_id: string;
  conflict_type:
    | 'TEACHER_DOUBLE_BOOKING'
    | 'ROOM_DOUBLE_BOOKING'
    | 'CLASS_DOUBLE_BOOKING'
    | 'EXAM_CLASS_AFTERNOON_VIOLATION'
    | 'ASSESSMENT_SLOT_VIOLATION'
    | string;
  severity: ConflictSeverity;
  description: string;
  affected_entry_ids: string[];
  suggested_solution?: string | null;
  is_resolved: boolean;
  created_at?: string;
}

export interface TimetableSubstitution {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year_id: string;
  date: string;
  entry_id?: string | null;
  original_teacher_name: string;
  substitute_teacher_id?: string | null;
  substitute_teacher_name?: string | null;
  original_room_name?: string | null;
  new_room_name?: string | null;
  change_type: ChangeType;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  reason?: string | null;
  created_at?: string;
}

export interface QualityScoreBreakdown {
  globalScore: number;
  hardConstraintsScore: number;
  pedagogicalBalanceScore: number;
  roomOptimizationScore: number;
  teacherOptimizationScore: number;
  weeklyDistributionScore: number;
}

export interface GenerationStatistics {
  totalClassesConfigured: number;
  totalTeachersAvailable: number;
  totalRoomsAvailable: number;
  totalSubjectsConfigured: number;
  totalCoursesScheduled: number;
  totalCoursesPending: number;
  hardConflictsCount: number;
  softConflictsCount: number;
  occupancyRate: number;
  freeSlotsCount: number;
}
