import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAyvk0JtAWr65Zh4Csp11HvXWnKlH8fgTE";
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

const detailedSpeakingPromptTemplate = `
You are an expert IELTS examiner. Based on the following transcript of a candidate's speaking test, provide a detailed question-by-question analysis. 

For every question the examiner asks:
1. Extract the examiner's question.
2. Extract exactly what the candidate answered.
3. Provide a 'Band 9.0 Sample Response' (a more sophisticated, natural way to answer).
4. Provide 'Examiner Feedback' explaining why the suggestion is better (focus on lexical resource, grammatical range, and fluency). 

**CRITICAL:** The 'Examiner Feedback' must be concise—maximum 2 to 3 sentences. Use professional, formal IELTS examiner tone.

**TRANSCRIPT:**
__TRANSCRIPT_PLACEHOLDER__

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

const overallSpeakingPromptTemplate = `
__TRANSCRIPT_PLACEHOLDER__

You are an expert IELTS examiner calculating overall bands.
Generate evaluation strictly using official IELTS Band Descriptors (0-9 scale). Provide score for fluency, lexical, grammar, pronunciation, and feedback.
Format your output as pure JSON like:
{
  "fluency": 7.0,
  "lexical": 6.5,
  "grammar": 6.5,
  "pronunciation": 7.0,
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
