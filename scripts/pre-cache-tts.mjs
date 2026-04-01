#!/usr/bin/env node
/**
 * pre-cache-tts.mjs
 *
 * Phase 3 — Pre-generate and cache all static IELTS examiner phrases.
 * Run this script once (or after changing phrases) to pre-populate the
 * tts-cache Supabase Storage bucket with commonly-used examiner responses.
 *
 * These phrases cover ~25-30% of all TTS usage in every speaking test session,
 * served at ~$0 ongoing cost after one-time generation.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=your_key \
 *   GEMINI_API_KEY=your_google_key \
 *   node scripts/pre-cache-tts.mjs
 *
 * Or add to package.json scripts:
 *   "precache-tts": "node scripts/pre-cache-tts.mjs"
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ── Configuration ─────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;

const TTS_BUCKET = 'tts-cache';
const DEFAULT_VOICE = 'en-GB-Neural2-D';
const SPEAKING_RATE = 0.93;
const PITCH = -1.5;

// ── Static phrases to pre-cache ───────────────────────────────────────────────

const STATIC_PHRASES = [
  // ── Greetings (Part 1, 2, 3) ──
  {
    id: 'greeting_part1',
    text: "Hello! Welcome to the IELTS Speaking Test. I'm your AI examiner, and I'll be conducting Part 1 today. Let's begin the examination.",
  },
  {
    id: 'greeting_part2_transition',
    text: "Now it's time for Part 2, the Individual Long Turn. I'm going to give you a topic and I'd like you to talk about it for 1 to 2 minutes. Before you talk, you'll have one minute to think about what you're going to say. Here's your topic card.",
  },
  {
    id: 'greeting_part2_start',
    text: "Alright, your preparation time is up. Please start speaking now. Remember, you should talk for 1 to 2 minutes.",
  },

  // ── Farewell / Part complete ──
  {
    id: 'farewell_part1',
    text: "Thank you. That concludes Part 1. You did very well.",
  },
  {
    id: 'farewell_part2',
    text: "Thank you for your response. That brings us to the end of Part 2.",
  },
  {
    id: 'farewell_part3',
    text: "Thank you very much. That concludes the IELTS Speaking Test. You've done an excellent job.",
  },
  {
    id: 'farewell_full_test',
    text: "Thank you for completing all three parts of the IELTS Speaking Test. Your responses have been recorded and evaluated.",
  },

  // ── Recovery / Retry ──
  {
    id: 'retry_didnt_hear',
    text: "I'm sorry, I didn't quite catch that. Could you please say that again?",
  },
  {
    id: 'retry_speak_clearly',
    text: "I didn't hear anything. Please click the microphone and speak clearly.",
  },

  // ── Transitions ──
  {
    id: 'transition_encouragement',
    text: "That's very interesting. Thank you for sharing that.",
  },
  {
    id: 'transition_next_question',
    text: "Thank you. Let's move on to the next question.",
  },
  {
    id: 'transition_good_answer',
    text: "Good. Let me ask you about something else now.",
  },

  // ── Timer expired messages ──
  {
    id: 'time_up_part1',
    text: "That's all the time we have for Part 1. Let's move on.",
  },
  {
    id: 'time_up_part2',
    text: "That's all the time we have for Part 2. Let's move on.",
  },
  {
    id: 'time_up_part3',
    text: "That's all the time we have for Part 3. Let's move on.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function computeCacheKey(voice, text) {
  const input = `${voice}::${text.trim().toLowerCase()}`;
  const hash = crypto.createHash('sha1').update(input).digest('hex');
  return hash;
}

async function callGoogleTTS(text, voice, apiKey) {
  const languageCode = voice.startsWith('en-GB') ? 'en-GB' : 'en-US';

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name: voice },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: SPEAKING_RATE,
          pitch: PITCH,
          effectsProfileId: ['headphone-class-device'],
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google TTS API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const audioContent = data.audioContent;
  if (!audioContent) throw new Error('No audioContent in response');

  // Convert base64 to Buffer
  return Buffer.from(audioContent, 'base64');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!API_KEY) {
    console.error('❌ Missing GOOGLE_TTS_API_KEY or GEMINI_API_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log(`\n🎤 IELTS AI Pro — TTS Pre-Cache Script`);
  console.log(`   Voice: ${DEFAULT_VOICE}`);
  console.log(`   Phrases: ${STATIC_PHRASES.length}`);
  console.log(`   Bucket: ${TTS_BUCKET}\n`);

  let cached = 0;
  let skipped = 0;
  let failed = 0;

  for (const phrase of STATIC_PHRASES) {
    const cacheKey = await computeCacheKey(DEFAULT_VOICE, phrase.text);
    const fileName = `${cacheKey}.mp3`;

    // Check if already cached
    const { data: existingList } = await supabase.storage
      .from(TTS_BUCKET)
      .list('', { search: fileName, limit: 1 });

    const alreadyCached = existingList?.find((f) => f.name === fileName);

    if (alreadyCached) {
      console.log(`  ✅ SKIP  [${phrase.id}] — already cached`);
      skipped++;
      continue;
    }

    // Generate audio
    try {
      process.stdout.write(`  ⏳ GEN   [${phrase.id}]...`);
      const audioBuffer = await callGoogleTTS(phrase.text, DEFAULT_VOICE, API_KEY);

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from(TTS_BUCKET)
        .upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg',
          cacheControl: '31536000',
          upsert: false,
        });

      if (uploadError && !uploadError.message?.includes('already exists')) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage.from(TTS_BUCKET).getPublicUrl(fileName);
      console.log(` ✅ ${(audioBuffer.length / 1024).toFixed(1)}KB — ${urlData?.publicUrl?.slice(-50)}`);
      cached++;

      // Small delay between API calls to be kind to the rate limit
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.log(` ❌ FAILED — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Newly cached : ${cached}`);
  console.log(`   ⏭️  Already cached: ${skipped}`);
  console.log(`   ❌ Failed       : ${failed}`);
  console.log(`\n💰 Estimated cost: $${((cached * 150) / 1_000_000 * 16).toFixed(6)} (Google Neural2 pricing)\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
