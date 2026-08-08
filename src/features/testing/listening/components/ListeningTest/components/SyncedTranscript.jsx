import React, { useRef, useEffect, useMemo, memo } from 'react';

import {
  parseSrt,
  parsePlainTranscript,
  findActiveSegment,
  isSilenceSegment,
  resolveTranscriptSpeakers,
} from '@/utils/parseSrt';
import { MICRO, NUM, TILE } from '@/features/dashboard/components/primitives.jsx';
import { buildHighlightedTranscript } from '../utils/transcriptPresentation';

function removeLeadingText(parts, leadingText) {
  let remaining = leadingText.length;

  return parts
    .map((part) => {
      if (remaining <= 0) return part;
      const removedLength = Math.min(remaining, part.text.length);
      remaining -= removedLength;
      return { ...part, text: part.text.slice(removedLength) };
    })
    .filter((part) => part.text);
}

/**
 * Synchronized Transcript Component
 * Displays audio transcript with highlighting synced to current playback position.
 *
 * Props:
 *  - srtContent {string}       Raw SRT file content
 *  - currentTime {number}      Current audio playback time in seconds (from parent via useListeningAudioTime)
 *  - onSegmentClick {Function} Called with segment start time when user clicks a sentence
 */
const SyncedTranscript = memo(function SyncedTranscript({
  srtContent,
  plainTranscript = '',
  correctAnswersMap = {},
  sourceHighlights = [],
  showAnswerHighlights = false,
  onSegmentClick,
  currentTime = 0,
}) {
  // 1. Parse Segments (memoized — only re-parses when srtContent changes)
  const segments = useMemo(() => parseSrt(srtContent || ''), [srtContent]);
  const isSynchronized = segments.length > 0;
  const presentationSegments = useMemo(() => {
    const source = isSynchronized
      ? resolveTranscriptSpeakers(
          segments.map((segment, sourceIndex) => ({ ...segment, sourceIndex }))
        ).filter((segment) => !isSilenceSegment(segment))
      : parsePlainTranscript(plainTranscript || srtContent).map((segment, sourceIndex) => ({
          ...segment,
          sourceIndex,
        }));

    return showAnswerHighlights
      ? buildHighlightedTranscript(source, correctAnswersMap, sourceHighlights)
      : source.map((segment) => ({
          ...segment,
          displayParts: [{ text: segment.text, questionNumber: null }],
        }));
  }, [
    correctAnswersMap,
    isSynchronized,
    plainTranscript,
    segments,
    showAnswerHighlights,
    sourceHighlights,
    srtContent,
  ]);

  // Compute active segment index (memoized to avoid recomputing on unrelated renders)
  const activeIndex = useMemo(
    () => findActiveSegment(segments, currentTime),
    [segments, currentTime]
  );

  const activeRef = useRef(null);

  // 2. Group Segments by Speaker + Paragraph BREAKS
  const groupedTranscript = useMemo(() => {
    if (!presentationSegments.length) return [];

    const groups = [];
    let currentGroup = null;
    const MAX_SEGMENTS_PER_BLOCK = 5; // Split long monologues into paragraphs

    presentationSegments.forEach((seg) => {
      const isSameSpeaker = currentGroup && currentGroup.speaker === seg.speaker;
      const isBelowLimit = currentGroup && currentGroup.segments.length < MAX_SEGMENTS_PER_BLOCK;

      if (isSameSpeaker && isBelowLimit) {
        currentGroup.segments.push(seg);
      } else {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          speaker: seg.speaker,
          segments: [seg],
        };
      }
    });
    if (currentGroup) groups.push(currentGroup);
    return groups;
  }, [presentationSegments]);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeRef.current) {
      try {
        activeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      } catch {
        // Error handled silently
      }
    }
  }, [activeIndex]);

  if (!presentationSegments.length) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm italic" data-oid="1ldgtz_">
        No transcript available.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 pb-24 text-sm leading-relaxed sm:p-2 sm:pb-16 sm:text-[15px]">
      {!isSynchronized && (
        <div className={`${TILE} px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400`}>
          Reference audioscript · sentence timing is unavailable for this part
        </div>
      )}
      {groupedTranscript.map((group, groupIdx) => (
        <div key={groupIdx} className="flex flex-col gap-1.5" data-oid="0anqgdh">
          {/* Speaker Label */}
          {group.speaker && (
            <div className="flex items-center gap-2" data-oid="ojv9t6c">
              <div className="h-3 w-0.5 rounded-full bg-[#5a63df]" data-oid="lu6b1xk" />
              <span className={`${MICRO} text-slate-600 dark:text-slate-400`} data-oid="19-gt.u">
                {group.speaker}
              </span>
            </div>
          )}

          {/* Paragraph Block */}
          <p className="text-slate-700 dark:text-slate-300" data-oid="-v0:bb2">
            {group.segments.map((seg) => {
              const isActive = isSynchronized && seg.sourceIndex === activeIndex;
              const isSectionStart = seg.text.match(/^(Section \d+)\.?/i);

              // Clean text if it has section badge
              let badgeText = null;
              let displayParts = seg.displayParts;
              if (isSectionStart) {
                badgeText = isSectionStart[1];
                displayParts = removeLeadingText(seg.displayParts, isSectionStart[0]);
              }

              return (
                <React.Fragment key={`${seg.id}-${seg.sourceIndex}`}>
                  {/* Optional Badge */}
                  {badgeText && (
                    <span
                      className="inline-flex items-center bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md mr-3 border border-amber-200/50 dark:border-amber-800/50 shadow-sm align-middle"
                      data-oid=":51:ekq"
                    >
                      {badgeText}
                    </span>
                  )}
                  {/* Text Span */}
                  <span
                    ref={isActive ? activeRef : null}
                    onClick={() => isSynchronized && onSegmentClick && onSegmentClick(seg.start)}
                    className={`
                      box-decoration-clone inline rounded-md py-0.5 transition-colors duration-150
                      ${isSynchronized ? 'cursor-pointer' : 'cursor-text select-text'}
                      ${
                        isActive
                          ? 'bg-yellow-200/95 px-1.5 font-bold text-slate-900 ring-1 ring-yellow-400/50 shadow-[0_2px_12px_-3px_rgba(234,179,8,0.4)] dark:bg-amber-400/90 dark:text-slate-900 dark:ring-amber-300/60 dark:shadow-[0_2px_14px_-3px_rgba(251,191,36,0.35)]'
                          : isSynchronized
                            ? 'px-0 hover:bg-[#5a63df]/8 hover:text-slate-900 dark:hover:bg-white/8 dark:hover:text-slate-100'
                            : 'px-0'
                      }
                    `}
                    data-oid="8m8j6d2"
                  >
                    {displayParts.map((part, partIndex) =>
                      part.questionNumber ? (
                        <mark
                          key={`${seg.id}-${partIndex}`}
                          className="rounded-sm bg-[rgb(var(--signal-ok)/0.18)] px-0.5 font-semibold text-slate-950 dark:bg-[rgb(var(--signal-ok)/0.28)] dark:text-slate-50"
                        >
                          {part.text}
                          {part.showBadge !== false && (
                            <span
                              className={`${NUM} ml-1 inline-flex min-w-4 items-center justify-center rounded-sm bg-[rgb(var(--signal-ok))] px-1 text-[9px] font-black leading-4 text-white`}
                              aria-label={`Answer evidence ${part.questionNumber}`}
                            >
                              {part.questionNumber}
                            </span>
                          )}
                        </mark>
                      ) : (
                        <React.Fragment key={`${seg.id}-${partIndex}`}>{part.text}</React.Fragment>
                      )
                    )}
                  </span>{' '}
                </React.Fragment>
              );
            })}
          </p>
        </div>
      ))}
    </div>
  );
});

SyncedTranscript.displayName = 'SyncedTranscript';

export default SyncedTranscript;
