import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskPanel } from '@/features/testing/writing/components/WritingTest/components/TaskPanel';
import WritingTestClock from '@/features/testing/writing/components/WritingTest/components/WritingTestClock';
import { WritingEditor } from '@/features/testing/writing/components/WritingTest/components/WritingEditor';
import { WritingHeader } from '@/features/testing/writing/components/WritingTest/components/WritingHeader';
import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';

const task1 = {
  title: 'IELTS 18 Academic Test 2 Task 1',
  prompt:
    '<p>The diagram below shows the floor plan of a public library 20 years ago and how it looks now.</p>',
  instructions: '<p>Spend about 20 minutes and write at least 150 words.</p>',
  sample_answer:
    '<p>The two floor plans illustrate changes made to a public library over a twenty-year period.</p>',
  image_url: 'https://example.com/library-map.png',
};

describe('Writing responsive layout and components', () => {
  beforeEach(() => {
    useWritingTestStore.setState({
      activeType: 'Task 1',
      compositeTasks: { 'Task 1': task1 },
      timeRemaining: 3600,
      drafts: { 'Task 1': '' },
      wordCount: 0,
      currentFeedback: null,
      isAnalyzing: false,
    });
  });

  it('renders WritingTestClock with accessible role="timer" and formatted aria-label', () => {
    render(<WritingTestClock />);
    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveAttribute('aria-label', 'Time remaining: 60:00');
    expect(screen.getByText('60:00')).toBeInTheDocument();
  });

  it('renders TaskPanel with mobile CTA button when onSwitchToEditor is provided', () => {
    const onSwitch = vi.fn();
    render(
      <TaskPanel
        task={task1}
        showSample={false}
        setShowSample={vi.fn()}
        onSwitchToEditor={onSwitch}
      />
    );

    expect(screen.getByText(/The diagram below shows/i)).toBeInTheDocument();
    const writeBtn = screen.getByRole('button', { name: /write your response/i });
    expect(writeBtn).toBeInTheDocument();

    fireEvent.click(writeBtn);
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('renders TaskPanel image zoom affordance and accessible sample answer toggle', () => {
    const setShowSample = vi.fn();
    render(<TaskPanel task={task1} showSample={false} setShowSample={setShowSample} />);

    // Zoom affordance label
    expect(screen.getByText(/tap to zoom/i)).toBeInTheDocument();

    // Sample Answer accordion toggle has accessible attributes
    const accordionBtn = screen.getByRole('button', { name: /sample answer/i });
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false');
    expect(accordionBtn).toHaveAttribute('aria-controls', 'sample-answer-accordion');

    fireEvent.click(accordionBtn);
    expect(setShowSample).toHaveBeenCalledWith(true);
  });

  it('renders WritingEditor with clean title and target badge, without confusing hide/collapse button', () => {
    render(
      <WritingEditor
        writing=""
        setWriting={vi.fn()}
        wordCount={42}
        targetLimit={150}
        isCompleted={false}
        title="Task 1 Response"
        subtitle="Draft your task 1 essay"
      />
    );

    // Verify title and subtitle are present with truncate to prevent overlapping
    const titleEl = screen.getByText('Task 1 Response');
    expect(titleEl).toBeInTheDocument();
    expect(titleEl).toHaveClass('truncate');
    expect(screen.getByText('Draft your task 1 essay')).toBeInTheDocument();

    // Verify no unwanted hide or collapse button is rendered in the editor header
    expect(screen.queryByRole('button', { name: /collapse/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hide/i })).not.toBeInTheDocument();

    // Tabular word count and target are rendered
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('renders WritingHeader with full task type, official badge, and mode pill without truncation', () => {
    useWritingTestStore.setState({
      compositeTasks: { 'Task 1': task1, 'Task 2': { ...task1, title: 'Task 2 Essay' } },
      activeType: 'Task 1',
    });

    render(
      <WritingHeader
        task={{ ...task1, is_official_cambridge: true }}
        handleGetFeedback={vi.fn()}
        handleSwitchTask={vi.fn()}
        testMode="practice"
      />
    );

    // Title and active type are rendered
    expect(screen.getByText('IELTS 18 Academic Test 2 Task 1')).toBeInTheDocument();

    // Task switcher buttons are rendered without wrapping classes
    const task1Buttons = screen.getAllByRole('button', { name: /task 1/i });
    expect(task1Buttons.length).toBeGreaterThan(0);
    expect(task1Buttons[0]).toHaveClass('whitespace-nowrap');
    expect(task1Buttons[0]).toHaveClass('shrink-0');

    // Official badge is rendered
    expect(screen.getByText('Official')).toBeInTheDocument();

    // Mode is rendered (responsive labels)
    expect(screen.getByText('Practice Mode')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();

    // Timer is present
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });
});
