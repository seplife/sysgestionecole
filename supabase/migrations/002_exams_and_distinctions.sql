-- ============================================================================
-- IVOIREÉCOLE+ — MIGRATION 002 : MODULE EXAMENS & DISTINCTIONS
-- Architecture Multi-Tenant SaaS & Row Level Security (RLS)
-- ============================================================================

-- 1. Table des examens blancs
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id TEXT NOT NULL,
    academic_term_id TEXT, -- Trimestre/Semestre optionnel
    name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL, -- ex: 'BEPC_BLANC', 'BAC_BLANC', 'DEVOIR_NATIONALE'
    level_id TEXT NOT NULL, -- ex: '3ème', 'Terminale'
    class_id TEXT, -- Si spécifique à une classe, NULL si pour tout le niveau
    series_id TEXT, -- 'A', 'C', 'D' pour le Lycée
    start_date DATE,
    end_date DATE,
    status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'in_progress', 'completed', 'published'
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Matières et coefficients affectés à un examen
CREATE TABLE IF NOT EXISTS public.exam_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    coefficient NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    max_score NUMERIC(5,2) DEFAULT 20.0,
    is_optional BOOLEAN DEFAULT FALSE,
    UNIQUE(exam_id, subject_id)
);

-- 3. Inscription / Candidats à l'examen
CREATE TABLE IF NOT EXISTS public.exam_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    candidate_number VARCHAR(50),
    class_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- 4. Notes saisies par candidat et matière
CREATE TABLE IF NOT EXISTS public.exam_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    score NUMERIC(5,2), -- Ex: 14.50 sur 20
    is_absent BOOLEAN DEFAULT FALSE,
    entered_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id, subject_id)
);

-- 5. Résultats consolidés et calculés automatiquement
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    total_points NUMERIC(10,2) NOT NULL,
    total_coefficients NUMERIC(6,2) NOT NULL,
    average NUMERIC(5,2) NOT NULL, -- Note /20
    rank INTEGER, -- Rang dans la classe
    rank_level INTEGER, -- Rang dans le niveau
    mention VARCHAR(50), -- 'Très Bien', 'Bien', 'Assez Bien', 'Passable', 'Ajourné'
    result_status VARCHAR(30) NOT NULL, -- 'ADMIS', 'REFUSÉ', 'ABSENT'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

-- 6. Configuration du Tableau d'Honneur par école
CREATE TABLE IF NOT EXISTS public.honor_roll_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL, -- Ex: 'Excellence'
    min_average NUMERIC(4,2) NOT NULL, -- Ex: 16.00
    max_average NUMERIC(4,2), -- Ex: 20.00
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tableaux d'Honneur générés
CREATE TABLE IF NOT EXISTS public.honor_rolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id TEXT NOT NULL,
    academic_term_id TEXT,
    period_type VARCHAR(20) NOT NULL, -- 'monthly', 'term', 'annual'
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.honor_roll_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    honor_roll_id UUID NOT NULL REFERENCES public.honor_rolls(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    average NUMERIC(5,2) NOT NULL,
    distinction_level VARCHAR(100) NOT NULL, -- 'Excellence', 'Très Bien', etc.
    rank INTEGER
);

-- 8. Distinctions & Prix attribués
CREATE TABLE IF NOT EXISTS public.awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    award_type VARCHAR(100) NOT NULL, -- 'BEST_STUDENT', 'BEST_PROGRESSION', 'BEST_IN_SUBJECT'
    subject_id TEXT, -- Si 'BEST_IN_SUBJECT'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    academic_year_id TEXT NOT NULL,
    academic_term_id TEXT,
    average NUMERIC(5,2),
    progression_delta NUMERIC(4,2), -- Pour meilleure progression (+3.25 pts)
    rank INTEGER,
    awarded_at DATE DEFAULT CURRENT_DATE
);

-- 9. Certificats de Réussite et QR Codes
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
    certificate_number VARCHAR(100) UNIQUE NOT NULL, -- Ex: CERT-2026-GSE-000125
    certificate_type VARCHAR(100) NOT NULL, -- 'EXAM_SUCCESS', 'EXCELLENCE'
    title VARCHAR(255) NOT NULL,
    average NUMERIC(5,2),
    rank INTEGER,
    pdf_url TEXT,
    verification_code VARCHAR(150) UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    issued_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- INDEX DE PERFORMANCES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_exams_school_id ON public.exams(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_candidates_exam_id ON public.exam_candidates(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_grades_exam_student ON public.exam_grades(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_student ON public.exam_results(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON public.certificates(verification_code);

-- ============================================================================
-- ACTIVATION ET POLITIQUES ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ============================================================================
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honor_roll_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honor_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.honor_roll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Politiques RLS génériques d'isolation d'école pour chaque table
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'exams', 'exam_subjects', 'exam_candidates', 'exam_grades', 
            'exam_results', 'honor_roll_configs', 'honor_rolls', 'awards', 'certificates'
        ])
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS %I_school_isolation ON public.%I;
            CREATE POLICY %I_school_isolation ON public.%I
                FOR ALL
                USING (
                    school_id IN (
                        SELECT school_id FROM public.user_profiles WHERE user_id = auth.uid()
                    )
                    OR EXISTS (
                        SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = ''super_admin''
                    )
                );
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- RLS publique pour la vérification des certificats
DROP POLICY IF EXISTS public_certificates_read ON public.certificates;
CREATE POLICY public_certificates_read ON public.certificates
    FOR SELECT
    USING (true);

-- RLS pour honor_roll_entries (accès via honor_rolls parent)
DROP POLICY IF EXISTS honor_roll_entries_isolation ON public.honor_roll_entries;
CREATE POLICY honor_roll_entries_isolation ON public.honor_roll_entries
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.honor_rolls hr
            WHERE hr.id = honor_roll_entries.honor_roll_id
            AND (
                hr.school_id IN (SELECT school_id FROM public.user_profiles WHERE user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'super_admin')
            )
        )
    );

-- ============================================================================
-- FONCTION POSTGRESQL DE CALCUL AUTOMATISÉ DES RANGS ET MOYENNES
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_exam_results(p_exam_id UUID)
RETURNS VOID AS $$
DECLARE
    v_school_id TEXT;
BEGIN
    SELECT school_id INTO v_school_id FROM public.exams WHERE id = p_exam_id;
    IF v_school_id IS NULL THEN
        RAISE EXCEPTION 'Examen introuvable ID: %', p_exam_id;
    END IF;

    -- Supprimer les anciens résultats calculés pour cet examen
    DELETE FROM public.exam_results WHERE exam_id = p_exam_id;

    -- Insérer les résultats calculés avec gestion des matières facultatives (Bonus = MAX(0, Note - 10))
    WITH student_scores AS (
        SELECT 
            eg.student_id,
            ec.class_id,
            SUM(
                CASE 
                    WHEN es.is_optional = TRUE THEN GREATEST(0, eg.score - 10)
                    ELSE eg.score * es.coefficient
                END
            ) AS total_points,
            SUM(
                CASE 
                    WHEN es.is_optional = TRUE THEN 0
                    ELSE es.coefficient
                END
            ) AS total_coefficients,
            ROUND(
                (SUM(
                    CASE 
                        WHEN es.is_optional = TRUE THEN GREATEST(0, eg.score - 10)
                        ELSE eg.score * es.coefficient
                    END
                ) / NULLIF(SUM(
                    CASE 
                        WHEN es.is_optional = TRUE THEN 0
                        ELSE es.coefficient
                    END
                ), 0))::numeric, 2
            ) AS calculated_average
        FROM public.exam_candidates ec
        JOIN public.exam_grades eg ON ec.exam_id = eg.exam_id AND ec.student_id = eg.student_id
        JOIN public.exam_subjects es ON eg.exam_id = es.exam_id AND eg.subject_id = es.subject_id
        WHERE ec.exam_id = p_exam_id AND eg.is_absent = FALSE
        GROUP BY eg.student_id, ec.class_id
    ),
    ranked_students AS (
        SELECT 
            student_id,
            total_points,
            total_coefficients,
            calculated_average,
            DENSE_RANK() OVER (PARTITION BY class_id ORDER BY calculated_average DESC) AS rank_in_class,
            DENSE_RANK() OVER (ORDER BY calculated_average DESC) AS rank_in_level,
            CASE 
                WHEN calculated_average >= 16.00 THEN 'Très Bien'
                WHEN calculated_average >= 14.00 THEN 'Bien'
                WHEN calculated_average >= 12.00 THEN 'Assez Bien'
                WHEN calculated_average >= 10.00 THEN 'Passable'
                ELSE 'Ajourné'
            END AS calculated_mention,
            CASE 
                WHEN calculated_average >= 10.00 THEN 'ADMIS'
                ELSE 'REFUSÉ'
            END AS calculated_status
        FROM student_scores
    )
    INSERT INTO public.exam_results (
        school_id,
        exam_id,
        student_id,
        total_points,
        total_coefficients,
        average,
        rank,
        rank_level,
        mention,
        result_status
    )
    SELECT 
        v_school_id,
        p_exam_id,
        student_id,
        total_points,
        total_coefficients,
        calculated_average,
        rank_in_class,
        rank_in_level,
        calculated_mention,
        calculated_status
    FROM ranked_students;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
