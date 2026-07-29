-- ==============================================================================
-- MIGRATION 009 : NORMALISATION DE LA TABLE AUDIT_LOGS & DÉCLENCHEURS
-- IvoireÉcole+ SaaS — Supabase Cloud
-- ==============================================================================
-- 
-- OBJECTIF:
--   1. Ajouter les colonnes organization_id, entity_type, entity_id à audit_logs
--   2. Maintenir la rétro-compatibilité avec table_name et record_id
--   3. Créer des index de performance sur organisation, école, entité et date
--   4. Créer une fonction déclencheur d'audit unifiée sans récursion
-- ==============================================================================

BEGIN;

-- 1. S'assurer que public.audit_logs existe
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ajouter les colonnes manquantes de manière défensive (idempotente)
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(50) NOT NULL DEFAULT 'UPDATE';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS table_name VARCHAR(100);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS record_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_data JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_data JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 3. Rétro-compatibilité : synchroniser les colonnes si certaines étaient déjà remplies
UPDATE public.audit_logs 
SET 
  entity_type = COALESCE(entity_type, table_name, 'GENERIC'),
  entity_id = COALESCE(entity_id, record_id),
  table_name = COALESCE(table_name, entity_type, 'GENERIC'),
  record_id = COALESCE(record_id, entity_id)
WHERE entity_type IS NULL OR entity_id IS NULL OR table_name IS NULL OR record_id IS NULL;

-- 4. Index pour optimiser les requêtes d'audit et les filtres tenant
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school ON public.audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 5. Activer RLS sur public.audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Politique RLS : Les super admins et les membres de l'école peuvent lire leurs audits
DROP POLICY IF EXISTS audit_logs_tenant_select ON public.audit_logs;
CREATE POLICY audit_logs_tenant_select ON public.audit_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      school_id IN (
        SELECT sm.school_id FROM public.school_members sm WHERE sm.user_id = auth.uid() AND sm.is_active = TRUE
      )
      OR
      EXISTS (
        SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.is_super_admin = TRUE
      )
    )
  );

-- 7. Fonction déclencheur d'audit unifiée
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_school_id UUID;
  v_entity_id UUID;
  v_entity_type VARCHAR(50);
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
BEGIN
  v_entity_type := TG_TABLE_NAME;
  v_entity_id := COALESCE(NEW.id, OLD.id);

  IF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD);
    v_school_id := OLD.school_id;
    v_org_id := OLD.organization_id;
  ELSE
    v_new_data := to_jsonb(NEW);
    IF TG_OP = 'UPDATE' THEN
      v_old_data := to_jsonb(OLD);
    END IF;
    v_school_id := NEW.school_id;
    v_org_id := NEW.organization_id;
  END IF;

  INSERT INTO public.audit_logs (
    organization_id,
    school_id,
    user_id,
    entity_type,
    entity_id,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    created_at
  ) VALUES (
    v_org_id,
    v_school_id,
    auth.uid(),
    v_entity_type,
    v_entity_id,
    v_entity_type,
    v_entity_id,
    TG_OP,
    v_old_data,
    v_new_data,
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMIT;
