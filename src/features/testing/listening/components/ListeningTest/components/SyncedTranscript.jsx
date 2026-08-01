import React, { useRef, useEffect, useMemo, memo } from 'react';

import { parseSrt, findActiveSegment } from '@/utils/parseSrt';

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
  onSegmentClick,
  currentTime = 0,
}) {
  // 1. Parse Segments (memoized — only re-parses when srtContent changes)
  const segments = useMemo(() => parseSrt(srtContent || ''), [srtContent]);

  // Build an O(1) index map: segment object → its index in the flat array.
  // Avoids the previous O(n) segments.indexOf(seg) call inside the render loop.
  const segmentIndexMap = useMemo(() => {
    const map = new Map();
    segments.forEach((seg, i) => map.set(seg, i));
    return map;
  }, [segments]);

  // Compute active segment index (memoized to avoid recomputing on unrelated renders)
  const activeIndex = useMemo(
    () => findActiveSegment(segments, currentTime),
    [segments, currentTime]
  );

  const activeRef = useRef(null);

  // 2. Group Segments by Speaker + Paragraph BREAKS
  const groupedTranscript = useMemo(() => {
    if (!segments.length) return [];

    const groups = [];
    let currentGroup = null;
    const MAX_SEGMENTS_PER_BLOCK = 5; // Split long monologues into paragraphs

    segments.forEach((seg) => {
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
  }, [segments]);

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

  if (!segments || segments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm italic" data-oid="1ldgtz_">
        No transcript available.
      </div>
    );
  }

  return (
    <div
      className="space-y-4 text-sm sm:text-[15px] leading-relaxed sm:leading-snug p-3 sm:p-2 pb-24 sm:pb-16"
      data-oid="a2qh20k"
    >
      {groupedTranscript.map((group, groupIdx) => (
        <div key={groupIdx} className="flex flex-col gap-1" data-oid="0anqgdh">
          {/* Speaker Label */}
          {group.speaker && (
            <div className="flex items-center gap-2 mb-1.5 opacity-90" data-oid="ojv9t6c">
              <div
                className="w-1.5 h-1.5 rounded-full bg-[#5a63df] shadow-[0_0_8px_rgba(90,99,223,0.5)]"
                data-oid="lu6b1xk"
              />

              <span
                className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400"
                data-oid="19-gt.u"
              >
                {group.speaker}
              </span>
            </div>
          )}

          {/* Paragraph Block */}
          <p className="text-slate-700 dark:text-slate-300" data-oid="-v0:bb2">
            {group.segments.map((seg) => {
              // O(1) lookup instead of O(n) indexOf
              const isActive = segmentIndexMap.get(seg) === activeIndex;
              const isSectionStart = seg.text.match(/^(Section \d+)\.?/i);

              // Clean text if it has section badge
              let displayText = seg.text.replace(/\s+/g, ' ').trim();
              let badgeText = null;
              if (isSectionStart) {
                badgeText = isSectionStart[1];
                displayText = displayText.replace(isSectionStart[0], '').trim();
              }

              return (
                <React.Fragment key={seg.id}>
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
                    onClick={() => onSegmentClick && onSegmentClick(seg.start)}
                    className={`
                      cursor-pointer box-decoration-clone py-0.5 rounded-md transition-all duration-300 inline select-none touch-none tap-highlight-transparent
                      ${
                        isActive
                          ? 'bg-yellow-200/95 dark:bg-yellow-500/20 text-slate-900 dark:text-yellow-50 shadow-[0_2px_12px_-3px_rgba(234,179,8,0.4)] font-bold ring-1 ring-yellow-400/50 dark:ring-yellow-500/40 px-1.5'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100 px-0'
                      }
                    `}
                    data-oid="8m8j6d2"
                  >
                    {displayText}
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
