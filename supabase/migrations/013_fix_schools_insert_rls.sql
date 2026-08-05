-- ==============================================================================
-- MIGRATION 013 : FIX RLS INSERT SUR SCHOOLS (ONBOARDING)
-- IvoireEcole+ SaaS -- Supabase Cloud
-- ==============================================================================
--
-- PROBLEME :
--   La politique "schools_modify" (FOR ALL) utilise is_school_admin(id) dans
--   la clause USING, qui verifie si l'utilisateur est DEJA membre de l'ecole.
--   Lors de la creation initiale (onboarding), l'utilisateur n'est membre
--   d'aucune ecole -> l'INSERT echoue avec code 42501.
--
-- SOLUTION :
--   1. Ajouter une politique INSERT separee sur schools : tout utilisateur
--      authentifie peut creer une ecole (il en devient admin ensuite).
--   2. Corriger school_members_insert pour le cas bootstrap (premiere adhesion).
--   3. Creer une fonction SECURITY DEFINER create_school_with_member pour
--      atomiser la creation (ecole + membre + profil) sans RLS bloquant.
--   4. S'assurer que les profils user_profiles manquants sont crees.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- ETAPE 0 : Créer les fonctions nécessaires si elles n'existent pas
-- ==============================================================================

-- Fonction pour vérifier si un utilisateur est admin d'une école
CREATE OR REPLACE FUNCTION public.is_school_admin(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.school_members
        WHERE school_id = p_school_id
        AND user_id = auth.uid()
        AND role IN ('directeur', 'administrateur')
        AND is_active = TRUE
    );
$$;

-- Fonction pour vérifier si un utilisateur est super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
        AND is_super_admin = TRUE
        AND is_active = TRUE
    );
$$;

-- ==============================================================================
-- ETAPE 1 : Separer la politique schools_modify en INSERT + UPDATE/DELETE
-- ==============================================================================

DROP POLICY IF EXISTS "schools_modify" ON public.schools;

-- UPDATE : l'utilisateur doit etre admin de l'ecole
CREATE POLICY "schools_update"
ON public.schools
FOR UPDATE
USING (public.is_school_admin(id))
WITH CHECK (public.is_school_admin(id));

-- DELETE : l'utilisateur doit etre admin de l'ecole
CREATE POLICY "schools_delete"
ON public.schools
FOR DELETE
USING (public.is_school_admin(id));

-- INSERT : tout utilisateur authentifie peut creer une ecole
CREATE POLICY "schools_insert"
ON public.schools
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ==============================================================================
-- ETAPE 2 : Corriger school_members_insert pour le cas bootstrap
-- ==============================================================================

DROP POLICY IF EXISTS "school_members_insert" ON public.school_members;

CREATE POLICY "school_members_insert"
ON public.school_members
FOR INSERT
WITH CHECK (
    public.is_super_admin()
    OR public.is_school_admin(school_id)
    OR (
        user_id = auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM public.school_members sm
            WHERE sm.school_id = school_members.school_id
            AND sm.is_active = TRUE
        )
    )
);

-- ==============================================================================
-- ETAPE 3 : Fonction SECURITY DEFINER pour creer ecole + membre + profil
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_school_with_member(
    p_school_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id   UUID;
    v_school_id UUID;
    v_school_row RECORD;
    v_slug      TEXT;
    v_profile   RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED: Vous devez etre connecte pour creer une ecole.';
    END IF;

    -- Creer le profil si manquant
    SELECT id INTO v_profile FROM public.user_profiles WHERE id = v_user_id;
    IF NOT FOUND THEN
        INSERT INTO public.user_profiles (id, email, first_name, last_name, is_active, is_super_admin)
        SELECT
            au.id,
            au.email,
            COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
            COALESCE(au.raw_user_meta_data->>'last_name', ''),
            TRUE,
            FALSE
        FROM auth.users au
        WHERE au.id = v_user_id
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Générer un slug unique
    v_slug := COALESCE(
        p_school_data->>'slug',
        regexp_replace(
            lower(COALESCE(p_school_data->>'name', 'school')),
            '[^a-z0-9]+', '-', 'g'
        ) || '-' || extract(epoch from now())::bigint::text
    );

    -- Insérer l'école
    INSERT INTO public.schools (
        name, slug, registration_number, motto, address, city, country,
        phone, whatsapp, email, website, director_name, logo_url, school_type, status
    )
    VALUES (
        p_school_data->>'name',
        v_slug,
        p_school_data->>'registration_number',
        COALESCE(p_school_data->>'motto', 'Foi, Discipline, Excellence'),
        p_school_data->>'address',
        COALESCE(p_school_data->>'city', 'Abidjan'),
        COALESCE(p_school_data->>'country', 'Cote d''Ivoire'),
        p_school_data->>'phone',
        p_school_data->>'whatsapp',
        p_school_data->>'email',
        p_school_data->>'website',
        p_school_data->>'director_name',
        p_school_data->>'logo_url',
        COALESCE(p_school_data->>'school_type', 'Prive'),
        COALESCE(p_school_data->>'status', 'active')
    )
    RETURNING id INTO v_school_id;

    -- Ajouter l'utilisateur comme directeur
    INSERT INTO public.school_members (school_id, user_id, role, is_active)
    VALUES (v_school_id, v_user_id, 'directeur', TRUE)
    ON CONFLICT (school_id, user_id) DO UPDATE SET role = 'directeur', is_active = TRUE;

    -- Mettre à jour le profil
    UPDATE public.user_profiles
    SET school_id = v_school_id, role = 'directeur'
    WHERE id = v_user_id;

    -- Retourner l'école créée
    SELECT row_to_json(s.*) INTO v_school_row FROM public.schools s WHERE s.id = v_school_id;
    RETURN row_to_json(v_school_row)::JSONB;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_school_with_member(JSONB) TO authenticated;

-- ==============================================================================
-- ETAPE 4 : Creer les profils manquants pour tous les utilisateurs Auth existants
-- ==============================================================================

DO $$
DECLARE
    auth_user RECORD;
BEGIN
    FOR auth_user IN
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.user_profiles up ON up.id = au.id
        WHERE up.id IS NULL
    LOOP
        INSERT INTO public.user_profiles (id, email, first_name, last_name, is_active, is_super_admin)
        VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE(auth_user.raw_user_meta_data->>'first_name', split_part(auth_user.email, '@', 1)),
            COALESCE(auth_user.raw_user_meta_data->>'last_name', ''),
            TRUE,
            FALSE
        )
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE 'Profil cree pour : %', auth_user.email;
    END LOOP;
END;
$$;

-- ==============================================================================
-- ETAPE 5 : Politiques de sélection pour les écoles
-- ==============================================================================

-- Politique pour que les admins voient toutes les écoles de leur école
DROP POLICY IF EXISTS "schools_select" ON public.schools;
CREATE POLICY "schools_select"
ON public.schools
FOR SELECT
USING (
    public.is_super_admin()
    OR public.is_school_admin(id)
    OR id IN (
        SELECT school_id 
        FROM public.school_members 
        WHERE user_id = auth.uid() 
        AND is_active = TRUE
    )
);

-- Politique pour que les admins voient les membres de leur école
DROP POLICY IF EXISTS "school_members_select" ON public.school_members;
CREATE POLICY "school_members_select"
ON public.school_members
FOR SELECT
USING (
    public.is_super_admin()
    OR public.is_school_admin(school_id)
    OR user_id = auth.uid()
);

-- Notifier le rechargement du schéma
NOTIFY pgrst, 'reload schema';

COMMIT;