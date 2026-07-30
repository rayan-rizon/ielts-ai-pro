import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ConversationMessage from '@/features/testing/speaking/components/ConversationMessage';

describe('speaking conversation message', () => {
  it('keeps the live transcript visible while the final transcript is prepared', () => {
    render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{
          speaker: 'user',
          text: 'I enjoyed studying science at school.',
          isLoading: true,
          isTranscriptDraft: true,
        }}
      />
    );

    expect(screen.getByText('I enjoyed studying science at school.')).toBeInTheDocument();
    expect(screen.getByText('Finalising transcript')).toBeInTheDocument();
  });

  it('shows a transcript-only loading state when no live words are available', () => {
    render(
      <ConversationMessage
        index={0}
        authUser={{ full_name: 'Candidate' }}
        entry={{ speaker: 'user', text: '', isLoading: true, isTranscriptDraft: false }}
      />
    );

    expect(screen.getByText('Preparing transcript')).toBeInTheDocument();
    expect(screen.queryByText('Answer captured')).not.toBeInTheDocument();
  });
});
