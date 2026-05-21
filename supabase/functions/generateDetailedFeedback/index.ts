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

function isTrustedImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('INTERNAL_SUPABASE_URL');
    const trustedSupabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : 'zvrmvycajimjxghrnpgy.supabase.co';
    const r2PublicUrl = Deno.env.get('R2_PUBLIC_URL');
    const trustedR2Origin = r2PublicUrl ? new URL(r2PublicUrl).origin : 'https://media.ieltsai.pro';

    if (parsed.hostname === trustedSupabaseHost) {
      return parsed.pathname.startsWith('/storage/');
    }

    return parsed.origin === trustedR2Origin || parsed.origin === 'https://media.ieltsai.pro';
  } catch {
    return false;
  }
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

    // SECURITY: Cap input sizes to prevent token-draining attacks
    // IELTS standards: Task 1 target = 150 words, Task 2 target = 250 words
    // Generous buffers: Task 1 ≤ 1500 chars (~250 words), Task 2 ≤ 2500 chars (~400 words)
    const MAX_WRITING_CHARS = taskType === 'Task 1' ? 1500 : 2500;
    const MAX_PROMPT_CHARS = 1500;   // Task prompts are typically < 200 chars
    if (writingText.length > MAX_WRITING_CHARS) {
      return new Response(
        JSON.stringify({ error: `Writing text exceeds maximum length for ${taskType || 'this task'} (${MAX_WRITING_CHARS} characters).` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (taskPrompt.length > MAX_PROMPT_CHARS) {
      return new Response(
        JSON.stringify({ error: `Task prompt exceeds maximum length (${MAX_PROMPT_CHARS} characters).` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate taskType is one of the expected values
    const VALID_TASK_TYPES = ['Task 1', 'Task 2'];
    if (taskType && !VALID_TASK_TYPES.includes(taskType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid taskType. Must be "Task 1" or "Task 2".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (taskType === 'Task 1' && !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required for Task 1 evaluation.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: SSRF protection — only allow exact trusted media origins.
    if (imageUrl) {
      if (!isTrustedImageUrl(imageUrl)) {
        return new Response(
          JSON.stringify({ error: 'imageUrl must point to a trusted image source.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let systemInstruction = `
You are a senior IELTS Academic Writing examiner and coach with 15+ years of experience. Score and provide feedback strictly using official IELTS Academic band descriptors (IDP/British Council public band descriptors).

Core mandate:
1) Produce ACCURATE, calibrated band scores that match what a real IELTS examiner would assign.
2) Provide HIGH-IMPACT, SPECIFIC feedback — never vague. Each weakness must have a direct, actionable fix.
3) Acknowledge genuine strengths so the student knows what to repeat.
4) NEVER fabricate errors that are not present in the student's text.
5) NEVER reward performance the student has not actually demonstrated.

Hard rules (non-negotiable):
- Output JSON ONLY. No markdown, no code fences, no extra text before or after the JSON.
- Do not invent facts, data points, or errors not present in the student's writing.
- Use IELTS bands in 0.5 steps (e.g., 5.0, 5.5, 6.0). All criteria must be 0.5-step numbers.
- Compute overallBand = average of four criteria scores, rounded to nearest 0.5.
- Be conservative when uncertain — explain uncertainty in weaknesses or suggestions.

Critical distinction — Corrections vs. Style preferences:
- 'corrections' MUST contain ONLY genuine errors: grammatical mistakes, spelling mistakes, incorrect word forms, wrong tense, missing clause elements, subject-verb disagreement, factual reporting errors.
- Do NOT include stylistic variation (e.g., 'Therefore' → 'Consequently', 'big' → 'substantial') in corrections. These belong in vocabularyEnhancements with context='stylistic variation'.
- Presenting a style preference as a correction actively misleads students and is strictly forbidden.

Annotation rules (for inline issue highlights):
- 'originalText' MUST be an exact substring copied character-for-character from the student's writing.
- Keep 'originalText' short (1–7 words) and unique so it maps unambiguously.
- 'type' must be one of: 'grammar' | 'spelling' | 'style' | 'vocabulary' | 'clarity' | 'positive'.
- 'severity' must be one of: 'error' | 'warning' | 'suggestion' | 'positive'.
- Maximum 15 annotations. Prioritize high band-impact and recurring patterns over one-off issues.

Scoring rubric summary (use as calibration):
- Band 9: Expert user — rare, near-flawless output.
- Band 8: Very good — occasional non-systematic errors, flexible and precise.
- Band 7: Good — some errors but generally effective and accurate.
- Band 6: Competent — issues with accuracy and range but generally effective communication.
- Band 5: Modest — notable errors and limited range but maintains basic communication.
- Band 4 and below: Limited or basic — frequent errors that obscure meaning.

Output schema (exact keys required):
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

SAMPLE-SIZE RULE (applies globally to all criteria):
For Task 1 (target: 150 words):
- If the response is under 130 words: cap ALL four criteria at Band 5.0. The sample is too small to demonstrate the range of features required for Band 6+.
- If the response is under 100 words: cap ALL four criteria at Band 4.0.
For Task 2 (target: 250 words):
- If the response is under 220 words: cap ALL four criteria at Band 5.0. The sample is too small to demonstrate the range of features required for Band 6+.
- If the response is under 180 words: cap ALL four criteria at Band 4.0.
- State the word count and sample-size limitation explicitly in weaknesses.
- Do NOT claim 'a mix of complex and simple structures' or 'wide lexical range' from fewer than 4 sentences — this is statistically insufficient evidence.

Content guidelines:
- strengths: 3–6 specific bullets, each tied to a criterion, naming what the student did well and why it earns marks. Every strength MUST cite a specific phrase or structural feature from the student's text as evidence. Do NOT attribute intentional technique to minimal or off-topic responses. If the response is under 100 words and off-topic, limit strengths to 1–2 items maximum and ensure each one is genuinely evidenced. Do not praise 'understanding of report structure' from a 3-sentence paragraph.
- weaknesses: 3–6 specific bullets, each tied to a criterion, explaining why it limits the band. ALWAYS state the actual word count as the FIRST weakness bullet if the response is under the required minimum.
- suggestions: 5–10 bullets ordered by band-gain impact (most impactful first). Each must be a concrete action starting with a verb (e.g., 'Add a two-sentence overview...', 'Replace the generic phrase... with...').
- corrections: genuine errors only. 5–12 items. 'original' must be copied verbatim from the student's text.
- vocabularyEnhancements: 5–10 items. Target weak, repetitive, or informal words. Suggest natural academic alternatives that fit the context. Avoid forced or exotic synonyms.

If the student's writing is extremely short or completely off-topic, return valid JSON and score accordingly with honest, calibrated justification.
`;

    const userContentParts: any[] = [];

    if (taskType === 'Task 1') {
      systemInstruction += `
Task type: IELTS Academic Writing Task 1 (visual report).

STEP 1 — Visual classification (MUST do before scoring):
- Identify the visual type required by the task prompt. Use exactly one of: [line graph | bar chart | pie chart | table | map | process diagram | mixed visuals].
- Identify the visual type the candidate actually described in their answer.
- MISMATCH detected (they differ):
  * Set TaskAchievement to 2.0 or below.
  * Cap LexicalResource at 3.5 — all language served the wrong communicative purpose.
  * Cap GrammaticalRangeAndAccuracy at 3.5 — same reason.
  * Add an annotation: type='clarity', severity='error', naming the mismatch explicitly (e.g., 'Response describes a chart, but the prompt requires a map. All content is off-task.').
  * State the mismatch prominently in weaknesses.
- MATCH confirmed: proceed to STEP 2.

STEP 2 — Word count check:
- If under 150 words: cap TaskAchievement at 4.0. State actual word count in weaknesses as first bullet.
- If 150–169 words: note borderline minimum in weaknesses. Reflect slightly in TaskAchievement.
- 170+ words: no word count penalty.

STEP 3 — Score all four criteria with these benchmarks:

Task 1 high-band expectations (all visual types):
- Give a clear overview (1–2 sentences) summarising the ONE or TWO most significant overall features WITHOUT quoting specific data values. An overview is not a list — it is a summary of the big picture.
- Select key features only; do not list every data point or table cell.
- Make accurate comparisons: use comparative and superlative language, highlight extremes, group similar data.
- Use precise Task 1 academic language: 'increased significantly', 'remained relatively stable', 'accounted for approximately X%', 'a gradual upward trend', 'a sharp decline', 'the most notable feature'.
- Avoid personal opinion, speculation about causes, unsupported predictions, or recommendations.

Visual-type-specific guidance:
- Line/Bar graphs: focus on trends over time, comparative highs/lows, peaks and troughs, periods of stability.
- Pie charts: emphasise proportions, compare largest vs smallest slices, group similar segments.
- Tables: identify and group patterns; never list every cell — select and compare the most significant data.
- Maps: use spatial and directional language: 'to the north of', 'adjacent to', 'opposite', 'was replaced by', 'was extended southward', 'was constructed', 'was removed', 'remained unchanged'. Focus on what changed between the two time periods.
- Process diagrams: describe each stage in logical order using passive voice ('is heated', 'is transferred', 'is converted'). Cover the complete cycle or linear process from start to end.
- Mixed visuals: treat each visual separately in its own body paragraph, then provide a comparative overview linking the key relationship between them.

Visual accuracy rules:
- Report only values and features you can clearly see in the image. Never guess or invent data.
- If the image is unclear or unreadable, note this limitation in weaknesses without inventing numbers.

FABRICATION PROHIBITION (applies when visual mismatch is detected):
- When the candidate described the wrong visual type, do NOT invent specific details from the actual visual (roads, percentages, building names, compass directions, specific years from the image).
- Do NOT produce a 'corrected' sentence containing data not explicitly provided in the prompt text.
- Instead, provide STRUCTURAL TEMPLATE sentences using placeholder language:
  Example: 'The maps show [primary change] between [year 1] and [year 2]. For instance, [feature A] was [changed/added/removed] in the [location descriptor].'
- Mark all template sentences with: '(Structural template — fill in actual details from the provided visuals.)'

Vocabulary enhancement redirect on mismatch:
- When visual mismatch is detected, do NOT enhance wrong-topic vocabulary (e.g., chart trend language when the task is a map).
- Instead, provide 5–8 vocabulary items relevant to the CORRECT task type.
  * Maps: 'was relocated', 'was extended southward', 'a new roundabout was introduced', 'adjacent to', 'was demolished', 'remained unchanged', 'was converted into', 'a new entrance was constructed'.
  * Process diagrams: 'is heated to', 'is transferred via', 'is converted into', 'the process begins with'.
  * Charts/graphs: 'increased significantly', 'remained stable', 'peaked at', 'declined sharply'.
- Label these as context='correct task type vocabulary'.

Suggestion scaffolding on mismatch:
- When visual mismatch is detected, the FIRST 3 suggestions MUST provide correct task-type vocabulary and structural models the student should learn, before general structural advice.

IELTS Examiner Rule — Overview requirement:
- An overview is mandatory for Task 1. It summarises the ONE or TWO most significant overall features WITHOUT quoting specific data.
- If the candidate's response contains NO identifiable overview sentence: cap TaskAchievement at 5.0. State in weaknesses: 'No overview detected. The IELTS marking criteria require an overview for any score above Band 5.'
- An overview is NOT the introduction/paraphrase of the prompt. It is a separate analytical statement about the big picture.
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
Task type: IELTS Academic Writing Task 2 (discursive essay).

STEP 1 — Word count check (MUST do before scoring):
- Count the candidate's words carefully (exclude the task prompt itself).
- Under 150 words → cap TaskAchievement at 3.0. State word count in weaknesses as first bullet.
- Under 200 words → cap TaskAchievement at 4.0. State word count in weaknesses as first bullet.
- Under 250 words → cap TaskAchievement at 5.0. State word count in weaknesses as first bullet.
- These ceilings are HARD LIMITS per official IELTS marking guidelines, regardless of content quality.
- 250+ words: no word count penalty. Proceed to STEP 2.

STEP 2 — Question type identification:
Identify the exact Task 2 question type from the prompt:
[Agree/Disagree | Discuss both views | Advantages and Disadvantages | Problem and Solution | Two-part question]

Evaluate TaskAchievement based on the expected approach for each type:
- Agree/Disagree ('To what extent do you agree/disagree?'): A clear, consistent position is required. The body paragraphs MUST predominantly argue FOR the candidate's stated position. If the candidate writes one paragraph 'for' and one paragraph 'against' with equal structural weight, this is a Discussion Essay structure applied to an Opinion Essay prompt — flag this explicitly: 'Your essay uses a balanced Discussion Essay structure (one paragraph for, one against) but the prompt requires a sustained argument supporting your stated position. This structural mismatch limits Task Achievement to Band 5–6.' Partial agreement is acceptable only if the candidate explicitly acknowledges and refutes the opposing view within their dominant argument.
- Discuss both views ('Discuss both views and give your own opinion'): BOTH views must receive equal, developed treatment. Giving only one view, even if opinion is stated, is a significant TaskAchievement penalty.
- Advantages and Disadvantages: BOTH advantages AND disadvantages must be developed. Exploring only one side is penalised.
- Problem and Solution: Specific problems/causes must be identified AND specific, realistic solutions proposed. Vague solutions ('the government should do more') do not satisfy this criterion.
- Two-part question ('What are the reasons for X? What can be done about Y?'): BOTH questions must be answered and developed. Developing only one part penalises TaskAchievement significantly.

STEP 3 — Prompt scenario fidelity check:
- Extract the 2–3 key scenario markers from the task prompt. For example, 'living in a country where you have to speak a foreign language' contains: [living abroad] [compelled — not by choice] [using a foreign language daily].
- Verify the candidate addressed at least 2 of these scenario markers specifically in their essay.
- If the candidate substituted a related but significantly different scenario (e.g., 'learning a foreign language' in place of 'being compelled to live in one'), flag this as 'Prompt Drift' in weaknesses and reduce TaskAchievement by 0.5 from what content quality alone would warrant.

STEP 4 — Score all four Task 2 criteria with these benchmarks:

Task Achievement:
- Full marks require: addressing every part of the prompt; maintaining a clear, consistent position; using well-developed, relevant examples; logical argument structure.
- Penalize: off-topic content, unclear or shifting position, underdeveloped ideas, irrelevant or invented examples, missing parts of the prompt, prompt drift.

Coherence and Cohesion:
- Ideal structure: Introduction (background + thesis) → Body §1 → Body §2 → [Counter-argument §] → Conclusion.
- Reward: clear topic sentences, logical paragraph progression, natural use of cohesive devices.
- Penalize: overuse of 'Firstly/Secondly/Furthermore/Moreover/In addition' — these signal formulaic writing to examiners. Reference them specifically if overused.
- A counter-argument paragraph is expected in Band 7+ responses — note its absence for mid-band candidates.

Lexical Resource:
- Reward: precise, context-appropriate academic vocabulary, natural collocations, varied sentence openings, correct word forms.
- Penalize: repetition of key vocabulary without variation, informal/colloquial words, incorrect collocations, memorized stock phrases ('In today's modern world...', 'Since time immemorial...').

Grammatical Range and Accuracy:
- Reward: mix of complex and simple structures, accurate use of relative clauses, conditionals, passive voice, modal verbs.
- Penalize: repeated sentence structure, article errors, preposition misuse, comma splices, run-on sentences, subject-verb disagreement.

Register and tone:
- Academic formal register required throughout. Penalize contractions (it's, don't), slang, and overly emotional or exaggerated language.
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
