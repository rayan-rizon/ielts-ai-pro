# API & Edge Functions Reference

## Overview

All backend logic that requires AI orchestration, third-party credentials, administrative operations, or secure file uploads runs on Supabase Edge Functions (`supabase/functions/`).

All Edge Functions require proper authentication via JWT (`Bearer <access_token>`) unless explicitly configured (e.g., Stripe webhooks with cryptographic signature verification).

---

## Core AI Edge Functions

### 1. `generateDetailedFeedback`

Evaluates IELTS Writing submissions (Task 1 and Task 2) against the four official IELTS criteria: Task Achievement/Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy.

- **Endpoint:** `/functions/v1/generateDetailedFeedback`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "writingText": "User's essay text...",
    "taskPrompt": "Describe the line graph showing...",
    "taskType": "Task 1",
    "imageUrl": "https://media.ieltsai.pro/..." // optional for Task 1 visual tasks
  }
  ```
- **Returns:** Structured JSON including criterion band scores, overall band, criteria-by-criteria breakdown, detailed strengths, improvement areas, corrected sentences, and model answer.

---

### 2. `generateDetailedSpeakingFeedback`

Provides in-depth analysis and scoring for an entire three-part IELTS Speaking test.

- **Endpoint:** `/functions/v1/generateDetailedSpeakingFeedback`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "sessionId": "uuid-of-speaking-session",
    "responses": [
      {
        "partNumber": 1,
        "question": "Do you work or are you a student?",
        "transcript": "I am currently working as a software engineer...",
        "audioUrl": "https://..."
      }
    ]
  }
  ```
- **Returns:** Criterion scores (FC, LR, GRA, PR), overall score, pronunciation insights, lexical upgrades, and grammar corrections.

---

### 3. `evaluateSpeakingTest` / `processSpeakingSession`

Real-time evaluator for interactive speaking sessions with AI examiner Luna.

- **Endpoint:** `/functions/v1/processSpeakingSession`
- **Method:** `POST`
- **Handles:** Turn-by-turn conversational flow, dynamic examiner follow-up questions, and real-time audio pipeline coordination.

---

### 4. `transcribeAudio`

Transcribes recorded learner audio using speech-to-text models.

- **Endpoint:** `/functions/v1/transcribeAudio`
- **Method:** `POST`
- **Payload:** FormData with audio blob or audio URL.
- **Returns:** `{ "transcript": "...", "confidence": 0.98, "words": [...] }`

---

### 5. `generateAdaptiveLearningPath`

Generates a dynamic, personalized study curriculum based on the learner's test history and weak skill areas.

- **Endpoint:** `/functions/v1/generateAdaptiveLearningPath`
- **Method:** `POST`
- **Payload:** `{ "userId": "uuid", "targetBand": 7.5, "examDate": "2026-10-15" }`
- **Returns:** Structured milestone plan with daily tasks, skill-specific drills, and review milestones.

---

### 6. `generateStudyRecommendations`

Computes immediate study recommendations for the dashboard study hub.

- **Endpoint:** `/functions/v1/generateStudyRecommendations`
- **Method:** `POST`
- **Payload:** `{ "userId": "uuid" }`
- **Returns:** Array of prioritized recommendations (e.g. grammar focus, vocabulary flashcard kits, mock exams).

---

## Media & Storage Edge Functions

### `r2-upload`

Handles secure presigned upload authorization and multipart file validation for Cloudflare R2 object storage (`https://media.ieltsai.pro`).

- **Endpoint:** `/functions/v1/r2-upload`
- **Authorization:** Admin only (enforced via DB role check).
- **Features:** File signature validation, payload size guard, rate limiting, and filename sanitization.

---

## Billing & Subscription Edge Functions

### 1. `create-checkout-session`

Initializes a Stripe Checkout session for Pro or Premium subscriptions.

- **Endpoint:** `/functions/v1/create-checkout-session`
- **Payload:** `{ "priceId": "price_...", "successUrl": "...", "cancelUrl": "..." }`

### 2. `create-customer-portal`

Generates a Stripe Customer Portal link for managing subscriptions and invoices.

- **Endpoint:** `/functions/v1/create-customer-portal`

### 3. `stripe-webhook`

Handles asynchronous Stripe billing events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`).

- **Endpoint:** `/functions/v1/stripe-webhook`
- **Verification:** Cryptographic signature check with `STRIPE_WEBHOOK_SECRET`.

---

## Client Integration Utilities

### Calling Edge Functions (`src/utils/api.js`)

Use `callEdgeFunction` for standardized authentication, rate limiting, and response handling:

```javascript
import { callEdgeFunction } from '@/utils/api';

const feedback = await callEdgeFunction(
  'generateDetailedFeedback',
  {
    writingText: essayText,
    taskPrompt: promptText,
    taskType: 'Task 2',
  },
  {
    rateLimit: { maxRequests: 5, windowMs: 60000 },
  }
);
```

### Rate Limiting (`src/lib/rateLimiter.js`)

Client-side rate limit guards for user interactions:

```javascript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimiter';

const { allowed, resetMs } = checkRateLimit('api:writing_feedback', RATE_LIMITS.AI_OPERATION);
```
