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
              className={cn(MICRO, PANEL_LINK, 'gap-1')}
            >
              {expanded ? 'Collapse' : `Expand · ${count}`}
              <ChevronDown
                className={cn(
                  'h-3 w-3 transition-transform duration-200',
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
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
                      'group flex items-center gap-3 rounded-lg border border-transparent p-2.5 transition-all duration-150',
                      ROW_HOVER
                    )}
                  >
                    <div
                      className={cn(
                        WELL,
                        'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md'
                      )}
                    >
                      <span className={cn(MICRO, 'text-[8px] leading-none text-[#5a63df]')}>
                        Vol
                      </span>
                      <span
                        className={cn(
                          NUM,
                          'text-base font-bold leading-none text-slate-900 dark:text-slate-50'
                        )}
                      >
                        {volumeNumber(test, index)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Pill tone="accent">Official</Pill>
                        <span className={cn(MICRO, MUTED, 'flex items-center gap-1')}>
                          <Clock className="h-2.5 w-2.5" />
                          60m
                        </span>
                      </div>
                      <h4 className="mt-1 truncate text-[12px] font-extrabold leading-tight text-slate-800 dark:text-slate-100">
                        {formatTestTitle(test)}
                      </h4>
                    </div>

                    <ChevronRight className={cn('h-3.5 w-3.5', ROW_CHEVRON)} />
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
