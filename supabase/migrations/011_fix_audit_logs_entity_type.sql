-- ==============================================================================
-- MIGRATION 011 : CORRECTION DEFINITIVE DE LA TABLE AUDIT_LOGS
-- IvoireEcole+ SaaS - Supabase Cloud
-- ==============================================================================
-- PROBLEME : L'erreur "column entity_type of relation audit_logs does not exist"
--            survient parce que la table audit_logs (creee par 001_initial_schema)
--            ne possede pas encore : entity_type, entity_id, organization_id.
--
-- SOLUTION : Ajouter toutes les colonnes manquantes de facon idempotente.
-- ==============================================================================

BEGIN;

-- 1. S'assurer que la table de base existe (fallback)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ajouter toutes les colonnes necessaires (idempotent)

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS organization_id UUID
    REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS school_id UUID
    REFERENCES public.schools(id) ON DELETE CASCADE;

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS user_id UUID
    REFERENCES public.user_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS action VARCHAR(50) NOT NULL DEFAULT 'UPDATE';

-- COLONNE MANQUANTE PRINCIPALE
ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS entity_id UUID;

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS table_name VARCHAR(100);

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS record_id UUID;

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS old_data JSONB;

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS new_data JSONB;

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS ip_address INET;

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 3. Retro-compatibilite : synchroniser les colonnes croisees
UPDATE public.audit_logs
SET
  entity_type = COALESCE(entity_type, table_name, 'GENERIC'),
  entity_id   = COALESCE(entity_id,   record_id),
  table_name  = COALESCE(table_name,  entity_type, 'GENERIC'),
  record_id   = COALESCE(record_id,   entity_id)
WHERE
  entity_type IS NULL
  OR entity_id IS NULL
  OR table_name IS NULL
  OR record_id IS NULL;

-- 4. Index de performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_org
    ON public.audit_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_school
    ON public.audit_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON public.audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created
    ON public.audit_logs(created_at DESC);

-- 5. RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_tenant_select ON public.audit_logs;
CREATE POLICY audit_logs_tenant_select ON public.audit_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      school_id IN (
        SELECT sm.school_id
        FROM public.school_members sm
        WHERE sm.user_id = auth.uid()
          AND sm.is_active = TRUE
      )
      OR EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND up.is_super_admin = TRUE
      )
    )
  );

DROP POLICY IF EXISTS audit_logs_tenant_insert ON public.audit_logs;
CREATE POLICY audit_logs_tenant_insert ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;
