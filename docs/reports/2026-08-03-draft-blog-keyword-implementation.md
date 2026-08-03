# Draft blog keyword implementation

Date: 2026-08-03  
Research source: Ubersuggest, United States English (`loc_id: 2840`)

## Scope

Six `public.resources` blog records were verified as drafts (`is_published = false`) and updated in the live database. No post was published, and no public URL, publication date, or featured status was changed.

| Draft slug                                  | Primary keyword                  | Monthly volume | SEO difficulty | Implementation                                                                                                                                  |
| ------------------------------------------- | -------------------------------- | -------------: | -------------: | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ielts-reading-multiple-choice-tips`        | IELTS Reading multiple choice    |          1,900 |              5 | Retained strong title; strengthened description, meta description, and keyword set for question intent.                                         |
| `ielts-listening-table-completion-strategy` | table completion IELTS Listening |            320 |              5 | Updated title, opening answer, description, meta description, and keyword set.                                                                  |
| `ielts-speaking-without-memorising-answers` | IELTS Speaking test practice     |            210 |              9 | Updated title, opening answer, description, meta description, and keyword set without competing for the AI-tool landing page's intent.          |
| `ielts-reading-matching-features`           | matching features IELTS Reading  |             70 |              5 | Updated title, opening answer, description, meta description, and keyword set.                                                                  |
| `ielts-reading-summary-completion-strategy` | IELTS Reading summary completion |             50 |              5 | Retained the precise Reading intent; added the broader summary-completion variant as a secondary phrase.                                        |
| `ielts-writing-feedback-rewrite-method`     | IELTS Writing feedback           |             10 |             19 | Clarified the feedback-to-rewrite intent in descriptions and related terms; retained a distinct informational purpose from the Writing Checker. |

## Quality checks

- All six records remain `is_published = false`.
- Every primary keyword occurs in the rendered-title source, description, meta description, tags, or visible body copy.
- Each record has six focused tags.
- Final titles are 52–59 characters; meta descriptions are 132–154 characters.
- Five new primary terms were added to the existing Ubersuggest project without removing the prior tracked terms. The project now tracks 54 keywords of a 150-keyword allowance.

## Publication gate

These keyword improvements are stored only as drafts. Before publishing any draft, verify the cover image MIME type and dimensions in production, validate the rendered article, canonical URL, structured data, sitemap, RSS feed, `llms.txt`, crawler status, and internal links. Then publish only the explicitly approved records.
