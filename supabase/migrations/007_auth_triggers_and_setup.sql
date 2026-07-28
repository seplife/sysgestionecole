-- ==============================================================================
-- MIGRATION 007 : TRIGGERS AUTH + SETUP SUPER ADMIN
-- IvoireÉcole+ SaaS — Supabase Cloud
-- ==============================================================================
-- 
-- OBJECTIF:
--   1. Créer automatiquement un profil user_profiles à l'inscription Supabase Auth
--   2. Configurer le compte superadmin@ivoireecole.ci comme Super Admin
--   3. Vérifications de sécurité post-migration 006
--
-- APPLIQUER DANS : Supabase Dashboard → SQL Editor
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- ÉTAPE 1 : Trigger de création automatique de user_profiles à l'inscription
-- ==============================================================================
-- Quand un utilisateur s'inscrit via Supabase Auth (auth.users INSERT),
-- on crée automatiquement son profil dans public.user_profiles.
-- Cela garantit que tout utilisateur Auth a toujours un profil correspondant.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name  TEXT;
BEGIN
  -- Extraire prénom/nom des metadata si disponibles (ex: depuis Google OAuth)
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 1),
    split_part(NEW.email, '@', 1)
  );
  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 2),
    ''
  );

  -- Insérer le profil (ignorer si déjà existant via ON CONFLICT)
  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    is_active,
    is_super_admin,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    TRUE,
    FALSE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- ÉTAPE 2 : Trigger de mise à jour du profil si email change dans auth.users
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Synchroniser l'email si modifié
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.user_profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_updated();

-- ==============================================================================
-- ÉTAPE 3 : S'assurer que is_super_admin existe dans user_profiles
-- (ajouté par migration 006 — vérification défensive)
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;
    RAISE NOTICE 'Colonne is_super_admin ajoutée à user_profiles.';
  ELSE
    RAISE NOTICE 'Colonne is_super_admin déjà présente dans user_profiles.';
  END IF;
END;
$$;

-- ==============================================================================
-- ÉTAPE 4 : Configurer le Super Admin
-- ⚠️  IMPORTANT: Exécutez d'abord cette étape APRÈS avoir créé le compte
--     superadmin@ivoireecole.ci dans Supabase Auth Dashboard.
--     (Authentication > Users > Invite user)
-- ==============================================================================

-- Cette requête configure is_super_admin = TRUE pour le Super Admin
-- Elle est idempotente (peut être exécutée plusieurs fois sans risque)
DO $$
DECLARE
  v_super_admin_email TEXT := 'superadmin@ivoireecole.ci';
  v_user_id UUID;
BEGIN
  -- Chercher l'utilisateur dans auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_super_admin_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Créer le profil s'il n'existe pas
    INSERT INTO public.user_profiles (id, email, first_name, last_name, is_active, is_super_admin)
    VALUES (v_user_id, v_super_admin_email, 'Super', 'Admin', TRUE, TRUE)
    ON CONFLICT (id) DO UPDATE SET
      is_super_admin = TRUE,
      is_active = TRUE,
      email = v_super_admin_email;

    RAISE NOTICE 'Super Admin configuré : % (id: %)', v_super_admin_email, v_user_id;
  ELSE
    RAISE NOTICE 'ATTENTION : Utilisateur % introuvable dans auth.users. Créez le compte Supabase Auth d abord.', v_super_admin_email;
  END IF;
END;
$$;

-- ==============================================================================
-- ÉTAPE 5 : Créer les profils manquants pour tous les utilisateurs Auth existants
-- (Rétroactivité : pour les utilisateurs créés avant ce trigger)
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

    RAISE NOTICE 'Profil créé pour : %', auth_user.email;
  END LOOP;
END;
$$;

COMMIT;

-- ==============================================================================
-- VÉRIFICATION POST-MIGRATION
-- Exécutez ces requêtes pour vérifier que tout est en ordre
-- ==============================================================================

-- 1. Vérifier le trigger on_auth_user_created
-- SELECT trigger_name, event_manipulation, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';

-- 2. Vérifier le Super Admin
-- SELECT id, email, is_super_admin, is_active
-- FROM public.user_profiles
-- WHERE email = 'superadmin@ivoireecole.ci';

-- 3. Vérifier qu'il n'y a pas de policies récursives sur school_members
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'school_members';

-- 4. Tester is_super_admin() sans récursion (en tant que super admin)
-- SELECT public.is_super_admin();
-- SELECT public.is_school_admin('00000000-0000-0000-0000-000000000000'::uuid);
