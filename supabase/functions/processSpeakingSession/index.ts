// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore - Use npm: specifier for Node compatibility
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  getCorsHeaders,
  checkRateLimit,
  getRateLimitIdentifier,
  getBurstLimitConfig,
  checkTierAccess,
  reserveDatabaseQuota,
  finalizeApiUsage,
  quotaExceededResponse,
} from '../_shared/security.ts';
import { normalizeBandScore } from '../_shared/evaluationUtils.ts';

declare const Deno: any;

// === COST PROTECTION CONSTANTS ===
// Maximum allowed turns per part (IELTS standard + buffer)
// Part 1: 4-6 questions → 8 max turns
// Part 2: 1 topic + 1-2 follow-ups → 4 max turns
// Part 3: 4-6 questions → 8 max turns
const MAX_TURNS_PER_PART: Record<number, number> = { 1: 8, 2: 4, 3: 8 };
const MAX_TOTAL_TURNS = 20; // Absolute limit across all parts
const MAX_CONVERSATION_HISTORY = 6; // Only send last 6 entries to Gemini (3 Q&A pairs)
const MAX_AUDIO_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5MB max audio payload
const MAX_TRANSCRIPT_CHARS = 6000;
const MAX_HISTORY_ENTRY_CHARS = 2000;
const MAX_QUESTION_CONTEXT_CHARS = 2000;

interface ConversationEntry {
  role: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

interface SpeakingQuestion {
  id: string;
  question_text: string;
  part_number: number;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Warm-up ping — called on page load to eliminate cold start latency
  // Returns immediately without touching auth, DB, or Gemini
  if (req.method === 'POST') {
    try {
      const body = await req.clone().json();
      if (body?.ping === true) {
        return new Response(JSON.stringify({ pong: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch {
      /* not JSON or no ping field — continue normally */
    }
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

    // --- Rate Limiting Strategy (Hybrid) ---

    // 1. Get user's subscription tier
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, subscription_tier')
      .eq('auth_id', user.id)
      .single();

    const tier = (userProfile?.subscription_tier || 'free').toLowerCase();

    // Tier gate: Speaking tests require pro or higher
    const tierDenied = checkTierAccess(
      tier,
      ['free', 'pro', 'premium', 'admin'],
      corsHeaders,
      'Speaking Practice'
    );
    if (tierDenied) return tierDenied;

    // 2. Burst Protection (In-Memory)
    const burstConfig = getBurstLimitConfig(tier);
    const rateLimitId = getRateLimitIdentifier(req, user.id);
    const burstCheck = checkRateLimit(rateLimitId, burstConfig);

    if (!burstCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded (Burst)',
          message: 'Too many requests in a short period. Please wait a moment.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Daily/Monthly Quota — Enforced on the FIRST turn of each session.
    // This prevents users from doing unlimited Gemini calls by abandoning tests before report generation.
    // Subsequent turns in the same session bypass this check (session already paid for).

    // --- End Rate Limiting ---

    const {
      testId,
      speakingSessionId: requestedSpeakingSessionId,
      turnId,
      partNumber,
      audioBase64,
      userTranscript,
      conversationHistory = [],
      currentQuestionIndex = 0,
      questionContext = '',
      speechConfidence = null,
    } = await req.json();

    if (!testId || !partNumber) {
      return new Response(JSON.stringify({ error: 'testId and partNumber are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sessionQuery = supabase
      .from('test_sessions')
      .select('id, passage_id, test_type')
      .eq('user_id', userProfile?.id)
      .eq('test_type', 'speaking');
    sessionQuery = requestedSpeakingSessionId
      ? sessionQuery.eq('id', requestedSpeakingSessionId)
      : sessionQuery.eq('passage_id', testId).order('created_at', { ascending: false }).limit(1);

    const { data: ownedSession, error: sessionError } = await sessionQuery.maybeSingle();

    if (sessionError || !ownedSession) {
      return new Response(JSON.stringify({ error: 'Speaking session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (ownedSession.passage_id && ownedSession.passage_id !== testId) {
      return new Response(JSON.stringify({ error: 'Speaking session does not match this test' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const speakingSessionId = ownedSession.id;
    const quotaReservation = await reserveDatabaseQuota(
      supabase,
      user.id,
      'processSpeakingSession_start',
      'speaking',
      `speaking-session:${speakingSessionId}`,
      { testId, speakingSessionId }
    );
    if (!quotaReservation.allowed) {
      return quotaExceededResponse(quotaReservation, corsHeaders);
    }

    if (!Array.isArray(conversationHistory)) {
      return new Response(JSON.stringify({ error: 'conversationHistory must be an array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const promptTextSize =
      String(userTranscript || '').length +
      String(questionContext || '').length +
      conversationHistory.reduce(
        (total: number, entry: { text?: unknown }) => total + String(entry?.text || '').length,
        0
      );
    const hasOversizedHistoryEntry = conversationHistory.some(
      (entry: { text?: unknown }) => String(entry?.text || '').length > MAX_HISTORY_ENTRY_CHARS
    );

    if (
      promptTextSize > MAX_TRANSCRIPT_CHARS ||
      String(questionContext || '').length > MAX_QUESTION_CONTEXT_CHARS ||
      hasOversizedHistoryEntry
    ) {
      return new Response(
        JSON.stringify({ error: 'Speaking input exceeds maximum allowed size' }),
        {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // === COST PROTECTION: Turn Cap ===
    // Count user turns in conversation history to enforce per-part and total limits
    const userTurnsInHistory = conversationHistory.filter(
      (e: { speaker: string }) => e.speaker === 'user'
    ).length;
    const maxForThisPart = MAX_TURNS_PER_PART[partNumber] || 8;

    if (userTurnsInHistory >= maxForThisPart) {
      return new Response(
        JSON.stringify({
          error: 'Turn limit reached',
          message: `Maximum responses for Part ${partNumber} reached (${maxForThisPart}). Please proceed to the next part.`,
          isPartComplete: true,
          nextQuestionIndex: -1,
          totalQuestions: 0,
          success: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userTurnsInHistory >= MAX_TOTAL_TURNS) {
      return new Response(
        JSON.stringify({
          error: 'Total turn limit reached',
          message: 'Maximum total responses reached. The test will now complete.',
          isPartComplete: true,
          nextQuestionIndex: -1,
          success: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === COST PROTECTION: Audio Payload Size ===
    const estimatedAudioBytes = audioBase64 ? Math.ceil(audioBase64.length * 0.75) : 0;
    if (estimatedAudioBytes > MAX_AUDIO_PAYLOAD_BYTES) {
      return new Response(
        JSON.stringify({
          error: 'Audio too large',
          message: 'Your recording is too long. Please keep responses under 2 minutes.',
          success: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stableTurnId =
      typeof turnId === 'string' && turnId.length >= 16 && turnId.length <= 100
        ? turnId
        : `${partNumber}:${currentQuestionIndex}:${userTurnsInHistory}`;
    const turnReservation = await reserveDatabaseQuota(
      supabase,
      user.id,
      'processSpeakingSession',
      'speaking_turn',
      `speaking-turn:${speakingSessionId}:${stableTurnId}`,
      {
        testId,
        speakingSessionId,
        part: partNumber,
        questionIndex: currentQuestionIndex,
      }
    );
    if (!turnReservation.allowed) {
      return quotaExceededResponse(turnReservation, corsHeaders);
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Fetch the questions for this specific part from the database
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, correct_answer, question_number')
      .eq('passage_id', testId)
      .eq('question_number', partNumber)
      .order('id', { ascending: true });

    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }

    // Parse questions
    let questions: SpeakingQuestion[] = [];

    if (questionsData && questionsData.length > 0) {
      const firstQuestion = questionsData[0];
      const questionSource = firstQuestion.correct_answer || '';

      try {
        const parsedQuestions = JSON.parse(questionSource);
        if (Array.isArray(parsedQuestions)) {
          questions = parsedQuestions.map((q: any, idx: number) => ({
            id: `${firstQuestion.id}-${idx}`,
            question_text: typeof q === 'string' ? q : q.text || q.question,
            part_number: partNumber,
          }));
        }
      } catch {
        questions = questionsData.flatMap((q: any) => {
          const text = q.correct_answer || q.question_text || '';
          const lines = text.split('\n').filter((line: string) => line.trim());
          return lines.map((line: string, lineIdx: number) => ({
            id: `${q.id}-${lineIdx}`,
            question_text: line.trim(),
            part_number: q.question_number || partNumber,
          }));
        });
      }
    }

    if (questions.length === 0) {
      return new Response(JSON.stringify({ error: 'No questions found for this test part' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === Part 2 IELTS Fix: Collapse sub-points into monologue + 1 follow-up ===
    // In real IELTS, Part 2 sub-points ("You should say:") are on the cue card for
    // the candidate's reference — the examiner does NOT ask them individually.
    // The flow is: 1 long monologue -> 1 brief follow-up -> done.
    if (partNumber === 2 && questions.length > 2) {
      const mainTopic = questions[0];
      questions = [
        mainTopic,
        {
          id: `${mainTopic.id}-followup`,
          question_text:
            'Ask ONE brief follow-up question (1 sentence) related to what the candidate just said about the topic.',
          part_number: 2,
        },
      ];
    }

    // Determine the current question with safety check
    // Handle -1 (initial fetch) by defaulting to 0
    const safeQuestionIndex =
      currentQuestionIndex < 0 ? 0 : Math.min(currentQuestionIndex, questions.length - 1);
    const currentQuestion = questions[safeQuestionIndex];

    if (!currentQuestion) {
      return new Response(
        JSON.stringify({
          error: 'No question found at index',
          currentQuestionIndex,
          safeQuestionIndex,
          questionsLength: questions.length,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isLastQuestion = safeQuestionIndex >= questions.length - 1;
    const nextQuestionIndex = isLastQuestion ? -1 : safeQuestionIndex + 1;
    const nextQuestion = nextQuestionIndex >= 0 ? questions[nextQuestionIndex] : null;

    // For Part 2, strip "You should say:" sub-points from question text
    // The examiner only reads the main topic; the sub-points are on the candidate's cue card
    const cleanQuestionForExaminer = (text: string): string => {
      if (partNumber !== 2) return text;
      // Remove everything from "You should say:" onwards
      const idx = text.toLowerCase().indexOf('you should say');
      if (idx > 0) return text.substring(0, idx).trim();
      return text;
    };

    // Build the system prompt
    const isPart2 = partNumber === 2;
    const systemPrompt = `You are a professional IELTS Speaking examiner. Your voice is natural, encouraging yet formal, and typically British or Neutral Academic English.

CRITICAL FORMATTING RULE: 
- Use ONLY plain text. 
- NO markdown (**, *, #, backticks). 
- Use standard punctuation (commas, periods, question marks) to guide natural pacing. 

EXAMINATION STYLE:
- Speak at a moderate, clear pace.
- If the candidate gives a good answer, use brief variations in acknowledgment like "I see," "That's an interesting point," or "Thank you." 
- Avoid repeating the same acknowledgment every time.

EXAMINATION RULES:
1. ONLY ask the provided questions. NEVER create, invent, or add your own questions.
2. After the candidate answers, give a brief acknowledgment (1-2 sentences max) then proceed.
3. If the candidate goes off-topic, gently redirect: "Thank you. Let's get back to the topic of..."
4. Stay in examiner role. Do NOT answer candidate questions.

${
  isPart2
    ? `
PART 2 SPECIFIC RULES:
- This is the Long Turn. Candidates speak for 1-2 minutes.
- Do NOT read the prompt card bullet points aloud.
- After they finish, you may ask ONE brief follow-up or simply say "Thank you."
`
    : ''
}

CURRENT TEST DATA:
- Part: ${partNumber}
- Questions for this part:
${questions.map((q, idx) => `  ${idx + 1}. ${cleanQuestionForExaminer(q.question_text)}`).join('\n')}

CURRENT STATE:
- Candidate just answered Question ${safeQuestionIndex + 1}: "${cleanQuestionForExaminer(currentQuestion.question_text)}"
${nextQuestion ? `- Next question to ask: "${cleanQuestionForExaminer(nextQuestion.question_text)}"` : '- No more questions left for this part.'}

YOUR TASK:
Speak naturally. ${
      isLastQuestion
        ? `Acknowledge their final answer briefly and conclude: "Thank you very much. That concludes Part ${partNumber} of the speaking test."`
        : `Give a brief, varied acknowledgment (1 short sentence), then naturally transition to the next question: "${nextQuestion?.question_text ?? ''}"`
    }`;

    // Build conversation for Gemini
    const geminiContents: ConversationEntry[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      {
        role: 'model',
        parts: [
          {
            text: `I understand. I will conduct the IELTS Speaking Part ${partNumber} examination using only the provided questions. Let me ask the first question: "${questions[0].question_text}"`,
          },
        ],
      },
    ];

    // === COST PROTECTION: Truncate conversation history ===
    // Only send last N entries to Gemini to prevent O(n²) token growth
    const recentHistory =
      conversationHistory.length > MAX_CONVERSATION_HISTORY
        ? conversationHistory.slice(-MAX_CONVERSATION_HISTORY)
        : conversationHistory;

    // Add conversation history (truncated)
    recentHistory.forEach((entry: { speaker: string; text: string }) => {
      geminiContents.push({
        role: entry.speaker === 'user' ? 'user' : 'model',
        parts: [{ text: entry.text }],
      });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // FLOW: Multimodal (Audio + History) -> JSON (Transcript + Examiner)
    // Pronunciation scoring runs in PARALLEL and doesn't block the logic.
    // ═══════════════════════════════════════════════════════════════════════

    let userResponse = userTranscript || '';
    let pronunciationData: { pronunciationScore?: number; fluencyNotes?: string } | null = null;
    let pronunciationPromise: Promise<void> | null = null;
    let examinerText = '';
    let tokensUsed = 0;
    let pronunciationTokensUsed = 0;
    let isTranscriptionFailed = false;

    if (audioBase64 && !userResponse) {
      // Step 1: Pronunciation scoring — fires immediately in background
      // Runs in parallel with the examiner call (both depend on audio)
      const isPremiumTier = ['pro', 'premium', 'admin'].includes(tier);
      const confidenceHint =
        speechConfidence && speechConfidence.length > 0
          ? `\nBrowser speech recognition confidence data: ${JSON.stringify(speechConfidence.slice(0, 10))}`
          : '';

      const basicPrompt = `You are an IELTS pronunciation assessor. Listen to this audio and estimate pronunciation quality conservatively.

Question asked: "${questionContext || 'general conversation'}"${confidenceHint}

IELTS Pronunciation Band Anchors:
- Band 9: Uses a full range of pronunciation features with precision and subtlety; is effortless to understand.
- Band 7: Generally clear. L1 influence evident but rarely causes misunderstanding.
- Band 5: Frequent pronunciation errors causing some listener difficulty.

Evaluate only features clearly supported by the audio: articulation clarity, intelligibility, word stress, and intonation. Do not infer a first language or accent origin. If evidence is unclear, say so and avoid specific claims.

Respond ONLY with valid JSON (no markdown):
{"pronunciationScore": 6.5, "fluencyNotes": "brief 1-sentence assessment"}`;

      const detailedPrompt = `You are an IELTS pronunciation assessor. Listen to this audio and provide conservative pronunciation analysis.

Question asked: "${questionContext || 'general conversation'}"${confidenceHint}

IELTS Pronunciation Band Anchors:
- Band 9: Uses a full range of pronunciation features with precision and subtlety; is effortless to understand.
- Band 7: Generally clear. L1 influence evident but rarely causes misunderstanding.
- Band 5: Frequent pronunciation errors causing some listener difficulty.

Evaluate only features clearly supported by the audio: articulation clarity, intelligibility, word stress, and intonation. Do not infer a first language or accent origin.
Only identify a word or sound pattern when it is clearly audible and you are confident. Otherwise return empty arrays. Phrase issues as possible observations, not phonetic facts.

Respond ONLY with valid JSON (no markdown):
{
  "pronunciationScore": 6.5,
  "fluencyNotes": "brief 1-sentence assessment",
  "wordLevelFeedback": [{"word": "example", "issue": "stress on wrong syllable", "severity": "minor|moderate|major"}],
  "problematicSounds": ["/θ/ → /s/"],
  "overallClarity": "1-sentence clarity summary"
}`;
      const basicPronunciationSchema = {
        type: 'OBJECT',
        properties: {
          pronunciationScore: { type: 'NUMBER' },
          fluencyNotes: { type: 'STRING' },
        },
        required: ['pronunciationScore', 'fluencyNotes'],
      };
      const detailedPronunciationSchema = {
        type: 'OBJECT',
        properties: {
          pronunciationScore: { type: 'NUMBER' },
          fluencyNotes: { type: 'STRING' },
          wordLevelFeedback: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                word: { type: 'STRING' },
                issue: { type: 'STRING' },
                severity: { type: 'STRING', enum: ['minor', 'moderate', 'major'] },
              },
              required: ['word', 'issue', 'severity'],
            },
          },
          problematicSounds: { type: 'ARRAY', items: { type: 'STRING' } },
          overallClarity: { type: 'STRING' },
        },
        required: [
          'pronunciationScore',
          'fluencyNotes',
          'wordLevelFeedback',
          'problematicSounds',
          'overallClarity',
        ],
      };

      pronunciationPromise = fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: isPremiumTier ? detailedPrompt : basicPrompt },
                  { inlineData: { mimeType: 'audio/webm', data: audioBase64 } },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: isPremiumTier ? 250 : 80,
              responseMimeType: 'application/json',
              responseSchema: isPremiumTier
                ? detailedPronunciationSchema
                : basicPronunciationSchema,
            },
          }),
        }
      )
        .then(async (res) => {
          if (!res.ok) return;
          const data = await res.json();
          pronunciationTokensUsed = data.usageMetadata?.totalTokenCount || 0;
          const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || '')
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```/, '')
            .replace(/```$/, '')
            .trim();
          try {
            const p = JSON.parse(raw);
            const pronunciationScore = normalizeBandScore(p.pronunciationScore, false);
            pronunciationData = {
              pronunciationScore,
              fluencyNotes: p.fluencyNotes || null,
              ...(isPremiumTier && {
                wordLevelFeedback: p.wordLevelFeedback || null,
                problematicSounds: p.problematicSounds || null,
                overallClarity: p.overallClarity || null,
              }),
            };
          } catch {
            /* ignore parse errors */
          }
        })
        .catch(() => {
          /* swallow */
        });

      // Step 2: Single Multimodal Call for Transcript + Examiner Response
      geminiContents[0].parts[0].text += `

IMPORTANT MULTIMODAL INSTRUCTION:
You will receive an AUDIO recording of the candidate. You MUST:
1. Transcribe the candidate's speech perfectly. If completely inaudible or empty, set userTranscript to "(Inaudible)".
2. Respond to the candidate's answer as the examiner, strictly following the previous examination rules.

OUTPUT FORMAT: You MUST return valid JSON ONLY.
{
  "userTranscript": "what the candidate said...",
  "examinerResponse": "your response as the examiner..."
}`;

      geminiContents.push({
        role: 'user',
        parts: [{ inlineData: { mimeType: 'audio/webm', data: audioBase64 } }],
      });

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: geminiContents,
              generationConfig: {
                temperature: 0.3, // Balance: 0.0 for transcript, 0.7 for chat
                maxOutputTokens: 1024,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    userTranscript: { type: 'STRING' },
                    examinerResponse: { type: 'STRING' },
                  },
                  required: ['userTranscript', 'examinerResponse'],
                },
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          tokensUsed = data.usageMetadata?.totalTokenCount || 0;
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          try {
            const parsed = JSON.parse(raw);
            userResponse = parsed.userTranscript || '(Inaudible)';
            examinerText = parsed.examinerResponse || '';
          } catch (e) {
            userResponse = '(Audio received but transcription failed)';
          }
        } else {
          userResponse = '(Audio received but transcription failed)';
        }
      } catch (err) {
        userResponse = '(Audio received but transcription failed)';
      }
    } else if (userResponse) {
      // Step 2 Fallback: Text-only flow (if audio was disabled/missing)
      geminiContents.push({
        role: 'user',
        parts: [{ text: userResponse }],
      });

      try {
        const examinerResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: geminiContents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              },
            }),
          }
        );

        if (examinerResponse.ok) {
          const examinerData = await examinerResponse.json();
          examinerText = examinerData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          tokensUsed = examinerData.usageMetadata?.totalTokenCount || 0;
        }
      } catch (err) {
        /* swallow */
      }
    }

    isTranscriptionFailed =
      !userResponse ||
      userResponse.includes('(Unable to transcribe') ||
      userResponse.includes('(Audio received but transcription failed)') ||
      userResponse.includes('(Inaudible)') ||
      userResponse.trim() === '';

    if (isTranscriptionFailed) {
      console.warn('Transcription failed/inaudible, returning fallback response');
      examinerText = "I'm sorry, I didn't quite catch that. Could you please say that again?";
      userResponse = '(Inaudible)';
    } else {
      // Strip markdown from AI response
      examinerText = examinerText
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .trim();

      // === FAREWELL OVERRIDE: Deterministic farewell on last question ===
      if (isLastQuestion) {
        const farewells: Record<number, string> = {
          1: 'Thank you. That concludes Part 1 of the speaking test.',
          2: 'Thank you for your response. That brings us to the end of Part 2.',
          3: 'Thank you very much. That concludes the speaking test.',
        };
        examinerText = farewells[partNumber] || `Thank you. That concludes Part ${partNumber}.`;
      }
    }

    // Wait for pronunciation scoring to complete if it ran (low-priority, non-blocking)
    if (pronunciationPromise) {
      try {
        await pronunciationPromise;
      } catch {
        /* swallow */
      }
    }

    await finalizeApiUsage(
      supabase,
      turnReservation.reservationId,
      tokensUsed + pronunciationTokensUsed,
      false,
      {
        part: partNumber,
        isPartComplete: isLastQuestion && !isTranscriptionFailed,
        hasAudio: !!audioBase64,
        transcriptionFailed: isTranscriptionFailed,
        speakingSessionId,
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        examinerResponse: examinerText,
        userTranscript: userResponse,
        currentQuestionIndex,
        // If transcription failed, retry same question
        nextQuestionIndex: isTranscriptionFailed ? currentQuestionIndex : nextQuestionIndex,
        isPartComplete: isLastQuestion && !isTranscriptionFailed,
        totalQuestions: questions.length,
        pronunciationData, // Lightweight pronunciation score from audio analysis
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in processSpeakingSession:', error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
