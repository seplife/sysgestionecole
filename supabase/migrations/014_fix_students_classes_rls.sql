-- ==============================================================================
-- MIGRATION 014 : FIX RLS INSERT/UPDATE SUR STUDENTS, CLASSES + AUTRES TABLES METIER
-- IvoireEcole+ SaaS -- Supabase Cloud
-- ==============================================================================
--
-- PROBLEME :
--   Les politiques RLS sur "students" et "classes" bloquent les INSERT/UPDATE
--   avec code 42501 car elles utilisent get_user_school_ids() ou is_school_member()
--   qui cherchent une appartenance dans school_members.
--   Apres l'onboarding, si school_members ou user_profiles n'est pas encore synchro,
--   l'utilisateur ne peut ni inserer d'eleves ni de classes.
--
-- SOLUTION :
--   Remplacer les politiques FOR ALL par des politiques separees :
--     - SELECT : must be school member
--     - INSERT  : must be school member OU is_school_admin (SECURITY DEFINER)
--     - UPDATE  : must be school member
--     - DELETE  : must be admin
--   Utiliser is_school_member() SECURITY DEFINER qui contourne la recursion RLS.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- ETAPE 1 : S'assurer que is_school_member() existe (SECURITY DEFINER safe)
-- ==============================================================================

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

  -- Super admin a toujours acces
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_super_admin = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  -- Verifier appartenance active a l'ecole
  RETURN EXISTS (
    SELECT 1 FROM public.school_members
    WHERE school_id = p_school_id
      AND user_id = auth.uid()
      AND is_active = TRUE
  );
END;
$$;

-- ==============================================================================
-- ETAPE 2 : Reconstruire les politiques RLS sur la table "students"
-- ==============================================================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies existantes sur students
DROP POLICY IF EXISTS "students_tenant_all"    ON public.students;
DROP POLICY IF EXISTS "students_select"        ON public.students;
DROP POLICY IF EXISTS "students_modify"        ON public.students;
DROP POLICY IF EXISTS "students_insert"        ON public.students;
DROP POLICY IF EXISTS "students_update"        ON public.students;
DROP POLICY IF EXISTS "students_delete"        ON public.students;
DROP POLICY IF EXISTS "school_members_view_students" ON public.students;
DROP POLICY IF EXISTS "educators_manage_students"    ON public.students;

-- SELECT : etre membre de l'ecole
CREATE POLICY "students_select"
ON public.students
FOR SELECT
USING (public.is_school_member(school_id));

-- INSERT : etre membre de l'ecole (SECURITY DEFINER contourne la recursion)
CREATE POLICY "students_insert"
ON public.students
FOR INSERT
WITH CHECK (public.is_school_member(school_id));

-- UPDATE : etre membre de l'ecole
CREATE POLICY "students_update"
ON public.students
FOR UPDATE
USING (public.is_school_member(school_id))
WITH CHECK (public.is_school_member(school_id));

-- DELETE : etre admin de l'ecole
CREATE POLICY "students_delete"
ON public.students
FOR DELETE
USING (public.is_school_admin(school_id));

-- ==============================================================================
-- ETAPE 3 : Reconstruire les politiques RLS sur la table "classes"
-- ==============================================================================

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classes_tenant_all"    ON public.classes;
DROP POLICY IF EXISTS "classes_select"        ON public.classes;
DROP POLICY IF EXISTS "classes_modify"        ON public.classes;
DROP POLICY IF EXISTS "classes_insert"        ON public.classes;
DROP POLICY IF EXISTS "classes_update"        ON public.classes;
DROP POLICY IF EXISTS "classes_delete"        ON public.classes;

CREATE POLICY "classes_select"
ON public.classes
FOR SELECT
USING (public.is_school_member(school_id));

CREATE POLICY "classes_insert"
ON public.classes
FOR INSERT
WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "classes_update"
ON public.classes
FOR UPDATE
USING (public.is_school_member(school_id))
WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "classes_delete"
ON public.classes
FOR DELETE
USING (public.is_school_admin(school_id));

-- ==============================================================================
-- ETAPE 4 : Reconstruire les politiques RLS sur la table "parents"
-- ==============================================================================

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parents_tenant_all"    ON public.parents;
DROP POLICY IF EXISTS "parents_select"        ON public.parents;
DROP POLICY IF EXISTS "parents_insert"        ON public.parents;
DROP POLICY IF EXISTS "parents_update"        ON public.parents;
DROP POLICY IF EXISTS "parents_delete"        ON public.parents;

CREATE POLICY "parents_select"
ON public.parents
FOR SELECT
USING (public.is_school_member(school_id));

CREATE POLICY "parents_insert"
ON public.parents
FOR INSERT
WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "parents_update"
ON public.parents
FOR UPDATE
USING (public.is_school_member(school_id))
WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "parents_delete"
ON public.parents
FOR DELETE
USING (public.is_school_admin(school_id));

-- ==============================================================================
-- ETAPE 5 : Reconstruire les politiques RLS sur la table "teachers"
-- ==============================================================================

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teachers_tenant_all"    ON public.teachers;
DROP POLICY IF EXISTS "teachers_select"        ON public.teachers;
DROP POLICY IF EXISTS "teachers_insert"        ON public.teachers;
DROP POLICY IF EXISTS "teachers_update"        ON public.teachers;
DROP POLICY IF EXISTS "teachers_delete"        ON public.teachers;

CREATE POLICY "teachers_select"
ON public.teachers
FOR SELECT
USING (public.is_school_member(school_id));

CREATE POLICY "teachers_insert"
ON public.teachers
FOR INSERT
WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "teachers_update"
ON public.teachers
FOR UPDATE
USING (public.is_school_member(school_id))
WITH CHECK (public.is_school_member(school_id));

CREATE POLICY "teachers_delete"
ON public.teachers
FOR DELETE
USING (public.is_school_admin(school_id));

-- ==============================================================================
-- ETAPE 6 : Corriger school_members si manquant pour l'utilisateur courant
-- On s'assure que tout utilisateur ayant un school_id dans user_profiles
-- a bien une entree dans school_members.
-- ==============================================================================

INSERT INTO public.school_members (school_id, user_id, role, is_active)
SELECT
    up.school_id,
    up.id,
    COALESCE(up.role, 'directeur'),
    TRUE
FROM public.user_profiles up
WHERE up.school_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.school_members sm
    WHERE sm.school_id = up.school_id
      AND sm.user_id = up.id
  )
ON CONFLICT (school_id, user_id) DO UPDATE
  SET is_active = TRUE,
      role = EXCLUDED.role;

-- ==============================================================================
-- ETAPE 7 : Rechargement du cache PostgREST
-- ==============================================================================

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ==============================================================================
-- VERIFICATION POST-MIGRATION (executer manuellement dans Supabase SQL Editor)
-- ==============================================================================
--
-- 1. Verifier les policies sur students :
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'students'
-- ORDER BY policyname;
--
-- 2. Verifier les policies sur classes :
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'classes'
-- ORDER BY policyname;
--
-- 3. Verifier que is_school_member() est SECURITY DEFINER :
-- SELECT proname, prosecdef FROM pg_proc
-- WHERE proname = 'is_school_member'
-- AND pronamespace = 'public'::regnamespace;
--
-- 4. Verifier school_members pour l'utilisateur :
-- SELECT sm.user_id, sm.school_id, sm.role, sm.is_active, up.email
-- FROM public.school_members sm
-- JOIN public.user_profiles up ON up.id = sm.user_id
-- ORDER BY up.email;
-- ==============================================================================
