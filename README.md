# IELTS AI Pro 🚀

> **Next-Generation AI-Powered IELTS Preparation Platform**  
> Complete Cambridge-style practice tests, real-time AI Speaking examiner (Luna), multi-criteria Writing grading, Paraphrase Detective, Grammar Lab, and adaptive personalized study paths.

---

## 🌟 Key Features

- **🎙️ Luna AI Speaking Examiner**: Turn-by-turn interactive voice mock tests simulating official IELTS interviews with acoustic pronunciation assessment and dynamic follow-ups.
- **✍️ Multi-Criteria Writing Evaluator**: Instant grading for Task 1 and Task 2 against official IELTS criteria (TA/TR, CC, LR, GRA) with sentence-by-sentence rewrites and model answers.
- **🔍 Paraphrase Detective**: Interactive Reading analysis showing passage evidence, synonym mappings, and distractor explanations.
- **🧪 Grammar Lab & Transfer**: Targeted grammatical practice with automated transfer evaluation to essays and speech.
- **📚 Curated Vocabulary Kits**: 20 categories of high-frequency IELTS vocabulary with spaced-repetition flashcards.
- **📈 Adaptive Learning Path**: Dynamic study curriculum generated from learner test history and skill weakness radar.
- **📊 Learner Mission Control**: High-density instrument panel with weekly momentum, skill balance, streak tracker, and band score forecast.

---

## 🛠️ Technology Stack

| Layer                         | Technologies                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**                  | React 18, Vite, Tailwind CSS, Framer Motion, Radix UI Primitives, Lucide Icons                                                                           |
| **Backend / DB**              | Supabase (PostgreSQL with RLS, Auth, pgvector), Deno Edge Functions                                                                                      |
| **AI Models**                 | DeepSeek V4 Flash, OpenAI GPT-5.6 Luna, Google Gemini 2.5 Flash / Lite, Cloudflare Workers AI Whisper, Azure Speech Assessment, Google Cloud Neural2 TTS |
| **Storage & CDN**             | Cloudflare R2 Object Storage (`https://media.ieltsai.pro`)                                                                                               |
| **Payments**                  | Stripe Subscriptions + Manual Regional Payment Workflows (bKash/Nagad)                                                                                   |
| **Analytics & Observability** | PostHog Product Analytics, Sentry Error Monitoring                                                                                                       |

---

## 🤖 AI Model Architecture & Registry

All AI routing, prompt safety, fallback chains, and pricing are defined in a single source of truth:  
👉 [`supabase/functions/_shared/aiModelRegistry.ts`](./supabase/functions/_shared/aiModelRegistry.ts)

- **View Active AI Routes & Pricing**: `npm run ai:models`
- **Benchmark Candidate Models**: `npm run ai:bench -- --model <openrouter-id>`

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: >= 20.x
- **npm**: >= 10.x
- **Supabase CLI** (optional for Edge Function deployment)

### 2. Installation & Setup

```bash
# Clone repository
git clone https://github.com/your-org/ielts-ai-pro.git
cd ielts-ai-pro

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase and provider credentials
```

### 3. Running Locally

```bash
# Start Vite development server
npm run dev

# Build for production
npm run build
```

---

## 🧪 Testing Suite

The repository contains **1,250+ automated unit, integration, and flow tests**:

```bash
# Run full unit/integration test suite
npm run test:unit

# Run tests in interactive UI mode
npm run test:unit:ui

# Run Playwright E2E browser tests
npx playwright test

# Run AI route inspection
npm run ai:models
```

---

## 📚 Project Documentation

Maintained technical documentation is organized in [`docs/`](./docs/):

- 🔌 **[API & Edge Functions Reference](./docs/API.md)** — Edge function endpoints, payloads, auth, and client calling conventions.
- 🗄️ **[Database Management Guide](./docs/DATABASE.md)** — Schema overview, migration workflows, backup/restore scripts, and safety rules.
- 💰 **[Pricing & AI Cost Analysis](./docs/pricing_cost_analysis.md)** — Multi-model unit economics, token rates, and tier gross margins.
- 🎨 **[Design System Guide (DESIGN.md)](./DESIGN.md)** — Learner Panel Design System tokens, typography, surfaces, and micro-interactions.
- 🛡️ **[Admin Security Guide](./docs/ADMIN_SECURITY.md)** — Role management, privilege escalation defense, and RLS rules.
- 📈 **[PostHog Product Analytics](./docs/posthog-product-analytics.md)** — Telemetry contracts, acquisition funnels, and learner activation tracking.

---

## 📜 License & Compliance

All rights reserved. Cambridge English test materials are property of Cambridge University Press & Assessment and used for simulated practice preparation.
