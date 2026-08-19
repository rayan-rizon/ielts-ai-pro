-- Keep each imported draft's meta description within the site's 140-160 character SEO target.
UPDATE public.resources
SET meta_description = CASE slug
  WHEN 'ielts-self-study-schedule-a-flexible-8-week-plan' THEN 'Build an IELTS self-study schedule with an 8-week plan, realistic weekly hours, milestone checks, and feedback-driven practice across all four skills.'
  WHEN 'ielts-writing-band-score-how-your-essay-is-really-marked' THEN 'Learn how the IELTS writing band score is calculated for Task 1 and Task 2, with practical ways to use the four official criteria to improve.'
  WHEN 'ielts-writing-task-2-tips-that-actually-raise-your-score' THEN 'Use practical IELTS Writing Task 2 tips for question types, Band 7 structure, time management, vocabulary, grammar, and feedback-driven practice.'
  WHEN 'improve-your-ielts-writing-band-8-week-plan-to-band-7' THEN 'Improve your IELTS Writing band from 6 to 7 with an 8-week plan for diagnosis, targeted drills, feedback, score tracking, and timed essay practice.'
  WHEN 'is-ai-feedback-good-enough-for-ielts-writing-practice' THEN 'Is AI feedback good enough for IELTS writing practice? Compare research, criterion-level limits, and a practical AI-plus-human routine for safer band gains.'
  WHEN 'the-best-free-ielts-apps-in-2026-what-actually-works' THEN 'Compare the best free IELTS apps in 2026 for mock tests, Writing and Speaking feedback, progress tracking, and a practical two-app study plan.'
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
