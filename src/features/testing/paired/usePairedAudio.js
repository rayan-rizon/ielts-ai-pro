import { useEffect, useRef, useState } from 'react';
import { usePairedTest } from './PairedContext';
import { useListeningTestStore } from '@/features/testing/listening/store/useListeningTestStore';
import { audioPosition } from '../../../../supabase/functions/_shared/objective-scoring/paired.js';

export function usePairedAudio(audioRef, src) {
  const paired = usePairedTest();
  const pairedRef = useRef(paired);
  pairedRef.current = paired;
  const [blocked, setBlocked] = useState(false);
  const [interrupted, setInterrupted] = useState(false);
  const reported = useRef(false);
  const syncRef = useRef(() => {});
  useEffect(() => {
    if (!pairedRef.current || pairedRef.current.room.state !== 'running') return;
    const audio = audioRef.current;
    if (!audio) return;
    let playing = false;
    let disposed = false;
    const mark = () => {
      setInterrupted(true);
      if (!reported.current) {
        reported.current = true;
        pairedRef.current.act('interrupted').catch(() => {});
      }
    };
    const sync = () => {
      const context = pairedRef.current;
      const elapsed = (context.now() - Date.parse(context.room.started_at)) / 1000;
      const position = audioPosition(context.room.audio_durations, elapsed);
      const store = useListeningTestStore.getState();
      if (position.part !== store.activePart) store.setActivePart(position.part);
      if (position.review || elapsed < 0 || context.room.own.submitted_at) {
        audio.pause();
        return;
      }
      if (context.room.audio_sources[position.part] !== src || audio.readyState < 1) return;
      audio.playbackRate = 1;
      if (Math.abs(audio.currentTime - position.offset) > 1.25) {
        if (audio.currentTime > 0 || position.offset > 2) mark();
        audio.currentTime = position.offset;
      }
      if (audio.paused && !playing) {
        playing = true;
        audio
          .play()
          .then(() => {
            if (!disposed) setBlocked(false);
          })
          .catch(() => {
            if (!disposed) {
              setBlocked(true);
              mark();
            }
          })
          .finally(() => {
            playing = false;
          });
      }
    };
    syncRef.current = sync;
    sync();
    const timer = setInterval(sync, 500);
    audio.addEventListener('loadedmetadata', sync);
    audio.addEventListener('canplay', sync);
    audio.addEventListener('stalled', mark);
    audio.addEventListener('error', mark);
    return () => {
      disposed = true;
      clearInterval(timer);
      audio.removeEventListener('loadedmetadata', sync);
      audio.removeEventListener('canplay', sync);
      audio.removeEventListener('stalled', mark);
      audio.removeEventListener('error', mark);
      audio.pause();
    };
  }, [audioRef, src, paired?.room.id, paired?.room.state]);
  return {
    active: !!paired && paired.room.state === 'running',
    blocked,
    interrupted,
    enable: () => syncRef.current(),
  };
}
