# Blog AI Search and Citation Audit

**Audit date:** 27 September 2026 (Asia/Dhaka). **Scope:** 74 published article URLs in the live XML sitemap, the live blog index, RSS feed, `llms.txt`, `robots.txt`, a public read of published blog metadata, and the repository renderer/configuration.

## Verdict

**No: the posts are technically accessible, but the collection is not uniformly ready to be cited as an authoritative source.** The audit establishes eligibility signals, not indexing or actual citation by any answer engine. The main work is source quality, original evidence, editorial transparency, and distribution of newly published posts.

## Evidence and method

- Requested every one of the 74 sitemap article URLs on 27 September 2026; parsed server HTML for HTTP status, canonical, robots, title, description, headings, Article/Breadcrumb schema, visible text, dates, article links, and image alt text.
- Checked the live index, pages 2, 7, and 8, RSS, `llms.txt`, and robots. Sent sample article requests with Googlebot, OAI-SearchBot, and PerplexityBot user-agent strings; all returned 200 and the full article HTML. This is not verification from those crawlers' actual IP ranges or their private indexes.
- Read representative posts on scoring, practice strategies, comparisons, AI feedback, policy changes, and the newest article. A link count is not a fact check; all 74 articles have **not** received line-by-line subject-matter review.
- Downloaded the authenticated Google Search Console Page indexing export (`Table.csv`; report last updated 21 September 2026). It lists 82 indexed URLs, including 73 blog posts. The sole published blog URL absent from that export was published on 23 September, after the report snapshot. This is a snapshot comparison, not current URL Inspection proof.
- Generative AI performance, Bing/other engine indexes, bot logs, referral analytics, and actual AI answer citations were unavailable. No ranking or citation promise follows from this audit.

## Site-wide findings

| Finding | Evidence | Priority |
|---|---|---|
| Crawlable article HTML | 74/74 return 200; 74/74 have matching canonicals, indexable robots tags, H1s, body text, descriptions, Article and Breadcrumb schema, and image alt text. | Preserve |
| Publication order / feed gap | The article dated 2026-09-23, `compare-ai-platforms-for-ielts-writing-feedback-in-2026`, appears on `/blog?page=8` and is absent from the 50-item RSS feed. It is in the sitemap and `llms.txt`. A public read of all 74 published blog rows confirmed that this is the only row with `published_at = null`; `api/feed.js` limits results to 50 and orders null publication dates last. | High |
| Source-free posts | 6/74 article bodies have zero external source links (listed below). 68/74 have at least one link, but link presence does not prove the claim it is attached to. | High |
| Title clipping | 67/74 HTML titles contain a literal ellipsis inserted by `articleSearchTitle()`, often hiding the distinguishing query phrase. The H1 remains complete. | Medium |
| Review identity and dates | Every server-rendered article has the same generic “Reviewed by the IELTS Ai Pro editorial team” card and organisation author; no named reviewer or review method is visible. All heroes show only the publish date, while 68/74 Article schemas have a later `dateModified`. Further diagnosis found that the generic `updated_at` advances on view-count increments, so those schema dates cannot be trusted as editorial dates. | High for factual/policy/comparison posts |
| Limited explicit source sections | Only 2/74 article bodies use an explicit Sources/References/Official sources heading. Inline references are valuable, but source-to-claim checking is harder without clear attribution around changing rules or numerical claims. | Medium |
| Generic “best” comparisons | Multiple posts rank or recommend IELTS Ai Pro alongside competitors. The sampled ranking post names it “the most complete all-in-one option” without a reproducible product test, dated feature/price table, or explicit self-interest disclosure. | High |
| No apparent near-duplicate body copy | Across the 74 texts, the maximum 5-word-shingle overlap relative to the shorter article was about 6.7%. This is a mechanical duplication check, not a judgement of topical overlap or originality. | Preserve |

## Search Console indexing evidence

The 21 September Page indexing export lists **73 of 74** currently published blog URLs as indexed. The remaining URL, [Compare AI Platforms for IELTS Writing Feedback in 2026](https://www.ieltsai.pro/blog/compare-ai-platforms-for-ielts-writing-feedback-in-2026), was published on 23 September and cannot be classified as an indexing failure from this older snapshot. The report also has three “Crawled - currently not indexed” examples (`/ielts-university-requirements`, `/blog/feed.xml`, `/blog`) and three “Discovered - currently not indexed” examples (`/about`, `/ielts-speaking-practice-ai`, `/privacy`). The 16 “Excluded by noindex” examples are blog search/pagination URLs whose exclusion is intentional. These categories include non-article pages and should not be counted as unindexed posts.

On 27 September, all 82 URLs in the indexed export still returned HTTP 200; all 73 indexed blog URLs retained their exact self-canonical. Indexing remains Google's decision. Use URL Inspection after Google recrawls the 23 September article and the blog index to determine their current state.

## Changes made during remediation

- Corrected the newest post's missing `published_at` in the live `public.resources` row to its original creation timestamp. The live `/blog` first page and RSS feed now include it; its slug and canonical are unchanged.
- Added one relevant primary-source link and a scope note to each of the six previously source-free articles. The original article bodies were saved before the update, and all six live URLs still return 200 with unchanged self-canonicals. These links support official format/product claims; they do not verify every teaching example or outcome claim.
- Added an explicit publisher disclosure to eight articles that discuss IELTS Ai Pro alongside other tools or tutors. The originals were saved before editing. Fresh live renders show the disclosure, HTTP 200, and unchanged self-canonicals. This fixes the missing affiliation disclosure, but comparative rankings, prices, and outcome claims still need evidence review.
- Applied the nullable `content_updated_at` column and editorial-change trigger through migration `20260927113000_track_blog_editorial_updates.sql`. It excludes view-count changes. Marked the 14 articles edited today with their actual content-edit times; older editorial histories cannot be reliably recovered from the view-contaminated `updated_at` field.
- Recorded the publication timestamp, six primary-source notes, and eight publisher disclosures in idempotent migration `20260927114000_blog_ai_search_content_cleanup.sql`. It applied to the linked database without duplicating the live edits; the post-apply check found 6 source notes, 8 disclosures, no duplicate disclosures, and 74 published posts.
- Updated the local server renderer to preserve full HTML titles rather than insert literal ellipses, show known editorial update dates, and remove the unsubstantiated “Reviewed by” claim from both server and client article cards. Local Article schema, sitemap `lastmod`, and RSS build date now use editorial dates and fall back to publication when no reliable update date exists. The blog index sitemap date follows its latest article change. The RSS handler now pages through all published posts. These code changes are **not deployed** as of this report.

The findings table and 74-row inventory below record the **pre-remediation baseline**. “Title clipped” and “Sources” therefore describe the original live crawl, not the post-deployment result.

## Highest-priority article work

1. **Recheck the newest article after recrawl.** Its publication timestamp, first-page placement and feed inclusion have been corrected. Use Google URL Inspection after recrawl; no request can force indexing.
2. **Review claim-to-source support.** Add primary IELTS/Cambridge/British Council/IDP links where they support specific rules, formats, score criteria, and time-sensitive claims. Validate cited research before characterising its findings. Do not add citations merely to raise a link count.
3. **Revise self-comparison pieces.** Publish comparison criteria, what was actually tested, test date, source for price/features, uncertainty, and a clear statement that IELTS Ai Pro is the publisher and a compared product. Remove or qualify unmeasured outcomes such as a tool “raising” a band score.
4. **Make editorial accountability accurate.** Replace the generic reviewed claim with real author/reviewer names and qualifications when verified, or describe the actual team process without implying an expert review that cannot be substantiated. Show meaningful review/update dates on pages with changed rules or prices; keep schema and visible dates in agreement.
5. **Write concise, distinct titles without artificial ellipses.** Preserve the useful query terms and brand; keep full article H1s. Do not treat character counts as a ranking factor.
6. **Measure real visibility.** Inspect URL indexing and the generative AI performance report in Search Console, relevant query/page pairs, server logs for OAI-SearchBot and other crawlers, and ChatGPT referrals with `utm_source=chatgpt.com`. Track cited URLs for a fixed set of learner questions over time; test evidence should distinguish citations from mere mentions.

## Source-free at baseline; primary references now added

- [Cambridge IELTS 21 Academic 2026 Test: Start Practising](https://www.ieltsai.pro/blog/cambridge-ielts-21-academic-2026-practice-tests)
- [IELTS Writing Task 2 Essay Structure: A Band 7 Blueprint](https://www.ieltsai.pro/blog/ielts-writing-task-2-essay-structure-band-7)
- [IELTS Speaking Part 2: How to Speak for Two Minutes Naturally](https://www.ieltsai.pro/blog/ielts-speaking-part-2-two-minute-answer)
- [IELTS Reading True, False, Not Given: The Evidence Method](https://www.ieltsai.pro/blog/ielts-reading-true-false-not-given-strategy)
- [IELTS Listening Map Labelling: Predict, Track, Answer](https://www.ieltsai.pro/blog/ielts-listening-map-labelling-strategy)
- [30-Day IELTS Study Plan for Band 7: A Week-by-Week Guide](https://www.ieltsai.pro/blog/30-day-ielts-study-plan-band-7)

## Representative article review

- **Good foundation:** The writing-band explanation cites official IELTS criteria and descriptors, contains worked comparisons, and has a direct article URL. Verify the wording of score calculations and ensure each quantitative claim points to the relevant official source.
- **Good freshness example:** The 2026 delivery-change guide links to the IELTS announcement and Writing on Paper guidance. Because availability varies by market, display a meaningful review date and keep local booking advice prominent.
- **Needs evidence:** The AI tools / “best free apps” pieces use ranked or comparative language and promote this site. Distinguish hands-on observations from vendor claims; show a dated comparison method and disclose the publisher's role.
- **Needs sourcing:** The Cambridge IELTS 21 practice article and five strategy/study-plan posts have no external source links. Add authoritative sources where the articles state official format, timing, scoring, or product claims. Original teaching examples can stand on their own when clearly labeled as examples.
- **New article distribution:** The September 23 AI-platform comparison article has a Sources section and research links. Its missing publication timestamp caused page-8 placement and feed omission at baseline; both live distribution problems are now corrected.

## All 74 published articles: mechanical audit

`Sources` counts external links in the article body. `Title clipped` records literal ellipsis in the server-rendered HTML title. “Links present” means only that links exist; it does not certify their accuracy. The final date is the old row `updated_at`, which can advance on article views and must not be treated as a confirmed editorial revision.

| # | Article | Words | Sources | Title clipped | Published | Row updated at |
|---:|---|---:|---:|:---:|---|---|
| 1 | [IELTS Self-Study Schedule: A Flexible 8-Week Plan](https://www.ieltsai.pro/blog/ielts-self-study-schedule-a-flexible-8-week-plan) | 3152 | 4 | Yes | 2026-08-20 | 2026-08-25 |
| 2 | [Is AI Feedback Good Enough for IELTS Writing Practice?](https://www.ieltsai.pro/blog/is-ai-feedback-good-enough-for-ielts-writing-practice) | 2837 | 4 | Yes | 2026-08-20 | 2026-09-21 |
| 3 | [IELTS writing band score: how your essay is really marked](https://www.ieltsai.pro/blog/ielts-writing-band-score-how-your-essay-is-really-marked) | 3249 | 3 | Yes | 2026-08-20 | 2026-08-24 |
| 4 | [The Best Free IELTS Apps in 2026: What Actually Works](https://www.ieltsai.pro/blog/the-best-free-ielts-apps-in-2026-what-actually-works) | 3309 | 4 | Yes | 2026-08-20 | 2026-08-24 |
| 5 | [Improve Your IELTS Writing Band: 8-Week Plan to Band 7+](https://www.ieltsai.pro/blog/improve-your-ielts-writing-band-8-week-plan-to-band-7) | 3470 | 5 | Yes | 2026-08-20 | 2026-08-24 |
| 6 | [IELTS Writing Task 2 Tips That Actually Raise Your Score](https://www.ieltsai.pro/blog/ielts-writing-task-2-tips-that-actually-raise-your-score) | 2909 | 4 | Yes | 2026-08-20 | 2026-08-24 |
| 7 | [Best Online Platforms for IELTS Speaking Practice in 2026](https://www.ieltsai.pro/blog/best-online-platforms-for-ielts-speaking-practice-in-2026) | 2473 | 4 | Yes | 2026-08-08 | 2026-08-27 |
| 8 | [AI IELTS Preparation Tools That Raise Your Band Score](https://www.ieltsai.pro/blog/ai-ielts-preparation-tools-that-raise-your-band-score) | 2146 | 4 | Yes | 2026-08-08 | 2026-08-21 |
| 9 | [Best Online IELTS Prep Platforms in Australia 2026](https://www.ieltsai.pro/blog/best-online-ielts-prep-platforms-in-australia-2026) | 1954 | 3 | Yes | 2026-08-08 | 2026-08-19 |
| 10 | [Best Free Cambridge-Style IELTS Mock Tests in 2026](https://www.ieltsai.pro/blog/best-free-cambridge-style-ielts-mock-tests-in-2026) | 1839 | 3 | Yes | 2026-08-08 | 2026-08-20 |
| 11 | [Best Free IELTS Practice Tests Online: 2026 Picks](https://www.ieltsai.pro/blog/best-free-ielts-practice-tests-online-2026-picks) | 2283 | 4 | No | 2026-08-08 | 2026-08-20 |
| 12 | [How an AI IELTS Platform Can Fast-Track Your Band Score](https://www.ieltsai.pro/blog/how-an-ai-ielts-platform-can-fast-track-your-band-score) | 1691 | 4 | Yes | 2026-08-08 | 2026-08-15 |
| 13 | [How to Monitor IELTS Improvement and Hit Your Target Band](https://www.ieltsai.pro/blog/how-to-monitor-ielts-improvement-and-hit-your-target-band) | 2296 | 4 | Yes | 2026-08-08 | 2026-08-15 |
| 14 | [AI IELTS Prep: The Complete Beginner's Guide for 2026](https://www.ieltsai.pro/blog/ai-ielts-prep-the-complete-beginner-s-guide-for-2026) | 2111 | 3 | Yes | 2026-08-08 | 2026-08-14 |
| 15 | [7 Places to Get Free Full IELTS Mock Exams Online](https://www.ieltsai.pro/blog/7-places-to-get-free-full-ielts-mock-exams-online) | 1933 | 3 | Yes | 2026-08-08 | 2026-08-14 |
| 16 | [AI IELTS feedback vs human tutors: which to trust?](https://www.ieltsai.pro/blog/ai-ielts-feedback-vs-human-tutors-which-to-trust) | 1894 | 5 | Yes | 2026-08-08 | 2026-08-14 |
| 17 | [IELTS Speaking Topics: Questions, Cue Cards & Tips](https://www.ieltsai.pro/blog/ielts-speaking-topics-questions-cue-cards-tips) | 2386 | 3 | No | 2026-08-08 | 2026-09-20 |
| 18 | [IELTS Writing Task 2 Tips for a Reliable Band 7+ Score](https://www.ieltsai.pro/blog/ielts-writing-task-2-tips-for-a-reliable-band-7-score) | 2235 | 3 | Yes | 2026-08-08 | 2026-08-12 |
| 19 | [How to track IELTS score improvement week by week](https://www.ieltsai.pro/blog/how-to-track-ielts-score-improvement-week-by-week) | 2140 | 3 | Yes | 2026-08-08 | 2026-08-12 |
| 20 | [IELTS Band Score Explained: From Raw Marks to Overall Band](https://www.ieltsai.pro/blog/ielts-band-score-explained-from-raw-marks-to-overall-band) | 2183 | 3 | Yes | 2026-08-08 | 2026-08-12 |
| 21 | [Improve Your IELTS Essay Score: The 10-Step Guide](https://www.ieltsai.pro/blog/improve-your-ielts-essay-score-the-10-step-guide) | 1922 | 4 | Yes | 2026-08-08 | 2026-08-27 |
| 22 | [IELTS vs TOEFL for US admission: which test is easier?](https://www.ieltsai.pro/blog/ielts-vs-toefl-for-us-admission-which-test-is-easier) | 1610 | 4 | Yes | 2026-08-08 | 2026-08-10 |
| 23 | [Track your IELTS progress online and improve faster](https://www.ieltsai.pro/blog/track-your-ielts-progress-online-and-improve-faster) | 2046 | 3 | Yes | 2026-08-08 | 2026-08-08 |
| 24 | [Is AI IELTS Practice Actually as Good as a Real Tutor?](https://www.ieltsai.pro/blog/is-ai-ielts-practice-actually-as-good-as-a-real-tutor) | 1668 | 4 | Yes | 2026-08-08 | 2026-08-09 |
| 25 | [Minimum IELTS scores for US university admission: 2026 guide](https://www.ieltsai.pro/blog/minimum-ielts-scores-for-us-university-admission-2026-guide) | 1832 | 4 | Yes | 2026-08-08 | 2026-08-09 |
| 26 | [IELTS vs TOEFL for US Universities: An Australian Guide](https://www.ieltsai.pro/blog/ielts-vs-toefl-for-us-universities-an-australian-guide) | 2089 | 4 | Yes | 2026-08-08 | 2026-08-10 |
| 27 | [Improve Your IELTS Writing Score by One Full Band](https://www.ieltsai.pro/blog/improve-your-ielts-writing-score-by-one-full-band) | 2379 | 4 | Yes | 2026-08-08 | 2026-08-27 |
| 28 | [IELTS Academic vs General: Which Test Should You Take?](https://www.ieltsai.pro/blog/ielts-academic-vs-general-test) | 2052 | 4 | Yes | 2026-08-08 | 2026-08-09 |
| 29 | [Table Completion IELTS Listening: Stay in the Right Row](https://www.ieltsai.pro/blog/ielts-listening-table-completion-strategy) | 869 | 2 | Yes | 2026-07-27 | 2026-08-06 |
| 30 | [IELTS Reading Summary Completion: Find the Answer Zone](https://www.ieltsai.pro/blog/ielts-reading-summary-completion-strategy) | 876 | 2 | Yes | 2026-07-27 | 2026-08-04 |
| 31 | [IELTS Speaking Test Practice Without Memorising Answers](https://www.ieltsai.pro/blog/ielts-speaking-without-memorising-answers) | 975 | 3 | Yes | 2026-07-27 | 2026-08-06 |
| 32 | [Matching Features IELTS Reading: Track Who Said What](https://www.ieltsai.pro/blog/ielts-reading-matching-features) | 946 | 2 | Yes | 2026-07-27 | 2026-08-03 |
| 33 | [IELTS Writing Feedback: Turn Comments Into a Better Rewrite](https://www.ieltsai.pro/blog/ielts-writing-feedback-rewrite-method) | 1052 | 2 | Yes | 2026-07-27 | 2026-08-04 |
| 34 | [What to Do When You Do Not Know an IELTS Speaking Answer](https://www.ieltsai.pro/blog/ielts-speaking-dont-know-answer) | 715 | 3 | Yes | 2026-07-26 | 2026-07-30 |
| 35 | [IELTS Listening Matching Questions: Control the Options](https://www.ieltsai.pro/blog/ielts-listening-matching-questions) | 610 | 2 | Yes | 2026-07-26 | 2026-07-30 |
| 36 | [IELTS Reading Short-Answer Questions: Find the Exact Boundary](https://www.ieltsai.pro/blog/ielts-reading-short-answer-questions) | 599 | 2 | Yes | 2026-07-26 | 2026-07-30 |
| 37 | [IELTS Writing Task 1 Maps: Compare Changes Without Listing](https://www.ieltsai.pro/blog/ielts-writing-task-1-maps) | 667 | 2 | Yes | 2026-07-26 | 2026-07-30 |
| 38 | [IELTS Listening Form Completion: Predict Every Blank](https://www.ieltsai.pro/blog/ielts-listening-form-completion-tips) | 628 | 2 | Yes | 2026-07-26 | 2026-08-01 |
| 39 | [IELTS Writing Task 2 Two-Part Questions: Answer Both Clearly](https://www.ieltsai.pro/blog/ielts-writing-task-2-two-part-question) | 714 | 2 | No | 2026-07-26 | 2026-08-01 |
| 40 | [IELTS Reading Multiple Choice: A Distractor-Proof Method](https://www.ieltsai.pro/blog/ielts-reading-multiple-choice-tips) | 707 | 2 | Yes | 2026-07-26 | 2026-08-03 |
| 41 | [IELTS Speaking Part 1 Answers: How Long Should You Speak?](https://www.ieltsai.pro/blog/ielts-speaking-part-1-answer-length) | 904 | 2 | Yes | 2026-07-25 | 2026-08-03 |
| 42 | [Does Accent Matter in IELTS Speaking? Improve Pronunciation](https://www.ieltsai.pro/blog/ielts-speaking-pronunciation-accent) | 897 | 2 | Yes | 2026-07-25 | 2026-07-29 |
| 43 | [IELTS Listening Part 4: Note Completion Without Losing Focus](https://www.ieltsai.pro/blog/ielts-listening-part-4-note-completion) | 947 | 2 | Yes | 2026-07-25 | 2026-07-29 |
| 44 | [IELTS Reading Sentence Completion: Find the Exact Answer](https://www.ieltsai.pro/blog/ielts-reading-sentence-completion) | 939 | 1 | Yes | 2026-07-25 | 2026-07-29 |
| 45 | [IELTS Writing Task 1 Process Diagram: A Step-by-Step Guide](https://www.ieltsai.pro/blog/ielts-writing-task-1-process-diagram) | 980 | 2 | Yes | 2026-07-25 | 2026-07-29 |
| 46 | [Can AI Score IELTS Speaking Accurately? Use Feedback Safely](https://www.ieltsai.pro/blog/ai-ielts-speaking-score-accuracy) | 889 | 2 | Yes | 2026-07-23 | 2026-07-28 |
| 47 | [IELTS Writing Task 2 Examples: When You Need One](https://www.ieltsai.pro/blog/ielts-writing-task-2-examples) | 893 | 2 | Yes | 2026-07-23 | 2026-07-27 |
| 48 | [IELTS Overall Band Score Rounding: Calculate It Correctly](https://www.ieltsai.pro/blog/ielts-overall-band-score-rounding-calculator) | 775 | 1 | No | 2026-07-23 | 2026-07-25 |
| 49 | [IELTS Writing Task 1 Overview: Choose the Key Features](https://www.ieltsai.pro/blog/ielts-writing-task-1-overview-key-features) | 918 | 2 | No | 2026-07-22 | 2026-07-23 |
| 50 | [IELTS Listening Multiple Choice: Track Decisions, Not Keywords](https://www.ieltsai.pro/blog/ielts-listening-multiple-choice-part-3) | 830 | 3 | No | 2026-07-22 | 2026-07-22 |
| 51 | [Cambridge IELTS 21 Academic 2026 Test: Start Practising](https://www.ieltsai.pro/blog/cambridge-ielts-21-academic-2026-practice-tests) | 605 | 0 | Yes | 2026-07-22 | 2026-08-06 |
| 52 | [IELTS Reading Paraphrase Traps: Match Meaning, Not Keywords](https://www.ieltsai.pro/blog/ielts-reading-paraphrase-traps) | 958 | 2 | Yes | 2026-07-22 | 2026-07-22 |
| 53 | [IELTS Listening Spelling and Plurals: Stop Losing Easy Marks](https://www.ieltsai.pro/blog/ielts-listening-spelling-plurals-word-limits) | 862 | 2 | Yes | 2026-07-22 | 2026-07-22 |
| 54 | [IELTS Speaking Part 3: Stop Rambling Under Pressure](https://www.ieltsai.pro/blog/ielts-speaking-part-3-stop-rambling) | 919 | 2 | Yes | 2026-07-22 | 2026-07-22 |
| 55 | [Missed an IELTS Listening Answer? Recover in 10 Seconds](https://www.ieltsai.pro/blog/ielts-listening-missed-answer-recovery) | 900 | 2 | Yes | 2026-07-21 | 2026-07-22 |
| 56 | [IELTS Reading Stuck at Band 6.5? Build a Better Error Log](https://www.ieltsai.pro/blog/ielts-reading-band-6-5-error-log) | 864 | 2 | Yes | 2026-07-21 | 2026-07-22 |
| 57 | [IELTS Writing Task 2 Off-Topic? Use the Prompt-Lock Check](https://www.ieltsai.pro/blog/ielts-writing-task-2-stay-on-topic) | 889 | 2 | Yes | 2026-07-21 | 2026-07-22 |
| 58 | [Are IELTS Mock Test Scores Accurate? A Readiness Checklist](https://www.ieltsai.pro/blog/ielts-mock-test-score-readiness-checklist) | 941 | 2 | Yes | 2026-07-20 | 2026-07-22 |
| 59 | [IELTS Speaking Band 7 to 8: Grammar and Vocabulary Drills](https://www.ieltsai.pro/blog/ielts-speaking-band-7-to-8-grammar-vocabulary) | 933 | 2 | Yes | 2026-07-20 | 2026-07-21 |
| 60 | [IELTS Writing Coherence and Cohesion: Band 6 to 7](https://www.ieltsai.pro/blog/ielts-writing-coherence-cohesion-band-7) | 966 | 2 | Yes | 2026-07-20 | 2026-07-22 |
| 61 | [IELTS Reading Matching Headings: Find the Main Idea Faster](https://www.ieltsai.pro/blog/ielts-reading-matching-headings-main-idea) | 916 | 2 | No | 2026-07-19 | 2026-07-20 |
| 62 | [IELTS Speaking Band 5 vs 6 vs 7: What Changes?](https://www.ieltsai.pro/blog/ielts-speaking-band-5-vs-6-vs-7) | 948 | 2 | Yes | 2026-07-19 | 2026-07-20 |
| 63 | [How to Improve IELTS Listening from Band 6 to 7: A 4-Week Plan](https://www.ieltsai.pro/blog/improve-ielts-listening-band-6-to-7-plan) | 989 | 2 | Yes | 2026-07-19 | 2026-07-20 |
| 64 | [IELTS Test Changes in 2026: Computer Tests and Writing on Paper](https://www.ieltsai.pro/blog/ielts-test-changes-2026-computer-writing-on-paper) | 729 | 2 | Yes | 2026-07-18 | 2026-08-06 |
| 65 | [IELTS One Skill Retake 2026: Rules and Decision Guide](https://www.ieltsai.pro/blog/ielts-one-skill-retake-2026-rules-decision-guide) | 687 | 1 | Yes | 2026-07-18 | 2026-07-27 |
| 66 | [IELTS Computer Test Tips: A 7-Day Typing and Screen Plan](https://www.ieltsai.pro/blog/ielts-computer-test-typing-screen-strategy) | 662 | 1 | Yes | 2026-07-18 | 2026-07-26 |
| 67 | [IELTS Writing Task 1 Time Management: Finish in 20 Minutes](https://www.ieltsai.pro/blog/ielts-writing-task-1-time-management-20-minutes) | 703 | 1 | Yes | 2026-07-18 | 2026-07-21 |
| 68 | [IELTS Reading Time Management: A 60-Minute Computer Strategy](https://www.ieltsai.pro/blog/ielts-reading-time-management-computer-strategy) | 715 | 1 | Yes | 2026-07-18 | 2026-08-04 |
| 69 | [IELTS Writing Task 2 Essay Structure: A Band 7 Blueprint](https://www.ieltsai.pro/blog/ielts-writing-task-2-essay-structure-band-7) | 802 | 0 | Yes | 2026-07-18 | 2026-07-21 |
| 70 | [IELTS Speaking Part 2: How to Speak for Two Minutes Naturally](https://www.ieltsai.pro/blog/ielts-speaking-part-2-two-minute-answer) | 697 | 0 | Yes | 2026-07-17 | 2026-07-18 |
| 71 | [IELTS Reading True, False, Not Given: The Evidence Method](https://www.ieltsai.pro/blog/ielts-reading-true-false-not-given-strategy) | 678 | 0 | Yes | 2026-07-16 | 2026-08-04 |
| 72 | [IELTS Listening Map Labelling: Predict, Track, Answer](https://www.ieltsai.pro/blog/ielts-listening-map-labelling-strategy) | 678 | 0 | Yes | 2026-07-15 | 2026-08-04 |
| 73 | [30-Day IELTS Study Plan for Band 7: A Week-by-Week Guide](https://www.ieltsai.pro/blog/30-day-ielts-study-plan-band-7) | 849 | 0 | Yes | 2026-07-14 | 2026-08-04 |
| 74 | [Compare AI Platforms for IELTS Writing Feedback in 2026](https://www.ieltsai.pro/blog/compare-ai-platforms-for-ielts-writing-feedback-in-2026) | 1639 | 3 | Yes | 2026-09-23 | 2026-09-23 |

## External platform guidance

- Google: indexed, snippet-eligible pages can appear as links in AI Overviews/AI Mode; there is no extra AI schema or `llms.txt` requirement, and eligibility does not guarantee inclusion. [AI Features and Your Website](https://developers.google.com/search/docs/appearance/ai-features), [Generative AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
- Google recommends original, reliable, people-first content and visible evidence of authorship and methods where relevant. [Creating Helpful, Reliable, People-First Content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- OpenAI: OAI-SearchBot access supports discovery for ChatGPT search; search and training crawlers are separate. Search placement and citations are not guaranteed. [OpenAI crawlers](https://developers.openai.com/api/docs/bots), [Publishers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq).

## Scope limits

This is a live-output, Search Console export, and repository audit. Search Console proves only the dated indexing snapshot described above. The audit does not prove current Google/Bing indexing for every URL, real OAI-SearchBot access from OpenAI IPs, actual citations, backlink quality, Core Web Vitals, full accessibility, or factual accuracy of every paragraph. The live database changes and undeployed code edits are listed above.
