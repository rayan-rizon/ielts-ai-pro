-- Humanise the three 19 July guides without changing their public status or URLs.
-- Each update is guarded by its original copy so re-running this migration is a no-op.

UPDATE public.resources
SET
  content = replace(
    replace(
      replace(
        content,
        $old_intro$<p>Moving from IELTS Listening Band 5.5 or 6 to Band 7 is rarely about finding one secret technique. The more useful question is: <strong>which answers are you losing, and why?</strong> A recent learner with one month left before a university deadline asked how to close exactly this score gap. Other candidates described strong everyday English but inconsistent Listening results under test pressure.</p>$old_intro$,
        $new_intro$<p>If you keep landing at IELTS Listening Band 5.5 or 6, the frustrating part is often this: you can recognise the answer as soon as the recording has moved on. In the test, that moment has already cost you a mark. The useful question is not “Which trick am I missing?” but <strong>“Which kind of mistake keeps taking marks from me?”</strong></p>$new_intro$
      ),
      $old_plan$<p>The plan below replaces random practice with a four-week feedback loop. You will classify each error, drill the cause, and then prove the improvement in full tests.</p>$old_plan$,
      $new_plan$<p>This four-week plan replaces random practice with a simple feedback loop: name the mistake, practise the cause, then see whether the habit holds up in a full test.</p>$new_plan$
    ),
    $old_cta$<p>Start one timed test in the <a href="/listening">IELTS Listening practice area</a> or choose a complete set from <a href="/cambridge-tests">Cambridge IELTS practice</a>. Create the six-code error log before you check the answers. If screen workflow also costs you marks, pair this plan with the <a href="/blog/ielts-computer-test-typing-screen-strategy">7-day computer-test guide</a>.</p>$old_cta$,
    $new_cta$<p>While this guide is still fresh, start one timed test in the <a href="/listening">IELTS Listening practice area</a> or choose a complete set from <a href="/cambridge-tests">Cambridge IELTS practice</a>. Create the six-code error log <em>before</em> you check the answers. If the screen itself slows you down, pair this plan with the <a href="/blog/ielts-computer-test-typing-screen-strategy">7-day computer-test guide</a>.</p>$new_cta$
  ),
  updated_at = now()
WHERE content_type = 'blog'
  AND slug = 'improve-ielts-listening-band-6-to-7-plan'
  AND content LIKE '%Moving from IELTS Listening Band 5.5 or 6 to Band 7 is rarely%';

UPDATE public.resources
SET
  content = replace(
    replace(
      replace(
        content,
        $old_intro$<p>Learners often ask for Band 5, 6, and 7 IELTS Speaking samples because a single “good answer” does not show what actually changes between levels. A recent candidate specifically wanted recordings or transcripts that reveal those differences. Others felt their Part 3 answers were too short or difficult to develop, even when their everyday English felt natural.</p>$old_intro$,
        $new_intro$<p>A Band 5, 6, or 7 sample only helps if you can hear what changes between the levels. Most learners do not need another polished script; they need to notice why a Part 3 answer runs out of steam, repeats the same idea, or sounds less clear than it did in their head.</p>$new_intro$
      ),
      $old_criteria$<p>The important point is that IELTS does not award a band from one memorised answer. Examiners assess your performance across the test using four equally weighted criteria: fluency and coherence, lexical resource, grammatical range and accuracy, and pronunciation.</p>$old_criteria$,
      $new_criteria$<p>One memorised answer will not decide your band. Examiners listen across the whole test and assess four equally weighted criteria: fluency and coherence, lexical resource, grammatical range and accuracy, and pronunciation.</p>$new_criteria$
    ),
    $old_cta$<p>Open the <a href="/speaking">IELTS Speaking practice area</a> and complete one set without memorising a script. Review it against all four criteria, then repeat only the weakest answer using A-R-E-C. If your Part 2 answers also end early, use the <a href="/blog/ielts-speaking-part-2-two-minute-answer">two-minute Part 2 framework</a>. You can explore how skill scores affect a target overall result with the <a href="/ielts-band-score-calculator">IELTS band score calculator</a>.</p>$old_cta$,
    $new_cta$<p>Open the <a href="/speaking">IELTS Speaking practice area</a> and record one set without a memorised script. Listen back once, choose the answer that felt least clear, and redo <em>only that one</em> with A-R-E-C. If your Part 2 answers also end early, use the <a href="/blog/ielts-speaking-part-2-two-minute-answer">two-minute Part 2 framework</a>. You can also check how skill scores affect a target overall result with the <a href="/ielts-band-score-calculator">IELTS band score calculator</a>.</p>$new_cta$
  ),
  updated_at = now()
WHERE content_type = 'blog'
  AND slug = 'ielts-speaking-band-5-vs-6-vs-7'
  AND content LIKE '%Learners often ask for Band 5, 6, and 7 IELTS Speaking samples%';

UPDATE public.resources
SET
  content = replace(
    replace(
      replace(
        content,
        $old_intro$<p>Matching headings can make a Reading section feel slow even when you understand most of the vocabulary. Recent learners described two related problems: paragraphs contain so much information that the central idea is hard to name, and several headings seem plausible because they repeat details from the text.</p>$old_intro$,
        $new_intro$<p>Matching headings can feel oddly slow when you understand nearly every word. A paragraph seems clear until you look at the options: two headings look possible, both share vocabulary with the text, and neither feels safe enough to choose.</p>$new_intro$
      ),
      $old_method$<p>The task becomes more reliable when you stop hunting for matching words and instead write a short <strong>main-idea map</strong> for each paragraph.</p>$old_method$,
      $new_method$<p>The way out is to stop hunting for matching words and write a short <strong>main-idea map</strong> for each paragraph instead.</p>$new_method$
    ),
    $old_cta$<p>Open the <a href="/reading">IELTS Reading practice area</a> and create a main-idea map before selecting headings. Pair the method with the <a href="/blog/ielts-reading-time-management-computer-strategy">60-minute Reading strategy</a> so one difficult paragraph cannot consume the section. If your errors are mainly evidence decisions rather than headings, practise the <a href="/blog/ielts-reading-true-false-not-given-strategy">True, False, Not Given evidence method</a>.</p>$old_cta$,
    $new_cta$<p>Try it now in the <a href="/reading">IELTS Reading practice area</a>: write the main-idea map before you choose a heading. Pair the method with the <a href="/blog/ielts-reading-time-management-computer-strategy">60-minute Reading strategy</a> so one difficult paragraph cannot take over the section. If your mistakes are mainly about evidence rather than headings, practise the <a href="/blog/ielts-reading-true-false-not-given-strategy">True, False, Not Given evidence method</a>.</p>$new_cta$
  ),
  updated_at = now()
WHERE content_type = 'blog'
  AND slug = 'ielts-reading-matching-headings-main-idea'
  AND content LIKE '%Matching headings can make a Reading section feel slow%';
