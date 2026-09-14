import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatTestTitle } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import {
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PANEL_LINK,
  PanelTitle,
  Pill,
  ROW_CHEVRON,
  ROW_HOVER,
  WELL,
} from './primitives';

function volumeNumber(test, index) {
  return (
    test.cambridge_book_number ||
    (test.cambridge_year ? test.cambridge_year - 2005 : null) ||
    test.title?.match(/\d+/)?.[0] ||
    index + 1
  );
}

const CambridgeTestsCard = React.memo(({ cambridgeTests = [] }) => {
  const [expanded, setExpanded] = useState(true);
  const count = cambridgeTests?.length || 0;

  return (
    <div className={cn(PANEL, 'flex h-full flex-col p-4')}>
      <PanelTitle
        label="Official Cambridge tests"
        tip="Authentic Cambridge IELTS past papers."
        action={
          <div className="flex items-center gap-3">
            <Link
              to={createPageUrl('Reading')}
              className={cn(MICRO, PANEL_LINK, 'hidden sm:inline-flex')}
            >
              All tests <ChevronRight className="h-3 w-3" />
            </Link>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-controls="cambridge-tests-content"
              className={cn(MICRO, PANEL_LINK, 'gap-1 min-h-6 py-1 px-1.5 -my-1 -mx-1.5')}
            >
              {expanded ? (
                'Collapse'
              ) : (
                <>
                  Expand · <span className={NUM}>{count}</span>
                </>
              )}
              <ChevronDown
                className={cn(
                  'h-3 w-3 transition-transform duration-200 ease-smooth-out',
                  expanded && 'rotate-180'
                )}
              />
            </button>
          </div>
        }
      />

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="tests"
            id="cambridge-tests-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden -mx-1.5 px-1.5 -mt-1 pt-2 pb-1.5"
          >
            {count === 0 ? (
              <Empty>The official Cambridge library is being updated. Check back shortly.</Empty>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {cambridgeTests.map((test, index) => (
                  <Link
                    key={test.id}
                    to={`/reading-test?test-id=${test.id}`}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg border border-slate-200/60 bg-white/40 p-2.5 transition-all duration-200 ease-smooth-out hover:border-[#5a63df]/35 hover:bg-[#f7f6fd] hover:-translate-y-0.5 hover:shadow-xs active:scale-[0.99] active:translate-y-0 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-[#8f97ff]/30 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#08080a]'
                    )}
                  >
                    <div
                      className={cn(
                        WELL,
                        'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-[#e4e2f0] transition-colors duration-200 ease-smooth-out group-hover:border-[#5a63df]/30 group-hover:bg-[#5a63df]/[0.06] dark:border-white/10 dark:group-hover:border-[#8f97ff]/30 dark:group-hover:bg-[#8f97ff]/[0.12]'
                      )}
                    >
                      <span
                        className={cn(
                          MICRO,
                          'text-[9px] font-extrabold uppercase tracking-wider leading-none text-[#5a63df]'
                        )}
                      >
                        VOL
                      </span>
                      <span
                        className={cn(
                          NUM,
                          'mt-0.5 text-base font-bold leading-none text-slate-900 dark:text-slate-50'
                        )}
                      >
                        {volumeNumber(test, index)}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <div className="flex items-center gap-1.5">
                        <Pill tone="accent">Official</Pill>
                        <span className={cn(MICRO, MUTED, 'flex items-center gap-1')}>
                          <Clock className="h-2.5 w-2.5 shrink-0" />
                          <span className={NUM}>60</span>m
                        </span>
                      </div>
                      <h4
                        className="mt-1 truncate text-[12px] font-extrabold leading-tight text-slate-800 transition-colors duration-200 ease-smooth-out group-hover:text-[#5a63df] dark:text-slate-100 dark:group-hover:text-[#afb5ff]"
                        title={formatTestTitle(test)}
                      >
                        {formatTestTitle(test)}
                      </h4>
                    </div>

                    <ChevronRight className={cn('h-3.5 w-3.5 shrink-0', ROW_CHEVRON)} />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

CambridgeTestsCard.displayName = 'CambridgeTestsCard';

export default CambridgeTestsCard;
