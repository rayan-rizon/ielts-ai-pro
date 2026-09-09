import { usePairedAudio } from '@/features/testing/paired/usePairedAudio';
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
import { AlertCircle, Play, Pause, RotateCcw, RotateCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

/**
 * Format raw seconds into MM:SS string display.
 * @param {number} time - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(time) {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Validates if the duration is a finite positive number.
 * @param {number|undefined} duration
 * @returns {boolean}
 */
function isValidPositiveDuration(duration) {
  return Number.isFinite(duration) && duration > 0;
}

/**
 * Stores callback props in refs to prevent unnecessary effect dependency re-runs.
 */
function useCallbackRefs(onTimeUpdate, onDurationChange, onEnded) {
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onDurationChangeRef = useRef(onDurationChange);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    onDurationChangeRef.current = onDurationChange;
  }, [onDurationChange]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  return { onTimeUpdateRef, onDurationChangeRef, onEndedRef };
}

/**
 * Attaches audio element event listeners.
 */
function useAudioEventListeners({
  audioRef,
  onTimeUpdateRef,
  onDurationChangeRef,
  onEndedRef,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  src,
}) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      onTimeUpdateRef.current?.(t);
    };

    const updateDuration = () => {
      const d = audio.duration;
      if (!isNaN(d)) {
        setDuration(d);
        onDurationChangeRef.current?.(d);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [
    src,
    audioRef,
    onTimeUpdateRef,
    onDurationChangeRef,
    onEndedRef,
    setCurrentTime,
    setDuration,
    setIsPlaying,
  ]);
}

/**
 * Handles audio playback synchronization and duration notifications.
 */
function useAudioSyncEffects({
  audioRef,
  src,
  isAwaitingStart,
  examReview,
  setCurrentTime,
  setDuration,
  setIsPlaying,
  setAudioError,
  onDurationChangeRef,
}) {
  // Reset state when source changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setAudioError(null);
    audioRef.current?.load();
  }, [src, audioRef, setCurrentTime, setDuration, setIsPlaying, setAudioError]);

  // Pause playback when exam review mode or awaiting start triggers
  useEffect(() => {
    if (examReview || isAwaitingStart) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [examReview, isAwaitingStart, audioRef, setIsPlaying]);

  // Notify on duration change once valid
  useEffect(() => {
    const d = audioRef.current?.duration;
    if (!isAwaitingStart && isValidPositiveDuration(d)) {
      onDurationChangeRef.current?.(d);
    }
  }, [isAwaitingStart, src, audioRef, onDurationChangeRef]);
}

/**
 * Exposes imperative controls through forwarded ref.
 */
function useAudioImperativeHandle({
  ref,
  audioRef,
  playAudio,
  setIsPlaying,
  setCurrentTime,
  onTimeUpdateRef,
}) {
  useImperativeHandle(
    ref,
    () => ({
      seek: (time) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time;
          setCurrentTime(time);
          onTimeUpdateRef.current?.(time);
        }
      },
      play: () => {
        void playAudio();
      },
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      },
      getCurrentTime: () => audioRef.current?.currentTime || 0,
    }),
    [playAudio, audioRef, setCurrentTime, setIsPlaying, onTimeUpdateRef]
  );
}

/**
 * Manages error logging, recovery, and retry actions.
 */
function useAudioErrorRecovery(audioRef, setIsPlaying, setAudioError) {
  const setPlaybackFailure = useCallback(
    (error) => {
      if (error?.name === 'AbortError') return;
      setIsPlaying(false);
      setAudioError('Audio could not be played. Please try again.');
    },
    [setIsPlaying, setAudioError]
  );

  const handleAudioError = useCallback(() => {
    setPlaybackFailure(new Error('The audio element could not load its source.'));
  }, [setPlaybackFailure]);

  const retryAudio = useCallback(() => {
    setAudioError(null);
    audioRef.current?.load();
  }, [audioRef, setAudioError]);

  return {
    setPlaybackFailure,
    handleAudioError,
    retryAudio,
  };
}

/**
 * Manages transport actions (play, pause, toggle).
 */
function useAudioTransportControls({
  audioRef,
  isAwaitingStart,
  setIsPlaying,
  setAudioError,
  setPlaybackFailure,
}) {
  const playAudio = useCallback(async () => {
    if (isAwaitingStart || !audioRef.current) return false;

    try {
      await audioRef.current.play();
      setAudioError(null);
      setIsPlaying(true);
      return true;
    } catch (error) {
      setPlaybackFailure(error);
      return false;
    }
  }, [isAwaitingStart, setPlaybackFailure, audioRef, setAudioError, setIsPlaying]);

  const togglePlay = useCallback(() => {
    if (isAwaitingStart || !audioRef.current) return;
    if (audioRef.current.paused) {
      void playAudio();
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isAwaitingStart, playAudio, audioRef, setIsPlaying]);

  return {
    playAudio,
    togglePlay,
  };
}

/**
 * Manages seeking, skipping, volume, and playback rate changes.
 */
function useAudioSeekControls({
  audioRef,
  duration,
  setCurrentTime,
  onTimeUpdateRef,
  setPlaybackRate,
  setVolume,
}) {
  const handleSeek = useCallback(
    (value) => {
      if (!audioRef.current) return;
      const time = value[0];
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      onTimeUpdateRef.current?.(time);
    },
    [audioRef, setCurrentTime, onTimeUpdateRef]
  );

  const skipTime = useCallback(
    (seconds) => {
      if (!audioRef.current) return;
      const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration);
      audioRef.current.currentTime = newTime;
      onTimeUpdateRef.current?.(newTime);
    },
    [duration, audioRef, onTimeUpdateRef]
  );

  const handlePlaybackRateChange = useCallback(
    (rate) => {
      setPlaybackRate(rate);
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
    },
    [audioRef, setPlaybackRate]
  );

  const handleVolumeChange = useCallback(
    (nextVolume) => {
      setVolume(nextVolume);
      if (audioRef.current) {
        audioRef.current.volume = nextVolume;
      }
    },
    [audioRef, setVolume]
  );

  return {
    handleSeek,
    skipTime,
    handlePlaybackRateChange,
    handleVolumeChange,
  };
}

/**
 * Custom hook to isolate audio player state, synchronization effects, and media events.
 */
function useAudioPlayerState({
  src,
  onDurationChange,
  onTimeUpdate,
  onEnded,
  isAwaitingStart,
  examReview,
  audioRef,
  ref,
}) {
  const pairedAudio = usePairedAudio(audioRef, src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [audioError, setAudioError] = useState(null);

  const { onTimeUpdateRef, onDurationChangeRef, onEndedRef } = useCallbackRefs(
    onTimeUpdate,
    onDurationChange,
    onEnded
  );

  const { handleAudioError, retryAudio, setPlaybackFailure } = useAudioErrorRecovery(
    audioRef,
    setIsPlaying,
    setAudioError
  );

  const { playAudio, togglePlay } = useAudioTransportControls({
    audioRef,
    isAwaitingStart,
    setIsPlaying,
    setAudioError,
    setPlaybackFailure,
  });

  const { handleSeek, skipTime, handlePlaybackRateChange, handleVolumeChange } =
    useAudioSeekControls({
      audioRef,
      duration,
      setCurrentTime,
      onTimeUpdateRef,
      setPlaybackRate,
      setVolume,
    });

  useAudioImperativeHandle({
    ref,
    audioRef,
    playAudio,
    setIsPlaying,
    setCurrentTime,
    onTimeUpdateRef,
  });

  useAudioEventListeners({
    audioRef,
    onTimeUpdateRef,
    onDurationChangeRef,
    onEndedRef,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    src,
  });

  useAudioSyncEffects({
    audioRef,
    src,
    isAwaitingStart,
    examReview,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setAudioError,
    onDurationChangeRef,
  });

  return {
    pairedAudio,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    audioError,
    handleAudioError,
    retryAudio,
    playAudio,
    togglePlay,
    handleSeek,
    skipTime,
    handlePlaybackRateChange,
    handleVolumeChange,
  };
}

/**
 * Status banners for audio errors and paired audio synchronization.
 */
function AudioStatusBanners({ audioError, onRetry, pairedAudio }) {
  return (
    <>
      {audioError && (
        <div
          className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
          role="alert"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {audioError}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Retry audio
          </Button>
        </div>
      )}
      {pairedAudio?.active && (
        <div className="text-xs" role="status">
          Audio follows the shared test timeline.
          {pairedAudio.interrupted && (
            <span> Playback was interrupted; you have rejoined at the current position.</span>
          )}
          {pairedAudio.blocked && (
            <Button size="sm" onClick={pairedAudio.enable}>
              Enable shared audio
            </Button>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Primary play/pause or start controls depending on exam vs practice mode.
 */
function AudioPrimaryControls({
  examMode,
  examReview,
  isPlaying,
  currentTime,
  isAwaitingStart,
  onTogglePlay,
  onPlay,
  onSkip,
}) {
  if (examMode) {
    const canStartAudio = !examReview && !isPlaying && currentTime === 0;

    if (canStartAudio) {
      return (
        <Button
          type="button"
          disabled={isAwaitingStart}
          onClick={() => {
            if (!isAwaitingStart) void onPlay();
          }}
          className="rounded-full bg-[#5a63df] px-4 text-[10px] font-black uppercase tracking-wider text-white hover:bg-[#4a52c9]"
        >
          Start audio
        </Button>
      );
    }

    return (
      <div className="rounded-full bg-[#5a63df]/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#5a63df] dark:bg-[#5a63df]/15 dark:text-[#a9afff]">
        {examReview ? 'Audio complete' : 'Playing once'}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4" data-oid="play-controls">
      <Button
        size="icon"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full bg-[#5a63df] text-white hover:bg-[#4a52c9] hover:scale-105 active:scale-95 transition-all duration-300 border-none relative z-10"
        onClick={onTogglePlay}
        data-oid="91.6o0_"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" data-oid="pkaan-f" />
        ) : (
          <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5 sm:ml-1 fill-current" data-oid="1ootsw:" />
        )}
      </Button>

      <div className="flex items-center gap-0.5 sm:gap-1" data-oid="8m:tyid">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSkip(-10)}
          className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:text-[#5a63df] dark:text-slate-500 dark:hover:text-[#a9afff] hover:bg-[#5a63df]/10 dark:hover:bg-[#5a63df]/10 rounded-full transition-colors"
          title="Back 10s"
          aria-label="Seek backward 10 seconds"
          data-oid="kd-tqao"
        >
          <RotateCcw className="h-4 w-4 sm:h-4.5 sm:w-4.5" data-oid="o6dm5_3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSkip(10)}
          className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:text-[#5a63df] dark:text-slate-500 dark:hover:text-[#a9afff] hover:bg-[#5a63df]/10 dark:hover:bg-[#5a63df]/10 rounded-full transition-colors"
          title="Forward 10s"
          aria-label="Seek forward 10 seconds"
          data-oid=".xod8v7"
        >
          <RotateCw className="h-4 w-4 sm:h-4.5 sm:w-4.5" data-oid="ytihwm7" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Mobile-only playback rate selector.
 */
function AudioMobileRateSelect({ playbackRate, onChange }) {
  return (
    <div className="flex sm:hidden items-center" data-oid="mobile-rate">
      <div className="bg-[#f4f3fb] dark:bg-white/4 border border-[#e4e2f0] dark:border-white/[0.07] rounded-lg flex items-center px-2 py-1 transition-colors">
        <select
          aria-label="Audio playback speed"
          className="text-[10px] bg-transparent border-none focus:ring-0 p-0 text-slate-600 dark:text-slate-300 font-bold cursor-pointer outline-none w-10"
          value={playbackRate}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        >
          <option value="0.75">0.75x</option>
          <option value="1">1.0x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
        </select>
      </div>
    </div>
  );
}

/**
 * Audio progress track rendering either an interactive Slider or a static progressbar.
 */
function AudioProgressTrack({ examMode, currentTime, duration, onSeek }) {
  return (
    <div className="flex-1 space-y-1 sm:space-y-1.5" data-oid="pf-:w_v">
      {examMode ? (
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
          role="progressbar"
          aria-label="Audio progress"
          aria-valuemin={0}
          aria-valuemax={Math.max(1, duration)}
          aria-valuenow={currentTime}
        >
          <div
            className="h-full bg-[#5a63df] transition-[width] duration-300"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      ) : (
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={onSeek}
          className="cursor-pointer"
          data-oid="ddbj:4n"
        />
      )}

      <div
        className="flex justify-between text-[9px] sm:text-[10px] font-mono text-slate-400 font-medium"
        data-oid="ez.tpii"
      >
        <span data-oid="ugcf26r">{formatTime(currentTime)}</span>
        <span data-oid="bsseb.n">{formatTime(duration)}</span>
      </div>
    </div>
  );
}

/**
 * Secondary controls: Volume control (exam mode) or desktop playback rate selector (practice mode).
 */
function AudioSecondaryControls({
  examMode,
  volume,
  onVolumeChange,
  playbackRate,
  onPlaybackRateChange,
}) {
  return (
    <div className="flex items-center" data-oid="1dl5ed9">
      <div
        className="bg-[#f4f3fb] dark:bg-white/4 border border-[#e4e2f0] dark:border-white/[0.07] rounded-lg flex items-center px-2.5 py-1.5 transition-colors hover:border-[#5a63df]/30 dark:hover:border-[#5a63df]/30"
        data-oid="2ht8gpv"
      >
        <Volume2
          className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mr-2"
          data-oid=".1qfdes"
        />

        {examMode ? (
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            className="w-20 accent-[#5a63df]"
          />
        ) : (
          <select
            aria-label="Audio playback speed"
            className="text-xs bg-transparent border-none focus:ring-0 p-0 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer outline-none w-12"
            value={playbackRate}
            onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
            data-oid="8n.ijd-"
          >
            <option value="0.75" data-oid="i70wglz">
              0.75x
            </option>
            <option value="1" data-oid="erf126e">
              1.0x
            </option>
            <option value="1.25" data-oid="9i1cfbt">
              1.25x
            </option>
            <option value="1.5" data-oid="zw-:97l">
              1.5x
            </option>
            <option value="2" data-oid=":0b834u">
              2.0x
            </option>
          </select>
        )}
      </div>
    </div>
  );
}

/**
 * AudioPlayer - A reusable audio player component for the Listening Test.
 *
 * Features:
 * - Play/Pause controls
 * - 10-second skip forward/backward
 * - Seek slider with time display
 * - Playback rate control (0.75x - 2.0x)
 * - Exam mode support (single-play enforcement, volume slider, non-seekable progress bar)
 *
 * @param {Object} props
 * @param {string} props.src - Audio source URL
 * @param {Function} props.onDurationChange - Callback when duration is known
 * @param {Function} props.onTimeUpdate - Callback for time updates (for transcript sync)
 * @param {Function} props.onEnded - Callback when playback finishes
 * @param {boolean} props.examMode - Whether exam mode constraints are enabled
 * @param {boolean} props.isAwaitingStart - Whether waiting for test start gate
 * @param {boolean} props.examReview - Whether test is in review mode
 */
const AudioPlayer = React.forwardRef(
  (
    {
      src,
      onDurationChange,
      onTimeUpdate,
      onEnded,
      examMode = false,
      isAwaitingStart = false,
      examReview = false,
    },
    ref
  ) => {
    const audioRef = useRef(null);
    const player = useAudioPlayerState({
      src,
      onDurationChange,
      onTimeUpdate,
      onEnded,
      isAwaitingStart,
      examReview,
      audioRef,
      ref,
    });

    return (
      <div
        className="bg-linear-to-b/srgb from-white to-[#faf9ff] dark:from-[#131315] dark:to-[#131315] rounded-xl shadow-2xs border border-[#e4e2f0] dark:border-white/[0.07] p-3 sm:p-3.5 relative overflow-hidden transition-all duration-300"
        data-oid="gf2zoyb"
      >
        <div
          className="absolute inset-0 bg-linear-to-r/srgb from-[#5a63df]/4 via-transparent to-[#5a63df]/4 dark:from-[#5a63df]/10 dark:via-transparent dark:to-[#5a63df]/10 opacity-100 pointer-events-none"
          data-oid="_gx.skv"
        />

        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onError={player.handleAudioError}
          data-oid="mjr6mvu"
        />

        <AudioStatusBanners
          audioError={player.audioError}
          onRetry={player.retryAudio}
          pairedAudio={player.pairedAudio}
        />

        <div className="flex flex-col gap-3 sm:gap-4" data-oid="i9d8:lc">
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4"
            data-oid="1z300in"
          >
            <div
              className="flex items-center justify-between sm:justify-start gap-4"
              data-oid="f1vtdk_"
            >
              <AudioPrimaryControls
                examMode={examMode}
                examReview={examReview}
                isPlaying={player.isPlaying}
                currentTime={player.currentTime}
                isAwaitingStart={isAwaitingStart}
                onTogglePlay={player.togglePlay}
                onPlay={player.playAudio}
                onSkip={player.skipTime}
              />

              {!examMode && (
                <AudioMobileRateSelect
                  playbackRate={player.playbackRate}
                  onChange={player.handlePlaybackRateChange}
                />
              )}
            </div>

            <AudioProgressTrack
              examMode={examMode}
              currentTime={player.currentTime}
              duration={player.duration}
              onSeek={player.handleSeek}
            />

            <AudioSecondaryControls
              examMode={examMode}
              volume={player.volume}
              onVolumeChange={player.handleVolumeChange}
              playbackRate={player.playbackRate}
              onPlaybackRateChange={player.handlePlaybackRateChange}
            />
          </div>
        </div>
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
