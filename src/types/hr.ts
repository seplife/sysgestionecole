export type EmployeeStatus = 'actif' | 'en_conge' | 'suspendu' | 'demissionnaire' | 'licencie' | 'retraite' | 'sorti';
export type ContractType = 'CDI' | 'CDD' | 'temporaire' | 'vacataire' | 'prestataire' | 'stage' | 'autre';
export type EmployeeType = 'permanent' | 'enseignant' | 'admin' | 'technique' | 'prestataire' | 'temporaire';
export type HrPaymentMethod = 'virement' | 'mobile_money' | 'cheque' | 'especes';
export type HrAttendanceStatus = 'present' | 'absent' | 'retard' | 'conge' | 'mission' | 'autorisation';
export type LeaveStatus = 'en_attente' | 'valide_n1' | 'approuve' | 'refuse' | 'annule';

export interface Department {
  id: string;
  school_id: string;
  code: string;
  name: string;
  description?: string;
  manager_employee_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceUnit {
  id: string;
  school_id: string;
  department_id: string;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Position {
  id: string;
  school_id: string;
  department_id?: string;
  title: string;
  code?: string;
  category?: string;
  description?: string;
  base_salary_min?: number;
  base_salary_max?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: string;
  school_id: string;
  user_id?: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  gender?: 'M' | 'F';
  date_of_birth?: string;
  place_of_birth?: string;
  nationality?: string;
  photo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  
  employee_type: EmployeeType;
  department_id?: string;
  department_name?: string;
  service_id?: string;
  position_id?: string;
  position_name?: string;
  hire_date: string;
  employment_status: EmployeeStatus;
  contract_type: ContractType;
  contract_start_date?: string;
  contract_end_date?: string;
  
  base_salary: number;
  payment_method: HrPaymentMethod;
  bank_name?: string;
  iban?: string;
  mobile_money_provider?: 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money';
  mobile_money_number?: string;
  cnps_number?: string;
  tax_id?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeDocument {
  id: string;
  school_id: string;
  employee_id: string;
  title: string;
  document_type: string;
  file_url: string;
  uploaded_at?: string;
}

export interface EmployeeContract {
  id: string;
  school_id: string;
  employee_id: string;
  employee_name?: string;
  contract_number: string;
  contract_type: ContractType;
  start_date: string;
  end_date?: string;
  trial_period_months?: number;
  contractual_salary: number;
  weekly_hours?: number;
  status: 'brouillon' | 'actif' | 'renouvele' | 'expire' | 'resilie';
  document_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeAttendance {
  id: string;
  school_id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: HrAttendanceStatus;
  late_minutes?: number;
  is_justified?: boolean;
  justification_reason?: string;
  created_at?: string;
}

export interface LeaveType {
  id: string;
  school_id: string;
  name: string;
  code: string;
  default_days_per_year: number;
  is_paid: boolean;
  requires_attachment: boolean;
  created_at?: string;
}

export interface LeaveRequest {
  id: string;
  school_id: string;
  employee_id: string;
  employee_name?: string;
  leave_type_id: string;
  leave_type_name?: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  reason?: string;
  attachment_url?: string;
  status: LeaveStatus;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}
