-- ========================================
-- Forge-Blog: Tables admin auth
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ========================================

-- 1. Table pour stocker le hash du mot de passe admin
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table pour les sessions actives
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 3. RLS policies — seul le service role key peut lire/écrire
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Seul le service role key a accès
CREATE POLICY "service_role_all" ON public.admin_credentials
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "service_role_all" ON public.admin_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
