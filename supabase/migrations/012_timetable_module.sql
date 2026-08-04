-- ============================================================
-- MIGRATION 012 — TIMETABLE MANAGEMENT MODULE (EMPLOI DU TEMPS+)
-- Multitenant: organization_id, school_id, academic_year_id
-- ============================================================

-- 1. SETTINGS
CREATE TABLE IF NOT EXISTS public.timetable_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    exam_curfew_time TIME DEFAULT '12:10:00', -- Regular classes for 3e/Tle must stop at 12:10
    monday_pm_exam_assessments BOOLEAN DEFAULT TRUE,
    thursday_pm_intermediate_assessments BOOLEAN DEFAULT TRUE,
    default_recess_start TIME DEFAULT '10:00:00',
    default_recess_end TIME DEFAULT '10:20:00',
    working_days JSONB DEFAULT '["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_timetable_settings UNIQUE(school_id, academic_year_id)
);

-- 2. PERIODS / TIME SLOTS DEFINITION
CREATE TABLE IF NOT EXISTS public.timetable_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    code VARCHAR(20) NOT NULL, -- S1, S2, S3, RECESS, S4, S5, S6, S7, S8, S9
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    period_type VARCHAR(20) DEFAULT 'REGULAR', -- 'REGULAR', 'RECESS', 'AFTERNOON', 'ASSESSMENT'
    sort_order INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUBJECT HOURS MATRIX (Weekly Quota & Constraints per Level/Class & Subject)
CREATE TABLE IF NOT EXISTS public.timetable_subject_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    level_id UUID,
    class_id UUID,
    subject_id UUID NOT NULL,
    weekly_sessions INT DEFAULT 3,
    session_duration_minutes INT DEFAULT 55,
    min_weekly_sessions INT DEFAULT 1,
    max_weekly_sessions INT DEFAULT 6,
    allow_consecutive BOOLEAN DEFAULT FALSE,
    max_consecutive_sessions INT DEFAULT 2,
    requires_special_room BOOLEAN DEFAULT FALSE,
    special_room_type VARCHAR(50), -- 'Labo Physique', 'Labo SVT', 'Informatique', 'Terrain'
    priority INT DEFAULT 5, -- 1 to 10 (10 highest)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEACHER AVAILABILITY
CREATE TABLE IF NOT EXISTS public.timetable_teacher_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    day_of_week VARCHAR(15) NOT NULL, -- 'Lundi', 'Mardi', etc.
    period_code VARCHAR(20) NOT NULL, -- 'S1', 'S2', etc.
    is_available BOOLEAN DEFAULT TRUE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROOM AVAILABILITY & SPECIALIZATIONS
CREATE TABLE IF NOT EXISTS public.timetable_room_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50) DEFAULT 'STANDARD', -- 'STANDARD', 'LABO_PC', 'LABO_SVT', 'INFORMATIQUE', 'SPORT'
    capacity INT DEFAULT 45,
    is_available BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONSTRAINTS CONFIGURATION
CREATE TABLE IF NOT EXISTS public.timetable_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    constraint_type VARCHAR(20) DEFAULT 'HARD', -- 'HARD', 'SOFT'
    weight INT DEFAULT 100, -- 1 to 100
    is_enabled BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TIMETABLE VERSIONS
CREATE TABLE IF NOT EXISTS public.timetable_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    title VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'BROUILLON', -- 'BROUILLON', 'GENERATION', 'OPTIMISATION', 'VALIDATION', 'PUBLISHED', 'ARCHIVED'
    quality_score INT DEFAULT 0,
    created_by UUID,
    notes TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TIMETABLE ENTRIES (Main schedule slots)
CREATE TABLE IF NOT EXISTS public.timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    version_id UUID REFERENCES public.timetable_versions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    subject_id UUID NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    teacher_id UUID NOT NULL,
    teacher_name VARCHAR(150) NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    day_of_week VARCHAR(15) NOT NULL, -- 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'
    period_code VARCHAR(20) NOT NULL, -- 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    activity_type VARCHAR(30) DEFAULT 'REGULAR_CLASS', -- 'REGULAR_CLASS', 'LEVEL_ASSESSMENT', 'REINFORCEMENT', 'REMEDIATION', 'EXAM_PREPARATION', 'REVISION', 'SUPPORT', 'FREE_SLOT'
    is_locked BOOLEAN DEFAULT FALSE,
    has_conflict BOOLEAN DEFAULT FALSE,
    conflict_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LEVEL ASSESSMENTS (Devoirs de niveau)
CREATE TABLE IF NOT EXISTS public.timetable_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    level_name VARCHAR(50) NOT NULL, -- '3e', 'Terminale A', '6e', etc.
    class_id UUID,
    subject_id UUID NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    supervisor_teacher_id UUID,
    supervisor_teacher_name VARCHAR(150),
    room_name VARCHAR(100) NOT NULL,
    assessment_date DATE NOT NULL,
    day_of_week VARCHAR(15) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    assessment_type VARCHAR(50) DEFAULT 'DEVOIR_DE_NIVEAU', -- 'DEVOIR_DE_NIVEAU', 'EXAMEN_BLANC', 'COMPOSITION'
    status VARCHAR(30) DEFAULT 'SCHEDULED',
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SPECIAL ACTIVITIES (Renforcement, Remédiation, Prep BAC/BEPC)
CREATE TABLE IF NOT EXISTS public.timetable_special_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    class_id UUID NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    teacher_name VARCHAR(150) NOT NULL,
    room_name VARCHAR(100) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'REINFORCEMENT', 'REMEDIATION', 'EXAM_PREPARATION', 'SUPPORT'
    day_of_week VARCHAR(15) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CONFLICTS AUDIT & RESOLUTIONS
CREATE TABLE IF NOT EXISTS public.timetable_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    version_id UUID REFERENCES public.timetable_versions(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL, -- 'TEACHER_DOUBLE_BOOKING', 'ROOM_DOUBLE_BOOKING', 'CLASS_DOUBLE_BOOKING', 'EXAM_CLASS_AFTERNOON_VIOLATION', 'ASSESSMENT_SLOT_VIOLATION'
    severity VARCHAR(20) DEFAULT 'HARD', -- 'HARD', 'SOFT'
    description TEXT NOT NULL,
    affected_entry_ids UUID[] DEFAULT '{}',
    suggested_solution TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DAILY ADJUSTMENTS & SUBSTITUTIONS
CREATE TABLE IF NOT EXISTS public.timetable_substitutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    date DATE NOT NULL,
    entry_id UUID REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
    original_teacher_name VARCHAR(150) NOT NULL,
    substitute_teacher_id UUID,
    substitute_teacher_name VARCHAR(150),
    original_room_name VARCHAR(100),
    new_room_name VARCHAR(100),
    change_type VARCHAR(30) NOT NULL, -- 'ABSENCE', 'REPLACEMENT', 'ROOM_SWAP', 'CANCELLED', 'RESCHEDULED'
    status VARCHAR(30) DEFAULT 'CONFIRMED',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. PUBLICATIONS & NOTIFICATIONS LOG
CREATE TABLE IF NOT EXISTS public.timetable_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    school_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    version_id UUID REFERENCES public.timetable_versions(id) ON DELETE CASCADE,
    published_by UUID,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    notified_teachers_count INT DEFAULT 0,
    notified_students_count INT DEFAULT 0,
    notes TEXT
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_timetable_entries_lookup ON public.timetable_entries(school_id, academic_year_id, version_id, class_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_assessments_lookup ON public.timetable_assessments(school_id, academic_year_id, day_of_week);

-- RLS POLICIES
ALTER TABLE public.timetable_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_subject_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_special_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_publications ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS policies for authenticated users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'timetable_entries_school_isolation') THEN
        CREATE POLICY timetable_entries_school_isolation ON public.timetable_entries
        FOR ALL USING (school_id = auth.uid() OR school_id IS NOT NULL);
    END IF;
END $$;
