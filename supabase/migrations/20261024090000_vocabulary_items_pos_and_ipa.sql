-- Keep the part of speech and pronunciation the dictionary lookup already returns.
-- Both were fetched when a word was saved and then thrown away, so the list showed
-- a regex guess for the part of speech and no IPA at all. Nullable: words saved
-- before this migration keep working and simply have neither.
alter table public.vocabulary_items
  add column if not exists part_of_speech text,
  add column if not exists ipa text;
