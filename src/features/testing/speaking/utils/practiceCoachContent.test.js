import { describe, expect, it } from 'vitest';

import { getPracticeCoachContent } from './practiceCoachContent';

describe('getPracticeCoachContent', () => {
  it('finishes a where-and-what-it-was-like answer with a relevant sentence scaffold', () => {
    expect(
      getPracticeCoachContent({
        code: 'describe_place',
        evidenceQuote: 'I grew up in a small village in Dhaka, Bangladesh.',
        partNumber: 1,
      })
    ).toMatchObject({
      title: 'Describe life there',
      explanation:
        'You said where you grew up. Now answer the second part: what living there was like.',
      nextStep: 'Continue with: “Life there was … because …”',
      pattern: 'Place → description → supporting detail',
    });
  });

  it('uses a neutral relevant-detail prompt when semantic coaching is unavailable', () => {
    expect(getPracticeCoachContent({ code: 'add_relevant_detail' })).toMatchObject({
      title: 'Add one relevant detail',
      nextStep: 'Continue with one sentence about the exact topic.',
      pattern: 'Direct answer → relevant detail',
    });
  });

  it('turns a bounded coach code into a complete, usable next-sentence prompt', () => {
    expect(
      getPracticeCoachContent({
        code: 'develop_detail',
        evidenceQuote: 'The trip was memorable.',
        partNumber: 2,
      })
    ).toMatchObject({
      title: 'Turn the idea into a scene',
      evidenceQuote: 'The trip was memorable.',
      pattern: 'Main point → vivid detail → why it mattered',
    });
    expect(getPracticeCoachContent({ code: 'develop_detail' }).nextStep).toContain(
      'One moment I clearly remember'
    );
  });

  it('keeps a useful default if a future server code is unknown', () => {
    expect(getPracticeCoachContent({ code: 'future_code' })).toMatchObject({
      title: 'Build your next answer',
      pattern: 'Answer → reason → example',
    });
  });
});
