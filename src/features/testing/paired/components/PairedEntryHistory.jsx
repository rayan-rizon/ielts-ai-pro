import React from 'react';
import { Link } from 'react-router-dom';
import {
  MICRO,
  MUTED,
  PANEL,
  Pill,
  ROW_CHEVRON,
  ROW_HOVER,
  TILE,
} from '@/features/dashboard/components/primitives.jsx';
import { ReiconChevronRight } from '@/components/ui/reicon';
import { cn } from '@/lib/cn';

const STATE_COPY = {
  lobby: { label: 'Lobby open', tone: 'accent' },
  running: { label: 'In progress', tone: 'warn' },
  grading: { label: 'Locking scores', tone: 'warn' },
  complete: { label: 'Results ready', tone: 'ok' },
};

function testLabel(type) {
  return type === 'listening' ? 'Listening' : 'Reading';
}

export default function PairedEntryHistory({ history, type, passageId }) {
  if (!history || history.length === 0) return null;

  return (
    <section
      className={cn(PANEL, 'mt-4 overflow-hidden border-[#e4e2f0] dark:border-white/[0.08]')}
    >
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className={cn(MICRO, MUTED)}>Recent paired sessions</p>
          <Pill tone="neutral" className="px-1.5 py-0 text-[8px]">
            {history.length} {history.length === 1 ? 'room' : 'rooms'}
          </Pill>
        </div>
        <ul className="space-y-1.5">
          {history.map((room) => {
            const stateInfo = STATE_COPY[room.state] || { label: room.state, tone: 'neutral' };
            return (
              <li key={room.id}>
                <Link
                  to={`/${type}-test/${passageId}?room=${room.id}`}
                  className={cn(
                    TILE,
                    ROW_HOVER,
                    'group flex items-center justify-between gap-3 p-3 text-xs rounded-lg'
                  )}
                >
                  <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                    {room.title || `${testLabel(type)} Practice`}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Pill tone={stateInfo.tone}>{stateInfo.label}</Pill>
                    <ReiconChevronRight className={cn(ROW_CHEVRON, 'h-3.5 w-3.5')} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
