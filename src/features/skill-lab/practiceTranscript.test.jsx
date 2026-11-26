import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import PracticeTranscript from './components/PracticeTranscript';

const timed = [
  '1',
  '00:00:01,000 --> 00:00:03,000',
  'Can I take your surname?',
  '',
  '2',
  '00:00:04,000 --> 00:00:06,000',
  'Yes, it is Rahman.',
].join('\n');

function renderScript(source = { srt_content: timed, transcript: '' }) {
  const audioRef = createRef();
  const view = render(
    <>
      <audio ref={audioRef} />
      <PracticeTranscript source={source} audioRef={audioRef} />
    </>
  );
  return { ...view, audio: audioRef.current };
}
const toggle = () => screen.getByRole('button', { name: /transcript/i });

describe('practice listening transcript', () => {
  it('stays closed until the learner asks for it', () => {
    renderScript();
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/take your surname/)).not.toBeInTheDocument();
    fireEvent.click(toggle());
    expect(toggle()).toHaveAccessibleName('Hide transcript');
    expect(screen.getByText(/take your surname/)).toBeInTheDocument();
  });

  it('shows no answer evidence', () => {
    const { container } = renderScript();
    fireEvent.click(toggle());
    expect(container.querySelector('mark')).toBeNull();
  });

  it('plays from the line the learner picks', () => {
    const { audio } = renderScript();
    audio.play = vi.fn(async () => {});
    fireEvent.click(toggle());
    fireEvent.click(screen.getByText(/it is Rahman/));
    expect(audio.currentTime).toBe(4);
    expect(audio.play).toHaveBeenCalled();
  });

  it('follows the recording without scrolling the page', () => {
    const pageScroll = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = pageScroll;
    const boxScroll = vi.fn();
    window.HTMLElement.prototype.scrollTo = boxScroll;
    const { audio } = renderScript();
    fireEvent.click(toggle());
    boxScroll.mockClear();
    act(() => {
      audio.currentTime = 4.5;
      fireEvent.timeUpdate(audio);
    });
    expect(boxScroll).toHaveBeenCalled();
    expect(pageScroll).not.toHaveBeenCalled();
  });

  it('offers a plain script when there is no sentence timing', () => {
    renderScript({ transcript: 'Clerk: Your street, please?' });
    fireEvent.click(toggle());
    expect(screen.getByText(/Your street, please/)).toBeInTheDocument();
  });

  it('shows nothing when the part has no script', () => {
    renderScript({ srt_content: ' ', transcript: '' });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
