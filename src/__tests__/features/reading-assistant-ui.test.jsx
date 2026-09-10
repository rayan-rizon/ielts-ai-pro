import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import HighlightMenu from '@/features/testing/reading/components/ReadingTest/components/HighlightMenu';
import SentenceAssistantPopover from '@/features/testing/reading/components/SentenceAssistantPopover';
import { isReadingAssistantAvailable } from '@/features/testing/reading/services/readingAiService';

describe('Reading assistant UI', () => {
  it('shows sentence actions without replacing highlights and notes', () => {
    const onAssistantAction = vi.fn();
    render(
      <HighlightMenu
        position={{ x: 300, y: 200 }}
        onSelectColor={vi.fn()}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
        isExistingHighlight={false}
        currentSelection={{ text: 'a selected sentence' }}
        setNewNote={vi.fn()}
        setShowNotes={vi.fn()}
        setShowHighlightMenu={vi.fn()}
        assistantEnabled
        onAssistantAction={onAssistantAction}
      />
    );
    expect(screen.getByTitle('Highlight in Yellow')).toBeInTheDocument();
    expect(screen.getByTitle('Add Note to Selection')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Simplify' }));
    expect(onAssistantAction).toHaveBeenCalledWith('simplify');
  });

  it('shows the authoritative free allowance and lets learners switch actions', () => {
    const onActionChange = vi.fn();
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <SentenceAssistantPopover
          assistant={{
            action: 'translate',
            loading: false,
            result: { translated: 'একটি অনুবাদ', language: 'Bengali' },
            position: { x: 200, y: 120 },
          }}
          status={{ remainingDailyQuota: 4 }}
          language="bn"
          onLanguageChange={vi.fn()}
          onActionChange={onActionChange}
          onClose={onClose}
          isMobile={false}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('4 of 5 free uses left today')).toBeInTheDocument();
    expect(screen.getByText('একটি অনুবাদ')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Uzbek' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Persian' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Traditional Chinese' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Breakdown' }));
    expect(onActionChange).toHaveBeenCalledWith('breakdown');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('allows Practice and completed Review while hiding active Exam assistance', () => {
    const session = { id: 'session' };
    expect(isReadingAssistantAvailable({ session, testMode: 'practice', isFinished: false })).toBe(
      true
    );
    expect(isReadingAssistantAvailable({ session, testMode: 'exam', isFinished: false })).toBe(
      false
    );
    expect(isReadingAssistantAvailable({ session, testMode: 'exam', isFinished: true })).toBe(true);
    expect(
      isReadingAssistantAvailable({ session: null, testMode: 'practice', isFinished: false })
    ).toBe(false);
  });
});
