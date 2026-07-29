-- ==============================================================================
-- MIGRATION 008 : SEED & FIX FOREIGN KEYS MULTI-TENANT
-- IvoireÉcole+ SaaS — Supabase Cloud
-- ==============================================================================
-- 
-- OBJECTIF:
--   1. Insérer l'Organisation par défaut (00000000-0000-4000-8000-000000000000)
--   2. Insérer l'Établissement par défaut (00000000-0000-4000-8000-000000000001)
--   3. Corriger les contraintes foreign key (classes_school_id_fkey, students_organization_id_fkey)
--   4. Assurer que level_id existe dans public.classes
-- ==============================================================================

BEGIN;

-- 1. Organisation SaaS par défaut
INSERT INTO public.organizations (
  id,
  name,
  code,
  country,
  city,
  plan_type,
  is_active
)
VALUES (
  '00000000-0000-4000-8000-000000000000'::uuid,
  'Groupe Scolaire Saint-Viateur',
  'ORG-ST-VIATEUR',
  'Côte d''Ivoire',
  'Abidjan',
  'Enterprise',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 2. École par défaut rattachée à l'organisation
INSERT INTO public.schools (
  id,
  organization_id,
  name,
  slug,
  registration_number,
  motto,
  address,
  city,
  country,
  school_type,
  status
)
VALUES (
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000000'::uuid,
  'COLLÈGE CATHOLIQUE SAINT-VIATEUR',
  'saint-viateur-palmeraie',
  '000730/MENA',
  'Foi, Discipline, Excellence',
  'Riviera Palmeraie, Rue de la Paix',
  'Abidjan (Cocody)',
  'Côte d''Ivoire',
  'Prive',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Années scolaires par défaut pour la clé étrangère classes_academic_year_id_fkey
INSERT INTO public.academic_years (
  id,
  school_id,
  organization_id,
  name,
  start_date,
  end_date,
  is_current
)
VALUES (
  '00000000-0000-4000-8000-000020252026'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000000'::uuid,
  '2025-2026',
  '2025-09-08',
  '2026-07-15',
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 4. Niveaux scolaires par défaut pour la clé étrangère classes_level_id_fkey
INSERT INTO public.levels (id, school_id, name, cycle, order_index)
VALUES 
  ('00000000-0000-4000-8000-00000000006e'::uuid, '00000000-0000-4000-8000-000000000001'::uuid, '6ème', 'Secondaire_Premier_Cycle', 1),
  ('00000000-0000-4000-8000-00000000003e'::uuid, '00000000-0000-4000-8000-000000000001'::uuid, '3ème', 'Secondaire_Premier_Cycle', 4),
  ('00000000-0000-4000-8000-00000000007e'::uuid, '00000000-0000-4000-8000-000000000001'::uuid, 'Terminale', 'Secondaire_Second_Cycle', 7)
ON CONFLICT (id) DO NOTHING;

-- 5. Ajout défensif de la colonne entity_type à audit_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN entity_type VARCHAR(50);
  END IF;
END $$;

COMMIT;
