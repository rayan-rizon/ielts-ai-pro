import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import SyncedTranscript from '@/features/testing/listening/components/ListeningTest/components/SyncedTranscript';

/** The player's position, read only while the transcript is open. */
function useAudioTime(audioRef, active) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active) return undefined;
    const read = () => setTime(audio.currentTime);
    read();
    audio.addEventListener('timeupdate', read);
    return () => audio.removeEventListener('timeupdate', read);
  }, [audioRef, active]);
  return time;
}

function ScriptBox({ source, audioRef }) {
  const boxRef = useRef(null);
  const time = useAudioTime(audioRef, true);
  const playFrom = (start) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = start;
    // A browser may refuse to start sound; the player is still there to press.
    audio.play()?.catch(() => {});
  };
  return (
    <div
      ref={boxRef}
      role="region"
      aria-label="Transcript"
      tabIndex={0}
      className="max-h-[34vh] overflow-y-auto overscroll-contain rounded-lg border border-[#e4e2f0] sm:max-h-[40vh] dark:border-white/[0.07] [&>div]:!pb-3"
    >
      <SyncedTranscript
        srtContent={source.srt_content || ''}
        plainTranscript={source.transcript || ''}
        currentTime={time}
        onSegmentClick={playFrom}
        scrollBoxRef={boxRef}
      />
    </div>
  );
}

/**
 * The part's audioscript, as practice mode on the Listening test shows it:
 * closed until asked for, following the recording, with no answer evidence.
 */
export default function PracticeTranscript({ source, audioRef }) {
  const [open, setOpen] = useState(false);
  if (!`${source.srt_content || ''}${source.transcript || ''}`.trim()) return null;
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e4e2f0] px-3 text-xs font-bold text-[#5a63df] transition-colors hover:bg-[#5a63df]/8 dark:border-white/10 dark:text-[#a9afff]"
      >
        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        {open ? 'Hide transcript' : 'Show transcript'}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && <ScriptBox source={source} audioRef={audioRef} />}
    </div>
  );
}
