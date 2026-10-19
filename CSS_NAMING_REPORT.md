# CSS Naming Convention Audit

Scanned all 26 `src/**/*.css` stylesheets on 2026-10-18. Counts below are class-selector occurrences (not unique class names); repeated use in separate selectors is counted each time. CSS comments are ignored by the PostCSS parser.

Classification is intentionally explicit so the report is repeatable:

- **BEM-like**: hyphenated component names ending in `-card`, `-button`, `-badge`, or `-item` (the examples in this repository's task brief).
- **Prefix-based**: names beginning with `fa-`, `cp-`, `dc-`, `qc-`, or `ae-`; reported separately below by prefix.
- **camelCase (CSS Modules)**: class names containing uppercase letters in a `.module.css` file.
- **Plain**: remaining names, including ordinary single-word and kebab-case classes such as `.topbar` and `.streak-overview`.

## Pattern counts by stylesheet

| Stylesheet | BEM-like | Plain | Prefix-based | camelCase | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| `src/app/_card-tokens.css` | 6 | 1 | 4 | 0 | 11 |
| `src/app/achievements.css` | 12 | 63 | 0 | 0 | 75 |
| `src/app/activity-calendar.css` | 6 | 40 | 0 | 0 | 46 |
| `src/app/category-progress.css` | 0 | 24 | 54 | 0 | 78 |
| `src/app/daily-challenge.css` | 0 | 7 | 30 | 0 | 37 |
| `src/app/data-export.css` | 12 | 20 | 0 | 0 | 32 |
| `src/app/farkindalik/[geography]/page.module.css` | 0 | 37 | 0 | 0 | 37 |
| `src/app/focus-analytics.css` | 0 | 7 | 52 | 0 | 59 |
| `src/app/focus/focus.module.css` | 0 | 76 | 0 | 596 | 672 |
| `src/app/global-error.module.css` | 0 | 10 | 0 | 0 | 10 |
| `src/app/globals.css` | 636 | 5,719 | 758 | 0 | 7,113 |
| `src/app/journal.css` | 5 | 407 | 0 | 0 | 412 |
| `src/app/milestone-timeline.css` | 7 | 21 | 0 | 0 | 28 |
| `src/app/nikotest/focus-shell.css` | 0 | 121 | 0 | 0 | 121 |
| `src/app/peer-matching.css` | 1 | 167 | 0 | 0 | 168 |
| `src/app/phase-two.css` | 1 | 65 | 0 | 0 | 66 |
| `src/app/profession-school.css` | 36 | 500 | 0 | 0 | 536 |
| `src/app/profile.css` | 9 | 151 | 0 | 0 | 160 |
| `src/app/quality.css` | 0 | 21 | 0 | 0 | 21 |
| `src/app/weekly-summary.css` | 6 | 27 | 0 | 0 | 33 |
| `src/components/auth/LoginExperience.module.css` | 2 | 65 | 0 | 9 | 76 |
| `src/components/core/DashboardPolish.module.css` | 5 | 11 | 0 | 11 | 27 |
| `src/components/core/SahAppPolish.module.css` | 0 | 1 | 0 | 12 | 13 |
| `src/components/core/focusStudio.module.css` | 5 | 152 | 0 | 35 | 192 |
| `src/components/core/growth/GrowthScene.module.css` | 0 | 214 | 0 | 64 | 278 |
| `src/components/ui/SectionSkeleton.module.css` | 0 | 20 | 0 | 6 | 26 |
| **Total occurrences** | **749** | **7,947** | **898** | **733** | **10,327** |

## Prefix-family counts by stylesheet

| Stylesheet | `fa-*` | `cp-*` | `dc-*` | `qc-*` | `ae-*` |
| --- | ---: | ---: | ---: | ---: | ---: |
| `src/app/_card-tokens.css` | 0 | 2 | 2 | 0 | 0 |
| `src/app/category-progress.css` | 0 | 54 | 0 | 0 | 0 |
| `src/app/daily-challenge.css` | 0 | 0 | 30 | 0 | 0 |
| `src/app/focus-analytics.css` | 52 | 0 | 0 | 0 | 0 |
| `src/app/globals.css` | 0 | 0 | 0 | 758 | 0 |

The other 21 stylesheets have zero occurrences of these five prefixes. No `ae-*` classes were found in the scanned source stylesheets.
