-- Refresh the five launch articles with stronger long-tail keywords, visual
-- decision aids, current computer-test practice links, and branded WebP covers.

UPDATE public.resources
SET
  title = 'IELTS Writing Task 2 Essay Structure: A Band 7 Blueprint',
  description = 'Use a practical four-paragraph IELTS Writing Task 2 structure with a five-minute plan, PEEL body paragraphs, examples, and a Band 7 revision checklist.',
  meta_description = 'Learn an IELTS Writing Task 2 essay structure for Band 7 with a 5-minute plan, PEEL paragraphs, examples, timing, and a revision checklist.',
  seo_tags = ARRAY[
    'IELTS Writing Task 2 structure',
    'Band 7 essay structure',
    'IELTS essay paragraph structure',
    'PEEL paragraph IELTS',
    'IELTS Writing Task 2 tips',
    'IELTS writing practice'
  ],
  thumbnail_url = '/blog-images/ielts-writing-task-2-structure.webp',
  reading_minutes = 10,
  content = CASE
    WHEN content NOT LIKE '%data-guide-refresh="2026"%' THEN replace(
      content,
      '<h2>Band 7 revision checklist</h2>',
      '<section data-guide-refresh="2026"><h2>The four-paragraph blueprint at a glance</h2>
      <p>Use this as a planning map, not a memorised script. The sentence count is a guide; clarity and development matter more than forcing every essay into identical lengths.</p>
      <table><thead><tr><th>Paragraph</th><th>Main job</th><th>Useful time target</th><th>Self-check</th></tr></thead><tbody>
      <tr><td>Introduction</td><td>Paraphrase the topic and answer the task</td><td>3–4 minutes</td><td>Can a reader identify my position?</td></tr>
      <tr><td>Body 1</td><td>Develop the strongest reason with explanation and evidence</td><td>11–12 minutes</td><td>Did I explain why, not only what?</td></tr>
      <tr><td>Body 2</td><td>Develop a distinct second reason</td><td>11–12 minutes</td><td>Is this genuinely different from body 1?</td></tr>
      <tr><td>Conclusion</td><td>Restate the answer without a new idea</td><td>2–3 minutes</td><td>Does it match my introduction?</td></tr>
      </tbody></table>
      <aside><p><strong>Computer-test note:</strong> practise planning and editing on screen as well as on paper. The <a href="/blog/ielts-computer-test-typing-screen-strategy">7-day typing and screen plan</a> helps you build that control without sacrificing idea quality.</p></aside>
      <h2>Band 7 revision checklist</h2></section>'
    )
    ELSE content
  END,
  updated_at = now()
WHERE content_type = 'blog'
  AND slug = 'ielts-writing-task-2-essay-structure-band-7';

UPDATE public.resources
SET
  title = 'IELTS Speaking Part 2: How to Speak for Two Minutes Naturally',
  description = 'Plan and deliver a natural two-minute IELTS Speaking Part 2 answer with a one-minute cue-card plan, a flexible story arc, and a focused recording routine.',
  meta_description = 'Learn how to speak for two minutes in IELTS Speaking Part 2 using a 1-minute cue-card plan, natural story structure, and fluency practice.',
  seo_tags = ARRAY[
    'IELTS Speaking Part 2',
    'IELTS cue card strategy',
    'speak for two minutes IELTS',
    'IELTS speaking fluency tips',
    'IELTS Part 2 answer structure',
    'IELTS speaking practice'
  ],
  thumbnail_url = '/blog-images/ielts-speaking-part-2.webp',
  reading_minutes = 9,
  content = CASE
    WHEN content NOT LIKE '%data-guide-refresh="2026"%' THEN replace(
      content,
      '<h2>A focused practice routine</h2>',
      '<section data-guide-refresh="2026"><h2>A two-minute answer timeline</h2>
      <table><thead><tr><th>Time</th><th>What to do</th><th>Useful prompt</th></tr></thead><tbody>
      <tr><td>0:00–0:20</td><td>Name the subject and set the scene</td><td>Who, where, and when?</td></tr>
      <tr><td>0:20–0:55</td><td>Add two concrete details</td><td>What could the listener picture?</td></tr>
      <tr><td>0:55–1:30</td><td>Develop an event, change, or small problem</td><td>What happened next?</td></tr>
      <tr><td>1:30–2:00</td><td>Reflect and finish naturally</td><td>Why does it matter now?</td></tr>
      </tbody></table>
      <aside><p><strong>If you freeze:</strong> do not search for advanced vocabulary. Return to the timeline and add one true, specific detail. A clear sentence you can control is more valuable than a memorised phrase you cannot adapt.</p></aside>
      <h2>A focused practice routine</h2></section>'
    )
    ELSE content
  END,
  updated_at = now()
WHERE content_type = 'blog'
  AND slug = 'ielts-speaking-part-2-two-minute-answer';

UPDATE public.resources
SET
  title = 'IELTS Reading True, False, Not Given: The Evidence Method',
  description = 'Stop guessing between False and Not Given with a strict evidence test, a three-way decision table, common traps, and a timed review routine.',
  meta_description = 'Master IELTS Reading True, False, Not Given with a 3-way evidence test, limiting-word traps, examples, timing, and focused practice.',
  seo_tags = ARRAY[
    'IELTS True False Not Given',
    'False vs Not Given IELTS',
    'IELTS Reading evidence method',
    'True False Not Given tips',
    'IELTS Reading question types',
    'IELTS reading practice'
  ],
  thumbnail_url = '/blog-images/ielts-reading-true-false-not-given.webp',
  reading_minutes = 9,
  content = CASE
    WHEN content NOT LIKE '%data-guide-refresh="2026"%' THEN replace(
      content,
      '<h2>Common traps</h2>',
      '<section data-guide-refresh="2026"><h2>The decision table: support, contradiction, or silence?</h2>
      <table><thead><tr><th>What the passage provides</th><th>Decision</th><th>Question to ask</th></tr></thead><tbody>
      <tr><td>The same claim in different words</td><td><strong>True</strong></td><td>Does every essential part match?</td></tr>
      <tr><td>A clear opposite claim</td><td><strong>False</strong></td><td>Can I underline the contradiction?</td></tr>
      <tr><td>No proof for one essential detail</td><td><strong>Not Given</strong></td><td>Am I adding information the writer never supplied?</td></tr>
      </tbody></table>
      <p><strong>Mini example:</strong> if the passage says a museum opened in 1998 and the statement says it was popular immediately, the opening date is confirmed but immediate popularity is not. Unless another sentence discusses popularity, the answer is Not Given.</p>
      <aside><p><strong>Timing guardrail:</strong> mark the evidence line before choosing. If one item is consuming too much time, apply the stop-loss method in the <a href="/blog/ielts-reading-time-management-computer-strategy">60-minute Reading strategy</a> and return after securing easier marks.</p></aside>
      <h2>Common traps</h2></section>'
    )
    ELSE content
  END,
  updated_at = now()
WHERE content_type = 'blog'
  AND slug = 'ielts-reading-true-false-not-given-strategy';

UPDATE public.resources
SET
  title = 'IELTS Listening Map Labelling: Predict, Track, Answer',
  description = 'Master IELTS Listening map and plan labelling with a predict-track-answer method, route-language table, distractor control, and recovery drill.',
  meta_description = 'Improve IELTS Listening map labelling with the predict-track-answer method, route vocabulary, distractor control, recovery, and spelling checks.',
  seo_tags = ARRAY[
    'IELTS Listening map labelling',
    'IELTS map labelling tips',
    'IELTS direction vocabulary',
    'IELTS Listening distractors',
    'IELTS Listening map strategy',
    'IELTS listening practice'
  ],
  thumbnail_url = '/blog-images/ielts-listening-map-labelling.webp',
  reading_minutes = 9,
  content = CASE
    WHEN content NOT LIKE '%data-guide-refresh="2026"%' THEN replace(
      content,
      '<h2>A ten-minute drill</h2>',
      '<section data-guide-refresh="2026"><h2>Route language you should visualise</h2>
      <table><thead><tr><th>Audio phrase</th><th>Action on the map</th><th>Common trap</th></tr></thead><tbody>
      <tr><td>Go past / just beyond</td><td>Move beyond the landmark before stopping</td><td>Choosing the landmark itself</td></tr>
      <tr><td>Opposite / across from</td><td>Look on the other side of a path or room</td><td>Confusing it with next to</td></tr>
      <tr><td>At the end of</td><td>Follow the route to its final point</td><td>Stopping at the first junction</td></tr>
      <tr><td>Originally … but now</td><td>Reject the first location and track the correction</td><td>Writing the distractor</td></tr>
      </tbody></table>
      <aside><p><strong>Screen-practice note:</strong> on a computer-delivered test, rehearse keeping your eyes on the map while selecting answers with minimal cursor travel. Use the <a href="/blog/ielts-computer-test-typing-screen-strategy">7-day computer-test plan</a> to make the interface feel routine.</p></aside>
      <h2>A ten-minute drill</h2></section>'
    )
    ELSE content
  END,
  updated_at = now()
WHERE content_type = 'blog'
  AND slug = 'ielts-listening-map-labelling-strategy';

UPDATE public.resources
SET
  title = '30-Day IELTS Study Plan for Band 7: A Week-by-Week Guide',
  description = 'Follow a realistic 30-day IELTS Band 7 study plan with diagnosis, targeted skill repair, timed practice, progress checks, and a final-week taper.',
  meta_description = 'Follow a 30-day IELTS study plan for Band 7 with weekly goals, a daily schedule, targeted practice, mock tests, review, and progress checks.',
  seo_tags = ARRAY[
    '30 day IELTS study plan',
    'IELTS study plan Band 7',
    'IELTS preparation schedule',
    'one month IELTS study plan',
    'IELTS weekly study plan',
    'IELTS practice plan'
  ],
  thumbnail_url = '/blog-images/ielts-30-day-study-plan.webp',
  reading_minutes = 11,
  content = CASE
    WHEN content NOT LIKE '%data-guide-refresh="2026"%' THEN replace(
      content,
      '<h2>Your daily 75-minute template</h2>',
      '<section data-guide-refresh="2026"><h2>The 30-day roadmap at a glance</h2>
      <table><thead><tr><th>Phase</th><th>Main objective</th><th>Evidence of progress</th></tr></thead><tbody>
      <tr><td>Days 1–7</td><td>Diagnose all four skills and build an error log</td><td>You can name the top two causes of lost marks</td></tr>
      <tr><td>Days 8–14</td><td>Repair the weakest question type or scoring behaviour</td><td>The same error appears less often in matched practice</td></tr>
      <tr><td>Days 15–21</td><td>Combine skills and introduce stricter timing</td><td>You finish partial sections without losing review quality</td></tr>
      <tr><td>Days 22–28</td><td>Complete realistic mocks and targeted corrections</td><td>Your timing and score range become more stable</td></tr>
      <tr><td>Days 29–30</td><td>Taper, review, and prepare test-day logistics</td><td>You feel rested and know your personal checklist</td></tr>
      </tbody></table>
      <aside><p><strong>Keep the plan adaptive:</strong> if one skill already meets your requirement, maintain it while directing more time to the score gap. If you already have a qualifying computer-test result, read the <a href="/blog/ielts-one-skill-retake-2026-rules-decision-guide">One Skill Retake decision guide</a> before assuming you need another full test.</p></aside>
      <h2>Your daily 75-minute template</h2></section>'
    )
    ELSE content
  END,
  updated_at = now()
WHERE content_type = 'blog'
  AND slug = '30-day-ielts-study-plan-band-7';
