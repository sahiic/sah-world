# Global CSS ownership

`src/app/globals.css` is the entry point. It retains theme tokens, document defaults,
scrollbars, glass/card primitives, common animations, and the sync notification.
The existing 15 imports, beginning with Tailwind, are unchanged.

This extraction reduces the entry file from 2,465 to 398 lines. The original
5,304 CSS rules are preserved as 5,784 individual selector branches with 18,920
selector-scoped declarations. All 107 original comments are retained.

The domain files are imported **after** those existing imports. Keep
`section-view.css` first among the new files: it contains the shared section,
form, dialog, and card foundations that domain-specific rules override.
Do not alphabetize the imports.

Three legacy primitive variants (`.wisdom-card`, `.today-intention`, and
`.mescidim-scope-tabs`) stay with the shared foundations in `section-view.css`.
Their original values are intentionally overridden by later shared card, chip,
or button rules. Moving them after those foundations changes the existing UI.
Their related responsive rules remain alongside them; the rest of each domain
lives in its dedicated file.

| File | Responsibility |
| --- | --- |
| `section-view.css` | Shared section headings, forms, dialogs, states, and component foundations |
| `sidebar.css` | Navigation, app header, profile menu, and command palette |
| `auth.css` | Login, onboarding, cardioid, account settings, and avatar editing |
| `feedback.css` | Feedback form and feedback administration |
| `daily-wisdom.css` | Wisdom wheel, rituals, and archive |
| `community.css` | Groups, roster, and group chat |
| `focus-global.css` | Global timer, floating timer, and legacy/premium focus styles |
| `mescidim.css` | Prayer times, divine names, supplications, and mosque events |
| `awareness.css` | Geographies, quizzes, boycott, and witness/prayer walls |
| `growth-scene.css` | Growth scenes, diagrams, and their animations |
| `dashboard.css` | Home, metrics, activity cards, and weekly insight |
| `quran-companion.css` | Quran learning, teachers, appointments, and peer/social interfaces |
| `admin.css` | Role administration |
| `reports.css` | Reports, heatmaps, distribution charts, and expandable details |

The focus route's CSS Module and existing focus-shell stylesheet remain separate;
this extraction does not replace them. Existing imported stylesheets are not edited.

## Moving rules safely

- Keep responsive, reduced-motion, and dark-theme rules with their owning domain.
- Preserve relative source order within each domain, including older overridden rules.
- A comma-separated selector list spanning domains is split into equivalent lists
  with identical declarations. Mixed media queries are similarly partitioned without
  changing their conditions. No selectors or declaration values are dropped.
- Shared tokens are intentionally resolved at runtime through CSS custom properties.
- Do not introduce cascade layers or increase selector specificity to hide ordering bugs.

## Refactor verification

From the repository root, compare against the commit before extraction:

```sh
node scripts/verify-css-split.cjs d2a50bee7d61eea78913a177525ab259d6b75520
npx next build
```

The audit compares every selector/declaration pair with its enclosing conditions,
checks comments and the original imports, and detects changed same-selector cascade
winners. The comparison includes disabled/commented code. Formatting and equivalent
selector-list/media-wrapper regrouping are the only differences it permits.

Also compare the rendered login, dashboard, journal, Quran, Mescidim, focus,
awareness, and reports views at 375, 768, 1024, and 1440 pixels in both themes.
Freeze the clock and use identical test data: prayer indicators and the growth
scene intentionally change with time. Browser comparison is necessary because
different selectors can match the same element even when the static audit passes.
