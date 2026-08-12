-- Repair citations found by the August 2026 crawl. api/blog.js applies the same
-- substitutions at render time so deployed pages are protected before this
-- migration is applied; this change keeps the persisted source authoritative.
UPDATE public.resources
SET content = replace(
  replace(
    replace(
      replace(
        content,
        'href="https://www.hss.iitb.ac.in/sites/default/files/2023-10/Coherence_Linking_Words%20(RMIT%20University" target="_blank" rel="noopener noreferrer">cohesive device</a>.pdf)',
        'href="https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing" target="_blank" rel="noopener noreferrer">cohesive device</a>.'
      ),
      'https://careerwiseenglish.com.au/ielts-writing-task-2-time-management/',
      'https://www.ieltsai.pro/blog/ielts-writing-task-2-time-management-20-minutes'
    ),
    'https://ielts5to6.com/grammar/ielts-writing-task-2-collocations-list-pdf-friendly/',
    'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing'
  ),
  'https://ieltsimmigration.ir/wp-content/uploads/2020/03/Band-Descriptors-Task-2.pdf',
  'https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing'
)
WHERE content_type = 'blog'
  AND (
    content LIKE '%www.hss.iitb.ac.in/sites/default/files/2023-10/Coherence_Linking_Words%20(RMIT%20University%'
    OR content LIKE '%careerwiseenglish.com.au/ielts-writing-task-2-time-management/%'
    OR content LIKE '%ielts5to6.com/grammar/ielts-writing-task-2-collocations-list-pdf-friendly/%'
    OR content LIKE '%ieltsimmigration.ir/wp-content/uploads/2020/03/Band-Descriptors-Task-2.pdf%'
  );
