-- =====================================================================
-- FORGE-BLOG — Migration idempotente (peut être ré-exécutée sans erreur)
-- Toutes les créations utilisent IF NOT EXISTS ou EXCEPTION handlers
-- =====================================================================

-- #####################################################################
-- 1. ENUMS (IF NOT EXISTS via exception handler)
-- #####################################################################
DO $$ BEGIN CREATE TYPE public.editorial_role AS ENUM (
  'owner','administrator','editor','author','contributor','reviewer','analyst','read_only'
); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN CREATE TYPE public.article_status AS ENUM (
  'idea','researching','brief_ready','drafting','in_review','changes_requested',
  'approved','scheduled','published','updating','archived'
); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN CREATE TYPE public.target_product AS ENUM ('nainoforge','scyforge','both','none'); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE TYPE public.locale_code AS ENUM ('en','fr'); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE TYPE public.translation_status AS ENUM ('missing','draft','in_review','published','outdated'); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE TYPE public.ai_adapter_type AS ENUM ('anthropic','openai','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE TYPE public.ai_task_type AS ENUM ('brief_generation','draft_generation','seo_aeo_geo_audit'); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN CREATE TYPE public.score_dimension AS ENUM (
  'editorial_quality','factual_confidence','search_intent_alignment','seo_readiness',
  'aeo_readiness','geo_readiness','accessibility','readability','internal_linking',
  'source_quality','freshness','conversion_readiness'
); EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- #####################################################################
-- 2. TABLES
-- #####################################################################
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text, display_name text, bio text, expertise_framing text, avatar_url text,
  role public.editorial_role NOT NULL DEFAULT 'read_only',
  preferred_locale public.locale_code DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, name_en text NOT NULL, name_fr text NOT NULL,
  description_en text NOT NULL DEFAULT '', description_fr text NOT NULL DEFAULT '',
  target_product public.target_product NOT NULL DEFAULT 'none',
  sort_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, name_en text NOT NULL, name_fr text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL, locale public.locale_code NOT NULL DEFAULT 'en',
  translation_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  translation_status public.translation_status NOT NULL DEFAULT 'draft',
  working_title text NOT NULL, title text, dek text, excerpt text,
  content jsonb NOT NULL DEFAULT '{"sequence":[]}'::jsonb,
  status public.article_status NOT NULL DEFAULT 'idea',
  pillar_id uuid REFERENCES public.pillars (id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  editor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewer_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  primary_keyword text, secondary_keywords text[] DEFAULT '{}', search_intent text,
  target_product public.target_product, cover_image_url text, cover_image_alt text,
  seo_title text, meta_description text, canonical_url text, robots text DEFAULT 'index,follow',
  word_count int DEFAULT 0, read_time_minutes int DEFAULT 0,
  published_at timestamptz, scheduled_at timestamptz, last_updated_at timestamptz,
  next_review_at timestamptz, ai_generated boolean NOT NULL DEFAULT false,
  ai_model text, ai_provider text, brief jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, locale), UNIQUE (translation_group_id, locale)
);

CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  content jsonb NOT NULL, title text, status public.article_status,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  change_summary text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  title text NOT NULL, url text,
  source_type text NOT NULL DEFAULT 'secondary'
    CHECK (source_type IN ('primary','secondary','expert_commentary','unsupported')),
  credibility text DEFAULT 'medium'
    CHECK (credibility IN ('high','medium','low','unknown')),
  citation_date date, notes text, needs_verification boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, adapter_type public.ai_adapter_type NOT NULL,
  endpoint_url text, api_key_secret_ref text NOT NULL,
  default_model text NOT NULL,
  assigned_tasks public.ai_task_type[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.article_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  dimension public.score_dimension NOT NULL,
  score int NOT NULL CHECK (score >= 0 AND score <= 100),
  reasoning text NOT NULL DEFAULT '', top_fixes jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  audit_run_id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS public.review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  body text NOT NULL, block_id text, resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- #####################################################################
-- 3. INDEXES (IF NOT EXISTS)
-- #####################################################################
CREATE INDEX IF NOT EXISTS articles_status_idx ON public.articles (status);
CREATE INDEX IF NOT EXISTS articles_pillar_idx ON public.articles (pillar_id);
CREATE INDEX IF NOT EXISTS articles_locale_status_idx ON public.articles (locale, status);
CREATE INDEX IF NOT EXISTS articles_published_at_idx ON public.articles (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS revisions_article_idx ON public.revisions (article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS article_scores_article_idx ON public.article_scores (article_id, computed_at DESC);

-- #####################################################################
-- 4. FUNCTIONS & TRIGGERS (CREATE OR REPLACE)
-- #####################################################################
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'author');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_article_revision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.revisions (article_id, content, title, status, changed_by, change_summary)
  VALUES (
    COALESCE(NEW.id, OLD.id), COALESCE(NEW.content, OLD.content),
    COALESCE(NEW.title, OLD.title), COALESCE(NEW.status, OLD.status),
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'Created' WHEN TG_OP = 'UPDATE' THEN 'Updated' ELSE TG_OP END
  );
  RETURN NEW;
END;
$$;

-- Triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS articles_updated_at ON public.articles;
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS ai_providers_updated_at ON public.ai_providers;
CREATE TRIGGER ai_providers_updated_at BEFORE UPDATE ON public.ai_providers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS articles_revision_trigger ON public.articles;
CREATE TRIGGER articles_revision_trigger
  AFTER INSERT ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.record_article_revision();

DROP TRIGGER IF EXISTS articles_revision_update_trigger ON public.articles;
CREATE TRIGGER articles_revision_update_trigger
  AFTER UPDATE OF content, title, status ON public.articles
  FOR EACH ROW WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.record_article_revision();

-- #####################################################################
-- 5. RLS (idempotent via DROP/CREATE)
-- #####################################################################
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

-- RLS helper functions
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.editorial_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'read_only'::public.editorial_role);
$$;
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_role() IN ('owner','administrator','editor','author','contributor','reviewer','analyst');
$$;
CREATE OR REPLACE FUNCTION public.is_editor_plus()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_role() IN ('owner','administrator','editor');
$$;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_role() IN ('owner','administrator');
$$;

-- Drop existing RLS policies then recreate (idempotent)
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
DROP POLICY IF EXISTS pillars_public_read ON public.pillars;
DROP POLICY IF EXISTS pillars_admin_write ON public.pillars;
DROP POLICY IF EXISTS tags_public_read ON public.tags;
DROP POLICY IF EXISTS tags_admin_write ON public.tags;
DROP POLICY IF EXISTS articles_public_published ON public.articles;
DROP POLICY IF EXISTS articles_staff_read ON public.articles;
DROP POLICY IF EXISTS articles_insert ON public.articles;
DROP POLICY IF EXISTS articles_update ON public.articles;
DROP POLICY IF EXISTS articles_delete_admin ON public.articles;
DROP POLICY IF EXISTS article_tags_read ON public.article_tags;
DROP POLICY IF EXISTS article_tags_write ON public.article_tags;
DROP POLICY IF EXISTS revisions_staff_read ON public.revisions;
DROP POLICY IF EXISTS revisions_staff_insert ON public.revisions;
DROP POLICY IF EXISTS research_sources_staff ON public.research_sources;
DROP POLICY IF EXISTS ai_providers_admin_only ON public.ai_providers;
DROP POLICY IF EXISTS article_scores_staff_read ON public.article_scores;
DROP POLICY IF EXISTS article_scores_staff_write ON public.article_scores;
DROP POLICY IF EXISTS review_comments_staff ON public.review_comments;
DROP POLICY IF EXISTS article_images_select_public ON storage.objects;
DROP POLICY IF EXISTS article_images_insert_auth ON storage.objects;
DROP POLICY IF EXISTS article_images_update_auth ON storage.objects;
DROP POLICY IF EXISTS article_images_delete_auth ON storage.objects;

-- Recreate all policies
CREATE POLICY profiles_select_authenticated ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_update_self_or_admin ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY pillars_public_read ON public.pillars FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY pillars_admin_write ON public.pillars FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY tags_public_read ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY tags_admin_write ON public.tags FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY articles_public_published ON public.articles FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY articles_staff_read ON public.articles FOR SELECT TO authenticated USING (
  public.is_editor_plus() OR author_id = auth.uid() OR reviewer_id = auth.uid() OR editor_id = auth.uid()
  OR public.current_role() IN ('analyst','read_only'));
CREATE POLICY articles_insert ON public.articles FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_plus() OR public.current_role() IN ('author','contributor'));
CREATE POLICY articles_update ON public.articles FOR UPDATE TO authenticated
  USING (public.is_editor_plus() OR (public.current_role()='author' AND author_id=auth.uid()) OR (public.current_role()='reviewer' AND reviewer_id=auth.uid()))
  WITH CHECK (public.is_editor_plus() OR (public.current_role()='author' AND author_id=auth.uid())
    OR (public.current_role()='contributor' AND author_id=auth.uid() AND status IN ('idea','researching','brief_ready','drafting','in_review'))
    OR (public.current_role()='reviewer' AND reviewer_id=auth.uid()));
CREATE POLICY articles_delete_admin ON public.articles FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY article_tags_read ON public.article_tags FOR SELECT TO anon, authenticated USING (
  EXISTS (SELECT 1 FROM public.articles a WHERE a.id=article_id AND (a.status='published' OR auth.uid() IS NOT NULL)));
CREATE POLICY article_tags_write ON public.article_tags FOR ALL TO authenticated
  USING (public.is_editor_plus() OR public.current_role() IN ('author','contributor'))
  WITH CHECK (public.is_editor_plus() OR public.current_role() IN ('author','contributor'));
CREATE POLICY revisions_staff_read ON public.revisions FOR SELECT TO authenticated USING (
  public.is_editor_plus() OR EXISTS (SELECT 1 FROM public.articles a WHERE a.id=article_id AND (a.author_id=auth.uid() OR a.reviewer_id=auth.uid())));
CREATE POLICY revisions_staff_insert ON public.revisions FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_plus() OR public.current_role() IN ('author','contributor','reviewer'));
CREATE POLICY research_sources_staff ON public.research_sources FOR ALL TO authenticated
  USING (public.is_editor_plus() OR EXISTS (SELECT 1 FROM public.articles a WHERE a.id=article_id AND a.author_id=auth.uid()))
  WITH CHECK (public.is_editor_plus() OR EXISTS (SELECT 1 FROM public.articles a WHERE a.id=article_id AND a.author_id=auth.uid()));
CREATE POLICY ai_providers_admin_only ON public.ai_providers FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY article_scores_staff_read ON public.article_scores FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY article_scores_staff_write ON public.article_scores FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_plus() OR public.current_role() IN ('author','reviewer'));
CREATE POLICY review_comments_staff ON public.review_comments FOR ALL TO authenticated
  USING (public.is_editor_plus() OR author_id=auth.uid() OR EXISTS (SELECT 1 FROM public.articles a WHERE a.id=article_id AND (a.author_id=auth.uid() OR a.reviewer_id=auth.uid())))
  WITH CHECK (public.is_editor_plus() OR public.current_role() IN ('author','reviewer','contributor'));

-- #####################################################################
-- 6. SEED PILLARS (ON CONFLICT DO NOTHING)
-- #####################################################################
INSERT INTO public.pillars (slug,name_en,name_fr,description_en,description_fr,target_product,sort_order) VALUES
  ('retention-memory','Retention & Memory','Rétention & mémoire','Spaced repetition, forgetting curves, and durable learning.','Répétition espacée, courbes d''oubli et apprentissage durable.','nainoforge',1),
  ('fsrs-algorithms','FSRS & Algorithms','FSRS & algorithmes','How modern scheduling algorithms actually work.','Comment fonctionnent vraiment les algorithmes de planification modernes.','nainoforge',2),
  ('active-learning','Active Learning','Apprentissage actif','IMPRINT, retrieval practice, and intentional study systems.','IMPRINT, pratique de récupération et systèmes d''étude intentionnels.','nainoforge',3),
  ('soc-onboarding','SOC Onboarding','Onboarding SOC','Turning new analysts into operational contributors faster.','Transformer plus vite les nouveaux analystes en contributeurs opérationnels.','scyforge',4),
  ('ops-cyber','Operational Cybersecurity','Cybersécurité opérationnelle','Semantic trees, domain packs, and proof of skill in the SOC.','Arbres sémantiques, Domain Packs et preuve de compétence en SOC.','scyforge',5),
  ('proof-of-skill','Proof of Skill','Preuve de compétence','Measuring readiness without vanity metrics.','Mesurer la readiness sans métriques de vanité.','scyforge',6)
ON CONFLICT (slug) DO NOTHING;

-- #####################################################################
-- 7. STORAGE BUCKET
-- #####################################################################
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES (
  'article-images','article-images',true,5242880,
  '{image/jpeg,image/png,image/webp,image/avif,image/svg+xml,image/gif}')
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY article_images_select_public ON storage.objects FOR SELECT TO public USING (bucket_id='article-images');
CREATE POLICY article_images_insert_auth ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id='article-images' AND EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('owner','administrator','editor','author')));
CREATE POLICY article_images_update_auth ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id='article-images' AND (owner=auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('owner','administrator','editor'))));
CREATE POLICY article_images_delete_auth ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id='article-images' AND (owner=auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role IN ('owner','administrator','editor'))));

-- =====================================================================
-- ✅ FIN — Toutes les migrations appliquées
-- =====================================================================
