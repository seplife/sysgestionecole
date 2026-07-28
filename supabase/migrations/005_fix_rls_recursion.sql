-- ==============================================================================
-- MIGRATION 005: FIX ERREUR SUPABASE RLS 42P17 (INFINITE RECURSION ON SCHOOL_MEMBERS)
-- Application SaaS IvoireÉcole+
-- ==============================================================================

-- 1. Helper function pour récupérer les school_id sans déclencher la récursion RLS
CREATE OR REPLACE FUNCTION public.get_user_school_ids(user_uuid UUID DEFAULT auth.uid())
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

-- 2. Sécurisation des fonctions d'accès avec SECURITY DEFINER pour contourner RLS dans la fonction
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.school_members
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
        AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.school_members
        WHERE user_id = COALESCE(user_id, auth.uid())
        AND role = 'super_admin'
        AND is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_schools(user_id UUID)
RETURNS TABLE(school_id UUID, role VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT school_id, role
    FROM public.school_members
    WHERE user_id = user_id
    AND is_active = true;
$$;

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

CREATE OR REPLACE FUNCTION public.has_permission(
    permission_code VARCHAR,
    user_id UUID,
    school_id UUID
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
    IF public.is_super_admin(user_id) THEN
        RETURN TRUE;
    END IF;
    
    SELECT EXISTS (
        SELECT 1
        FROM public.school_members sm
        JOIN public.role_permissions rp ON rp.role = sm.role
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE sm.user_id = user_id
        AND sm.school_id = school_id
        AND sm.is_active = true
        AND p.code = permission_code
    ) INTO v_has_perm;
    
    RETURN COALESCE(v_has_perm, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
    permission_code VARCHAR,
    user_id UUID
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
    IF public.is_super_admin(user_id) THEN
        RETURN TRUE;
    END IF;
    
    SELECT EXISTS (
        SELECT 1
        FROM public.school_members sm
        JOIN public.role_permissions rp ON rp.role = sm.role
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE sm.user_id = user_id
        AND sm.is_active = true
        AND p.code = permission_code
    ) INTO v_has_perm;
    
    RETURN COALESCE(v_has_perm, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
    permission_code VARCHAR
)
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

CREATE OR REPLACE FUNCTION public.can_access_school_dashboard(
    p_school_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'AUTH_REQUIRED',
            'message', 'Vous devez être connecté.'
        );
    END IF;

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

    IF public.is_super_admin(v_user_id) THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'school_id', p_school_id,
            'role', 'super_admin',
            'subscription_status', 'active',
            'plan', 'SuperAdmin SaaS',
            'reason', 'ACCESS_GRANTED',
            'message', 'Accès super administrateur.'
        );
    END IF;

    SELECT role, is_active INTO v_membership_role, v_membership_active
    FROM public.school_members
    WHERE user_id = v_user_id
    AND (p_school_id IS NULL OR school_id = p_school_id)
    AND is_active = true
    LIMIT 1;

    IF v_membership_role IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'NO_SCHOOL_MEMBERSHIP',
            'message', 'Vous n''êtes pas membre de cet établissement.'
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', true,
        'school_id', p_school_id,
        'role', v_membership_role,
        'subscription_status', 'active',
        'reason', 'ACCESS_GRANTED',
        'message', 'Accès autorisé.'
    );
END;
$$;

-- 3. REMPLACEMENT DES POLITIQUES RLS INCRIMINÉES SUR SCHOOL_MEMBERS ET AUTRES TABLES
DROP POLICY IF EXISTS "members_view_their_school_members" ON public.school_members;
CREATE POLICY "members_view_their_school_members"
ON public.school_members
FOR SELECT
USING (
    user_id = auth.uid()
    OR school_id IN (SELECT public.get_user_school_ids(auth.uid()))
    OR public.is_super_admin()
);

DROP POLICY IF EXISTS "users_view_their_schools" ON public.schools;
CREATE POLICY "users_view_their_schools"
ON public.schools
FOR SELECT
USING (
    id IN (SELECT public.get_user_school_ids(auth.uid()))
    OR public.is_super_admin()
);

DROP POLICY IF EXISTS "admins_manage_their_schools" ON public.schools;
CREATE POLICY "admins_manage_their_schools"
ON public.schools
FOR ALL
USING (
    id IN (SELECT public.get_user_school_ids(auth.uid()))
    OR public.is_super_admin()
);

DROP POLICY IF EXISTS "school_members_view_students" ON public.students;
CREATE POLICY "school_members_view_students"
ON public.students
FOR SELECT
USING (
    school_id IN (SELECT public.get_user_school_ids(auth.uid()))
    OR public.is_super_admin()
);

-- 4. RECHARGEMENT DU CACHE DE SCHÉMA POSTGREST
NOTIFY pgrst, 'reload schema';
