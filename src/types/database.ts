// ============================================================
// TYPAGE BASE DE DONNÉES SUPABASE — IVOIREÉCOLE+ (SaaS Multi-Tenant)
// Alignement strict avec PostgreSQL & Supabase Engine
// ============================================================

export type UserRole =
  | 'super_admin'
  | 'admin_org'
  | 'school_admin'
  | 'directeur'
  | 'directeur_etudes'
  | 'censeur'
  | 'educateur'
  | 'enseignant'
  | 'prof_principal'
  | 'surveillant'
  | 'secretaire'
  | 'comptable'
  | 'parent'
  | 'eleve'
  | 'bibliothecaire'
  | 'chauffeur';

export type SchoolStatus = 'pending' | 'active' | 'suspended' | 'blocked' | 'cancelled';
export type SubscriptionStatus = 'pending_payment' | 'trialing' | 'active' | 'past_due' | 'expired' | 'cancelled' | 'suspended';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'orange_money' | 'mtn_momo' | 'moov_money' | 'wave' | 'card' | 'bank_transfer' | 'cash';
export type StudentStatus = 'Inscrit' | 'Reinscrit' | 'Transfere' | 'Radie';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type AccessErrorCode =
  | 'ACCESS_GRANTED'
  | 'AUTH_REQUIRED'
  | 'PROFILE_NOT_FOUND'
  | 'PROFILE_INACTIVE'
  | 'NO_SCHOOL_MEMBERSHIP'
  | 'MEMBERSHIP_INACTIVE'
  | 'SCHOOL_PENDING'
  | 'SCHOOL_SUSPENDED'
  | 'SCHOOL_BLOCKED'
  | 'SCHOOL_CANCELLED'
  | 'SUBSCRIPTION_REQUIRED'
  | 'PENDING_PAYMENT'
  | 'SUBSCRIPTION_NOT_ACTIVE'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_SUSPENDED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'PAYMENT_FAILED';

export interface AccessCheckResult {
  allowed: boolean;
  user_id?: string;
  school_id?: string;
  role?: UserRole;
  school_status?: SchoolStatus;
  subscription_status?: SubscriptionStatus;
  plan?: string;
  permissions?: string[];
  features?: Record<string, any>;
  reason?: AccessErrorCode;
  message?: string;
  max_students?: number;
}

// ------------------------------------------------------------
// MODÈLES PRINCIPAUX DU SCHÉMA POSTGRESQL SUPABASE
// ------------------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  code: string;
  logo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  country: string;
  city: string;
  plan_type: 'Starter' | 'Standard' | 'Premium' | 'Enterprise';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface School {
  id: string;
  organization_id?: string | null;
  name: string;
  slug: string;
  registration_number?: string | null;
  motto?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  director_name?: string | null;
  logo_url?: string | null;
  school_type: 'Public' | 'Prive' | 'Confessionnel';
  status: SchoolStatus;
  education_levels?: string[];
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string; // Fait référence à auth.users.id
  organization_id?: string | null;
  school_id?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  subject_name?: string | null;
  is_active: boolean;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolMember {
  id: string;
  school_id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  organization_id?: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_archived?: boolean;
  created_at?: string;
}

export interface AcademicTerm {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  academic_year_id?: string | null;
  level_id?: string | null;
  name: string;
  level?: string | null;
  level_name?: string | null;
  room_number?: string | null;
  capacity?: number | null;
  created_at?: string;
  updated_at?: string;

  // Propriétés calculées dynamiquement pour le frontend
  student_count?: number;
  main_teacher_name?: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code?: string | null;
  coefficient: number;
  category?: string | null;
  level_name?: string | null;
  created_at?: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string | null;
  coefficient: number;
  created_at?: string;
}

export interface Student {
  id: string;
  school_id: string;
  user_id?: string | null;
  organization_id?: string | null;
  registration_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  place_of_birth?: string | null;
  gender?: 'M' | 'F' | null;
  nationality?: string | null;
  blood_group?: string | null;
  address?: string | null;
  photo_url?: string | null;
  status: StudentStatus;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;

  // DTO Joins dynamiques pour la UI
  current_class_name?: string;
  current_class_id?: string;
  parents?: Parent[];
}

export interface Parent {
  id: string;
  school_id: string;
  user_id?: string | null;
  organization_id?: string | null;
  first_name: string;
  last_name: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  profession?: string | null;
  created_at?: string;

  // DTO Joins
  children?: Student[];
}

export interface StudentGuardian {
  id: string;
  school_id: string;
  student_id: string;
  parent_id: string;
  relationship?: string | null;
  is_primary_contact: boolean;
  created_at?: string;
}

export interface Teacher {
  id: string;
  school_id: string;
  user_id?: string | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  specialization?: string | null;
  hire_date?: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  academic_term_id?: string | null;
  date: string;
  status: AttendanceStatus;
  reason?: string | null;
  created_by?: string | null;
  created_at?: string;

  // DTO Joins
  student_name?: string;
  class_name?: string;
}

export interface Assessment {
  id: string;
  school_id: string;
  class_subject_id?: string | null;
  academic_term_id?: string | null;
  name: string;
  type: 'test' | 'exam' | 'quiz' | 'homework' | 'project';
  coefficient: number;
  max_score: number;
  date?: string | null;
  created_at?: string;
}

export interface Grade {
  id: string;
  school_id: string;
  assessment_id: string;
  student_id: string;
  score?: number | null;
  comment?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentTransaction {
  id: string;
  school_id: string;
  student_id?: string;
  fee_type_id?: string | null;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod | string;
  reference?: string | null;
  status: PaymentStatus | string;
  payment_date?: string;
  description?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;

  // DTO Joins
  student_name?: string;
  receipt_number?: string;
  payer_name?: string;
  payer_phone?: string;
  transaction_id?: string;
}

export interface SaasPlan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  currency: string;
  billing_interval: 'monthly' | 'yearly';
  max_students?: number | null;
  max_teachers?: number | null;
  max_users?: number | null;
  features?: Record<string, any>;
  is_active: boolean;
  created_at?: string;
}

export interface SaasSubscriptionRecord {
  id: string;
  school_id: string;
  plan_id: string;
  plan_name?: string;
  status: SubscriptionStatus;
  starts_at?: string;
  expires_at?: string | null;
  trial_ends_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ------------------------------------------------------------
// EXAMS & HONOR ROLL INTERFACES
// ------------------------------------------------------------

export type ExamStatus = 'brouillon' | 'planifie' | 'en_cours' | 'termine' | 'publie' | 'annule' | 'draft' | 'published' | 'completed' | 'in_progress';

export interface Exam {
  id: string;
  school_id: string;
  name: string;
  exam_type: 'officiel' | 'blanc' | 'composition' | 'autre' | string;
  academic_year_id?: string;
  academic_term_id?: string | null;
  level_id?: string | null;
  class_id?: string | null;
  series_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: ExamStatus;
  description?: string | null;
  subjects_count?: number;
  candidates_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExamSubject {
  id: string;
  school_id?: string;
  exam_id: string;
  subject_id: string;
  subject_name?: string;
  coefficient: number;
  max_score: number;
  exam_date?: string | null;
  is_optional?: boolean;
}

export interface ExamCandidate {
  id: string;
  school_id?: string;
  exam_id: string;
  student_id: string;
  class_id?: string;
  registration_number?: string;
  student_name?: string;
  class_name?: string;
}

export interface ExamGrade {
  id: string;
  school_id?: string;
  exam_id: string;
  exam_subject_id?: string;
  subject_id?: string;
  student_id: string;
  score: number;
  comment?: string | null;
  is_absent?: boolean;
}

export interface ExamResult {
  id: string;
  school_id?: string;
  exam_id: string;
  student_id: string;
  student_name?: string;
  registration_number?: string;
  class_name?: string;
  total_score?: number;
  average_score?: number;
  average?: number;
  rank?: number | null;
  rank_level?: number | null;
  mention?: string | null;
  decision?: 'admis' | 'ajourne' | 'rattrapage' | string;
}

export interface HonorRollConfig {
  id: string;
  school_id: string;
  min_average: number;
  max_average?: number;
  title: string;
}

export interface HonorRoll {
  id: string;
  school_id: string;
  academic_year_id?: string;
  academic_term_id?: string;
  period_type?: string;
  class_id?: string;
  created_at?: string;
}

export interface HonorRollEntry {
  id: string;
  honor_roll_id: string;
  student_id: string;
  student_name?: string;
  average_score?: number;
  rank?: number;
  distinction?: string;
}

export interface Award {
  id: string;
  school_id: string;
  student_id: string;
  student_name?: string;
  registration_number?: string;
  class_name?: string;
  award_type: string;
  title: string;
  subject_id?: string;
  subject_name?: string;
  date_given?: string;
  awarded_at?: string;
  description?: string;
  academic_year_id?: string;
  academic_term_id?: string;
  average?: number;
  progression_delta?: number;
  rank?: number;
}

export interface Certificate {
  id: string;
  school_id: string;
  student_id: string;
  student_name?: string;
  registration_number?: string;
  class_name?: string;
  exam_id?: string;
  exam_name?: string;
  certificate_number?: string;
  certificate_type?: string;
  title: string;
  issue_date?: string;
  issued_at?: string;
  average?: number;
  rank?: number;
  mention?: string;
  verification_code?: string;
}

// ------------------------------------------------------------
// TYPES DE BUDGET, RH ET PAIE — Voir types/budget.ts, types/hr.ts, types/payroll.ts
// Exportés via types/index.ts → import depuis '../../types'
// ------------------------------------------------------------

// ------------------------------------------------------------
// TYPES DE CRÉATION (INSERT DTO) & MISE À JOUR (UPDATE DTO)
// ------------------------------------------------------------

export type SchoolInsert = Omit<School, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type StudentInsert = Omit<Student, 'id' | 'created_at' | 'updated_at' | 'current_class_name' | 'current_class_id' | 'parents'> & { id?: string };
export type ClassInsert = Omit<SchoolClass, 'id' | 'created_at' | 'updated_at' | 'student_count' | 'main_teacher_name'> & { id?: string };
export type SubjectInsert = Omit<Subject, 'id' | 'created_at'> & { id?: string };
export type ParentInsert = Omit<Parent, 'id' | 'created_at' | 'children'> & { id?: string };
export type TeacherInsert = Omit<Teacher, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type AttendanceInsert = Omit<AttendanceRecord, 'id' | 'created_at' | 'student_name' | 'class_name'> & { id?: string };
export type AssessmentInsert = Omit<Assessment, 'id' | 'created_at'> & { id?: string };
export type GradeInsert = Omit<Grade, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type PaymentInsert = Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at' | 'student_name' | 'receipt_number'> & { id?: string };
