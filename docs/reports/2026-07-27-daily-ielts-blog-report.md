# Daily IELTS Blog Report — 27 July 2026

## Outcome

Five original articles were researched, written, illustrated, validated, and stored in `public.resources` as drafts. They were not published, committed, pushed, or deployed.

The publication gate failed for the correct reason: each new production cover URL returns the 51,051-byte HTML application shell with `content-type: text/html; charset=utf-8`, not the new WebP. Each new production article URL returns HTTP 404. Deployment is required before these records can be reviewed for publication.

## Corpus and keyword audit

- Pre-run corpus: 40 blog rows (29 published, 11 drafts), with 40 unique titles, slugs, and content hashes.
- Audited titles, slugs, descriptions, meta descriptions, keywords, full content, headings, citations, internal links, publication state, recent migrations, and image paths.
- All five selected slugs were absent before insertion.
- Post-insert verification: 5 rows, 5 unique slugs, 5 unique titles, and 5 unique content hashes.
- No new article shares two or more exact SEO tags with any other stored blog post.
- Existing nearby topics were deliberately separated: the Writing article is about applying feedback rather than essay structure; matching features is a relationship task rather than headings; summary completion uses an answer-zone method; table completion uses row/column coordinates rather than form or note completion.
- DataForSEO requests were attempted for candidate queries, but the provider returned HTTP 402 for every request. Search intent and competition notes below therefore use fresh live SERP inspection, not numeric volume or difficulty estimates.

## Topic research and editorial plan

| Article                                                          | Primary keyword and intent                                                                 | SERP competition and content gap                                                                                                                                                                   | Recent anonymised Reddit problem                                                                                                                                               | AI-answer and practical structure                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| IELTS Writing Feedback: Turn Comments Into a Better Rewrite      | `IELTS Writing feedback`; learner wants to act on feedback and improve the next attempt    | Medium competition; results contain checkers and broad feedback advice, but few show how to convert one comment into an observable rewrite and transfer test                                       | 23 Jun: learner saw conflicting AI estimates and wanted real improvement evidence; other recent posts described feedback that named faults without giving a usable next action | Direct answer first; PRIORITISE–REWRITE–COMPARE–RETEST framework; priority decision table; worked paragraph rewrite; feedback log      |
| IELTS Reading Matching Features: Track Who Said What             | `IELTS Reading matching features`; learner wants a reliable solving method                 | Medium-high competition with official and major preparation sites; most results explain the task but do not combine option reuse, all-mention scanning, relationship verbs, and an evidence matrix | 25 Jul: learner struggled to connect people with opinions; 8 Jul: learner confused matching question types and used the wrong strategy                                         | Direct definition; feature-location map; relationship test; worked evidence matrix; ambiguity decision rules                           |
| IELTS Speaking Without Memorised Answers: Build Flexible Fluency | `IELTS Speaking without memorising answers`; learner wants fluent but adaptable responses  | High competition from official preparation pages and broad fluency advice; gap is a trainable routine that preserves spontaneity without abandoning preparation                                    | 8 Jul: learner reported repetitive vocabulary, fillers, and rehearsed-sounding answers; 1 Jul: learner lost fluency under pressure despite preparation                         | Direct answer; POINT–REASON–DETAIL–TURN framework; script-to-building-block decision table; random-change drill; flexible practice log |
| IELTS Reading Summary Completion: Find the Answer Zone           | `IELTS Reading summary completion`; learner wants to locate and fit answers accurately     | Medium competition; common results repeat “scan and check grammar,” while few distinguish task variants and show one bounded answer-zone method                                                    | 18 Jul: learner chose a passage word that did not fit the gap; 17 Jul: learner became disoriented when several question types drew from the same paragraph                     | Direct answer; task-variant decision aid; answer-zone boundary checklist; grammar/meaning/word-limit filter; worked example            |
| IELTS Listening Table Completion: Stay in the Right Row          | `IELTS Listening table completion`; learner wants to keep place while listening and typing | Medium competition; recent results emphasise previewing and predicting but rarely teach an explicit row-plus-column coordinate or correction timeline                                              | 14 Jul and 4 Jul: learners described overload while reading options, listening, and typing, then losing subsequent answers                                                     | Direct answer; COORDINATE–PREDICT–TRACK–CONFIRM method; row/column map; correction-signal timeline; one-cell recovery rule             |

## Sources and citation plan

Changing format, criteria, scoring-language, and task-definition claims are placed beside crawlable primary-source links. Automated checks returned HTTP 200 for all final source URLs:

- IELTS Writing preparation resources and the official Writing band descriptors.
- IELTS Academic Reading format and the official Academic sample-question collection.
- IELTS Speaking format, the official Academic sample-question collection, and the official Speaking band descriptors.
- IELTS Listening format and the official Academic sample-question collection.

Each article distinguishes official IELTS facts from IELTS Ai Pro practice advice or automated estimates. No learner quote, statistic, score conversion, fee, date claim, or unofficial authority claim was invented.

## Internal-link clusters and CTAs

- Writing feedback links to `/writing`, the published coherence-and-cohesion guide, the published Task 2 examples guide, and the new flexible Speaking routine.
- Matching features links to `/reading`, the published paraphrase-traps guide, and the published matching-headings guide.
- Flexible Speaking links to `/speaking`, published Part 2 structure and fluency guides, and the new Writing feedback loop.
- Summary completion links to `/reading`, the published paraphrase-traps and Reading error-log guides, and the new matching-features article.
- Table completion links to `/listening`, the published spelling/plurals/word-limit guide, and the published missed-answer recovery guide.

All existing related-post targets were checked in Supabase and are published. Cross-links between new drafts are used only where the learning method genuinely transfers.

## SEO, schema, and renderer data

| Slug                                        | Meta length | Words | Reading time | Keywords | Practical visuals in HTML                          |
| ------------------------------------------- | ----------: | ----: | -----------: | -------: | -------------------------------------------------- |
| `ielts-writing-feedback-rewrite-method`     |         145 | 1,003 |        7 min |        6 | 4 tables, worked rewrite, checklist, callout       |
| `ielts-reading-matching-features`           |         141 |   890 |        6 min |        6 | 5 tables, evidence matrix, decision rules, callout |
| `ielts-speaking-without-memorising-answers` |         143 |   923 |        7 min |        6 | 5 tables, drill plan, decision aid, callout        |
| `ielts-reading-summary-completion-strategy` |         149 |   830 |        7 min |        6 | 4 tables, worked example, checklist, callout       |
| `ielts-listening-table-completion-strategy` |         144 |   815 |        7 min |        6 | 5 tables, timeline, error log, callout             |

All records have unique reader-focused titles, clean slugs, concise summaries, categories, dated publication fields, canonical-compatible absolute article URLs, local cover paths, and six focused keywords. Cover-alt mappings were added to both the client and server renderer.

No article HTML contains JSON-LD. The server renderer remains the single schema owner. Renderer tests and a browser control article confirmed one valid `Article` object plus one `BreadcrumbList`; the Article includes author, publisher, dates, `mainEntityOfPage`, absolute image, language, free-access flag, section, keywords, word count, about entities, and citation URLs. Robots metadata is `index, follow` with unrestricted snippets.

## Cover assets

All five covers use bright premium educational photography, lavender/indigo/mint accents, natural light, adult IELTS learners, uncluttered 16:9 compositions, and exactly one legible `IELTS Ai Pro` watermark in a semi-transparent indigo strip at bottom-right. No protected-attribute targeting was used. Final files were visually inspected after conversion:

| Path                                                                | Dimensions | Format |   Bytes |
| ------------------------------------------------------------------- | ---------: | ------ | ------: |
| `public/blog-images/ielts-writing-feedback-rewrite-method.webp`     |   1200×675 | WebP   |  69,214 |
| `public/blog-images/ielts-reading-matching-features.webp`           |   1200×675 | WebP   |  73,590 |
| `public/blog-images/ielts-speaking-without-memorising-answers.webp` |   1200×675 | WebP   |  79,272 |
| `public/blog-images/ielts-reading-summary-completion-strategy.webp` |   1200×675 | WebP   | 105,630 |
| `public/blog-images/ielts-listening-table-completion-strategy.webp` |   1200×675 | WebP   | 100,616 |

Every file passes the exact dimension, 16:9, `image/webp`, visible-quality, and 60–150 KB gates. The local production preview serves all five as `image/webp`.

## Migration and database verification

- Migration: `supabase/migrations/20260727041926_daily_ielts_guides_20260727.sql`
- Applied Supabase migration history: `20260727041926_daily_ielts_guides_20260727`.
- Uses no generated or hardcoded IDs.
- Uses the partial slug conflict target for blog resources and idempotent `ON CONFLICT ... DO UPDATE`.
- Both insert and update paths force `is_published = false`.
- Stored-row verification confirmed five distinct draft records, correct URLs, image paths, meta lengths, keyword counts, dates, HTML component counts, citations, internal links, and no inline schema.
- Admin RLS access remains present for SELECT, INSERT, UPDATE, and DELETE; public SELECT still requires a published record whose publication time has arrived.

Supabase advisors show existing project-level warnings about executable `SECURITY DEFINER` functions and leaked-password protection, plus existing informational unused-index notices and the known multiple-permissive-SELECT-policy warning on `resources`. This content-only migration introduced no DDL or policy change. Relevant references: [security-definer advisor](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [multiple permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies), and [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Exact verification results

- `npm run lint`: exit 0; 0 errors, 521 existing warnings.
- `npm run build`: exit 0; Vite production build completed in 23.44 seconds and SEO pages generated.
- `npm run seo:check`: passed; 8 public routes plus server-rendered blog, sitemap, `llms.txt`, and RSS checks.
- Integration tests: 3 files passed, 12 tests passed (`blog-renderer`, `sitemap-renderer`, `ai-discovery`).
- `git diff --check`: passed.
- Official citations: 7 unique final source URLs checked; all returned HTTP 200.
- Desktop browser at 1440×900: one visible primary navbar, one article, no horizontal overflow, valid canonical/robots metadata, cover 1200×675, and Article plus Breadcrumb JSON-LD.
- Mobile browser at 390×844: one visible primary navbar, one article, no horizontal overflow (`scrollWidth = clientWidth = 390`), cover rendered responsively at 332 px with 1200×675 natural dimensions, and two valid JSON-LD objects.

## Discovery surfaces and crawler results

Because the five rows are drafts, their absence from discovery routes is correct:

- `/sitemap.xml`: HTTP 200, `application/xml; charset=utf-8`, zero new-slug matches.
- `/llms.txt`: HTTP 200, `text/plain; charset=utf-8`, zero new-slug matches.
- `/blog/feed.xml`: HTTP 200, `application/rss+xml; charset=utf-8`, zero new-slug matches.

A published control article returned HTTP 200 `text/html; charset=utf-8` with no `x-vercel-mitigated` response for every tested agent: OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Googlebot, and Bingbot.

The five new articles were not crawler-tested as live pages because they are not live. Their production canonicals return 404, and their production image URLs return HTML. This run makes no claim that the new articles are published, indexed, ranking, AI-citable, or crawlable.

## Required next step

Review the five drafts and covers, then explicitly authorise a deployment when ready. After deployment, rerun the asset MIME/size checks, publish only the approved records, and repeat article, schema, discovery-surface, and all nine crawler tests before claiming publication or AI discovery.
