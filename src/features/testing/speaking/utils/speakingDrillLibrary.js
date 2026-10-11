/**
 * Fixed practice drills the speaking report can recommend.
 *
 * The report picks drills from this list with deterministic rules
 * (`selectPracticeDrills` in speakingReportInsights.js). No model writes or
 * chooses a drill, so recommendations stay consistent, cost nothing, and every
 * one of them can link somewhere real.
 *
 * `skill` maps onto Practice Lab skills (see features/skill-lab/skills.js);
 * `route` is used instead when the right place is Grammar Lab or Vocabulary.
 */
export const SPEAKING_DRILLS = {
  answer_reason_example: {
    id: 'answer_reason_example',
    title: 'Answer, reason, example',
    criterion: 'fluency',
    minutes: 10,
    steps: [
      'Pick three Part 1 questions from this report.',
      'Answer each one in a sentence. Then add “because…” and one real example from your life.',
      'Say each answer out loud twice. The second time, try not to stop.',
    ],
    skill: 'speaking_answer_extension',
  },
  part2_full_turn: {
    id: 'part2_full_turn',
    title: 'Speak for the full 2 minutes',
    criterion: 'fluency',
    minutes: 12,
    steps: [
      'Take 1 minute to write one or two words for each point on the topic card.',
      'Start a 2-minute timer. Talk about each point in order.',
      'If you finish early, say how you felt and what you would do differently.',
    ],
    skill: 'speaking_organisation',
  },
  part3_opinion_turn: {
    id: 'part3_opinion_turn',
    title: 'Your view, the other view, your choice',
    criterion: 'fluency',
    minutes: 10,
    steps: [
      'Give your opinion on a Part 3 question in one sentence.',
      'Then say what other people might think: “Some people say…”.',
      'End by saying which view you agree with, and why.',
    ],
    skill: 'speaking_organisation',
  },
  question_keywords: {
    id: 'question_keywords',
    title: 'Answer the exact question',
    criterion: 'fluency',
    minutes: 5,
    steps: [
      'Read a question and find its two most important words.',
      'Use those words, or words with the same meaning, in your first sentence.',
      'Only then add your reason and example.',
    ],
    skill: 'speaking_answer_extension',
  },
  linking_phrases: {
    id: 'linking_phrases',
    title: 'Join your ideas with linking phrases',
    criterion: 'fluency',
    minutes: 8,
    steps: [
      'Learn three linking phrases: “The main reason is…”, “Also…”, “So overall…”.',
      'Answer two questions from this report using all three phrases.',
      'Record yourself. Check that a full idea comes after each phrase.',
    ],
    skill: 'speaking_organisation',
  },
  paraphrase_repeats: {
    id: 'paraphrase_repeats',
    title: 'Stop repeating the same word',
    criterion: 'lexical',
    minutes: 8,
    steps: [
      'Find a word you used more than twice in your answers.',
      'Write two other words that mean the same thing.',
      'Answer the question again, using a different word each time.',
    ],
    skill: 'speaking_paraphrasing',
  },
  topic_words: {
    id: 'topic_words',
    title: 'Learn words for one topic',
    criterion: 'lexical',
    minutes: 10,
    steps: [
      'Pick the topic from this test where you didn’t know the right words.',
      'Add eight useful words for that topic to your vocabulary list.',
      'Say a sentence about your own life with each new word.',
    ],
    route: '/vocabulary',
  },
  fix_my_mistakes: {
    id: 'fix_my_mistakes',
    title: 'Fix your own mistakes',
    criterion: 'grammar',
    minutes: 6,
    steps: [
      'Look at the corrections under your answers.',
      'Say each correct sentence out loud three times.',
      'Then make one new sentence of your own in the same way.',
    ],
    route: '/grammar',
  },
  sound_pairs: {
    id: 'sound_pairs',
    title: 'Practise similar sounds',
    criterion: 'pronunciation',
    minutes: 5,
    steps: [
      'Say each pair slowly, then at normal speed.',
      'Record yourself. Listen: do the two words sound different?',
      'Use one word from each pair in a full sentence.',
    ],
  },
  shadow_stronger: {
    id: 'shadow_stronger',
    title: 'Copy the rhythm of a stronger answer',
    criterion: 'pronunciation',
    minutes: 8,
    steps: [
      'Read one stronger answer from this report out loud, slowly.',
      'Read it again at normal speed, in short groups of words.',
      'Now close it and answer the question in your own words.',
    ],
  },
  steady_pace: {
    id: 'steady_pace',
    title: 'Speak at a natural speed',
    criterion: 'fluency',
    minutes: 6,
    steps: [
      'Answer one question for 30 seconds while timing yourself.',
      'Try to say about 60 words in that time. Don’t rush the ends of words.',
      'Repeat with two more questions.',
    ],
  },
};

/** Minimal-pair prompts for the sounds Azure flags most often for this audience. */
export const SOUND_PAIRS = {
  θ: 'think / sink, three / free, bath / bass',
  ð: 'they / day, then / den, breathe / breed',
  v: 'very / berry, vest / best, vine / wine',
  w: 'west / vest, wine / vine, wet / vet',
  r: 'right / light, red / led, road / load',
  l: 'light / right, long / wrong, play / pray',
  z: 'zoo / sue, prize / price, eyes / ice',
  ʃ: 'ship / sip, shoe / sue, wash / was',
  ʒ: 'measure / mesher, vision / fission',
  æ: 'bad / bed, man / men, cat / cut',
  ɪ: 'ship / sheep, live / leave, fit / feet',
  ʊ: 'full / fool, pull / pool, look / Luke',
  ɜː: 'bird / bud, work / walk, shirt / short',
  ə: 'about, banana, today (keep the vowel short and weak)',
};

/** Plain-English names for sounds, for learners who don't read phonetic symbols. */
const SOUND_NAMES = {
  θ: '“th” in “think”',
  ð: '“th” in “this”',
  v: '“v” in “very”',
  w: '“w” in “wet”',
  r: '“r” in “red”',
  l: '“l” in “light”',
  z: '“z” in “zoo”',
  s: '“s” in “sun”',
  ʃ: '“sh” in “ship”',
  ʒ: '“s” in “measure”',
  tʃ: '“ch” in “chair”',
  dʒ: '“j” in “job”',
  ŋ: '“ng” in “sing”',
  h: '“h” in “hat”',
  f: '“f” in “fan”',
  p: '“p” in “pen”',
  b: '“b” in “bed”',
  æ: '“a” in “cat”',
  ɪ: '“i” in “sit”',
  iː: '“ee” in “see”',
  ʊ: '“oo” in “book”',
  uː: '“oo” in “food”',
  ɜː: '“ir” in “bird”',
  ə: 'the weak “a” in “about”',
  ʌ: '“u” in “cup”',
  ɒ: '“o” in “hot”',
  ɔː: '“or” in “door”',
  ɑː: '“ar” in “car”',
  e: '“e” in “bed”',
};

const bareSound = (sound) =>
  String(sound)
    .replace(/[/[\]]/g, '')
    .trim();

/** "/θ/ (“th” in “think”)" — the symbol plus a plain example word. */
export function describeSound(sound) {
  const bare = bareSound(sound);
  const name = SOUND_NAMES[bare];
  return name ? `/${bare}/ (${name})` : `/${bare}/`;
}

export function soundPairsFor(sounds = []) {
  return sounds
    .map((sound) =>
      String(sound)
        .replace(/[/[\]]/g, '')
        .trim()
    )
    .map((sound) => (SOUND_PAIRS[sound] ? { sound, pairs: SOUND_PAIRS[sound] } : null))
    .filter(Boolean)
    .slice(0, 2);
}
