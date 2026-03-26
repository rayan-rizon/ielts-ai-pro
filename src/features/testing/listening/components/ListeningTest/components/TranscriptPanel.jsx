import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, HelpCircle } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import SyncedTranscript from './SyncedTranscript';
import { formatInstructionHTML } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/security';
import {
  useListeningTestDispatch,
  useListeningTestState,
  LISTENING_ACTIONS,
} from '../context/ListeningTestContext';

const TranscriptPanel = ({
  audioPlayerRef,
  currentSection,
  sectionQuestions,
  onAudioDurationChange,
  isMobile,
}) => {
  const { showTranscript, audioCurrentTime: contextAudioTime } = useListeningTestState();

  const { dispatch, setAudioTimeRef, ACTIONS } = useListeningTestDispatch();

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 h-full pb-32" data-oid="ik.uju7">
      {/* Audio Player - Fixed position to prevent overlap */}
      {!isMobile && (
        <div
          className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-1 sm:p-2 border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
          data-oid="_f54sj7"
        >
          {currentSection.audio_url ? (
            <AudioPlayer
              ref={audioPlayerRef}
              src={currentSection.audio_url}
              onDurationChange={onAudioDurationChange}
              onTimeUpdate={setAudioTimeRef}
              data-oid="83knhtk"
            />
          ) : (
            <div
              className="p-3 sm:p-4 bg-amber-50 rounded-lg text-amber-800 text-sm flex items-center justify-center gap-2"
              data-oid="_40_9xl"
            >
              <AlertCircle className="w-4 h-4" data-oid="afvzdlg" /> No audio for this part
            </div>
          )}
        </div>
      )}

      {/* Synchronized Transcript Section - Unified Card */}
      <div
        className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none overflow-hidden"
        data-oid="qpvv9b:"
      >
        {/* Header - Integrated into card */}
        <div
          className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
          data-oid="u.w7c68"
        >
          <div className="flex items-center gap-2 sm:gap-3" data-oid="35buee3">
            <div
              className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20"
              data-oid="xxf0fo6"
            >
              <FileText
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400"
                data-oid="z6f5zjp"
              />
            </div>
            <div data-oid="u_ye_06">
              <h3
                className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight"
                data-oid="6.0lfsc"
              >
                Audioscript
              </h3>
              <p
                className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5"
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
            className="text-blue-600 dark:text-blue-400 h-7 sm:h-8 px-3 sm:px-4 rounded-lg font-bold text-[10px] sm:text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm"
            data-oid="wvgykuk"
          >
            {showTranscript ? 'Hide' : 'Show'}
          </Button>
        </div>

        {showTranscript && (
          <div className="flex-1 flex flex-col min-h-[450px] max-h-[70vh]" data-oid="r:.vey5">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1" data-oid="e.ho-eb">
              {currentSection.srt_content ? (
                <SyncedTranscript
                  srtContent={currentSection.srt_content}
                  currentTime={contextAudioTime}
                  onSegmentClick={(time) => {
                    if (audioPlayerRef.current) {
                      audioPlayerRef.current.seek(time);
                      audioPlayerRef.current.play();
                    }
                  }}
                  data-oid="tr-83sc"
                />
              ) : currentSection.transcript ? (
                <div className="p-6" data-oid="unnwl9n">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-normal"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentSection.transcript) }}
                    data-oid="2o8:mg3"
                  />
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-48 text-center p-8"
                  data-oid="-_fjv0o"
                >
                  <div
                    className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3"
                    data-oid="qrhww.y"
                  >
                    <AlertCircle className="w-6 h-6 text-slate-400" data-oid="e2sncoc" />
                  </div>
                  <p className="italic text-slate-500 text-sm max-w-[200px]" data-oid="m7--yya">
                    Transcript hidden for realistic practice.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptPanel;
