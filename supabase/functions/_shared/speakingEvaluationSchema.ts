export const SPEAKING_EVALUATION_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    fluency: { type: 'NUMBER' },
    lexical: { type: 'NUMBER' },
    grammar: { type: 'NUMBER' },
    pronunciation: { type: 'NUMBER', nullable: true },
    feedback: { type: 'STRING' },
    partScores: {
      type: 'OBJECT',
      properties: {
        part1: {
          type: 'OBJECT',
          properties: {
            band: { type: 'NUMBER', nullable: true },
            keyObservation: { type: 'STRING' },
          },
          required: ['band', 'keyObservation'],
        },
        part2: {
          type: 'OBJECT',
          properties: {
            band: { type: 'NUMBER', nullable: true },
            keyObservation: { type: 'STRING' },
          },
          required: ['band', 'keyObservation'],
        },
        part3: {
          type: 'OBJECT',
          properties: {
            band: { type: 'NUMBER', nullable: true },
            keyObservation: { type: 'STRING' },
          },
          required: ['band', 'keyObservation'],
        },
      },
      required: ['part1', 'part2', 'part3'],
    },
    criterionNotes: {
      type: 'OBJECT',
      properties: {
        fluency: { type: 'STRING' },
        lexical: { type: 'STRING' },
        grammar: { type: 'STRING' },
        pronunciation: { type: 'STRING' },
      },
      required: ['fluency', 'lexical', 'grammar', 'pronunciation'],
    },
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    improvements: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          area: { type: 'STRING' },
          tip: { type: 'STRING' },
        },
        required: ['area', 'tip'],
      },
    },
    targetBandTips: { type: 'STRING' },
  },
  required: [
    'fluency',
    'lexical',
    'grammar',
    'pronunciation',
    'feedback',
    'partScores',
    'criterionNotes',
    'strengths',
    'improvements',
    'targetBandTips',
  ],
};
