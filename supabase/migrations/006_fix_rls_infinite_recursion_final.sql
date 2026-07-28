-- ==============================================================================
-- MIGRATION 006: CORRECTION DÉFINITIVE RLS 42P17 (RÉCURSION INFINIE school_members)
-- Application SaaS IvoireÉcole+
-- Date: 2026-07-28
-- ==============================================================================
-- CAUSE RACINE DU PROBLÈME:
--   1. La policy RLS sur "school_members" appelle get_user_school_ids()
--      qui lit school_members -> BOUCLE INFINIE (42P17)
--   2. is_super_admin() lit aussi school_members -> DOUBLE RÉCURSION
--
-- SOLUTION:
--   A. Ajouter colonne "is_super_admin" dans user_profiles (pas de RLS circulaire)
--   B. Réécrire is_super_admin() pour lire user_profiles uniquement (SAFE)
--   C. Réécrire la policy de school_members sans sub-query vers school_members
--   D. Nettoyer toutes les policies conflictuelles résiduelles
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- ÉTAPE 1 : Ajouter la colonne is_super_admin dans user_profiles
-- Cette colonne permet d'identifier les super admins SANS lire school_members
-- ==============================================================================

ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Migrer les super admins existants depuis school_members vers user_profiles
UPDATE public.user_profiles up
SET is_super_admin = TRUE
WHERE EXISTS (
    SELECT 1 FROM public.school_members sm
    WHERE sm.user_id = up.id
    AND sm.role = 'super_admin'
    AND sm.is_active = true
);

-- ==============================================================================
-- ÉTAPE 2 : Réécrire is_super_admin() - lit user_profiles (JAMAIS school_members)
-- SECURITY DEFINER pour contourner le RLS de user_profiles si nécessaire
-- ==============================================================================

-- Version sans paramètre (utilise auth.uid())
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_super_admin
         FROM public.user_profiles
         WHERE id = auth.uid()
         AND is_active = true),
        FALSE
    );
$$;

-- Version avec paramètre p_user_id
-- DROP obligatoire : PostgreSQL interdit de changer le nom d'un paramètre
-- avec CREATE OR REPLACE (erreur 42P13). CASCADE recrée les dépendances.
DROP FUNCTION IF EXISTS public.is_super_admin(UUID) CASCADE;
CREATE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_super_admin
         FROM public.user_profiles
         WHERE id = p_user_id
         AND is_active = true),
        FALSE
    );
$$;

-- ==============================================================================
-- ÉTAPE 2b : is_school_admin() - Vérifie si l'utilisateur est admin d'une école
-- SECURITY DEFINER → lit school_members hors contexte RLS utilisateur
-- → la policy qui l'appelle ne déclenche PAS de réévaluation récursive RLS
-- ==============================================================================

DROP FUNCTION IF EXISTS public.is_school_admin(UUID, UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.is_school_admin(
    p_school_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        public.is_super_admin(p_user_id)
        OR EXISTS (
            SELECT 1
            FROM public.school_members sm
            WHERE sm.school_id = p_school_id
              AND sm.user_id = p_user_id
              AND sm.role IN (
                  'super_admin',
                  'school_admin',
                  'directeur',
                  'secretaire',
                  'directeur_etudes'
              )
              AND sm.is_active = TRUE
        );
$$;

-- ==============================================================================
-- ÉTAPE 3 : Réécrire get_user_school_ids() - SECURITY DEFINER (contourne RLS)
-- Cette fonction lit school_members avec SECURITY DEFINER
-- Le contexte SECURITY DEFINER contourne le RLS -> PAS de récursion
-- ==============================================================================

DROP FUNCTION IF EXISTS public.get_user_school_ids(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_school_ids(user_uuid UUID DEFAULT NULL)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT school_id
    FROM public.school_members
    WHERE user_id = COALESCE(user_uuid, auth.uid())
    AND is_active = true;
$$;

-- ==============================================================================
-- ÉTAPE 4 : Réécrire get_user_schools() - SECURITY DEFINER
-- ==============================================================================

-- Drop both versions to avoid parameter name conflicts
DROP FUNCTION IF EXISTS public.get_user_schools() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_schools(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_schools()
RETURNS TABLE(school_id UUID, role VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT school_id, role
    FROM public.school_members
    WHERE user_id = auth.uid()
    AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_user_schools(p_user_id UUID)
RETURNS TABLE(school_id UUID, role VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT school_id, role
    FROM public.school_members
    WHERE user_id = p_user_id
    AND is_active = true;
$$;

-- ==============================================================================
-- ÉTAPE 5 : Supprimer TOUTES les policies existantes sur school_members
-- Nettoyage complet pour éviter les conflits avec les migrations précédentes
-- ==============================================================================

DROP POLICY IF EXISTS "members_view_their_school_members" ON public.school_members;
DROP POLICY IF EXISTS "school_members_self_access" ON public.school_members;
DROP POLICY IF EXISTS "super_admin_all_school_members" ON public.school_members;
DROP POLICY IF EXISTS "school_members_insert" ON public.school_members;
DROP POLICY IF EXISTS "school_members_update" ON public.school_members;
DROP POLICY IF EXISTS "school_members_delete" ON public.school_members;
DROP POLICY IF EXISTS "school_members_select" ON public.school_members;
DROP POLICY IF EXISTS "school_members_all" ON public.school_members;

-- ==============================================================================
-- ÉTAPE 6 : Recréer les policies RLS sur school_members SANS RÉCURSION
--
-- RÈGLE CLÉ: La policy sur school_members NE DOIT PAS faire de sub-query
--            inline qui relit school_members (provoque 42P17).
--
-- AUTORISÉ dans les policies school_members:
--   - auth.uid()             (direct, aucune table)
--   - is_super_admin()       (lit user_profiles, jamais school_members)
--   - get_user_school_ids()  (SECURITY DEFINER, contourne le RLS)
--   - is_school_admin()      (SECURITY DEFINER, contourne le RLS)
-- ==============================================================================

-- SELECT: voir sa propre ligne, ou lignes de ses écoles
CREATE POLICY "school_members_select"
ON public.school_members
FOR SELECT
USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR school_id IN (SELECT public.get_user_school_ids(auth.uid()))
);

-- INSERT: is_school_admin() SECURITY DEFINER lit school_members hors RLS → safe
CREATE POLICY "school_members_insert"
ON public.school_members
FOR INSERT
WITH CHECK (
    public.is_school_admin(school_id)
);

-- UPDATE: is_school_admin() SECURITY DEFINER → aucune récursion
CREATE POLICY "school_members_update"
ON public.school_members
FOR UPDATE
USING (
    public.is_school_admin(school_id)
)
WITH CHECK (
    public.is_school_admin(school_id)
);

-- DELETE: is_school_admin() SECURITY DEFINER → aucune récursion
CREATE POLICY "school_members_delete"
ON public.school_members
FOR DELETE
USING (
    public.is_school_admin(school_id)
);

-- ==============================================================================
-- ÉTAPE 7 : Corriger les policies sur schools et students pour cohérence
-- ==============================================================================

-- SCHOOLS
DROP POLICY IF EXISTS "users_view_their_schools" ON public.schools;
DROP POLICY IF EXISTS "admins_manage_their_schools" ON public.schools;
DROP POLICY IF EXISTS "super_admin_all_access_schools" ON public.schools;
DROP POLICY IF EXISTS "school_tenant_isolation" ON public.schools;
DROP POLICY IF EXISTS "schools_select" ON public.schools;
DROP POLICY IF EXISTS "schools_modify" ON public.schools;

CREATE POLICY "schools_select"
ON public.schools
FOR SELECT
USING (
    public.is_super_admin()
    OR id IN (SELECT public.get_user_school_ids(auth.uid()))
);

-- schools_modify utilise is_school_admin() SECURITY DEFINER → safe
CREATE POLICY "schools_modify"
ON public.schools
FOR ALL
USING (
    public.is_school_admin(id)
);

-- STUDENTS
DROP POLICY IF EXISTS "school_members_view_students" ON public.students;
DROP POLICY IF EXISTS "educators_manage_students" ON public.students;
DROP POLICY IF EXISTS "super_admin_all_access_students" ON public.students;
DROP POLICY IF EXISTS "student_school_isolation" ON public.students;
DROP POLICY IF EXISTS "parent_access_students" ON public.students;
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_modify" ON public.students;

CREATE POLICY "students_select"
ON public.students
FOR SELECT
USING (
    public.is_super_admin()
    OR school_id IN (SELECT public.get_user_school_ids(auth.uid()))
);

CREATE POLICY "students_modify"
ON public.students
FOR ALL
USING (
    public.is_super_admin()
    OR EXISTS (
        SELECT 1 FROM public.school_members sm
        WHERE sm.school_id = students.school_id
        AND sm.user_id = auth.uid()
        AND sm.role IN ('super_admin', 'school_admin', 'directeur', 'secretaire', 'directeur_etudes')
        AND sm.is_active = true
    )
);

-- USER_PROFILES
DROP POLICY IF EXISTS "super_admin_all_access_users" ON public.user_profiles;
DROP POLICY IF EXISTS "users_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;

CREATE POLICY "user_profiles_select"
ON public.user_profiles
FOR SELECT
USING (
    id = auth.uid()
    OR public.is_super_admin()
);

CREATE POLICY "user_profiles_update"
ON public.user_profiles
FOR UPDATE
USING (id = auth.uid() OR public.is_super_admin())
WITH CHECK (id = auth.uid() OR public.is_super_admin());

CREATE POLICY "user_profiles_insert"
ON public.user_profiles
FOR INSERT
WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- ==============================================================================
-- ÉTAPE 8 : Corriger has_permission() - SECURITY DEFINER pour éviter récursion
-- ==============================================================================

DROP FUNCTION IF EXISTS public.has_permission(VARCHAR, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(VARCHAR, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION public.has_permission(
    permission_code VARCHAR,
    p_user_id UUID,
    p_school_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_perm BOOLEAN;
BEGIN
    IF public.is_super_admin(p_user_id) THEN
        RETURN TRUE;
    END IF;
    SELECT EXISTS (
        SELECT 1
        FROM public.school_members sm
        JOIN public.role_permissions rp ON rp.role = sm.role
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE sm.user_id = p_user_id
        AND sm.school_id = p_school_id
        AND sm.is_active = true
        AND p.code = permission_code
    ) INTO v_has_perm;
    RETURN COALESCE(v_has_perm, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
    permission_code VARCHAR,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_perm BOOLEAN;
BEGIN
    IF public.is_super_admin(p_user_id) THEN
        RETURN TRUE;
    END IF;
    SELECT EXISTS (
        SELECT 1
        FROM public.school_members sm
        JOIN public.role_permissions rp ON rp.role = sm.role
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE sm.user_id = p_user_id
        AND sm.is_active = true
        AND p.code = permission_code
    ) INTO v_has_perm;
    RETURN COALESCE(v_has_perm, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(permission_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_has_perm BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF public.is_super_admin(v_user_id) THEN
        RETURN TRUE;
    END IF;
    SELECT EXISTS (
        SELECT 1
        FROM public.school_members sm
        JOIN public.role_permissions rp ON rp.role = sm.role
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE sm.user_id = v_user_id
        AND sm.is_active = true
        AND p.code = permission_code
    ) INTO v_has_perm;
    RETURN COALESCE(v_has_perm, FALSE);
END;
$$;

-- ==============================================================================
-- ÉTAPE 9 : Trigger de synchronisation is_super_admin
-- Si un membre est ajouté/mis à jour avec rôle super_admin dans school_members,
-- mettre à jour automatiquement la colonne is_super_admin de user_profiles
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sync_super_admin_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role = 'super_admin' AND NEW.is_active = TRUE THEN
        UPDATE public.user_profiles
        SET is_super_admin = TRUE
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_super_admin ON public.school_members;
CREATE TRIGGER trg_sync_super_admin
AFTER INSERT OR UPDATE ON public.school_members
FOR EACH ROW EXECUTE FUNCTION public.sync_super_admin_flag();

-- Fonction utilitaire pour promouvoir un utilisateur en super admin
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.user_profiles
    SET is_super_admin = TRUE
    WHERE id = p_user_id;
END;
$$;

-- ==============================================================================
-- ÉTAPE 10 : Rechargement du cache de schéma PostgREST
-- ==============================================================================

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ==============================================================================
-- VÉRIFICATION POST-MIGRATION (à exécuter manuellement dans Supabase SQL Editor)
-- ==============================================================================
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'school_members'
-- ORDER BY policyname;
--
-- SELECT proname, prosecdef, prosrc
-- FROM pg_proc
-- WHERE proname IN ('is_super_admin', 'get_user_school_ids', 'get_user_schools')
-- AND pronamespace = 'public'::regnamespace;
--
-- Test rapide (remplacer l'UUID par un vrai user_id):
-- SELECT public.is_super_admin();
-- SELECT * FROM public.get_user_school_ids();
-- ==============================================================================