import { HrPaymentMethod as PaymentMethod } from './hr';

export type PayrollPeriodStatus = 'brouillon' | 'preparation' | 'calculee' | 'validee' | 'payee' | 'cloturee';
export type ComponentCategory = 'gain' | 'retenue';
export type CalculationMethod = 'montant_fixe' | 'pourcentage' | 'taux_horaire' | 'formule';
export type PayslipStatus = 'brouillon' | 'valide' | 'paye' | 'annule';

export interface PayrollPeriod {
  id: string;
  school_id: string;
  name: string;
  period_code: string;
  start_date: string;
  end_date: string;
  payment_due_date?: string;
  status: PayrollPeriodStatus;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  closed_at?: string;
  closed_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PayrollComponent {
  id: string;
  school_id: string;
  code: string;
  name: string;
  category: ComponentCategory;
  calculation_method: CalculationMethod;
  default_amount: number;
  default_rate?: number;
  is_taxable: boolean;
  is_social_contributable: boolean;
  is_system?: boolean;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface EmployeePayrollProfile {
  id: string;
  school_id: string;
  employee_id: string;
  base_salary: number;
  housing_allowance?: number;
  transport_allowance?: number;
  function_allowance?: number;
  other_allowances?: number;
  social_security_deduction?: number;
  tax_deduction?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PayslipItem {
  id?: string;
  payslip_id?: string;
  component_code: string;
  label: string;
  category: ComponentCategory;
  base_amount?: number;
  rate?: number;
  quantity?: number;
  total_amount: number;
  display_order?: number;
}

export interface Payslip {
  id: string;
  school_id: string;
  employee_id: string;
  payroll_period_id: string;
  payslip_number: string;
  
  employee_name: string;
  employee_number: string;
  position_title?: string;
  department_name?: string;
  contract_type?: string;
  hire_date?: string;
  cnps_number?: string;
  
  base_salary: number;
  total_earnings: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  
  payment_method: PaymentMethod;
  payment_status: 'non_paye' | 'partiel' | 'paye';
  paid_amount: number;
  paid_at?: string;
  
  items?: PayslipItem[];
  status: PayslipStatus;
  created_at?: string;
  updated_at?: string;
}

export interface SalaryPayment {
  id: string;
  school_id: string;
  payslip_id: string;
  employee_id: string;
  employee_name?: string;
  payroll_period_id: string;
  payment_reference: string;
  amount: number;
  payment_method: PaymentMethod;
  bank_name?: string;
  transaction_number?: string;
  mobile_money_provider?: string;
  mobile_money_phone?: string;
  payment_date: string;
  status: 'succes' | 'en_attente' | 'echoue' | 'annule';
  notes?: string;
  created_by?: string;
  created_at?: string;
}

export interface SalaryAdvance {
  id: string;
  school_id: string;
  employee_id: string;
  employee_name?: string;
  amount: number;
  request_date: string;
  reason?: string;
  repayment_period_id?: string;
  status: 'en_attente' | 'approuve' | 'deduit' | 'rejete';
  created_at?: string;
}
