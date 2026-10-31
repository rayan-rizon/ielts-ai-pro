-- Replace the retired Cambridge catalogue route with the publisher's current
-- official frontmatter PDF for IELTS 16 Academic (ISBN 978-1-108-93385-8).
UPDATE public.resources
SET content = replace(
  content,
  'https://www.cambridge.org/gb/cambridgeenglish/catalog/cambridge-english-exams-ielts/ielts/ielts-16',
  'https://assets.cambridge.org/97811089/33858/frontmatter/9781108933858_frontmatter.pdf'
)
WHERE content_type = 'blog'
  AND slug = 'cambridge-ielts-16-academic-2021-practice-tests'
  AND content LIKE '%https://www.cambridge.org/gb/cambridgeenglish/catalog/cambridge-english-exams-ielts/ielts/ielts-16%';
