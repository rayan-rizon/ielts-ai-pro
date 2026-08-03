# Project Directory Structure

This document explains the organization of the IELTS Mastery Pro codebase.

## Root Directory

```
Ielts-mastery-pro/
├── .agent/           # AI agent configuration & workflows
├── .github/          # GitHub Actions workflows
├── .husky/           # Git hooks (pre-commit linting)
├── backups/          # Database backup files (JSON)
├── docs/             # Project documentation
├── public/           # Static assets (favicon, icons, SEO files)
├── scripts/          # Database management utilities
├── src/              # Application source code
├── supabase/         # Supabase configuration & functions
└── tests/            # E2E tests (Playwright)
```

## Source Code (`src/`)

```
src/
├── components/       # UI components
│   ├── ui/           # Shadcn/ui base components
│   ├── admin/        # Admin panel components
│   ├── dashboard/    # Dashboard widgets
│   ├── results/      # Test results display
│   └── shared/       # Reusable components
├── features/         # Feature modules
│   ├── admin/        # Admin functionality
│   ├── analytics/    # Analytics & tracking
│   ├── auth/         # Authentication
│   ├── dashboard/    # Dashboard logic
│   ├── gamification/ # XP, achievements, streaks
│   ├── learning/     # AI learning path
│   ├── onboarding/   # User onboarding flow
│   ├── settings/     # User settings
│   ├── subscription/ # Pricing & payments
│   ├── testing/      # IELTS test modules
│   │   ├── listening/
│   │   ├── reading/
│   │   ├── speaking/
│   │   └── writing/
│   └── vocabulary/   # Vocabulary builder
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries (Supabase, parsers, etc.)
├── services/         # API service layer
├── shared/           # Shared utilities & components
├── styles/           # Global CSS
├── types/            # TypeScript type definitions
└── utils/            # Helper utilities
```

## Documentation (`docs/`)

```
docs/
├── audits/           # Source audit reports and historical expert reviews
├── plans/            # Approved design and implementation plans
├── reports/          # Dated operational, SEO, and research reports
└── *.md              # Maintained project reference guides
```

Keep dated third-party audit exports in `docs/audits/` and derived analysis in
`docs/reports/`. Generated test output and build artifacts should remain ignored rather than being
stored with maintained documentation.

## Supabase (`supabase/`)

```
supabase/
├── config.toml       # Supabase configuration
├── emails/           # Email templates
├── functions/        # Edge Functions (Deno)
├── migrations/       # SQL migrations (120+ files)
└── seed.sql          # Initial seed data
```

## Key Commands

| Action              | Command                           |
| ------------------- | --------------------------------- |
| **Dev Server**      | `npm run dev`                     |
| **Build**           | `npm run build`                   |
| **Unit Tests**      | `npm run test:unit`               |
| **E2E Tests**       | `npx playwright test`             |
| **Database Backup** | `node scripts/backup-database.js` |
| **Supabase Start**  | `supabase start`                  |
| **Push Migrations** | `supabase db push`                |

## Related Documentation

- [API.md](./API.md) - Edge Function reference
- [DATABASE.md](./DATABASE.md) - Database management
- [TESTING.md](./TESTING.md) - Testing guide
- [ADMIN_SECURITY.md](./ADMIN_SECURITY.md) - Admin access & security
