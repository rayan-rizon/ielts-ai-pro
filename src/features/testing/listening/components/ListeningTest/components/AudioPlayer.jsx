import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

/**
 * AudioPlayer - A reusable audio player component for the Listening Test.
 *
 * Features:
 * - Play/Pause controls
 * - 10-second skip forward/backward
 * - Seek slider with time display
 * - Playback rate control (0.75x - 1.5x)
 *
 * @param {Object} props
 * @param {string} props.src - Audio source URL
 * @param {Function} props.onDurationChange - Callback when duration is known
 * @param {Function} props.onTimeUpdate - Callback for time updates (for transcript sync)
 */
const AudioPlayer = React.forwardRef(
  ({ src, onDurationChange, onTimeUpdate, onEnded, examMode = false, examReview = false }, ref) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(1);

    // Store callbacks in refs to avoid useEffect dependency issues
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

    // Expose seek, play, and pause functions via ref
    React.useImperativeHandle(ref, () => ({
      seek: (time) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time;
          setCurrentTime(time);
          // Immediately propagate the new time to Zustand so SyncedTranscript
          // highlights the correct sentence without waiting for async timeupdate.
          if (onTimeUpdateRef.current) onTimeUpdateRef.current(time);
        }
      },
      play: () => {
        if (audioRef.current) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {
              // Error handled silently
            });
        }
      },
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      },
      getCurrentTime: () => {
        return audioRef.current?.currentTime || 0;
      },
    }));

    // Reset state when src changes (new part/section)
    useEffect(() => {
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);

      // Ensure audio element reloads with new source
      if (audioRef.current) {
        audioRef.current.load();
      }
    }, [src]);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const updateTime = () => {
        const t = audio.currentTime;
        setCurrentTime(t);
        if (onTimeUpdateRef.current) onTimeUpdateRef.current(t);
      };
      const updateDuration = () => {
        const d = audio.duration;
        if (!isNaN(d)) {
          setDuration(d);
          if (onDurationChangeRef.current) onDurationChangeRef.current(d);
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
    }, [src]);

    useEffect(() => {
      if (examReview && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }, [examReview]);

    const togglePlay = () => {
      if (!audioRef.current) return;
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    const handleSeek = (value) => {
      if (!audioRef.current) return;
      const time = value[0];
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      // Propagate immediately so transcript highlighting stays in sync.
      if (onTimeUpdateRef.current) onTimeUpdateRef.current(time);
    };

    const skipTime = (seconds) => {
      if (!audioRef.current) return;
      const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration);
      audioRef.current.currentTime = newTime;
      // Propagate immediately so transcript highlighting updates on skip.
      if (onTimeUpdateRef.current) onTimeUpdateRef.current(newTime);
    };

    const formatTime = (time) => {
      if (isNaN(time)) return '00:00';
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
      <div
        className="bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-2xs border border-slate-200/70 dark:border-slate-800 p-3 sm:p-3.5 backdrop-blur-md relative overflow-hidden transition-all duration-300"
        data-oid="gf2zoyb"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-100 pointer-events-none"
          data-oid="_gx.skv"
        />

        <audio ref={audioRef} src={src} data-oid="mjr6mvu" />

        <div className="flex flex-col gap-3 sm:gap-4" data-oid="i9d8:lc">
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4"
            data-oid="1z300in"
          >
            <div
              className="flex items-center justify-between sm:justify-start gap-4"
              data-oid="f1vtdk_"
            >
              {!examMode ? (
                <div className="flex items-center gap-2 sm:gap-4" data-oid="play-controls">
                  <Button
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full bg-blue-600 dark:bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 hover:scale-105 active:scale-95 hover:shadow-blue-500/40 transition-all duration-300 border-none relative z-10"
                    onClick={togglePlay}
                    data-oid="91.6o0_"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" data-oid="pkaan-f" />
                    ) : (
                      <Play
                        className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5 sm:ml-1 fill-current"
                        data-oid="1ootsw:"
                      />
                    )}
                  </Button>

                  <div className="flex items-center gap-0.5 sm:gap-1" data-oid="8m:tyid">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skipTime(-10)}
                      className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-colors"
                      title="Back 10s"
                      data-oid="kd-tqao"
                    >
                      <RotateCcw className="h-4 w-4 sm:h-4.5 sm:w-4.5" data-oid="o6dm5_3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skipTime(10)}
                      className="h-8 w-8 sm:h-9 sm:w-9 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-colors"
                      title="Forward 10s"
                      data-oid=".xod8v7"
                    >
                      <RotateCw className="h-4 w-4 sm:h-4.5 sm:w-4.5" data-oid="ytihwm7" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {!examReview && !isPlaying && currentTime === 0 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        audioRef.current
                          ?.play()
                          .then(() => setIsPlaying(true))
                          .catch(() => {});
                      }}
                      className="rounded-full bg-blue-600 px-4 text-[10px] font-black uppercase tracking-wider text-white hover:bg-blue-700"
                    >
                      Start audio
                    </Button>
                  ) : (
                    <div className="rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {examReview ? 'Audio complete' : 'Playing once'}
                    </div>
                  )}
                </>
              )}

              {!examMode ? (
                <div className="flex sm:hidden items-center" data-oid="mobile-rate">
                  <div className="bg-slate-100/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center px-2 py-1 transition-colors">
                    <select
                      className="text-[10px] bg-transparent border-none focus:ring-0 p-0 text-slate-600 dark:text-slate-300 font-bold cursor-pointer outline-none w-10"
                      value={playbackRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value);
                        setPlaybackRate(rate);
                        if (audioRef.current) audioRef.current.playbackRate = rate;
                      }}
                    >
                      <option value="0.75">0.75x</option>
                      <option value="1">1.0x</option>
                      <option value="1.25">1.25x</option>
                      <option value="1.5">1.5x</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex-1 space-y-1 sm:space-y-1.5" data-oid="pf-:w_v">
              {examMode ? (
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                  role="progressbar"
                  aria-label="Audio progress"
                  aria-valuemin={0}
                  aria-valuemax={Math.max(1, duration)}
                  aria-valuenow={currentTime}
                >
                  <div
                    className="h-full bg-blue-600 transition-[width] duration-300"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              ) : (
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
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

            <div className="flex items-center" data-oid="1dl5ed9">
              <div
                className="bg-slate-100/80 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center px-2.5 py-1.5 transition-colors hover:border-blue-200 dark:hover:border-blue-500/30"
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
                    onChange={(event) => {
                      const nextVolume = Number(event.target.value);
                      setVolume(nextVolume);
                      if (audioRef.current) audioRef.current.volume = nextVolume;
                    }}
                    className="w-20 accent-blue-600"
                  />
                ) : (
                  <select
                    className="text-xs bg-transparent border-none focus:ring-0 p-0 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer outline-none w-12"
                    value={playbackRate}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value);
                      setPlaybackRate(rate);
                      if (audioRef.current) audioRef.current.playbackRate = rate;
                    }}
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
          </div>
        </div>
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
