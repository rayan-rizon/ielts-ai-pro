#!/usr/bin/env node

import 'dotenv/config';

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

import { isSilenceSegment, parsePlainTranscript, parseSrt } from '../src/utils/parseSrt.js';

const TARGET_CATALOG = [
  {
    year: 2015,
    test: 1,
    partNumber: 1,
    mode: 'full_transcription',
    speakers: ['MAN', 'WOMAN'],
    prefix: '',
  },
  {
    year: 2015,
    test: 4,
    partNumber: 2,
    mode: 'full_transcription',
    speakers: ['GUIDE'],
    prefix: '',
  },
  {
    year: 2015,
    test: 4,
    partNumber: 3,
    mode: 'full_transcription',
    speakers: ['LAURA', 'TUTOR'],
    prefix: '',
  },
  {
    year: 2017,
    test: 2,
    partNumber: 2,
    mode: 'full_transcription',
    speakers: ['GUIDE'],
    prefix: '',
  },
  {
    year: 2015,
    test: 2,
    partNumber: 1,
    mode: 'full_transcription',
    speakers: ['INTERVIEWER', 'LUISA'],
    prefix: 'ANNOUNCER: Section 1. You will hear a man interviewing a woman in the street about her use of transport. First, you have some time to look at questions 1 to 5. You will see that there is an example that has been done for you. On this occasion only, the conversation relating to this will be played first.',
  },
  {
    year: 2015,
    test: 4,
    partNumber: 1,
    mode: 'full_transcription',
    speakers: ['MR THORNDYKE', 'CUSTOMER'],
    prefix: 'ANNOUNCER: Section 1. You will hear a customer phoning a builder to discuss some work she would like him to do on her home. First, you have some time to look at questions 1 to 6. You will see that there is an example that has been done for you. On this occasion only, the conversation relating to this will be played first.',
  },
  {
    year: 2016,
    test: 3,
    partNumber: 4,
    mode: 'full_transcription',
    speakers: ['SPEAKER'],
    prefix: 'ANNOUNCER: Section 4. You will hear part of a lecture to business students about the use of one particular type of research known as ethnography. First, you have some time to look at questions 31 to 40. Now listen carefully and answer questions 31 to 40.',
  },
  {
    year: 2016,
    test: 4,
    partNumber: 3,
    mode: 'full_transcription',
    speakers: ['SUPERVISOR', 'JOANNA'],
    prefix: 'ANNOUNCER: Section 3. You will hear a student called Joanna talking to her new supervisor about some research she has done on psychology and music. First, you have some time to look at questions 21 to 26. Now listen carefully and answer questions 21 to 26.',
  },
  {
    year: 2017,
    test: 2,
    partNumber: 1,
    mode: 'full_transcription',
    speakers: ['MAN', 'WOMAN'],
    prefix: 'ANNOUNCER: Section 1. You will hear a woman phoning a box office to ask about a festival in the town of Kenton. First, you have some time to look at questions 1 to 5. You will see that there is an example that has been done for you. On this occasion only, the conversation relating to this will be played first.',
  },
  {
    year: 2017,
    test: 3,
    partNumber: 1,
    mode: 'full_transcription',
    speakers: ['PAUL', 'SUSIE'],
    prefix: 'ANNOUNCER: Section 1. You will hear a man telephoning a friend to find out about their local public library. First, you have some time to look at questions 1 to 4. You will see that there is an example that has been done for you. On this occasion only, the conversation relating to this will be played first.',
  },
  {
    year: 2018,
    test: 1,
    partNumber: 1,
    mode: 'full_transcription',
    speakers: ['OFFICIAL', 'WOMAN'],
    prefix: 'ANNOUNCER: Section 1. You will hear a telephone conversation between a woman who wants to attend a cookery class and an official at a tourist information centre. First, you have some time to look at questions 1 to 6. You will see that there is an example that has been done for you. On this occasion only, the conversation relating to this will be played first.',
  },
  {
    year: 2018,
    test: 2,
    partNumber: 1,
    mode: 'full_transcription',
    speakers: ['MAN', 'WOMAN'],
    prefix: 'ANNOUNCER: Section 1. You will hear a woman phoning the secretary of a cycling club to find out about becoming a member. First, you have some time to look at questions 1 to 6. You will see that there is an example that has been done for you. On this occasion only, the conversation relating to this will be played first.',
  },
  {
    year: 2018,
    test: 3,
    partNumber: 4,
    mode: 'full_transcription',
    speakers: ['SPEAKER'],
    prefix: 'ANNOUNCER: Section 4. You will hear part of a biology lecture about an animal called the sleepy lizard, that is common in parts of Australia. First, you have some time to look at questions 31 to 40. Now listen carefully and answer questions 31 to 40.',
  },
  {
    year: 2019,
    test: 1,
    partNumber: 3,
    mode: 'full_transcription',
    speakers: ['TUTOR', 'CARLA', 'ROB'],
    prefix: 'ANNOUNCER: Section 3. You will hear two urban planning students called Carla and Rob discussing their presentation on cities built by the sea, following instructions from their tutor. First, you have some time to look at questions 21 to 25. Now listen carefully and answer questions 21 to 25.',
  },
  {
    year: 2022,
    test: 1,
    partNumber: 1,
    mode: 'full_transcription',
    speakers: ['PETER', 'JAN'],
    prefix: 'ANNOUNCER: Part 1. You will hear a woman called Jan phoning a man about their local conservation group. First, you have some time to look at questions 1 to 5. Now listen carefully and answer questions 1 to 5.',
  },
  {
    year: 2023,
    test: 1,
    partNumber: 4,
    speakers: ['SPEAKER'],
    prefix: 'ANNOUNCER: Part 4. You will hear a zoology student giving a presentation on the process of moving wild elephants to a new reserve known as translocation. First, you have some time to look at questions 31 to 40. Now listen carefully and answer questions 31 to 40.',
  },
  {
    year: 2024,
    test: 1,
    partNumber: 1,
    speakers: ['SALLY', 'CALLER'],
    prefix: 'ANNOUNCER: Part 1. You will hear a teaching assistant calling a country park about a school visit. First, you have some time to look at questions 1 to 6. Now listen carefully and answer questions 1 to 6.',
  },
  {
    year: 2024,
    test: 1,
    partNumber: 4,
    mode: 'full_transcription',
    speakers: ['SPEAKER'],
    prefix: 'ANNOUNCER: Part 4. You will hear an archaeology student giving a presentation on an important site in Ireland called the Ceide Fields. First, you have some time to look at questions 31 to 40. Now listen carefully and answer questions 31 to 40.',
  },
  {
    year: 2020,
    test: 3,
    partNumber: 1,
    speakers: ['SALLY', 'JOE'],
    prefix:
      'ANNOUNCER: Part 1. You will hear a woman who works at an employment agency talking to a man about jobs he could apply for. First, you have some time to look at questions 1 to 5. Now listen carefully and answer questions 1 to 5.',
  },
  {
    year: 2016,
    test: 1,
    partNumber: 4,
    speakers: ['SPEAKER'],
    // The imported SRT stops before the end of this audio, so it cannot be
    // used as an authoritative forced-alignment reference.
    mode: 'full_transcription',
    prefix: '',
  },
  {
    year: 2022,
    test: 2,
    partNumber: 3,
    speakers: ['ED', 'GEMMA'],
    prefix:
      "ANNOUNCER: Part 3. You will hear two Theatre Studies students discussing stage and screen performances of Shakespeare's play Romeo and Juliet. First, you have some time to look at questions 21 and 22. Now listen carefully and answer questions 21 and 22. ED: Did you make notes while you were watching the performances of Romeo and Juliet, Gemma?",
  },
  {
    year: 2023,
    test: 4,
    partNumber: 1,
    speakers: ['JULIE', 'GREG'],
    prefix: '',
  },
  {
    year: 2022,
    test: 3,
    partNumber: 3,
    speakers: ['HOLLY', 'TUTOR'],
    prefix: '',
  },
  {
    year: 2023,
    test: 2,
    partNumber: 3,
    speakers: ['ADAM', 'MICHELLE'],
    // The stored source already includes the full announcer introduction.
    prefix: '',
  },
  {
    year: 2023,
    test: 4,
    partNumber: 2,
    speakers: ['GUIDE'],
    prefix: '',
  },
  {
    year: 2023,
    test: 4,
    partNumber: 3,
    speakers: ['TUTOR', 'SEB', 'LIA'],
    prefix: '',
  },
  {
    year: 2023,
    test: 4,
    partNumber: 4,
    speakers: ['STUDENT'],
    prefix: '',
  },
  {
    year: 2026,
    test: 4,
    partNumber: 3,
    speakers: ['MIA', 'LEO'],
    prefix:
      'ANNOUNCER: Part three. You will hear two architecture students called Mia and Leo discussing their presentation on houses of the future. First, you have some time to look at questions 21 to 23. Now listen carefully and answer questions 21 to 23.',
  },
];

const requestedTargets = new Set(
  String(process.env.LISTENING_ALIGNMENT_TARGETS || '')
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean)
);
const TARGETS = requestedTargets.size
  ? TARGET_CATALOG.filter((target) =>
      requestedTargets.has(`${target.year}/${target.test}/${target.partNumber}`)
    )
  : TARGET_CATALOG;

const MODEL = process.env.LISTENING_ALIGNMENT_MODEL || 'gemini-2.5-flash';
const OUTPUT_DIR = process.env.LISTENING_ALIGNMENT_OUTPUT || '/tmp/ielts-listening-alignment';
const MIN_SEQUENTIAL_SIMILARITY = 0.9;

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function normalizeGeneratedSrt(value) {
  const normalized = String(value || '')
    .replace(/^\s*```(?:srt)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .replace(/\r\n?/g, '\n')
    .trim();

  // Do not reinterpret already valid SRT. Several loose-format detectors also
  // resemble SRT timestamp lines and are intended only as fallbacks.
  if (parseSrt(normalized).length >= 10) return normalized;

  const formatTimestamp = (value) => {
    const milliseconds = Math.max(0, Math.round(value * 1000));
    const hours = Math.floor(milliseconds / 3_600_000);
    const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
    const seconds = Math.floor((milliseconds % 60_000) / 1000);
    const fraction = milliseconds % 1000;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(fraction).padStart(3, '0')}`;
  };

  const parseLooseTimestamp = (value) => {
    const numbers = String(value).match(/\d+/g)?.map(Number) || [];
    if (numbers.length === 4) {
      const [hours, minutes, seconds, milliseconds] = numbers;
      // Gemini occasionally emits 00:08:390 for 8.390 seconds.
      if (seconds > 59) return hours * 3600 + minutes + seconds / 1000;
      return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    }
    if (numbers.length === 3) {
      const [minutes, seconds, milliseconds] = numbers;
      return minutes * 60 + seconds + milliseconds / 1000;
    }
    if (numbers.length === 2) return numbers[0] * 60 + numbers[1];
    return Number(numbers[0] || 0);
  };

  const inlineArrowCues = normalized
    .split('\n')
    .map((line) =>
      line.match(/^\s*([\d:,\.]+)\s*-->\s*([\d:,\.]+)\s+(.+?)\s*$/)
    )
    .filter(Boolean);
  if (inlineArrowCues.length >= 10) {
    const starts = inlineArrowCues.map((match) => parseLooseTimestamp(match[1]));
    // Correct a rare 00:02:00,000 rendering when the following cue proves the
    // intended value was 2 seconds, not 2 minutes.
    for (let index = 0; index < starts.length - 1; index += 1) {
      if (starts[index] > starts[index + 1] && starts[index] >= 60) starts[index] /= 60;
    }
    return inlineArrowCues
      .map((match, index) => {
        let end = parseLooseTimestamp(match[2]);
        if (end < starts[index] || (index < starts.length - 1 && end > starts[index + 1] + 30)) {
          end = Math.max(starts[index] + 0.2, (starts[index + 1] || starts[index] + 2) - 0.05);
        }
        return `${index + 1}\n${formatTimestamp(starts[index])} --> ${formatTimestamp(end)}\n${match[3]}`;
      })
      .join('\n\n');
  }

  const startOnlyCues = normalized
    .split('\n')
    .map((line) => line.match(/^\s*([\d:,\.]+)\s+(.+?)\s*$/))
    .filter((match) => match && !match[2].includes('-->'));
  if (startOnlyCues.length >= 10) {
    const cues = startOnlyCues.map((match) => ({
      start: parseLooseTimestamp(match[1]),
      text: match[2].trim(),
    }));
    return cues
      .map((cue, index) => {
        const nextStart = cues[index + 1]?.start;
        const end = Math.max(cue.start + 0.2, (nextStart || cue.start + 2.5) - 0.05);
        return `${index + 1}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(end)}\n${cue.text}`;
      })
      .join('\n\n');
  }

  const commaCues = normalized
    .split('\n')
    .map((line) => line.match(/^\s*([\d:]+)(?:,([\d:]+))?,(.+?)\s*$/))
    .filter(Boolean);
  if (commaCues.length >= 10) {
    const cues = commaCues.map((match) => ({
      start: parseLooseTimestamp(match[1]),
      explicitEnd: match[2] ? parseLooseTimestamp(match[2]) : null,
      text: match[3].trim(),
    }));
    return cues
      .map((cue, index) => {
        const nextStart = cues[index + 1]?.start;
        const end =
          cue.explicitEnd && cue.explicitEnd > cue.start
            ? cue.explicitEnd
            : Math.max(cue.start + 0.2, (nextStart || cue.start + 2.5) - 0.05);
        return `${index + 1}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(end)}\n${cue.text}`;
      })
      .join('\n\n');
  }

  const localizedXmlCues = [
    ...normalized.matchAll(
      /<时长>([^<]+)<\/时长>\s*(?:<speaker>([^<]+)<\/speaker>)?\s*<p>([\s\S]*?)<\/p>/gi
    ),
  ];
  if (localizedXmlCues.length >= 10) {
    const cues = localizedXmlCues.map((match) => ({
      start: parseLooseTimestamp(match[1]),
      speaker: match[2]?.trim(),
      text: match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    }));
    return cues
      .map((cue, index) => {
        const nextStart = cues[index + 1]?.start;
        const end = Math.max(cue.start + 0.2, (nextStart || cue.start + 2.5) - 0.05);
        return `${index + 1}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(end)}\n${cue.speaker ? `${cue.speaker}: ` : ''}${cue.text}`;
      })
      .join('\n\n');
  }

  const timedXmlCues = [
    ...normalized.matchAll(
      /<time\s+(?:begin="([^"]+)"\s+end="([^"]+)"|offset="([^"]+)"\s+duration="([^"]+)")\s*>([\s\S]*?)<\/time>/gi
    ),
  ];
  if (timedXmlCues.length >= 10) {
    return timedXmlCues
      .map((match, index) => {
        const start = parseLooseTimestamp(match[1] || match[3]);
        const end = match[2]
          ? parseLooseTimestamp(match[2])
          : start + parseLooseTimestamp(match[4]);
        const cueText = match[5].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        return `${index + 1}\n${formatTimestamp(start)} --> ${formatTimestamp(end)}\n${cueText}`;
      })
      .join('\n\n');
  }

  const speakerTagCues = [
    ...normalized.matchAll(
      /<([A-Za-z]+)\s+start="([^"]+)"\s+end="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g
    ),
  ].filter((match) => !/^repetition$/i.test(match[1]));
  if (speakerTagCues.length >= 10) {
    return speakerTagCues
      .map((match, index) => {
        const speaker = /^announcer$/i.test(match[1]) ? 'ANNOUNCER' : match[1].toUpperCase();
        const cueText = match[4].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        return `${index + 1}\n${formatTimestamp(parseLooseTimestamp(match[2]))} --> ${formatTimestamp(parseLooseTimestamp(match[3]))}\n${speaker}: ${cueText}`;
      })
      .join('\n\n');
  }

  const attributedCues = [
    ...normalized.matchAll(
      /<s\s+new\s+speaker="([^"]+)"\s+start="([^"]+)"\s+end="([^"]+)"[^>]*>([\s\S]*?)<\/s>/gi
    ),
  ];
  if (attributedCues.length >= 10) {
    return attributedCues
      .map((match, index) => {
        const cueText = match[4].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        return `${index + 1}\n${formatTimestamp(parseLooseTimestamp(match[2]))} --> ${formatTimestamp(parseLooseTimestamp(match[3]))}\n${match[1].toUpperCase()}: ${cueText}`;
      })
      .join('\n\n');
  }

  const bracketCues = [
    ...normalized.matchAll(/\[\s*(\d+)m(\d+)s(\d+)ms\s*-\s*(\d+)m(\d+)s(\d+)ms\s*\]\s*(.+?)(?=\n\[|$)/gs),
  ];
  if (bracketCues.length) {
    return bracketCues
      .map((match, index) => {
        const start = Number(match[1]) * 60 + Number(match[2]) + Number(match[3]) / 1000;
        const end = Number(match[4]) * 60 + Number(match[5]) + Number(match[6]) / 1000;
        return `${index + 1}\n${formatTimestamp(start)} --> ${formatTimestamp(end)}\n${match[7].replace(/\s+/g, ' ').trim()}`;
      })
      .join('\n\n');
  }

  if (!/<tstamp>[^<]+<\/tstamp>/i.test(normalized)) return normalized;

  const toSeconds = (value) => {
    const [minutes = '0', seconds = '0', fraction = '0'] = String(value).trim().split(':');
    return Number(minutes) * 60 + Number(seconds) + Number(fraction) / 10 ** fraction.length;
  };
  const cues = [...normalized.matchAll(/<tstamp>([^<]+)<\/tstamp>\s*([\s\S]*?)(?=<tstamp>|<\/srt>|$)/gi)]
    .map((match) => {
      const speaker = match[2].match(/<speaker>\s*([^<]+?)\s*<\/speaker>/i)?.[1]?.trim();
      const text = match[2]
        .replace(/<speaker>\s*[^<]+?\s*<\/speaker>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return { start: toSeconds(match[1]), speaker, text };
    })
    .filter((cue) => cue.text && Number.isFinite(cue.start));

  if (!cues.length) return normalized;

  let activeSpeaker = null;
  return cues
    .map((cue, index) => {
      if (cue.speaker) activeSpeaker = cue.speaker;
      const nextStart = cues[index + 1]?.start;
      const estimatedSpeechDuration = Math.max(0.8, cue.text.split(/\s+/).length / 2.5 + 0.5);
      const end = nextStart
        ? Math.max(cue.start + 0.1, Math.min(nextStart - 0.05, cue.start + estimatedSpeechDuration))
        : cue.start + estimatedSpeechDuration;
      const label = cue.speaker || activeSpeaker;
      return `${index + 1}\n${formatTimestamp(cue.start)} --> ${formatTimestamp(end)}\n${label ? `${label}: ` : ''}${cue.text}`;
    })
    .join('\n\n');
}

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function sequentialSimilarity(reference, candidate) {
  const left = tokenize(reference);
  const right = tokenize(candidate);
  if (!left.length || !right.length) return 0;

  let previous = new Uint16Array(right.length + 1);
  for (let i = 1; i <= left.length; i++) {
    const current = new Uint16Array(right.length + 1);
    for (let j = 1; j <= right.length; j++) {
      current[j] =
        left[i - 1] === right[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], current[j - 1]);
    }
    previous = current;
  }

  return (2 * previous[right.length]) / (left.length + right.length);
}

function sourceTranscript(part, prefix = '') {
  const timed = parseSrt(part.srt_content || '');
  if (timed.length) {
    const body = timed
      .filter((segment) => !isSilenceSegment(segment))
      .map((segment) => (segment.speaker ? `${segment.speaker}: ${segment.text}` : segment.text))
      .join('\n');
    const normalizedPrefix = tokenize(prefix.replace(/^\s*ANNOUNCER:\s*/i, '')).join(' ');
    const normalizedBody = tokenize(body).join(' ');
    // Do not duplicate the instructions when the source already starts with
    // them; duplicated reference text makes an otherwise correct alignment
    // fail validation and can cause the model to repeat the announcer.
    const effectivePrefix = normalizedPrefix && normalizedBody.startsWith(normalizedPrefix) ? '' : prefix;
    return `${effectivePrefix}\n${body}`.trim();
  }

  const plain = parsePlainTranscript(part.transcript || part.srt_content || '');
  if (plain.length) {
    return `${prefix}\n${plain
      .map((segment) => (segment.speaker ? `${segment.speaker}: ${segment.text}` : segment.text))
      .join('\n')}`.trim();
  }

  throw new Error(`No usable source transcript for ${part.title}`);
}

function getAudioDuration(path) {
  return Number(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', path],
      { encoding: 'utf8' }
    ).trim()
  );
}

async function alignTranscript({ audioBuffer, mimeType, reference, speakers }) {
  const prompt = `You are performing forced alignment, not free transcription.

Align the supplied authoritative IELTS audioscript to the supplied audio and output valid SRT only.

Rules:
- Preserve every spoken word from the authoritative audioscript in the same order.
- Do not paraphrase, summarize, add, or remove spoken content.
- The dialogue speakers are ${speakers.join(' and ')}. Identify them from their voices and conversation; label every turn with the correct name.
- Label fixed IELTS instructions as ANNOUNCER.
- The reference may contain missing or incorrect generic speaker labels, so speaker identity must come from the audio.
- Do not emit silence, music, or inaudible placeholders.
- Use precise HH:MM:SS,mmm timestamps from the audio.
- Cues must be chronological, non-overlapping, and concise.
- Include all speech from the beginning through the end.
- Output SRT only, without Markdown.

AUTHORITATIVE AUDIOSCRIPT:
${reference}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': requireEnvironment('GEMINI_API_KEY'),
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: audioBuffer.toString('base64') } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          topP: 0.1,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gemini alignment failed (${response.status}): ${(await response.text()).slice(0, 500)}`
    );
  }

  const payload = await response.json();
  const text =
    payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  return {
    srt: normalizeGeneratedSrt(text),
    finishReason: payload?.candidates?.[0]?.finishReason || 'UNKNOWN',
    tokens: payload?.usageMetadata?.totalTokenCount || 0,
  };
}

async function transcribeFullAudio({ audioBuffer, mimeType, speakers }) {
  const prompt = `Transcribe this entire IELTS Listening audio from the first spoken word to the last.

Rules:
- Output valid SRT only, without Markdown or commentary.
- Include every spoken instruction, dialogue turn, and ending announcement.
- Do not emit silence, music, or inaudible placeholders.
- Use chronological, non-overlapping HH:MM:SS,mmm timestamps that match the audio.
- The spoken presentation voice should use the label ${speakers[0] || 'SPEAKER'}; label fixed test instructions ANNOUNCER.
- Do not stop at a pause or at the first answer-check period. Continue through the actual end of the supplied audio.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': requireEnvironment('GEMINI_API_KEY'),
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: prompt }, { inlineData: { mimeType, data: audioBuffer.toString('base64') } }] },
        ],
        generationConfig: { temperature: 0, topP: 0.1, thinkingConfig: { thinkingBudget: 0 } },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Full transcription failed (${response.status}): ${(await response.text()).slice(0, 500)}`
    );
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  return {
    srt: normalizeGeneratedSrt(text),
    finishReason: payload?.candidates?.[0]?.finishReason || 'UNKNOWN',
    tokens: payload?.usageMetadata?.totalTokenCount || 0,
  };
}

function validateAlignment({ srt, reference, duration, mode }) {
  const segments = parseSrt(srt);
  const transcript = segments.map((segment) => segment.text).join(' ');
  const similarity = sequentialSimilarity(reference, transcript);
  const chronological = segments.every(
    (segment, index) =>
      segment.end > segment.start &&
      (!index || segment.start >= segments[index - 1].start) &&
      segment.end <= duration + 3
  );

  const hasFullAudioCoverage = (segments.at(-1)?.end || 0) >= duration - 8;

  return {
    accepted:
      segments.length >= 10 &&
      chronological &&
      (mode === 'full_transcription' ? hasFullAudioCoverage : similarity >= MIN_SEQUENTIAL_SIMILARITY) &&
      !segments.some(isSilenceSegment),
    cueCount: segments.length,
    chronological,
    duration,
    finalCueEnd: segments.at(-1)?.end || 0,
    hasFullAudioCoverage,
    sequentialSimilarity: Number(similarity.toFixed(4)),
  };
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const supabase = createClient(
    requireEnvironment('VITE_SUPABASE_URL'),
    requireEnvironment('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await supabase
    .from('passages')
    .select('id,title,cambridge_year,cambridge_test_number,content')
    .eq('test_type', 'listening')
    .order('cambridge_year')
    .order('cambridge_test_number');
  if (error) throw error;

  const report = [];
  for (const target of TARGETS) {
    const { year, test, partNumber, speakers, prefix } = target;
    const row = data.find(
      (candidate) => candidate.cambridge_year === year && candidate.cambridge_test_number === test
    );
    if (!row) throw new Error(`Missing Listening passage ${year}/${test}`);

    const parts = JSON.parse(row.content);
    const part = parts[partNumber - 1];
    const reference = target.mode === 'full_transcription' ? '' : sourceTranscript(part, prefix);
    const audioResponse = await fetch(part.audio_url);
    if (!audioResponse.ok) throw new Error(`Audio download failed: ${part.audio_url}`);
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const extension = new URL(part.audio_url).pathname.split('.').pop() || 'mp3';
    const audioPath = join(OUTPUT_DIR, `${year}-${test}-${partNumber}.${extension}`);
    writeFileSync(audioPath, audioBuffer);
    const duration = getAudioDuration(audioPath);

    const request = {
      audioBuffer,
      mimeType: audioResponse.headers.get('content-type') || 'audio/mpeg',
      speakers,
    };
    const aligned =
      target.mode === 'full_transcription'
        ? await transcribeFullAudio(request)
        : await alignTranscript({ ...request, reference });
    const validation = validateAlignment({ srt: aligned.srt, reference, duration, mode: target.mode });
    const srtPath = join(OUTPUT_DIR, `${year}-${test}-${partNumber}.srt`);
    writeFileSync(srtPath, aligned.srt);

    report.push({
      passageId: row.id,
      year,
      test,
      partNumber,
      title: part.title,
      audio: basename(audioPath),
      srt: basename(srtPath),
      finishReason: aligned.finishReason,
      tokens: aligned.tokens,
      ...validation,
    });
    console.log(
      `${year}/${test}/${partNumber}: ${validation.accepted ? 'ACCEPT' : 'REJECT'}`,
      validation
    );
  }

  writeFileSync(join(OUTPUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  if (report.some((entry) => !entry.accepted)) process.exitCode = 1;
}

if (process.argv[2] === '--normalize-result-dir') {
  const directory = process.argv[3];
  const reportPath = join(directory, 'report.json');
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const normalizedReport = report.map((entry) => {
    const srtPath = join(directory, entry.srt);
    const normalizedSrt = normalizeGeneratedSrt(readFileSync(srtPath, 'utf8'));
    writeFileSync(srtPath, normalizedSrt);
    return {
      ...entry,
      ...validateAlignment({
        srt: normalizedSrt,
        reference: '',
        duration: entry.duration,
        mode: 'full_transcription',
      }),
    };
  });
  writeFileSync(reportPath, JSON.stringify(normalizedReport, null, 2));
  console.log(JSON.stringify(normalizedReport, null, 2));
  if (normalizedReport.some((entry) => !entry.accepted)) process.exitCode = 1;
} else if (process.argv[2] === '--normalize-in-place') {
  const path = process.argv[3];
  const normalized = normalizeGeneratedSrt(readFileSync(path, 'utf8'));
  writeFileSync(path, normalized);
  console.log(JSON.stringify({ path, cues: parseSrt(normalized).length }, null, 2));
} else if (process.argv[2] === '--normalize-file') {
  process.stdout.write(normalizeGeneratedSrt(readFileSync(process.argv[3], 'utf8')));
} else {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
