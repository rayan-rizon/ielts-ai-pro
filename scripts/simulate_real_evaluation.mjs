import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}
const MODEL = 'gemini-2.5-flash';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchFromGemini(systemInstruction, userParts, isJson = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{ role: 'user', parts: [{text: systemInstruction}, ...userParts] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    }
  };
  
  if (isJson) {
      payload.generationConfig.responseMimeType = 'application/json';
      payload.contents = [{ parts: [{ text: systemInstruction }] }];
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.error(`Error: ${res.status} ${err}`);
    return null;
  }
  const data = await res.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
      else if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
      if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
      try {
          return JSON.parse(cleanText.trim());
      } catch (e) {
          console.error("JSON parse error, attempting to fix or returning empty object.", e.message);
          return {}; // fallback
      }
  }
  return null;
}

const writingSystemInstruction = `
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
- If the response is under 100 words total: cap ALL four criteria at Band 5.0. The sample is too small to demonstrate the range of features required for Band 6+.
- If the response is under 60 words: cap ALL four criteria at Band 4.0.
- State the word count and sample-size limitation explicitly in weaknesses.
- Do NOT claim 'a mix of complex and simple structures' or 'wide lexical range' from fewer than 4 sentences.

Content guidelines:
- strengths: 3–6 specific bullets. Every strength MUST cite a specific phrase or structural feature from the student's text as evidence. Do NOT attribute intentional technique to minimal or off-topic responses. If the response is under 100 words and off-topic, limit strengths to 1–2 items.
- weaknesses: 3–6 specific bullets. ALWAYS state the actual word count as the FIRST weakness bullet if the response is under the required minimum.
- suggestions: 5–10 bullets ordered by band-gain impact. Each must be a concrete action starting with a verb.
- corrections: genuine errors only. 5–12 items. 'original' must be copied verbatim from the student's text.
- vocabularyEnhancements: 5–10 items. Target weak, repetitive, or informal words.

If the student's writing is extremely short or completely off-topic, return valid JSON and score accordingly with honest, calibrated justification.

Task type: IELTS Academic Writing Task 2 (discursive essay).

STEP 1 — Word count check (MUST do before scoring):
- Count the candidate's words carefully (exclude the task prompt itself).
- Under 150 words → cap TaskAchievement at 3.0. State word count in weaknesses as first bullet.
- Under 200 words → cap TaskAchievement at 4.0.
- Under 250 words → cap TaskAchievement at 5.0.
- These ceilings are HARD LIMITS per official IELTS marking guidelines, regardless of content quality.
- 250+ words: no word count penalty. Proceed to STEP 2.

STEP 2 — Question type identification:
Identify the exact Task 2 question type from the prompt:
[Agree/Disagree | Discuss both views | Advantages and Disadvantages | Problem and Solution | Two-part question]

Evaluate TaskAchievement based on the expected approach for each type:
- Agree/Disagree: A clear, consistent position is required. The body paragraphs MUST predominantly argue FOR the candidate's stated position. If the candidate writes one paragraph 'for' and one paragraph 'against' with equal structural weight, this is a Discussion Essay structure applied to an Opinion Essay prompt — flag this explicitly.
- Discuss both views: BOTH views must receive equal, developed treatment.
- Advantages and Disadvantages: BOTH advantages AND disadvantages must be developed.
- Problem and Solution: Specific problems/causes must be identified AND specific, realistic solutions proposed.
- Two-part question: BOTH questions must be answered and developed.

STEP 3 — Prompt scenario fidelity check:
- Extract the 2–3 key scenario markers from the task prompt.
- Verify the candidate addressed at least 2 of these scenario markers specifically in their essay.
- If the candidate substituted a related but significantly different scenario, flag this as 'Prompt Drift' in weaknesses and reduce TaskAchievement by 0.5.
`;

const detailedSpeakingPromptTemplate = `
You are a senior IELTS examiner and speaking coach. Analyse the following speaking test transcript question-by-question and produce a structured JSON feedback report.

**TONE INSTRUCTION:** Write feedback in a warm, encouraging coaching voice — not a clinical assessment report. Use direct address ('you', 'your'). Acknowledge effort before identifying issues.

**IELTS SPEAKING TEST STRUCTURE — CONTEXT:**
- Part 1: Short, personal questions. 2–3 sentence answers, natural and conversational.
- Part 2: Candidate speaks for 1–2 minutes on a cue card topic. Band 6+ requires at least 90 seconds.
- Part 3: Abstract, analytical questions. Express opinions, analyse issues at length.

**CRITICAL RULES:**

1. Grammar error detection (non-negotiable):
   - Identify every grammatical error with exact incorrect phrase and correct form.
   - Do NOT state 'grammatical structures are used accurately' if any error exists.

2. Topic adherence check:
   - If candidate drifted to a related but different topic, flag in topicDrift field.

3. Response length calibration (Part 2 especially):
   - If Part 2 under 80 words, flag this prominently and make extending length the first improvement tip.

4. Band 9 samples — spoken register:
   - USE: contractions, discourse markers, natural hedging.
   - DO NOT USE: academic essay collocations, overly formal transitions.

5. Improvement advice calibration:
   - Match advice to the candidate's ACTUAL observed performance level.

6. Part-specific register coaching:
   - Part 1: conversational. Part 2: extended monologue. Part 3: analytical, hedging language rewarded.
   - If same register used across all parts, flag this.

**TRANSCRIPT:**
__TRANSCRIPT_PLACEHOLDER__

**OUTPUT FORMAT:**
Return ONLY a valid JSON array. No markdown formatting.

[
  {
    "part": 1,
    "question": "The exact examiner question",
    "candidateAnswer": "The candidate's verbatim response",
    "grammaticalErrors": [
      { "incorrect": "exact phrase", "correct": "corrected form", "explanation": "brief grammar note" }
    ],
    "topicDrift": "null or a string describing topic drift",
    "suggestedAnswer": "Band 9.0 sample in NATURAL SPOKEN ENGLISH",
    "feedback": "2–3 sentence coaching note"
  }
]
`;

const overallSpeakingPromptTemplate = `
__TRANSCRIPT_PLACEHOLDER__

You are a senior IELTS examiner conducting an official assessment of the COMPLETE speaking test (all 3 parts).

**PRE-SCORING RULES:**

Rule 1 — Audio availability: This is a text-only transcript. Set pronunciation to 0. Write in feedback: "Pronunciation cannot be assessed from a text transcript."

Rule 2 — Response length calibration:
- If Part 2 < 80 words: Fluency cannot exceed 6.0.
- If total candidate words < 150: no Band 7 Fluency.

**BAND ANCHOR DESCRIPTORS:**
Fluency: 9=fluent with rare repetition; 7=speaks at length, some repetition; 5=frequent repetition/self-correction.
Lexical: 9=full flexibility and precision; 7=good range, some imprecision; 5=limited vocabulary.
Grammar: 9=wide range, natural; 7=mix of complex/simple, some errors; 5=basic forms, frequent errors.

Format output as pure JSON:
{
  "fluency": 0.0,
  "lexical": 0.0,
  "grammar": 0.0,
  "pronunciation": 0,
  "feedback": "Overall feedback...",
  "strengths": ["..."],
  "improvements": ["..."]
}
`;



function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
}

async function run() {
    // 1. Fetch real questions
    console.log("Fetching real questions from Supabase...");
    const { data: wTests } = await supabase.from('passages').select('*, questions(*)').eq('test_type', 'writing').limit(1);
    const { data: sTests } = await supabase.from('passages').select('*, questions(*)').eq('test_type', 'speaking').limit(1);

    const writingTest = wTests[0];
    const speakingTest = sTests[0];

    let writingPromptTexts = writingTest.questions.sort((a,b) => a.question_number - b.question_number).map(q => stripHtml(q.question_text));
    
    // Task 1 and Task 2
    let task1Prompt = writingPromptTexts[0] || "The given charts show the proportion of energy generation from various sources.";
    let task2Prompt = writingPromptTexts[1] || "Describe the advantages and disadvantages of learning a new language.";
    
    // Provide a dummy response relevant to Task 1
    const task1Text = "The provided charts illustrate the percentage of electricity produced from various sources in a specific nation over a ten-year period between 2010 and 2020. Overall, it is clearly seen that while the reliance on traditional fossil fuels such as coal and oil experienced a significant downward trend, the utilization of renewable energy, particularly solar and wind power, saw a substantial increase. In 2010, coal was the primary source, accounting for roughly 50% of the total, but this figure dropped to just under 30% by 2020.";

    // Provide a dummy response relevant to Task 2
    const task2Text = "In today's globalized world, learning a foreign language has become increasingly important. However, it can also bring some challenges. I agree that while there are difficulties, the benefits far outweigh them.\n\nFirstly, learning a new language can be very difficult. Beginners often struggle with grammar and vocabulary, which causes frustration. For example, a student might feel shy when speaking to native speakers because of their accent. This can lead to social anxiety.\n\nOn the other hand, speaking a foreign language opens up many opportunities. It allows people to communicate with people from different cultures, which improves understanding. Moreover, many companies prefer to hire employees who are bilingual. Therefore, it can lead to better career prospects.\n\nIn conclusion, despite the initial practical and social problems, I believe that learning a foreign language is a valuable skill that offers numerous personal and professional benefits.";

    let sQ1 = speakingTest.questions.find(q => q.question_number === 1)?.correct_answer?.split('\n')[0] || "Where are you from?";
    let sQ2 = speakingTest.questions.find(q => q.question_number === 2)?.correct_answer?.split('\n')[0] || "Describe a movie you watched recently.";
    let sQ3 = speakingTest.questions.find(q => q.question_number === 3)?.correct_answer?.split('\n')[0] || "What kind of movies are popular in your country?";

    const transcriptParts = {
        1: [
            { speaker: 'system', text: sQ1 },
            { speaker: 'user', text: "Well, I think I do somewhat. But not as much as I should. I usually take the bus or drive when I go out." }
        ],
        2: [
            { speaker: 'system', text: sQ2 },
            { speaker: 'user', text: "Recently I watched an amazing film called Inception. It is a science fiction movie directed by Christopher Nolan. The story is very unique because it's about going inside people's dreams. I would love to watch it again with my friends because it is very confusing and we can discuss it afterwards." }
        ],
        3: [
            { speaker: 'system', text: sQ3 },
            { speaker: 'user', text: "In my country, romantic comedies and action movies are very popular. But nowadays, many young people are also watching thrillers and science fiction films. I think theater is still a good place for entertainment." }
        ]
    };

    let fullTranscript = '';
    [1, 2, 3].forEach((part) => {
        fullTranscript += '=== PART ' + part + ' ===\n';
        transcriptParts[part].forEach((entry) => {
            fullTranscript += (entry.speaker === 'user' ? 'Candidate' : 'Examiner') + ': ' + entry.text + '\n';
        });
        fullTranscript += '\n';
    });


    // 2. Run Gemini Evaluation
    console.log("Analyzing Writing Feedback (Task 1 real prompt)...");
    const task1Feedback = await fetchFromGemini(
        writingSystemInstruction.replace("Task 2 (essay)", "Task 1 (report)"), 
        [{ text: `Task Prompt: ${task1Prompt}\n\nStudent's Report:\n${task1Text}` }]
    );

    console.log("Analyzing Writing Feedback (Task 2 real prompt)...");
    const task2Feedback = await fetchFromGemini(
        writingSystemInstruction, 
        [{ text: `Task Prompt: ${task2Prompt}\n\nStudent's Essay:\n${task2Text}` }]
    );

    console.log("Analyzing Detailed Speaking Feedback (Real initial questions)...");
    const detailedPrompt = detailedSpeakingPromptTemplate.replace('__TRANSCRIPT_PLACEHOLDER__', fullTranscript);
    const detailedSpeakingFeedback = await fetchFromGemini(detailedPrompt, [], true);

    console.log("Analyzing Overall Speaking Evaluation...");
    const overallPrompt = overallSpeakingPromptTemplate.replace('__TRANSCRIPT_PLACEHOLDER__', fullTranscript);
    const overallSpeakingFeedback = await fetchFromGemini(overallPrompt, [], true);

    // 3. Export to Markdown
    console.log("Generating Markdown report...");
    
    let mdContent = `# IELTS Feedback Simulation Report (Real Questions)

This report was generated using the exact evaluation prompts from the IELTS Mastery Pro app, simulating a candidate's test with real questions pulled from the database.

## 1. Writing Test Simulation

### Task 1
**Writing Prompt (Task 1):**
> ${task1Prompt}

**Simulated Candidate Response:**
> ${task1Text}

#### Task 1 Evaluation Results
- **Overall Band**: ${task1Feedback?.overallBand || 'N/A'}
- **Task Achievement**: ${task1Feedback?.criteriaScores?.TaskAchievement || 'N/A'}
- **Coherence & Cohesion**: ${task1Feedback?.criteriaScores?.CoherenceAndCohesion || 'N/A'}
- **Lexical Resource**: ${task1Feedback?.criteriaScores?.LexicalResource || 'N/A'}
- **Grammar & Accuracy**: ${task1Feedback?.criteriaScores?.GrammaticalRangeAndAccuracy || 'N/A'}

**Strengths:**
`;
    if (task1Feedback && task1Feedback.strengths) {
        task1Feedback.strengths.forEach(s => { mdContent += `- ${s}\n`; });
    }

    mdContent += `\n**Weaknesses:**\n`;
    if (task1Feedback && task1Feedback.weaknesses) {
        task1Feedback.weaknesses.forEach(w => { mdContent += `- ${w}\n`; });
    }

    mdContent += `\n**Suggestions for Improvement:**\n`;
    if (task1Feedback && task1Feedback.suggestions) {
        task1Feedback.suggestions.forEach(s => { mdContent += `- ${s}\n`; });
    }

    mdContent += `\n**Corrections:**\n`;
    if (task1Feedback && task1Feedback.corrections) {
        task1Feedback.corrections.forEach(c => { 
            mdContent += `- **Original:** "${c.original}"\n  **Correction:** "${c.correction}"\n  **Reason:** ${c.explanation}\n\n`; 
        });
    }

    mdContent += `**Vocabulary Enhancements:**\n`;
    if (task1Feedback && task1Feedback.vocabularyEnhancements) {
        task1Feedback.vocabularyEnhancements.forEach(v => { 
            mdContent += `- **Word/Phrase:** "${v.original}"\n  **Better Alternatives:** ${v.alternatives?.join(', ')}\n  **Context:** ${v.context}\n\n`; 
        });
    }

    mdContent += `\n---\n\n### Task 2\n**Writing Prompt (Task 2):**\n> ${task2Prompt}\n\n**Simulated Candidate Response:**\n> ${task2Text}\n\n#### Task 2 Evaluation Results\n- **Overall Band**: ${task2Feedback?.overallBand || 'N/A'}\n- **Task Achievement**: ${task2Feedback?.criteriaScores?.TaskAchievement || 'N/A'}\n- **Coherence & Cohesion**: ${task2Feedback?.criteriaScores?.CoherenceAndCohesion || 'N/A'}\n- **Lexical Resource**: ${task2Feedback?.criteriaScores?.LexicalResource || 'N/A'}\n- **Grammar & Accuracy**: ${task2Feedback?.criteriaScores?.GrammaticalRangeAndAccuracy || 'N/A'}\n\n**Strengths:**\n`;
    if (task2Feedback && task2Feedback.strengths) {
        task2Feedback.strengths.forEach(s => { mdContent += `- ${s}\n`; });
    }

    mdContent += `\n**Weaknesses:**\n`;
    if (task2Feedback && task2Feedback.weaknesses) {
        task2Feedback.weaknesses.forEach(w => { mdContent += `- ${w}\n`; });
    }

    mdContent += `\n**Suggestions for Improvement:**\n`;
    if (task2Feedback && task2Feedback.suggestions) {
        task2Feedback.suggestions.forEach(s => { mdContent += `- ${s}\n`; });
    }

    mdContent += `\n**Corrections:**\n`;
    if (task2Feedback && task2Feedback.corrections) {
        task2Feedback.corrections.forEach(c => { 
            mdContent += `- **Original:** "${c.original}"\n  **Correction:** "${c.correction}"\n  **Reason:** ${c.explanation}\n\n`; 
        });
    }

    mdContent += `**Vocabulary Enhancements:**\n`;
    if (task2Feedback && task2Feedback.vocabularyEnhancements) {
        task2Feedback.vocabularyEnhancements.forEach(v => { 
            mdContent += `- **Word/Phrase:** "${v.original}"\n  **Better Alternatives:** ${v.alternatives?.join(', ')}\n  **Context:** ${v.context}\n\n`; 
        });
    }

    mdContent += `---

## 2. Speaking Test Simulation

**Full Speaking Transcript:**
\`\`\`text
${fullTranscript.trim()}
\`\`\`

### Overall Speaking Evaluation
- **Fluency**: ${overallSpeakingFeedback?.fluency || 'N/A'}
- **Lexical Resource**: ${overallSpeakingFeedback?.lexical || 'N/A'}
- **Grammatical Range**: ${overallSpeakingFeedback?.grammar || 'N/A'}
- **Pronunciation**: ${overallSpeakingFeedback?.pronunciation || 'N/A'}

**Overall Examiner Feedback:**
${overallSpeakingFeedback?.feedback || 'N/A'}

**Strengths:**\n`;
    if (overallSpeakingFeedback && overallSpeakingFeedback.strengths) {
        overallSpeakingFeedback.strengths.forEach(s => { mdContent += `- ${s}\n`; });
    }

    mdContent += `\n**Improvements:**\n`;
    if (overallSpeakingFeedback && overallSpeakingFeedback.improvements) {
        overallSpeakingFeedback.improvements.forEach(i => { mdContent += `- ${i}\n`; });
    }

    mdContent += `\n### Detailed Question-by-Question Analysis\n`;

    if (detailedSpeakingFeedback && Array.isArray(detailedSpeakingFeedback)) {
        detailedSpeakingFeedback.forEach(item => {
            mdContent += `\n#### Part ${item.part}: ${item.question}\n`;
            mdContent += `- **Candidate's Answer:** ${item.candidateAnswer || item.original}\n`;
            mdContent += `- **Band 9.0 Suggestion:** ${item.suggestedAnswer || item.sample}\n`;
            mdContent += `- **Examiner Feedback:** ${item.feedback}\n`;
            if (item.topicDrift && item.topicDrift !== 'null') {
                mdContent += `- **Topic Drift:** ${item.topicDrift}\n`;
            }
            if (item.grammaticalErrors && item.grammaticalErrors.length > 0) {
                mdContent += `- **Grammatical Errors:**\n`;
                item.grammaticalErrors.forEach(err => {
                    mdContent += `  - *Incorrect:* ${err.incorrect} -> *Correct:* ${err.correct} (${err.explanation})\n`;
                });
            }
        });
    }

    fs.writeFileSync('IELTS_Mastery_Pro_Final_Evaluation_Results.md', mdContent);
    console.log("Results exported to IELTS_Mastery_Pro_Final_Evaluation_Results.md");
}

run();
