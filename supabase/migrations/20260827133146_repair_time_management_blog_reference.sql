-- The prior citation repair redirected an unavailable external source to a
-- non-existent internal article. Keep the rendered fallback and persisted
-- source aligned with the official IELTS writing-format reference.
UPDATE public.resources
SET content = replace(
  content,
  'https://www.ieltsai.pro/blog/ielts-writing-task-2-time-management-20-minutes',
  'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing'
)
WHERE content_type = 'blog'
  AND content LIKE '%https://www.ieltsai.pro/blog/ielts-writing-task-2-time-management-20-minutes%';
