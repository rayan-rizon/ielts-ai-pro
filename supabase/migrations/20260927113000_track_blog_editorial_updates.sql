-- View counts are updated through increment_resource_view. The generic
-- resources.updated_at trigger therefore cannot represent article edits.
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS content_updated_at timestamptz;

COMMENT ON COLUMN public.resources.content_updated_at IS
  'Last substantive blog content or presentation edit; excludes view-count updates.';

CREATE OR REPLACE FUNCTION public.stamp_resource_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.content_type = 'blog' AND (
    NEW.title IS DISTINCT FROM OLD.title OR
    NEW.description IS DISTINCT FROM OLD.description OR
    NEW.meta_description IS DISTINCT FROM OLD.meta_description OR
    NEW.content IS DISTINCT FROM OLD.content OR
    NEW.seo_tags IS DISTINCT FROM OLD.seo_tags OR
    NEW.category IS DISTINCT FROM OLD.category OR
    NEW.thumbnail_url IS DISTINCT FROM OLD.thumbnail_url OR
    NEW.reading_minutes IS DISTINCT FROM OLD.reading_minutes OR
    NEW.featured IS DISTINCT FROM OLD.featured OR
    NEW.slug IS DISTINCT FROM OLD.slug
  ) THEN
    NEW.content_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS resources_content_updated_at_trigger ON public.resources;
CREATE TRIGGER resources_content_updated_at_trigger
BEFORE UPDATE ON public.resources
FOR EACH ROW EXECUTE FUNCTION public.stamp_resource_content_updated_at();
