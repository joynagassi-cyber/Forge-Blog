-- Forge-Blog initial schema (section 14.3)
-- Source of truth: forge-blog-system-prompt.md

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.editorial_role AS ENUM (
  'owner',
  'administrator',
  'editor',
  'author',
  'contributor',
  'reviewer',
  'analyst',
  'read_only'
);

CREATE TYPE public.article_status AS ENUM (
  'idea',
  'researching',
  'brief_ready',
  'drafting',
  'in_review',
  'changes_requested',
  'approved',
  'scheduled',
  'published',
  'updating',
  'archived'
);

CREATE TYPE public.target_product AS ENUM (
  'nainoforge',
  'scyforge',
  'both',
  'none'
);

CREATE TYPE public.locale_code AS ENUM ('en', 'fr');

CREATE TYPE public.translation_status AS ENUM (
  'missing',
  'draft',
  'in_review',
  'published',
  'outdated'
);

CREATE TYPE public.ai_adapter_type AS ENUM (
  'anthropic',
  'openai',
  'custom'
);

CREATE TYPE public.ai_task_type AS ENUM (
  'brief_generation',
  'draft_generation',
  'seo_aeo_geo_audit'
);

CREATE TYPE public.score_dimension AS ENUM (
  'editorial_quality',
  'factual_confidence',
  'search_intent_alignment',
  'seo_readiness',
  'aeo_readiness',
  'geo_readiness',
  'accessibility',
  'readability',
  'internal_linking',
  'source_quality',
  'freshness',
  'conversion_readiness'
);

-- ---------------------------------------------------------------------------
-- profiles (linked to auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  display_name text,
  bio text,
  expertise_framing text,
  avatar_url text,
  role public.editorial_role NOT NULL DEFAULT 'read_only',
  preferred_locale public.locale_code DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- pillars (drives conversion_block mapping)
-- ---------------------------------------------------------------------------

CREATE TABLE public.pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_fr text NOT NULL,
  description_en text NOT NULL DEFAULT '',
  description_fr text NOT NULL DEFAULT '',
  target_product public.target_product NOT NULL DEFAULT 'none',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_fr text NOT NULL
);

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  locale public.locale_code NOT NULL DEFAULT 'en',
  translation_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  translation_status public.translation_status NOT NULL DEFAULT 'draft',
  working_title text NOT NULL,
  title text,
  dek text,
  excerpt text,
  content jsonb NOT NULL DEFAULT '{"sequence":[]}'::jsonb,
  status public.article_status NOT NULL DEFAULT 'idea',
  pillar_id uuid REFERENCES public.pillars (id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  editor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewer_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  primary_keyword text,
  secondary_keywords text[] DEFAULT '{}',
  search_intent text,
  target_product public.target_product,
  cover_image_url text,
  cover_image_alt text,
  seo_title text,
  meta_description text,
  canonical_url text,
  robots text DEFAULT 'index,follow',
  word_count int DEFAULT 0,
  read_time_minutes int DEFAULT 0,
  published_at timestamptz,
  scheduled_at timestamptz,
  last_updated_at timestamptz,
  next_review_at timestamptz,
  ai_generated boolean NOT NULL DEFAULT false,
  ai_model text,
  ai_provider text,
  brief jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, locale),
  UNIQUE (translation_group_id, locale)
);

CREATE INDEX articles_status_idx ON public.articles (status);
CREATE INDEX articles_pillar_idx ON public.articles (pillar_id);
CREATE INDEX articles_locale_status_idx ON public.articles (locale, status);
CREATE INDEX articles_published_at_idx ON public.articles (published_at DESC NULLS LAST);

CREATE TABLE public.article_tags (
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- revisions
-- ---------------------------------------------------------------------------

CREATE TABLE public.revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  content jsonb NOT NULL,
  title text,
  status public.article_status,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX revisions_article_idx ON public.revisions (article_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- research_sources
-- ---------------------------------------------------------------------------

CREATE TABLE public.research_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  source_type text NOT NULL DEFAULT 'secondary'
    CHECK (source_type IN ('primary', 'secondary', 'expert_commentary', 'unsupported')),
  credibility text DEFAULT 'medium'
    CHECK (credibility IN ('high', 'medium', 'low', 'unknown')),
  citation_date date,
  notes text,
  needs_verification boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ai_providers (server-only; never expose to client)
-- ---------------------------------------------------------------------------

CREATE TABLE public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  adapter_type public.ai_adapter_type NOT NULL,
  endpoint_url text,
  api_key_secret_ref text NOT NULL,
  default_model text NOT NULL,
  assigned_tasks public.ai_task_type[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- article_scores (one row per dimension per audit run)
-- ---------------------------------------------------------------------------

CREATE TABLE public.article_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  dimension public.score_dimension NOT NULL,
  score int NOT NULL CHECK (score >= 0 AND score <= 100),
  reasoning text NOT NULL DEFAULT '',
  top_fixes jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  audit_run_id uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE INDEX article_scores_article_idx ON public.article_scores (article_id, computed_at DESC);

-- ---------------------------------------------------------------------------
-- review comments
-- ---------------------------------------------------------------------------

CREATE TABLE public.review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles (id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  body text NOT NULL,
  block_id text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ai_providers_updated_at
  BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'author'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
