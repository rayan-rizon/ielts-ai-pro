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
import { generateEvaluationPrompt, calculateOverallBand } from '../_shared/bandDescriptors.ts';

declare const Deno: any;

/**
 * evaluateSpeakingTest - Final evaluation endpoint
 *
 * This endpoint is called ONLY after ALL 3 parts of the speaking test are complete.
 * It generates a comprehensive evaluation using official IELTS Band Descriptors.
 */
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

        // Rate limiting
        const { data: userProfile } = await supabase
            .from('users')
            .select('subscription_tier')
            .eq('auth_id', user.id)
            .single();

        const tier = (userProfile?.subscription_tier || 'free').toLowerCase();

        // Tier gate: Speaking evaluation requires pro or higher
        const tierDenied = checkTierAccess(tier, ['free', 'pro', 'premium', 'admin'], corsHeaders, 'Speaking Evaluation');
        if (tierDenied) return tierDenied;

        const burstConfig = getBurstLimitConfig(tier);
        const rateLimitId = getRateLimitIdentifier(req, user.id);
        const burstCheck = checkRateLimit(rateLimitId, burstConfig);

        if (!burstCheck.allowed) {
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded',
                    message: 'Please wait a moment before requesting evaluation.',
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get the full conversation from all 3 parts
        const { testId, allPartsConversation, allPartsPronunciation } = await req.json();

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

        // Part 1
        if (allPartsConversation[1] && allPartsConversation[1].length > 0) {
            fullTranscript += '=== PART 1: INTRODUCTION & INTERVIEW ===\n';
            allPartsConversation[1].forEach(
                (entry: { speaker: string; text: string }) => {
                    fullTranscript += `${entry.speaker === 'user' ? 'Candidate' : 'Examiner'}: ${entry.text}\n`;
                }
            );
            fullTranscript += '\n';
        }

        // Part 2
        if (allPartsConversation[2] && allPartsConversation[2].length > 0) {
            fullTranscript += '=== PART 2: INDIVIDUAL LONG TURN ===\n';
            allPartsConversation[2].forEach(
                (entry: { speaker: string; text: string }) => {
                    fullTranscript += `${entry.speaker === 'user' ? 'Candidate' : 'Examiner'}: ${entry.text}\n`;
                }
            );
            fullTranscript += '\n';
        }

        // Part 3
        if (allPartsConversation[3] && allPartsConversation[3].length > 0) {
            fullTranscript += '=== PART 3: TWO-WAY DISCUSSION ===\n';
            allPartsConversation[3].forEach(
                (entry: { speaker: string; text: string }) => {
                    fullTranscript += `${entry.speaker === 'user' ? 'Candidate' : 'Examiner'}: ${entry.text}\n`;
                }
            );
        }

        // Build pronunciation evidence from per-turn audio analysis
        let pronunciationSummary = '';
        if (allPartsPronunciation && Object.keys(allPartsPronunciation).length > 0) {
            pronunciationSummary = '\n\n=== PRONUNCIATION & FLUENCY ASSESSMENT (from audio analysis) ===\n';
            for (const [partNum, scores] of Object.entries(allPartsPronunciation)) {
                if (!Array.isArray(scores) || scores.length === 0) continue;
                const validScores = scores.filter((s: any) => s.pronunciationScore);
                if (validScores.length === 0) continue;

                const avgScore = (
                    validScores.reduce((sum: number, s: any) => sum + s.pronunciationScore, 0) / validScores.length
                ).toFixed(1);
                const fluencyNotes = validScores
                    .map((s: any) => s.fluencyNotes)
                    .filter(Boolean)
                    .join('; ');

                pronunciationSummary += `Part ${partNum}: Average pronunciation score ${avgScore}/9.0 across ${validScores.length} responses.\n`;
                if (fluencyNotes) {
                    pronunciationSummary += `  Fluency observations: ${fluencyNotes}\n`;
                }
            }
        }

        // Generate evaluation prompt with official Band Descriptors
        const evaluationPrompt = generateEvaluationPrompt(fullTranscript + pronunciationSummary, 'full');

        // Call Gemini for comprehensive evaluation
        const evalResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: evaluationPrompt }] }],
                    generationConfig: {
                        temperature: 0.3, // Low temperature for consistent evaluation
                        maxOutputTokens: 4096, // Sufficient for slimmed evaluation JSON
                        responseMimeType: 'application/json', // Force structured JSON output
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
        console.log(`[EVAL] Gemini response: ${evalText.length} chars, finish: ${evalData.candidates?.[0]?.finishReason}, tokens: ${tokensUsed}`);

        let evaluation;
        const finishReason = evalData.candidates?.[0]?.finishReason || 'unknown';

        try {
            let parsed;

            // Strategy 0: Check if evalText is empty
            if (!evalText || evalText.trim().length === 0) {
                throw new Error(`Empty response from Gemini. Finish reason: ${finishReason}`);
            }

            // Strategy 1: Direct JSON parse
            try {
                parsed = JSON.parse(evalText);
                console.log('[EVAL] Direct JSON parse succeeded');
            } catch (directParseErr) {
                console.log('[EVAL] Direct parse failed:', (directParseErr as Error).message);

                // Strategy 2: If truncated (MAX_TOKENS), try to repair the JSON
                if (finishReason === 'MAX_TOKENS') {
                    console.log('[EVAL] Response truncated (MAX_TOKENS). Attempting JSON repair...');
                    let repaired = evalText.trim();

                    // Count open/close braces and brackets
                    const openBraces = (repaired.match(/\{/g) || []).length;
                    const closeBraces = (repaired.match(/\}/g) || []).length;
                    const openBrackets = (repaired.match(/\[/g) || []).length;
                    const closeBrackets = (repaired.match(/\]/g) || []).length;

                    // Remove trailing incomplete key-value (after last comma or colon)
                    repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, '');
                    repaired = repaired.replace(/,\s*"[^"]*"\s*$/, '');
                    repaired = repaired.replace(/,\s*\{[^}]*$/, '');
                    repaired = repaired.replace(/,\s*"[^"]*$/, '');
                    repaired = repaired.replace(/,\s*$/, '');

                    // Close remaining open brackets and braces
                    const remainingBrackets = openBrackets - (repaired.match(/\]/g) || []).length;
                    const remainingBraces = openBraces - (repaired.match(/\}/g) || []).length;

                    for (let i = 0; i < remainingBrackets; i++) repaired += ']';
                    for (let i = 0; i < remainingBraces; i++) repaired += '}';

                    try {
                        parsed = JSON.parse(repaired);
                        console.log('[EVAL] JSON repair succeeded');
                    } catch {
                        console.log('[EVAL] JSON repair failed, trying score extraction...');
                    }
                }

                // Strategy 3: Extract JSON from code blocks
                if (!parsed) {
                    const jsonPatterns = [
                        /```json\s*([\s\S]*?)\s*```/,
                        /```\s*([\s\S]*?)\s*```/,
                        /(\{[\s\S]*\})/,
                    ];

                    for (const pattern of jsonPatterns) {
                        const match = evalText.match(pattern);
                        if (match) {
                            try {
                                parsed = JSON.parse(match[1] || match[0]);
                                console.log('[EVAL] Code block extraction succeeded');
                                break;
                            } catch {
                                continue;
                            }
                        }
                    }
                }

                // Strategy 4: Last resort — extract individual scores with regex
                if (!parsed) {
                    console.log('[EVAL] Attempting regex score extraction from truncated response...');
                    const fluencyMatch = evalText.match(/"fluency"\s*:\s*([\d.]+)/);
                    const lexicalMatch = evalText.match(/"lexical"\s*:\s*([\d.]+)/);
                    const grammarMatch = evalText.match(/"grammar"\s*:\s*([\d.]+)/);
                    const pronunciationMatch = evalText.match(/"pronunciation"\s*:\s*([\d.]+)/);
                    const feedbackMatch = evalText.match(/"feedback"\s*:\s*"([^"]*)"/);

                    if (fluencyMatch || lexicalMatch || grammarMatch || pronunciationMatch) {
                        parsed = {
                            fluency: fluencyMatch ? parseFloat(fluencyMatch[1]) : 0,
                            lexical: lexicalMatch ? parseFloat(lexicalMatch[1]) : 0,
                            grammar: grammarMatch ? parseFloat(grammarMatch[1]) : 0,
                            pronunciation: pronunciationMatch ? parseFloat(pronunciationMatch[1]) : 0,
                            feedback: feedbackMatch ? feedbackMatch[1] : 'Evaluation completed (partial response recovered).',
                            partScores: {},
                            criterionNotes: {},
                            strengths: [],
                            improvements: [],
                        };
                        console.log('[EVAL] Regex score extraction succeeded:', parsed.fluency, parsed.lexical, parsed.grammar, parsed.pronunciation);
                    }
                }

                if (!parsed) {
                    throw new Error(`No valid JSON found. Finish reason: ${finishReason}. Text length: ${evalText.length}`);
                }
            }

            // Validate and sanitize scores - handle string scores from AI
            const criteria = ['fluency', 'lexical', 'grammar', 'pronunciation'];
            criteria.forEach(field => {
                if (typeof parsed[field] === 'string') {
                    parsed[field] = parseFloat(parsed[field]);
                }
                // Clamp to valid IELTS range (0-9)
                if (typeof parsed[field] !== 'number' || isNaN(parsed[field])) {
                    parsed[field] = 0;
                } else {
                    parsed[field] = Math.min(9, Math.max(0, parsed[field]));
                }
            });

            // Allow evaluation even with some zero scores (the AI might legitimately score 0)
            // Only fail if ALL criteria are zero/missing (likely a parsing issue)
            const allZero = criteria.every(f => parsed[f] === 0);
            if (allZero) {
                throw new Error('All score fields are zero or missing - likely a parsing issue');
            }

            evaluation = parsed;

            // Ensure required string fields have defaults
            if (!evaluation.feedback) evaluation.feedback = 'Evaluation completed.';
            if (!evaluation.strengths) evaluation.strengths = [];
            if (!evaluation.improvements) evaluation.improvements = [];
            if (!evaluation.criterionNotes) evaluation.criterionNotes = {};

            // Recalculate overall band using the official formula
            evaluation.overallBand = calculateOverallBand(
                evaluation.fluency,
                evaluation.lexical,
                evaluation.grammar,
                evaluation.pronunciation
            );
        } catch (parseError) {
            console.error('Failed to parse evaluation:', parseError);
            console.error('Raw AI response (first 1000 chars):', evalText?.substring(0, 1000));
            console.error('Raw AI response (last 200 chars):', evalText?.substring(Math.max(0, evalText.length - 200)));

            // Return comprehensive debug info so we can see the exact issue in browser console
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'evaluation_parse_failed',
                    message: 'AI evaluation could not be parsed. Please retry.',
                    debug: {
                        evalTextLength: evalText?.length || 0,
                        finishReason: evalData?.candidates?.[0]?.finishReason || 'unknown',
                        candidatesCount: evalData?.candidates?.length || 0,
                    },
                }),
                { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Log successful usage
        await logApiUsage(supabase, user.id, 'evaluateSpeakingTest', false, tokensUsed, {
            testId,
            partsCompleted: Object.keys(allPartsConversation).length,
        });

        return new Response(
            JSON.stringify({
                success: true,
                evaluation,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('Error in evaluateSpeakingTest:', error);
        const corsHeaders = getCorsHeaders(req);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error', success: false }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
