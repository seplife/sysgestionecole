-- ==============================================================================
-- MIGRATION 010 : FONCTIONS SECURITY DEFINER RLS SANS RÉCURSION INFINIE
-- IvoireÉcole+ SaaS — Supabase Cloud
-- ==============================================================================
-- 
-- OBJECTIF:
--   1. Créer la fonction public.is_school_member() sans récursion RLS
--   2. Créer la fonction public.has_school_access() pour vérifier les privilèges
--   3. Appliquer l'isolation RLS multi-tenant sur les tables métier sensibles
-- ==============================================================================

BEGIN;

-- 1. Fonction SECURITY DEFINER pour vérifier si l'utilisateur est membre d'une école
-- (S'exécute avec les privilèges du propriétaire et ignore les règles RLS de school_members)
CREATE OR REPLACE FUNCTION public.is_school_member(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_school_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérification super admin
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_super_admin = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  -- Vérification membres de l'école
  RETURN EXISTS (
    SELECT 1 FROM public.school_members
    WHERE school_id = p_school_id
      AND user_id = auth.uid()
      AND is_active = TRUE
  );
END;
$$;

-- 2. Fonction SECURITY DEFINER pour vérifier l'accès avec rôle spécifique
CREATE OR REPLACE FUNCTION public.has_school_role(p_school_id UUID, p_required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_school_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_super_admin = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.school_members
    WHERE school_id = p_school_id
      AND user_id = auth.uid()
      AND role = p_required_role
      AND is_active = TRUE
  );
END;
$$;

-- 3. Application des politiques RLS sur la table students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_tenant_all ON public.students;
CREATE POLICY students_tenant_all ON public.students
  FOR ALL
  USING (public.is_school_member(school_id))
  WITH CHECK (public.is_school_member(school_id));

-- 4. Application des politiques RLS sur la table classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS classes_tenant_all ON public.classes;
CREATE POLICY classes_tenant_all ON public.classes
  FOR ALL
  USING (public.is_school_member(school_id))
  WITH CHECK (public.is_school_member(school_id));

-- 5. Application des politiques RLS sur la table parents
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS parents_tenant_all ON public.parents;
CREATE POLICY parents_tenant_all ON public.parents
  FOR ALL
  USING (public.is_school_member(school_id))
  WITH CHECK (public.is_school_member(school_id));

-- 6. Application des politiques RLS sur la table teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teachers_tenant_all ON public.teachers;
CREATE POLICY teachers_tenant_all ON public.teachers
  FOR ALL
  USING (public.is_school_member(school_id))
  WITH CHECK (public.is_school_member(school_id));

COMMIT;
