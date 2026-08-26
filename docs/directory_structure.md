# Project Directory Structure

This document explains the organization of the IELTS AI Pro codebase.

## Root Directory

```
ielts-ai-pro/
├── .agent/           # AI agent configuration & workflows
├── .github/          # GitHub Actions workflows
├── .husky/           # Git hooks (pre-commit linting)
├── Blog/             # Public IELTS preparation blog markdown sources
├── backups/          # Database backup files (JSON)
├── docs/             # Maintained project documentation & guides
├── public/           # Static assets (favicon, icons, SEO files)
├── scripts/          # Database & operational utility scripts
├── src/              # Application source code
├── supabase/         # Supabase configuration, migrations & Edge Functions
└── tests/            # E2E & performance tests (Playwright, k6)
```

## Source Code (`src/`)

```
src/
├── components/       # UI components
│   ├── ui/           # Base Shadcn/Radix UI components
│   ├── admin/        # Admin panel components
│   ├── dashboard/    # Dashboard widgets & primitives
│   ├── results/      # Test results display
│   └── shared/       # Reusable components
├── features/         # Feature modules
│   ├── admin/        # Admin functionality
│   ├── analytics/    # Analytics & tracking
│   ├── auth/         # Authentication
│   ├── dashboard/    # Dashboard logic & study hub
│   ├── gamification/ # XP, achievements, streaks
│   ├── grammar/      # IELTS grammar guide & workbook
│   ├── learning/     # AI learning path & blog
│   ├── onboarding/   # User onboarding flow
│   ├── settings/     # User settings
│   ├── subscription/ # Pricing & payments
│   ├── testing/      # IELTS test modules
│   │   ├── listening/
│   │   ├── reading/
│   │   ├── speaking/
│   │   └── writing/
│   └── vocabulary/   # Vocabulary kits & builder
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries (Supabase, parsers, caches, etc.)
├── services/         # API service layer
├── shared/           # Shared utilities & components
├── styles/           # Global CSS
├── types/            # TypeScript type definitions
└── utils/            # Helper utilities
```

## Documentation (`docs/`)

```
docs/
├── audits/           # Domain audit references (e.g. AI feedback examiner audit)
├── ADMIN_SECURITY.md # Admin security & RLS model
├── API.md            # Edge Functions & API integration reference
├── DATABASE.md       # Database backup, restore & migration guide
├── TESTING.md        # Unit, integration, E2E & performance testing guide
├── USER_EXPERIENCE_GUIDE.md  # Core UX flows, journeys & dashboard guide
├── directory_structure.md    # Codebase layout reference
├── explanation_import_guide.md # AI reading explanation generation & import guide
├── posthog-product-analytics.md # Product analytics tracking contract
├── pricing_cost_analysis.md  # Pricing model, token usage & AI margin analysis
└── r2-storage-guide.md       # Cloudflare R2 media storage integration
```

## Supabase (`supabase/`)

```
supabase/
├── config.toml       # Supabase configuration
├── functions/        # Edge Functions (Deno / TypeScript)
│   ├── _shared/      # Shared AI models, auth, CORS & rate limit utilities
│   ├── generateDetailedFeedback/
│   ├── generateDetailedSpeakingFeedback/
│   ├── evaluateSpeakingTest/
│   ├── transcribeAudio/
│   ├── processSpeakingSession/
│   ├── generateAdaptiveLearningPath/
│   ├── generateStudyRecommendations/
│   ├── r2-upload/
│   ├── stripe-webhook/
│   └── ...
└── migrations/       # SQL migrations (schema, RLS, functions)
```

## Key Commands

| Action              | Command                           |
| ------------------- | --------------------------------- |
| **Dev Server**      | `npm run dev`                     |
| **Build**           | `npm run build`                   |
| **Unit Tests**      | `npm run test:unit`               |
| **E2E Tests**       | `npx playwright test`             |
| **Database Backup** | `node scripts/backup-database.js` |
| **AI Model Bench**  | `npm run ai:models`               |

## Related Documentation

- [API.md](./API.md) - Edge Function & API reference
- [DATABASE.md](./DATABASE.md) - Database management & migrations
- [TESTING.md](./TESTING.md) - Testing guide
- [ADMIN_SECURITY.md](./ADMIN_SECURITY.md) - Admin access & security
- [USER_EXPERIENCE_GUIDE.md](./USER_EXPERIENCE_GUIDE.md) - UX & Dashboard guide
