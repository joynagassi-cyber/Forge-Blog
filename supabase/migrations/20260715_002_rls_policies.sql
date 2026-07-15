-- Forge-Blog RLS policies (section 14.5)

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

-- Helper: current user's editorial role
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.editorial_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'read_only'::public.editorial_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_role() IN (
    'owner', 'administrator', 'editor', 'author', 'contributor', 'reviewer', 'analyst'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editor_plus()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_role() IN ('owner', 'administrator', 'editor');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_role() IN ('owner', 'administrator');
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY profiles_update_self_or_admin
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- pillars / tags — public read, admin write
-- ---------------------------------------------------------------------------

CREATE POLICY pillars_public_read
  ON public.pillars FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY pillars_admin_write
  ON public.pillars FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY tags_public_read
  ON public.tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY tags_admin_write
  ON public.tags FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- articles
-- published: readable by anon + authenticated
-- non-published: Owner, Administrator, Editor, assigned Author/Reviewer
-- ---------------------------------------------------------------------------

CREATE POLICY articles_public_published
  ON public.articles FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY articles_staff_read
  ON public.articles FOR SELECT
  TO authenticated
  USING (
    public.is_editor_plus()
    OR author_id = auth.uid()
    OR reviewer_id = auth.uid()
    OR editor_id = auth.uid()
    OR public.current_role() IN ('analyst', 'read_only')
  );

CREATE POLICY articles_insert
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_editor_plus()
    OR public.current_role() IN ('author', 'contributor')
  );

CREATE POLICY articles_update
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    public.is_editor_plus()
    OR (
      public.current_role() = 'author'
      AND author_id = auth.uid()
    )
    OR (
      public.current_role() = 'reviewer'
      AND reviewer_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_editor_plus()
    OR (
      public.current_role() = 'author'
      AND author_id = auth.uid()
    )
    OR (
      public.current_role() = 'contributor'
      AND author_id = auth.uid()
      AND status IN ('idea', 'researching', 'brief_ready', 'drafting', 'in_review')
    )
    OR (
      public.current_role() = 'reviewer'
      AND reviewer_id = auth.uid()
    )
  );

CREATE POLICY articles_delete_admin
  ON public.articles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- article_tags
-- ---------------------------------------------------------------------------

CREATE POLICY article_tags_read
  ON public.article_tags FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_id
        AND (
          a.status = 'published'
          OR auth.uid() IS NOT NULL
        )
    )
  );

CREATE POLICY article_tags_write
  ON public.article_tags FOR ALL
  TO authenticated
  USING (public.is_editor_plus() OR public.current_role() IN ('author', 'contributor'))
  WITH CHECK (public.is_editor_plus() OR public.current_role() IN ('author', 'contributor'));

-- ---------------------------------------------------------------------------
-- revisions
-- ---------------------------------------------------------------------------

CREATE POLICY revisions_staff_read
  ON public.revisions FOR SELECT
  TO authenticated
  USING (
    public.is_editor_plus()
    OR EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_id
        AND (a.author_id = auth.uid() OR a.reviewer_id = auth.uid())
    )
  );

CREATE POLICY revisions_staff_insert
  ON public.revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_editor_plus()
    OR public.current_role() IN ('author', 'contributor', 'reviewer')
  );

-- ---------------------------------------------------------------------------
-- research_sources
-- ---------------------------------------------------------------------------

CREATE POLICY research_sources_staff
  ON public.research_sources FOR ALL
  TO authenticated
  USING (
    public.is_editor_plus()
    OR EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_id AND a.author_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_editor_plus()
    OR EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_id AND a.author_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- ai_providers: Owner/Administrator only; never client-exposed for secrets
-- ---------------------------------------------------------------------------

CREATE POLICY ai_providers_admin_only
  ON public.ai_providers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- article_scores
-- ---------------------------------------------------------------------------

CREATE POLICY article_scores_staff_read
  ON public.article_scores FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY article_scores_staff_write
  ON public.article_scores FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editor_plus() OR public.current_role() IN ('author', 'reviewer'));

-- ---------------------------------------------------------------------------
-- review_comments
-- ---------------------------------------------------------------------------

CREATE POLICY review_comments_staff
  ON public.review_comments FOR ALL
  TO authenticated
  USING (
    public.is_editor_plus()
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.articles a
      WHERE a.id = article_id
        AND (a.author_id = auth.uid() OR a.reviewer_id = auth.uid())
    )
  )
  WITH CHECK (
    public.is_editor_plus()
    OR public.current_role() IN ('author', 'reviewer', 'contributor')
  );
