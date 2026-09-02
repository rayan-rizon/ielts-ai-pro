# IELTS AI Pro — Pricing & AI Unit Economics Analysis

> **Document Version**: 2.0  
> **Last Updated**: August 27, 2026  
> **Single Source of Truth**: [`../supabase/functions/_shared/aiModelRegistry.ts`](../supabase/functions/_shared/aiModelRegistry.ts)

---

## 📊 Executive Summary

IELTS AI Pro employs an intelligent multi-model routing architecture that optimizes for high evaluation accuracy, low latency, and healthy gross profit margins.

| Plan        | Monthly Price | Quarterly Price | Included AI Limits                                    | Estimated Cost / User | Target Margin   |
| ----------- | ------------- | --------------- | ----------------------------------------------------- | --------------------- | --------------- |
| **Free**    | $0            | —               | 5 Writing evaluations/mo                              | ~$0.05 / mo           | Lead Generation |
| **Pro**     | $9.99         | $24.99          | 100 Writing, 50 Speaking sessions/mo                  | ~$0.45 / mo           | **> 94.5%**     |
| **Premium** | $15.99        | $40.99          | 200 Writing, 100 Speaking sessions/mo + Adaptive Path | ~$1.10 / mo           | **> 93.0%**     |

---

## 🤖 Active AI Models & Registry Rates

All rates in production are governed dynamically by `aiModelRegistry.ts`. Run `npm run ai:models` to print the live rate matrix.

| Model Identifier                    | Primary Provider / Gateway | Input / 1M Tokens       | Cached Input / 1M | Output / 1M Tokens | Role                                     |
| ----------------------------------- | -------------------------- | ----------------------- | ----------------- | ------------------ | ---------------------------------------- |
| `deepseek/deepseek-v4-flash-0731`   | OpenRouter                 | $0.06                   | $0.012            | $0.12              | Speaking scoring, Grammar, Learning Path |
| `openai/gpt-5.6-luna`               | OpenRouter                 | $0.20                   | $0.020            | $1.20              | Writing Detailed Feedback (Primary)      |
| `gemini-2.5-flash`                  | Google Direct              | $0.30                   | $0.300            | $2.50              | Speaking Deep Dive & Writing Fallback    |
| `gemini-2.5-flash-lite`             | Google Direct              | $0.10                   | $0.100            | $0.40              | High-speed, lightweight fallback         |
| `@cf/openai/whisper-large-v3-turbo` | Cloudflare Workers AI      | Billed per audio minute | —                 | —                  | Real-time speech transcription           |
| `azure-pronunciation-assessment`    | Microsoft Azure Speech     | Billed per audio hour   | —                 | —                  | Acoustic phonological scoring            |
| `google-tts-neural2`                | Google Cloud TTS           | $16.00 / 1M characters  | —                 | —                  | Luna examiner voice synthesis            |

---

## 🛣️ AI Route Architecture & Unit Costs

### 1. Writing Detailed Feedback (`generateDetailedFeedback`)

- **Primary:** `openai/gpt-5.6-luna` (OpenRouter)
- **Fallback:** `gemini-2.5-flash` (Google Direct)
- **Average Payload:** 4,000 prompt tokens + 2,500 output tokens
- **Average Cost per Submission:** **~$0.0035** (drops to **~$0.0018** on prompt cache hits)

### 2. Speaking Band Scoring (`evaluateSpeakingTest`)

- **Primary:** `deepseek/deepseek-v4-flash-0731` (OpenRouter) with Azure acoustic evidence
- **Fallback:** `gemini-2.5-flash` (Google Direct)
- **Average Payload:** 3,000 prompt tokens + 1,000 output tokens
- **Average Cost per Test:** **~$0.0003** (+ Azure acoustic analysis)

### 3. Speaking Deep-Dive Feedback (`generateDetailedSpeakingFeedback`)

- **Primary:** `gemini-2.5-flash` (Google Direct)
- **Average Payload:** 5,000 prompt tokens + 4,000 output tokens
- **Average Cost per Evaluation:** **~$0.0115**

### 4. Grammar Lab Transfer (`evaluateGrammarTransfer`)

- **Primary:** `deepseek/deepseek-v4-flash-0731` (OpenRouter)
- **Fallback:** `deepseek-v4-flash` (Direct) → `gemini-2.5-flash-lite`
- **Average Cost per Drill:** **~$0.0003**

### 5. Adaptive Learning Path & Study Recommendations

- **Primary:** `deepseek/deepseek-v4-flash-0731` (OpenRouter)
- **Average Cost per Generation:** **~$0.0002**

---

## 💰 User Tier Economics & Profit Margins

### Pro Plan ($9.99/mo) — Realistic Active Learner

- **Usage Profile**: 40 Writing submissions + 20 Speaking evaluations + daily Grammar/Learning Path queries.
- **AI Cost Breakdown**:
  - Writing: 40 × $0.0035 = $0.140
  - Speaking (Scoring + Deep Dive): 20 × ($0.0003 + $0.0115) = $0.236
  - Grammar & Recommendations: $0.024
  - **Total AI Cost**: **~$0.400 / month**
- **Infrastructure (Supabase + Cloudflare R2 + Vercel)**: **~$0.12 / month**
- **Total Cost per Pro User**: **~$0.52 / month**
- **Net Margin**: ($9.99 - $0.52) / $9.99 = **94.8% Gross Margin**

### Premium Plan ($15.99/mo) — Heavy Learner

- **Usage Profile**: 80 Writing submissions + 40 Speaking evaluations + dynamic Adaptive Path updates.
- **AI Cost Breakdown**:
  - Writing: 80 × $0.0035 = $0.280
  - Speaking: 40 × ($0.0003 + $0.0115) = $0.472
  - Grammar, Vocab & Adaptive Paths: $0.060
  - **Total AI Cost**: **~$0.812 / month**
- **Infrastructure Overhead**: **~$0.18 / month**
- **Total Cost per Premium User**: **~$0.99 / month**
- **Net Margin**: ($15.99 - $0.99) / $15.99 = **93.8% Gross Margin**

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
