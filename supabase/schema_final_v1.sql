-- ============================================================================================================================
-- IVOIREECOLE+ SAAS — SCHEMA POSTGRESQL COMPLET v1.0 FINAL
-- ERP SaaS de gestion scolaire multi-etablissements (Afrique Francophone)
-- Base : Supabase (PostgreSQL 15+)  |  Date : 2026-07-29
-- ============================================================================================================================
-- INSTRUCTIONS D'EXECUTION :
--   1. Aller sur https://app.supabase.com > votre projet > SQL Editor > New Query
--   2. Coller ce fichier entier et cliquer "Run"
--   3. Ce script est IDEMPOTENT : peut etre re-execute sans perte de donnees
-- ============================================================================================================================

-- SECTION 00 : EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- SECTION 01 : TRIGGER updated_at generique
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- ============================================================================================================================
-- SECTION 02 : ORGANIZATIONS & SCHOOLS (Multi-tenant)
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  code        VARCHAR(50)  UNIQUE NOT NULL,
  logo_url    TEXT,
  phone       VARCHAR(50),
  email       VARCHAR(150),
  country     VARCHAR(100) DEFAULT 'Cote d Ivoire',
  city        VARCHAR(100) DEFAULT 'Abidjan',
  plan_type   VARCHAR(50)  DEFAULT 'Standard'
              CHECK (plan_type IN ('Starter','Standard','Premium','Enterprise')),
  is_active   BOOLEAN      DEFAULT TRUE,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_orgs_upd ON public.organizations;
CREATE TRIGGER trg_orgs_upd BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.schools (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  slug                VARCHAR(255) UNIQUE,
  registration_number VARCHAR(100),
  motto               TEXT DEFAULT 'Excellence et Discipline',
  address             TEXT,
  city                VARCHAR(100) DEFAULT 'Abidjan',
  country             VARCHAR(100) DEFAULT 'Cote d Ivoire',
  phone               VARCHAR(50),
  whatsapp            VARCHAR(50),
  email               VARCHAR(150),
  website             VARCHAR(255),
  director_name       VARCHAR(150),
  logo_url            TEXT,
  school_type         VARCHAR(50)  DEFAULT 'Prive'
                      CHECK (school_type IN ('Public','Prive','Confessionnel')),
  education_levels    TEXT[] DEFAULT ARRAY['Prescolaire','Primaire','Secondaire'],
  status              VARCHAR(30)  DEFAULT 'active'
                      CHECK (status IN ('pending','active','suspended','blocked','cancelled')),
  is_active           BOOLEAN DEFAULT TRUE,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_schools_upd ON public.schools;
CREATE TRIGGER trg_schools_upd BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================================================================
-- SECTION 03 : UTILISATEURS & RBAC
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  school_id       UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  first_name      VARCHAR(100) NOT NULL DEFAULT '',
  last_name       VARCHAR(100) NOT NULL DEFAULT '',
  email           VARCHAR(150),
  phone           VARCHAR(50),
  avatar_url      TEXT,
  role            VARCHAR(50) DEFAULT 'directeur'
                  CHECK (role IN (
                    'super_admin','admin_org','school_admin','directeur','directeur_etudes',
                    'censeur','educateur','enseignant','prof_principal','surveillant',
                    'secretaire','comptable','parent','eleve','bibliothecaire','chauffeur')),
  subject_name    VARCHAR(150),
  is_super_admin  BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_up_upd ON public.user_profiles;
CREATE TRIGGER trg_up_upd BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.school_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role       VARCHAR(50) NOT NULL DEFAULT 'enseignant'
             CHECK (role IN (
               'super_admin','admin_org','school_admin','directeur','directeur_etudes',
               'censeur','educateur','enseignant','prof_principal','surveillant',
               'secretaire','comptable','parent','eleve','bibliothecaire','chauffeur')),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, user_id)
);

-- Trigger : creation automatique du profil a l'inscription Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, is_active)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    TRUE
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================================================================
-- SECTION 04 : SAAS — PLANS & ABONNEMENTS
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  slug             VARCHAR(100) UNIQUE NOT NULL,
  description      TEXT,
  price            NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency         VARCHAR(3) DEFAULT 'XOF',
  billing_interval VARCHAR(20) DEFAULT 'monthly'
                   CHECK (billing_interval IN ('monthly','yearly','lifetime')),
  max_students     INTEGER,
  max_teachers     INTEGER,
  max_users        INTEGER,
  features         JSONB DEFAULT '{}'::jsonb,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  plan_id       UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status        VARCHAR(30) DEFAULT 'trialing'
                CHECK (status IN ('pending_payment','trialing','active','past_due','expired','cancelled','suspended')),
  starts_at     TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_subs_upd ON public.subscriptions;
CREATE TRIGGER trg_subs_upd BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  subscription_id   UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'XOF',
  payment_method    VARCHAR(50) DEFAULT 'mobile_money',
  payment_reference VARCHAR(100),
  status            VARCHAR(30) DEFAULT 'pending'
                    CHECK (status IN ('pending','completed','failed','refunded')),
  payment_date      TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================================================================
-- SECTION 05 : STRUCTURE ACADEMIQUE
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.academic_levels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  short_name    VARCHAR(30),
  category      VARCHAR(60) DEFAULT 'Secondaire_Premier_Cycle'
                CHECK (category IN ('Prescolaire','Primaire','Secondaire_Premier_Cycle','Secondaire_Second_Cycle','Superieur')),
  order_index   INTEGER DEFAULT 1,
  is_exam_level BOOLEAN DEFAULT FALSE,
  exam_type     VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_years (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            VARCHAR(50) NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  is_current      BOOLEAN DEFAULT FALSE,
  is_archived     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_ay_upd ON public.academic_years;
CREATE TRIGGER trg_ay_upd BEFORE UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.academic_terms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name             VARCHAR(50) NOT NULL,
  period_type      VARCHAR(20) DEFAULT 'Trimestre'
                   CHECK (period_type IN ('Trimestre','Semestre','Annuel')),
  start_date       DATE,
  end_date         DATE,
  weight           NUMERIC(3,2) DEFAULT 1.0,
  is_current       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================================================================
-- SECTION 06 : CLASSES & MATIERES
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.classes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  level_id         UUID REFERENCES public.academic_levels(id) ON DELETE SET NULL,
  name             VARCHAR(100) NOT NULL,
  room_number      VARCHAR(30),
  capacity         INTEGER DEFAULT 45,
  main_teacher_id  UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_cls_upd ON public.classes;
CREATE TRIGGER trg_cls_upd BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  code        VARCHAR(20),
  coefficient NUMERIC(4,2) DEFAULT 1.0,
  category    VARCHAR(50),
  level_name  VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_subjects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id     UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id   UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id   UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  coefficient  NUMERIC(4,2) DEFAULT 1.0,
  weekly_hours NUMERIC(4,1),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_id, subject_id)
);

-- ============================================================================================================================
-- SECTION 07 : ELEVES & PARENTS
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.students (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id           UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  organization_id     UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  registration_number VARCHAR(50) NOT NULL,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  date_of_birth       DATE,
  place_of_birth      VARCHAR(150),
  gender              CHAR(1) CHECK (gender IN ('M','F')),
  nationality         VARCHAR(100) DEFAULT 'Ivoirienne',
  blood_group         VARCHAR(10),
  address             TEXT,
  photo_url           TEXT,
  status              VARCHAR(20) DEFAULT 'Inscrit'
                      CHECK (status IN ('Inscrit','Reinscrit','Transfere','Radie')),
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, registration_number)
);
DROP TRIGGER IF EXISTS trg_stu_upd ON public.students;
CREATE TRIGGER trg_stu_upd BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.student_enrollments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  enrollment_date  DATE DEFAULT CURRENT_DATE,
  is_current       BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, academic_year_id)
);

CREATE TABLE IF NOT EXISTS public.parents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  phone           VARCHAR(50),
  whatsapp        VARCHAR(50),
  email           VARCHAR(150),
  address         TEXT,
  profession      VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_guardians (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id         UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id          UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  relationship       VARCHAR(50) DEFAULT 'Parent',
  is_primary_contact BOOLEAN DEFAULT FALSE,
  can_pickup         BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, parent_id)
);

CREATE TABLE IF NOT EXISTS public.student_status_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  reason     TEXT,
  changed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================================================================
-- SECTION 08 : FINANCE — FRAIS & PAIEMENTS
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.fee_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  code         VARCHAR(30),
  description  TEXT,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fee_schedules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  fee_type_id      UUID NOT NULL REFERENCES public.fee_types(id) ON DELETE CASCADE,
  level_id         UUID REFERENCES public.academic_levels(id) ON DELETE SET NULL,
  class_id         UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  amount           NUMERIC(12,2) NOT NULL,
  currency         VARCHAR(3) DEFAULT 'XOF',
  due_date         DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id     UUID REFERENCES public.students(id) ON DELETE SET NULL,
  fee_type_id    UUID REFERENCES public.fee_types(id) ON DELETE SET NULL,
  amount         NUMERIC(12,2) NOT NULL,
  currency       VARCHAR(3) DEFAULT 'XOF',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash'
                 CHECK (payment_method IN ('cash','orange_money','mtn_momo','moov_money','wave','card','bank_transfer','cheque')),
  reference      VARCHAR(100),
  status         VARCHAR(20) DEFAULT 'completed'
                 CHECK (status IN ('pending','completed','failed','refunded')),
  payment_date   TIMESTAMPTZ DEFAULT NOW(),
  description    TEXT,
  payer_name     VARCHAR(150),
  payer_phone    VARCHAR(50),
  receipt_number VARCHAR(50),
  created_by     UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_pay_upd ON public.payment_transactions;
CREATE TRIGGER trg_pay_upd BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) NOT NULL,
  issued_at      TIMESTAMPTZ DEFAULT NOW(),
  pdf_url        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================================================================
-- SECTION 09 : RESSOURCES HUMAINES (RH)
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.departments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id           UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code                VARCHAR(30) NOT NULL,
  name                VARCHAR(150) NOT NULL,
  description         TEXT,
  manager_employee_id UUID,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, code)
);
DROP TRIGGER IF EXISTS trg_dept_upd ON public.departments;
CREATE TRIGGER trg_dept_upd BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.positions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title           VARCHAR(150) NOT NULL,
  code            VARCHAR(30),
  category        VARCHAR(50),
  description     TEXT,
  base_salary_min NUMERIC(12,2),
  base_salary_max NUMERIC(12,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_pos_upd ON public.positions;
CREATE TRIGGER trg_pos_upd BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.employees (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id                  UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id                    UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  employee_number            VARCHAR(50) NOT NULL,
  first_name                 VARCHAR(100) NOT NULL,
  last_name                  VARCHAR(100) NOT NULL,
  gender                     CHAR(1) CHECK (gender IN ('M','F')),
  date_of_birth              DATE,
  place_of_birth             VARCHAR(150),
  nationality                VARCHAR(100) DEFAULT 'Ivoirienne',
  photo_url                  TEXT,
  phone                      VARCHAR(50),
  email                      VARCHAR(150),
  address                    TEXT,
  emergency_contact_name     VARCHAR(150),
  emergency_contact_phone    VARCHAR(50),
  emergency_contact_relation VARCHAR(50),
  employee_type              VARCHAR(30) DEFAULT 'permanent'
                             CHECK (employee_type IN ('permanent','enseignant','admin','technique','prestataire','temporaire')),
  department_id              UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  position_id                UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  hire_date                  DATE NOT NULL,
  employment_status          VARCHAR(30) DEFAULT 'actif'
                             CHECK (employment_status IN ('actif','en_conge','suspendu','demissionnaire','licencie','retraite','sorti')),
  contract_type              VARCHAR(30) DEFAULT 'CDI'
                             CHECK (contract_type IN ('CDI','CDD','temporaire','vacataire','prestataire','stage','autre')),
  contract_start_date        DATE,
  contract_end_date          DATE,
  base_salary                NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method             VARCHAR(30) DEFAULT 'virement'
                             CHECK (payment_method IN ('virement','mobile_money','cheque','especes')),
  bank_name                  VARCHAR(100),
  iban                       VARCHAR(50),
  mobile_money_provider      VARCHAR(50),
  mobile_money_number        VARCHAR(50),
  cnps_number                VARCHAR(50),
  tax_id                     VARCHAR(50),
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, employee_number)
);
DROP TRIGGER IF EXISTS trg_emp_upd ON public.employees;
CREATE TRIGGER trg_emp_upd BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.employee_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  document_type VARCHAR(50),
  file_url      TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employee_contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id           UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id         UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  contract_number     VARCHAR(50) NOT NULL,
  contract_type       VARCHAR(30) NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE,
  trial_period_months INTEGER,
  contractual_salary  NUMERIC(12,2) NOT NULL,
  weekly_hours        NUMERIC(4,1),
  status              VARCHAR(20) DEFAULT 'actif'
                      CHECK (status IN ('brouillon','actif','renouvele','expire','resilie')),
  document_url        TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_ec_upd ON public.employee_contracts;
CREATE TRIGGER trg_ec_upd BEFORE UPDATE ON public.employee_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.leave_types (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id             UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name                  VARCHAR(100) NOT NULL,
  code                  VARCHAR(20) NOT NULL,
  default_days_per_year INTEGER DEFAULT 30,
  is_paid               BOOLEAN DEFAULT TRUE,
  requires_attachment   BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id      UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id    UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  duration_days    INTEGER NOT NULL DEFAULT 1,
  reason           TEXT,
  attachment_url   TEXT,
  status           VARCHAR(20) DEFAULT 'en_attente'
                   CHECK (status IN ('en_attente','valide_n1','approuve','refuse','annule')),
  rejection_reason TEXT,
  approved_by      UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_lr_upd ON public.leave_requests;
CREATE TRIGGER trg_lr_upd BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.employee_attendance (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id            UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id          UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date                 DATE NOT NULL,
  check_in             TIME,
  check_out            TIME,
  status               VARCHAR(20) DEFAULT 'present'
                       CHECK (status IN ('present','absent','retard','conge','mission','autorisation')),
  late_minutes         INTEGER DEFAULT 0,
  is_justified         BOOLEAN DEFAULT FALSE,
  justification_reason TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

-- ============================================================================================================================
-- SECTION 10 : PAIE (PAYROLL)
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  period_code      VARCHAR(10) NOT NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  payment_due_date DATE,
  status           VARCHAR(20) DEFAULT 'brouillon'
                   CHECK (status IN ('brouillon','preparation','calculee','validee','payee','cloturee')),
  total_gross      NUMERIC(14,2) DEFAULT 0,
  total_deductions NUMERIC(14,2) DEFAULT 0,
  total_net        NUMERIC(14,2) DEFAULT 0,
  employee_count   INTEGER DEFAULT 0,
  closed_at        TIMESTAMPTZ,
  closed_by        UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, period_code)
);
DROP TRIGGER IF EXISTS trg_pp_upd ON public.payroll_periods;
CREATE TRIGGER trg_pp_upd BEFORE UPDATE ON public.payroll_periods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.payroll_components (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id               UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code                    VARCHAR(30) NOT NULL,
  name                    VARCHAR(150) NOT NULL,
  category                VARCHAR(20) DEFAULT 'gain'
                          CHECK (category IN ('gain','retenue')),
  calculation_method      VARCHAR(20) DEFAULT 'montant_fixe'
                          CHECK (calculation_method IN ('montant_fixe','pourcentage','taux_horaire','formule')),
  default_amount          NUMERIC(12,2) DEFAULT 0,
  default_rate            NUMERIC(6,4),
  is_taxable              BOOLEAN DEFAULT TRUE,
  is_social_contributable BOOLEAN DEFAULT TRUE,
  is_system               BOOLEAN DEFAULT FALSE,
  display_order           INTEGER DEFAULT 1,
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.employee_payroll_profiles (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id                 UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id               UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  base_salary               NUMERIC(12,2) NOT NULL DEFAULT 0,
  housing_allowance         NUMERIC(12,2) DEFAULT 0,
  transport_allowance       NUMERIC(12,2) DEFAULT 0,
  function_allowance        NUMERIC(12,2) DEFAULT 0,
  other_allowances          NUMERIC(12,2) DEFAULT 0,
  social_security_deduction NUMERIC(12,2) DEFAULT 0,
  tax_deduction             NUMERIC(12,2) DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, employee_id)
);
DROP TRIGGER IF EXISTS trg_epp_upd ON public.employee_payroll_profiles;
CREATE TRIGGER trg_epp_upd BEFORE UPDATE ON public.employee_payroll_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.payslips (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id       UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  payslip_number    VARCHAR(50) NOT NULL,
  employee_name     VARCHAR(200),
  employee_number   VARCHAR(50),
  position_title    VARCHAR(150),
  department_name   VARCHAR(150),
  contract_type     VARCHAR(30),
  hire_date         DATE,
  cnps_number       VARCHAR(50),
  base_salary       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earnings    NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross_salary      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deductions  NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_salary        NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method    VARCHAR(30),
  payment_status    VARCHAR(20) DEFAULT 'non_paye'
                    CHECK (payment_status IN ('non_paye','partiel','paye')),
  paid_amount       NUMERIC(12,2) DEFAULT 0,
  paid_at           TIMESTAMPTZ,
  status            VARCHAR(20) DEFAULT 'brouillon'
                    CHECK (status IN ('brouillon','valide','paye','annule')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, payslip_number)
);
DROP TRIGGER IF EXISTS trg_psl_upd ON public.payslips;
CREATE TRIGGER trg_psl_upd BEFORE UPDATE ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.payslip_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  payslip_id     UUID NOT NULL REFERENCES public.payslips(id) ON DELETE CASCADE,
  component_code VARCHAR(30) NOT NULL,
  label          VARCHAR(150) NOT NULL,
  category       VARCHAR(20) NOT NULL CHECK (category IN ('gain','retenue')),
  base_amount    NUMERIC(12,2),
  rate           NUMERIC(6,4),
  quantity       NUMERIC(6,2),
  total_amount   NUMERIC(12,2) NOT NULL,
  display_order  INTEGER DEFAULT 1,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.salary_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id             UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  payslip_id            UUID NOT NULL REFERENCES public.payslips(id) ON DELETE CASCADE,
  employee_id           UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payroll_period_id     UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  payment_reference     VARCHAR(100) NOT NULL,
  amount                NUMERIC(12,2) NOT NULL,
  payment_method        VARCHAR(30),
  bank_name             VARCHAR(100),
  transaction_number    VARCHAR(100),
  mobile_money_provider VARCHAR(50),
  mobile_money_phone    VARCHAR(50),
  payment_date          DATE NOT NULL,
  status                VARCHAR(20) DEFAULT 'succes'
                        CHECK (status IN ('succes','en_attente','echoue','annule')),
  notes                 TEXT,
  created_by            UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.salary_advances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id           UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id         UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount              NUMERIC(12,2) NOT NULL,
  request_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  reason              TEXT,
  repayment_period_id UUID REFERENCES public.payroll_periods(id) ON DELETE SET NULL,
  status              VARCHAR(20) DEFAULT 'en_attente'
                      CHECK (status IN ('en_attente','approuve','deduit','rejete')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================================================================
-- SECTION 11 : PRESENCES ELEVES & EMPLOI DU TEMPS
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  date             DATE NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'present'
                   CHECK (status IN ('present','absent','late','excused')),
  reason           TEXT,
  created_by       UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, class_id, date)
);

CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id       UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id       UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  day_of_week      SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  room_number      VARCHAR(30),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================================================================
-- SECTION 12 : NOTES & EVALUATIONS
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.assessments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_subject_id UUID REFERENCES public.class_subjects(id) ON DELETE SET NULL,
  academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  name             VARCHAR(200) NOT NULL,
  type             VARCHAR(30) DEFAULT 'test'
                   CHECK (type IN ('test','exam','quiz','homework','project','oral','pratique')),
  coefficient      NUMERIC(4,2) DEFAULT 1.0,
  max_score        NUMERIC(6,2) DEFAULT 20.0,
  date             DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score         NUMERIC(5,2),
  comment       TEXT,
  is_absent     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assessment_id, student_id)
);
DROP TRIGGER IF EXISTS trg_grd_upd ON public.grades;
CREATE TRIGGER trg_grd_upd BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================================================================
-- SECTION 13 : EXAMENS OFFICIELS (BEPC, BAC, BLANCS...)
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.exams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  level_id         UUID REFERENCES public.academic_levels(id) ON DELETE SET NULL,
  name             VARCHAR(200) NOT NULL,
  exam_type        VARCHAR(50) DEFAULT 'composition'
                   CHECK (exam_type IN ('officiel','blanc','composition','autre',
                     'BEPC','BEPC_BLANC','BAC','BAC_BLANC','DEVOIR_NATIONALE','CAP','BT','BTS')),
  series_id        VARCHAR(10),
  start_date       DATE,
  end_date         DATE,
  status           VARCHAR(30) DEFAULT 'brouillon'
                   CHECK (status IN ('brouillon','planifie','en_cours','termine',
                     'publie','annule','published','completed','in_progress')),
  description      TEXT,
  subjects_count   INTEGER DEFAULT 0,
  candidates_count INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_exm_upd ON public.exams;
CREATE TRIGGER trg_exm_upd BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id      UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id   VARCHAR(100) NOT NULL,
  subject_name VARCHAR(150),
  coefficient  NUMERIC(4,2) DEFAULT 1.0,
  max_score    NUMERIC(5,2) DEFAULT 20.0,
  exam_date    DATE,
  is_optional  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_candidates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id           UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id             UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  registration_number VARCHAR(50),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.exam_grades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id         UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_subject_id UUID NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score           NUMERIC(5,2) NOT NULL,
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (exam_subject_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.exam_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id       UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  total_score   NUMERIC(8,2),
  average_score NUMERIC(5,2),
  rank          INTEGER,
  mention       VARCHAR(50),
  decision      VARCHAR(20) DEFAULT 'ajourne'
                CHECK (decision IN ('admis','ajourne','rattrapage')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (exam_id, student_id)
);

-- ============================================================================================================================
-- SECTION 14 : TABLEAU D'HONNEUR & DISTINCTIONS
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.honor_roll_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title       VARCHAR(150) NOT NULL,
  min_average NUMERIC(4,2) NOT NULL,
  max_average NUMERIC(4,2),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.honor_rolls (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  class_id         UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.honor_roll_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  honor_roll_id UUID NOT NULL REFERENCES public.honor_rolls(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  average_score NUMERIC(5,2),
  rank          INTEGER,
  distinction   VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.awards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  award_type  VARCHAR(50) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  date_given  DATE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certificates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id         UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  certificate_number VARCHAR(50),
  title              VARCHAR(200) NOT NULL,
  issue_date         DATE,
  pdf_url            TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================================================================
-- SECTION 15 : BUDGET
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.budget_periods (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name             VARCHAR(150) NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  status           VARCHAR(20) DEFAULT 'brouillon'
                   CHECK (status IN ('brouillon','valide','cloture')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cost_centers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code         VARCHAR(30) NOT NULL,
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  manager_name VARCHAR(150),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.budget_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  type        VARCHAR(10) NOT NULL CHECK (type IN ('depense','recette')),
  code        VARCHAR(30) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  budget_period_id UUID NOT NULL REFERENCES public.budget_periods(id) ON DELETE CASCADE,
  cost_center_id   UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  total_planned    NUMERIC(16,2) DEFAULT 0,
  total_committed  NUMERIC(16,2) DEFAULT 0,
  total_consumed   NUMERIC(16,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_bud_upd ON public.budgets;
CREATE TRIGGER trg_bud_upd BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.budget_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  budget_id        UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES public.budget_categories(id) ON DELETE SET NULL,
  code             VARCHAR(30) NOT NULL,
  label            VARCHAR(200) NOT NULL,
  planned_amount   NUMERIC(16,2) DEFAULT 0,
  committed_amount NUMERIC(16,2) DEFAULT 0,
  consumed_amount  NUMERIC(16,2) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_bl_upd ON public.budget_lines;
CREATE TRIGGER trg_bl_upd BEFORE UPDATE ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.expenses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  expense_number    VARCHAR(50) NOT NULL,
  budget_line_id    UUID REFERENCES public.budget_lines(id) ON DELETE SET NULL,
  cost_center_id    UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  salary_payment_id UUID REFERENCES public.salary_payments(id) ON DELETE SET NULL,
  supplier_name     VARCHAR(200),
  description       TEXT NOT NULL,
  amount            NUMERIC(14,2) NOT NULL,
  expense_date      DATE NOT NULL,
  payment_method    VARCHAR(30) DEFAULT 'virement',
  receipt_ref       VARCHAR(100),
  attachment_url    TEXT,
  status            VARCHAR(20) DEFAULT 'brouillon'
                    CHECK (status IN ('brouillon','soumis','approuve','paye','rejete','annule')),
  created_by        UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, expense_number)
);
DROP TRIGGER IF EXISTS trg_exp_upd ON public.expenses;
CREATE TRIGGER trg_exp_upd BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.revenues (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  revenue_number   VARCHAR(50) NOT NULL,
  category_id      UUID REFERENCES public.budget_categories(id) ON DELETE SET NULL,
  cost_center_id   UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  source_name      VARCHAR(200) NOT NULL,
  description      TEXT,
  amount           NUMERIC(14,2) NOT NULL,
  revenue_date     DATE NOT NULL,
  payment_method   VARCHAR(30) DEFAULT 'virement',
  reference_number VARCHAR(100),
  status           VARCHAR(20) DEFAULT 'encaisse'
                   CHECK (status IN ('en_attente','encaisse','annule')),
  created_by       UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, revenue_number)
);

-- ============================================================================================================================
-- SECTION 16 : COMMUNICATION
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id  UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  type       VARCHAR(30) DEFAULT 'info'
             CHECK (type IN ('info','warning','alert','success','payment','exam','attendance')),
  is_read    BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subject      VARCHAR(200),
  body         TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  parent_id    UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================================================================
-- SECTION 17 : AUDIT LOGS (journal complet)
-- ============================================================================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  school_id       UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  entity_type     VARCHAR(100),
  entity_id       UUID,
  table_name      VARCHAR(100),
  record_id       UUID,
  action          VARCHAR(50) NOT NULL DEFAULT 'UPDATE'
                  CHECK (action IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','VIEW','EXPORT')),
  old_data        JSONB,
  new_data        JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================================================================
-- SECTION 18 : INDEX DE PERFORMANCE
-- ============================================================================================================================

CREATE INDEX IF NOT EXISTS idx_school_members_user     ON public.school_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_school_members_school   ON public.school_members(school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_students_school         ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_reg            ON public.students(school_id, registration_number);
CREATE INDEX IF NOT EXISTS idx_enrollments_student     ON public.student_enrollments(student_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class       ON public.student_enrollments(class_id, is_current);
CREATE INDEX IF NOT EXISTS idx_classes_school          ON public.classes(school_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_attendance_stu          ON public.attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_cls          ON public.attendance_records(class_id, date);
CREATE INDEX IF NOT EXISTS idx_grades_assessment       ON public.grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student          ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student        ON public.payment_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date           ON public.payment_transactions(school_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_employees_school        ON public.employees(school_id, employment_status);
CREATE INDEX IF NOT EXISTS idx_payslips_period         ON public.payslips(payroll_period_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_date           ON public.expenses(school_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_revenues_date           ON public.revenues(school_id, revenue_date);
CREATE INDEX IF NOT EXISTS idx_audit_school            ON public.audit_logs(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity            ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user              ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user              ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_school    ON public.subscriptions(school_id, status);
CREATE INDEX IF NOT EXISTS idx_academic_years_school   ON public.academic_years(school_id, is_current);
CREATE INDEX IF NOT EXISTS idx_exams_school            ON public.exams(school_id, status);

-- ============================================================================================================================
-- SECTION 19 : ROW LEVEL SECURITY (RLS)
-- ============================================================================================================================

ALTER TABLE public.organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_levels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_terms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_types             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_schedules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_contracts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_components    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payroll_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslip_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_advances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_candidates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_grades           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honor_roll_configs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honor_rolls           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honor_roll_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_periods        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;

-- Fonctions helper RLS
CREATE OR REPLACE FUNCTION public.is_school_member(p_school_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_members
    WHERE school_id = p_school_id AND user_id = auth.uid() AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.user_profiles WHERE id = auth.uid()), FALSE
  );
$$;

-- RLS : user_profiles
DROP POLICY IF EXISTS up_own_select   ON public.user_profiles;
DROP POLICY IF EXISTS up_own_update   ON public.user_profiles;
DROP POLICY IF EXISTS up_school_read  ON public.user_profiles;
DROP POLICY IF EXISTS up_sa_all       ON public.user_profiles;
CREATE POLICY up_own_select  ON public.user_profiles FOR SELECT USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY up_own_update  ON public.user_profiles FOR UPDATE USING (id = auth.uid() OR public.is_super_admin());
CREATE POLICY up_school_read ON public.user_profiles FOR SELECT
  USING (id IN (SELECT sm.user_id FROM public.school_members sm WHERE public.is_school_member(sm.school_id)));
CREATE POLICY up_sa_all      ON public.user_profiles FOR ALL USING (public.is_super_admin());

-- RLS : organizations
DROP POLICY IF EXISTS org_read ON public.organizations;
DROP POLICY IF EXISTS org_sa   ON public.organizations;
CREATE POLICY org_read ON public.organizations FOR SELECT
  USING (id IN (SELECT s.organization_id FROM public.schools s WHERE public.is_school_member(s.id))
         OR public.is_super_admin());
CREATE POLICY org_sa   ON public.organizations FOR ALL USING (public.is_super_admin());

-- RLS : schools
DROP POLICY IF EXISTS sch_read ON public.schools;
DROP POLICY IF EXISTS sch_sa   ON public.schools;
CREATE POLICY sch_read ON public.schools FOR SELECT USING (public.is_school_member(id) OR public.is_super_admin());
CREATE POLICY sch_sa   ON public.schools FOR ALL USING (public.is_super_admin());

-- RLS : school_members
DROP POLICY IF EXISTS sm_read ON public.school_members;
DROP POLICY IF EXISTS sm_sa   ON public.school_members;
CREATE POLICY sm_read ON public.school_members FOR SELECT
  USING (public.is_school_member(school_id) OR user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY sm_sa   ON public.school_members FOR ALL USING (public.is_super_admin());

-- RLS : plans (lecture publique)
DROP POLICY IF EXISTS plans_pub ON public.plans;
CREATE POLICY plans_pub ON public.plans FOR SELECT USING (TRUE);

-- RLS : subscriptions
DROP POLICY IF EXISTS subs_read ON public.subscriptions;
DROP POLICY IF EXISTS subs_sa   ON public.subscriptions;
CREATE POLICY subs_read ON public.subscriptions FOR SELECT USING (public.is_school_member(school_id) OR public.is_super_admin());
CREATE POLICY subs_sa   ON public.subscriptions FOR ALL USING (public.is_super_admin());

-- RLS generique : toutes les tables avec school_id
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'academic_levels','academic_years','academic_terms','classes','subjects','class_subjects',
    'students','student_enrollments','parents','student_guardians','student_status_history',
    'fee_types','fee_schedules','payment_transactions','payment_receipts',
    'departments','positions','employees','employee_documents','employee_contracts',
    'leave_types','leave_requests','employee_attendance',
    'payroll_periods','payroll_components','employee_payroll_profiles','payslips','payslip_items',
    'salary_payments','salary_advances','attendance_records','timetable_slots',
    'assessments','grades','exams','exam_subjects','exam_candidates','exam_grades','exam_results',
    'honor_roll_configs','honor_rolls','honor_roll_entries','awards','certificates',
    'budget_periods','cost_centers','budget_categories','budgets','budget_lines','expenses','revenues',
    'subscription_payments'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_sel ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_ins ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_upd ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_del ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_sel ON public.%I FOR SELECT USING (public.is_school_member(school_id) OR public.is_super_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_ins ON public.%I FOR INSERT WITH CHECK (public.is_school_member(school_id) OR public.is_super_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_upd ON public.%I FOR UPDATE USING (public.is_school_member(school_id) OR public.is_super_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_del ON public.%I FOR DELETE USING (public.is_super_admin())', tbl, tbl);
  END LOOP;
END $$;

-- RLS : notifications
DROP POLICY IF EXISTS notif_sel ON public.notifications;
DROP POLICY IF EXISTS notif_upd ON public.notifications;
DROP POLICY IF EXISTS notif_ins ON public.notifications;
CREATE POLICY notif_sel ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY notif_upd ON public.notifications FOR UPDATE USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY notif_ins ON public.notifications FOR INSERT WITH CHECK (public.is_school_member(school_id) OR public.is_super_admin());

-- RLS : messages
DROP POLICY IF EXISTS msg_sel ON public.messages;
DROP POLICY IF EXISTS msg_ins ON public.messages;
CREATE POLICY msg_sel ON public.messages FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_super_admin());
CREATE POLICY msg_ins ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- RLS : audit_logs
DROP POLICY IF EXISTS audit_sel ON public.audit_logs;
DROP POLICY IF EXISTS audit_ins ON public.audit_logs;
CREATE POLICY audit_sel ON public.audit_logs FOR SELECT USING (public.is_school_member(school_id) OR public.is_super_admin());
CREATE POLICY audit_ins ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================================================================
-- SECTION 20 : FONCTION RPC — VERIFICATION D'ACCES DASHBOARD
-- ============================================================================================================================

CREATE OR REPLACE FUNCTION public.can_access_school_dashboard(p_school_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_uid    UUID;
  v_prof   RECORD;
  v_school RECORD;
  v_member RECORD;
  v_sub    RECORD;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('allowed',FALSE,'reason','AUTH_REQUIRED');
  END IF;
  SELECT * INTO v_prof FROM public.user_profiles WHERE id = v_uid;
  IF NOT FOUND OR NOT v_prof.is_active THEN
    RETURN jsonb_build_object('allowed',FALSE,'reason','PROFILE_INACTIVE');
  END IF;
  IF v_prof.is_super_admin THEN
    RETURN jsonb_build_object('allowed',TRUE,'reason','ACCESS_GRANTED','role','super_admin');
  END IF;
  SELECT * INTO v_school FROM public.schools WHERE id = p_school_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed',FALSE,'reason','NO_SCHOOL_MEMBERSHIP');
  END IF;
  IF v_school.status IN ('suspended','blocked','cancelled') THEN
    RETURN jsonb_build_object('allowed',FALSE,'reason','SCHOOL_'||upper(v_school.status));
  END IF;
  SELECT * INTO v_member FROM public.school_members
    WHERE school_id = p_school_id AND user_id = v_uid AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed',FALSE,'reason','NO_SCHOOL_MEMBERSHIP');
  END IF;
  SELECT s.*, pl.name AS plan_name, pl.max_students INTO v_sub
    FROM public.subscriptions s
    LEFT JOIN public.plans pl ON pl.id = s.plan_id
    WHERE s.school_id = p_school_id ORDER BY s.created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed',FALSE,'reason','SUBSCRIPTION_REQUIRED');
  END IF;
  IF v_sub.status NOT IN ('active','trialing') THEN
    RETURN jsonb_build_object('allowed',FALSE,'reason','SUBSCRIPTION_NOT_ACTIVE','status',v_sub.status);
  END IF;
  IF v_sub.expires_at IS NOT NULL AND v_sub.expires_at <= NOW() AND v_sub.status != 'trialing' THEN
    RETURN jsonb_build_object('allowed',FALSE,'reason','SUBSCRIPTION_EXPIRED');
  END IF;
  RETURN jsonb_build_object('allowed',TRUE,'reason','ACCESS_GRANTED',
    'school_id',p_school_id,'role',v_member.role,'plan',v_sub.plan_name,'max_students',v_sub.max_students);
END; $$;

-- ============================================================================================================================
-- SECTION 21 : DONNEES DE REFERENCE — PLANS SAAS & SEED DEMO
-- ============================================================================================================================

INSERT INTO public.plans (id, name, slug, description, price, billing_interval, max_students, max_teachers, max_users, features, is_active)
VALUES
  ('00000000-0000-4000-a000-000000000001','Starter','starter','1 etablissement - jusqu a 150 eleves',15000,'monthly',150,10,15,'{"modules":["students","classes","attendance","grades"]}'::jsonb,TRUE),
  ('00000000-0000-4000-a000-000000000002','Standard','standard','1 etablissement - 500 eleves - tous modules',35000,'monthly',500,30,50,'{"modules":["all"]}'::jsonb,TRUE),
  ('00000000-0000-4000-a000-000000000003','Premium','premium','Multi-ecoles - eleves illimites',75000,'monthly',2000,100,200,'{"modules":["all"],"multi_school":true}'::jsonb,TRUE),
  ('00000000-0000-4000-a000-000000000004','Enterprise','enterprise','Reseau illimite + API access',150000,'monthly',NULL,NULL,NULL,'{"modules":["all"],"multi_school":true,"api_access":true}'::jsonb,TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organizations (id, name, code, country, city, plan_type, is_active)
VALUES ('00000000-0000-4000-8000-000000000000','Groupe Scolaire Demo','GSD-DEMO','Cote d Ivoire','Abidjan','Premium',TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.schools (id, organization_id, name, slug, motto, city, school_type, status, is_active)
VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000000',
  'College Catholique Saint-Viateur de la Palmeraie','saint-viateur-palmeraie',
  'Foi, Discipline, Excellence','Abidjan','Prive','active',TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.subscriptions (school_id, plan_id, status, starts_at, expires_at)
VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-a000-000000000003','active',NOW(),NOW()+'1 year'::interval)
ON CONFLICT DO NOTHING;

INSERT INTO public.academic_levels (id, school_id, name, short_name, category, order_index, is_exam_level, exam_type) VALUES
  ('00000000-0000-4000-b000-000000000001','00000000-0000-4000-8000-000000000001','6eme','6e','Secondaire_Premier_Cycle',1,FALSE,NULL),
  ('00000000-0000-4000-b000-000000000002','00000000-0000-4000-8000-000000000001','5eme','5e','Secondaire_Premier_Cycle',2,FALSE,NULL),
  ('00000000-0000-4000-b000-000000000003','00000000-0000-4000-8000-000000000001','4eme','4e','Secondaire_Premier_Cycle',3,FALSE,NULL),
  ('00000000-0000-4000-b000-000000000004','00000000-0000-4000-8000-000000000001','3eme','3e','Secondaire_Premier_Cycle',4,TRUE,'BEPC'),
  ('00000000-0000-4000-b000-000000000005','00000000-0000-4000-8000-000000000001','2nde','2nde','Secondaire_Second_Cycle',5,FALSE,NULL),
  ('00000000-0000-4000-b000-000000000006','00000000-0000-4000-8000-000000000001','1ere','1re','Secondaire_Second_Cycle',6,FALSE,NULL),
  ('00000000-0000-4000-b000-000000000007','00000000-0000-4000-8000-000000000001','Terminale','Tle','Secondaire_Second_Cycle',7,TRUE,'BAC')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.academic_years (id, school_id, organization_id, name, start_date, end_date, is_current) VALUES
  ('00000000-0000-4000-c000-000000000001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000000','2025-2026','2025-09-15','2026-07-15',TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.academic_terms (id, school_id, academic_year_id, name, period_type, start_date, end_date, is_current) VALUES
  ('00000000-0000-4000-d000-000000000001','00000000-0000-4000-8000-000000000001','00000000-0000-4000-c000-000000000001','1er Trimestre','Trimestre','2025-09-15','2025-12-20',FALSE),
  ('00000000-0000-4000-d000-000000000002','00000000-0000-4000-8000-000000000001','00000000-0000-4000-c000-000000000001','2eme Trimestre','Trimestre','2026-01-05','2026-03-28',FALSE),
  ('00000000-0000-4000-d000-000000000003','00000000-0000-4000-8000-000000000001','00000000-0000-4000-c000-000000000001','3eme Trimestre','Trimestre','2026-04-06','2026-07-10',TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fee_types (id, school_id, name, code, is_mandatory) VALUES
  ('00000000-0000-4000-e000-000000000001','00000000-0000-4000-8000-000000000001','Frais d inscription','INSCRIPTION',TRUE),
  ('00000000-0000-4000-e000-000000000002','00000000-0000-4000-8000-000000000001','Frais de scolarite','SCOLARITE',TRUE),
  ('00000000-0000-4000-e000-000000000003','00000000-0000-4000-8000-000000000001','Frais de transport','TRANSPORT',FALSE),
  ('00000000-0000-4000-e000-000000000004','00000000-0000-4000-8000-000000000001','Frais de cantine','CANTINE',FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================================================================
-- FIN DU SCRIPT SCHEMA_FINAL_V1.SQL
-- Tables creees : 54  |  Triggers : 25  |  Fonctions RPC : 3  |  Politiques RLS : ~120
-- ============================================================================================================================