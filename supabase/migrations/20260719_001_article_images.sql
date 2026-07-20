-- Forge-Blog article images storage bucket + RLS (section 11 / 14.5)
-- Creates a dedicated bucket for article cover images and inline images.

-- ---------------------------------------------------------------------------
-- 1. Create the storage bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,                       -- public: images are served to anonymous visitors
  5242880,                    -- 5 MB limit per file
  '{image/jpeg,image/png,image/webp,image/avif,image/svg+xml,image/gif}'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. RLS: public SELECT (anyone can view images)
-- ---------------------------------------------------------------------------
CREATE POLICY "article_images_select_public"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'article-images');

-- ---------------------------------------------------------------------------
-- 3. RLS: authenticated INSERT (admin, editor, author can upload)
-- ---------------------------------------------------------------------------
CREATE POLICY "article_images_insert_auth"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'article-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'administrator', 'editor', 'author')
    )
  );

-- ---------------------------------------------------------------------------
-- 4. RLS: authenticated UPDATE (owner can update own uploads; editors+ any)
-- ---------------------------------------------------------------------------
CREATE POLICY "article_images_update_auth"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'article-images'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('owner', 'administrator', 'editor')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 5. RLS: authenticated DELETE (owner can delete own uploads; editors+ any)
-- ---------------------------------------------------------------------------
CREATE POLICY "article_images_delete_auth"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'article-images'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('owner', 'administrator', 'editor')
      )
    )
  );
