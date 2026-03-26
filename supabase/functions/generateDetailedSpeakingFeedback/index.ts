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
You are an expert IELTS examiner. Based on the following transcript of a candidate's speaking test, provide a detailed question-by-question analysis. 

For every question the examiner asks:
1. Extract the examiner's question.
2. Extract exactly what the candidate answered.
3. Provide a 'Band 9.0 Sample Response' (a more sophisticated, natural way to answer).
4. Provide 'Examiner Feedback' explaining why the suggestion is better (focus on lexical resource, grammatical range, and fluency). 

**CRITICAL:** The 'Examiner Feedback' must be concise—maximum 2 to 3 sentences. Use professional, formal IELTS examiner tone.

**TRANSCRIPT:**
${fullTranscript}

**OUTPUT FORMAT:**
Return ONLY a valid JSON array of objects. Do not include markdown code block formatting like \`\`\`json.

[
  {
    "part": 1,
    "question": "The question asked",
    "candidateAnswer": "The candidate's response",
    "suggestedAnswer": "Band 9.0 sample response",
    "feedback": "Concise examiner feedback (max 3 sentences)"
  }
]
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
