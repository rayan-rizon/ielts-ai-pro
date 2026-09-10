/**
 * PassagePanel - Reading Test Passage Display Component
 *
 * Extracted from ReadingTest.jsx to improve maintainability.
 * Handles passage content rendering, text formatting, and appearance controls.
 */
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { sanitizeHtml } from '@/lib/security';
const ReadingTestAppearance = React.lazy(() => import('../../ReadingTestAppearance'));

/**
 * PassagePanel Component
 *
 * @param {Object} props
 * @param {Object} props.currentPassage - Current passage data with title, content, etc.
 * @param {number} props.passageIndex - Current passage index (0-based)
 * @param {React.RefObject} props.passageRef - Ref for passage container (used for text selection)
 * @param {string} props.paperTheme - Theme: 'light', 'sepia', or 'dark'
 * @param {string} props.textSize - Text size class: 'text-[15px]', 'text-base', 'text-lg'
 * @param {Function} props.onTextSelection - Handler for text selection/click
 * @param {Function} props.onMouseMove - Handler for mouse move (hover detection)
 * @param {Function} props.onMouseLeave - Handler for mouse leave
 * @param {React.RefObject} props.hoverHighlightRef - Ref for the hovered-word highlight overlay (positioned imperatively)
 * @param {Set<number>|'all'|null} props.highlightedAnswerQs - Which answers to highlight in the passage
 * @param {Function} props.onPaperThemeChange - Callback to change paper theme
 * @param {Function} props.onTextSizeChange - Callback to change text size
 * @param {Function} props.passageBodyRef - Callback ref for the element user highlights anchor to
 */
const PassagePanel = memo(function PassagePanel({
  currentPassage,
  passageIndex,
  passageRef,
  paperTheme,
  textSize,
  onTextSelection,
  onMouseMove,
  onMouseLeave,
  hoverHighlightRef,
  highlightedAnswerQs,
  onPaperThemeChange,
  onTextSizeChange,
  passageBodyRef,
}) {
  /**
   * Render passage content with proper formatting
   * Handles: paragraphs, bold, italic, images, centered text, answer highlights
   */
  const formattedContent = React.useMemo(() => {
    const content = currentPassage.content;
    if (!content) return null;

    const processFormattedText = (text) => {
      // Add a space after a period if it's followed by a non-space character
      const spacedText = text.replace(/\.(?=\S)/g, '. ');

      return spacedText.split(/\n\s*\n/).map((paragraph, index) => {
        if (!paragraph.trim()) return null;

        const lines = paragraph.split('\n').map((line, lineIndex, allLines) => {
          // Check if this line is an image-only line
          const imageMatch = line.trim().match(/^\[image\](.*?)\[\/image\]$/);
          if (imageMatch) {
            // Sanitize URL: remove all spaces that may have been introduced during paste/import
            const imageUrl = imageMatch[1].replace(/\s+/g, '');
            return (
              <React.Fragment key={lineIndex}>
                <figure className="my-3" data-oid="u6k3bp-">
                  <img
                    src={imageUrl}
                    alt="Passage image"
                    referrerPolicy="no-referrer"
                    className="max-w-full h-auto mx-auto rounded-lg shadow-md border border-border"
                    loading="lazy"
                    onError={(e) => {
                      // Try without crossOrigin if it fails
                      if (e.target.crossOrigin) {
                        e.target.crossOrigin = null;
                        e.target.src = imageUrl;
                      }
                    }}
                    data-oid="jw2rxgg"
                  />
                </figure>
                {lineIndex < allLines.length - 1 && <br data-oid="i:jqgu0" />}
              </React.Fragment>
            );
          }

          // Handle inline images within text (less common but possible)
          let processedLine = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')
            .replace(/\[center\](.*?)\[\/center\]/g, '<div class="text-center">$1</div>')
            .replace(
              /\[title\](.*?)\[\/title\]/g,
              '<h2 class="text-lg @sm:text-xl @md:text-2xl font-bold text-center mb-4 px-12 @sm:px-14 @md:px-16 @lg:px-20">$1</h2>'
            )
            .replace(
              /\[heading\](.*?)\[\/heading\]/g,
              '<h3 class="text-base @sm:text-lg @md:text-xl font-semibold text-center mb-3 px-12 @sm:px-14 @md:px-16 @lg:px-20">$1</h3>'
            )
            .replace(/\[image\](.*?)\[\/image\]/g, (match, url) => {
              // Sanitize URL by removing all spaces
              const cleanUrl = url.replace(/\s+/g, '');
              return `</span><figure class="my-3 block"><img src="${cleanUrl}" alt="Passage image" referrerpolicy="no-referrer" class="max-w-full h-auto mx-auto rounded-lg shadow-md border border-border" loading="lazy" /></figure><span>`;
            })
            .replace(/\[answer q=([\d,\s]+)\](.*?)\[\/answer\]/g, (match, qNum, content) => {
              let shouldHighlight = false;
              if (highlightedAnswerQs === 'all') {
                shouldHighlight = true;
              } else if (highlightedAnswerQs instanceof Set) {
                // Parse the comma-separated or space-separated numbers
                const qs = qNum
                  .split(/[\s,]+/)
                  .map((n) => parseInt(n.trim()))
                  .filter((n) => !isNaN(n));
                shouldHighlight = qs.some((q) => highlightedAnswerQs.has(q));
              }

              if (!shouldHighlight) return content;

              // Base Emerald styles without dark: variants to prevent conflicts with paper themes
              const highlightClass =
                'bg-emerald-500/25 hover:bg-emerald-500/35 ring-1 ring-emerald-500/20';
              const badgeClass = 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]';

              // Theme-specific text color (Paper theme overrides system dark mode)
              let textStyle = '';
              if (paperTheme === 'sepia') {
                textStyle = 'text-emerald-950'; // Strong dark green for sepia
              } else if (paperTheme === 'dark') {
                textStyle = 'text-emerald-50'; // Light text for dark background
              } else {
                // Light mode (Respects system dark mode if light paper is chosen)
                textStyle = 'text-emerald-900 dark:text-emerald-50';
              }

              // Apply an ID so we can scroll to it if it was specifically highlighted (via explanation)
              const isSpecificHighlight = highlightedAnswerQs instanceof Set;
              const firstQ = qNum.split(/[\s,]+/)[0].trim();
              const idAttr = isSpecificHighlight ? `id="highlighted-answer-${firstQ}"` : '';

              return `<span ${idAttr} class="${highlightClass} ${textStyle} px-1 py-0.5 rounded-sm font-medium transition-all duration-200">${content.trim()}<span class="answer-marker-badge inline-flex items-center justify-center ${badgeClass} text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm select-none align-middle ml-0.5 transform -translate-y-px">Q${qNum.trim()}</span></span>`;
            })
            .trim();

          return (
            <React.Fragment key={lineIndex}>
              <span
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(processedLine),
                }}
                data-oid="pv093bi"
              />

              {lineIndex < allLines.length - 1 && <br data-oid="-bpa6dk" />}
            </React.Fragment>
          );
        });

        return (
          <div key={index} className="mb-3 leading-normal text-justify" data-oid="5olsrpz">
            {lines}
          </div>
        );
      });
    };

    return (
      // data-passage-body marks the element user highlights are anchored to.
      // Their character offsets are measured against this subtree's text, so it
      // must contain the passage prose and nothing else.
      <div
        ref={passageBodyRef}
        className="cursor-pointer max-w-none select-text"
        data-passage-body=""
        data-oid="asd14:q"
      >
        {processFormattedText(content)}
      </div>
    );
  }, [currentPassage.content, highlightedAnswerQs, paperTheme, passageBodyRef]);

  // Auto-scroll to highlight if a specific question was selected
  React.useEffect(() => {
    if (highlightedAnswerQs instanceof Set && passageRef?.current) {
      // Find the first element with an ID starting with highlighted-answer
      // Use setTimeout to ensure DOM has updated with the new HTML string
      const timer = setTimeout(() => {
        const firstHighlight = passageRef.current.querySelector('[id^="highlighted-answer-"]');
        if (firstHighlight) {
          // Scroll it into the central view area smoothly
          firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [highlightedAnswerQs, passageRef]);

  return (
    <div
      ref={passageRef}
      className={`flex-1 overflow-auto px-6 pt-1 pb-8 md:px-8 md:pt-2 md:pb-12 relative h-full transition-colors duration-300 scroll-smooth scrollbar-thin scrollbar-thumb-border/50 hover:scrollbar-thumb-border/80
        ${paperTheme === 'sepia' ? 'bg-[#f4ecd8]' : ''}
        ${paperTheme === 'dark' ? 'bg-slate-950' : ''}
        ${paperTheme === 'light' ? 'bg-white/50 dark:bg-slate-950/40' : ''}
      `}
      onClick={onTextSelection}
      data-oid="1h7mx9k"
    >
      {/* Appearance Controls - Floating Button */}
      <div
        className="sticky top-2 right-2 sm:right-3 z-30 flex justify-end pointer-events-none px-2 sm:px-3 -mb-10"
        data-oid="fw_3sk7"
      >
        <div className="pointer-events-auto" data-oid=":pvn-ot">
          <React.Suspense
            fallback={
              <div
                className="h-10 w-10 animate-pulse bg-slate-200 rounded-full"
                data-oid="wmpivug"
              />
            }
            data-oid="nii7qdj"
          >
            <ReadingTestAppearance
              textSize={textSize}
              setTextSize={onTextSizeChange}
              theme={paperTheme}
              setTheme={onPaperThemeChange}
              data-oid=".ezn44t"
            />
          </React.Suspense>
        </div>
      </div>

      <motion.div
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className={`prose max-w-none transition-colors duration-300 leading-relaxed font-serif tracking-wide cursor-text relative z-10 ${textSize}
          ${
            paperTheme === 'sepia'
              ? 'text-[#433422] prose-headings:text-[#2b2112] prose-p:text-[#433422] prose-strong:text-[#2b2112] prose-a:text-[#8c6b4a] selection:bg-[#d5c4a1] selection:text-[#2b2112]'
              : ''
          }
          ${
            paperTheme === 'dark'
              ? 'prose-invert text-slate-200 prose-headings:text-white prose-p:text-slate-200 prose-strong:text-slate-100 prose-a:text-[#a9afff] selection:bg-[#5a63df]/60 selection:text-white'
              : ''
          }
          ${
            paperTheme === 'light'
              ? 'text-slate-900 prose-headings:text-slate-900 prose-p:text-slate-800 prose-strong:text-slate-900 prose-a:text-[#5a63df] selection:bg-[#5a63df]/20 selection:text-[#3a3f9e] dark:text-slate-100 dark:prose-headings:text-white dark:prose-p:text-slate-300 dark:prose-strong:text-white dark:prose-a:text-[#a9afff] dark:selection:bg-[#5a63df]/50 dark:selection:text-white'
              : ''
          }
        `}
        data-oid="94t0x:w"
      >
        {/* Smart Hover Highlight - always mounted, moved imperatively by the parent so
            mouse movement never re-renders the passage (which caused a full-panel flash) */}
        <div
          ref={hoverHighlightRef}
          aria-hidden="true"
          className="absolute top-0 left-0 opacity-0 pointer-events-none rounded-lg bg-[#5a63df]/10 border border-[#5a63df]/25 dark:border-[#5a63df]/30"
          style={{ width: 0, height: 0, zIndex: -1 }}
          data-oid="c1385h6"
        />

        <h1
          className="text-lg @sm:text-xl @md:text-2xl @lg:text-3xl leading-snug text-center font-bold mb-3 @md:mb-4 pt-2 @md:pt-3 px-12 @sm:px-14 @md:px-16 @lg:px-20 @xl:px-24 text-foreground"
          data-oid="q._2bvq"
        >
          {currentPassage.passage_name || currentPassage.title || `Passage ${passageIndex + 1}`}
        </h1>
        {formattedContent}
      </motion.div>
    </div>
  );
});

export default PassagePanel;
