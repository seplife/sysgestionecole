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
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

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

export interface SaasPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency?: string;
  billing_interval: 'monthly' | 'yearly';
  max_students?: number | null;
  max_teachers?: number | null;
  max_users?: number | null;
  features: Record<string, any>;
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
  expires_at?: string;
  trial_ends_at?: string;
  cancelled_at?: string;
  created_at?: string;
}

export interface SaasPaymentRecord {
  id: string;
  school_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  payment_method: 'orange_money' | 'mtn_momo' | 'moov_money' | 'wave' | 'card' | 'bank_transfer' | 'cash';
  transaction_reference: string;
  status: PaymentStatus;
  paid_at?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  user_id?: string;
  organization_id?: string;
  school_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  subject_name?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  country: string;
  city: string;
  plan_type: 'Starter' | 'Standard' | 'Premium' | 'Enterprise';
  is_active: boolean;
  created_at: string;
}

export interface School {
  id: string;
  organization_id?: string;
  name: string;
  slug?: string;
  registration_number?: string;
  motto?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  director_name?: string;
  logo_url?: string;
  school_type: 'Public' | 'Prive' | 'Confessionnel';
  status?: SchoolStatus;
  education_levels?: string[];
  created_at?: string;
  updated_at?: string;
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
  period_type?: 'Trimestre' | 'Semestre';
  start_date?: string;
  end_date?: string;
  weight?: number;
  created_at?: string;
}

export interface Student {
  id: string;
  school_id: string;
  organization_id?: string;
  user_id?: string;
  registration_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  place_of_birth?: string;
  gender?: 'M' | 'F';
  nationality?: string;
  photo_url?: string;
  blood_group?: string;
  medical_conditions?: string;
  status: 'Inscrit' | 'Reinscrit' | 'Transfere' | 'Radie';
  current_class_name?: string;
  address?: string;
  parents?: Parent[];
  created_at?: string;
  updated_at?: string;
}

export interface Parent {
  id: string;
  school_id: string;
  organization_id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  profession?: string;
  address?: string;
  children?: Student[];
  created_at?: string;
}

export interface Level {
  id: string;
  school_id: string;
  name: string;
  cycle: 'Prescolaire' | 'Primaire' | 'Secondaire_Premier_Cycle' | 'Secondaire_Second_Cycle';
  order_index: number;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  academic_year_id?: string;
  level_id?: string;
  level_name?: string;
  level?: string;
  name: string;
  room_number?: string;
  capacity?: number;
  student_count?: number;
  main_teacher_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code?: string;
  coefficient?: number;
  category?: string;
  level_name?: string;
  created_at?: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  coefficient?: number;
  created_at?: string;
}

export interface Assessment {
  id: string;
  school_id: string;
  class_subject_id?: string;
  academic_term_id?: string;
  class_id?: string;
  subject_id?: string;
  subject_name?: string;
  title?: string;
  name?: string;
  type?: 'test' | 'exam' | 'quiz' | 'homework' | 'project';
  assessment_type?: 'Interrogation' | 'Devoir' | 'Composition' | 'Examen';
  coefficient?: number;
  max_score?: number;
  weight?: number;
  date?: string;
  date_given?: string;
  created_at?: string;
}

export interface Grade {
  id: string;
  school_id: string;
  assessment_id?: string;
  student_id: string;
  student_name?: string;
  matricule?: string;
  class_name?: string;
  subject_name?: string;
  score?: number;
  comment?: string;
  int1?: number;
  int2?: number;
  int3?: number;
  int4?: number;
  ds1?: number;
  ds2?: number;
  ds3?: number;
  dn?: number;
  subject_average?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SubjectGradeSummary {
  subject_name: string;
  coefficient: number;
  teacher_name: string;
  scores: number[];
  average: number;
  rank: number;
  appreciation: string;
}

export interface ReportCard {
  id: string;
  school_id: string;
  student_id: string;
  class_id?: string;
  academic_term_id?: string;
  student_name?: string;
  registration_number?: string;
  class_name?: string;
  academic_term_name?: string;
  academic_year_name?: string;
  overall_average?: number;
  class_average?: number;
  highest_average?: number;
  lowest_average?: number;
  total_score?: number;
  average?: number;
  rank?: number;
  total_students?: number;
  absences_count?: number;
  late_count?: number;
  subject_summaries?: SubjectGradeSummary[];
  general_appreciation?: string;
  appreciation?: string;
  council_decision?: string;
  principal_signature?: string;
  is_published?: boolean;
  published?: boolean;
  published_at?: string;
  date_generated?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  academic_term_id?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'Present' | 'Absent' | 'Retard' | 'Excuse';
  reason?: string;
  minutes_late?: number;
  is_justified?: boolean;
  student_name?: string;
  class_name?: string;
  created_at?: string;
}

export interface StudentFee {
  id: string;
  school_id: string;
  student_id: string;
  student_name: string;
  category_name: string;
  total_amount: number;
  discount_amount: number;
  paid_amount: number;
  due_date: string;
  status: 'Impaye' | 'Partiel' | 'Paye';
}

export interface PaymentTransaction {
  id: string;
  school_id: string;
  student_id?: string;
  student_name?: string;
  fee_type_id?: string;
  receipt_number?: string;
  reference?: string;
  amount: number;
  currency?: string;
  payment_method: string;
  transaction_id?: string;
  payer_phone?: string;
  payer_name?: string;
  status: string;
  payment_date?: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommunicationLog {
  id: string;
  school_id: string;
  target_group?: string;
  recipient_phone?: string;
  recipient_name?: string;
  channel?: string;
  subject?: string;
  content?: string;
  message_text?: string;
  status?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  school_id?: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface SaasSubscription {
  id: string;
  organization_name: string;
  school_count: number;
  student_count: number;
  plan_name: 'Starter' | 'Standard' | 'Premium' | 'Enterprise';
  mrr_fcfa: number;
  status: 'Actif' | 'Essai' | 'En retard' | 'Suspendu';
  next_billing_date: string;
}

export interface BookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  level_target?: string;
  condition?: 'Neuf' | 'Bon état' | 'Usagé' | 'À remplacer';
  totalQuantity: number;
  availableQuantity: number;
  created_at?: string;
}

export interface BookLoan {
  id: string;
  book_id: string;
  book_title: string;
  student_id?: string;
  student_name: string;
  student_matricule: string;
  class_name: string;
  loan_date: string;
  due_date: string;
  return_date?: string | null;
  status: 'En cours' | 'Restitué' | 'En retard' | 'Perdu / Endommagé';
  notes?: string;
  created_at?: string;
}
