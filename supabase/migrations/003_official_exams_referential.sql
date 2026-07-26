-- ============================================================
-- IVOIREÉCOLE+ — MIGRATION 003 : RÉFÉRENTIEL DES EXAMENS OFFICIELS (BAC A, BAC D, BEPC)
-- Compatible Supabase PostgreSQL Multi-Tenant
-- ============================================================

-- 1. Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tables du Référentiel Global (Shared across all schools)

-- Table: official_exams
CREATE TABLE IF NOT EXISTS public.official_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    level_code VARCHAR(50) NOT NULL CHECK (level_code IN ('TROISIEME', 'TERMINALE')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: official_series
CREATE TABLE IF NOT EXISTS public.official_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.official_exams(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    total_mandatory_coefficients INT NOT NULL DEFAULT 20,
    max_mandatory_points INT NOT NULL DEFAULT 400,
    display_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: official_subjects
CREATE TABLE IF NOT EXISTS public.official_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: official_exam_subjects
CREATE TABLE IF NOT EXISTS public.official_exam_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.official_exams(id) ON DELETE CASCADE,
    series_id UUID NOT NULL REFERENCES public.official_series(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.official_subjects(id) ON DELETE RESTRICT,
    code VARCHAR(100) UNIQUE NOT NULL,
    libelle VARCHAR(150) NOT NULL,
    coefficient INT NOT NULL CHECK (coefficient > 0),
    type VARCHAR(30) NOT NULL CHECK (type IN ('ecrit', 'oral', 'pratique', 'facultatif')),
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    is_bonus BOOLEAN NOT NULL DEFAULT FALSE,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (max_score > 0),
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_exam_series_subject UNIQUE (series_id, subject_id, type)
);

-- 3. Indexes pour les tables globales
CREATE INDEX IF NOT EXISTS idx_official_series_exam ON public.official_series(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_series ON public.official_exam_subjects(series_id);

-- 4. Insertion des examens nationaux
INSERT INTO public.official_exams (code, name, level_code, description)
VALUES 
  ('BAC', 'Baccalauréat de l''Enseignement Secondaire', 'TERMINALE', 'Examen national du second degré'),
  ('BEPC', 'Brevet d''Études du Premier Cycle', 'TROISIEME', 'Examen national du premier cycle')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, level_code = EXCLUDED.level_code, updated_at = NOW();

-- 5. Insertion des séries & filières
INSERT INTO public.official_series (exam_id, code, name, total_mandatory_coefficients, max_mandatory_points, display_order)
VALUES 
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), 'SERIE_A', 'BAC Série A (Littéraire)', 20, 400, 1),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), 'SERIE_D', 'BAC Série D (Scientifique)', 20, 400, 2),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), 'BEPC_GEN', 'BEPC Général', 18, 360, 1)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, total_mandatory_coefficients = EXCLUDED.total_mandatory_coefficients, updated_at = NOW();

-- 6. Insertion du catalogue de matières
INSERT INTO public.official_subjects (code, name, short_name, category)
VALUES 
  ('PHILOSOPHIE', 'Philosophie', 'PHILO', 'littéraire'),
  ('FRANCAIS_ECRIT', 'Français Écrit', 'FR_ECRIT', 'littéraire'),
  ('FRANCAIS_ORAL', 'Français Oral', 'FR_ORAL', 'littéraire'),
  ('LV1_ECRIT', 'Langue Vivante 1 Écrit', 'LV1_ECRIT', 'langues'),
  ('LV1_ORAL', 'Langue Vivante 1 Oral', 'LV1_ORAL', 'langues'),
  ('LV2_ECRIT', 'Langue Vivante 2 Écrit', 'LV2_ECRIT', 'langues'),
  ('LV2_ORAL', 'Langue Vivante 2 Oral', 'LV2_ORAL', 'langues'),
  ('HIST_GEO', 'Histoire-Géographie', 'HIST_GEO', 'humaines'),
  ('MATHS', 'Mathématiques', 'MATHS', 'scientifique'),
  ('SVT', 'Sciences de la Vie et de la Terre', 'SVT', 'scientifique'),
  ('PHYS_CHIM', 'Physique-Chimie', 'PHYS_CHIM', 'scientifique'),
  ('ANGLAIS_ECRIT', 'Anglais Écrit', 'ANG_ECRIT', 'langues'),
  ('ANGLAIS_ORAL', 'Anglais Oral', 'ANG_ORAL', 'langues'),
  ('COMP_FRANCAISE', 'Composition Française', 'COMP_FR', 'littéraire'),
  ('ORTHOGRAPHE', 'Orthographe / Étude de Texte', 'ORTHO', 'littéraire'),
  ('EDHC', 'Éducation aux Droits de l''Homme et Citoyenneté', 'EDHC', 'civique'),
  ('EPS', 'Éducation Physique et Sportive', 'EPS', 'sport'),
  ('ARTS_PLASTIQUES_MUSIQUE', 'Arts Plastiques ou Éducation Musicale', 'ARTS', 'artistique')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 7. Insertion des épreuves officiellement paramétrées

-- BAC A
INSERT INTO public.official_exam_subjects (exam_id, series_id, subject_id, code, libelle, coefficient, type, is_mandatory, is_bonus, max_score, display_order)
VALUES 
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'PHILOSOPHIE'), 'BAC_A_PHILO', 'Philosophie', 5, 'ecrit', true, false, 20.00, 1),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'FRANCAIS_ECRIT'), 'BAC_A_FR_ECRIT', 'Français (Écrit)', 3, 'ecrit', true, false, 20.00, 2),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'HIST_GEO'), 'BAC_A_HIST_GEO', 'Histoire-Géographie', 3, 'ecrit', true, false, 20.00, 3),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'LV1_ECRIT'), 'BAC_A_LV1_ECRIT', 'LV1 (Écrit)', 2, 'ecrit', true, false, 20.00, 4),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'LV2_ECRIT'), 'BAC_A_LV2_ECRIT', 'LV2 (Écrit)', 2, 'ecrit', true, false, 20.00, 5),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'MATHS'), 'BAC_A_MATHS', 'Mathématiques', 2, 'ecrit', true, false, 20.00, 6),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'FRANCAIS_ORAL'), 'BAC_A_FR_ORAL', 'Français (Oral)', 1, 'oral', true, false, 20.00, 7),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'LV1_ORAL'), 'BAC_A_LV1_ORAL', 'LV1 (Oral)', 1, 'oral', true, false, 20.00, 8),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'LV2_ORAL'), 'BAC_A_LV2_ORAL', 'LV2 (Oral)', 1, 'oral', true, false, 20.00, 9),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_A'), (SELECT id FROM public.official_subjects WHERE code = 'EPS'), 'BAC_A_EPS', 'Éducation Physique et Sportive (EPS)', 1, 'facultatif', false, true, 20.00, 10)
ON CONFLICT (code) DO UPDATE 
SET coefficient = EXCLUDED.coefficient, type = EXCLUDED.type, is_mandatory = EXCLUDED.is_mandatory, is_bonus = EXCLUDED.is_bonus, updated_at = NOW();

-- BAC D
INSERT INTO public.official_exam_subjects (exam_id, series_id, subject_id, code, libelle, coefficient, type, is_mandatory, is_bonus, max_score, display_order)
VALUES 
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_D'), (SELECT id FROM public.official_subjects WHERE code = 'MATHS'), 'BAC_D_MATHS', 'Mathématiques', 4, 'ecrit', true, false, 20.00, 1),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_D'), (SELECT id FROM public.official_subjects WHERE code = 'SVT'), 'BAC_D_SVT', 'Sciences de la Vie et de la Terre (SVT)', 4, 'ecrit', true, false, 20.00, 2),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_D'), (SELECT id FROM public.official_subjects WHERE code = 'PHYS_CHIM'), 'BAC_D_PHYS_CHIM', 'Physique-Chimie', 4, 'ecrit', true, false, 20.00, 3),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_D'), (SELECT id FROM public.official_subjects WHERE code = 'FRANCAIS_ECRIT'), 'BAC_D_FR_ECRIT', 'Français (Écrit)', 2, 'ecrit', true, false, 20.00, 4),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_D'), (SELECT id FROM public.official_subjects WHERE code = 'PHILOSOPHIE'), 'BAC_D_PHILO', 'Philosophie', 2, 'ecrit', true, false, 20.00, 5),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_D'), (SELECT id FROM public.official_subjects WHERE code = 'HIST_GEO'), 'BAC_D_HIST_GEO', 'Histoire-Géographie', 2, 'ecrit', true, false, 20.00, 6),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_D'), (SELECT id FROM public.official_subjects WHERE code = 'FRANCAIS_ORAL'), 'BAC_D_FR_ORAL', 'Français (Oral)', 1, 'oral', true, false, 20.00, 7),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_D'), (SELECT id FROM public.official_subjects WHERE code = 'ANGLAIS_ORAL'), 'BAC_D_ANGLAIS_ORAL', 'Anglais (Oral)', 1, 'oral', true, false, 20.00, 8),
  ((SELECT id FROM public.official_exams WHERE code = 'BAC'), (SELECT id FROM public.official_series WHERE code = 'SERIE_D'), (SELECT id FROM public.official_subjects WHERE code = 'EPS'), 'BAC_D_EPS', 'Éducation Physique et Sportive (EPS)', 1, 'facultatif', false, true, 20.00, 9)
ON CONFLICT (code) DO UPDATE 
SET coefficient = EXCLUDED.coefficient, type = EXCLUDED.type, is_mandatory = EXCLUDED.is_mandatory, is_bonus = EXCLUDED.is_bonus, updated_at = NOW();

-- BEPC
INSERT INTO public.official_exam_subjects (exam_id, series_id, subject_id, code, libelle, coefficient, type, is_mandatory, is_bonus, max_score, display_order)
VALUES 
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'MATHS'), 'BEPC_MATHS', 'Mathématiques', 3, 'ecrit', true, false, 20.00, 1),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'COMP_FRANCAISE'), 'BEPC_COMP_FR', 'Composition Française', 2, 'ecrit', true, false, 20.00, 2),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'ORTHOGRAPHE'), 'BEPC_ORTHO', 'Orthographe', 2, 'ecrit', true, false, 20.00, 3),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'PHYS_CHIM'), 'BEPC_PHYS_CHIM', 'Physique-Chimie', 2, 'ecrit', true, false, 20.00, 4),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'SVT'), 'BEPC_SVT', 'Sciences de la Vie et de la Terre (SVT)', 2, 'ecrit', true, false, 20.00, 5),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'HIST_GEO'), 'BEPC_HIST_GEO', 'Histoire-Géographie', 2, 'ecrit', true, false, 20.00, 6),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'ANGLAIS_ECRIT'), 'BEPC_ANGLAIS_ECRIT', 'Anglais (Écrit)', 1, 'ecrit', true, false, 20.00, 7),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'ANGLAIS_ORAL'), 'BEPC_ANGLAIS_ORAL', 'Anglais (Oral)', 1, 'oral', true, false, 20.00, 8),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'LV2_ECRIT'), 'BEPC_LV2', 'LV2 (Espagnol / Allemand)', 1, 'ecrit', true, false, 20.00, 9),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'EDHC'), 'BEPC_EDHC', 'EDHC', 1, 'ecrit', true, false, 20.00, 10),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'EPS'), 'BEPC_EPS', 'Éducation Physique et Sportive (EPS)', 1, 'pratique', true, false, 20.00, 11),
  ((SELECT id FROM public.official_exams WHERE code = 'BEPC'), (SELECT id FROM public.official_series WHERE code = 'BEPC_GEN'), (SELECT id FROM public.official_subjects WHERE code = 'ARTS_PLASTIQUES_MUSIQUE'), 'BEPC_ARTS', 'Arts Plastiques ou Éducation Musicale', 1, 'facultatif', false, true, 20.00, 12)
ON CONFLICT (code) DO UPDATE 
SET coefficient = EXCLUDED.coefficient, type = EXCLUDED.type, is_mandatory = EXCLUDED.is_mandatory, is_bonus = EXCLUDED.is_bonus, updated_at = NOW();

-- 8. Activer RLS pour les tables globales
ALTER TABLE public.official_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_exam_subjects ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy setup
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access Official Exams') THEN
        CREATE POLICY "Public Read Access Official Exams" ON public.official_exams FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access Official Series') THEN
        CREATE POLICY "Public Read Access Official Series" ON public.official_series FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access Official Subjects') THEN
        CREATE POLICY "Public Read Access Official Subjects" ON public.official_subjects FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access Official Exam Subjects') THEN
        CREATE POLICY "Public Read Access Official Exam Subjects" ON public.official_exam_subjects FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
