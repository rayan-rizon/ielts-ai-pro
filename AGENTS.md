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
