-- The consolidated baseline describes this table, but it was absent from the
-- production schema. Learning Path reads it as part of its evidence snapshot,
-- so the missing relation made every manual refresh fail before a plan could be
-- regenerated. Restore the append-only review evidence and its ownership rules.
CREATE TABLE IF NOT EXISTS public.vocabulary_review_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vocabulary_item_id uuid NOT NULL REFERENCES public.vocabulary_items(id) ON DELETE CASCADE,
  quality smallint NOT NULL CHECK (quality BETWEEN 0 AND 5),
  reviewed_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vocabulary_review_events_user_reviewed_at_idx
  ON public.vocabulary_review_events (user_id, reviewed_at DESC);

ALTER TABLE public.vocabulary_review_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their vocabulary review events"
  ON public.vocabulary_review_events;
CREATE POLICY "Users can read their vocabulary review events"
  ON public.vocabulary_review_events
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT public.get_my_public_user_id()));

DROP POLICY IF EXISTS "Users can add their vocabulary review events"
  ON public.vocabulary_review_events;
CREATE POLICY "Users can add their vocabulary review events"
  ON public.vocabulary_review_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT public.get_my_public_user_id()));

REVOKE ALL ON TABLE public.vocabulary_review_events FROM PUBLIC, anon;
GRANT SELECT, INSERT ON TABLE public.vocabulary_review_events TO authenticated;
GRANT ALL ON TABLE public.vocabulary_review_events TO service_role;

COMMENT ON TABLE public.vocabulary_review_events IS
  'Append-only learner vocabulary review outcomes used for retention and adaptive Learning Path evidence.';
