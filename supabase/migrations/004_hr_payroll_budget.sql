-- ==============================================================================
-- MIGRATION 004: MODULE RH, PAIE, BULLETINS DE SALAIRE ET BUDGET (IVOIREECOLE+)
-- Compatible PostgreSQL / Supabase Multi-Tenant RLS
-- ==============================================================================

-- 1. SECURITE & FONCTIONS ASSISTANTES RLS
-- Fonction helper securisee pour recuperer le school_id de l'utilisateur connecte sans recursion RLS
CREATE OR REPLACE FUNCTION public.get_auth_user_school_id()
RETURNS UUID AS $$
DECLARE
  v_school_id UUID;
BEGIN
  SELECT school_id INTO v_school_id
  FROM public.user_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  RETURN v_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. SCHÉMA DU MODULE RH
-- ------------------------------------------------------------------------------

-- Departments (Départements)
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_employee_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_dept_school_code UNIQUE (school_id, code)
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_service_school_code UNIQUE (school_id, code)
);

-- Postes / Fonctions
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  category VARCHAR(100), -- Pédagogique, Administratif, Technique, Ouvrier
  description TEXT,
  base_salary_min NUMERIC(12,2) DEFAULT 0 CHECK (base_salary_min >= 0),
  base_salary_max NUMERIC(12,2) DEFAULT 0 CHECK (base_salary_max >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fiche Employé principale
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID UNIQUE, -- Lien optionnel avec Supabase Auth / user_profiles
  employee_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(150) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  gender VARCHAR(10) CHECK (gender IN ('M', 'F')),
  date_of_birth DATE,
  place_of_birth VARCHAR(255),
  nationality VARCHAR(100) DEFAULT 'Ivoirienne',
  photo_url TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relation VARCHAR(100),
  
  -- Infos Professionnelles
  employee_type VARCHAR(50) NOT NULL DEFAULT 'permanent' CHECK (employee_type IN ('permanent', 'enseignant', 'admin', 'technique', 'prestataire', 'temporaire')),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  position_name VARCHAR(255),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  employment_status VARCHAR(50) NOT NULL DEFAULT 'actif' CHECK (employment_status IN ('actif', 'en_conge', 'suspendu', 'demissionnaire', 'licencie', 'retraite', 'sorti')),
  contract_type VARCHAR(50) DEFAULT 'CDI' CHECK (contract_type IN ('CDI', 'CDD', 'temporaire', 'vacataire', 'prestataire', 'stage', 'autre')),
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Infos Financières & Paie
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
  payment_method VARCHAR(50) DEFAULT 'virement' CHECK (payment_method IN ('virement', 'mobile_money', 'cheque', 'especes')),
  bank_name VARCHAR(150),
  iban VARCHAR(100),
  mobile_money_provider VARCHAR(50), -- Wave, Orange Money, MTN MoMo, Moov
  mobile_money_number VARCHAR(50),
  cnps_number VARCHAR(100), -- Numéro Sécurité Sociale CI
  tax_id VARCHAR(100), -- Numéro CC / Déclaration Fiscale
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_emp_school_number UNIQUE (school_id, employee_number)
);

-- Documents d'employés
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL, -- Contrat, Diplôme, CNI, CV, Rib, Autre
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contrats de travail
CREATE TABLE IF NOT EXISTS public.employee_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  contract_number VARCHAR(100) NOT NULL,
  contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('CDI', 'CDD', 'temporaire', 'vacataire', 'prestataire', 'stage', 'autre')),
  start_date DATE NOT NULL,
  end_date DATE,
  trial_period_months INT DEFAULT 0 CHECK (trial_period_months >= 0),
  contractual_salary NUMERIC(12,2) NOT NULL CHECK (contractual_salary >= 0),
  weekly_hours NUMERIC(5,2) DEFAULT 40 CHECK (weekly_hours >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'actif' CHECK (status IN ('brouillon', 'actif', 'renouvele', 'expire', 'resilie')),
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affectations Enseignants (Matières & Classes)
CREATE TABLE IF NOT EXISTS public.employee_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  hourly_rate NUMERIC(10,2) DEFAULT 0 CHECK (hourly_rate >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  is_main_teacher BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Présences & Absences du Personnel
CREATE TABLE IF NOT EXISTS public.employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status VARCHAR(50) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'retard', 'conge', 'mission', 'autorisation')),
  late_minutes INT DEFAULT 0 CHECK (late_minutes >= 0),
  is_justified BOOLEAN DEFAULT FALSE,
  justification_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_emp_attendance_date UNIQUE (school_id, employee_id, date)
);

-- Types de Congés
CREATE TABLE IF NOT EXISTS public.employee_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  default_days_per_year INT DEFAULT 30 CHECK (default_days_per_year >= 0),
  is_paid BOOLEAN DEFAULT TRUE,
  requires_attachment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demandes de Congés
CREATE TABLE IF NOT EXISTS public.employee_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.employee_leave_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INT NOT NULL CHECK (duration_days > 0),
  reason TEXT,
  attachment_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'valide_n1', 'approuve', 'refuse', 'annule')),
  rejection_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

-- ------------------------------------------------------------------------------
-- 3. SCHÉMA DU MODULE PAIE
-- ------------------------------------------------------------------------------

-- Périodes de Paie
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- ex: "Septembre 2026"
  period_code VARCHAR(20) NOT NULL, -- ex: "2026-09"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_due_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'preparation', 'calculee', 'validee', 'payee', 'cloturee')),
  total_gross NUMERIC(14,2) DEFAULT 0 CHECK (total_gross >= 0),
  total_deductions NUMERIC(14,2) DEFAULT 0 CHECK (total_deductions >= 0),
  total_net NUMERIC(14,2) DEFAULT 0 CHECK (total_net >= 0),
  employee_count INT DEFAULT 0 CHECK (employee_count >= 0),
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_payroll_period_code UNIQUE (school_id, period_code)
);

-- Composants de Paie configurables (Gains / Retenues)
CREATE TABLE IF NOT EXISTS public.payroll_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('gain', 'retenue')),
  calculation_method VARCHAR(50) NOT NULL DEFAULT 'montant_fixe' CHECK (calculation_method IN ('montant_fixe', 'pourcentage', 'taux_horaire', 'formule')),
  default_amount NUMERIC(12,2) DEFAULT 0,
  default_rate NUMERIC(6,3) DEFAULT 0,
  is_taxable BOOLEAN DEFAULT TRUE,
  is_social_contributable BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_payroll_comp_code UNIQUE (school_id, code)
);

-- Profil de Paie individuel de l'employé
CREATE TABLE IF NOT EXISTS public.employee_payroll_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
  housing_allowance NUMERIC(12,2) DEFAULT 0 CHECK (housing_allowance >= 0),
  transport_allowance NUMERIC(12,2) DEFAULT 0 CHECK (transport_allowance >= 0),
  function_allowance NUMERIC(12,2) DEFAULT 0 CHECK (function_allowance >= 0),
  other_allowances NUMERIC(12,2) DEFAULT 0 CHECK (other_allowances >= 0),
  social_security_deduction NUMERIC(12,2) DEFAULT 0 CHECK (social_security_deduction >= 0),
  tax_deduction NUMERIC(12,2) DEFAULT 0 CHECK (tax_deduction >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bulletins de Salaire Individuels (Payslips)
CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE RESTRICT,
  payslip_number VARCHAR(100) NOT NULL,
  
  employee_name VARCHAR(255) NOT NULL,
  employee_number VARCHAR(50) NOT NULL,
  position_title VARCHAR(255),
  department_name VARCHAR(255),
  contract_type VARCHAR(50),
  hire_date DATE,
  cnps_number VARCHAR(100),
  
  base_salary NUMERIC(12,2) NOT NULL CHECK (base_salary >= 0),
  total_earnings NUMERIC(12,2) NOT NULL CHECK (total_earnings >= 0),
  gross_salary NUMERIC(12,2) NOT NULL CHECK (gross_salary >= 0),
  total_deductions NUMERIC(12,2) NOT NULL CHECK (total_deductions >= 0),
  net_salary NUMERIC(12,2) NOT NULL CHECK (net_salary >= 0),
  
  payment_method VARCHAR(50) DEFAULT 'virement',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'non_paye' CHECK (payment_status IN ('non_paye', 'partiel', 'paye')),
  paid_amount NUMERIC(12,2) DEFAULT 0 CHECK (paid_amount >= 0),
  paid_at TIMESTAMPTZ,
  
  status VARCHAR(50) NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'valide', 'paye', 'annule')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_payslip_emp_period UNIQUE (school_id, employee_id, payroll_period_id)
);

-- Lignes de Bulletins de Salaire
CREATE TABLE IF NOT EXISTS public.payslip_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id UUID NOT NULL REFERENCES public.payslips(id) ON DELETE CASCADE,
  component_code VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('gain', 'retenue')),
  base_amount NUMERIC(12,2) DEFAULT 0,
  rate NUMERIC(6,3) DEFAULT 0,
  quantity NUMERIC(8,2) DEFAULT 1,
  total_amount NUMERIC(12,2) NOT NULL,
  display_order INT DEFAULT 1
);

-- Paiements effectifs de Salaires
CREATE TABLE IF NOT EXISTS public.salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  payslip_id UUID NOT NULL REFERENCES public.payslips(id) ON DELETE RESTRICT,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE RESTRICT,
  payment_reference VARCHAR(100) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('virement', 'mobile_money', 'cheque', 'especes')),
  bank_name VARCHAR(150),
  transaction_number VARCHAR(150),
  mobile_money_provider VARCHAR(50),
  mobile_money_phone VARCHAR(50),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'succes' CHECK (status IN ('succes', 'en_attente', 'echoue', 'annule')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. SCHÉMA DU MODULE BUDGET & FINANCES GÉNÉRALES
-- ------------------------------------------------------------------------------

-- Périodes Budgétaires
CREATE TABLE IF NOT EXISTS public.budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'valide', 'cloture')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Centres de Coûts
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  manager_name VARCHAR(150),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_cost_center_code UNIQUE (school_id, code)
);

-- Catégories Budgétaires
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('depense', 'recette')),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_budget_cat_code UNIQUE (school_id, type, code)
);

-- Budgets Annuels
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  budget_period_id UUID NOT NULL REFERENCES public.budget_periods(id) ON DELETE CASCADE,
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  total_planned NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_planned >= 0),
  total_committed NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_committed >= 0),
  total_consumed NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_consumed >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lignes Budgétaires
CREATE TABLE IF NOT EXISTS public.budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.budget_categories(id) ON DELETE RESTRICT,
  code VARCHAR(50) NOT NULL,
  label VARCHAR(255) NOT NULL,
  planned_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (planned_amount >= 0),
  committed_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
  consumed_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (consumed_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dépenses Réelles
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  expense_number VARCHAR(100) NOT NULL,
  budget_line_id UUID REFERENCES public.budget_lines(id) ON DELETE RESTRICT,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE RESTRICT,
  supplier_name VARCHAR(255),
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) DEFAULT 'virement' CHECK (payment_method IN ('virement', 'mobile_money', 'cheque', 'especes')),
  receipt_ref VARCHAR(100),
  attachment_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'soumis', 'approuve', 'paye', 'rejete', 'annule')),
  salary_payment_id UUID REFERENCES public.salary_payments(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recettes Réelles
CREATE TABLE IF NOT EXISTS public.revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  revenue_number VARCHAR(100) NOT NULL,
  category_id UUID REFERENCES public.budget_categories(id) ON DELETE RESTRICT,
  cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE RESTRICT,
  source_name VARCHAR(255) NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50) DEFAULT 'virement',
  reference_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'encaisse' CHECK (status IN ('en_attente', 'encaisse', 'annule')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payroll_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_departments_tenant ON public.departments FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_services_tenant ON public.services FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_positions_tenant ON public.positions FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_employees_tenant ON public.employees FOR ALL USING (school_id = public.get_auth_user_school_id() OR user_id = auth.uid());
CREATE POLICY rls_employee_contracts_tenant ON public.employee_contracts FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_employee_attendance_tenant ON public.employee_attendance FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_employee_leave_requests_tenant ON public.employee_leave_requests FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_payroll_periods_tenant ON public.payroll_periods FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_payroll_components_tenant ON public.payroll_components FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_payslips_tenant ON public.payslips FOR ALL USING (school_id = public.get_auth_user_school_id() OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));
CREATE POLICY rls_salary_payments_tenant ON public.salary_payments FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_budgets_tenant ON public.budgets FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_expenses_tenant ON public.expenses FOR ALL USING (school_id = public.get_auth_user_school_id());
CREATE POLICY rls_revenues_tenant ON public.revenues FOR ALL USING (school_id = public.get_auth_user_school_id());
