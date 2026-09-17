-- Cover the vocabulary item foreign key for item deletion and review lookups.
CREATE INDEX IF NOT EXISTS vocabulary_review_events_item_id_idx
  ON public.vocabulary_review_events (vocabulary_item_id);
