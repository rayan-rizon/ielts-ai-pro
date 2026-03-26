# Paraphrase Detective — Explanation Import Guide

## Overview

The **Paraphrase Detective** feature helps IELTS students understand why their reading test answers are incorrect by showing:

1. **Passage Highlight** — The exact sentence(s) from the passage that support the answer
2. **Synonym Map** — How the question paraphrases the passage text (the key IELTS reading skill)
3. **Why Correct** — A brief explanation of why the correct answer is right
4. **Why Wrong** — Targeted feedback for each incorrect option

## How to Generate Explanations with Gemini AI

### Step 1: Copy the Prompt Template

Open [Gemini AI](https://gemini.google.com) or [AI Studio](https://aistudio.google.com) and paste this prompt:

```
I have an IELTS Reading passage and its questions. For each question, generate a JSON explanation object.

**Output format**: A JSON object where keys are question numbers (as strings like "1", "2", etc.) and values follow this structure:

For MCQ / True-False-Not-Given / Yes-No-Not-Given questions:
{
  "passage_highlight": "The exact sentence(s) from the passage that contain the answer",
  "synonym_map": [
    {
      "question_keyword": "keyword from the question",
      "passage_keyword": "the paraphrased version in the passage",
      "connection": "Brief explanation of the paraphrase link"
    }
  ],
  "why_correct": "Why the correct answer is right (1-2 sentences)",
  "why_wrong": {
    "A": "Why option A is wrong",
    "B": "Why option B is wrong"
  }
}

For fill-in-the-blank questions (summary/notes/sentence completion), use:
{
  "blanks": {
    "27": {
      "passage_highlight": "The exact sentence from the passage",
      "synonym_map": [...],
      "why_correct": "Why this word/phrase is the answer"
    },
    "28": { ... }
  }
}

Rules:
- "passage_highlight" must be the EXACT text from the passage
- "synonym_map" should show HOW the question paraphrases the passage (the core IELTS skill)
- "why_wrong" keys should be the option letters (A, B, C, D) or TRUE/FALSE/NOT GIVEN
- Keep explanations concise but clear
- Output ONLY valid JSON, no markdown or comments

Here is the passage:
[PASTE YOUR PASSAGE HERE]

Here are the questions with correct answers:
[PASTE YOUR QUESTIONS AND ANSWERS HERE]
```

### Step 2: Paste Your Passage & Questions

Replace `[PASTE YOUR PASSAGE HERE]` with the full passage text, and `[PASTE YOUR QUESTIONS AND ANSWERS HERE]` with all questions and their correct answers.

### Step 3: Copy the JSON Output

Gemini will return a JSON object. Copy it.

### Step 4: Import into Admin Panel

1. Open the Reading Test editor in the Admin Panel
2. Click the **"✨ Explanations"** button
3. Paste the JSON into the text area
4. Click **"Parse & Preview"** to review
5. Click **"Import"** to save

---

## JSON Format Reference

### MCQ / True-False-Not-Given Example

```json
{
  "1": {
    "passage_highlight": "The number of students enrolling in these programs dropped significantly over the decade.",
    "synonym_map": [
      {
        "question_keyword": "declined",
        "passage_keyword": "dropped significantly",
        "connection": "Both express a decrease/reduction"
      },
      {
        "question_keyword": "enrollment",
        "passage_keyword": "students enrolling",
        "connection": "Same concept — number of people signing up"
      }
    ],
    "why_correct": "The passage states enrollments 'dropped significantly', which directly paraphrases 'declined' from the question. Option B is correct.",
    "why_wrong": {
      "A": "Option A mentions 'increased', which contradicts 'dropped significantly'.",
      "C": "Option C refers to a different time period not mentioned in the passage.",
      "D": "Option D discusses teaching quality, which is unrelated to enrollment numbers."
    }
  },
  "2": {
    "passage_highlight": "However, some researchers have argued that these findings may not be applicable to all cultural contexts.",
    "synonym_map": [
      {
        "question_keyword": "universally applicable",
        "passage_keyword": "not be applicable to all cultural contexts",
        "connection": "'Not applicable to all' contradicts 'universally applicable'"
      }
    ],
    "why_correct": "The passage says findings may NOT be applicable to all contexts, making the statement FALSE.",
    "why_wrong": {
      "TRUE": "The passage explicitly states they may NOT be applicable to all contexts.",
      "NOT GIVEN": "The passage directly addresses this claim, so the information IS given."
    }
  }
}
```

### Fill-in-the-Blank Example (Summary/Notes Completion)

```json
{
  "27": {
    "blanks": {
      "27": {
        "passage_highlight": "The experiment was conducted under strictly controlled laboratory conditions.",
        "synonym_map": [
          {
            "question_keyword": "controlled",
            "passage_keyword": "strictly controlled",
            "connection": "Direct match — the passage uses a stronger form"
          }
        ],
        "why_correct": "The passage explicitly says 'strictly controlled laboratory conditions', so the answer is 'controlled'."
      },
      "28": {
        "passage_highlight": "The participants were randomly selected from the general population.",
        "synonym_map": [
          {
            "question_keyword": "randomly chosen",
            "passage_keyword": "randomly selected",
            "connection": "'Chosen' and 'selected' are direct synonyms"
          }
        ],
        "why_correct": "The summary says 'randomly chosen' which paraphrases 'randomly selected' from the passage."
      }
    }
  }
}
```

### Matching Headings Example

```json
{
  "14": {
    "passage_highlight": "The first major breakthrough came in 1953, when Watson and Crick published their model of DNA structure.",
    "synonym_map": [
      {
        "question_keyword": "A pivotal discovery",
        "passage_keyword": "first major breakthrough",
        "connection": "Both refer to an important initial finding"
      }
    ],
    "why_correct": "Heading 'A pivotal discovery' matches the paragraph's focus on the 'first major breakthrough' — the DNA structure model."
  }
}
```

## Tips for Best Results

1. **Use Gemini 2.0 Flash or Pro** for fastest, most accurate results
2. **Include correct answers** in your prompt so Gemini can generate accurate "why_wrong" explanations
3. **Review the output** — sometimes Gemini might not quote the passage exactly. Edit the `passage_highlight` to match
4. **Use the Preview** in the import modal to catch issues before saving
5. For very long tests (40 questions), you can split into groups (Q1-13, Q14-26, Q27-40) and import multiple times
