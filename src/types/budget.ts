import { PaymentMethod } from './hr';

export type ExpenseStatus = 'brouillon' | 'soumis' | 'approuve' | 'paye' | 'rejete' | 'annule';
export type RevenueStatus = 'en_attente' | 'encaisse' | 'annule';
export type BudgetStatus = 'brouillon' | 'valide' | 'cloture';

export interface BudgetPeriod {
  id: string;
  school_id: string;
  name: string;
  academic_year_id?: string;
  start_date: string;
  end_date: string;
  status: BudgetStatus;
  created_at?: string;
}

export interface CostCenter {
  id: string;
  school_id: string;
  code: string;
  name: string;
  description?: string;
  manager_name?: string;
  is_active: boolean;
  created_at?: string;
}

export interface BudgetCategory {
  id: string;
  school_id: string;
  type: 'depense' | 'recette';
  code: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  school_id: string;
  budget_period_id: string;
  cost_center_id: string;
  cost_center_name?: string;
  title: string;
  total_planned: number;
  total_committed: number;
  total_consumed: number;
  lines?: BudgetLine[];
  created_at?: string;
  updated_at?: string;
}

export interface BudgetLine {
  id: string;
  school_id: string;
  budget_id: string;
  category_id?: string;
  category_name?: string;
  code: string;
  label: string;
  planned_amount: number;
  committed_amount: number;
  consumed_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  school_id: string;
  expense_number: string;
  budget_line_id?: string;
  budget_line_label?: string;
  cost_center_id?: string;
  cost_center_name?: string;
  supplier_name?: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: PaymentMethod;
  receipt_ref?: string;
  attachment_url?: string;
  status: ExpenseStatus;
  salary_payment_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Revenue {
  id: string;
  school_id: string;
  revenue_number: string;
  category_id?: string;
  category_name?: string;
  cost_center_id?: string;
  cost_center_name?: string;
  source_name: string;
  description?: string;
  amount: number;
  revenue_date: string;
  payment_method: PaymentMethod;
  reference_number?: string;
  status: RevenueStatus;
  created_by?: string;
  created_at?: string;
}
