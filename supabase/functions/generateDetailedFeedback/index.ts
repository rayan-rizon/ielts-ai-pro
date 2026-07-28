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
  reserveDatabaseQuota,
  finalizeApiUsage,
  quotaExceededResponse,
  getBurstLimitConfig,
} from '../_shared/security.ts';
import {
  countWords,
  FEEDBACK_EVALUATOR_VERSION,
  normalizeWritingEvaluation,
  parseStructuredJson,
} from '../_shared/evaluationUtils.ts';

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
    const trustedSupabaseHost = supabaseUrl
      ? new URL(supabaseUrl).hostname
      : 'zvrmvycajimjxghrnpgy.supabase.co';
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
    const supabaseKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('INTERNAL_SERVICE_ROLE_KEY');

    console.log('Function Debug - URL:', !!supabaseUrl, 'Key:', !!supabaseKey);

    const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');

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

    if (!writingText || !taskPrompt || !taskType) {
      return new Response(
        JSON.stringify({ error: 'Writing text, task prompt, and task type are required.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // SECURITY: Cap input sizes to prevent token-draining attacks
    // IELTS standards: Task 1 target = 150 words, Task 2 target = 250 words
    // Generous buffers: Task 1 ≤ 1500 chars (~250 words), Task 2 ≤ 2500 chars (~400 words)
    const MAX_WRITING_CHARS = taskType === 'Task 1' ? 1500 : 2500;
    const MAX_PROMPT_CHARS = 1500; // Task prompts are typically < 200 chars
    if (writingText.length > MAX_WRITING_CHARS) {
      return new Response(
        JSON.stringify({
          error: `Writing text exceeds maximum length for ${taskType || 'this task'} (${MAX_WRITING_CHARS} characters).`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (taskPrompt.length > MAX_PROMPT_CHARS) {
      return new Response(
        JSON.stringify({
          error: `Task prompt exceeds maximum length (${MAX_PROMPT_CHARS} characters).`,
        }),
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

    const wordCount = countWords(writingText);
    const taskCriterionKey = taskType === 'Task 2' ? 'TaskResponse' : 'TaskAchievement';
    const taskCriterionLabel = taskType === 'Task 2' ? 'Task Response' : 'Task Achievement';
    const writingResponseSchema = {
      type: 'OBJECT',
      properties: {
        criteriaScores: {
          type: 'OBJECT',
          properties: {
            [taskCriterionKey]: { type: 'NUMBER' },
            CoherenceAndCohesion: { type: 'NUMBER' },
            LexicalResource: { type: 'NUMBER' },
            GrammaticalRangeAndAccuracy: { type: 'NUMBER' },
          },
          required: [
            taskCriterionKey,
            'CoherenceAndCohesion',
            'LexicalResource',
            'GrammaticalRangeAndAccuracy',
          ],
        },
        summary: { type: 'STRING' },
        annotations: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              originalText: { type: 'STRING' },
              type: {
                type: 'STRING',
                enum: ['grammar', 'spelling', 'style', 'vocabulary', 'clarity', 'positive'],
              },
              suggestion: { type: 'STRING' },
              explanation: { type: 'STRING' },
              severity: {
                type: 'STRING',
                enum: ['error', 'warning', 'suggestion', 'positive'],
              },
            },
            required: ['originalText', 'type', 'suggestion', 'explanation', 'severity'],
          },
        },
        strengths: { type: 'ARRAY', items: { type: 'STRING' } },
        priorities: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              criterion: {
                type: 'STRING',
                enum: [taskCriterionLabel, 'Coherence & Cohesion', 'Lexical Resource', 'Grammar'],
              },
              issue: { type: 'STRING' },
              action: { type: 'STRING' },
            },
            required: ['criterion', 'issue', 'action'],
          },
        },
        vocabularyEnhancements: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              original: { type: 'STRING' },
              alternatives: { type: 'ARRAY', items: { type: 'STRING' } },
              context: { type: 'STRING' },
            },
            required: ['original', 'alternatives', 'context'],
          },
        },
      },
      required: [
        'criteriaScores',
        'summary',
        'annotations',
        'strengths',
        'priorities',
        'vocabularyEnhancements',
      ],
    };

    let systemInstruction = `
You are a rigorous IELTS Academic Writing examiner-coach. Apply the official public Writing band descriptors updated May 2023. This is a practice estimate, so score only demonstrated evidence and never invent content or errors.

SCORING
- Score ${taskCriterionKey}, CoherenceAndCohesion, LexicalResource, and GrammaticalRangeAndAccuracy independently in whole or half bands only. The server recomputes the overall average.
- A script must fully fit a band's positive features. Band 8: sufficiently addresses the task, easy logical progression, wide precise vocabulary, and mostly error-free flexible grammar. Band 7: covers the task with a developed response, clear progression, some lexical flexibility, and frequent error-free sentences. Band 6: addresses the main requirements, is generally coherent, uses adequate vocabulary, and mixes simple/complex forms with errors that rarely impede meaning. Band 5: incomplete or limited task coverage, imperfect progression, restricted/repetitive vocabulary, and frequent faulty complex sentences.
- The response is exactly ${wordCount} words. Underlength limits demonstrated task coverage; it is not an automatic fixed cap on the three language criteria. Responses of 20 words or fewer are Band 1 under the public descriptors.
- Be conservative where evidence is thin. Never reward a feature the response does not show. Equally, never deduct for caution: if the script demonstrates a band's positive features across most of the response, award that band in full.

COMPACT FEEDBACK CONTRACT
- summary: 1 direct sentence, maximum 18 words, stating the clearest success and main limiter.
- strengths: 1–3 items, maximum 14 words each. Cite an exact phrase or observable structural feature. No generic praise.
- priorities: exactly the 3 highest band-gain issues, ordered by impact. issue is maximum 12 words; action is maximum 14 words and must be concrete. Use only the allowed criterion labels.
- annotations: 0–10 high-value highlights. originalText must be an exact, unique 1–7 word substring. suggestion is maximum 12 words. explanation is maximum 14 words and must state why the change matters for clarity, accuracy, or the relevant band criterion. Use severity='error' only for genuine grammar, spelling, word-form, tense, agreement, missing-element, or factual-reporting errors. Style preferences are suggestions, never errors. Do not repeat an issue.
- vocabularyEnhancements: 0–4 natural, context-fitting upgrades; two alternatives each. Never force exotic synonyms.
- Do not output separate weaknesses, suggestions, corrections, or overallBand. The server derives correction rows from grounded error annotations.
- Output JSON only and follow the response schema. No markdown or bold markers.
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
  * Continue judging LexicalResource and GrammaticalRangeAndAccuracy independently from the language actually demonstrated. Do not cap language criteria merely because the content is off-task.
  * Add an annotation on a short exact phrase: type='clarity', severity='warning', explaining that it describes the wrong visual type.
  * Make the mismatch the first priority.
- MATCH confirmed: proceed to STEP 2.

STEP 2 — Word count check:
- The server-calculated response length is ${wordCount} words.
- If under 150 words, include the exact count in a priority and reflect incomplete coverage in TaskAchievement. Do not apply an invented fixed band ceiling.
- If 150+ words, do not penalise length.

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
- If the image is unclear or unreadable, note this limitation in a priority without inventing numbers.

FABRICATION PROHIBITION (applies when visual mismatch is detected):
- When the candidate described the wrong visual type, do NOT invent specific details from the actual visual (roads, percentages, building names, compass directions, specific years from the image).
- Do NOT produce a 'corrected' sentence containing data not explicitly provided in the prompt text.
- Instead, provide STRUCTURAL TEMPLATE sentences using placeholder language:
  Example: 'The maps show [primary change] between [year 1] and [year 2]. For instance, [feature A] was [changed/added/removed] in the [location descriptor].'
- Mark all template sentences with: '(Structural template — fill in actual details from the provided visuals.)'

Vocabulary enhancement redirect on mismatch:
- When visual mismatch is detected, do NOT enhance wrong-topic vocabulary (e.g., chart trend language when the task is a map).
- Instead, provide up to 4 vocabulary items relevant to the CORRECT task type.
  * Maps: 'was relocated', 'was extended southward', 'a new roundabout was introduced', 'adjacent to', 'was demolished', 'remained unchanged', 'was converted into', 'a new entrance was constructed'.
  * Process diagrams: 'is heated to', 'is transferred via', 'is converted into', 'the process begins with'.
  * Charts/graphs: 'increased significantly', 'remained stable', 'peaked at', 'declined sharply'.
- Label these as context='correct task type vocabulary'.

Priority scaffolding on mismatch:
- When visual mismatch is detected, the priorities must first address the correct visual type, overview, and task-appropriate language.

IELTS Examiner Rule — Overview requirement:
- An overview is mandatory for Task 1. It summarises the ONE or TWO most significant overall features WITHOUT quoting specific data.
- If the candidate's response contains NO identifiable overview sentence: TaskAchievement cannot meet Band 6, whose public descriptor requires a relevant overview attempt. Make this the first priority.
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
          return new Response(
            JSON.stringify({
              error:
                'The Task 1 visual could not be loaded, so accurate visual feedback cannot be generated. Please retry.',
            }),
            { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } else {
      systemInstruction += `
Task type: IELTS Academic Writing Task 2 (discursive essay).

STEP 1 — Word count check (MUST do before scoring):
- The server-calculated response length is ${wordCount} words.
- If under 250 words, include the exact count in a priority and judge how the short response limits full development under TaskResponse.
- Do not use invented automatic band ceilings, and do not automatically cap the other three criteria.
- 250+ words: no length penalty. Proceed to STEP 2.

STEP 2 — Question type identification:
Identify the exact Task 2 question type from the prompt:
[Agree/Disagree | Discuss both views | Advantages and Disadvantages | Problem and Solution | Two-part question]

Evaluate TaskResponse based on the expected approach for each type:
- Agree/Disagree ('To what extent do you agree/disagree?'): A clear position is required throughout. Full agreement, disagreement, partial agreement, or a carefully balanced position can all be valid when the extent is explicit and the ideas consistently support that position. Do not require a counterargument or refutation unless the candidate's chosen position needs one.
- Discuss both views ('Discuss both views and give your own opinion'): BOTH views must receive developed treatment and the candidate's opinion must be clear. The two views do not need identical word counts, but neither may be omitted or merely mentioned.
- Advantages and Disadvantages: BOTH advantages AND disadvantages must be developed. Exploring only one side is penalised.
- Problem and Solution: Specific problems/causes must be identified AND specific, realistic solutions proposed. Vague solutions ('the government should do more') do not satisfy this criterion.
- Two-part question ('What are the reasons for X? What can be done about Y?'): BOTH questions must be answered and developed. Developing only one part significantly limits TaskResponse.

STEP 3 — Prompt scenario fidelity check:
- Extract the 2–3 key scenario markers from the task prompt. For example, 'living in a country where you have to speak a foreign language' contains: [living abroad] [compelled — not by choice] [using a foreign language daily].
- Verify the candidate addressed at least 2 of these scenario markers specifically in their essay.
- If the candidate substituted a related but significantly different scenario (e.g., 'learning a foreign language' in place of 'being compelled to live in one'), make 'Prompt drift' a priority and reflect the loss of relevance in TaskResponse.
- OFF-TOPIC ANCHOR: If the essay answers a substantially different question from the one asked (a memorized or off-topic essay), TaskResponse must be 4.0 or below regardless of language quality — the public Band 4 descriptor is 'responds to the task only in a minimal way' / tangential. If the content is almost entirely unrelated to the prompt topic, TaskResponse must be 2.0 or below. Continue to judge CoherenceAndCohesion, LexicalResource, and GrammaticalRangeAndAccuracy independently from the language actually demonstrated.

STEP 4 — Score all four Task 2 criteria with these benchmarks:

Task Response:
- Full marks require: addressing every part of the prompt; maintaining a clear, consistent position; using well-developed, relevant examples; logical argument structure.
- Penalize: off-topic content, unclear or shifting position, underdeveloped ideas, irrelevant or invented examples, missing parts of the prompt, prompt drift.

Coherence and Cohesion:
- Ideal structure: Introduction (background + thesis) → Body §1 → Body §2 → [Counter-argument §] → Conclusion.
- Reward: clear topic sentences, logical paragraph progression, natural use of cohesive devices.
- Penalize: overuse of 'Firstly/Secondly/Furthermore/Moreover/In addition' — these signal formulaic writing to examiners. Reference them specifically if overused.
- Do not require a counterargument paragraph. Judge whether the chosen structure develops the candidate's position clearly and logically.

Lexical Resource:
- Reward: precise, context-appropriate academic vocabulary, natural collocations, varied sentence openings, correct word forms.
- Penalize: repetition of key vocabulary without variation, informal/colloquial words, incorrect collocations, memorized stock phrases ('In today's modern world...', 'Since time immemorial...').

Grammatical Range and Accuracy:
- Reward: mix of complex and simple structures, accurate use of relative clauses, conditionals, passive voice, modal verbs.
- Penalize: repeated sentence structure, article errors, preposition misuse, comma splices, run-on sentences, subject-verb disagreement.
- ERROR-DENSITY ANCHOR: If basic errors (subject-verb agreement, plural forms, articles, pronoun forms) appear in most sentences, GrammaticalRangeAndAccuracy must be 4.0 or below per the public descriptors.

Register and tone:
- Academic formal register required throughout. Penalize contractions (it's, don't), slang, and overly emotional or exaggerated language.
`;
      userContentParts.push({
        text: `Task Prompt: ${taskPrompt}\n\nStudent's Essay:\n${writingText}`,
      });
    }

    const normalizeText = (text: string) => (text ? text.replace(/\s+/g, ' ').trim() : '');
    const hashInput = JSON.stringify({
      evaluationVersion: FEEDBACK_EVALUATOR_VERSION,
      writingText: normalizeText(writingText),
      taskPrompt: normalizeText(taskPrompt),
      taskType,
      imageUrl,
    });
    const encode = new TextEncoder().encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encode);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const inputHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const quotaReservation = await reserveDatabaseQuota(
      supabase,
      user.id,
      'generateDetailedFeedback',
      'writing',
      null,
      { taskType, inputHash }
    );
    if (!quotaReservation.allowed) {
      return quotaExceededResponse(quotaReservation, corsHeaders);
    }

    const { data: cachedEntry } = await supabase
      .from('ai_feedback_cache')
      .select('feedback_json')
      .eq('input_hash', inputHash)
      .single();

    if (cachedEntry && cachedEntry.feedback_json) {
      await finalizeApiUsage(supabase, quotaReservation.reservationId, 0, true, {
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

    const buildGeminiRequest = (temperature: number) =>
      JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemInstruction }, ...userContentParts],
          },
        ],
        generationConfig: {
          temperature,
          topP: 0.9,
          // Thinking tokens count toward the output limit, so keep headroom above the
          // ~1k-token feedback payload. 1024 thinking tokens ≈ +$0.003/eval at Flash rates.
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseSchema: writingResponseSchema,
          thinkingConfig: { thinkingBudget: 1024 },
        },
      });

    let geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: buildGeminiRequest(0),
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

    let geminiData = await geminiResponse.json();
    let tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0;
    let aiContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error('No content received from Gemini');
    }

    console.log('Raw AI content length:', aiContent.length);
    let parsedFeedback: Record<string, any>;
    try {
      parsedFeedback = parseStructuredJson(aiContent);
    } catch (parseError) {
      console.warn('Gemini returned invalid JSON; retrying once:', parseError);
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: buildGeminiRequest(0.3),
        }
      );
      if (!geminiResponse.ok) {
        throw new Error('AI returned malformed feedback and the retry failed');
      }
      geminiData = await geminiResponse.json();
      tokensUsed += geminiData.usageMetadata?.totalTokenCount || 0;
      aiContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      parsedFeedback = parseStructuredJson(aiContent);
    }

    const feedbackData = normalizeWritingEvaluation(parsedFeedback, taskType, writingText);

    await finalizeApiUsage(supabase, quotaReservation.reservationId, tokensUsed, false, {
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
