-- Forge-Blog additional schema: auto-revision history (section 3.4 / 14.3)
-- Every content or status change to articles creates a revisions row.

CREATE OR REPLACE FUNCTION public.record_article_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.revisions (
    article_id,
    content,
    title,
    status,
    changed_by,
    change_summary
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.content, OLD.content),
    COALESCE(NEW.title, OLD.title),
    COALESCE(NEW.status, OLD.status),
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Created'
      WHEN TG_OP = 'UPDATE' THEN 'Updated'
      ELSE TG_OP
    END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS articles_revision_trigger ON public.articles;

CREATE TRIGGER articles_revision_trigger
  AFTER INSERT OR UPDATE OF content, title, status ON public.articles
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.record_article_revision();
