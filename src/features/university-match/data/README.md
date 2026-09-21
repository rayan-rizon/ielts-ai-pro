# University IELTS requirement data

One JSON file per country, named by lowercase ISO 3166-1 alpha-2 code
(`gb.json`, `au.json`, `de.json`, …). Each file is an array of entries matching
`UniversityEntry` in `../universityMatch.ts`.

Git is the audit trail. Every band change is a reviewable diff with a date and
an author, which is the whole reason this data lives in the repo rather than in
a database nobody reviews.

## The rule that matters

**No number reaches this directory without a human reading the source page.**

The curation pipeline may use an AI classifier to triage which university pages
contain English-language requirements and to propose structured entries from
them. Those proposals are input to review, never output to learners. A learner
picks where to apply based on these bands; a confident wrong number costs them
an application fee and a year.

So: classifier proposes, human verifies against `sourceUrl`, then it lands.
Anything the classifier returns below high confidence gets read in full.

## Entry shape

```json
{
  "id": "gb-manchester",
  "name": "University of Manchester",
  "country": "GB",
  "city": "Manchester",
  "ieltsAccepted": true,
  "scope": "university",
  "requirements": {
    "undergraduate": { "overall": 6.5, "minComponent": 6.0 },
    "postgraduate": { "overall": 7.0, "minComponent": 6.5 }
  },
  "higherRequirementProgrammes": [
    {
      "programme": "Nursing",
      "level": "postgraduate",
      "requirement": { "overall": 7.0, "minComponent": 6.5, "skills": { "writing": 7.0 } }
    }
  ],
  "alternatives": ["TOEFL iBT", "Cambridge C1 Advanced"],
  "preSessional": true,
  "notes": "Medicine, Nursing and Law sit above the baseline.",
  "sourceUrl": "https://www.manchester.ac.uk/study/international/admissions/english-language/",
  "lastVerified": "2026-09-14"
}
```

### Fields that exist for a reason

- **`scope`** — `"university"` means the figure is a site-wide baseline.
  `"programme"` means it only holds for named programmes, which is the normal
  case in Germany, the Netherlands and Sweden where requirements are set per
  degree. The UI must not present a programme-scoped figure as if it covered
  the whole institution.
- **`ieltsAccepted: false`** — some programmes do not take IELTS at all
  (German-taught degrees generally want TestDaF or DSH). Showing a band for
  these is worse than showing nothing.
- **`alternatives`** — other accepted proofs. Common across the EU, where a
  prior English-medium degree often substitutes for a test entirely.
- **`minComponent` vs `skills`** — `minComponent` is the blanket floor across
  all four skills; `skills` overrides it per skill. The 6.5-overall-with-5.5-
  writing rejection is the most common real one, so the floor is not optional
  detail.
- **`lastVerified`** — surfaced to learners next to `sourceUrl`. Past 180 days
  `npm run data:universities` flags it for review; past 365 days the UI marks
  it as possibly outdated rather than presenting it as current.

## Checking the data

```bash
npm run data:universities
```

Validates every entry against the schema and lists what is due for
re-verification. Run it before shipping a data change, and quarterly.

## Verification log

### 2026-09-21 — batch 2 (16 entries, 6 new countries)

Added Warwick, Bristol, Leeds, King's College London and Birmingham (GB);
Sydney, UNSW and ANU (AU); Toronto, UBC and McGill (CA); Auckland (NZ); Trinity
College Dublin (IE); Lund and Uppsala (SE); TUM (DE).

Every band in this batch was read off the institution's own requirements page,
fetched directly at the `sourceUrl` recorded on the entry. No aggregator,
ranking site or study-abroad portal was used as a source at any point.

**These entries still need the human sign-off the rule above describes.** They
were extracted by an agent reading the official pages, which is the classifier
half of the pipeline, not the approval half. The pull request diff is the gate:
open each `sourceUrl` and confirm the numbers before this ships to learners.

Why that gate is not ceremony — two things this batch actually caught:

- A web search reported Warwick's Band A as IELTS 6.5. Warwick's own page says
  Band A is **6.0** (5.5 each) and 6.5 is Band B. The aggregators were a full
  half-band out on the entry-level tier.
- A web search reported Auckland's undergraduate minimum as **5.0 overall**.
  Auckland's own page says **6.0 with no band below 5.5**. The 5.0 figure is the
  pathway-programme entry score, not degree entry.

Both would have sent a learner to the wrong conclusion.

### Coverage

This is a curated set of major institutions, not a complete register. The UK
alone has ~165 recognised bodies; the nine in-scope countries have several
thousand between them. Entries are added a verified batch at a time, and the
country picker only offers a country once it has real entries behind it.

### 2026-09-21 — batch 3 (11 entries, no new countries)

Added Queen Mary London, Newcastle and Cardiff (GB); UWA and Adelaide (AU);
McMaster and Waterloo (CA); UCD (IE); Victoria University of Wellington (NZ);
KTH and Stockholm University (SE).

Same method as batch 2: every band read off the institution's own page. Two
notes worth keeping:

- **Waterloo's standard requirement is not a single floor across skills** —
  6.5 overall with 6.5 in writing and speaking but only 6.0 in reading and
  listening. That is the opposite shape of most universities' floors (which
  usually protect writing, the weakest skill on average) and would have been
  silently flattened by encoding it as a single `minComponent`.
- **Several institutions publish no central number at all** — English
  language requirements live entirely per-degree in a course finder or
  handbook (Edinburgh, Glasgow, Durham, Monash, LMU Munich). These were
  investigated and deliberately left out rather than approximated from a
  typical course, because a single figure would misrepresent an institution
  that doesn't have one.

Coverage is now 30 entries across 7 countries. Still a curated set, not a
complete register — see the coverage note above.

### 2026-09-21 — batch 4 (6 entries, United States added)

Added UC Berkeley, Columbia, Cornell, UT Austin, Boston University
(undergraduate) and Harvard's Griffin Graduate School of Arts and Sciences
(postgraduate).

The US shape is different from the other seven countries and worth flagging:

- **Some published figures are a "competitive benchmark," not an admission
  floor.** Cornell explicitly calls 7.5 its "minimum competitive score," not a
  cutoff that disqualifies a lower one. The entry says so in its notes rather
  than presenting it with the same certainty as a hard requirement like
  Sheffield's 6.5.
- **A university-wide figure usually covers undergraduate only.** US graduate
  admission runs through individual schools (Harvard Kennedy School, Harvard
  Medical School, Columbia's graduate schools, MIT's departments) that each
  set their own number, sometimes wildly apart from the central one. Rather
  than pick one graduate school arbitrarily and label it "Harvard," each entry
  states exactly which school its figure covers.
- **MIT and Stanford undergraduate admission were investigated and left out**
  — neither publishes one central IELTS floor for freshman admission; MIT's
  requirement is set per graduate department, and Stanford's public page does
  not state an undergraduate minimum at all.

Coverage is now 36 entries across 8 countries.

### 2026-09-22 — batch 5 (57 entries, Netherlands added as a 9th country)

Large expansion across all existing countries plus a new one:

- **GB**: Queen Mary London, Newcastle, Cardiff, UCL, Imperial (Business School),
  Nottingham, Liverpool, Aberdeen, Bath, Reading, Loughborough, Hull, Royal
  Holloway, Portsmouth, UEA, Lancaster, Westminster, Sheffield Hallam, Oxford
  Brookes, Ulster, Bournemouth, Kingston, Essex, Keele, Stirling, Greenwich
  (26 new — total 34)
- **AU**: UWA, Adelaide, Newcastle, UNE (4 new — total 13)
- **CA**: McMaster, Waterloo, SFU, Dalhousie, Queen's, Carleton, UVic, Calgary,
  Manitoba (9 new — total 12)
- **US**: Berkeley, Columbia, Cornell, UT Austin, Boston University, Harvard
  GSAS, Purdue, Ohio State, ASU, Georgia, Virginia Tech (11 new — total 11,
  batch 1 was empty before this task started at 6)
- **IE**: UCD, Galway, UCC, TU Dublin (4 new — total 6)
- **NZ**: Victoria Wellington, Canterbury, Massey, Waikato (4 new — total 6)
- **SE**: KTH, Stockholm, Linköping, Chalmers, Gothenburg (5 new — total 8)
- **DE**: KIT (1 new — total 2)
- **NL**: new country — TU Eindhoven, Erasmus (School of Economics), VU
  Amsterdam, Leiden (4 entries)

Same standard as every batch: every band read off the institution's own page.
Two corrections this batch is worth recording, because they are exactly the
failure mode this whole data set exists to prevent:

- **Lancaster** — a search-engine summary reported the undergraduate baseline
  as 7.0 with no component below 7.0. Lancaster's own page shows that figure
  is **Medicine and Surgery only**; the actual undergraduate baseline is 6.5
  with no element below 5.5.
- **Manitoba** — a search summary suggested a general undergraduate floor of
  5.5. The university's own admissions page states 6.5 overall with 6.0 in
  each of the four modules.

Several universities were investigated this batch and deliberately left out
because no reliable single figure could be confirmed against an official
page: University of Kent, University of Leicester, Bangor University (UK);
UNC Chapel Hill (fetched page states no test-specific number); RMIT/Curtin/
Griffith postgraduate detail beyond the baseline; University of Sydney's full
faculty breakdown. A number of pages also returned HTTP 403 or unreadable PDF
content and were skipped rather than filled in from an unconfirmed search
snippet.

Coverage is now 93 entries across 9 countries.
