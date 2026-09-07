## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.

## Learner Panel Design System (UI & Aesthetics Rule)

Do NOT use legacy glassmorphism (`backdrop-blur`, heavy `shadow-lg` / `shadow-2xl`, glowing neon backlights) for UI design in this project.
Instead, strictly use the **Learner Panel Design System** documented in `.claude/skills/learner-panel-design/SKILL.md`:

- **Design Philosophy**: Compact, high-density instrument-panel design system (`PANEL`, `WELL`, `TILE`, `NUM`, `MICRO`, `TITLE`, `Stat`, `Meter`, `Pill`, `IconChip`, `Tip`, `Empty`).
- **Typography**: Tabular monospace numbers (`NUM`), uppercase micro labels (`MICRO`), and distinct card titles (`TITLE`).
- **Surfaces & Elevation**: Zero heavy drop shadows or glassmorphism. Hierarchy is built strictly using hairline rules (`border-[#e4e2f0]` in light mode / `dark:border-white/[0.07]` in dark mode), subtle surface elevation (`WELL`, `TILE`), and card gradients (`from-white to-[#faf9ff]` in light / `from-[#141319] to-[#100f15]` in dark).
- **Primitives Source**: Always import UI primitives from `@/features/dashboard/components/primitives.jsx`.
- **Signal Colors**: Use `--signal-ok`, `--signal-warn`, `--signal-fault`, and brand accent `#5a63df`.

## AI models, fallbacks and pricing

`supabase/functions/_shared/aiModelRegistry.ts` is the single source of truth for
which model runs on which route, what falls back to it, and what it costs.
Provider cost math imports its rates from there, so changing a price in one
place changes it everywhere.

- `npm run ai:models` — print the route map, fallback chains and pricing (`--json`, `--route <id>`).
- `npm run ai:bench -- --model <openrouter-id>` — benchmark a candidate model against
  the real route prompts: JSON reliability, graded accuracy, latency and billed cost,
  compared with the current primary. Needs `OPENROUTER_API_KEY` in the environment.

When a route's model, fallback order or output budget changes, update the registry
in the same commit.

## Meta measurement and the Content-Security-Policy

`docs/meta-conversions-api.md` is the reference for how the Pixel and the
first-party Conversions API relay (`api/meta-capi.js`) fit together.

The CSP in `vercel.json` **deliberately** blocks Meta's Open Bridge
(Conversions API Gateway) endpoints and its client param builder. Those blocked
requests appear as console errors and cost a Lighthouse Best Practices point,
so they read like a bug. They are not.

Do not add `https://*.on.aws`, `https://*.run.app`, or
`capi-automation.s3.us-east-2.amazonaws.com` to the CSP to silence them. The
wildcards would let the page POST to any AWS ECS or Cloud Run host, and the
gateway is stale infrastructure from the Stape setup the relay replaced — it
would duplicate relay events and ship visitor identifiers off-site. Remove the
Open Bridge endpoint in Meta Events Manager instead; the requests then stop at
source. See the doc before changing anything measurement-related in the CSP.
