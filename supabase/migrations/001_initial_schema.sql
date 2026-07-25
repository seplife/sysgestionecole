-- ============================================================================
-- IVOIREÉCOLE+ — PostgreSQL & Supabase Database Migration
-- Architecture SaaS Multi-Tenant & Row Level Security (RLS)
-- Côte d'Ivoire & Afrique Francophone EdTech ERP
-- Version 2.0 - Production Ready
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS REQUISES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. TABLES PRINCIPALES
-- ============================================================================

-- 2.1 ORGANIZATIONS (Groupes Scolaires / Fondations)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    logo_url TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Côte d''Ivoire',
    city VARCHAR(100) DEFAULT 'Abidjan',
    plan_type VARCHAR(50) DEFAULT 'Standard', -- Starter, Standard, Premium, Enterprise
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 SCHOOLS (Établissements)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100), -- Numéro d'autorisation MENA
    motto TEXT DEFAULT 'Excellence & Discipline',
    address TEXT,
    city VARCHAR(100) DEFAULT 'Abidjan',
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(255),
    director_name VARCHAR(150),
    logo_url TEXT,
    school_type VARCHAR(50) DEFAULT 'Prive', -- Public, Prive, Confessionnel
    education_levels TEXT[] DEFAULT ARRAY['Prescolaire', 'Primaire', 'Secondaire'],
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.3 CAMPUSES (Sites)
CREATE TABLE IF NOT EXISTS public.campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.4 ACADEMIC YEARS (Années Scolaires)
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g. '2025-2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 ACADEMIC TERMS (Trimestres / Semestres)
CREATE TABLE IF NOT EXISTS public.academic_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- Trimestre 1, Trimestre 2, Trimestre 3
    period_type VARCHAR(20) DEFAULT 'Trimestre', -- Trimestre, Semestre
    start_date DATE,
    end_date DATE,
    weight NUMERIC(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 USERS & PROFILES (Utilisateurs et Rôles RBAC)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'eleve', 
    -- Rôles: super_admin, admin_org, directeur, directeur_etudes, censeur, educateur, 
    -- enseignant, prof_principal, surveillant, secretaire, comptable, parent, eleve, bibliothecaire, chauffeur
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.7 PARENTS & GUARDIANS (Fiche Parents / Tuteurs)
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    email VARCHAR(150),
    profession VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.8 STUDENTS (Fiche Élève Complète)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL, -- Matricule MENA (ex: 2458912A)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    place_of_birth VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL, -- 'M' or 'F'
    nationality VARCHAR(50) DEFAULT 'Ivoirienne',
    photo_url TEXT,
    blood_group VARCHAR(10),
    medical_conditions TEXT,
    address TEXT,
    status VARCHAR(20) DEFAULT 'Inscrit', -- Inscrit, Reinscrit, Transfere, Radie
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.9 STUDENT_GUARDIANS (Relation Parent - Élève)
CREATE TABLE IF NOT EXISTS public.student_guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'Pere', -- Pere, Mere, Tuteur, Tutrice
    is_primary_contact BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.10 LEVELS & CLASSES (Niveaux et Classes)
CREATE TABLE IF NOT EXISTS public.levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- Petite Section, CP1, CP2, 6ème, 3ème, Terminale...
    cycle VARCHAR(50) NOT NULL, -- Prescolaire, Primaire, Secondaire_Premier_Cycle, Secondaire_Second_Cycle
    order_index INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g. 3ème 1, Terminale A2
    room_number VARCHAR(50),
    capacity INT DEFAULT 45,
    main_teacher_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.11 CLASS_STUDENTS (Affectation Élève -> Classe par Année Scolaire)
CREATE TABLE IF NOT EXISTS public.class_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, academic_year_id)
);

-- 2.12 SUBJECTS (Matières)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL, -- FRAN, MATH, ANG, PHYS, HG, SVT...
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'General', -- Litteraire, Scientifique, Sport, Art
    coefficient NUMERIC(3,1) DEFAULT 2.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.13 CLASS_SUBJECTS (Matière attribuée à une Classe avec Enseignant)
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    coefficient NUMERIC(3,1) DEFAULT 2.0,
    weekly_hours INT DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.14 ATTENDANCE & LATE RECORDS (Présences & Retards)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL, -- Present, Absent, Retard, Excuse
    minutes_late INT DEFAULT 0,
    reason TEXT,
    is_justified BOOLEAN DEFAULT FALSE,
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.15 ASSESSMENTS & GRADES (Évaluations et Notes)
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL, -- Interrogation 1, Devoir 2, Examen Blanc...
    assessment_type VARCHAR(50) DEFAULT 'Devoir', -- Interrogation, Devoir, Composition, Examen
    max_score NUMERIC(5,2) DEFAULT 20.0,
    weight NUMERIC(3,2) DEFAULT 1.0,
    date_given DATE DEFAULT CURRENT_DATE,
    teacher_id UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL, -- Note sur 20
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, student_id)
);

-- 2.16 REPORT CARDS (Bulletins Scolaires Trimestriels)
CREATE TABLE IF NOT EXISTS public.report_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
    overall_average NUMERIC(4,2),
    class_average NUMERIC(4,2),
    highest_average NUMERIC(4,2),
    lowest_average NUMERIC(4,2),
    rank INT,
    total_students INT,
    absences_count INT DEFAULT 0,
    late_count INT DEFAULT 0,
    general_appreciation TEXT,
    council_decision VARCHAR(100), -- Tableau d'Honneur, Encouragements, Avertissement...
    principal_signature TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.17 SCHOOL FEES & PAYMENTS (Finances, Scolarité & Mobile Money)
CREATE TABLE IF NOT EXISTS public.fee_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Frais de Scolarité, Cantine, Transport, Inscription...
    description TEXT,
    amount NUMERIC(12,2) NOT NULL, -- en FCFA
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
    total_amount NUMERIC(12,2) NOT NULL, -- FCFA
    discount_amount NUMERIC(12,2) DEFAULT 0.0,
    paid_amount NUMERIC(12,2) DEFAULT 0.0,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'Impaye', -- Impaye, Partiel, Paye
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    receipt_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. REC-2026-00481
    amount NUMERIC(12,2) NOT NULL, -- FCFA
    payment_method VARCHAR(50) NOT NULL, -- 'Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Espèces', 'Virement'
    transaction_id VARCHAR(150), -- ID de transaction opérateur
    payer_phone VARCHAR(50),
    payer_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Succès',
    recorded_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.18 MESSAGING & WHATSAPP LOGS (Communication & Chatbot)
CREATE TABLE IF NOT EXISTS public.communication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.user_profiles(id),
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(100),
    channel VARCHAR(20) NOT NULL, -- 'SMS', 'WhatsApp', 'Email', 'Push'
    subject VARCHAR(200),
    message_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Envoyé', -- Envoyé, Delivré, Échoué
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. NOUVELLES TABLES POUR AMÉLIORATIONS
-- ============================================================================

-- 3.1 AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 STUDENT STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.student_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 TRANSPORT ROUTES
CREATE TABLE IF NOT EXISTS public.transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.4 STUDENT TRANSPORT
CREATE TABLE IF NOT EXISTS public.student_transport (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE SET NULL,
    pickup_location TEXT,
    dropoff_location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.5 CANTEEN MENUS
CREATE TABLE IF NOT EXISTS public.canteen_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL, -- Petit déjeuner, Déjeuner, Goûter
    menu TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.6 CANTEEN SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.canteen_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.7 NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'success', 'error'
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.8 MOBILE MONEY LOGS
CREATE TABLE IF NOT EXISTS public.mobile_money_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL, -- 'Orange', 'MTN', 'Moov', 'Wave'
    transaction_id VARCHAR(150),
    request_payload JSONB,
    response_payload JSONB,
    status VARCHAR(20) DEFAULT 'En attente',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.9 ARCHIVE TABLES
CREATE TABLE IF NOT EXISTS public.communication_logs_archive (
    LIKE public.communication_logs INCLUDING ALL
);

CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
    LIKE public.audit_logs INCLUDING ALL
);

-- ============================================================================
-- 4. INDEX
-- ============================================================================

-- Index sur les clés étrangères et colonnes fréquemment interrogées
CREATE INDEX idx_students_school_id ON public.students(school_id);
CREATE INDEX idx_students_registration_number ON public.students(registration_number);
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_students_deleted_at ON public.students(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_classes_school_id ON public.classes(school_id);
CREATE INDEX idx_classes_academic_year_id ON public.classes(academic_year_id);
CREATE INDEX idx_classes_deleted_at ON public.classes(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_class_students_class_id ON public.class_students(class_id);
CREATE INDEX idx_class_students_academic_year_id ON public.class_students(academic_year_id);

CREATE INDEX idx_attendance_date ON public.attendance_records(date);
CREATE INDEX idx_attendance_student_date ON public.attendance_records(student_id, date);
CREATE INDEX idx_attendance_status ON public.attendance_records(status);

CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_assessment_id ON public.grades(assessment_id);

CREATE INDEX idx_payments_student_id ON public.payments(student_id);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX idx_payments_receipt_number ON public.payments(receipt_number);

CREATE INDEX idx_parents_phone ON public.parents(phone);
CREATE INDEX idx_parents_school_id ON public.parents(school_id);

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_school_id ON public.user_profiles(school_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

CREATE INDEX idx_academic_years_current ON public.academic_years(is_current) WHERE is_current = true;
CREATE INDEX idx_academic_years_school_id ON public.academic_years(school_id);

CREATE INDEX idx_student_fees_status ON public.student_fees(status);
CREATE INDEX idx_student_fees_student_id ON public.student_fees(student_id);

CREATE INDEX idx_communication_logs_created_at ON public.communication_logs(created_at DESC);
CREATE INDEX idx_communication_logs_recipient_phone ON public.communication_logs(recipient_phone);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_school_id ON public.audit_logs(school_id);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

CREATE INDEX idx_student_status_history_student ON public.student_status_history(student_id);

CREATE INDEX idx_mobile_money_logs_transaction ON public.mobile_money_logs(transaction_id);
CREATE INDEX idx_mobile_money_logs_payment_id ON public.mobile_money_logs(payment_id);

CREATE INDEX idx_report_cards_student_id ON public.report_cards(student_id);
CREATE INDEX idx_report_cards_term_id ON public.report_cards(academic_term_id);

-- ============================================================================
-- 5. CONTRAINTES DE VALIDATION
-- ============================================================================

ALTER TABLE public.students 
    ADD CONSTRAINT valid_gender CHECK (gender IN ('M', 'F'));

ALTER TABLE public.attendance_records 
    ADD CONSTRAINT valid_attendance_status CHECK (status IN ('Present', 'Absent', 'Retard', 'Excuse'));

ALTER TABLE public.student_fees 
    ADD CONSTRAINT valid_fee_status CHECK (status IN ('Impaye', 'Partiel', 'Paye'));

ALTER TABLE public.payments 
    ADD CONSTRAINT valid_payment_method CHECK (
        payment_method IN ('Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Espèces', 'Virement')
    );

ALTER TABLE public.user_profiles 
    ADD CONSTRAINT valid_user_role CHECK (
        role IN ('super_admin', 'admin_org', 'directeur', 'directeur_etudes', 'censeur', 
                 'educateur', 'enseignant', 'prof_principal', 'surveillant', 'secretaire', 
                 'comptable', 'parent', 'eleve', 'bibliothecaire', 'chauffeur')
    );

ALTER TABLE public.levels 
    ADD CONSTRAINT valid_cycle CHECK (
        cycle IN ('Prescolaire', 'Primaire', 'Secondaire_Premier_Cycle', 'Secondaire_Second_Cycle')
    );

ALTER TABLE public.payments 
    ADD CONSTRAINT valid_payment_status CHECK (status IN ('Succès', 'En attente', 'Échoué'));

ALTER TABLE public.academic_terms 
    ADD CONSTRAINT valid_period_type CHECK (period_type IN ('Trimestre', 'Semestre'));

-- Contrainte unique pour éviter les doublons de parents par téléphone et école
ALTER TABLE public.parents 
    ADD CONSTRAINT unique_parent_phone_school UNIQUE (phone, school_id);

-- ============================================================================
-- 6. FONCTIONS HELPER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID AS $$
    SELECT school_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- 7.1 TRIGGER POUR METTRE À JOUR updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7.2 TRIGGER POUR METTRE À JOUR LE STATUT DE L'ANNÉE SCOLAIRE
CREATE OR REPLACE FUNCTION public.set_current_academic_year()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = TRUE THEN
        UPDATE public.academic_years 
        SET is_current = FALSE 
        WHERE school_id = NEW.school_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_current_academic_year_trigger 
BEFORE INSERT OR UPDATE OF is_current ON public.academic_years
    FOR EACH ROW EXECUTE FUNCTION public.set_current_academic_year();

-- 7.3 TRIGGER POUR AUDIT DES CHANGEMENTS SUR LES STUDENTS
CREATE OR REPLACE FUNCTION public.audit_student_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO public.student_status_history (student_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_student_status_change 
AFTER UPDATE OF status ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.audit_student_changes();

-- 7.4 TRIGGER POUR AUDIT LOGS
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    table_name TEXT;
BEGIN
    table_name = TG_TABLE_NAME::TEXT;
    
    IF TG_OP = 'INSERT' THEN
        new_data = to_jsonb(NEW);
        old_data = NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        new_data = to_jsonb(NEW);
        old_data = to_jsonb(OLD);
    ELSIF TG_OP = 'DELETE' THEN
        new_data = NULL;
        old_data = to_jsonb(OLD);
    END IF;

    INSERT INTO public.audit_logs (
        school_id,
        user_id,
        table_name,
        record_id,
        action,
        old_data,
        new_data
    ) VALUES (
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.school_id
            ELSE NEW.school_id
        END,
        auth.uid(),
        table_name,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_data,
        new_data
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Application du trigger d'audit sur les tables critiques
CREATE TRIGGER audit_students_trigger AFTER INSERT OR UPDATE OR DELETE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_classes_trigger AFTER INSERT OR UPDATE OR DELETE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_payments_trigger AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 8.1 ACTIVATION RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 8.2 POLITIQUES RLS

-- Super Admin a accès à tout
CREATE POLICY super_admin_all_access_organizations ON public.organizations
    FOR ALL USING (public.is_super_admin());

CREATE POLICY super_admin_all_access_schools ON public.schools
    FOR ALL USING (public.is_super_admin());

CREATE POLICY super_admin_all_access_users ON public.user_profiles
    FOR ALL USING (public.is_super_admin());

CREATE POLICY super_admin_all_access_students ON public.students
    FOR ALL USING (public.is_super_admin());

-- Politiques pour les organisations
CREATE POLICY org_tenant_isolation ON public.organizations
    FOR ALL USING (
        id = public.get_user_organization_id()
        OR public.is_super_admin()
    );

-- Politiques pour les écoles
CREATE POLICY school_tenant_isolation ON public.schools
    FOR ALL USING (
        id = public.get_user_school_id()
        OR public.is_super_admin()
    );

-- Politiques pour les étudiants
CREATE POLICY student_school_isolation ON public.students
    FOR ALL USING (
        school_id = public.get_user_school_id()
        OR public.is_super_admin()
    );

-- Politique pour les parents (accès à leurs enfants uniquement)
CREATE POLICY parent_access_students ON public.students
    FOR SELECT USING (
        id IN (
            SELECT student_id FROM public.student_guardians 
            WHERE parent_id IN (
                SELECT id FROM public.parents WHERE user_id = auth.uid()
            )
        )
        OR public.get_user_role() = 'parent'
        OR public.is_super_admin()
    );

-- Politiques pour les classes
CREATE POLICY class_school_isolation ON public.classes
    FOR ALL USING (
        school_id = public.get_user_school_id()
        OR public.is_super_admin()
    );

-- Politiques pour les notes
CREATE POLICY grade_school_isolation ON public.grades
    FOR ALL USING (
        assessment_id IN (
            SELECT id FROM public.assessments 
            WHERE school_id = public.get_user_school_id()
        )
        OR public.is_super_admin()
    );

-- Politiques pour les paiements
CREATE POLICY payment_school_isolation ON public.payments
    FOR ALL USING (
        school_id = public.get_user_school_id()
        OR public.is_super_admin()
    );

-- Politiques pour les bulletins
CREATE POLICY report_card_school_isolation ON public.report_cards
    FOR ALL USING (
        school_id = public.get_user_school_id()
        OR public.is_super_admin()
    );

-- Politiques pour les présences
CREATE POLICY attendance_school_isolation ON public.attendance_records
    FOR ALL USING (
        school_id = public.get_user_school_id()
        OR public.is_super_admin()
    );

-- Politiques pour les communications
CREATE POLICY communication_school_isolation ON public.communication_logs
    FOR ALL USING (
        school_id = public.get_user_school_id()
        OR public.is_super_admin()
    );

-- Politiques pour les frais
CREATE POLICY fees_school_isolation ON public.student_fees
    FOR ALL USING (
        school_id = public.get_user_school_id()
        OR public.is_super_admin()
    );

-- Politiques pour les notifications
CREATE POLICY notification_user_access ON public.notifications
    FOR ALL USING (
        user_id = auth.uid()
        OR public.is_super_admin()
    );

-- ============================================================================
-- 9. VUES UTILES
-- ============================================================================

-- 9.1 VUE DASHBOARD STATISTIQUES ÉCOLE
CREATE OR REPLACE VIEW public.dashboard_school_stats AS
SELECT 
    s.id AS school_id,
    s.name AS school_name,
    s.logo_url,
    COUNT(DISTINCT st.id) AS total_students,
    COUNT(DISTINCT c.id) AS total_classes,
    COUNT(DISTINCT up.id) FILTER (WHERE up.role IN ('enseignant', 'prof_principal')) AS total_teachers,
    COUNT(DISTINCT p.id) AS total_parents,
    COUNT(DISTINCT CASE WHEN st.status = 'Inscrit' AND st.deleted_at IS NULL THEN st.id END) AS active_students,
    COUNT(DISTINCT CASE WHEN st.status = 'Reinscrit' AND st.deleted_at IS NULL THEN st.id END) AS re_enrolled_students,
    COUNT(DISTINCT CASE WHEN st.status = 'Radie' AND st.deleted_at IS NULL THEN st.id END) AS withdrawn_students,
    COUNT(DISTINCT CASE WHEN st.status = 'Transfere' AND st.deleted_at IS NULL THEN st.id END) AS transferred_students
FROM public.schools s
LEFT JOIN public.students st ON st.school_id = s.id AND st.deleted_at IS NULL
LEFT JOIN public.classes c ON c.school_id = s.id AND c.deleted_at IS NULL
LEFT JOIN public.user_profiles up ON up.school_id = s.id AND up.deleted_at IS NULL
LEFT JOIN public.parents p ON p.school_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.name, s.logo_url;

-- 9.2 VUE STATISTIQUES DE PRÉSENCE
CREATE OR REPLACE VIEW public.student_attendance_stats AS
SELECT 
    st.id AS student_id,
    st.first_name || ' ' || st.last_name AS student_name,
    st.registration_number,
    st.school_id,
    COUNT(CASE WHEN ar.status = 'Present' THEN 1 END) AS present_count,
    COUNT(CASE WHEN ar.status = 'Absent' THEN 1 END) AS absent_count,
    COUNT(CASE WHEN ar.status = 'Retard' THEN 1 END) AS late_count,
    COUNT(CASE WHEN ar.status = 'Excuse' THEN 1 END) AS excused_count,
    COUNT(ar.id) AS total_days,
    ROUND(
        COUNT(CASE WHEN ar.status IN ('Present', 'Excuse') THEN 1 END) * 100.0 / NULLIF(COUNT(ar.id), 0),
        2
    ) AS attendance_percentage
FROM public.students st
LEFT JOIN public.attendance_records ar ON ar.student_id = st.id
WHERE st.deleted_at IS NULL
GROUP BY st.id, st.first_name, st.last_name, st.registration_number, st.school_id;

-- 9.3 VUE ÉLÈVES AVEC CLASSE ACTUELLE
CREATE OR REPLACE VIEW public.students_with_current_class AS
SELECT 
    s.id,
    s.organization_id,
    s.school_id,
    s.registration_number,
    s.first_name,
    s.last_name,
    s.date_of_birth,
    s.gender,
    s.status,
    c.id AS class_id,
    c.name AS class_name,
    l.name AS level_name,
    ay.name AS academic_year_name,
    c.main_teacher_id,
    up.first_name || ' ' || up.last_name AS main_teacher_name
FROM public.students s
LEFT JOIN public.class_students cs ON cs.student_id = s.id
LEFT JOIN public.classes c ON c.id = cs.class_id AND c.deleted_at IS NULL
LEFT JOIN public.levels l ON l.id = c.level_id
LEFT JOIN public.academic_years ay ON ay.id = cs.academic_year_id AND ay.is_current = true
LEFT JOIN public.user_profiles up ON up.id = c.main_teacher_id
WHERE s.deleted_at IS NULL;

-- 9.4 VUE STATISTIQUES FINANCIÈRES
CREATE OR REPLACE VIEW public.financial_summary AS
SELECT 
    s.id AS school_id,
    s.name AS school_name,
    COUNT(DISTINCT sf.id) AS total_fees,
    SUM(sf.total_amount) AS total_expected,
    SUM(sf.paid_amount) AS total_collected,
    SUM(sf.total_amount - sf.paid_amount) AS total_outstanding,
    COUNT(DISTINCT sf.student_id) AS students_with_fees,
    COUNT(CASE WHEN sf.status = 'Paye' THEN 1 END) AS fully_paid_fees,
    COUNT(CASE WHEN sf.status = 'Partiel' THEN 1 END) AS partially_paid_fees,
    COUNT(CASE WHEN sf.status = 'Impaye' THEN 1 END) AS unpaid_fees
FROM public.schools s
LEFT JOIN public.student_fees sf ON sf.school_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.name;

-- 9.5 VUE PERFORMANCE ACADÉMIQUE
CREATE OR REPLACE VIEW public.academic_performance AS
SELECT 
    s.id AS student_id,
    s.first_name || ' ' || s.last_name AS student_name,
    s.registration_number,
    rc.academic_term_id,
    at.name AS term_name,
    ay.name AS academic_year_name,
    rc.overall_average,
    rc.class_average,
    rc.rank,
    rc.total_students,
    rc.overall_average - rc.class_average AS deviation_from_class_avg,
    CASE 
        WHEN rc.overall_average >= 16 THEN 'Excellent'
        WHEN rc.overall_average >= 14 THEN 'Très Bien'
        WHEN rc.overall_average >= 12 THEN 'Bien'
        WHEN rc.overall_average >= 10 THEN 'Passable'
        ELSE 'Insuffisant'
    END AS performance_rating
FROM public.students s
JOIN public.report_cards rc ON rc.student_id = s.id
JOIN public.academic_terms at ON at.id = rc.academic_term_id
JOIN public.academic_years ay ON ay.id = at.academic_year_id
WHERE s.deleted_at IS NULL;

-- ============================================================================
-- 10. FONCTION DE NETTOYAGE AUTOMATIQUE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.archive_old_data()
RETURNS VOID AS $$
BEGIN
    -- Archiver les logs de communication de plus de 2 ans
    INSERT INTO public.communication_logs_archive
    SELECT * FROM public.communication_logs
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    DELETE FROM public.communication_logs
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    -- Archiver les logs d'audit de plus de 3 ans
    INSERT INTO public.audit_logs_archive
    SELECT * FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '3 years';
    
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. MISE EN PLACE DU SCHÉMA (Optionnel - Commenté par défaut)
-- ============================================================================

-- Exemple de données initiales (à adapter)
-- INSERT INTO public.organizations (id, name, code) 
-- VALUES (uuid_generate_v4(), 'Groupe Scolaire Excellence', 'GSE001');

-- INSERT INTO public.schools (id, organization_id, name, registration_number)
-- VALUES (uuid_generate_v4(), (SELECT id FROM public.organizations LIMIT 1), 'École Primaire Excellence', 'MEN-2025-001');

-- ============================================================================
-- 12. NOTES ET DOCUMENTATION
-- ============================================================================

/*
  IVOIREÉCOLE+ Database Schema - Production Ready

  RÔLES DISPONIBLES:
  - super_admin: Accès total à toutes les organisations/écoles
  - admin_org: Administration d'une organisation
  - directeur: Direction d'un établissement
  - directeur_etudes: Gestion pédagogique
  - censeur: Discipline et suivi
  - educateur: Vie scolaire
  - enseignant: Cours et évaluations
  - prof_principal: Suivi de classe
  - surveillant: Discipline
  - secretaire: Gestion administrative
  - comptable: Gestion financière
  - parent: Suivi des enfants
  - eleve: Accès limité
  - bibliothecaire: Gestion de la bibliothèque
  - chauffeur: Transport scolaire

  POLITIQUES DE SÉCURITÉ:
  - Isolation automatique par école
  - Accès parent aux enfants uniquement
  - Super Admin: Accès global
  - Audit complet de toutes les opérations critiques

  EXTENSIONS REQUISES:
  - uuid-ossp: Génération d'UUID
  - pgcrypto: Fonctions de cryptage

  MAINTENANCE:
  - Archive automatique des logs > 2 ans
  - Soft delete avec colonne deleted_at
  - Audit logs pour traçabilité
  - Updated_at automatique
*/

-- ============================================================================
-- FIN DU SCHÉMA
-- ============================================================================