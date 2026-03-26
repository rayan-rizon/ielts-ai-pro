# 🧪 Testing Guide: IELTS Ai Pro

Comprehensive documentation for the IELTS Ai Pro testing ecosystem. This guide covers how to run, maintain, and expand the testing suite.

---

## 📑 Table of Contents
1. [Testing Philosophy](#-testing-philosophy)
2. [The Testing Stack](#-the-testing-stack)
3. [Test Categories](#-test-categories)
4. [Running Tests](#-running-tests)
5. [Writing New Tests](#-writing-new-tests)
6. [Performance & Load Testing](#-performance--load-testing)
7. [Security Testing](#-security-testing)

---

## 🎯 Testing Philosophy
We follow a **"Confidence-First"** approach. Every core feature, database policy, and performance metric must be verified to ensure a premium, reliable experience for our users.

- **Zero Placeholders**: Tests must use realistic data, not `test1`, `test2`.
- **Performance Driven**: We don't just test if it works; we test how *fast* it works.
- **Security by Default**: Every database table must have verified RLS (Row Level Security) tests.

---

## 🛠 The Testing Stack

| Tool | Purpose | Scope |
| :--- | :--- | :--- |
| **Vitest** | Unit & Integration | Business logic, Hooks, State, Database Ops |
| **Playwright** | E2E & Perf Metrics | User journeys, Accessibility, SEO, Web Vitals |
| **k6** | Load Testing | Server stability, Concurrent user simulation |

---

## 📂 Test Categories

### 1. Unit & Logic Tests (`src/__tests__`)
Over **440 tests** covering the "brains" of the application.
- **Library Tests**: Validation schemas, security helpers, utility functions.
- **Hook Tests**: Custom React hooks (debounce, network status, etc.).
- **Feature Logic**: XP calculation, band score algorithms, spaced repetition.

### 2. Database Tests (`src/__tests__/database`)
Ensures the foundation of our data is bulletproof.
- **Schema**: Verifies tables, indexes, and foreign key constraints.
- **RLS Policies**: Crucial security tests to ensure users can only see their own data.
- **Data Integrity**: Validates that bad data (e.g., negative scores) never hits the DB.
- **Migrations**: Ensures database updates are safe and reversible.

### 3. State & Flow Tests (`src/__tests__/flow`)
Tests how data moves through the app.
- **Zustand Stores**: Verifies that state changes correctly across the session.
- **User Flow**: Onboarding steps, navigation guards, and access control.
- **Test Flow**: Sequential logic for taking Reading, Writing, and Listening tests.

### 4. E2E Tests (`tests/`)
Real browser interactions.
- **Authentication**: Login, Signup, Session persistence.
- **Test Taking**: The full journey of taking an IELTS test.
- **SEO & A11y**: Metadata verification and accessibility compliance (WCAG).

---

## 🚀 Running Tests

### Unit Tests
```bash
# Run all 440+ unit tests
npm run test:unit

# Run specific folder (e.g., Database)
npm run test:unit -- src/__tests__/database

# Watch mode for development
npm run test:unit:ui
```

### E2E Tests
*Note: Ensure the dev server (`npm run dev`) is running.*
```bash
# Run all E2E tests
npx playwright test

# Run a specific spec
npx playwright test tests/reading-test.spec.js

# Debugging mode (Headed)
npx playwright test --debug
```

### Performance Tests
```bash
# Browser Metrics (LCP, CLS, Load Time)
npx playwright test --config=playwright.perf.config.ts --project=chromium performance-metrics.spec.js

# Stress/Load Test (10 users, 30s)
k6 run tests/performance/quick-load.js
```

---

## ✍️ Writing New Tests

### 1. Naming Convention
Files should end in `.test.ts` (Vitest) or `.spec.js` (Playwright).
- `feature-name.test.ts` -> Logic/Unit
- `category/name.test.ts` -> Highly recommended for organization

### 2. Mocking Patterns
For Supabase/API calls, always use mocks to keep unit tests fast and independent.
```typescript
// Example Vitest Mock
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({ data: [], error: null })
    }))
  }
}));
```

### 3. Guidelines for Success
- **Atomic Tests**: One test should check exactly one thing.
- **Describe Blocks**: Group tests logically by function or scenario.
- **Setup/Teardown**: Use `beforeEach` to reset state/mocks between tests.

---

## 🏎 Performance & Load Testing
We monitor three main performance areas:

1. **Web Vitals**: We target LCP < 2.5s and CLS < 0.1.
2. **Logic Efficiency**: Unit tests in `src/__tests__/performance` verify that memoization and debouncing are actually working.
3. **Capacity**: k6 load tests ensure our infrastructure handles concurrent students without crashing.

---

## 🛡 Security Testing
Security is integrated into the testing pipeline:
- **XSS Prevention**: Tests for sanitization of user input.
- **Auth Bypass**: Verification that private routes are actually private.
- **Input Validation**: SQL/NoSQL injection attempt coverage.

---

## ❓ Troubleshooting
- **Playwright "No tests found"**: Ensure you are using the correct config file if running performance tests.
- **"Connection Refused" in k6**: Check if your local server is running on `[::1]:5173` (IPv6) or `127.0.0.1:5173` (IPv4). The current `quick-load.js` uses IPv6 loopback.
- **Failed Vitest Tests**: Check `vitest.config.js` to ensure the file pattern is included in the `include` array.
