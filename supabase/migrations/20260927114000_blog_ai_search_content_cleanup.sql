-- Preserve the 2026-09-23 article's existing canonical URL while restoring
-- its publication order in the blog index and RSS feed.
UPDATE public.resources
SET published_at = created_at
WHERE content_type = 'blog'
  AND is_published = true
  AND slug = 'compare-ai-platforms-for-ielts-writing-feedback-in-2026'
  AND published_at IS NULL;

-- Place each source next to the relevant format/product claim. Exact insertion
-- checks make this safe to replay after the live editorial corrections.
WITH references_to_add(slug, insertion) AS (
  VALUES
    ('30-day-ielts-study-plan-band-7', '<p><strong>Official preparation material:</strong> IELTS provides <a href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions">sample questions and answers</a> you can use for the baseline and retests in this plan. The 30-day schedule itself is our suggested practice routine.</p>'),
    ('cambridge-ielts-21-academic-2026-practice-tests', '<p><strong>Book source:</strong> Cambridge University Press &amp; Assessment identifies <a href="https://assets.cambridge.org/97810098/26723/frontmatter/9781009826723_frontmatter.pdf">IELTS 21 Academic as a 2026 publication</a>. The practice links below open IELTS Ai Pro activities.</p>'),
    ('ielts-listening-map-labelling-strategy', '<p><strong>Official task guidance:</strong> IELTS explains <a href="https://ielts.org/news-and-insights/10-tips-for-answering-map-or-plan-questions-in-ielts-listening">how map and plan labelling questions work</a>. The predict–track–answer routine below is our practice method.</p>'),
    ('ielts-reading-true-false-not-given-strategy', '<p><strong>Official task definition:</strong> The <a href="https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading">IELTS Academic Reading format</a> defines True, False and Not Given. The evidence method below is practice advice.</p>'),
    ('ielts-speaking-part-2-two-minute-answer', '<p><strong>Official format:</strong> IELTS gives candidates <a href="https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking">one minute to prepare before the Part 2 long turn</a> and stops the talk at two minutes. The story structure below is a practice option.</p>'),
    ('ielts-writing-task-2-essay-structure-band-7', '<p><strong>Official scoring criteria:</strong> The <a href="https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf">IELTS Writing band descriptors</a> assess Task Response and Coherence and Cohesion. The four-paragraph outline below is practice advice, not a required template.</p>')
)
UPDATE public.resources AS r
SET content = left(r.content, strpos(r.content, '</p>') + 3)
  || references_to_add.insertion
  || substr(r.content, strpos(r.content, '</p>') + 4)
FROM references_to_add
WHERE r.slug = references_to_add.slug
  AND r.content_type = 'blog'
  AND r.is_published = true
  AND strpos(r.content, '</p>') > 0
  AND strpos(r.content, references_to_add.insertion) = 0;

-- The publisher appears as a recommended option in these comparisons.
WITH disclosure AS (
  SELECT '<p><strong>Publisher disclosure:</strong> This article is published by IELTS Ai Pro, a product discussed below. This is not an independent third-party review. Product features and prices can change; confirm them with each provider before choosing.</p>'::text AS insertion
)
UPDATE public.resources AS r
SET content = left(r.content, strpos(r.content, '</p>') + 3)
  || disclosure.insertion
  || substr(r.content, strpos(r.content, '</p>') + 4)
FROM disclosure
WHERE r.content_type = 'blog'
  AND r.is_published = true
  AND r.slug IN (
    'ai-ielts-feedback-vs-human-tutors-which-to-trust',
    'ai-ielts-preparation-tools-that-raise-your-band-score',
    'best-free-cambridge-style-ielts-mock-tests-in-2026',
    'best-free-ielts-practice-tests-online-2026-picks',
    'best-online-ielts-prep-platforms-in-australia-2026',
    'best-online-platforms-for-ielts-speaking-practice-in-2026',
    'compare-ai-platforms-for-ielts-writing-feedback-in-2026',
    'the-best-free-ielts-apps-in-2026-what-actually-works'
  )
  AND strpos(r.content, '</p>') > 0
  AND strpos(r.content, disclosure.insertion) = 0;
