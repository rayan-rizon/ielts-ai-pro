import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';
// @ts-ignore
import {
  getCorsHeaders,
  handleCorsPrelight,
  checkRateLimit,
  getRateLimitIdentifier,
  rateLimitedResponse,
  validateCsrfProtection,
  errorResponse,
  checkDatabaseQuota,
  logApiUsage,
  quotaExceededResponse,
  getBurstLimitConfig,
} from '../_shared/security.ts';

// @ts-ignore
declare const Deno: any;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is not configured');
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req);
  }

  try {
    const csrfCheck = validateCsrfProtection(req);
    if (!csrfCheck.valid) {
      return errorResponse(csrfCheck.error || 'CSRF validation failed', 403, corsHeaders);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('INTERNAL_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('INTERNAL_SERVICE_ROLE_KEY');

    console.log('Function Debug - URL:', !!supabaseUrl, 'Key:', !!supabaseKey);

    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    console.log('Auth Header present:', !!authHeader);

    let user = null;
    let authError = null;

    try {
      const result = await supabase.auth.getUser(authHeader?.split(' ')[1]);
      user = result.data?.user;
      authError = result.error;
      console.log('Auth result - user:', !!user, 'error:', authError?.message || 'none');
    } catch (e: any) {
      console.error('Auth exception:', e.message);
      authError = e;
    }

    if (authError || !user) {
      console.error('Auth failed:', authError?.message || 'No user found');
      return errorResponse('Unauthorized: ' + (authError?.message || 'No user'), 401, corsHeaders);
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, subscription_tier')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile check failed:', profileError);
      return errorResponse('User profile not found', 404, corsHeaders);
    }

    const tier = userProfile?.subscription_tier || 'free';

    const rateLimitId = getRateLimitIdentifier(req, user.id);
    const burstConfig = getBurstLimitConfig(tier);
    const burstCheck = checkRateLimit(rateLimitId, burstConfig);

    if (!burstCheck.allowed) {
      return rateLimitedResponse(burstCheck.resetIn, corsHeaders);
    }

    const quotaCheck = await checkDatabaseQuota(supabase, user.id, tier, 'writing');
    if (!quotaCheck.allowed) {
      return quotaExceededResponse(quotaCheck, corsHeaders);
    }

    if (tier !== 'pro' && tier !== 'premium' && tier !== 'admin' && tier !== 'free') {
      return new Response(
        JSON.stringify({ error: 'This feature is available for Pro and Premium users only.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service is not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { writingText, taskPrompt, taskType, imageUrl } = await req.json();

    if (!writingText || !taskPrompt) {
      return new Response(JSON.stringify({ error: 'Writing text and task prompt are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (taskType === 'Task 1' && !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required for Task 1 evaluation.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemInstruction = `
You are an IELTS Academic Writing examiner and writing coach. Score and give feedback strictly using official IELTS Academic band descriptors.

Primary goals:
1) Produce accurate band scores and criterion breakdown.
2) Provide actionable, high-impact improvements to maximize scoring potential for the next attempt.
3) Highlight both issues and strong features (so the student repeats what works).

Hard rules (must follow):
- Output JSON ONLY. No markdown, no code fences, no extra text.
- Do not invent facts, data, or errors not present in the student's writing.
- When unsure, be conservative and explain uncertainty in "weaknesses" or "suggestions".
- Use IELTS bands in 0.5 steps (e.g., 6.0, 6.5, 7.0). All criteria scores must be 0.5-step numbers.
- Compute overallBand as the average of the four criteria scores, rounded to the nearest 0.5.

Annotation rules (for inline issue mapping):
- "originalText" MUST be an exact substring copied from the student's writing (case and punctuation should match).
- Keep "originalText" short (1–7 words) and unique when possible.
- Do not use character indices.
- "type" must be one of: "grammar", "spelling", "style", "vocabulary", "clarity", "positive".
- "severity" must be one of: "error", "warning", "suggestion", "positive".
- Provide at most 15 annotations total. Prioritize recurring and high band-impact issues.

Feedback focus (IELTS Academic standard):
- Task Achievement/Response: address all parts, clear overview/thesis, relevant support, accurate reporting (Task 1) or clear position (Task 2).
- Coherence and Cohesion: paragraphing, logical progression, topic sentences, referencing, cohesive devices used naturally (not overused).
- Lexical Resource: precise academic word choice, range with control, collocations, avoid repetition, avoid memorized phrases, correct spelling/word forms.
- Grammatical Range and Accuracy: mix of complex and simple structures, control, punctuation, sentence boundaries, article/preposition accuracy.

Output schema (exact keys):
{
  "overallBand": number,
  "criteriaScores": {
    "TaskAchievement": number,
    "CoherenceAndCohesion": number,
    "LexicalResource": number,
    "GrammaticalRangeAndAccuracy": number
  },
  "annotations": [
    {
      "originalText": string,
      "type": "grammar" | "spelling" | "style" | "vocabulary" | "clarity" | "positive",
      "suggestion": string,
      "explanation": string,
      "severity": "error" | "warning" | "suggestion" | "positive"
    }
  ],
  "strengths": [string],
  "weaknesses": [string],
  "suggestions": [string],
  "corrections": [
    { "original": string, "correction": string, "explanation": string }
  ],
  "vocabularyEnhancements": [
    { "original": string, "alternatives": [string, string], "context": string }
  ]
}

Content guidelines:
- strengths: 3–6 bullets, each tied to a criterion and what it does well.
- weaknesses: 3–6 bullets, each tied to a criterion and why it limits the band.
- suggestions: 5–10 bullets, ordered by biggest band gain first; write as concrete actions (e.g., "Add a clear overview sentence comparing highest vs lowest trends.").
- corrections: 5–12 items. Prefer full-sentence or clause-level fixes. Keep "original" copied from the student's writing.
- vocabularyEnhancements: 5–10 items. Focus on high-frequency weak words and better academic alternatives that fit the student's context. Do not suggest unnatural synonyms.

If the student's writing is extremely short/off-topic, still return valid JSON and score accordingly with clear justification in weaknesses/suggestions.
`;

    const userContentParts: any[] = [];

    if (taskType === 'Task 1') {
      systemInstruction += `
Task type: IELTS Academic Writing Task 1 (report).

Task 1 high-band expectations:
- Give a clear overview (1–2 sentences) summarizing the main trends/most significant features.
- Select key features only; avoid listing every data point.
- Make accurate comparisons (higher/lower, increases/decreases, peaks, major differences).
- Use appropriate academic Task 1 language (e.g., "increased", "remained stable", "accounted for", "approximately").
- Avoid opinions, causes, predictions, or recommendations unless the prompt explicitly asks.

Visual accuracy rules:
- Compare the writing strictly to the image data. Do not guess values you cannot infer from the image.
- If the image is unclear/unreadable, state that limitation indirectly via weaknesses (do not invent numbers).
`;

      userContentParts.push({
        text: `Task Prompt: ${taskPrompt}\n\nStudent's Response:\n${writingText}`,
      });

      if (imageUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const imageResp = await fetch(imageUrl, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!imageResp.ok) throw new Error(`Failed to fetch image: ${imageResp.status}`);

          const imageBlob = await imageResp.blob();
          const arrayBuffer = await imageBlob.arrayBuffer();
          const base64Image = btoa(
            new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          userContentParts.push({
            inline_data: {
              mime_type: imageBlob.type,
              data: base64Image,
            },
          });
        } catch (e) {
          console.error('Failed to fetch image for Gemini:', e);
        }
      }
    } else {
      systemInstruction += `
Task type: IELTS Academic Writing Task 2 (essay).

Task 2 high-band expectations:
- Address all parts of the prompt. Maintain a clear position throughout.
- Use a strong introduction with a direct thesis (no generic memorized openings).
- Use 4–5 paragraphs with clear topic sentences and logical progression.
- Develop ideas with explanation + specific example (avoid vague/general statements).
- Use cohesive devices naturally (avoid overusing "Firstly/Secondly/Moreover").
- Maintain formal academic tone: avoid contractions, slang, and overly emotional language.

When scoring Task Response:
- Penalize off-topic content, unclear position, underdeveloped ideas, and irrelevant examples.
- Reward clear argument structure, well-extended reasoning, and precise addressing of the question.
`;
      userContentParts.push({
        text: `Task Prompt: ${taskPrompt}\n\nStudent's Essay:\n${writingText}`,
      });
    }

    const normalizeText = (text: string) => text ? text.replace(/\\s+/g, ' ').trim() : '';
    const hashInput = JSON.stringify({
      writingText: normalizeText(writingText),
      taskPrompt: normalizeText(taskPrompt),
      taskType,
      imageUrl
    });
    const encode = new TextEncoder().encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encode);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const { data: cachedEntry } = await supabase
      .from('ai_feedback_cache')
      .select('feedback_json')
      .eq('input_hash', inputHash)
      .single();

    if (cachedEntry && cachedEntry.feedback_json) {
      await logApiUsage(supabase, user.id, 'generateDetailedFeedback', true, 0, {
        taskType,
        cached: true,
      });
      return new Response(
        JSON.stringify({ success: true, data: cachedEntry.feedback_json, cached: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Gemini 2.5 Flash for all tasks (multimodal support included)
    const model = 'gemini-2.5-flash';

    console.log(`Using model: ${model} for task type: ${taskType}`);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemInstruction },
                ...userContentParts
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const status = geminiResponse.status;
      const retryAfter = geminiResponse.headers.get('retry-after');
      const retryAfterSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : null;

      let providerMessage = '';
      try {
        const errorJson = await geminiResponse.json();
        providerMessage = errorJson?.error?.message || '';
      } catch {
        try {
          providerMessage = await geminiResponse.text();
        } catch {
          providerMessage = '';
        }
      }

      console.error(`Gemini API error: ${status} - ${providerMessage}`);

      if (status === 429) {
        return new Response(
          JSON.stringify({
            error: 'AI is rate-limited right now. Please try again shortly.',
            provider: 'gemini',
            providerStatus: status,
            retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (status === 401 || status === 403) {
        return new Response(
          JSON.stringify({
            error: 'AI provider authentication failed. Check GEMINI_API_KEY.',
            provider: 'gemini',
            providerStatus: status,
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'AI provider error. Please try again later.',
          provider: 'gemini',
          providerStatus: status,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    let aiContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error('No content received from Gemini');
    }

    // Log raw content for debugging
    console.log('Raw AI content length:', aiContent.length);

    // Extract JSON from response - handle markdown code blocks and other formatting
    let jsonString = aiContent;

    // Try to extract JSON object using regex (handles ```json blocks, extra text, etc.)
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    } else {
      // If no JSON object found, try stripping markdown manually
      jsonString = aiContent.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.slice(7);
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.slice(3);
      }
      if (jsonString.endsWith('```')) {
        jsonString = jsonString.slice(0, -3);
      }
      jsonString = jsonString.trim();
    }

    console.log('Extracted JSON length:', jsonString.length);

    const feedbackData = JSON.parse(jsonString);
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0;

    await logApiUsage(supabase, user.id, 'generateDetailedFeedback', false, tokensUsed, {
      taskType,
    });

    try {
      await supabase
        .from('ai_feedback_cache')
        .insert({
          input_hash: inputHash,
          feedback_json: feedbackData,
        })
        .select();
    } catch (cacheSaveErr) {
      console.warn('Failed to save to cache:', cacheSaveErr);
    }

    return new Response(JSON.stringify({ success: true, data: feedbackData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generateDetailedFeedback:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
