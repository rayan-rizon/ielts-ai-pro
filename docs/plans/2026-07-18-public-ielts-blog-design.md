# Public IELTS blog and admin publishing design

## Outcome

Add a public, search-friendly IELTS article library at `/blog`, link it from the landing navigation and footer, and keep publishing inside the existing admin Resources area. The launch set contains five useful long-form articles that send readers into the application's Reading, Writing, Listening, Speaking, calculator, and account flows.

## Chosen architecture

The existing `resources` table and `BlogEditor` already provide the right ownership boundary, so the blog remains part of that model rather than introducing a parallel CMS. Blog-specific metadata is added to `resources`: category, meta description, publication date, reading time, and featured status. Public clients can read published rows; authenticated administrators can create, read drafts, update, publish, unpublish, and delete. Row-level security is the final authorization boundary, while the protected admin route remains the user-interface boundary.

The public React routes provide the in-app experience and local development behavior. Production rewrites `/blog` and `/blog/:slug` to a small server-rendered endpoint that reads only published rows through the Supabase anonymous key. This gives crawlers complete titles, descriptions, canonical links, Article JSON-LD, breadcrumbs, and article HTML on the first response. It also avoids the stale-content problem of build-time prerendering: an admin edit becomes visible after the short CDN cache expires, without requiring a frontend redeploy.

Alternatives considered were a build-only static blog (excellent crawlability but stale after admin edits) and a client-only Supabase blog (immediate edits but weak first-response HTML for crawlers). The hybrid request-rendered approach meets both requirements without a new paid CMS.

## Experience and content

The visual direction is an editorial IELTS study journal: warm paper surfaces, ink-like headings, restrained indigo/red annotation accents, and clear reading rhythm. The index supports topic filtering and search. Article pages show reading time, publication date, category, structured metadata, related practice calls to action, and a return path to the article library.

The five launch topics target durable learner intent rather than thin keyword pages:

1. IELTS Writing Task 2 essay structure for Band 7
2. IELTS Speaking Part 2 cue-card strategy
3. IELTS Reading True/False/Not Given strategy
4. IELTS Listening map-labelling strategy
5. A practical 30-day IELTS Band 7 study plan

Each post includes concrete steps, common mistakes, and contextual internal links to relevant practice routes. Claims remain preparation guidance; no AI estimate is presented as an official IELTS result.

## Verification

Verification covers migration/RLS state, anonymous published reads, anonymous write rejection, seeded article count, admin CRUD source paths, focused lint/tests, production build and SEO generation, and browser checks for `/blog` plus one article. Supabase security and performance advisors are checked after the migration.

## Visual redesign addendum

The approved visual direction is a bright IELTS study-companion editorial system based on the supplied library and article references. The library uses a full public navigation bar, an image-led hero, a compact category rail, one prominent featured story, visual article cards, and a useful trending/tags/practice sidebar. The article page uses the same navigation and hero language, then switches to a readable two-column layout with a 720px content column and sticky table of contents. It adds real share/copy actions, related articles, and contextual practice links without introducing non-functional newsletter or save controls.

The production server-rendered template follows the same hierarchy so Vercel visitors and crawlers do not receive a visually different page. Existing local imagery is reused for the hero and article fallbacks; category-specific color, icon, crop, and texture treatments give the cards distinct identities without adding remote image dependencies. Titles remain capped at a readable scale and all navigation destinations map to real public or application routes.
