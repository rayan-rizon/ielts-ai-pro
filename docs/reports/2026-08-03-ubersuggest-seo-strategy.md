# IELTS Ai Pro Ubersuggest SEO strategy

Date: 2026-08-03  
Market: United States, English (`loc_id: 2840`)  
Ubersuggest project: `ieltsai.pro`

## Verified baseline

- Organic visibility: 11 ranking keywords and about 4 estimated monthly organic visits.
- Authority: domain authority 4, six backlinks, and two referring domains.
- Current foothold: `cambridge practice tests for ielts` ranks at position 39 (volume 110, SEO difficulty 54).
- Rank tracking before this update: 15 keywords, with none in the top 100 in the latest project report.
- AI Search Visibility: 0% visibility, no mentions, and 13 tracked prompts across 12 answers.
- Site audit: score 80 across 86 crawled URLs, with 53 issues. The actionable findings were one broken internal blog link and 37 long titles. The 13 blocked routes are authenticated product routes intentionally disallowed by `robots.txt`.

These numbers describe the currently deployed website. Local improvements will not affect the production audit until they are reviewed and deployed.

## Keyword architecture

Each search intent has one canonical owner:

| Intent cluster                        | Canonical owner                   | Role                                     |
| ------------------------------------- | --------------------------------- | ---------------------------------------- |
| Writing feedback                      | `/ielts-writing-checker`          | Public product landing page              |
| AI Speaking practice                  | `/ielts-speaking-practice-ai`     | Public product landing page              |
| Band calculation                      | `/ielts-band-score-calculator`    | Public calculator landing page           |
| Mock, Reading, and Listening practice | `/cambridge-ielts-practice-tests` | Public practice hub with section anchors |
| Question-type methods                 | Focused blog articles             | Supporting informational content         |

Aliases and spelling variants must point to these owners. Do not create separate pages for `IELTS score calculator`, `IELTS calculator`, `free IELTS practice test`, or `IELTS mock test online`; that would split relevance and links across near-duplicate URLs.

## Priority content backlog

1. `IELTS Part 2 speaking questions` — volume 2,400, difficulty 5.
2. `IELTS speaking prompt` — volume 2,400, difficulty 13; target the same Part 2 question-bank URL.
3. `Listening multiple choice IELTS` — volume 880, difficulty 5.
4. `Matching heading questions` — volume 880, difficulty 13.
5. `IELTS listening matching questions` — volume 480, difficulty 5.
6. `True false not given practice` — volume 390, difficulty 5.
7. AI prompt pages for improving Writing from band 6 to 7, common Listening mistakes, and a one-hour IELTS study plan.

The complete page map and publish statuses are in `2026-08-03-ubersuggest-keyword-backlog.csv`.

## AI search visibility plan

- Put a direct, self-contained answer directly below each page heading.
- State product limitations explicitly: scores are practice estimates and IELTS Ai Pro is independent from IELTS, Cambridge, IDP, and the British Council.
- Use stable headings, short definitions, numbered methods, FAQ answers, and attributable primary-source citations where appropriate.
- Keep `Article`, `FAQPage`, `SoftwareApplication`, `BreadcrumbList`, sitemap, RSS, and `llms.txt` consistent with the visible page.
- Answer the existing Ubersuggest prompts with dedicated, non-duplicative pages and link each answer to the relevant tool or practice hub.
- Do not add unsupported performance claims, invented testimonials, or claims that AI can issue an official IELTS score.

## Implementation and measurement gates

- Local implementation adds crawlable Speaking and practice landing pages, shortens overly long titles, repairs protected-route links in blog content, expands sitemap and `llms.txt`, and adds static metadata for crawlers.
- The migration is intentionally local until database deployment is explicitly approved.
- The frontend is intentionally not deployed. After approval and deployment, rerun the Ubersuggest audit, submit the sitemap in Google Search Console, and compare indexed URLs, impressions, top-100 keywords, AI mentions, and referring domains against this baseline.
- Review rankings weekly. Content decisions should use a four-week trend, not a single rank check.
