import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { withTextAiAdmission } from '../_shared/aiAdmission.ts';
import { handleWritingFeedback } from '../_shared/writingEvaluation.ts';
const synchronousFeedback = withTextAiAdmission('writing', handleWritingFeedback);
serve(async (req: Request) => {
  if (req.method !== 'OPTIONS') {
    try {
      // Submissions may join the durable queue while both workers are busy.
      // Authentication, origin checks, burst limits and quota remain in the handler.
      if ((await req.clone().json()).async === true) return handleWritingFeedback(req);
    } catch {
      /* The handler owns malformed-input responses. */
    }
  }
  return synchronousFeedback(req);
});
