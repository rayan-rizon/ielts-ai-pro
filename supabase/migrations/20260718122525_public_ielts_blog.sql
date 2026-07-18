-- Public IELTS blog metadata, secure publishing policies, and launch content.

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS reading_minutes integer,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_blog_slug_format,
  ADD CONSTRAINT resources_blog_slug_format
    CHECK (
      content_type <> 'blog'
      OR slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  DROP CONSTRAINT IF EXISTS resources_meta_description_length,
  ADD CONSTRAINT resources_meta_description_length
    CHECK (meta_description IS NULL OR char_length(meta_description) <= 180),
  DROP CONSTRAINT IF EXISTS resources_reading_minutes_range,
  ADD CONSTRAINT resources_reading_minutes_range
    CHECK (reading_minutes IS NULL OR reading_minutes BETWEEN 1 AND 60);

CREATE UNIQUE INDEX IF NOT EXISTS resources_blog_slug_unique_idx
  ON public.resources (slug)
  WHERE content_type = 'blog';

CREATE INDEX IF NOT EXISTS resources_published_blog_idx
  ON public.resources (published_at DESC, created_at DESC)
  WHERE content_type = 'blog' AND is_published = true;

-- Explicit Data API grants. RLS below determines which rows are available.
REVOKE ALL ON TABLE public.resources FROM anon, authenticated;
GRANT SELECT ON TABLE public.resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.resources TO authenticated;
GRANT ALL ON TABLE public.resources TO service_role;

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resources_anon_read ON public.resources;
DROP POLICY IF EXISTS resources_select_policy ON public.resources;
DROP POLICY IF EXISTS resources_insert_policy ON public.resources;
DROP POLICY IF EXISTS resources_update_policy ON public.resources;
DROP POLICY IF EXISTS resources_delete_policy ON public.resources;
DROP POLICY IF EXISTS resources_public_read ON public.resources;
DROP POLICY IF EXISTS resources_admin_read ON public.resources;
DROP POLICY IF EXISTS resources_admin_insert ON public.resources;
DROP POLICY IF EXISTS resources_admin_update ON public.resources;
DROP POLICY IF EXISTS resources_admin_delete ON public.resources;

CREATE POLICY resources_public_read
  ON public.resources
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND (published_at IS NULL OR published_at <= now())
  );

CREATE POLICY resources_admin_read
  ON public.resources
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

CREATE POLICY resources_admin_insert
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY resources_admin_update
  ON public.resources
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY resources_admin_delete
  ON public.resources
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

INSERT INTO public.resources (
  title,
  description,
  meta_description,
  url,
  content_type,
  content,
  slug,
  seo_tags,
  category,
  reading_minutes,
  published_at,
  is_published,
  featured,
  access_tier
)
SELECT
  'IELTS Writing Task 2 Essay Structure: A Band 7 Blueprint',
  'A practical paragraph-by-paragraph IELTS Writing Task 2 structure with planning steps, examples, and a final Band 7 checklist.',
  'Learn a clear IELTS Writing Task 2 essay structure for Band 7, including planning, body paragraphs, examples, and a useful revision checklist.',
  'https://www.ieltsai.pro/blog/ielts-writing-task-2-essay-structure-band-7',
  'blog',
  $post$
  <p>Many candidates know enough English to reach Band 7 but lose marks because their essay is difficult to follow. A reliable structure does not mean memorising a rigid template. It means giving every paragraph one clear job, developing your position logically, and leaving enough time to check the language that carries your ideas.</p>
  <h2>What Band 7 structure needs to achieve</h2>
  <p>For a strong Task 2 response, the examiner should be able to identify your position, follow the progression of your ideas, and see how each example supports the paragraph. Structure therefore supports both Task Response and Coherence and Cohesion. It cannot rescue weak ideas, but it prevents good ideas from becoming hidden in a confusing answer.</p>
  <h2>Use four paragraphs for most questions</h2>
  <ol>
    <li><strong>Introduction:</strong> paraphrase the question and state your position or essay direction.</li>
    <li><strong>Body paragraph 1:</strong> present one main idea, explain why it is true, and add a specific example.</li>
    <li><strong>Body paragraph 2:</strong> develop a second distinct idea using the same evidence chain.</li>
    <li><strong>Conclusion:</strong> summarise the position without adding a new argument.</li>
  </ol>
  <p>This structure works for opinion, discussion, advantages/disadvantages, and problem/solution questions. What changes is the purpose of each body paragraph. Read the task words carefully before choosing what each paragraph must prove.</p>
  <h2>Plan before you write</h2>
  <p>Spend about five minutes turning the prompt into a small plan. Underline the topic, the instruction words, and any limits such as “to what extent” or “both views.” Write one sentence for your position. Then choose two ideas you can explain clearly. A familiar, defensible idea is more useful than an impressive idea you cannot develop.</p>
  <blockquote><p>A useful body-paragraph test is: can I explain why this idea matters and give one concrete example? If not, choose a stronger idea.</p></blockquote>
  <h2>Build body paragraphs with PEEL</h2>
  <p>PEEL is a planning tool, not a set of phrases to copy. Start with a <strong>Point</strong> that answers the question. <strong>Explain</strong> the cause, effect, or reasoning. Add an <strong>Example</strong> that makes the claim concrete. Finally, <strong>Link</strong> the discussion back to the question or show its consequence.</p>
  <p>For example, if the topic is remote work, a paragraph might argue that flexible schedules improve productivity. Explain that workers can match demanding tasks to their most focused hours, illustrate this with a software team using asynchronous work, and connect the result to higher-quality output. The example does not need to be a published statistic; it needs to be plausible and relevant.</p>
  <h2>Write a direct introduction</h2>
  <p>A two-sentence introduction is often enough. The first sentence paraphrases the topic accurately. The second gives your answer. Avoid background sentences that are so general they could introduce any essay. Also avoid memorised claims such as “this topic has become controversial in recent years” unless that statement adds meaning.</p>
  <h2>Keep the conclusion controlled</h2>
  <p>Your conclusion should restate the main answer in fresh language and briefly bring the two reasons together. Do not introduce evidence, examples, or a third argument. Two sentences are usually sufficient.</p>
  <h2>Band 7 revision checklist</h2>
  <ul>
    <li>Did I answer every part of the question?</li>
    <li>Is my position clear from introduction to conclusion?</li>
    <li>Does each paragraph have one controlling idea?</li>
    <li>Did I explain ideas instead of listing them?</li>
    <li>Are linking words accurate and varied rather than repeated mechanically?</li>
    <li>Did I check sentence boundaries, verb agreement, articles, and plural forms?</li>
  </ul>
  <h2>Turn the blueprint into practice</h2>
  <p>Choose a prompt and build the four-paragraph plan before writing. Then complete a timed response in the <a href="/writing">IELTS Writing practice area</a>. Use the feedback to identify one structural weakness, revise that paragraph, and compare the versions. If you want a broader starting point, see the <a href="/ielts-writing-checker">IELTS Writing checker guide</a> or calculate the score profile you are targeting with the <a href="/ielts-band-score-calculator">IELTS band score calculator</a>.</p>
  $post$,
  'ielts-writing-task-2-essay-structure-band-7',
  ARRAY['IELTS Writing Task 2', 'Band 7 essay', 'essay structure', 'IELTS writing practice'],
  'Writing',
  8,
  '2026-07-18T08:00:00Z'::timestamptz,
  true,
  true,
  'free'
WHERE NOT EXISTS (
  SELECT 1 FROM public.resources
  WHERE content_type = 'blog' AND slug = 'ielts-writing-task-2-essay-structure-band-7'
);

INSERT INTO public.resources (
  title, description, meta_description, url, content_type, content, slug, seo_tags,
  category, reading_minutes, published_at, is_published, featured, access_tier
)
SELECT
  'IELTS Speaking Part 2: How to Speak for Two Minutes',
  'A simple cue-card planning method to extend IELTS Speaking Part 2 answers naturally without memorising a script.',
  'Learn how to plan and deliver a natural two-minute IELTS Speaking Part 2 answer with a flexible story framework and focused practice routine.',
  'https://www.ieltsai.pro/blog/ielts-speaking-part-2-two-minute-answer',
  'blog',
  $post$
  <p>The hardest part of IELTS Speaking Part 2 is often not vocabulary. It is maintaining a clear answer for up to two minutes while sounding natural. Candidates commonly finish after forty seconds, repeat the cue-card bullets, or memorise a speech that stops fitting when the topic changes. A flexible story structure solves all three problems.</p>
  <h2>What happens in Part 2</h2>
  <p>You receive a topic card, one minute to prepare, and paper for notes. You then speak for one to two minutes. The examiner may ask one short follow-up question before moving to Part 3. Your goal is not to cover every bullet equally. The bullets are prompts; your job is to create a connected response.</p>
  <h2>Use your one-minute preparation well</h2>
  <p>Do not write full sentences. They consume time and tempt you to read. Instead, divide the note space into four moves:</p>
  <ol>
    <li><strong>Set the scene:</strong> who, where, and when.</li>
    <li><strong>Describe:</strong> two or three specific details.</li>
    <li><strong>Develop:</strong> an event, contrast, or small problem.</li>
    <li><strong>Reflect:</strong> why it mattered and how you feel now.</li>
  </ol>
  <p>Add keywords, not grammar. For a card about a useful object, your notes might be “old laptop — first year — slow battery — project deadline — learned independence.” Those five cues are enough to create a personal story with a beginning and an ending.</p>
  <h2>Open with a direct answer</h2>
  <p>Your first sentence should identify the subject confidently: “I’d like to talk about the laptop I bought before starting university.” This buys time because both you and the listener know where the answer is going. Avoid long, memorised introductions such as “This is a very interesting topic that I have many things to say about.”</p>
  <h2>Extend with detail, reason, and reflection</h2>
  <p>When an idea feels too short, add one of three layers. Give a sensory or factual detail. Explain the reason behind an action. Then reflect on its effect. “The laptop was useful” becomes: “It was light enough to carry to the library, which mattered because I travelled by bus. More importantly, it let me finish a group project when the campus computers were unavailable.”</p>
  <blockquote><p>Fluency grows when ideas connect. It does not mean speaking as fast as possible or eliminating every pause.</p></blockquote>
  <h2>Use linking language that sounds spoken</h2>
  <p>Natural transitions include “what I remember most is…”, “the reason this mattered was…”, “at first… but later…”, and “looking back…”. Use them only when they match the idea. Repeating “moreover” and “furthermore” can make a personal story sound like an essay.</p>
  <h2>If you run out of ideas</h2>
  <p>Move along a timeline: before, during, and after. Compare expectations with reality. Explain how another person reacted. Describe what you would change now. These moves work across people, places, events, skills, and objects without forcing a memorised answer.</p>
  <h2>A focused practice routine</h2>
  <ol>
    <li>Choose one cue card and prepare for exactly sixty seconds.</li>
    <li>Record one answer without restarting.</li>
    <li>Listen once for organisation and once for repeated language.</li>
    <li>Replace only two weak phrases, then record the same topic again.</li>
    <li>Practise a new card using the same story structure.</li>
  </ol>
  <p>Try this routine in the <a href="/speaking">IELTS Speaking practice area</a>, where you can keep attempts connected to your preparation history. The <a href="/ielts-speaking-practice-ai">AI speaking practice guide</a> explains how feedback can support daily work. Remember that practice estimates are not official IELTS results; use them to choose what to improve next.</p>
  $post$,
  'ielts-speaking-part-2-two-minute-answer',
  ARRAY['IELTS Speaking Part 2', 'cue card', 'IELTS speaking tips', 'two minute answer'],
  'Speaking',
  7,
  '2026-07-17T08:00:00Z'::timestamptz,
  true,
  false,
  'free'
WHERE NOT EXISTS (
  SELECT 1 FROM public.resources
  WHERE content_type = 'blog' AND slug = 'ielts-speaking-part-2-two-minute-answer'
);

INSERT INTO public.resources (
  title, description, meta_description, url, content_type, content, slug, seo_tags,
  category, reading_minutes, published_at, is_published, featured, access_tier
)
SELECT
  'IELTS Reading True, False, Not Given: The Evidence Method',
  'Stop guessing between False and Not Given with a step-by-step evidence method for IELTS Reading questions.',
  'Master IELTS Reading True, False, Not Given questions with a precise evidence method, common traps, and a timed practice routine.',
  'https://www.ieltsai.pro/blog/ielts-reading-true-false-not-given-strategy',
  'blog',
  $post$
  <p>True, False, Not Given questions test whether a statement matches the passage—not whether it sounds reasonable or whether you already know the topic. The fastest way to improve is to replace intuition with a strict evidence decision.</p>
  <h2>Know the three decisions</h2>
  <ul>
    <li><strong>True:</strong> the passage expresses the same meaning as the statement.</li>
    <li><strong>False:</strong> the passage clearly contradicts the statement.</li>
    <li><strong>Not Given:</strong> the passage does not provide enough information to prove or disprove the statement.</li>
  </ul>
  <p>False requires contrary evidence. If the passage simply stays silent about one important part of the statement, the answer is Not Given.</p>
  <h2>Step 1: reduce the statement</h2>
  <p>Underline the subject, the main claim, and limiting words such as <em>all</em>, <em>only</em>, <em>always</em>, <em>mainly</em>, <em>first</em>, or <em>more than</em>. These small words often control the answer. “Some researchers supported the plan” is not equivalent to “all researchers supported the plan.”</p>
  <h2>Step 2: predict paraphrases</h2>
  <p>The passage rarely repeats the statement word for word. Before scanning, think of likely equivalents. “A decline in attendance” might appear as “fewer people visited.” “Was prohibited” might appear as “was no longer permitted.” This keeps you searching for meaning rather than identical vocabulary.</p>
  <h2>Step 3: find the evidence zone</h2>
  <p>These questions usually follow passage order. Use names, dates, technical terms, or unusual nouns to locate the relevant sentence, then read one sentence before and after it. The answer may depend on a pronoun, contrast, or qualification outside the sentence containing your keyword.</p>
  <h2>Step 4: run the evidence test</h2>
  <p>Ask three questions in order:</p>
  <ol>
    <li>Does the passage support every essential part of the statement? Choose True.</li>
    <li>Does the passage state the opposite of an essential part? Choose False.</li>
    <li>Is an essential part missing or impossible to verify? Choose Not Given.</li>
  </ol>
  <blockquote><p>Do not turn “the passage does not say this” into False. Missing evidence is exactly what Not Given means.</p></blockquote>
  <h2>Common traps</h2>
  <p><strong>Reversed comparisons:</strong> the passage says A is larger than B, while the statement says B is larger than A. That is False. <strong>Extra details:</strong> the passage confirms an event but never confirms its cause; a statement that adds the cause is Not Given. <strong>Partial matches:</strong> most words match but one limit changes the meaning. <strong>Outside knowledge:</strong> a fact may be scientifically true but still Not Given if the passage does not provide it.</p>
  <h2>Use a two-pass timing strategy</h2>
  <p>On the first pass, answer items with direct evidence and mark uncertain ones. On the second, compare only the exact statement with the evidence zone. Do not reread the entire passage for every question. If you still cannot identify either support or contradiction, Not Given may be appropriate—but make that choice from the evidence, not frustration.</p>
  <h2>Practise the decision, not just the score</h2>
  <p>After a timed set, record why each error occurred: missed paraphrase, ignored limiting word, confused contradiction with missing information, or searched the wrong paragraph. Start an <a href="/reading">IELTS Reading practice test</a> and use the answer review to find the pattern. You can also explore the <a href="/free-ielts-practice-tests">free IELTS practice test guide</a> before attempting a longer mock test.</p>
  $post$,
  'ielts-reading-true-false-not-given-strategy',
  ARRAY['IELTS Reading', 'True False Not Given', 'IELTS reading strategy', 'reading practice'],
  'Reading',
  7,
  '2026-07-16T08:00:00Z'::timestamptz,
  true,
  false,
  'free'
WHERE NOT EXISTS (
  SELECT 1 FROM public.resources
  WHERE content_type = 'blog' AND slug = 'ielts-reading-true-false-not-given-strategy'
);

INSERT INTO public.resources (
  title, description, meta_description, url, content_type, content, slug, seo_tags,
  category, reading_minutes, published_at, is_published, featured, access_tier
)
SELECT
  'IELTS Listening Map Labelling: Predict, Track, Answer',
  'A practical method for IELTS Listening map and plan labelling, from prediction to direction tracking and spelling checks.',
  'Improve IELTS Listening map labelling with a predict-track-answer method, direction vocabulary, distractor control, and spelling checks.',
  'https://www.ieltsai.pro/blog/ielts-listening-map-labelling-strategy',
  'blog',
  $post$
  <p>Map and plan labelling questions can feel overwhelming because you must listen, follow a route, interpret spatial language, and write an answer at the same time. The task becomes manageable when you separate it into three actions: predict before the audio, track the speaker’s position, and answer only when the location is confirmed.</p>
  <h2>Read the visual before the recording starts</h2>
  <p>Use the preparation time to find the title, entrance, compass, numbered gaps, fixed labels, and any obvious route. Decide whether you are looking at an outdoor map, a building plan, or a site layout. Fixed labels are anchors: they help you recover if you temporarily lose the route.</p>
  <h2>Predict the type of answer</h2>
  <p>Look at the answer instructions and the space around each gap. Is the missing item likely to be a room, facility, natural feature, or service? If there is a list of options, scan the nouns and notice similar choices. Prediction reduces the number of possible answers you must evaluate while listening.</p>
  <h2>Know the language of movement and position</h2>
  <p>Common route phrases include <em>go past</em>, <em>continue straight</em>, <em>turn left</em>, <em>at the end of</em>, and <em>take the second path</em>. Position phrases include <em>opposite</em>, <em>next to</em>, <em>between</em>, <em>in the corner</em>, <em>just beyond</em>, and <em>on your right</em>. Learn these as relationships on a page, not isolated vocabulary.</p>
  <h2>Keep your finger or cursor on the route</h2>
  <p>Start at the entrance or location the speaker names. Move through the map with every direction phrase, even when no answer is required. If you stop tracking after one answer, the next number can arrive while you are still searching the wrong area.</p>
  <blockquote><p>The most important skill is knowing where the speaker is now. An answer option is useful only after its location is confirmed.</p></blockquote>
  <h2>Expect corrections and distractors</h2>
  <p>The speaker may mention a familiar landmark before the answer or correct an earlier plan: “We originally considered the room beside reception, but the workshop will now be opposite the café.” The first location is a distractor. Listen for contrast markers such as <em>but</em>, <em>however</em>, <em>instead</em>, and <em>rather than</em>.</p>
  <h2>Recover without chasing missed audio</h2>
  <p>If you lose one answer, do not mentally replay it while the recording continues. Move to the next numbered gap and use a fixed label to relocate. One missed item is cheaper than losing three because your attention stayed in the past.</p>
  <h2>Check the answer form</h2>
  <p>At the end, verify the word limit, spelling, and whether you copied the exact option letter or word required. Singular and plural forms can matter. If the task uses a choice list, make sure you have transferred the label requested by the instructions rather than a descriptive word from the map.</p>
  <h2>A ten-minute drill</h2>
  <ol>
    <li>Study a blank map for thirty seconds and describe the route aloud.</li>
    <li>List five direction phrases you expect to hear.</li>
    <li>Complete the section once under test conditions.</li>
    <li>Replay while tracing the route, pausing after every direction phrase.</li>
    <li>Write down the exact phrase that caused each mistake.</li>
  </ol>
  <p>Use the <a href="/listening">IELTS Listening practice area</a> to apply the drill to timed materials, then review answer-level performance before starting another set. For a broader test workflow, open the <a href="/ielts-mock-test-online">IELTS mock test guide</a>.</p>
  $post$,
  'ielts-listening-map-labelling-strategy',
  ARRAY['IELTS Listening', 'map labelling', 'IELTS listening tips', 'listening practice'],
  'Listening',
  7,
  '2026-07-15T08:00:00Z'::timestamptz,
  true,
  false,
  'free'
WHERE NOT EXISTS (
  SELECT 1 FROM public.resources
  WHERE content_type = 'blog' AND slug = 'ielts-listening-map-labelling-strategy'
);

INSERT INTO public.resources (
  title, description, meta_description, url, content_type, content, slug, seo_tags,
  category, reading_minutes, published_at, is_published, featured, access_tier
)
SELECT
  'A 30-Day IELTS Study Plan for a Band 7 Goal',
  'A realistic four-week IELTS study plan that starts with diagnosis, targets weak skills, and finishes with timed rehearsal.',
  'Follow a practical 30-day IELTS study plan for a Band 7 goal with diagnostic tests, targeted practice, feedback, and timed mock-test weeks.',
  'https://www.ieltsai.pro/blog/30-day-ielts-study-plan-band-7',
  'blog',
  $post$
  <p>A useful 30-day IELTS plan is not a calendar filled with random tests. It is a feedback loop: diagnose your current level, practise the skill causing the largest score loss, review evidence from each attempt, and retest under time pressure. The plan below assumes about 60 to 90 focused minutes on weekdays and a longer weekend session. Adjust the volume to your schedule, but keep the sequence.</p>
  <h2>Before day 1: define the target</h2>
  <p>Write down the overall band and any minimum skill requirements for your university, employer, or visa route. A candidate who needs 7.0 overall with no skill below 6.5 has a different strategy from someone who needs 7.0 in Writing. Use the <a href="/ielts-band-score-calculator">IELTS band score calculator</a> to see how skill bands combine, then confirm current official requirements with the relevant institution.</p>
  <h2>Week 1: diagnose and organise</h2>
  <p>Complete one timed Reading test and one timed Listening test. Do not immediately repeat them. Review every wrong or guessed answer and label the cause: vocabulary, paraphrase, question type, attention, spelling, or timing. Record a Speaking Part 2 answer and complete one Writing Task 2 essay to establish a baseline.</p>
  <p>By the end of the week, choose one primary weakness and one secondary weakness. Your primary weakness receives about half of the next two weeks; strong skills need maintenance, not equal time.</p>
  <h3>Suggested week 1 rhythm</h3>
  <ul>
    <li>Day 1: goal setting and Reading diagnostic</li>
    <li>Day 2: Reading review and error log</li>
    <li>Day 3: Listening diagnostic</li>
    <li>Day 4: Listening review and vocabulary</li>
    <li>Day 5: Writing baseline</li>
    <li>Day 6: Speaking baseline and review</li>
    <li>Day 7: choose priorities and plan week 2</li>
  </ul>
  <h2>Week 2: repair the weakest skill</h2>
  <p>Break the weak skill into smaller behaviours. For Reading, this might be True/False/Not Given decisions or matching headings. For Listening, it might be map tracking or Section 4 note completion. For Writing, focus on planning, paragraph development, or one recurring grammar problem. For Speaking, work on extending answers and using specific detail.</p>
  <p>Use short, deliberate sets. A twenty-minute exercise followed by twenty minutes of review is often more valuable than a full test with no analysis. Keep one error log with the question, your answer, the evidence, the reason for the error, and the action you will take next time.</p>
  <h2>Week 3: connect skills and increase timing pressure</h2>
  <p>Now combine focused practice with partial timed sections. Complete two Reading passages back to back, or Listening Sections 3 and 4 without pausing. Write Task 1 and Task 2 within the sixty-minute limit. Record a full Speaking simulation with minimal restart.</p>
  <blockquote><p>Do not measure progress only by hours studied. Measure whether the same error appears less often under similar conditions.</p></blockquote>
  <p>Use the app’s <a href="/analytics">analytics</a> and saved results to look for patterns across attempts. Treat any AI-assisted band or feedback as preparation guidance, not an official result. The useful question is whether the feedback identifies a repeatable behaviour you can practise.</p>
  <h2>Week 4: rehearse and stabilise</h2>
  <p>Complete at least two realistic mock sessions on different days. Match the test timing, remove distractions, and avoid pausing. Review the first mock deeply before taking the second. Between mocks, target only the two or three issues most likely to change your result.</p>
  <p>In the final two days, reduce volume. Review strategy notes, common spelling errors, essay plans, and speaking cues. Prepare identification, travel, sleep, and the current instructions from your official test provider. Last-minute exhaustion is not a study strategy.</p>
  <h2>Your daily 75-minute template</h2>
  <ol>
    <li><strong>10 minutes:</strong> vocabulary or error-log review.</li>
    <li><strong>30 minutes:</strong> one focused skill activity.</li>
    <li><strong>25 minutes:</strong> evidence-based review and correction.</li>
    <li><strong>10 minutes:</strong> repeat one difficult item or plan tomorrow’s task.</li>
  </ol>
  <h2>Start the plan inside IELTS Ai Pro</h2>
  <p>Create your account to save practice history, then choose a starting diagnostic from <a href="/reading">Reading</a>, <a href="/listening">Listening</a>, <a href="/writing">Writing</a>, or <a href="/speaking">Speaking</a>. If you are not sure where to begin, use the <a href="/free-ielts-practice-tests">free IELTS practice tests guide</a> and complete one timed receptive-skill test first.</p>
  $post$,
  '30-day-ielts-study-plan-band-7',
  ARRAY['IELTS study plan', 'Band 7', '30 day IELTS plan', 'IELTS preparation'],
  'Study Planning',
  9,
  '2026-07-14T08:00:00Z'::timestamptz,
  true,
  false,
  'free'
WHERE NOT EXISTS (
  SELECT 1 FROM public.resources
  WHERE content_type = 'blog' AND slug = '30-day-ielts-study-plan-band-7'
);
