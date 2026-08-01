import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import SyncedTranscript from './SyncedTranscript';
import { sanitizeHtml } from '@/lib/security';
import {
  useListeningTestDispatch,
  useListeningTestState,
  useListeningAudioTime,
} from '../context/ListeningTestContext';

const TranscriptPanel = ({
  audioPlayerRef,
  currentSection,
  onAudioDurationChange,
  isMobile,
  examMode = false,
  isAwaitingStart = false,
  examReview = false,
  onAudioEnded,
}) => {
  const { showTranscript } = useListeningTestState();
  // Use the dedicated audio-time hook (audioCurrentTime is intentionally excluded
  // from useListeningTestState to prevent render loops on every timeupdate).
  const audioCurrentTime = useListeningAudioTime();

  const { dispatch, setAudioTimeRef, ACTIONS } = useListeningTestDispatch();

  return (
    <div
      className="p-3 sm:p-4 space-y-3 sm:space-y-4 h-full flex flex-col min-h-0 overflow-hidden"
      data-oid="ik.uju7"
    >
      {/* Audio Player */}
      {!isMobile && (
        <div className="shrink-0" data-oid="_f54sj7">
          {currentSection.audio_url ? (
            <AudioPlayer
              ref={audioPlayerRef}
              src={currentSection.audio_url}
              onDurationChange={onAudioDurationChange}
              onTimeUpdate={setAudioTimeRef}
              examMode={examMode}
              isAwaitingStart={isAwaitingStart}
              examReview={examReview}
              onEnded={onAudioEnded}
              data-oid="83knhtk"
            />
          ) : (
            <div
              className="p-3 sm:p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-amber-800 dark:text-amber-300 text-sm flex items-center justify-center gap-2 font-medium"
              data-oid="_40_9xl"
            >
              <AlertCircle className="w-4 h-4" data-oid="afvzdlg" /> No audio for this part
            </div>
          )}
        </div>
      )}

      {/* Synchronized Transcript Section - Integrated Panel */}
      {!examMode ? (
        <div
          className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] rounded-xl border border-[#e4e2f0] dark:border-white/[0.07] overflow-hidden shadow-2xs"
          data-oid="qpvv9b:"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#e4e2f0] dark:border-white/[0.07] bg-[#f4f3fb]/60 dark:bg-white/[0.04] shrink-0"
            data-oid="u.w7c68"
          >
            <div className="flex items-center gap-2.5" data-oid="35buee3">
              <div
                className="p-1.5 rounded-lg bg-[#5a63df]/10 border border-[#5a63df]/20 dark:border-[#5a63df]/25"
                data-oid="xxf0fo6"
              >
                <FileText
                  className="w-4 h-4 text-[#5a63df] dark:text-[#a9afff]"
                  data-oid="z6f5zjp"
                />
              </div>
              <div data-oid="u_ye_06">
                <h3
                  className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight"
                  data-oid="6.0lfsc"
                >
                  Audioscript
                </h3>
                <p
                  className="text-[10px] text-slate-500 dark:text-slate-400 font-medium"
                  data-oid="3:e_l1s"
                >
                  Click sentences to jump to audio
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => dispatch({ type: ACTIONS.TOGGLE_TRANSCRIPT })}
              className="text-[#5a63df] dark:text-[#a9afff] h-7 px-3 rounded-lg font-bold text-[11px] bg-white dark:bg-white/[0.06] border border-[#e4e2f0] dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.1] transition-all duration-200 shadow-2xs"
              data-oid="wvgykuk"
            >
              {showTranscript ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showTranscript && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden" data-oid="r:.vey5">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2" data-oid="e.ho-eb">
                {currentSection.srt_content ? (
                  <SyncedTranscript
                    srtContent={currentSection.srt_content}
                    currentTime={audioCurrentTime}
                    onSegmentClick={(time) => {
                      if (audioPlayerRef.current) {
                        audioPlayerRef.current.seek(time);
                        audioPlayerRef.current.play();
                      }
                    }}
                    data-oid="tr-83sc"
                  />
                ) : currentSection.transcript ? (
                  <div className="p-4" data-oid="unnwl9n">
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-normal"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentSection.transcript) }}
                      data-oid="2o8:mg3"
                    />
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center h-40 text-center p-6"
                    data-oid="-_fjv0o"
                  >
                    <div
                      className="p-2.5 rounded-full bg-[#f4f3fb] dark:bg-white/[0.06] mb-2"
                      data-oid="qrhww.y"
                    >
                      <AlertCircle className="w-5 h-5 text-slate-400" data-oid="e2sncoc" />
                    </div>
                    <p className="italic text-slate-500 text-xs max-w-[200px]" data-oid="m7--yya">
                      Transcript hidden for realistic practice.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : examReview ? (
        <div className="grid flex-1 place-items-center rounded-xl border border-[#5a63df]/20 bg-[#5a63df]/[0.06] p-5 text-center dark:border-[#5a63df]/25 dark:bg-[#5a63df]/10">
          <div>
            <p className="font-black text-slate-800 dark:text-[#a9afff]">Final review</p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              Audio is complete. Review your answers before automatic submission.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 place-items-center rounded-xl border border-slate-200 bg-slate-50 p-5 text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold text-slate-500">
            Audioscripts are unavailable in Exam Mode.
          </p>
        </div>
      )}
    </div>
  );
};

export default TranscriptPanel;
