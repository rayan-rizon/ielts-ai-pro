# IELTS Ai Pro - Pricing & Cost Analysis

> **Document Version**: 1.1  
> **Last Updated**: 2026-02-09  
> **Pricing Plan**: Option A (Budget-Friendly)

---

## Executive Summary

This document provides a comprehensive breakdown of the pricing structure, AI feature costs, infrastructure expenses, and profit margin analysis for IELTS Ai Pro.

| Plan        | Monthly Price | Quarterly Price | Key Limits                  |
| ----------- | ------------- | --------------- | --------------------------- |
| **Free**    | $0            | -               | 5 AI Writing/mo, 0 Speaking |
| **Pro**     | $9.99         | $24.99          | 100 Writing, 50 Speaking    |
| **Premium** | $15.99        | $40.99          | 200 Writing, 100 Speaking   |

**Target Profit Margin**: 80%+  
**Achieved Profit Margin**: ~95%

---

## 1. AI Features & Token Usage

### 1.1 Gemini API Pricing (gemini-1.5-flash)

| Token Type    | Cost per 1M Tokens |
| ------------- | ------------------ |
| Input Tokens  | $0.075             |
| Output Tokens | $0.30              |

> **Note**: `gemini-2.0-flash-exp` is currently FREE but will be deprecated on **February 6, 2026**.

### 1.2 AI Function Token Consumption

| Function                       | Purpose            | Avg Input | Avg Output | Cost/Call   |
| ------------------------------ | ------------------ | --------- | ---------- | ----------- |
| `generateDetailedFeedback`     | Writing evaluation | 4,000     | 2,000      | **$0.0009** |
| `processSpeakingSession`       | Speaking mock test | 3,000     | 1,500      | **$0.0015** |
| `generateAdaptiveLearningPath` | Learning path      | 2,500     | 3,000      | **$0.0010** |
| `generateStudyRecommendations` | Study tips         | 2,000     | 2,000      | **$0.0008** |
| `transcribeAudio`              | Audio to SRT       | 2,000     | 8,000      | **$0.0026** |

### 1.3 Weighted Average Cost Per AI Call

```
Writing Feedback:  $0.0009/call
Speaking Session:  $0.0015/call
Other AI:          $0.0010/call (average)
```

---

## 2. User Tier AI Usage Projections

### 2.1 Monthly AI Call Allocation

| Tier    | Writing Evaluations | Speaking Sessions | Total AI Calls |
| ------- | ------------------- | ----------------- | -------------- |
| Free    | 5                   | 0                 | 5              |
| Pro     | 100                 | 50                | 150            |
| Premium | 200                 | 100               | 300            |

### 2.2 Estimated Actual Usage (Based on User Behavior)

Most users don't max out their limits. Realistic usage estimates:

| Tier    | Est. Writing Used | Est. Speaking Used | Total Used |
| ------- | ----------------- | ------------------ | ---------- |
| Free    | 3                 | 0                  | 3          |
| Pro     | 40                | 20                 | 60         |
| Premium | 80                | 40                 | 120        |

---

## 3. Cost Per User Per Month

### 3.1 AI Cost Calculation

**Formula**: `(Writing Used × $0.0009) + (Speaking Used × $0.0015)`

| Tier    | Writing Cost          | Speaking Cost         | Total AI Cost |
| ------- | --------------------- | --------------------- | ------------- |
| Free    | 3 × $0.0009 = $0.003  | $0                    | **$0.003**    |
| Pro     | 40 × $0.0009 = $0.036 | 20 × $0.0015 = $0.030 | **$0.066**    |
| Premium | 80 × $0.0009 = $0.072 | 40 × $0.0015 = $0.060 | **$0.132**    |

### 3.2 Infrastructure Cost Per User

| Component                 | Free      | Pro       | Premium   |
| ------------------------- | --------- | --------- | --------- |
| Supabase (DB, Auth, Edge) | $0.02     | $0.05     | $0.08     |
| Storage & Bandwidth       | $0.01     | $0.03     | $0.05     |
| Other Overhead            | $0.01     | $0.02     | $0.03     |
| **Total Infrastructure**  | **$0.04** | **$0.10** | **$0.16** |

### 3.3 Total Cost Per User Per Month

| Tier    | AI Cost | Infrastructure | **Total Cost** |
| ------- | ------- | -------------- | -------------- |
| Free    | $0.003  | $0.04          | **$0.043**     |
| Pro     | $0.066  | $0.10          | **$0.166**     |
| Premium | $0.132  | $0.16          | **$0.292**     |

---

## 4. Pricing & Profit Margin Analysis

### 4.1 Monthly Pricing

| Tier    | Price  | Cost   | Profit  | **Margin**     |
| ------- | ------ | ------ | ------- | -------------- |
| Free    | $0     | $0.043 | -$0.043 | N/A (Lead Gen) |
| Pro     | $9.99  | $0.166 | $9.824  | **98.3%**      |
| Premium | $15.99 | $0.292 | $15.698 | **98.2%**      |

### 4.2 Quarterly Pricing (15% Discount)

| Tier    | Quarterly Price | Per-Month Effective | Margin    |
| ------- | --------------- | ------------------- | --------- |
| Pro     | $24.99          | $8.33               | **98.0%** |
| Premium | $40.99          | $13.66              | **97.9%** |

---

## 5. Revenue Projections

### 5.1 Scenario: 1,000 Monthly Active Users

| Distribution  | Users | Monthly Revenue |
| ------------- | ----- | --------------- |
| Free (70%)    | 700   | $0              |
| Pro (20%)     | 200   | $1,998          |
| Premium (10%) | 100   | $1,599          |
| **Total**     | 1,000 | **$3,597**      |

### 5.2 Cost Analysis

| Cost Component                            | Monthly     |
| ----------------------------------------- | ----------- |
| Free users (700 × $0.043)                 | $30.10      |
| Pro users (200 × $0.166)                  | $33.20      |
| Premium users (100 × $0.292)              | $29.20      |
| Fixed infrastructure (Supabase Pro, etc.) | $55.00      |
| **Total Cost**                            | **$147.50** |

### 5.3 Profit Summary

| Metric             | Value         |
| ------------------ | ------------- |
| Monthly Revenue    | $3,597        |
| Monthly Cost       | $147.50       |
| **Monthly Profit** | **$3,449.50** |
| **Profit Margin**  | **95.9%**     |

---

## 6. Feature Matrix

### 6.1 Free Plan - "Explorer"

| Category    | Feature                          |
| ----------- | -------------------------------- |
| Reading     | ✅ Unlimited Tests               |
| Reading     | ✅ All Cambridge Reading Tests   |
| Listening   | ✅ Unlimited Tests               |
| Listening   | ✅ All Cambridge Listening Tests |
| Writing     | ✅ 3 Practice Tests              |
| Writing     | ✅ 5 AI Evaluations/month        |
| Speaking    | ❌ Not Available                 |
| Vocabulary  | ✅ 20 Words                      |
| Analytics   | ✅ Basic Stats                   |
| AI Features | ❌ Locked                        |

### 6.2 Pro Plan - "Achiever" ($9.99/mo)

| Category   | Feature                           |
| ---------- | --------------------------------- |
| Writing    | ✅ Unlimited Tests                |
| Writing    | ✅ **100 AI Evaluations/month**   |
| Speaking   | ✅ **50 AI Sessions/month**       |
| Vocabulary | ✅ **300 Words**                  |
| Cambridge  | ✅ All Tests (R, L, W, S)         |
| Analytics  | ✅ Advanced Performance Analytics |
| AI         | ✅ Study Recommendations          |

### 6.3 Premium Plan - "Band 8+" ($15.99/mo)

| Category   | Feature                         |
| ---------- | ------------------------------- |
| Writing    | ✅ **200 AI Evaluations/month** |
| Speaking   | ✅ **100 AI Sessions/month**    |
| Vocabulary | ✅ **Unlimited**                |
| AI         | ✅ Adaptive Learning Path       |
| AI         | ✅ Deep Predictive Insights     |
| Extras     | ✅ Downloadable Study Packs     |
| Community  | ✅ Exclusive Access             |

---

## 7. Rate Limits (Database Configuration)

### 7.1 `tier_rate_limits` Table Values

| Tier    | Daily Limit | Monthly Limit | Burst Limit |
| ------- | ----------- | ------------- | ----------- |
| free    | 5           | 5             | 3           |
| pro     | 20          | 150           | 12          |
| premium | 50          | 300           | 25          |
| admin   | 1000        | 10000         | 50          |

### 7.2 Migration File

Location: `supabase/migrations/20260116040000_update_tier_limits.sql`

---

## 8. Worst-Case Cost Analysis

If all users max out their AI limits:

### 8.1 Max Usage Costs

| Tier    | Max Writing   | Max Speaking  | Max AI Cost |
| ------- | ------------- | ------------- | ----------- |
| Free    | 5 × $0.0009   | 0             | $0.0045     |
| Pro     | 100 × $0.0009 | 50 × $0.0015  | $0.165      |
| Premium | 200 × $0.0009 | 100 × $0.0015 | $0.33       |

### 8.2 Worst-Case Monthly (1,000 Users)

| Component                     | Cost        |
| ----------------------------- | ----------- |
| Free (700 × $0.0045 + $0.04)  | $31.15      |
| Pro (200 × $0.165 + $0.10)    | $53.00      |
| Premium (100 × $0.33 + $0.16) | $49.00      |
| Infrastructure                | $55.00      |
| **Total**                     | **$188.15** |

**Worst-Case Profit**: $3,597 - $188.15 = **$3,408.85 (94.8%)**

---

## 9. Competitive Analysis

| Platform         | Pro Price       | Premium Price | Notes                          |
| ---------------- | --------------- | ------------- | ------------------------------ |
| **IELTS Ai Pro** | $9.99           | $15.99        | AI-first, budget-friendly      |
| E2Language       | $29             | $59           | Higher price, similar features |
| IELTS Advantage  | $39             | $99           | Premium positioning            |
| Magoosh IELTS    | $129 (one-time) | -             | No subscription model          |

**Our Advantage**: Most affordable AI-powered IELTS prep with generous limits.

---

## 10. Key Metrics & KPIs

| Metric                | Target | Current Setup               |
| --------------------- | ------ | --------------------------- |
| Free → Pro Conversion | 15-20% | Optimized feature gating    |
| Pro → Premium Upgrade | 10-15% | Upsell on AI learning path  |
| Churn Rate (Pro)      | < 5%   | High value features         |
| LTV (Pro, Quarterly)  | $75+   | 3+ quarters retention       |
| CAC Target            | < $10  | Organic + content marketing |

---

## Document History

| Version | Date       | Changes                                |
| ------- | ---------- | -------------------------------------- |
| 1.0     | 2026-01-16 | Initial comprehensive pricing document |
| 1.1     | 2026-02-09 | Updated version metadata               |
