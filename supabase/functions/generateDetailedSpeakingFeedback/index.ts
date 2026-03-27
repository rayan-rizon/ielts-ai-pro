// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore - Use npm: specifier for Node compatibility
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
    getCorsHeaders,
    logApiUsage,
    checkRateLimit,
    getRateLimitIdentifier,
    getBurstLimitConfig,
    checkTierAccess,
} from '../_shared/security.ts';

declare const Deno: any;

serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req);

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(authHeader?.split(' ')[1]);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Rate limiting and Tier Checks
        const { data: userProfile } = await supabase
            .from('users')
            .select('subscription_tier, role')
            .eq('auth_id', user.id)
            .single();

        let tier = (userProfile?.subscription_tier || 'free').toLowerCase();
        if (userProfile?.role === 'admin') tier = 'admin';

        // Tier gate: Detailed Speaking Analytics requires pro or higher
        const tierDenied = checkTierAccess(tier, ['pro', 'premium', 'admin'], corsHeaders, 'Detailed Speaking Analytics');
        if (tierDenied) return tierDenied;

        // Uses burst limits
        const burstConfig = getBurstLimitConfig(tier);
        const rateLimitId = getRateLimitIdentifier(req, user.id);
        const burstCheck = checkRateLimit(rateLimitId, burstConfig);

        if (!burstCheck.allowed) {
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded',
                    message: 'Please wait a moment before requesting detailed analysis.',
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { testId, allPartsConversation } = await req.json();

        if (!testId || !allPartsConversation) {
            return new Response(
                JSON.stringify({ error: 'testId and allPartsConversation are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }

        // Format the full conversation transcript
        let fullTranscript = '';

        [1, 2, 3].forEach((part) => {
            if (allPartsConversation[part] && allPartsConversation[part].length > 0) {
                fullTranscript += `=== PART ${part} ===\n`;
                allPartsConversation[part].forEach(
                    (entry: { speaker: string; text: string }) => {
                        fullTranscript += `${entry.speaker === 'user' ? 'Candidate' : 'Examiner'}: ${entry.text}\n`;
                    }
                );
                fullTranscript += '\n';
            }
        });

        const promptText = `
You are a senior IELTS examiner and speaking coach. Analyse the following speaking test transcript question-by-question and produce a structured JSON feedback report.

**TONE INSTRUCTION:** Write feedback in a warm, encouraging coaching voice — not a clinical assessment report. Use direct address ('you', 'your'). Acknowledge effort before identifying issues. Frame improvements as achievable next steps, not deficits. Example tone: 'You've got solid foundations here — your grammar holds up well. The main lever to pull now is extending your Part 2 answers to the full 1–2 minutes.'

**IELTS SPEAKING TEST STRUCTURE — CONTEXT:**
- Part 1 (Introduction & Interview): Short, personal questions about familiar topics. Candidates should give 2–3 sentence answers that are natural and conversational, not over-rehearsed.
- Part 2 (Individual Long Turn): Candidate speaks for 1–2 minutes on a cue card topic. Band 6+ requires at least 90 seconds of sustained, organised speech. Band 7+ requires fluent, fully developed discourse with no major gaps or halting.
- Part 3 (Two-Way Discussion): Abstract, analytical questions related to the Part 2 topic. Candidate should express opinions, analyse issues, and develop ideas at length. Short yes/no answers are penalised.

**CRITICAL RULES FOR ANALYSIS:**

1. Grammar error detection (non-negotiable):
   - Identify every grammatical error in the candidate's response, even minor ones.
   - Report each error with the exact incorrect phrase and its correct form.
   - Do NOT state 'grammatical structures are used accurately' if any error exists — this is a hallucination and misleads the student.

2. Topic adherence check:
   - Verify the candidate answered the specific question asked.
   - If the candidate drifted to a related but different topic (e.g., asked about theatre but spoke about cinema), flag this as 'Topic Drift' in the topicDrift field with a specific note.

3. Response length calibration (Part 2 especially):
   - Count the approximate word length of the candidate's Part 2 answer. If under 80 words, flag this prominently.
   - The first improvement tip for a candidate with fewer than 80 words in Part 2 MUST be: 'Extend your Part 2 answer to at least 90 seconds by covering all four bullet points on the cue card and adding a reason or example for each.'

4. Band 9 sample responses — spoken register (critical):
   - Band 9 samples must sound like NATURAL SPOKEN ENGLISH, not written essays.
   - USE: contractions (I'd, it's, there's, I've), discourse markers (Well, To be honest, I suppose, I mean, Actually), natural hedging (I think, It seems to me, I'd say, probably), self-correction for naturalness.
   - DO NOT USE: academic essay collocations ('theatrical landscape', 'demographic gravitating', 'nuanced narrative'), overly formal transitions ('Furthermore', 'Notwithstanding'), or formally written phrases.
   - A Band 9 speaker sounds articulate and natural — not like a memorised essay being recited.

5. Improvement advice calibration:
   - Match advice to the candidate's ACTUAL observed performance level.
   - If responses were brief: first tip must address extending length.
   - If grammar errors detected: correct them specifically before suggesting stylistic improvements.
   - If topic drift detected: address adherence before vocabulary tips.

6. Part-specific register coaching:
   - Note how the candidate should shift their communication style between parts:
     * Part 1: Natural, conversational — short but complete answers. Brevity is less penalised here.
     * Part 2: Extended monologue — organised delivery using the cue card bullet points. Length is critical.
     * Part 3: Analytical and abstract — hedging language ('it could be argued that...', 'it rather depends on...'), speculation, and justification are expected and rewarded.
   - If the candidate uses the same register across all parts (e.g., short Part 1-style answers in Part 3), flag this in feedback.

**TRANSCRIPT:**
${fullTranscript}

**OUTPUT FORMAT:**
Return ONLY a valid JSON array. Do not include markdown code block formatting.

[
  {
    "part": 1,
    "question": "The exact examiner question",
    "candidateAnswer": "The candidate's verbatim response",
    "grammaticalErrors": [
      { "incorrect": "exact phrase from transcript", "correct": "corrected form", "explanation": "brief grammar note" }
    ],
    "topicDrift": "null or a string describing any topic drift detected",
    "suggestedAnswer": "Band 9.0 sample in NATURAL SPOKEN ENGLISH with contractions and discourse markers",
    "feedback": "2–3 sentence examiner note: cite SPECIFIC language from the candidate's answer, identify 1 concrete error or gap, explain what the Band 9 sample does better"
  }
]

Return an empty grammaticalErrors array [] if no errors are found. Return the string 'null' for topicDrift if the candidate answered on-topic.
`;

        const evalResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: {
                        temperature: 0.2, // Low temperature for consistency
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        );

        if (!evalResponse.ok) {
            const errorText = await evalResponse.text();
            throw new Error(`Gemini API error: ${evalResponse.status} - ${errorText}`);
        }

        const evalData = await evalResponse.json();
        const evalText = evalData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const tokensUsed = evalData.usageMetadata?.totalTokenCount || 0;
        console.log(`[Detailed Eval] Gemini length: ${evalText.length} chars, tokens: ${tokensUsed}`);

        let detailedAnalysis;
        try {
            // Trim backticks if Gemini ignores prompt instructions
            let cleanText = evalText.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.substring(7);
            }
            if (cleanText.startsWith('```')) {
                cleanText = cleanText.substring(3);
            }
            if (cleanText.endsWith('```')) {
                cleanText = cleanText.substring(0, cleanText.length - 3);
            }
            detailedAnalysis = JSON.parse(cleanText.trim());
        } catch (parseError) {
            console.error('Failed to parse detailed analysis from Gemini:', parseError);
            console.error('Raw AI response:', evalText);
            throw new Error('Failed to parse AI response into JSON');
        }

        // Log successful usage
        await logApiUsage(supabase, user.id, 'generateDetailedSpeakingFeedback', false, tokensUsed, {
            testId,
            partsAnalyzed: [1, 2, 3].filter(p => !!allPartsConversation[p]).length,
        });

        return new Response(
            JSON.stringify({
                success: true,
                detailedAnalysis,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Error in generateDetailedSpeakingFeedback:', error);
        const corsHeaders = getCorsHeaders(req);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error', success: false }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
