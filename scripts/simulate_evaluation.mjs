import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAyvk0JtAWr65Zh4Csp11HvXWnKlH8fgTE";
const MODEL = 'gemini-2.5-flash';

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
      return JSON.parse(cleanText.trim());
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

const writingPrompt = "Some people think that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime. Discuss both views and give your opinion.";
const writingText = "In recent times, crime has become a serious problem in many societies. There are people who argue that sending criminals to prison for a long time will stop crime, while others say we need different methods. In this essay, I will discuss both sides before giving my opinion.\n\nOn the one hand, longer prison sentences can act as a strong deterrent. If individuals know they will lose their freedom for many years, they might think twice before committing a crime. Furthermore, keeping dangerous criminals locked up protects society. For example, murderers and violent offenders should be removed from the public to prevent further harm. This shows that strict punishment is necessary for serious offences.\n\nOn the other hand, alternatives like rehabilitation and education are also very effective. Many petty crimes are committed due to poverty or lack of opportunities. If we give these people a chance to learn a skill or get an education, they can find a job and contribute to society instead of returning to a life of crime. In addition, community service is a good way to punish minor offenders while giving back to the community.\n\nIn conclusion, while long prison terms are important for serious crimes, I believe that alternative methods such as education and rehabilitation are better ways to reduce crime in the long run. By solving the root causes of crime, we can create a safer society.";

const transcriptParts = {
    1: [
        { speaker: 'system', text: 'Where is your hometown?' },
        { speaker: 'user', text: 'My hometown is Dhaka, it is a very big city in Bangladesh. I like it very much because my friends are there.' }
    ],
    2: [
        { speaker: 'system', text: 'Describe a time when you helped someone.' },
        { speaker: 'user', text: 'I remember a time when I helped my younger brother with his math homework. He was very sad because he could not do it. I sit with him for 2 hours and explain the formulas. After that he feel very happy and say thank you to me.' }
    ],
    3: [
        { speaker: 'system', text: 'Is it important for neighbors to help each other?' },
        { speaker: 'user', text: 'Yes, it is very important. Because in everyday life we face many problems and neighbors are the closest people who can help. Like if there is a fire, neighbors come first.' }
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

const detailedSpeakingPrompt = `
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

const overallSpeakingPrompt = `
${fullTranscript}

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

async function run() {
    console.log("Analyzing Writing Feedback (Task 2)...");
    const writingFeedback = await fetchFromGemini(
        writingSystemInstruction, 
        [{ text: `Task Prompt: ${writingPrompt}\n\nStudent's Essay:\n${writingText}` }]
    );

    console.log("Analyzing Detailed Speaking Feedback (Q&A)...");
    const detailedSpeakingFeedback = await fetchFromGemini(detailedSpeakingPrompt, [], true);

    console.log("Analyzing Overall Speaking Evaluation...");
    const overallSpeakingFeedback = await fetchFromGemini(overallSpeakingPrompt, [], true);

    const result = {
        writingFeedback,
        detailedSpeakingFeedback,
        overallSpeakingFeedback,
        testInputs: {
            writingPrompt,
            writingText,
            speakingTranscript: transcriptParts
        }
    };

    fs.writeFileSync('feedback_simulation_results.json', JSON.stringify(result, null, 2));
    console.log("Results exported to feedback_simulation_results.json");
}

run();
