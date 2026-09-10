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
          status={{ freeDailyAssists: 5, remainingByAction: { translate: 4, breakdown: 5 } }}
          language="bn"
          onLanguageChange={vi.fn()}
          onActionChange={onActionChange}
          onClose={onClose}
          isMobile={false}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('4 of 5 free Translations left today')).toBeInTheDocument();
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

  it('renders sentence breakdown with core idea, clause breakdown cards, and tone badge', () => {
    render(
      <MemoryRouter>
        <SentenceAssistantPopover
          assistant={{
            action: 'breakdown',
            loading: false,
            result: {
              coreIdea: 'The preliminary findings show a strong correlation.',
              structures: [
                {
                  fragment: 'Although early results were varied',
                  explanation: 'Subordinate clause showing contrast.',
                },
                {
                  fragment: 'the primary hypothesis was confirmed',
                  explanation: 'Main clause providing the central claim.',
                },
              ],
              tone: 'Academic',
            },
            position: { x: 200, y: 120 },
          }}
          status={{ freeDailyAssists: 5, remainingByAction: { translate: 5, breakdown: 3 } }}
          language="en"
          onLanguageChange={vi.fn()}
          onActionChange={vi.fn()}
          onClose={vi.fn()}
          isMobile={false}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('In simple words')).toBeInTheDocument();
    // Translate is untouched by Breakdown use: the two allowances are separate.
    expect(screen.getByText('3 of 5 free Breakdowns left today')).toBeInTheDocument();
    expect(
      screen.getByText('The preliminary findings show a strong correlation.')
    ).toBeInTheDocument();
    expect(screen.getByText('Academic')).toBeInTheDocument();
    expect(screen.getByText('Parts explained')).toBeInTheDocument();
    expect(screen.getByText('“Although early results were varied”')).toBeInTheDocument();
    expect(screen.getByText('Subordinate clause showing contrast.')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
  });

  it('renders compact quota exceeded view with upgrade CTA when daily limit is reached', () => {
    render(
      <MemoryRouter>
        <SentenceAssistantPopover
          assistant={{
            action: 'translate',
            loading: false,
            result: null,
            error: 'You have used today’s free Translate results. They reset at midnight UTC.',
            quotaExceeded: true,
            position: { x: 200, y: 120 },
          }}
          status={{ freeDailyAssists: 5, remainingByAction: { translate: 0, breakdown: 4 } }}
          language="bn"
          onLanguageChange={vi.fn()}
          onActionChange={vi.fn()}
          onClose={vi.fn()}
          isMobile={false}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Daily free limit reached')).toBeInTheDocument();
    expect(screen.getByText('Resets 00:00 UTC')).toBeInTheDocument();
    expect(
      screen.getByText(
        "You've used today's free Translate assists. Upgrade for unlimited access, or switch to Breakdown."
      )
    ).toBeInTheDocument();
    const upgradeLink = screen.getByRole('link', { name: /upgrade for unlimited assists/i });
    expect(upgradeLink).toBeInTheDocument();
    expect(upgradeLink).toHaveAttribute('href', '/pricing');
  });

  it('constrains dialog position so it never overflows over the left navbar / sidebar', () => {
    render(
      <MemoryRouter>
        <SentenceAssistantPopover
          assistant={{
            action: 'translate',
            loading: false,
            result: { translated: 'অনুবাদ', language: 'Bengali' },
            selection: {
              panelBounds: { left: 64, right: 600, top: 50, bottom: 800 },
            },
            // Clicked near the very left edge of the passage
            position: { x: 80, y: 70 },
          }}
          status={{ freeDailyAssists: 5, remainingByAction: { translate: 4, breakdown: 5 } }}
          language="bn"
          onLanguageChange={vi.fn()}
          onActionChange={vi.fn()}
          onClose={vi.fn()}
          isMobile={false}
        />
      </MemoryRouter>
    );
    const dialog = screen.getByRole('dialog', { name: 'Reading assistant' });
    // Left edge must be >= panelBounds.left + 12 (64 + 12 = 76px)
    expect(parseInt(dialog.style.left, 10)).toBeGreaterThanOrEqual(76);
  });
});
