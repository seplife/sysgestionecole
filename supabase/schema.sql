-- ============================================================
-- SYSTÈME DE GESTION D'ÉCOLE "IVOIREÉCOLE+"
-- Base de données Supabase complète
-- Version: 1.0.0
-- ============================================================

-- ============================================================
-- 01_extensions.sql - Extensions nécessaires
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 02_schools.sql - Table des écoles
-- ============================================================

CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    registration_number VARCHAR(100),
    motto TEXT DEFAULT 'Foi, Discipline, Excellence',
    
    address TEXT,
    city VARCHAR(100) DEFAULT 'Abidjan',
    country VARCHAR(100) DEFAULT 'Côte d''Ivoire',
    
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(150),
    website VARCHAR(255),
    
    director_name VARCHAR(150),
    logo_url TEXT,
    
    school_type VARCHAR(50) DEFAULT 'Prive'
        CHECK (school_type IN ('Public', 'Prive', 'Confessionnel')),
    
    status VARCHAR(30) DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'active',
                'suspended',
                'blocked',
                'cancelled'
            )
        ),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 03_plans.sql - Plans d'abonnement
-- ============================================================

CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'XOF',
    billing_interval VARCHAR(20) DEFAULT 'monthly'
        CHECK (billing_interval IN ('monthly', 'yearly')),
    max_students INTEGER, -- NULL = illimité
    max_teachers INTEGER, -- NULL = illimité
    max_users INTEGER, -- NULL = illimité
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 04_subscriptions.sql - Abonnements
-- ============================================================

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    plan_id UUID NOT NULL
        REFERENCES public.plans(id)
        ON DELETE RESTRICT,
    status VARCHAR(30) DEFAULT 'pending_payment'
        CHECK (
            status IN (
                'pending_payment',
                'trialing',
                'active',
                'past_due',
                'expired',
                'cancelled',
                'suspended'
            )
        ),
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour éviter plusieurs abonnements actifs
CREATE UNIQUE INDEX unique_active_subscription
ON public.subscriptions(school_id)
WHERE status IN ('trialing', 'active');

-- ============================================================
-- 05_users_profiles.sql - Profils utilisateurs
-- ============================================================

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 06_school_members.sql - Membres des écoles
-- ============================================================

CREATE TABLE public.school_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL
        CHECK (
            role IN (
                'super_admin',
                'school_admin',
                'directeur',
                'directeur_etudes',
                'censeur',
                'educateur',
                'enseignant',
                'prof_principal',
                'surveillant',
                'secretaire',
                'comptable',
                'parent',
                'eleve',
                'bibliothecaire',
                'chauffeur'
            )
        ),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, user_id, role)
);

-- ============================================================
-- 07_permissions.sql - Gestion des permissions
-- ============================================================

CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL
        REFERENCES public.permissions(id)
        ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- ============================================================
-- 08_academic_structure.sql - Structure académique
-- ============================================================

-- Années scolaires
CREATE TABLE public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- Trimestres
CREATE TABLE public.academic_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    academic_year_id UUID NOT NULL
        REFERENCES public.academic_years(id)
        ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    academic_year_id UUID
        REFERENCES public.academic_years(id)
        ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50),
    capacity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matières
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    coefficient INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

-- Classes - Matières
CREATE TABLE public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL
        REFERENCES public.classes(id)
        ON DELETE CASCADE,
    subject_id UUID NOT NULL
        REFERENCES public.subjects(id)
        ON DELETE CASCADE,
    teacher_id UUID,
    coefficient INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, subject_id)
);

-- ============================================================
-- 09_students_parents.sql - Élèves et parents
-- ============================================================

-- Élèves
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    user_id UUID
        REFERENCES auth.users(id)
        ON DELETE SET NULL,
    registration_number VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    place_of_birth VARCHAR(100),
    gender VARCHAR(10)
        CHECK (gender IN ('M', 'F')),
    nationality VARCHAR(50) DEFAULT 'Ivoirienne',
    photo_url TEXT,
    status VARCHAR(30) DEFAULT 'Inscrit'
        CHECK (
            status IN (
                'Inscrit',
                'Reinscrit',
                'Transfere',
                'Radie'
            )
        ),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, registration_number)
);

-- Parents
CREATE TABLE public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    user_id UUID
        REFERENCES auth.users(id)
        ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relations élèves-parents
CREATE TABLE public.student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    student_id UUID NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,
    parent_id UUID NOT NULL
        REFERENCES public.parents(id)
        ON DELETE CASCADE,
    relationship VARCHAR(50),
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, parent_id)
);

-- Inscriptions
CREATE TABLE public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    student_id UUID NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,
    class_id UUID NOT NULL
        REFERENCES public.classes(id)
        ON DELETE CASCADE,
    academic_year_id UUID NOT NULL
        REFERENCES public.academic_years(id)
        ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'active'
        CHECK (status IN ('active', 'transferred', 'graduated', 'dropped')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, class_id, academic_year_id)
);

-- ============================================================
-- 10_teachers.sql - Enseignants
-- ============================================================

CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    user_id UUID
        REFERENCES auth.users(id)
        ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    specialization VARCHAR(100),
    hire_date DATE,
    status VARCHAR(30) DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11_attendance.sql - Présences
-- ============================================================

CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    student_id UUID NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,
    class_id UUID NOT NULL
        REFERENCES public.classes(id)
        ON DELETE CASCADE,
    academic_term_id UUID NOT NULL
        REFERENCES public.academic_terms(id)
        ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('present', 'absent', 'late', 'excused')),
    reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, class_id, date)
);

-- ============================================================
-- 12_assessments_grades.sql - Évaluations et notes
-- ============================================================

-- Évaluations
CREATE TABLE public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    class_subject_id UUID NOT NULL
        REFERENCES public.class_subjects(id)
        ON DELETE CASCADE,
    academic_term_id UUID NOT NULL
        REFERENCES public.academic_terms(id)
        ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL
        CHECK (type IN ('test', 'exam', 'quiz', 'homework', 'project')),
    coefficient INTEGER DEFAULT 1,
    max_score NUMERIC(10,2) DEFAULT 20,
    date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    assessment_id UUID NOT NULL
        REFERENCES public.assessments(id)
        ON DELETE CASCADE,
    student_id UUID NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,
    score NUMERIC(10,2),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, student_id)
);

-- ============================================================
-- 13_report_cards.sql - Bulletins
-- ============================================================

CREATE TABLE public.report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    student_id UUID NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,
    class_id UUID NOT NULL
        REFERENCES public.classes(id)
        ON DELETE CASCADE,
    academic_term_id UUID NOT NULL
        REFERENCES public.academic_terms(id)
        ON DELETE CASCADE,
    total_score NUMERIC(10,2),
    average NUMERIC(10,2),
    rank INTEGER,
    appreciation TEXT,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_term_id)
);

-- ============================================================
-- 14_finance.sql - Finance
-- ============================================================

-- Types de frais
CREATE TABLE public.fee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    frequency VARCHAR(30) DEFAULT 'one_time'
        CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'yearly')),
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    student_id UUID NOT NULL
        REFERENCES public.students(id)
        ON DELETE CASCADE,
    fee_type_id UUID
        REFERENCES public.fee_types(id)
        ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    payment_method VARCHAR(30) NOT NULL
        CHECK (payment_method IN ('cash', 'mobile_money', 'bank_transfer', 'check')),
    reference VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15_communication.sql - Communication
-- ============================================================

-- Messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL
        REFERENCES public.schools(id)
        ON DELETE CASCADE,
    sender_id UUID NOT NULL
        REFERENCES auth.users(id),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'internal'
        CHECK (type IN ('internal', 'sms', 'email', 'push')),
    priority VARCHAR(20) DEFAULT 'normal'
        CHECK (priority IN ('normal', 'important', 'urgent')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Destinataires des messages
CREATE TABLE public.message_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL
        REFERENCES public.messages(id)
        ON DELETE CASCADE,
    user_id UUID NOT NULL
        REFERENCES auth.users(id),
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    UNIQUE(message_id, user_id)
);

-- ============================================================
-- 16_notifications.sql - Notifications
-- ============================================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17_audit.sql - Journal d'audit
-- ============================================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID
        REFERENCES public.schools(id)
        ON DELETE SET NULL,
    user_id UUID
        REFERENCES auth.users(id)
        ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18_rls_helpers.sql - Fonctions d'aide pour RLS
-- ============================================================

-- Récupérer l'ID de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT auth.uid();
$$;

-- Vérifier si l'utilisateur est super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.school_members
        WHERE user_id = COALESCE($1, auth.uid())
        AND role = 'super_admin'
        AND is_active = true
    );
$$;

-- Récupérer les écoles d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_schools(user_id UUID DEFAULT NULL)
RETURNS TABLE(school_id UUID, role VARCHAR)
LANGUAGE sql
STABLE
AS $$
    SELECT school_id, role
    FROM public.school_members
    WHERE user_id = COALESCE($1, auth.uid())
    AND is_active = true;
$$;

-- Vérifier si un utilisateur a une permission
CREATE OR REPLACE FUNCTION public.has_permission(
    permission_code VARCHAR,
    user_id UUID DEFAULT NULL,
    school_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_user_id UUID;
    v_school_id UUID;
    v_has_perm BOOLEAN;
BEGIN
    v_user_id := COALESCE($2, auth.uid());
    
    -- Super admin a tous les droits
    IF public.is_super_admin(v_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Si school_id n'est pas fourni, vérifier dans n'importe quelle école
    IF $3 IS NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.school_members sm
            JOIN public.role_permissions rp ON rp.role = sm.role
            JOIN public.permissions p ON p.id = rp.permission_id
            WHERE sm.user_id = v_user_id
            AND sm.is_active = true
            AND p.code = $1
        ) INTO v_has_perm;
    ELSE
        SELECT EXISTS (
            SELECT 1
            FROM public.school_members sm
            JOIN public.role_permissions rp ON rp.role = sm.role
            JOIN public.permissions p ON p.id = rp.permission_id
            WHERE sm.user_id = v_user_id
            AND sm.school_id = $3
            AND sm.is_active = true
            AND p.code = $1
        ) INTO v_has_perm;
    END IF;
    
    RETURN COALESCE(v_has_perm, FALSE);
END;
$$;

-- ============================================================
-- 19_rls_policies.sql - Politiques RLS
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICY: Lecture des écoles (visible par tous les membres)
CREATE POLICY "users_view_their_schools"
ON public.schools
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.school_members
        WHERE school_id = schools.id
        AND user_id = auth.uid()
        AND is_active = true
    )
    OR public.is_super_admin()
);

-- POLICY: Modifications des écoles (seulement super_admin et school_admin)
CREATE POLICY "admins_manage_their_schools"
ON public.schools
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.school_members
        WHERE school_id = schools.id
        AND user_id = auth.uid()
        AND role IN ('super_admin', 'school_admin')
        AND is_active = true
    )
    OR public.is_super_admin()
);

-- POLICY: Membres des écoles
CREATE POLICY "members_view_their_school_members"
ON public.school_members
FOR SELECT
USING (
    school_id IN (
        SELECT school_id
        FROM public.school_members
        WHERE user_id = auth.uid()
        AND is_active = true
    )
    OR public.is_super_admin()
);

-- POLICY: Élèves - lecture par les membres de l'école
CREATE POLICY "school_members_view_students"
ON public.students
FOR SELECT
USING (
    school_id IN (
        SELECT school_id
        FROM public.school_members
        WHERE user_id = auth.uid()
        AND is_active = true
    )
    OR public.is_super_admin()
);

-- POLICY: Élèves - création/modification par les admins et enseignants
CREATE POLICY "educators_manage_students"
ON public.students
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.school_members
        WHERE school_id = students.school_id
        AND user_id = auth.uid()
        AND role IN ('super_admin', 'school_admin', 'directeur', 'secretaire')
        AND is_active = true
    )
    OR public.is_super_admin()
);

-- POLICY: Notes - lecture par les membres autorisés
CREATE POLICY "authorized_view_grades"
ON public.grades
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.school_members sm
        WHERE sm.school_id = grades.school_id
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
        AND sm.role IN (
            'super_admin', 'school_admin', 'directeur', 'directeur_etudes',
            'prof_principal', 'enseignant', 'surveillant', 'censeur'
        )
    )
    OR EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = grades.student_id
        AND s.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.parents p
        JOIN public.student_guardians sg ON sg.parent_id = p.id
        WHERE sg.student_id = grades.student_id
        AND p.user_id = auth.uid()
    )
    OR public.is_super_admin()
);

-- POLICY: Notes - gestion par les enseignants et admins
CREATE POLICY "educators_manage_grades"
ON public.grades
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.school_members sm
        WHERE sm.school_id = grades.school_id
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
        AND sm.role IN (
            'super_admin', 'school_admin', 'directeur', 'directeur_etudes',
            'prof_principal', 'enseignant', 'censeur'
        )
    )
    OR public.is_super_admin()
);

-- POLICY: Transactions financières - lecture par les admins et parents
CREATE POLICY "authorized_view_payments"
ON public.payment_transactions
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.school_members sm
        WHERE sm.school_id = payment_transactions.school_id
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
        AND sm.role IN ('super_admin', 'school_admin', 'directeur', 'comptable')
    )
    OR EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = payment_transactions.student_id
        AND s.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.parents p
        JOIN public.student_guardians sg ON sg.parent_id = p.id
        WHERE sg.student_id = payment_transactions.student_id
        AND p.user_id = auth.uid()
    )
    OR public.is_super_admin()
);

-- POLICY: Transactions financières - gestion par les admins et comptables
CREATE POLICY "finance_manage_payments"
ON public.payment_transactions
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.school_members sm
        WHERE sm.school_id = payment_transactions.school_id
        AND sm.user_id = auth.uid()
        AND sm.is_active = true
        AND sm.role IN ('super_admin', 'school_admin', 'directeur', 'comptable')
    )
    OR public.is_super_admin()
);

-- POLICY: Notifications
CREATE POLICY "users_own_notifications"
ON public.notifications
FOR ALL
USING (
    user_id = auth.uid()
    OR public.is_super_admin()
);

-- ============================================================
-- 20_dashboard_functions.sql - Fonctions pour le dashboard
-- ============================================================

-- Vérification d'accès au dashboard
CREATE OR REPLACE FUNCTION public.can_access_school_dashboard(
    p_school_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_user_id UUID;
    v_profile_exists BOOLEAN;
    v_profile_active BOOLEAN;
    v_school_status VARCHAR;
    v_membership_role VARCHAR;
    v_membership_active BOOLEAN;
    v_subscription_status VARCHAR;
    v_plan_name VARCHAR;
    v_plan_features JSONB;
    v_permissions TEXT[];
    v_result JSONB;
BEGIN
    -- Vérification: Utilisateur connecté
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'AUTH_REQUIRED',
            'message', 'Vous devez être connecté.'
        );
    END IF;

    -- Vérification: Profil existe
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE id = v_user_id
    ) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'PROFILE_NOT_FOUND',
            'message', 'Profil utilisateur non trouvé.'
        );
    END IF;

    -- Vérification: Profil actif
    SELECT is_active INTO v_profile_active
    FROM public.user_profiles
    WHERE id = v_user_id;
    
    IF NOT v_profile_active THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'PROFILE_INACTIVE',
            'message', 'Votre compte est inactif. Contactez l''administrateur.'
        );
    END IF;

    -- Vérification: Super Admin
    IF public.is_super_admin(v_user_id) THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'user_id', v_user_id,
            'role', 'super_admin',
            'permissions', ARRAY['*'],
            'reason', 'ACCESS_GRANTED',
            'message', 'Accès super administrateur.'
        );
    END IF;

    -- Si aucun school_id fourni, retourner les écoles disponibles
    IF p_school_id IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'user_id', v_user_id,
            'schools', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'school_id', school_id,
                        'role', role
                    )
                )
                FROM public.school_members
                WHERE user_id = v_user_id AND is_active = true
            ),
            'requires_school_selection', true,
            'reason', 'ACCESS_GRANTED'
        );
    END IF;

    -- Vérification: Membre de l'école
    SELECT role, is_active INTO v_membership_role, v_membership_active
    FROM public.school_members
    WHERE user_id = v_user_id AND school_id = p_school_id
    LIMIT 1;

    IF v_membership_role IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'NO_SCHOOL_MEMBERSHIP',
            'message', 'Vous n''êtes pas membre de cette école.'
        );
    END IF;

    IF NOT v_membership_active THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'MEMBERSHIP_INACTIVE',
            'message', 'Votre adhésion à cette école est inactive.'
        );
    END IF;

    -- Vérification: Statut de l'école
    SELECT status INTO v_school_status
    FROM public.schools
    WHERE id = p_school_id;

    IF v_school_status = 'pending' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SCHOOL_PENDING',
            'message', 'Cette école est en attente de validation.'
        );
    ELSIF v_school_status = 'suspended' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SCHOOL_SUSPENDED',
            'message', 'Cette école est suspendue. Contactez le support.'
        );
    ELSIF v_school_status = 'blocked' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SCHOOL_BLOCKED',
            'message', 'Cette école est bloquée. Contactez le support.'
        );
    ELSIF v_school_status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SCHOOL_CANCELLED',
            'message', 'Cette école est annulée.'
        );
    END IF;

    -- Vérification: Abonnement
    SELECT s.status, p.name, p.features INTO v_subscription_status, v_plan_name, v_plan_features
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.school_id = p_school_id
    AND s.status IN ('trialing', 'active')
    ORDER BY s.created_at DESC
    LIMIT 1;

    IF v_subscription_status IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SUBSCRIPTION_REQUIRED',
            'message', 'Aucun abonnement actif trouvé.'
        );
    END IF;

    IF v_subscription_status = 'expired' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SUBSCRIPTION_EXPIRED',
            'message', 'Votre abonnement a expiré. Veuillez le renouveler.'
        );
    ELSIF v_subscription_status = 'suspended' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SUBSCRIPTION_SUSPENDED',
            'message', 'Votre abonnement est suspendu. Contactez le support.'
        );
    ELSIF v_subscription_status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'SUBSCRIPTION_CANCELLED',
            'message', 'Votre abonnement a été annulé.'
        );
    END IF;

    -- Récupération des permissions
    SELECT array_agg(p.code)
    INTO v_permissions
    FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE rp.role = v_membership_role;

    -- Construction du résultat final
    RETURN jsonb_build_object(
        'allowed', true,
        'user_id', v_user_id,
        'school_id', p_school_id,
        'role', v_membership_role,
        'school_status', v_school_status,
        'subscription_status', v_subscription_status,
        'plan', v_plan_name,
        'permissions', COALESCE(v_permissions, ARRAY[]::TEXT[]),
        'features', COALESCE(v_plan_features, '{}'::jsonb),
        'reason', 'ACCESS_GRANTED',
        'message', 'Accès autorisé.'
    );
END;
$$;

-- ============================================================
-- 21_views.sql - Vues utiles
-- ============================================================

-- Vue: Élèves avec leurs classes actuelles
CREATE OR REPLACE VIEW public.v_students_current_classes AS
SELECT 
    s.id AS student_id,
    s.registration_number,
    s.first_name,
    s.last_name,
    s.school_id,
    c.id AS class_id,
    c.name AS class_name,
    ay.id AS academic_year_id,
    ay.name AS academic_year_name
FROM public.students s
LEFT JOIN public.enrollments e ON e.student_id = s.id AND e.status = 'active'
LEFT JOIN public.classes c ON c.id = e.class_id
LEFT JOIN public.academic_years ay ON ay.id = e.academic_year_id;

-- Vue: Bulletins avec détails
CREATE OR REPLACE VIEW public.v_report_cards_details AS
SELECT 
    rc.*,
    s.first_name AS student_first_name,
    s.last_name AS student_last_name,
    s.registration_number,
    c.name AS class_name,
    t.name AS term_name,
    ay.name AS academic_year_name
FROM public.report_cards rc
JOIN public.students s ON s.id = rc.student_id
JOIN public.classes c ON c.id = rc.class_id
JOIN public.academic_terms t ON t.id = rc.academic_term_id
JOIN public.academic_years ay ON ay.id = t.academic_year_id;

-- Vue: Transactions avec détails élèves
CREATE OR REPLACE VIEW public.v_payments_with_students AS
SELECT 
    pt.*,
    s.first_name AS student_first_name,
    s.last_name AS student_last_name,
    s.registration_number
FROM public.payment_transactions pt
JOIN public.students s ON s.id = pt.student_id;

-- ============================================================
-- 22_triggers.sql - Triggers et fonctions automatiques
-- ============================================================

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Appliquer le trigger sur les tables concernées
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON public.schools
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON public.grades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_report_cards_updated_at
    BEFORE UPDATE ON public.report_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Création automatique du profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Log automatique des actions importantes
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        school_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data
    )
    VALUES (
        CASE 
            WHEN TG_TABLE_NAME = 'students' THEN NEW.school_id
            WHEN TG_TABLE_NAME = 'payment_transactions' THEN NEW.school_id
            ELSE NULL
        END,
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$;

-- Triggers d'audit sur les tables sensibles
CREATE TRIGGER audit_students
    AFTER INSERT OR UPDATE OR DELETE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audit_payment_transactions
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_audit();

-- ============================================================
-- 23_seed.sql - Données initiales
-- ============================================================

-- Permissions de base
INSERT INTO public.permissions (code, name, description) VALUES
-- Élèves
('students.view', 'Voir les élèves', 'Consulter la liste des élèves'),
('students.create', 'Créer des élèves', 'Ajouter de nouveaux élèves'),
('students.update', 'Modifier les élèves', 'Modifier les informations des élèves'),
('students.delete', 'Supprimer les élèves', 'Supprimer des élèves'),

-- Notes
('grades.view', 'Voir les notes', 'Consulter les notes des élèves'),
('grades.create', 'Saisir les notes', 'Saisir de nouvelles notes'),
('grades.update', 'Modifier les notes', 'Modifier des notes existantes'),
('grades.delete', 'Supprimer les notes', 'Supprimer des notes'),

-- Présences
('attendance.view', 'Voir les présences', 'Consulter les présences'),
('attendance.create', 'Saisir les présences', 'Enregistrer les présences'),

-- Finances
('payments.view', 'Voir les paiements', 'Consulter les transactions'),
('payments.create', 'Enregistrer les paiements', 'Créer des paiements'),
('payments.refund', 'Rembourser', 'Effectuer des remboursements'),

-- Bulletins
('reports.view', 'Voir les bulletins', 'Consulter les bulletins'),
('reports.publish', 'Publier les bulletins', 'Publier les bulletins'),

-- Administration
('users.manage', 'Gérer les utilisateurs', 'Gérer les utilisateurs de l''école'),
('school.settings', 'Paramètres de l''école', 'Modifier les paramètres de l''école'),
('subscription.manage', 'Gérer l''abonnement', 'Gérer l''abonnement de l''école'),

-- Communication
('communication.send', 'Envoyer des messages', 'Envoyer des communications'),
('communication.view', 'Voir les messages', 'Consulter les communications');

-- Plans d'abonnement
INSERT INTO public.plans (name, slug, description, price, currency, billing_interval, max_students, max_teachers, max_users, features) VALUES
('Essai', 'essai', 'Plan d''essai gratuit', 0, 'XOF', 'monthly', 10, 5, 10, 
 '{"students": true, "grades": true, "report_cards": true, "finance": false, "whatsapp": false, "ai_assistant": false, "advanced_analytics": false, "parent_portal": true}'::jsonb),

('Starter', 'starter', 'Plan de base pour petites écoles', 25000, 'XOF', 'monthly', 50, 20, 30,
 '{"students": true, "grades": true, "report_cards": true, "finance": true, "whatsapp": false, "ai_assistant": false, "advanced_analytics": false, "parent_portal": true}'::jsonb),

('Professionnel', 'professionnel', 'Plan complet pour écoles en croissance', 50000, 'XOF', 'monthly', 200, 50, 100,
 '{"students": true, "grades": true, "report_cards": true, "finance": true, "whatsapp": true, "ai_assistant": false, "advanced_analytics": true, "parent_portal": true}'::jsonb),

('Premium', 'premium', 'Plan tout inclus pour grands établissements', 100000, 'XOF', 'monthly', NULL, NULL, NULL,
 '{"students": true, "grades": true, "report_cards": true, "finance": true, "whatsapp": true, "ai_assistant": true, "advanced_analytics": true, "parent_portal": true}'::jsonb),

('Starter Annuel', 'starter_annuel', 'Plan Starter - paiement annuel', 250000, 'XOF', 'yearly', 50, 20, 30,
 '{"students": true, "grades": true, "report_cards": true, "finance": true, "whatsapp": false, "ai_assistant": false, "advanced_analytics": false, "parent_portal": true}'::jsonb),

('Professionnel Annuel', 'professionnel_annuel', 'Plan Professionnel - paiement annuel', 500000, 'XOF', 'yearly', 200, 50, 100,
 '{"students": true, "grades": true, "report_cards": true, "finance": true, "whatsapp": true, "ai_assistant": false, "advanced_analytics": true, "parent_portal": true}'::jsonb),

('Premium Annuel', 'premium_annuel', 'Plan Premium - paiement annuel', 1000000, 'XOF', 'yearly', NULL, NULL, NULL,
 '{"students": true, "grades": true, "report_cards": true, "finance": true, "whatsapp": true, "ai_assistant": true, "advanced_analytics": true, "parent_portal": true}'::jsonb);

-- Assigner les permissions aux rôles
INSERT INTO public.role_permissions (role, permission_id)
SELECT role, id
FROM (
    VALUES
    -- Super Admin a toutes les permissions
    ('super_admin', 'students.view'),
    ('super_admin', 'students.create'),
    ('super_admin', 'students.update'),
    ('super_admin', 'students.delete'),
    ('super_admin', 'grades.view'),
    ('super_admin', 'grades.create'),
    ('super_admin', 'grades.update'),
    ('super_admin', 'grades.delete'),
    ('super_admin', 'attendance.view'),
    ('super_admin', 'attendance.create'),
    ('super_admin', 'payments.view'),
    ('super_admin', 'payments.create'),
    ('super_admin', 'payments.refund'),
    ('super_admin', 'reports.view'),
    ('super_admin', 'reports.publish'),
    ('super_admin', 'users.manage'),
    ('super_admin', 'school.settings'),
    ('super_admin', 'subscription.manage'),
    ('super_admin', 'communication.send'),
    ('super_admin', 'communication.view'),

    -- School Admin / Directeur
    ('school_admin', 'students.view'),
    ('school_admin', 'students.create'),
    ('school_admin', 'students.update'),
    ('school_admin', 'students.delete'),
    ('school_admin', 'grades.view'),
    ('school_admin', 'grades.create'),
    ('school_admin', 'grades.update'),
    ('school_admin', 'attendance.view'),
    ('school_admin', 'attendance.create'),
    ('school_admin', 'payments.view'),
    ('school_admin', 'payments.create'),
    ('school_admin', 'payments.refund'),
    ('school_admin', 'reports.view'),
    ('school_admin', 'reports.publish'),
    ('school_admin', 'users.manage'),
    ('school_admin', 'school.settings'),
    ('school_admin', 'communication.send'),
    ('school_admin', 'communication.view'),

    ('directeur', 'students.view'),
    ('directeur', 'students.create'),
    ('directeur', 'students.update'),
    ('directeur', 'students.delete'),
    ('directeur', 'grades.view'),
    ('directeur', 'grades.create'),
    ('directeur', 'grades.update'),
    ('directeur', 'attendance.view'),
    ('directeur', 'attendance.create'),
    ('directeur', 'payments.view'),
    ('directeur', 'payments.create'),
    ('directeur', 'reports.view'),
    ('directeur', 'reports.publish'),
    ('directeur', 'users.manage'),
    ('directeur', 'school.settings'),
    ('directeur', 'communication.send'),
    ('directeur', 'communication.view'),

    -- Enseignant
    ('enseignant', 'students.view'),
    ('enseignant', 'grades.view'),
    ('enseignant', 'grades.create'),
    ('enseignant', 'grades.update'),
    ('enseignant', 'attendance.view'),
    ('enseignant', 'attendance.create'),
    ('enseignant', 'reports.view'),
    ('enseignant', 'communication.view'),

    ('prof_principal', 'students.view'),
    ('prof_principal', 'grades.view'),
    ('prof_principal', 'grades.create'),
    ('prof_principal', 'grades.update'),
    ('prof_principal', 'attendance.view'),
    ('prof_principal', 'attendance.create'),
    ('prof_principal', 'reports.view'),
    ('prof_principal', 'reports.publish'),
    ('prof_principal', 'communication.view'),
    ('prof_principal', 'communication.send'),

    -- Comptable
    ('comptable', 'students.view'),
    ('comptable', 'payments.view'),
    ('comptable', 'payments.create'),
    ('comptable', 'payments.refund'),
    ('comptable', 'reports.view'),
    ('comptable', 'communication.view'),

    -- Secrétaire
    ('secretaire', 'students.view'),
    ('secretaire', 'students.create'),
    ('secretaire', 'students.update'),
    ('secretaire', 'attendance.view'),
    ('secretaire', 'payments.view'),
    ('secretaire', 'communication.view'),
    ('secretaire', 'communication.send'),

    -- Parent
    ('parent', 'students.view'),
    ('parent', 'grades.view'),
    ('parent', 'attendance.view'),
    ('parent', 'payments.view'),
    ('parent', 'reports.view'),
    ('parent', 'communication.view'),

    -- Élève
    ('eleve', 'grades.view'),
    ('eleve', 'attendance.view'),
    ('eleve', 'reports.view'),
    ('eleve', 'communication.view')
) AS data(role, permission_code)
JOIN public.permissions p ON p.code = data.permission_code
WHERE NOT EXISTS (
    SELECT 1 FROM public.role_permissions rp 
    WHERE rp.role = data.role AND rp.permission_id = p.id
);

-- ============================================================
-- POLITIQUES DE SÉCURITÉ (ROW LEVEL SECURITY - RLS)
-- Accès complet pour la synchronisation du client web
-- ============================================================

DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================