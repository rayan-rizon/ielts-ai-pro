-- Align the six imported drafts with the exact primary keyword phrases supplied in the content brief.
UPDATE public.resources
SET seo_tags = CASE slug
  WHEN 'ielts-self-study-schedule-a-flexible-8-week-plan' THEN ARRAY[
    'ielts self study schedule',
    '8-week IELTS study plan',
    'IELTS preparation timetable',
    'IELTS band score improvement'
  ]
  WHEN 'ielts-writing-band-score-how-your-essay-is-really-marked' THEN ARRAY[
    'ielts writing band score',
    'IELTS Writing Task 1 and Task 2 scoring',
    'IELTS band descriptors',
    'improve IELTS writing'
  ]
  WHEN 'ielts-writing-task-2-tips-that-actually-raise-your-score' THEN ARRAY[
    'ielts writing task 2 tips',
    'IELTS essay structure',
    'Band 7 IELTS writing',
    'IELTS writing time management'
  ]
  WHEN 'improve-your-ielts-writing-band-8-week-plan-to-band-7' THEN ARRAY[
    'improve ielts writing band',
    'Band 6 to 7 IELTS plan',
    'IELTS Writing feedback',
    'IELTS writing practice'
  ]
  WHEN 'is-ai-feedback-good-enough-for-ielts-writing-practice' THEN ARRAY[
    'is ai feedback good enough for ielts writing practice',
    'IELTS Writing AI scoring',
    'IELTS band descriptors',
    'human vs AI IELTS feedback'
  ]
  WHEN 'the-best-free-ielts-apps-in-2026-what-actually-works' THEN ARRAY[
    'what is the best free app to prepare for ielts',
    'free IELTS practice app',
    'IELTS Writing and Speaking feedback',
    'IELTS study app 2026'
  ]
END
WHERE content_type = 'blog'
  AND slug IN (
    'ielts-self-study-schedule-a-flexible-8-week-plan',
    'ielts-writing-band-score-how-your-essay-is-really-marked',
    'ielts-writing-task-2-tips-that-actually-raise-your-score',
    'improve-your-ielts-writing-band-8-week-plan-to-band-7',
    'is-ai-feedback-good-enough-for-ielts-writing-practice',
    'the-best-free-ielts-apps-in-2026-what-actually-works'
  );
