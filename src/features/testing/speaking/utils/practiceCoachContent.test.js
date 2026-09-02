import { describe, expect, it } from 'vitest';

import { getPracticeCoachContent } from './practiceCoachContent';

describe('getPracticeCoachContent', () => {
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
