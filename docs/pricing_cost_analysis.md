# IELTS AI Pro — Pricing & AI Unit Economics Analysis

> **Document Version**: 2.0  
> **Last Updated**: September 23, 2026
> **Single Source of Truth**: [`../supabase/functions/_shared/aiModelRegistry.ts`](../supabase/functions/_shared/aiModelRegistry.ts)

---

## 📊 Executive Summary

IELTS AI Pro employs an intelligent multi-model routing architecture that optimizes for high evaluation accuracy, low latency, and healthy gross profit margins.

| Plan        | Monthly Price | Quarterly Price | Included AI Limits                                    | Estimated Cost / User | Target Margin   |
| ----------- | ------------- | --------------- | ----------------------------------------------------- | --------------------- | --------------- |
| **Free**    | $0            | —               | 5 Writing evaluations/mo                              | ~$0.05 / mo           | Lead Generation |
| **Pro**     | $9.99         | $24.99          | 100 Writing, 50 Speaking sessions/mo                  | ~$0.46 / mo           | **> 95.4%**     |
| **Premium** | $15.99        | $40.99          | 200 Writing, 100 Speaking sessions/mo + Adaptive Path | ~$0.86 / mo           | **> 94.6%**     |

---

## 🤖 Active AI Models & Registry Rates

Registry rates and scenario estimates below reflect the current `aiModelRegistry.ts`. They are token-based illustrations, not observed monthly averages; use recorded provider `usage.cost` values for actual unit economics. Run `npm run ai:models` to print the model map.

| Model Identifier                    | Primary Provider / Gateway | Input / 1M Tokens       | Cached Input / 1M | Output / 1M Tokens | Role                                                               |
| ----------------------------------- | -------------------------- | ----------------------- | ----------------- | ------------------ | ------------------------------------------------------------------ |
| `deepseek/deepseek-v4-flash-0731`   | OpenRouter                 | $0.04                   | $0.016            | $0.64              | Speaking scoring, Grammar, Learning Path                           |
| `openai/gpt-6-luna`                 | OpenRouter                 | $0.10                   | $0.010            | $0.50              | Writing and Speaking Deep Dive primary; Reading and Coach fallback |
| `gemini-2.5-flash`                  | Google Direct              | $0.30                   | $0.300            | $2.50              | Speaking Deep Dive and Writing fallback                            |
| `gemini-2.5-flash-lite`             | Google Direct              | $0.10                   | $0.100            | $0.40              | High-speed, lightweight fallback                                   |
| `@cf/openai/whisper-large-v3-turbo` | Cloudflare Workers AI      | Billed per audio minute | —                 | —                  | Real-time speech transcription                                     |
| `azure-pronunciation-assessment`    | Microsoft Azure Speech     | Billed per audio hour   | —                 | —                  | Acoustic phonological scoring                                      |
| `google-tts-neural2`                | Google Cloud TTS           | $16 / 1M characters     | —                 | —                  | Speaking fallback voice                                            |
| `gemini-3.8-flash-lite-tts`         | Google Direct              | $0.50                   | —                 | $6.00 (audio)      | Speaking exam voice; practice voice when rollout permits           |
| `google/gemini-3.8-flash-lite-tts`  | OpenRouter                 | $0.50                   | —                 | $6.00 (audio)      | Whole-clip fallback when direct Gemini streaming is unavailable    |

---

## 🛣️ AI Route Architecture & Unit Costs

### 1. Writing Detailed Feedback (`generateDetailedFeedback`)

- **Primary:** `openai/gpt-6-luna` (OpenRouter)
- **Fallback:** `gemini-2.5-flash` (Google Direct)
- **Average Payload:** 4,000 prompt tokens + 2,500 output tokens
- **Estimated single-pass cost:** **~$0.00165** at 4,000 input + 2,500 output tokens using standard rates; about **~$0.00129** if all input tokens are cache reads. Actual submissions may use up to three adaptive passes and include image tokens; recorded `usage.cost` is authoritative.

### 2. Speaking Band Scoring (`evaluateSpeakingTest`)

- **Primary:** `deepseek/deepseek-v4-flash-0731` (OpenRouter) with Azure acoustic evidence
- **Fallback:** `gemini-2.5-flash` (Google Direct)
- **Average Payload:** 3,000 prompt tokens + 1,000 output tokens
- **Estimated cost per test:** **~$0.00076** for 3,000 input + 1,000 output tokens at current standard rates (+ Azure acoustic analysis)

### 3. Speaking Deep-Dive Feedback (`generateDetailedSpeakingFeedback`)

- **Primary:** `openai/gpt-6-luna` (OpenRouter; reasoning disabled)
- **Fallback:** `gemini-2.5-flash` (Google Direct) after provider, JSON/schema, or transcript-grounding failure
- **Three-run deep-dive fixture cost:** **~$0.000699** per Luna response; the same Gemini fixture averaged **~$0.003920**. These are benchmark-fixture costs, not production usage averages; OpenRouter billed cost is used when returned, otherwise the registry estimate applies.

### 4. Grammar Lab Transfer (`evaluateGrammarTransfer`)

- **Primary:** `deepseek/deepseek-v4-flash-0731` (OpenRouter)
- **Fallback:** `deepseek-v4-flash` (Direct) → `gemini-2.5-flash-lite`
- **Average Cost per Drill:** **~$0.0003**

### 5. Adaptive Learning Path & Study Recommendations

- **Primary:** `deepseek/deepseek-v4-flash-0731` (OpenRouter)
- **Average Cost per Generation:** **~$0.0002**

---

## 💰 User Tier Economics & Profit Margins

The Speaking deep-dive budget below conservatively prices every request as a Gemini fallback at $0.0115 (5,000 input + 4,000 output tokens), even though Luna is now primary. The benchmark fixtures averaged $0.000699 per Luna response and $0.003920 per Gemini response, but their token volumes may differ from production. Use recorded route usage to replace this upper-bound assumption once enough live requests accumulate.

### Pro Plan ($9.99/mo) — Realistic Active Learner

- **Usage Profile**: 40 Writing submissions + 20 Speaking evaluations + daily Grammar/Learning Path queries.
- **AI Cost Breakdown**:
  - Writing: 40 × $0.00165 = $0.066 (single-pass, no cache or image tokens)
  - Speaking (Scoring + Deep Dive): 20 × ($0.00076 + $0.0115) = $0.2452
  - Grammar & Recommendations: $0.024
  - **Total AI Cost**: **~$0.335 / month**
- **Infrastructure (Supabase + Cloudflare R2 + Vercel)**: **~$0.12 / month**
- **Total Cost per Pro User**: **~$0.46 / month**
- **Net Margin**: ($9.99 - $0.4552) / $9.99 = **~95.4% Gross Margin**

### Premium Plan ($15.99/mo) — Heavy Learner

- **Usage Profile**: 80 Writing submissions + 40 Speaking evaluations + dynamic Adaptive Path updates.
- **AI Cost Breakdown**:
  - Writing: 80 × $0.00165 = $0.132 (single-pass, no cache or image tokens)
  - Speaking: 40 × ($0.00076 + $0.0115) = $0.4904
  - Grammar, Vocab & Adaptive Paths: $0.060
  - **Total AI Cost**: **~$0.682 / month**
- **Infrastructure Overhead**: **~$0.18 / month**
- **Total Cost per Premium User**: **~$0.86 / month**
- **Net Margin**: ($15.99 - $0.8624) / $15.99 = **~94.6% Gross Margin**

---

## 🛡️ Cost Control Safeguards

1. **SHA-256 Feedback Deduplication**: Identical essay submissions return cached results from `writing_evaluations` without invoking AI models or debiting user quota.
2. **Deterministic Idempotency Keys**: Network retries reuse reserved quota leases, preventing duplicate billings.
3. **Database-Enforced Tier Limits**: `tier_rate_limits` table enforces hard daily, monthly, and burst limits at the database layer before edge functions dispatch API calls.

---

## 🔍 Model Benchmarking & Testing

To benchmark candidate models against live production prompts for accuracy, latency, and cost:

```bash
# Print full model registry & fallback graph
npm run ai:models

# Benchmark a candidate model
npm run ai:bench -- --model openrouter/deepseek/deepseek-v4-flash-0731
```
