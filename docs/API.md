# API Reference

## Edge Functions

All Edge Functions are located in `supabase/functions/` and require authentication.

---

### generateDetailedFeedback

Generates AI-powered feedback for writing tasks.

**Endpoint:** `/functions/v1/generateDetailedFeedback`  
**Rate Limit:** 5 requests/minute

```javascript
import { generateDetailedFeedback } from '@/utils/api';

const feedback = await generateDetailedFeedback({
  writingText: "User's essay...",
  taskPrompt: 'Describe the chart...',
  taskType: 'Task 1',
  imageUrl: 'https://...', // optional
});
```

---

### generateStudyRecommendations

Generates personalized study recommendations.

**Endpoint:** `/functions/v1/generateStudyRecommendations`  
**Rate Limit:** 5 requests/minute  
**Cached:** 5 minutes

```javascript
import { generateStudyRecommendations } from '@/utils/api';

const recommendations = await generateStudyRecommendations(userId);
```

---

### generateAdaptiveLearningPath

Creates an adaptive learning path based on user performance.

**Endpoint:** `/functions/v1/generateAdaptiveLearningPath`  
**Rate Limit:** 5 requests/minute  
**Cached:** 5 minutes

```javascript
import { generateAdaptiveLearningPath } from '@/utils/api';

const learningPath = await generateAdaptiveLearningPath(userId);
```

---

### generateVocabularyDetails

Gets AI-generated vocabulary definitions and examples.

**Endpoint:** `/functions/v1/generateVocabularyDetails`  
**Rate Limit:** 5 requests/minute  
**Cached:** 30 minutes

```javascript
import { generateVocabularyDetails } from '@/utils/api';

const details = await generateVocabularyDetails('ubiquitous', 'context sentence');
```

---

### updateUserPoints

Updates gamification points for a user.

**Endpoint:** `/functions/v1/updateUserPoints`  
**Rate Limit:** 10 requests/minute

```javascript
import { updateUserPoints } from '@/utils/api';

await updateUserPoints(userId, 50);
// or
await updateUserPoints({ userId, points: 50, reason: 'test_complete' });
```

---

### invokeGemini

Generic Gemini API invocation.

**Endpoint:** `/functions/v1/invokeGemini`  
**Rate Limit:** 5 requests/minute

```javascript
import { invokeGemini } from '@/utils/api';

const response = await invokeGemini('Analyze this text: ...', {
  type: 'object',
  properties: { sentiment: { type: 'string' } },
});
```

---

## Utility Functions

### Rate Limiting

```javascript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimiter';

const { allowed, remaining, resetMs } = checkRateLimit('my-key', RATE_LIMITS.AI_OPERATION);
```

### Caching

```javascript
import { getFromCache, setInCache, CACHE_TTL } from '@/lib/apiCache';

const cached = getFromCache('my-key');
if (!cached) {
  const data = await fetchData();
  setInCache('my-key', data, CACHE_TTL.MEDIUM);
}
```
