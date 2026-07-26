-- Seven search-led IELTS tips guides for 26 July 2026.
-- Intentionally kept as drafts. Their local cover assets must be deployed and verified as
-- image/webp on the canonical production URLs before any article is published.
-- The filename matches the applied remote migration history version.

INSERT INTO public.resources (
  title, description, meta_description, url, content_type, content, slug, seo_tags,
  category, reading_minutes, published_at, is_published, featured, access_tier, thumbnail_url
)
VALUES
(
  'IELTS Reading Multiple Choice: A Distractor-Proof Method',
  'A practical evidence-first method for solving IELTS Reading multiple-choice questions, separating close options, and learning from distractor mistakes.',
  'Master IELTS Reading multiple choice with an evidence-first method to find the answer zone, test close options, and avoid common distractor traps.',
  'https://www.ieltsai.pro/blog/ielts-reading-multiple-choice-tips',
  'blog',
  $post$
  <p>You have found the right paragraph. Two options still look possible, the clock is moving, and changing your answer feels as risky as keeping it. This is where IELTS Reading multiple choice becomes a decision task rather than a scanning task.</p>
  <p>The reliable move is to delay judging the options until you can state what the passage actually proves. That one habit makes distractors easier to see.</p>

  <blockquote><p>Evidence first, options second: write a five-word answer from the passage before you choose A, B, C, or D.</p></blockquote>

  <h2>What multiple choice really tests</h2>
  <p>IELTS Reading multiple-choice questions may ask you to choose one answer or more than one. The questions follow the order of information in the text, but the options often paraphrase, narrow, exaggerate, or reverse what the passage says. Every selected answer must be supported by the relevant part of the text.</p>

  <h2>Use the ZONE–PROVE–TEST method</h2>
  <table>
    <thead><tr><th scope="col">Move</th><th scope="col">What to do</th><th scope="col">Decision you produce</th></tr></thead>
    <tbody>
      <tr><td>ZONE</td><td>Underline the question focus and locate its paraphrase</td><td>A small answer area, not the whole passage</td></tr>
      <tr><td>PROVE</td><td>Read around that area and answer in your own short phrase</td><td>The idea the text actually supports</td></tr>
      <tr><td>TEST</td><td>Compare every option with the proof phrase</td><td>One supported choice and a reason to reject each rival</td></tr>
    </tbody>
  </table>

  <aside><p><strong>Fast check:</strong> an option is not correct because it appears in the passage. It is correct only when it answers this question in the same way as the passage.</p></aside>

  <h2>Identify the distractor family</h2>
  <table>
    <thead><tr><th scope="col">Distractor</th><th scope="col">How it looks</th><th scope="col">Question to ask</th></tr></thead>
    <tbody>
      <tr><td>True but irrelevant</td><td>The passage states it, but it answers a different point</td><td>Does this address the exact question focus?</td></tr>
      <tr><td>Too strong</td><td>“May” becomes “always” or “some” becomes “all”</td><td>Did the option change the strength of the claim?</td></tr>
      <tr><td>Half right</td><td>The first idea matches, but the reason or result does not</td><td>Can I prove every meaningful part?</td></tr>
      <tr><td>Reversed relationship</td><td>Cause and result, or subject and object, are swapped</td><td>Who did what to whom?</td></tr>
      <tr><td>Nearby detail</td><td>Words come from the answer zone but form the wrong claim</td><td>Does the full sentence match the evidence?</td></tr>
    </tbody>
  </table>

  <h2>Work an original example</h2>
  <p><strong>Passage:</strong> “The city trial reduced weekday traffic in the centre, although researchers warned that the six-week study was too short to predict lasting effects.”</p>
  <p><strong>Question:</strong> What did researchers conclude about the trial?</p>
  <ol>
    <li>Proof phrase: <strong>short-term improvement, long-term effect uncertain</strong>.</li>
    <li>Reject “It permanently solved congestion” because <em>permanently</em> is too strong.</li>
    <li>Reject “It made weekday traffic worse” because the relationship is reversed.</li>
    <li>Choose the option saying the initial result was positive but not enough to establish a lasting change.</li>
  </ol>
  <p>Notice that no keyword trick settles the question. The winning option preserves both parts of the evidence.</p>

  <h2>Handle choose-two questions</h2>
  <p>When the instruction asks for two answers, treat each choice as a separate claim. Do not choose a pair because the options sound related. Prove option one, prove option two, then check that you have not selected two versions of the same detail.</p>
  <ol>
    <li>Mark each option <strong>P</strong> for proved, <strong>C</strong> for contradicted, or <strong>N</strong> for not stated.</li>
    <li>Select only proved options.</li>
    <li>Recheck the number of answers required before moving on.</li>
  </ol>

  <h2>Use an option autopsy after practice</h2>
  <table>
    <thead><tr><th scope="col">Log item</th><th scope="col">What to record</th></tr></thead>
    <tbody>
      <tr><td>My choice</td><td>The exact option and why it attracted me</td></tr>
      <tr><td>Passage proof</td><td>The smallest sentence or phrase that decides the answer</td></tr>
      <tr><td>Distractor type</td><td>Irrelevant, too strong, half right, reversed, or nearby detail</td></tr>
      <tr><td>Next rule</td><td>A concrete action such as “check both halves of the option”</td></tr>
    </tbody>
  </table>
  <p>This turns a wrong answer into a reusable rule. If you only record the correct letter, the same distractor can work again.</p>

  <h2>Final action: prove before you select</h2>
  <p>Open the <a href="/reading">IELTS Ai Pro Reading practice area</a> and complete one multiple-choice set. For every uncertain item, write a short proof phrase before selecting an option. Then compare your mistakes with the <a href="/blog/ielts-reading-short-answer-questions">short-answer boundary method</a> and the <a href="/blog/ielts-reading-paraphrase-traps">paraphrase-trap guide</a>.</p>
  <p>Question format and distractor guidance were checked on 26 July 2026 against the official <a href="https://ielts.org/organisations/ielts-for-organisations/test-types/ielts-academic-test/academic-test-format-in-detail" target="_blank" rel="noopener noreferrer">IELTS Academic test format</a> and <a href="https://ielts.org/news-and-insights/how-to-avoid-distractors-in-the-ielts-reading-test" target="_blank" rel="noopener noreferrer">IELTS distractor guidance</a>.</p>
  $post$,
  'ielts-reading-multiple-choice-tips',
  ARRAY['IELTS Reading multiple choice', 'IELTS Reading multiple choice tips', 'IELTS Reading distractors', 'IELTS MCQ strategy', 'IELTS Reading answer evidence', 'IELTS Reading question types'],
  'Reading', 5, '2026-07-26T08:00:00Z'::timestamptz, false, false, 'free',
  '/blog-images/ielts-reading-multiple-choice-tips.webp'
),
(
  'IELTS Writing Task 2 Two-Part Questions: Answer Both Clearly',
  'A balanced planning method for IELTS Writing Task 2 two-part questions, with a coverage grid, paragraph decisions, and a final answer audit.',
  'Plan IELTS Writing Task 2 two-part questions with a clear coverage grid, balanced body paragraphs, focused examples, and a fast final answer audit.',
  'https://www.ieltsai.pro/blog/ielts-writing-task-2-two-part-question',
  'blog',
  $post$
  <p>You finish a polished Task 2 essay and then notice the second question in the prompt received one sentence. The grammar may be strong, but the response is incomplete.</p>
  <p>Two-part questions are manageable when you turn the prompt into two visible jobs before planning ideas. The goal is not equal word counts at any cost; it is a developed, relevant answer to both questions.</p>

  <blockquote><p>If the prompt contains two question marks, your plan needs two answer statements before your essay needs an introduction.</p></blockquote>

  <h2>Recognise the two-part prompt</h2>
  <p>A two-part question introduces a situation and asks two direct questions, such as “Why has this happened?” and “Is this a positive or negative development?” The questions may be linked, but each creates a separate response requirement.</p>

  <h2>Build a two-column coverage grid</h2>
  <table>
    <thead><tr><th scope="col">Planning line</th><th scope="col">Question 1</th><th scope="col">Question 2</th></tr></thead>
    <tbody>
      <tr><td>Exact task</td><td>Copy the command in short form</td><td>Copy the second command in short form</td></tr>
      <tr><td>Direct answer</td><td>One clear sentence</td><td>One clear sentence</td></tr>
      <tr><td>Main reason</td><td>Why that answer is true</td><td>Why that answer is true</td></tr>
      <tr><td>Example</td><td>A specific illustration if useful</td><td>A specific illustration if useful</td></tr>
    </tbody>
  </table>
  <p>If either direct-answer cell is blank, do not start writing. A blank cell predicts an underdeveloped body paragraph.</p>

  <aside><p><strong>Coverage rule:</strong> balance means both questions are clearly answered and developed. It does not mean forcing both paragraphs to contain exactly the same number of words.</p></aside>

  <h2>Choose the paragraph structure</h2>
  <table>
    <thead><tr><th scope="col">Prompt relationship</th><th scope="col">Best default structure</th><th scope="col">When to adapt</th></tr></thead>
    <tbody>
      <tr><td>Two distinct questions</td><td>Body 1 answers Q1; Body 2 answers Q2</td><td>Rarely—this is the clearest choice</td></tr>
      <tr><td>Q2 depends on Q1</td><td>Body 1 explains Q1; Body 2 evaluates the result in Q2</td><td>Link the final sentence of Body 1 to the next judgment</td></tr>
      <tr><td>One question needs two reasons</td><td>Give two concise reasons in its paragraph</td><td>Protect enough space to develop the other question</td></tr>
    </tbody>
  </table>
  <p>A four-paragraph essay—introduction, two body paragraphs, conclusion—is a useful default. Add a paragraph only when it improves logic, not because a memorised structure demands it.</p>

  <h2>Write an introduction that answers both jobs</h2>
  <p>Consider this original prompt: “More employees now change careers several times. Why is this happening? Is it a positive or negative development?”</p>
  <p>A focused introduction can paraphrase the situation and preview both answers: “Frequent career changes are increasingly common, largely because workers can access new training and employers value transferable skills. Overall, this is a positive development when people change direction with a realistic plan.”</p>
  <p>The introduction establishes the cause and the position. The body paragraphs still need to explain them.</p>

  <h2>Keep examples attached to the question</h2>
  <table>
    <thead><tr><th scope="col">Body move</th><th scope="col">Question 1 example</th><th scope="col">Question 2 example</th></tr></thead>
    <tbody>
      <tr><td>Point</td><td>Online training reduces the cost of changing fields</td><td>Career movement can improve job fit</td></tr>
      <tr><td>Explain</td><td>Workers can gain a targeted skill without another full degree</td><td>People can move toward work that suits their strengths</td></tr>
      <tr><td>Example</td><td>An accountant completes a short data course while employed</td><td>The move combines financial knowledge with analytics</td></tr>
      <tr><td>Link</td><td>This access makes career change more achievable</td><td>That better match can benefit the worker and employer</td></tr>
    </tbody>
  </table>
  <p>Do not reuse the same example twice with different labels. Each paragraph needs evidence for its own answer.</p>

  <h2>Run the two-question audit</h2>
  <ol>
    <li>Circle the sentence that directly answers Question 1.</li>
    <li>Circle the sentence that directly answers Question 2.</li>
    <li>Underline one developed reason for each answer.</li>
    <li>Check that your conclusion includes both answers without adding a new idea.</li>
    <li>Remove any paragraph that discusses the topic but not a prompt question.</li>
  </ol>
  <p>If you cannot find one of the two direct answers in ten seconds, the examiner may struggle too. Make it explicit.</p>

  <h2>Final action: plan both answers in four minutes</h2>
  <p>Open the <a href="/writing">IELTS Ai Pro Writing practice area</a>, choose a two-part Task 2 prompt, and complete the coverage grid before drafting. Use the <a href="/blog/ielts-writing-task-2-stay-on-topic">stay-on-topic audit</a> to remove attractive but irrelevant ideas and the <a href="/blog/ielts-writing-task-2-examples">Task 2 example method</a> to develop each answer.</p>
  <p>Task requirements were checked on 26 July 2026 against official <a href="https://ielts.org/organisations/ielts-for-organisations/test-types/ielts-academic-test/academic-test-format-in-detail" target="_blank" rel="noopener noreferrer">IELTS Academic Writing information</a> and the official public <a href="https://ielts.idp.com/vietnam/about/news-and-articles/article-ielts-writing-task-2-two-part-question/en-gb" target="_blank" rel="noopener noreferrer">IDP two-part-question guide</a>.</p>
  $post$,
  'ielts-writing-task-2-two-part-question',
  ARRAY['IELTS Writing Task 2 two part question', 'IELTS double question essay', 'IELTS two part essay structure', 'IELTS Task 2 planning', 'IELTS essay answer both questions', 'IELTS Writing Task 2 tips'],
  'Writing', 5, '2026-07-26T09:00:00Z'::timestamptz, false, false, 'free',
  '/blog-images/ielts-writing-task-2-two-part-question.webp'
),
(
  'IELTS Listening Form Completion: Predict Every Blank',
  'A field-by-field method for predicting IELTS Listening form answers, tracking corrections, and protecting names, numbers, spelling, and word limits.',
  'Improve IELTS Listening form completion by predicting each field, tracking corrections, and checking names, numbers, spelling, and answer limits.',
  'https://www.ieltsai.pro/blog/ielts-listening-form-completion-tips',
  'blog',
  $post$
  <p>The recording begins with an easy name, then a phone number is corrected, an address is spelt, and one lost digit turns a calm Part 1 into rushed guessing. Form completion feels simple until several small accuracy decisions arrive together.</p>
  <p>The form itself is your map. Its labels tell you what kind of information to expect and help you stay with the conversation when the wording changes.</p>

  <blockquote><p>Read each field as a prediction: label, grammar, likely value, and possible correction.</p></blockquote>

  <h2>Turn form labels into listening targets</h2>
  <table>
    <thead><tr><th scope="col">Field label</th><th scope="col">Likely answer</th><th scope="col">Risk to prepare for</th></tr></thead>
    <tbody>
      <tr><td>Surname</td><td>A name</td><td>Spelling letter by letter</td></tr>
      <tr><td>Arrival date</td><td>A day or date</td><td>A first date being corrected</td></tr>
      <tr><td>Fee: £___</td><td>A number only</td><td>Confusing teens and tens</td></tr>
      <tr><td>Reason for visit</td><td>A noun or short noun phrase</td><td>Paraphrase rather than label repetition</td></tr>
      <tr><td>Facilities required</td><td>Plural noun</td><td>Missing the final <em>-s</em></td></tr>
    </tbody>
  </table>

  <h2>Use LABEL–LISTEN–LOCK</h2>
  <ol>
    <li><strong>LABEL:</strong> read the form title, instructions, and words around every gap.</li>
    <li><strong>LISTEN:</strong> track the conversation in question order and wait through corrections.</li>
    <li><strong>LOCK:</strong> enter the smallest exact answer, then shift attention to the next field.</li>
    <li><strong>CHECK:</strong> review spelling, number format, plural form, grammar, and the word limit.</li>
  </ol>

  <aside><p><strong>Correction rule:</strong> when a speaker says “actually,” “sorry,” “rather,” or “I mean,” keep listening. The final information is usually the answer.</p></aside>

  <h2>Track common correction patterns</h2>
  <table>
    <thead><tr><th scope="col">What you hear</th><th scope="col">What changes</th><th scope="col">Your action</th></tr></thead>
    <tbody>
      <tr><td>“Tuesday—sorry, Thursday”</td><td>The day is replaced</td><td>Enter Thursday</td></tr>
      <tr><td>“Fifteen, that is one-five”</td><td>The number is confirmed</td><td>Keep 15</td></tr>
      <tr><td>“Not King Street; it is Kings Road”</td><td>Both the name and word ending change</td><td>Enter the final road name exactly</td></tr>
      <tr><td>“The standard room is full, so I will take a twin”</td><td>The first preference is unavailable</td><td>Enter twin if the field asks for booking choice</td></tr>
    </tbody>
  </table>
  <p>Do not write the first plausible detail and stop listening. Keep the field open until the speaker completes that decision.</p>

  <h2>Handle names and numbers accurately</h2>
  <p>For spelt names, write each letter as you hear it and check the whole sequence only after the spelling ends. For numbers, use the form context: a price, phone number, postcode, time, and room number have different shapes.</p>
  <table>
    <thead><tr><th scope="col">Signal</th><th scope="col">Possible confusion</th><th scope="col">Micro-check</th></tr></thead>
    <tbody>
      <tr><td>13 / 30</td><td>Stress on <em>-teen</em> versus the first syllable</td><td>Listen for repetition or digit-by-digit confirmation</td></tr>
      <tr><td>Double six</td><td>Writing one 6</td><td>Expand “double” into two digits</td></tr>
      <tr><td>Oh / zero</td><td>Assuming the word is a letter</td><td>Use the number-shaped field</td></tr>
      <tr><td>7.50</td><td>Dropping the decimal value</td><td>Check whether the field already supplies a currency symbol</td></tr>
    </tbody>
  </table>

  <h2>Recover without losing the next field</h2>
  <p>If one answer is unclear, leave a visible placeholder and move to the next label. Form questions follow the conversation, so staring at the previous blank can cost another answer. During checking time, use grammar and context to review what you captured; do not invent information you never heard.</p>

  <h2>Make a form-completion error log</h2>
  <ol>
    <li>Mark the field type: name, number, date, place, or noun phrase.</li>
    <li>Classify the error: prediction, correction, spelling, plural, word limit, or attention.</li>
    <li>Replay with the transcript after the one-play attempt.</li>
    <li>Write one next-time action, such as “wait for the corrected date.”</li>
  </ol>

  <h2>Final action: predict before pressing play</h2>
  <p>Open the <a href="/listening">IELTS Ai Pro Listening practice area</a>, choose a form-completion set, and label every blank before the audio begins. Follow with the <a href="/blog/ielts-listening-matching-questions">Listening matching method</a> for option-heavy tasks and the <a href="/blog/ielts-listening-spelling-plurals-word-limits">accuracy checklist</a> for lost spelling or word-limit marks.</p>
  <p>Completion format and answer-limit guidance were checked on 26 July 2026 against official <a href="https://www.ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noopener noreferrer">IELTS sample tasks</a> and the <a href="https://takeielts.britishcouncil.org/sites/default/files/listening_part_1_form_completion_and_multiple_choice_questions.pdf" target="_blank" rel="noopener noreferrer">British Council Part 1 form-completion practice</a>.</p>
  $post$,
  'ielts-listening-form-completion-tips',
  ARRAY['IELTS Listening form completion', 'IELTS form completion tips', 'IELTS Listening Part 1', 'IELTS Listening names and numbers', 'IELTS Listening corrections', 'IELTS Listening spelling'],
  'Listening', 5, '2026-07-26T10:00:00Z'::timestamptz, false, false, 'free',
  '/blog-images/ielts-listening-form-completion-tips.webp'
),
(
  'IELTS Writing Task 1 Maps: Compare Changes Without Listing',
  'A change-family method for IELTS Writing Task 1 maps, covering overview selection, spatial grouping, tense choices, and a focused final checklist.',
  'Write IELTS Task 1 maps clearly with a change-family method for strong overviews, spatial grouping, accurate tenses, and focused comparisons.',
  'https://www.ieltsai.pro/blog/ielts-writing-task-1-maps',
  'blog',
  $post$
  <p>Two maps show the same place years apart. You can see a new road, a missing field, relocated buildings, and an enlarged car park—but your report starts turning into a tour of every corner.</p>
  <p>A strong map response groups changes by meaning. First decide how the place transformed; then choose details that prove that overview.</p>

  <blockquote><p>Do not describe Map A and then Map B. Compare the same feature across time and group it with related changes.</p></blockquote>

  <h2>Sort every feature into a change family</h2>
  <table>
    <thead><tr><th scope="col">Change family</th><th scope="col">What to mark</th><th scope="col">Useful language</th></tr></thead>
    <tbody>
      <tr><td>Added</td><td>New roads, buildings, facilities, or green space</td><td>was constructed; was introduced</td></tr>
      <tr><td>Removed</td><td>Features that disappear</td><td>was removed; gave way to</td></tr>
      <tr><td>Converted</td><td>One use becomes another</td><td>was converted into; was replaced by</td></tr>
      <tr><td>Relocated</td><td>A feature moves position</td><td>was moved from X to Y</td></tr>
      <tr><td>Expanded or reduced</td><td>A feature changes size</td><td>was enlarged; was reduced</td></tr>
      <tr><td>Unchanged</td><td>Important anchors that remain</td><td>remained in place; was retained</td></tr>
    </tbody>
  </table>

  <h2>Use the MAPS planning method</h2>
  <ol>
    <li><strong>M — Mark:</strong> label each important feature with a change family.</li>
    <li><strong>A — Assess:</strong> decide the overall direction: more urban, accessible, residential, commercial, or recreational.</li>
    <li><strong>P — Pair:</strong> group related changes by area or purpose.</li>
    <li><strong>S — Select:</strong> choose the most important unchanged anchor and enough details to prove the overview.</li>
  </ol>

  <aside><p><strong>Overview test:</strong> if your sentence lists three tiny objects but does not explain how the place changed overall, it is detail—not an overview.</p></aside>

  <h2>Write an overview from transformation, not inventory</h2>
  <p>Imagine a rural site in 2000 and 2025. Farmland is replaced by homes, a footpath becomes a road, and a small shop remains beside the entrance.</p>
  <p>A listing overview says: “There were several changes, including houses and a road.” A stronger overview says: “Overall, the area became substantially more residential and accessible, as farmland was replaced by housing and the internal path was upgraded, while the entrance shop remained unchanged.”</p>
  <p>The stronger version gives a dominant change, supporting transformation, and stable anchor.</p>

  <h2>Choose a body-paragraph split</h2>
  <table>
    <thead><tr><th scope="col">Map pattern</th><th scope="col">Body 1</th><th scope="col">Body 2</th></tr></thead>
    <tbody>
      <tr><td>Clear left/right layout</td><td>Western or northern changes</td><td>Eastern or southern changes</td></tr>
      <tr><td>Strong functional shift</td><td>Residential and access changes</td><td>Commercial, public, or green-space changes</td></tr>
      <tr><td>Central redevelopment</td><td>Changes around the centre</td><td>Changes around the perimeter</td></tr>
      <tr><td>Before/after with few features</td><td>Major removals and conversions</td><td>Additions, expansions, and unchanged anchors</td></tr>
    </tbody>
  </table>
  <p>Choose the split that reduces jumping around. A reader should be able to follow one area or change family at a time.</p>

  <h2>Select the tense from the dates</h2>
  <table>
    <thead><tr><th scope="col">Map timing</th><th scope="col">Main tense</th><th scope="col">Example</th></tr></thead>
    <tbody>
      <tr><td>Two completed past dates</td><td>Past simple or past passive</td><td>The warehouse was replaced by apartments.</td></tr>
      <tr><td>Present and future plan</td><td>Present for now; future or planned passive for proposal</td><td>A bridge is planned to connect the two banks.</td></tr>
      <tr><td>No date, current layouts</td><td>Present simple</td><td>The library stands east of the park.</td></tr>
    </tbody>
  </table>
  <p>Do not switch tense because a sentence “sounds better.” Let the map dates control the timeline.</p>

  <h2>Run the map checklist</h2>
  <ol>
    <li>Have I identified the dominant transformation?</li>
    <li>Does the overview include a major change and, when useful, an unchanged anchor?</li>
    <li>Have I compared features across maps instead of describing each map separately?</li>
    <li>Are body paragraphs grouped by area or purpose?</li>
    <li>Are locations and directions accurate?</li>
    <li>Do the tenses match the dates?</li>
    <li>Have I avoided reasons or opinions not shown?</li>
  </ol>

  <h2>Final action: map the changes in three minutes</h2>
  <p>Open the <a href="/writing">IELTS Ai Pro Writing practice area</a>, choose one map task, and label the change families before drafting. Check the result with the <a href="/blog/ielts-writing-task-1-overview-key-features">Task 1 overview guide</a> and protect your timing with the <a href="/blog/ielts-writing-task-1-time-management-20-minutes">20-minute workflow</a>. When you switch to Task 2, use the <a href="/blog/ielts-writing-task-2-two-part-question">two-part-question coverage grid</a>.</p>
  <p>Task format was checked on 26 July 2026 against official <a href="https://ielts.org/organisations/ielts-for-organisations/test-types/ielts-academic-test/academic-test-format-in-detail" target="_blank" rel="noopener noreferrer">IELTS Academic Writing information</a> and the public <a href="https://ielts.idp.com/vietnam/prepare/article-ielts-writing-task-1-maps/en-gb" target="_blank" rel="noopener noreferrer">IDP Task 1 maps guide</a>.</p>
  $post$,
  'ielts-writing-task-1-maps',
  ARRAY['IELTS Writing Task 1 maps', 'IELTS Task 1 map vocabulary', 'IELTS map overview', 'IELTS map essay structure', 'IELTS map comparison', 'Academic Writing Task 1 maps'],
  'Writing', 5, '2026-07-26T11:00:00Z'::timestamptz, false, false, 'free',
  '/blog-images/ielts-writing-task-1-maps.webp'
),
(
  'IELTS Reading Short-Answer Questions: Find the Exact Boundary',
  'A question-first method for IELTS Reading short answers, with answer-type prediction, evidence boundaries, word-limit checks, and a compact error log.',
  'Solve IELTS Reading short-answer questions with answer-type prediction, exact evidence boundaries, word-limit checks, and a focused practice log.',
  'https://www.ieltsai.pro/blog/ielts-reading-short-answer-questions',
  'blog',
  $post$
  <p>You locate the right sentence but copy four words when the instruction allows three. On the next question, you choose a grammatically neat phrase that answers “where” with a person. The evidence was close; the answer boundary was not.</p>
  <p>Short-answer questions become more reliable when you predict the shape of the answer and copy only the smallest passage phrase that answers the question fully.</p>

  <blockquote><p>Question word first, evidence second, answer boundary third.</p></blockquote>

  <h2>Predict the answer type from the question</h2>
  <table>
    <thead><tr><th scope="col">Question word</th><th scope="col">Likely answer</th><th scope="col">Boundary check</th></tr></thead>
    <tbody>
      <tr><td>Who?</td><td>Person, group, role, or organisation</td><td>Do not copy the action unless needed</td></tr>
      <tr><td>Where?</td><td>Place or location phrase</td><td>Include the preposition only if required by meaning and limit</td></tr>
      <tr><td>When?</td><td>Date, period, or event point</td><td>Distinguish duration from starting date</td></tr>
      <tr><td>Why?</td><td>Reason or cause</td><td>Copy the cause, not its result</td></tr>
      <tr><td>How many/much?</td><td>Number or quantity</td><td>Check units already printed in the question</td></tr>
      <tr><td>What?</td><td>Thing, action, or idea</td><td>Use the grammar after the question stem</td></tr>
    </tbody>
  </table>

  <h2>Use TYPE–LOCATE–TRIM–CHECK</h2>
  <ol>
    <li><strong>TYPE:</strong> predict person, place, date, reason, quantity, or thing.</li>
    <li><strong>LOCATE:</strong> scan for paraphrased anchors and read the full evidence sentence.</li>
    <li><strong>TRIM:</strong> copy the smallest exact phrase that answers the question.</li>
    <li><strong>CHECK:</strong> confirm meaning, grammar, spelling, and the word limit.</li>
  </ol>

  <aside><p><strong>Minimum-proof rule:</strong> remove one word at a time. Stop when removing the next word would make the answer incomplete, unclear, or grammatically wrong.</p></aside>

  <h2>Work an original boundary example</h2>
  <p><strong>Passage:</strong> “After repeated winter flooding, the council moved the archive from the riverside basement to a climate-controlled room on the second floor.”</p>
  <p><strong>Question:</strong> Where was the archive relocated?</p>
  <p>If the instruction says <em>NO MORE THAN THREE WORDS</em>, <strong>second floor</strong> answers the location. “A climate-controlled room on the second floor” is accurate but too long. “Climate-controlled room” names the type of room, but may miss the location focus. The question word helps set the boundary.</p>

  <h2>Use order without becoming careless</h2>
  <p>Short-answer questions normally follow the order of information in the text. After confirming one answer, continue below that evidence for the next. However, still read around the match: a repeated keyword may introduce a comparison before the writer gives the exact answer.</p>

  <h2>Protect the word limit</h2>
  <table>
    <thead><tr><th scope="col">Instruction</th><th scope="col">Safe response</th><th scope="col">Risky response</th></tr></thead>
    <tbody>
      <tr><td>ONE WORD ONLY</td><td>basement</td><td>the basement</td></tr>
      <tr><td>NO MORE THAN TWO WORDS</td><td>winter flooding</td><td>repeated winter flooding</td></tr>
      <tr><td>NO MORE THAN THREE WORDS AND/OR A NUMBER</td><td>second floor; 18 months</td><td>on the second floor when four words exceed the limit</td></tr>
      <tr><td>Units printed after the gap</td><td>18</td><td>18 months when “months” is already supplied</td></tr>
    </tbody>
  </table>
  <p>Read the instruction for that task, not from memory. Limits can vary.</p>

  <h2>Build a minimum evidence log</h2>
  <table>
    <thead><tr><th scope="col">Column</th><th scope="col">What to write</th></tr></thead>
    <tbody>
      <tr><td>Question type</td><td>Who, where, when, why, quantity, or what</td></tr>
      <tr><td>Passage proof</td><td>The sentence that contains the answer</td></tr>
      <tr><td>Final boundary</td><td>The exact words submitted</td></tr>
      <tr><td>Error cause</td><td>Wrong type, wrong location, over-copying, spelling, or limit</td></tr>
      <tr><td>Repair</td><td>One action for the next set</td></tr>
    </tbody>
  </table>

  <h2>Final action: practise the boundary</h2>
  <p>Open the <a href="/reading">IELTS Ai Pro Reading practice area</a> and answer one short-answer set. Mark the question type and passage proof for every response. Use the <a href="/blog/ielts-reading-multiple-choice-tips">multiple-choice evidence method</a> when options distract you and the <a href="/blog/ielts-reading-sentence-completion">sentence-completion guide</a> when grammar determines the exact word form.</p>
  <p>Question order and answer-limit guidance were checked on 26 July 2026 against the official <a href="https://ielts.org/organisations/ielts-for-organisations/test-types/ielts-academic-test/academic-test-format-in-detail" target="_blank" rel="noopener noreferrer">IELTS Academic test format</a> and the <a href="https://takeielts.britishcouncil.org/sites/default/files/dealing_with_short_answer_questions.pdf" target="_blank" rel="noopener noreferrer">British Council short-answer practice guide</a>.</p>
  $post$,
  'ielts-reading-short-answer-questions',
  ARRAY['IELTS Reading short answer questions', 'IELTS short answer questions tips', 'IELTS Reading word limit', 'IELTS Reading answer boundary', 'IELTS Reading question words', 'IELTS Reading exact answers'],
  'Reading', 5, '2026-07-26T12:00:00Z'::timestamptz, false, false, 'free',
  '/blog-images/ielts-reading-short-answer-questions.webp'
),
(
  'IELTS Listening Matching Questions: Control the Options',
  'A practical option-compression method for IELTS Listening matching questions, with decision timing, distractor handling, recovery, and an error audit.',
  'Master IELTS Listening matching questions by compressing options, waiting for final meaning, tracking decisions, and recovering without losing focus.',
  'https://www.ieltsai.pro/blog/ielts-listening-matching-questions',
  'blog',
  $post$
  <p>The speaker moves to the next person while you are still rereading six long options. Then a familiar phrase appears, you select too quickly, and the speaker changes direction with “but.” Matching questions punish slow option reading and early decisions.</p>
  <p>The fix is to compress the options before listening and choose from the final relationship, not the first matching word.</p>

  <blockquote><p>Short labels before the audio; final meaning before the answer.</p></blockquote>

  <h2>Compress the option list</h2>
  <table>
    <thead><tr><th scope="col">Long option</th><th scope="col">Useful label</th><th scope="col">Contrast to preserve</th></tr></thead>
    <tbody>
      <tr><td>Easy to organise at short notice</td><td>quick setup</td><td>Not necessarily cheap</td></tr>
      <tr><td>Offers the best value for the group</td><td>low cost</td><td>Not necessarily convenient</td></tr>
      <tr><td>Provides an unusual learning experience</td><td>novel learning</td><td>Not merely entertaining</td></tr>
      <tr><td>Suitable for participants of different abilities</td><td>mixed levels</td><td>Focus is inclusion</td></tr>
    </tbody>
  </table>
  <p>Reduce each option to two or three words, but preserve the difference between close choices. If “quick setup” and “low cost” both become “easy,” your labels are too vague.</p>

  <h2>Use READ–TRACK–WAIT–MATCH</h2>
  <ol>
    <li><strong>READ:</strong> check whether options can be used once, more than once, or not at all.</li>
    <li><strong>TRACK:</strong> follow the numbered people, places, or topics in order.</li>
    <li><strong>WAIT:</strong> hold the decision through contrast or correction language.</li>
    <li><strong>MATCH:</strong> select the option whose complete meaning fits the speaker’s final view.</li>
  </ol>

  <aside><p><strong>Decision rule:</strong> a repeated keyword opens an option; it does not close the decision. Listen through “but,” “although,” “actually,” and “in the end.”</p></aside>

  <h2>Follow the decision timeline</h2>
  <table>
    <thead><tr><th scope="col">Audio moment</th><th scope="col">Example function</th><th scope="col">Your state</th></tr></thead>
    <tbody>
      <tr><td>First mention</td><td>Introduces a possible option</td><td>Candidate, not answer</td></tr>
      <tr><td>Evaluation</td><td>Explains an advantage or problem</td><td>Compare with compressed labels</td></tr>
      <tr><td>Contrast</td><td>Changes or limits the first view</td><td>Keep listening</td></tr>
      <tr><td>Final choice</td><td>Confirms what matters most</td><td>Match and move on</td></tr>
    </tbody>
  </table>

  <h2>Work an original example</h2>
  <p>A speaker says: “The museum workshop is inexpensive, and I liked that at first. However, the outdoor survey lets beginners and experienced volunteers work at their own level, which matters more for this group.”</p>
  <p>“Inexpensive” activates <strong>low cost</strong>, but the final reason supports <strong>mixed levels</strong>. Choosing at the first match loses the relationship.</p>

  <h2>Recover when the options overwhelm you</h2>
  <ol>
    <li>Mark one tentative option only if you heard real evidence.</li>
    <li>Move your eyes to the next numbered item when the speaker moves on.</li>
    <li>Do not reread the entire option list; use your short labels.</li>
    <li>Review the tentative choice after the recording if time remains.</li>
  </ol>
  <p>One uncertain match should stay one uncertain match. Protect the next question.</p>

  <h2>Audit the instruction and option reuse</h2>
  <p>Some matching tasks allow an option to be used more than once; others do not. The instruction controls this. Never reject a well-supported answer simply because you already used that letter unless the task says each option is used once.</p>

  <h2>Diagnose practice errors</h2>
  <table>
    <thead><tr><th scope="col">Error</th><th scope="col">Likely cause</th><th scope="col">Repair</th></tr></thead>
    <tbody>
      <tr><td>Could not read options in time</td><td>No compression</td><td>Label every option before the audio</td></tr>
      <tr><td>Selected the first familiar word</td><td>Early decision</td><td>Wait through the speaker’s evaluation</td></tr>
      <tr><td>Lost the next item</td><td>Stayed with a missed answer</td><td>Move when the numbered topic changes</td></tr>
      <tr><td>Rejected a repeated letter</td><td>Assumed a rule</td><td>Reread the reuse instruction</td></tr>
    </tbody>
  </table>

  <h2>Final action: shorten the list</h2>
  <p>Open the <a href="/listening">IELTS Ai Pro Listening practice area</a>, choose a matching set, and compress every option before pressing play. Compare the result with the <a href="/blog/ielts-listening-form-completion-tips">form-completion prediction method</a> and the <a href="/blog/ielts-listening-multiple-choice-part-3">Part 3 multiple-choice guide</a>.</p>
  <p>Matching format and strategy details were checked on 26 July 2026 against the official public <a href="https://ielts.idp.com/prepare/article-ielts-listening-matching-questions-guide" target="_blank" rel="noopener noreferrer">IDP Listening matching guide</a> and <a href="https://www.ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noopener noreferrer">IELTS sample tasks</a>.</p>
  $post$,
  'ielts-listening-matching-questions',
  ARRAY['IELTS Listening matching questions', 'IELTS matching questions tips', 'IELTS Listening Part 3 matching', 'IELTS Listening options', 'IELTS Listening distractors', 'IELTS Listening matching strategy'],
  'Listening', 5, '2026-07-26T13:00:00Z'::timestamptz, false, false, 'free',
  '/blog-images/ielts-listening-matching-questions.webp'
),
(
  'What to Do When You Do Not Know an IELTS Speaking Answer',
  'A four-situation recovery guide for IELTS Speaking when you did not hear, do not understand, lack knowledge, or simply cannot think of an idea.',
  'Do not know an IELTS Speaking answer? Use four natural recovery moves for unclear questions, unfamiliar topics, blank moments, and limited knowledge.',
  'https://www.ieltsai.pro/blog/ielts-speaking-dont-know-answer',
  'blog',
  $post$
  <p>The examiner asks about a topic you have never considered. Your mind goes quiet, and the silence feels longer because you are searching for an impressive idea. You do not need expert knowledge; you need a clear way to keep communicating.</p>
  <p>First diagnose the problem. “I did not hear the question” needs a different response from “I heard it, but I have no opinion.”</p>

  <blockquote><p>Recover honestly, then give the simplest relevant answer you can support.</p></blockquote>

  <h2>Choose the right recovery move</h2>
  <table>
    <thead><tr><th scope="col">What went wrong</th><th scope="col">Natural move</th><th scope="col">Then do this</th></tr></thead>
    <tbody>
      <tr><td>You did not hear</td><td>“Could you repeat the question, please?”</td><td>Listen for the key topic and command</td></tr>
      <tr><td>You do not understand a word</td><td>Ask for clarification briefly when appropriate</td><td>Answer the meaning you now understand</td></tr>
      <tr><td>You lack knowledge</td><td>State that it is outside your experience</td><td>Use a familiar example or cautious opinion</td></tr>
      <tr><td>Your mind is blank</td><td>Use one short thinking phrase</td><td>Choose a simple answer and add a reason</td></tr>
    </tbody>
  </table>

  <aside><p><strong>Important:</strong> one short recovery phrase can create thinking space. A chain of memorised fillers only delays the answer and can make your speech less natural.</p></aside>

  <h2>If you did not hear the question</h2>
  <p>Ask for repetition instead of guessing. A brief request is clearer than answering a different question. Once it is repeated, identify the topic and whether the examiner asks about the past, present, future, preference, cause, or comparison.</p>

  <h2>If you do not know enough about the topic</h2>
  <p>IELTS Speaking evaluates how you communicate, not whether you are a specialist in architecture, astronomy, public policy, or every other possible subject. You can set a boundary and still respond:</p>
  <p>“I do not know much about urban planning, but from a resident’s point of view, reliable public transport is probably the most important feature because it affects people every day.”</p>
  <p>This answer is honest, relevant, and developed. It moves from limited knowledge to a clear perspective and reason.</p>

  <h2>If you have no personal example</h2>
  <table>
    <thead><tr><th scope="col">Available route</th><th scope="col">How to use it</th><th scope="col">Example opening</th></tr></thead>
    <tbody>
      <tr><td>Someone you know</td><td>Use a friend, relative, classmate, or colleague</td><td>“I have not experienced that, but my cousin…”</td></tr>
      <tr><td>Your community</td><td>Describe a familiar local pattern without making statistics up</td><td>“Where I live, people tend to…”</td></tr>
      <tr><td>A hypothetical case</td><td>Explain what would probably happen and why</td><td>“If I had to choose, I would…”</td></tr>
      <tr><td>A comparison</td><td>Contrast the unfamiliar topic with something you know</td><td>“It is different from my experience because…”</td></tr>
    </tbody>
  </table>

  <h2>If your mind goes blank</h2>
  <p>Use the ANSWER–WHY–DETAIL frame:</p>
  <ol>
    <li><strong>ANSWER:</strong> choose a clear, ordinary position.</li>
    <li><strong>WHY:</strong> give one reason.</li>
    <li><strong>DETAIL:</strong> add an example, result, comparison, or condition.</li>
  </ol>
  <p>Question: “Should old buildings always be preserved?”</p>
  <p>Response: “Not always. Some buildings are unsafe or too costly to maintain, so cities may need to replace them. However, if a building has genuine historical importance, renovation would be a better choice.”</p>
  <p>The idea is not rare or academic. Its value comes from a clear position, reason, and qualification.</p>

  <h2>Avoid the three panic habits</h2>
  <table>
    <thead><tr><th scope="col">Panic habit</th><th scope="col">Why it fails</th><th scope="col">Better move</th></tr></thead>
    <tbody>
      <tr><td>Inventing detailed facts</td><td>You spend attention maintaining a story</td><td>Use a simple hypothetical example</td></tr>
      <tr><td>Repeating the question</td><td>It adds little communication</td><td>Give a direct answer, then one reason</td></tr>
      <tr><td>Searching for “advanced” ideas</td><td>Long silence and tangled grammar follow</td><td>Choose the first relevant idea you can explain</td></tr>
    </tbody>
  </table>

  <h2>Practise recovery, not perfect prediction</h2>
  <ol>
    <li>Collect ten unfamiliar Speaking questions.</li>
    <li>Give yourself three seconds to diagnose the difficulty.</li>
    <li>Use one recovery move and answer for 30–45 seconds.</li>
    <li>Listen back for the point where you became clear.</li>
    <li>Repeat the answer with fewer fillers, not a memorised script.</li>
  </ol>

  <h2>Final action: record five uncomfortable questions</h2>
  <p>Open the <a href="/speaking">IELTS Ai Pro Speaking practice area</a> and record answers to five topics you would normally skip. Use the <a href="/blog/ielts-speaking-part-1-answer-length">Part 1 answer-length guide</a> for concise development and the <a href="/blog/ielts-speaking-part-3-stop-rambling">Part 3 structure</a> when a complex answer starts drifting.</p>
  <p>Speaking-response guidance was checked on 26 July 2026 against official public advice from <a href="https://ielts.idp.com/prepare/article-how-to-answer-all-questions-in-ielts-speaking" target="_blank" rel="noopener noreferrer">IDP on answering Speaking questions</a>, the <a href="https://www.britishcouncil.org/voices-magazine/ten-dos-ielts-speaking-test" target="_blank" rel="noopener noreferrer">British Council Speaking dos</a>, and <a href="https://ielts.org/news-and-insights/ielts-speaking-10-ways-to-help-students-speak-more-fluently" target="_blank" rel="noopener noreferrer">IELTS fluency guidance</a>.</p>
  $post$,
  'ielts-speaking-dont-know-answer',
  ARRAY['IELTS Speaking do not know answer', 'what if I do not know IELTS Speaking answer', 'IELTS Speaking unfamiliar topics', 'IELTS Speaking mind goes blank', 'IELTS Speaking recovery phrases', 'IELTS Speaking tips'],
  'Speaking', 5, '2026-07-26T14:00:00Z'::timestamptz, false, false, 'free',
  '/blog-images/ielts-speaking-dont-know-answer.webp'
)
ON CONFLICT (slug) WHERE content_type = 'blog'
DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  meta_description = EXCLUDED.meta_description,
  url = EXCLUDED.url,
  content = EXCLUDED.content,
  seo_tags = EXCLUDED.seo_tags,
  category = EXCLUDED.category,
  reading_minutes = EXCLUDED.reading_minutes,
  published_at = EXCLUDED.published_at,
  is_published = false,
  featured = EXCLUDED.featured,
  access_tier = EXCLUDED.access_tier,
  thumbnail_url = EXCLUDED.thumbnail_url,
  updated_at = now();
